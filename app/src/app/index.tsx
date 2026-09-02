import { Link, router } from 'expo-router';
import { View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Notice, Row, Screen } from '@/components/ui-kit';
import { Spacing } from '@/constants/theme';
import { SCENES, addressUrl, contractsReady, shortAddress } from '@/lib/chain';
import { creditScore } from '@/lib/credit';
import { formatMon } from '@/lib/escrow';
import { useStore } from '@/lib/store';

export default function HomeScreen() {
  const { ready, profile, address, balance, records, teams, refresh } = useStore();
  const kept = records.filter((r) => r.kept).length;
  const credit = creditScore({ kept, missed: records.length - kept });
  const canStart = Boolean(profile?.verified) && contractsReady && balance > 0n;

  return (
    <Screen>
      <ThemedText type="subtitle">找个靠得住的搭子</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        逛超市、同城出行找人搭伙。组队先押金，见面互相打卡，履约记录上 Monad 链，凭证不可转让。
      </ThemedText>

      <Card title="我的链上账户">
        <Row label="地址" value={shortAddress(address)} />
        <Row label="余额" value={formatMon(balance)} />
        <Row
          label="履约凭证"
          value={`${records.length} 枚（守约 ${kept}）`}
        />
        <Row label="信用分" value={credit.enough ? String(credit.total) : '数据不足（<5 次履约）'} />
        {address ? (
          <ExternalLink href={addressUrl(address)}>
            <ThemedText type="linkPrimary">在 Monad 浏览器查看</ThemedText>
          </ExternalLink>
        ) : null}
        <Button title="刷新链上数据" variant="secondary" onPress={() => void refresh()} />
      </Card>

      {!contractsReady && (
        <Notice>
          还没配置合约地址。先在 contracts 目录 npm run deploy，把打印出的 EXPO_PUBLIC_ESCROW_ADDRESS /
          EXPO_PUBLIC_SBT_ADDRESS 写进 app/.env 再重启。
        </Notice>
      )}

      {ready && balance === 0n && (
        <Notice>
          账户里没有测试网 MON，押金交易会失败。
          <ExternalLink href="https://faucet.monad.xyz">
            <ThemedText type="linkPrimary"> 去水龙头领取</ThemedText>
          </ExternalLink>
        </Notice>
      )}

      <Card title="实名认证">
        {profile?.verified ? (
          <Row label={profile.nickname} value="已实名" />
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              未完成实名认证不能发起或接受匹配。
            </ThemedText>
            <Button title="去认证" onPress={() => router.push('/verify')} />
          </>
        )}
      </Card>

      <View style={{ gap: Spacing.two }}>
        <Button title="发起搭子请求" disabled={!canStart} onPress={() => router.push('/create')} />
        <Button title="我的履约信用与凭证" variant="secondary" onPress={() => router.push('/credit')} />
      </View>

      {teams.length > 0 && (
        <Card title="我的组队">
          {teams.map((t) => (
            <Link key={t.teamId} href={{ pathname: '/team', params: { id: t.teamId } }}>
              <ThemedText type="small">
                #{t.teamId} {SCENES[t.scene]} · {t.place} · {t.meetAt} · 搭子 {t.partnerNickname}
              </ThemedText>
            </Link>
          ))}
        </Card>
      )}

      <Notice>
        履约凭证只能说明这个账号过去是否按时到场，不代表对方现实中安全可信。见面请选公共场所，注意人身安全。
      </Notice>
    </Screen>
  );
}
