// AI 撮合。硬性约束（实名、场景、性别偏好、距离）先做过滤，剩下的交给大模型排序并给出理由。
// 合规约束（PRD 第 3 节）：AI 只能是"撮合真实见面的工具"，不做拟人化陪伴，不得暗示人身安全担保。
import type { Candidate } from './candidates';
import { SCENES } from './chain';

export type MatchQuery = {
  scene: number;
  place: string;
  meetAt: string;
  note: string;
  genderPref: 'any' | 'same';
  myGender: 'male' | 'female';
};

export type Ranked = { candidate: Candidate; reason: string };

const BASE_URL = process.env.EXPO_PUBLIC_LLM_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY ?? '';
const MODEL = process.env.EXPO_PUBLIC_LLM_MODEL ?? 'gpt-4o-mini';

const SYSTEM_PROMPT = [
  '你是一个线下"搭子"撮合工具的排序模块，只负责把候选人按适配度排序并说明依据。',
  '严格约束：',
  '1. 你是工具，不是陪伴角色。不要使用拟人化、情感化、角色扮演的口吻。',
  '2. 只能依据给到的字段（履约次数、失约次数、距离、时间窗、场景、实名状态、标签）说明理由。',
  '3. 禁止承诺或暗示某个候选人"安全""可靠""不会骚扰"。履约记录只能说明过去是否按时到场。',
  '4. 每条理由不超过 40 个汉字，直接给事实依据。',
  '只输出 JSON：{"picks":[{"id":"候选人id","reason":"理由"}]}，最多 3 条，按推荐顺序排列。',
].join('\n');

/// 硬性约束过滤：已拉黑一律不出现（PRD R3），未实名一律不可参与匹配（PRD R2），
/// 性别偏好不做降级推荐（PRD R8）
export function applyHardFilters(query: MatchQuery, pool: Candidate[], blockedIds: string[] = []) {
  return pool.filter((c) => {
    if (blockedIds.includes(c.id)) return false;
    if (!c.verified) return false;
    if (!c.scenes.includes(query.scene)) return false;
    if (query.genderPref === 'same' && c.gender !== query.myGender) return false;
    return c.distanceKm <= 10;
  });
}

function fallbackRank(pool: Candidate[]): Ranked[] {
  const score = (c: Candidate) => {
    const total = c.kept + c.missed;
    const keptRate = total === 0 ? 0 : c.kept / total;
    return keptRate * 70 + Math.min(20, total * 2) - c.distanceKm * 2;
  };
  return [...pool]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map((c) => ({
      candidate: c,
      reason: `守约 ${c.kept} 次 / 失约 ${c.missed} 次，距离 ${c.distanceKm} 公里，时间窗 ${c.timeWindow}`,
    }));
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as { picks?: { id: string; reason: string }[] };
  } catch {
    return null;
  }
}

export type MatchResult = { ranked: Ranked[]; usedLLM: boolean; note?: string };

export async function matchCandidates(
  query: MatchQuery,
  pool: Candidate[],
  blockedIds: string[] = [],
): Promise<MatchResult> {
  const eligible = applyHardFilters(query, pool, blockedIds);
  if (eligible.length === 0) return { ranked: [], usedLLM: false, note: '当前没有符合硬性条件的候选人' };
  if (!BASE_URL || !API_KEY) {
    return { ranked: fallbackRank(eligible), usedLLM: false, note: '未配置大模型，已使用规则排序兜底' };
  }

  const payload = {
    需求: {
      场景: SCENES[query.scene],
      地点: query.place,
      时间: query.meetAt,
      备注: query.note,
      性别偏好: query.genderPref === 'same' ? '仅同性别' : '不限',
    },
    候选人: eligible.map((c) => ({
      id: c.id,
      昵称: c.nickname,
      守约次数: c.kept,
      失约次数: c.missed,
      距离公里: c.distanceKm,
      时间窗: c.timeWindow,
      已实名: c.verified,
      标签: c.tags,
    })),
  };

  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload, null, 2) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    const parsed = extractJson(data.choices?.[0]?.message?.content ?? '');
    const ranked = (parsed?.picks ?? [])
      .map((p) => {
        const candidate = eligible.find((c) => c.id === p.id);
        return candidate ? { candidate, reason: p.reason } : null;
      })
      .filter((r): r is Ranked => r !== null);
    if (ranked.length === 0) throw new Error('模型返回无法解析');
    return { ranked, usedLLM: true };
  } catch (e) {
    return {
      ranked: fallbackRank(eligible),
      usedLLM: false,
      note: `大模型调用失败，已用规则排序兜底：${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

