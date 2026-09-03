// 押金托管合约交互。所有写操作都等回执，UI 拿到的状态就是链上状态。
import { formatEther, keccak256, parseEther, parseEventLogs, stringToHex, type Address } from 'viem';

import { daziescrowAbi, dazisbtAbi } from './abi';
import { ESCROW_ADDRESS, SBT_ADDRESS, publicClient } from './chain';
import { getWallet, type Role } from './wallet';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/// 履约码：见面时出示给对方扫，链上只存哈希
export function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export const hashCode = (code: string) => keccak256(stringToHex(code));

export type OnChainTeam = {
  host: Address;
  guest: Address;
  scene: number;
  status: number;
  hostCheckedIn: boolean;
  guestCheckedIn: boolean;
  deposit: bigint;
  meetAt: bigint;
  checkinDeadline: bigint;
};

async function write(role: Role, params: Record<string, unknown>) {
  const wallet = await getWallet(role);
  const hash = await wallet.writeContract({
    address: ESCROW_ADDRESS,
    abi: daziescrowAbi,
    account: wallet.account!,
    chain: wallet.chain,
    ...params,
  } as never);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`交易失败：${hash}`);
  return receipt;
}

export async function balanceOf(address: Address) {
  return publicClient.getBalance({ address });
}

export const formatMon = (wei: bigint) => `${Number(formatEther(wei)).toFixed(4)} MON`;

/// Demo 里模拟搭子也要付押金和 Gas，先从本人账户转一点过去（真实产品中对方自己有余额）
export async function fundPartnerIfNeeded(depositWei: bigint) {
  const me = await getWallet('me');
  const partner = await getWallet('partner');
  const need = depositWei + parseEther('0.02');
  const have = await balanceOf(partner.account!.address);
  if (have >= need) return null;
  const hash = await me.sendTransaction({
    account: me.account!,
    chain: me.chain,
    to: partner.account!.address,
    value: need - have,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function createTeam(opts: {
  scene: number;
  meetAt: number; // 秒级时间戳
  checkinDeadline: number;
  code: string;
  depositEth: string;
}) {
  const receipt = await write('me', {
    functionName: 'createTeam',
    args: [opts.scene, BigInt(opts.meetAt), BigInt(opts.checkinDeadline), hashCode(opts.code)],
    value: parseEther(opts.depositEth),
  });
  // 从事件里取 teamId，不要读 teamCount——并发创建时会拿到别人的编号
  const [event] = parseEventLogs({ abi: daziescrowAbi, eventName: 'TeamCreated', logs: receipt.logs });
  if (!event) throw new Error('没有拿到 TeamCreated 事件');
  return { hash: receipt.transactionHash, teamId: event.args.teamId };
}

export async function partnerJoin(teamId: bigint, code: string, depositWei: bigint) {
  return write('partner', {
    functionName: 'joinTeam',
    args: [teamId, hashCode(code)],
    value: depositWei,
  });
}

/// 双向打卡：提交对方出示的履约码
export async function checkIn(role: Role, teamId: bigint, counterpartCode: string) {
  return write(role, { functionName: 'checkIn', args: [teamId, counterpartCode.trim().toUpperCase()] });
}

export async function raiseDispute(teamId: bigint, reason: string) {
  return write('me', { functionName: 'raiseDispute', args: [teamId, reason] });
}

/// 罚没条款与安全基金余额，都从合约读，不在前端硬编码比例
export async function readSlashTerms() {
  const read = (functionName: 'SLASH_BPS' | 'COMPENSATION_BPS' | 'safetyFund') =>
    publicClient.readContract({ address: ESCROW_ADDRESS, abi: daziescrowAbi, functionName });
  const [slashBps, compensationBps, safetyFund] = await Promise.all([
    read('SLASH_BPS') as Promise<number>,
    read('COMPENSATION_BPS') as Promise<number>,
    read('safetyFund') as Promise<bigint>,
  ]);
  return { slashBps, compensationBps, safetyFund };
}

export async function readTeam(teamId: bigint): Promise<OnChainTeam> {
  const t = (await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: daziescrowAbi,
    functionName: 'teams',
    args: [teamId],
  })) as readonly [Address, Address, number, number, boolean, boolean, bigint, bigint, bigint, string, string];
  return {
    host: t[0],
    guest: t[1],
    scene: t[2],
    status: t[3],
    hostCheckedIn: t[4],
    guestCheckedIn: t[5],
    deposit: t[6],
    meetAt: t[7],
    checkinDeadline: t[8],
  };
}

export type SbtRecord = { tokenId: bigint; teamId: bigint; scene: number; kept: boolean; mintedAt: bigint };

/// 读链上履约凭证，信用分的"履约记录"一段完全由此计算
export async function readRecords(address: Address): Promise<SbtRecord[]> {
  const [ids, items] = (await publicClient.readContract({
    address: SBT_ADDRESS,
    abi: dazisbtAbi,
    functionName: 'recordsOf',
    args: [address],
  })) as [readonly bigint[], readonly { teamId: bigint; scene: number; kept: boolean; mintedAt: bigint }[]];
  return ids.map((tokenId, i) => ({ tokenId, ...items[i] }));
}

