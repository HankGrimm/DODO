// 部署到 Monad 测试网：DaziSBT -> DaziEscrow -> sbt.setMinter(escrow)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { artifact, deployerWallet, publicClient, root } from './chain.mjs';

const wallet = deployerWallet();
const from = wallet.account.address;
const balance = await publicClient.getBalance({ address: from });
console.log(`deployer ${from} balance ${balance} wei`);
if (balance === 0n) throw new Error('部署账户没有测试网 MON，请先去 https://faucet.monad.xyz 领取');

async function deploy(name, args = []) {
  const { abi, bytecode } = artifact(name);
  const hash = await wallet.deployContract({ abi, bytecode, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`${name} 部署失败 ${hash}`);
  console.log(`${name} -> ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

const sbt = await deploy('DaziSBT');
const escrow = await deploy('DaziEscrow', [sbt]);

const setMinter = await wallet.writeContract({
  address: sbt,
  abi: artifact('DaziSBT').abi,
  functionName: 'setMinter',
  args: [escrow],
});
await publicClient.waitForTransactionReceipt({ hash: setMinter });
console.log('setMinter ok');

writeFileSync(
  join(root, 'out', 'addresses.json'),
  JSON.stringify({ chainId: 10143, sbt, escrow, arbiter: from }, null, 2),
);

console.log('\n把下面两行写进 app/.env：');
console.log(`EXPO_PUBLIC_ESCROW_ADDRESS=${escrow}`);
console.log(`EXPO_PUBLIC_SBT_ADDRESS=${sbt}`);
