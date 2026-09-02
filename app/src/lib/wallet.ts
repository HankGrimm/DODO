// 内置钱包：首次进入自动生成密钥并保管，用户不需要理解私钥/助记词/Gas。
// 说明：这是"应用内托管密钥"方案，不是 ERC-4337 账户抽象。PRD R4 想要的"无感知钱包体验"
// 在 Demo 阶段用它满足；真要做 Gas 代付/社交登录恢复，需要额外接 Bundler 与 Paymaster。
import 'react-native-get-random-values'; // 原生端补 crypto.getRandomValues，viem 生成私钥要用
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createWalletClient, http, type WalletClient } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { monadTestnet } from './chain';

export type Role = 'me' | 'partner';

const STORE_KEY: Record<Role, string> = {
  me: 'dazi_wallet_me',
  partner: 'dazi_wallet_demo_partner',
};

async function getStored(key: string) {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setStored(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

const cache = new Map<Role, WalletClient>();

/// 取回（或首次创建）钱包。partner 是 Demo 用的模拟搭子账户，真实产品里对方是另一台设备。
export async function getWallet(role: Role): Promise<WalletClient> {
  const cached = cache.get(role);
  if (cached) return cached;

  let key = await getStored(STORE_KEY[role]);
  if (!key) {
    key = generatePrivateKey();
    await setStored(STORE_KEY[role], key);
  }
  const client = createWalletClient({
    account: privateKeyToAccount(key as `0x${string}`),
    chain: monadTestnet,
    transport: http(),
  });
  cache.set(role, client);
  return client;
}

export async function getAddress(role: Role) {
  const wallet = await getWallet(role);
  return wallet.account!.address;
}
