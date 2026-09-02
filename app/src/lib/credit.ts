// 信用分三段式（PRD R7）：活跃度 + 履约记录 + 可选第三方征信。
// 履约记录一段直接来自链上 SBT，不可自行删改；征信一段未接入，明确不计分而不是给默认分。
export const MIN_RECORDS_FOR_SCORE = 5;

export type CreditInput = { kept: number; missed: number };

export type CreditBreakdown = {
  total: number;
  activity: number; // 0-20
  attendance: number; // 0-70
  bureau: number | null; // 0-10，null = 未接入
  enough: boolean;
  records: number;
  keptRate: number;
};

export function creditScore({ kept, missed }: CreditInput): CreditBreakdown {
  const records = kept + missed;
  const keptRate = records === 0 ? 0 : kept / records;
  const activity = Math.min(20, records * 2);
  const attendance = Math.round(keptRate * 70);
  return {
    total: activity + attendance,
    activity,
    attendance,
    bureau: null,
    enough: records >= MIN_RECORDS_FOR_SCORE,
    records,
    keptRate,
  };
}

/// 候选人卡片上展示的分数。低于门槛时只展示原始履约次数，避免用少量样本给出虚假可信度。
export function displayScore(input: CreditInput) {
  const breakdown = creditScore(input);
  return breakdown.enough ? `${breakdown.total}` : '数据不足';
}
