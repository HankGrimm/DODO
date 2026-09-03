import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Notice, Row, Screen } from '@/components/ui-kit';
import { ESCROW_ADDRESS, SCENES, TEAM_STATUS, addressUrl } from '@/lib/chain';
import { checkIn, formatMon, raiseDispute, readSlashTerms, readTeam, type OnChainTeam } from '@/lib/escrow';
import { useStore } from '@/lib/store';

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { teams, blockedIds, blockPartner, refresh } = useStore();
  const meta = teams.find((t) => t.teamId === id);
  const teamId = BigInt(id ?? '0');
  const partnerBlocked = Boolean(meta?.partnerCandidateId && blockedIds.includes(meta.partnerCandidateId));

  const [team, setTeam] = useState<OnChainTeam>();
  const [terms, setTerms] = useState<Awaited<ReturnType<typeof readSlashTerms>>>();
  const [code, setCode] = useState('');
  const [coords, setCoords] = useState<string>();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setTeam(await readTeam(teamId));
    setTerms(await readSlashTerms());
  }, [teamId]);

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, [load]);

  async function locate() {
    setError('');
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setError('没有定位权限，无法完成到场打卡');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
  }

  async function confirm() {
    if (!meta) return;
    setError('');
    try {
      setBusy('提交我的打卡…');
      await checkIn('me', teamId, code);
      // Demo：对方账户在本机模拟，这里代替对方扫我的码完成第二次打卡
      setBusy('等待对方打卡…');
      await checkIn('partner', teamId, meta.myCode);
      await load();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }

  async function report() {
    setError('');
    try {
      setBusy('提交举报…');
      await raiseDispute(teamId, '对方未按约定到场');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }
  // MORE_BELOW
  const funded = team?.status === 2;
  const done = team?.status === 3;

  return (
    <Screen>
      <Card title={`组队 #${id}`}>
        <Row label="场景" value={meta ? `${SCENES[meta.scene]} · ${meta.place}` : SCENES[team?.scene ?? 0]} />
        <Row label="约定时间" value={meta?.meetAt ?? '—'} />
        <Row label="搭子" value={meta?.partnerNickname ?? '—'} />
        <Row label="链上状态" value={TEAM_STATUS[team?.status ?? 0]} />
        <Row label="托管押金" value={team ? `${formatMon(team.deposit)} / 人` : '—'} />
        <Row
          label="打卡截止"
          value={team ? new Date(Number(team.checkinDeadline) * 1000).toLocaleTimeString('zh-CN') : '—'}
        />
        <Row label="我的打卡" value={team?.hostCheckedIn ? '已完成' : '待打卡'} />
        <Row label="对方打卡" value={team?.guestCheckedIn ? '已完成' : '待打卡'} />
        <ExternalLink href={addressUrl(ESCROW_ADDRESS)}>
          <ThemedText type="linkPrimary">在 Monad 浏览器查看托管合约</ThemedText>
        </ExternalLink>
      </Card>

      {done && (
        <Card title="履约完成">
          <ThemedText type="small">
            双方互相打卡成功，押金已自动退回，双方各获得一枚不可转让的履约凭证。
          </ThemedText>
        </Card>
      )}

      {funded && (
        <>
          <Card title="我的履约码">
            <ThemedText type="title" style={{ letterSpacing: 4 }}>
              {meta?.myCode ?? '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              见面时出示给对方，对方输入后完成一次确认。链上只存这串码的哈希。
            </ThemedText>
          </Card>

          <Card title="到场打卡">
            <Row label="定位" value={coords ?? '未获取'} />
            <Button title="获取当前位置" variant="secondary" onPress={() => void locate()} />
            <Field
              label="输入对方出示的履约码"
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().slice(0, 6))}
              placeholder="6 位字母数字"
              autoCapitalize="characters"
            />
            <Button
              title={busy || '确认双方到场'}
              disabled={!coords || code.length !== 6 || busy.length > 0}
              onPress={() => void confirm()}
            />
            <Button title="对方没来，我要举报" variant="secondary" onPress={() => void report()} />
          </Card>

          <Notice>
            Demo 提示：对方账户在本机模拟，它的履约码是 {meta?.partnerCode}。真实场景下这串码只出现在对方手机上。
          </Notice>
        </>
      )}

      {team?.status === 4 && (
        <Card title="待仲裁">
          <ThemedText type="small">
            已进入争议流程。单方打卡或举报都不会直接扣款，需要仲裁人裁决后才结算押金。
            当前仲裁人是合约部署者，这是占位实现——谁来裁决、证据标准、申诉路径都还没定。
          </ThemedText>
          {terms ? (
            <>
              <Row label="失约方罚没比例" value={`${terms.slashBps / 100}%（余下退回失约方）`} />
              <Row
                label="守约方最多得到"
                value={`押金的 ${(terms.slashBps * terms.compensationBps) / 1000000}%`}
              />
              <Row label="安全基金累计" value={formatMon(terms.safetyFund)} />
            </>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            罚没款不全额赔付给对方：举报成功如果能净赚一整份押金，押金就成了新的骚扰工具。
            剩下那部分进合约里的安全基金，Demo 阶段没有提取函数——这笔钱谁能动还没定。
          </ThemedText>
        </Card>
      )}

      {meta?.partnerCandidateId ? (
        <Card title="不想再遇到这个人">
          {partnerBlocked ? (
            <ThemedText type="small" themeColor="textSecondary">
              已拉黑 {meta.partnerNickname}，后续撮合不会再出现。可在履约信用页解除。
            </ThemedText>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                拉黑只影响你自己的撮合结果，不上链、不对外公开、不改动对方信用分。
              </ThemedText>
              <Button
                title={`拉黑 ${meta.partnerNickname}`}
                variant="secondary"
                onPress={() =>
                  void blockPartner({
                    candidateId: meta.partnerCandidateId!,
                    nickname: meta.partnerNickname,
                    reason: '在组队页手动拉黑',
                    at: Date.now(),
                  })
                }
              />
            </>
          )}
        </Card>
      ) : null}

      {error ? (
        <Card title="出错了">
          <ThemedText type="small">{error}</ThemedText>
        </Card>
      ) : null}
    </Screen>
  );
}
