import { ThemedText } from '@/components/themed-text';
import { Button, Card, Notice, Row, Screen } from '@/components/ui-kit';
import { SBT_ADDRESS, SCENES, addressUrl } from '@/lib/chain';
import { ExternalLink } from '@/components/external-link';
import { MIN_RECORDS_FOR_SCORE, creditScore } from '@/lib/credit';
import { useStore } from '@/lib/store';

export default function CreditScreen() {
  const { records, blocked, unblockPartner } = useStore();
  const kept = records.filter((r) => r.kept).length;
  const c = creditScore({ kept, missed: records.length - kept });

  return (
    <Screen>
      <Card title="信用分">
        {c.enough ? (
          <ThemedText type="subtitle">{c.total}</ThemedText>
        ) : (
          <ThemedText type="small">
            还需 {MIN_RECORDS_FOR_SCORE - c.records} 次履约才会给出信用分，样本太少的分数没有意义。
          </ThemedText>
        )}
        <Row label="活跃度（满分 20）" value={String(c.activity)} />
        <Row label="履约记录（满分 70）" value={String(c.attendance)} />
        <Row label="第三方征信（满分 10）" value="未接入，不计分" />
        <Row label="守约率" value={c.records === 0 ? '—' : `${Math.round(c.keptRate * 100)}%`} />
      </Card>

      <Card title={`履约凭证（${records.length} 枚）`}>
        {records.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            还没有凭证。完成一次双向打卡后，链上会给你铸造一枚不可转让的记录。
          </ThemedText>
        ) : (
          records.map((r) => (
            <Row
              key={r.tokenId.toString()}
              label={`#${r.tokenId} ${SCENES[r.scene] ?? '未知场景'} · ${new Date(
                Number(r.mintedAt) * 1000,
              ).toLocaleString('zh-CN')}`}
              value={r.kept ? '守约' : '未履约'}
            />
          ))
        )}
        {SBT_ADDRESS ? (
          <ExternalLink href={addressUrl(SBT_ADDRESS)}>
            <ThemedText type="linkPrimary">在 Monad 浏览器查看凭证合约</ThemedText>
          </ExternalLink>
        ) : null}
      </Card>

      <Card title={`黑名单（${blocked.length} 人）`}>
        {blocked.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            还没有拉黑任何人。在组队页可以拉黑对方，之后撮合不会再推荐 TA。
          </ThemedText>
        ) : (
          blocked.map((b) => (
            <Row
              key={b.candidateId}
              label={`${b.nickname} · ${new Date(b.at).toLocaleDateString('zh-CN')}`}
              value={<Button title="解除" variant="secondary" onPress={() => void unblockPartner(b.candidateId)} />}
            />
          ))
        )}
        <ThemedText type="small" themeColor="textSecondary">
          黑名单只存在本机，不上链、不对外公开、不改动对方信用分。把"我不想再遇到这个人"写成链上公开记录，
          等于给对方挂一个谁都能看见的负面标签，越过了"不做公开评价展示"的边界。
        </ThemedText>
      </Card>

      <Notice>
        凭证不可转让、不可自行删除，元数据只有时间、场景、是否守约，不含对方身份信息。
        它证明的是"这个账号过去是否按时到场"，不是"这个人现实中安全可信"——后者要靠实名、举报处理和线下核验。
      </Notice>
      <Notice>P0/P1 阶段不做公开信用分排行榜，避免信用分被用来社交攀比或衍生评价暴力。</Notice>
    </Screen>
  );
}
