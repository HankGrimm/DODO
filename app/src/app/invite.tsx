// 邀请详情：双向同意的那一层。pending 时链上什么都没发生；
// 只有对方接受（accepted）之后才允许缴押金，成立组队后转 active。
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { parseEther } from 'viem';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Notice, Row, Screen } from '@/components/ui-kit';
import { SCENES } from '@/lib/chain';
import { createTeam, fundPartnerIfNeeded, makeCode, partnerJoin, readTeam } from '@/lib/escrow';
import { inviteExpired, useStore } from '@/lib/store';

const STATUS_TEXT = {
  pending: '等待对方确认',
  accepted: '对方已同意，待双方缴押金',
  declined: '对方已拒绝',
  active: '已成立组队',
} as const;

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invites, addTeam, setInviteStatus, blockedIds, refresh } = useStore();
  const invite = invites.find((i) => i.id === id);

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  if (!invite) {
    return (
      <Screen>
        <Card title="邀请不存在">
          <ThemedText type="small">这条邀请已被清除。</ThemedText>
          <Button title="回首页" variant="secondary" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const expired = inviteExpired(invite);
  const isBlocked = blockedIds.includes(invite.candidateId);
  const meetAtText = new Date(invite.meetAtSec * 1000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 对方同意之后才走链：本人 createTeam 押金入托管，搭子 joinTeam 押金入托管
  async function stake() {
    setError('');
    try {
      const myCode = makeCode();
      const partnerCode = makeCode();

      setBusy('创建组队并托管押金…');
      const { teamId } = await createTeam({
        scene: invite!.scene,
        meetAt: invite!.meetAtSec,
        checkinDeadline: invite!.meetAtSec + 3600,
        code: myCode,
        depositEth: invite!.depositEth,
      });

      setBusy('等待搭子缴纳押金…');
      await fundPartnerIfNeeded(parseEther(invite!.depositEth));
      const onChain = await readTeam(teamId);
      await partnerJoin(teamId, partnerCode, onChain.deposit);

      await addTeam({
        teamId: teamId.toString(),
        scene: invite!.scene,
        place: invite!.place,
        meetAt: meetAtText,
        depositEth: invite!.depositEth,
        myCode,
        partnerCode,
        partnerNickname: invite!.nickname,
        partnerCandidateId: invite!.candidateId,
        createdAt: Date.now(),
      });
      await setInviteStatus(invite!.id, 'active', teamId.toString());
      await refresh();
      router.replace({ pathname: '/team', params: { id: teamId.toString() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }

  return (
    <Screen>
      <Card title={`邀请 ${invite.nickname}`}>
        <Row label="场景" value={`${SCENES[invite.scene]} · ${invite.place}`} />
        <Row label="约定时间" value={meetAtText} />
        <Row label="押金" value={`${invite.depositEth} MON / 人`} />
        <Row
          label="状态"
          value={
            isBlocked ? '你已拉黑此人，邀请作废' : expired ? '已过约定时间，邀请作废' : STATUS_TEXT[invite.status]
          }
        />
        <ThemedText type="small" themeColor="textSecondary">
          撮合依据：{invite.reason}
        </ThemedText>
      </Card>

      {invite.status === 'pending' && !expired && !isBlocked && (
        <>
          <Card title="等待对方确认">
            <ThemedText type="small" themeColor="textSecondary">
              链上还没有任何交易，你的押金也没有被锁。对方拒绝或超时不理，这条邀请就作废，不产生任何费用。
            </ThemedText>
          </Card>
          <Card title="Demo：代替对方响应">
            <ThemedText type="small" themeColor="textSecondary">
              真实产品里这一步发生在对方的手机上。这里用两个按钮手动触发，方便演示同意与拒绝两条路径。
            </ThemedText>
            <Button title="对方同意" onPress={() => void setInviteStatus(invite.id, 'accepted')} />
            <Button
              title="对方拒绝"
              variant="secondary"
              onPress={() => void setInviteStatus(invite.id, 'declined')}
            />
          </Card>
        </>
      )}

      {invite.status === 'accepted' && !isBlocked && (
        <Card title="双方已同意，可以缴押金">
          <ThemedText type="small" themeColor="textSecondary">
            两笔链上交易：你 createTeam 把押金打进托管合约，搭子 joinTeam 打进同一笔托管。
          </ThemedText>
          <Button
            title={busy || '缴纳押金并组队'}
            disabled={busy.length > 0}
            onPress={() => void stake()}
          />
        </Card>
      )}

      {invite.status === 'declined' && (
        <Card title="对方拒绝了">
          <ThemedText type="small" themeColor="textSecondary">
            没有产生任何链上交易。可以回去看看其他候选人。
          </ThemedText>
          <Button title="回首页" variant="secondary" onPress={() => router.replace('/')} />
        </Card>
      )}

      {invite.status === 'active' && invite.teamId && (
        <Button
          title={`查看组队 #${invite.teamId}`}
          onPress={() => router.replace({ pathname: '/team', params: { id: invite.teamId! } })}
        />
      )}

      {error ? (
        <Card title="出错了">
          <ThemedText type="small">{error}</ThemedText>
        </Card>
      ) : null}

      <Notice>
        同意只代表对方愿意一起行动，不代表对方现实中安全可信。见面请选公共场所。
      </Notice>
    </Screen>
  );
}
