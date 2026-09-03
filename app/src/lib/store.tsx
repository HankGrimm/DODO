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
  partnerCandidateId?: string; // 用于拉黑；早期组队记录里可能没有
  createdAt: number;
};

// 邀请：撮合出候选人之后、押金上链之前的一层。双方都同意（pending → accepted）才允许缴押金组队，
// 避免"AI 推荐了某人就直接把两个人的钱锁进合约"。链上不记录邀请，只记录最终成立的组队。
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'active';

export type Invite = {
  id: string;
  candidateId: string;
  nickname: string;
  reason: string; // 撮合依据，接受/拒绝时对方也该看到
  scene: number;
  place: string;
  meetAtSec: number;
  depositEth: string;
  status: InviteStatus;
  createdAt: number;
  teamId?: string; // accepted → active 之后指向链上组队
};

// 约定时间已过还没被接受的邀请自动作废，不占位也不能再缴押金
export function inviteExpired(i: Invite) {
  return i.status === 'pending' && Date.now() / 1000 > i.meetAtSec;
}

// 黑名单（PRD R3）。拉黑是本地决定，不上链——把"我不想再遇到这个人"写进链上公开记录，
// 等于给对方挂一个谁都能看见的负面标签，越过了 PRD 第 8 节"不做公开评价展示"的边界。
export type Blocked = {
  candidateId: string;
  nickname: string;
  reason: string;
  at: number;
};

// 邀请是否还需要用户处理。拉黑后相关邀请一并失效，撮合、首页、邀请页共用这一个判断，
// 免得某个入口漏检查（这是从 sol-mate 的 interaction_policy 那里学的：策略只写一处）
export function inviteLive(i: Invite, blockedIds: string[]) {
  if (blockedIds.includes(i.candidateId)) return false;
  return (i.status === 'pending' && !inviteExpired(i)) || i.status === 'accepted';
}

const PROFILE_KEY = 'dazi.profile';
const TEAMS_KEY = 'dazi.teams';
const INVITES_KEY = 'dazi.invites';
const BLOCKED_KEY = 'dazi.blocked';

type Store = {
  ready: boolean;
  profile: Profile | null;
  saveProfile: (p: Profile) => Promise<void>;
  teams: TeamMeta[];
  addTeam: (t: TeamMeta) => Promise<void>;
  invites: Invite[];
  addInvite: (i: Invite) => Promise<void>;
  setInviteStatus: (id: string, status: InviteStatus, teamId?: string) => Promise<void>;
  blocked: Blocked[];
  blockedIds: string[];
  blockPartner: (b: Blocked) => Promise<void>;
  unblockPartner: (candidateId: string) => Promise<void>;
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
  const [invites, setInvites] = useState<Invite[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
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
      setInvites((await readJson<Invite[]>(INVITES_KEY)) ?? []);
      setBlocked((await readJson<Blocked[]>(BLOCKED_KEY)) ?? []);
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

  const addInvite = useCallback(async (i: Invite) => {
    setInvites((prev) => {
      const next = [i, ...prev.filter((x) => x.id !== i.id)];
      writeJson(INVITES_KEY, next);
      return next;
    });
  }, []);

  const setInviteStatus = useCallback(async (id: string, status: InviteStatus, teamId?: string) => {
    setInvites((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, status, teamId: teamId ?? x.teamId } : x));
      writeJson(INVITES_KEY, next);
      return next;
    });
  }, []);

  const blockPartner = useCallback(async (b: Blocked) => {
    setBlocked((prev) => {
      const next = [b, ...prev.filter((x) => x.candidateId !== b.candidateId)];
      writeJson(BLOCKED_KEY, next);
      return next;
    });
  }, []);

  const unblockPartner = useCallback(async (candidateId: string) => {
    setBlocked((prev) => {
      const next = prev.filter((x) => x.candidateId !== candidateId);
      writeJson(BLOCKED_KEY, next);
      return next;
    });
  }, []);

  const blockedIds = useMemo(() => blocked.map((b) => b.candidateId), [blocked]);

  const value = useMemo(
    () => ({
      ready,
      profile,
      saveProfile,
      teams,
      addTeam,
      invites,
      addInvite,
      setInviteStatus,
      blocked,
      blockedIds,
      blockPartner,
      unblockPartner,
      address,
      partnerAddress,
      balance,
      records,
      refresh,
    }),
    [
      ready,
      profile,
      saveProfile,
      teams,
      addTeam,
      invites,
      addInvite,
      setInviteStatus,
      blocked,
      blockedIds,
      blockPartner,
      unblockPartner,
      address,
      partnerAddress,
      balance,
      records,
      refresh,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}
