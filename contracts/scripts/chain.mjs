// Monad 测试网连接与账户工具（scripts 共用）
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
});

export function artifact(name) {
  return JSON.parse(readFileSync(join(root, 'out', `${name}.json`), 'utf8'));
}

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

export function walletFor(privateKey) {
  const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  return createWalletClient({ account: privateKeyToAccount(key), chain: monadTestnet, transport: http() });
}

export function deployerWallet() {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) throw new Error('缺少 DEPLOYER_PRIVATE_KEY，请先复制 .env.example 为 .env');
  return walletFor(key);
}
