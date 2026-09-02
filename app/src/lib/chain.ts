// Monad 测试网连接。合约地址由 contracts/npm run deploy 打印后写进 app/.env
import { createPublicClient, defineChain, http } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.EXPO_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
});

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

export const ESCROW_ADDRESS = (process.env.EXPO_PUBLIC_ESCROW_ADDRESS ?? '') as `0x${string}`;
export const SBT_ADDRESS = (process.env.EXPO_PUBLIC_SBT_ADDRESS ?? '') as `0x${string}`;
export const contractsReady = ESCROW_ADDRESS.length === 42 && SBT_ADDRESS.length === 42;

// 返回类型写成 `${string}:${string}` 是为了满足 expo-router typedRoutes 的外链类型
export const txUrl = (hash: string): `${string}:${string}` =>
  `https://testnet.monadexplorer.com/tx/${hash}`;
export const addressUrl = (address: string): `${string}:${string}` =>
  `https://testnet.monadexplorer.com/address/${address}`;
export const shortAddress = (address?: string) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—';

export const SCENES = ['逛超市', '同城出行'] as const;

export const TEAM_STATUS = [
  '未创建',
  '等待搭子加入',
  '押金已托管',
  '履约完成',
  '待仲裁',
  '仲裁已裁决',
  '双方未到场',
] as const;
