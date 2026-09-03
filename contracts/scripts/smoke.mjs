// 链上冒烟测试：用两个真实账户跑完 创建->加入->双向打卡->退押金->铸 SBT
// 需要先 npm run deploy（会生成 out/addresses.json）
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { keccak256, parseEther, stringToHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { artifact, deployerWallet, publicClient, root, walletFor } from './chain.mjs';

const { escrow, sbt } = JSON.parse(readFileSync(join(root, 'out', 'addresses.json'), 'utf8'));
const escrowAbi = artifact('DaziEscrow').abi;
const sbtAbi = artifact('DaziSBT').abi;

const deposit = parseEther('0.001');
const host = deployerWallet();
const guestKey = generatePrivateKey();
const guest = walletFor(guestKey);
console.log(`host  ${host.account.address}`);
console.log(`guest ${guest.account.address} (临时账户)`);

async function send(wallet, params) {
  const hash = await wallet.writeContract(params);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`tx 失败 ${hash}`);
  return receipt;
}

// 给临时 guest 账户打钱：押金 + gas
const fundHash = await host.sendTransaction({
  to: guest.account.address,
  value: deposit + parseEther('0.01'),
});
await publicClient.waitForTransactionReceipt({ hash: fundHash });
console.log('funded guest');

const hostCode = 'HOST01';
const guestCode = 'GUEST1';
const now = BigInt(Math.floor(Date.now() / 1000));

await send(host, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'createTeam',
  args: [0, now + 60n, now + 3600n, keccak256(stringToHex(hostCode))],
  value: deposit,
});
const teamId = await publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: 'teamCount' });
console.log(`teamId ${teamId}`);

await send(guest, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'joinTeam',
  args: [teamId, keccak256(stringToHex(guestCode))],
  value: deposit,
});
console.log('guest joined');

// 双向打卡：各自提交对方的履约码
await send(host, { address: escrow, abi: escrowAbi, functionName: 'checkIn', args: [teamId, guestCode] });
await send(guest, { address: escrow, abi: escrowAbi, functionName: 'checkIn', args: [teamId, hostCode] });

const team = await publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: 'teams', args: [teamId] });
const status = team[3];
const hostRecords = await publicClient.readContract({ address: sbt, abi: sbtAbi, functionName: 'recordsOf', args: [host.account.address] });
console.log(`status=${status} (3 = Completed)`);
console.log(`host SBT 数量=${hostRecords[0].length}`);

// 不可转让校验
let soulbound = false;
try {
  await publicClient.simulateContract({
    address: sbt,
    abi: sbtAbi,
    functionName: 'transferFrom',
    args: [host.account.address, guest.account.address, hostRecords[0][0]],
    account: privateKeyToAccount(guestKey),
  });
} catch {
  soulbound = true;
}

if (status !== 3 || hostRecords[0].length === 0 || !soulbound) {
  throw new Error('冒烟测试未通过');
}
console.log('闭环通过：押金已退回、SBT 已铸造且不可转让');

// ---- 场景二：单方打卡 -> 举报 -> 仲裁罚没。验证罚没不是全额赔付给对方 ----
const read = (functionName, args = []) =>
  publicClient.readContract({ address: escrow, abi: escrowAbi, functionName, args });

const [slashBps, compBps, fundBefore] = await Promise.all([
  read('SLASH_BPS'),
  read('COMPENSATION_BPS'),
  read('safetyFund'),
]);

const hostCode2 = 'HOST02';
const guestCode2 = 'GUEST2';
const now2 = BigInt(Math.floor(Date.now() / 1000));
await send(host, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'createTeam',
  args: [0, now2 + 60n, now2 + 3600n, keccak256(stringToHex(hostCode2))],
  value: deposit,
});
const teamId2 = await read('teamCount');
await send(guest, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'joinTeam',
  args: [teamId2, keccak256(stringToHex(guestCode2))],
  value: deposit,
});
// 只有 guest 到场打卡，host 没来；guest 举报
await send(guest, { address: escrow, abi: escrowAbi, functionName: 'checkIn', args: [teamId2, hostCode2] });
await send(guest, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'raiseDispute',
  args: [teamId2, '对方未按约定到场'],
});
// 仲裁人（部署者）裁定 host 失约、guest 守约
await send(host, {
  address: escrow,
  abi: escrowAbi,
  functionName: 'resolveDispute',
  args: [teamId2, false, true],
});

const slashed = (deposit * slashBps) / 10000n;
const toKeeper = (slashed * compBps) / 10000n;
const expectedFundDelta = slashed - toKeeper;
const fundAfter = await read('safetyFund');
const team2 = await read('teams', [teamId2]);

console.log(`\n罚没比例 ${Number(slashBps) / 100}%，其中赔付守约方 ${Number(compBps) / 100}%`);
console.log(`守约方净收益 ${toKeeper} wei（押金 ${deposit} wei 的 ${(Number(toKeeper) * 100) / Number(deposit)}%）`);
console.log(`安全基金 ${fundBefore} -> ${fundAfter} wei（预期 +${expectedFundDelta}）`);
console.log(`team2 status=${team2[3]} (5 = Resolved)`);

if (fundAfter - fundBefore !== expectedFundDelta || team2[3] !== 5) {
  throw new Error('罚没结算不符合预期');
}
if (toKeeper >= deposit) {
  throw new Error('守约方净收益不应达到一整份押金，否则恶意举报有套利空间');
}

console.log('\n冒烟测试通过：闭环退款 + SBT 不可转让 + 罚没分账进安全基金');
