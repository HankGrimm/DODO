import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Notice, Row, Screen } from '@/components/ui-kit';
import { SCENES } from '@/lib/chain';
import { matchCandidates, type MatchResult } from '@/lib/ai';
import { CANDIDATES } from '@/lib/candidates';
import { displayScore } from '@/lib/credit';
import { createTeam, fundPartnerIfNeeded, makeCode, partnerJoin, readTeam } from '@/lib/escrow';
import { useStore } from '@/lib/store';

export default function MatchScreen() {
  const params = useLocalSearchParams<{
    scene: string;
    place: string;
    note: string;
    offsetMin: string;
    depositEth: string;
    genderPref: 'any' | 'same';
  }>();
  const { profile, addTeam, refresh } = useStore();
  const [result, setResult] = useState<MatchResult>();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const scene = Number(params.scene ?? 0);
  const depositEth = params.depositEth ?? '0.001';

  useEffect(() => {
    matchCandidates(
      {
        scene,
        place: params.place ?? '',
        meetAt: `${params.offsetMin} 分钟后`,
        note: params.note ?? '',
        genderPref: params.genderPref ?? 'any',
        myGender: profile?.gender ?? 'female',
      },
      CANDIDATES,
    ).then(setResult);
  }, [scene, params.place, params.note, params.offsetMin, params.genderPref, profile?.gender]);

  async function team(nickname: string) {
    setError('');
    try {
      const myCode = makeCode();
      const partnerCode = makeCode();
      const meetAt = Math.floor(Date.now() / 1000) + Number(params.offsetMin ?? 120) * 60;

      setBusy('创建组队并托管押金…');
      const { teamId } = await createTeam({
        scene,
        meetAt,
        checkinDeadline: meetAt + 3600,
        code: myCode,
        depositEth,
      });

      setBusy('等待搭子缴纳押金…');
      await fundPartnerIfNeeded(parseEther(depositEth));
      const onChain = await readTeam(teamId);
      await partnerJoin(teamId, partnerCode, onChain.deposit);

      await addTeam({
        teamId: teamId.toString(),
        scene,
        place: params.place ?? '',
        meetAt: new Date(meetAt * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        depositEth,
        myCode,
        partnerCode,
        partnerNickname: nickname,
        createdAt: Date.now(),
      });
      await refresh();
      router.replace({ pathname: '/team', params: { id: teamId.toString() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }
  // MORE_BELOW
  return (
    <Screen>
      <Card title={`${SCENES[scene]} · ${params.place}`}>
        <Row label="押金" value={`${depositEth} MON / 人`} />
        <Row label="匹配范围" value={params.genderPref === 'same' ? '仅同性别' : '不限性别'} />
      </Card>

      {!result && <ThemedText type="small">正在撮合…</ThemedText>}

      {result?.ranked.length === 0 && (
        <Card title="暂无匹配">
          <ThemedText type="small" themeColor="textSecondary">
            没有符合硬性条件（已实名 / 场景匹配 / 性别偏好 / 10 公里内）的候选人，不做凑数推荐。
          </ThemedText>
          <Button title="改条件重发" variant="secondary" onPress={() => router.back()} />
        </Card>
      )}

      {result?.ranked.map(({ candidate: c, reason }) => (
        <Card key={c.id} title={`${c.nickname}${c.verified ? ' · 已实名' : ''}`}>
          <Row label="信用分" value={displayScore(c)} />
          <Row label="履约记录" value={`守约 ${c.kept} 次 / 失约 ${c.missed} 次`} />
          <Row label="距离" value={`${c.distanceKm} 公里`} />
          <Row label="活动时间窗" value={c.timeWindow} />
          <Row label="标签" value={c.tags.join(' · ')} />
          <ThemedText type="small" themeColor="textSecondary">
            撮合依据：{reason}
          </ThemedText>
          <Button
            title={busy ? busy : `与 ${c.nickname} 组队并缴押金`}
            disabled={busy.length > 0}
            onPress={() => void team(c.nickname)}
          />
        </Card>
      ))}

      {error ? (
        <Card title="出错了">
          <ThemedText type="small">{error}</ThemedText>
        </Card>
      ) : null}

      {result?.note ? <Notice>{result.note}</Notice> : null}
      {result?.usedLLM ? <Notice>排序与撮合依据由大模型生成，只依据履约记录、距离、时间窗等字段。</Notice> : null}
      <Notice>
        Demo 说明：对方账户由本机模拟（另一个内置钱包），押金与打卡都是 Monad 测试网上的真实交易。
      </Notice>
    </Screen>
  );
}
