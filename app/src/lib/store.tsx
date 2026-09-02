// 全局状态：本人档案（含实名状态）、本地组队元数据、钱包地址与链上履约记录。
// 履约记录以链上为准，本地只存链上放不下也不该上链的东西（履约码原文、场景文案）。
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Address } from 'viem';

import { contractsReady } from './chain';
import { balanceOf, readRecords, type SbtRecord } from './escrow';
import { readJson, writeJson } from './storage';
import { getAddress } from './wallet';

export type Profile = {
  nickname: string;
  gender: 'male' | 'female';
  verified: boolean;
  idTail: string;
};

export type TeamMeta = {
  teamId: string;
  scene: number;
  place: string;
  meetAt: string;
  depositEth: string;
  myCode: string;
  partnerCode: string;
  partnerNickname: string;
  createdAt: number;
};

const PROFILE_KEY = 'dazi.profile';
const TEAMS_KEY = 'dazi.teams';

type Store = {
  ready: boolean;
  profile: Profile | null;
  saveProfile: (p: Profile) => Promise<void>;
  teams: TeamMeta[];
  addTeam: (t: TeamMeta) => Promise<void>;
  address?: Address;
  partnerAddress?: Address;
  balance: bigint;
  records: SbtRecord[];
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<TeamMeta[]>([]);
  const [address, setAddress] = useState<Address>();
  const [partnerAddress, setPartnerAddress] = useState<Address>();
  const [balance, setBalance] = useState(0n);
  const [records, setRecords] = useState<SbtRecord[]>([]);

  const refresh = useCallback(async () => {
    const me = await getAddress('me');
    setAddress(me);
    setPartnerAddress(await getAddress('partner'));
    // RPC 或合约任一不可用时不要卡住整个界面，页面上会提示配置问题
    try {
      setBalance(await balanceOf(me));
    } catch {
      setBalance(0n);
    }
    if (contractsReady) {
      try {
        setRecords(await readRecords(me));
      } catch {
        setRecords([]);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      setProfile(await readJson<Profile>(PROFILE_KEY));
      setTeams((await readJson<TeamMeta[]>(TEAMS_KEY)) ?? []);
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const saveProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    await writeJson(PROFILE_KEY, p);
  }, []);

  const addTeam = useCallback(async (t: TeamMeta) => {
    setTeams((prev) => {
      const next = [t, ...prev.filter((x) => x.teamId !== t.teamId)];
      writeJson(TEAMS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ready, profile, saveProfile, teams, addTeam, address, partnerAddress, balance, records, refresh }),
    [ready, profile, saveProfile, teams, addTeam, address, partnerAddress, balance, records, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}
