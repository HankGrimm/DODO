import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chips, Field, Notice, Row, Screen } from '@/components/ui-kit';
import { useStore } from '@/lib/store';

const OFFSETS = [
  { label: '1 小时后', value: 60 },
  { label: '2 小时后', value: 120 },
  { label: '3 小时后', value: 180 },
];

const DEPOSITS = [
  { label: '0.001 MON', value: '0.001' },
  { label: '0.005 MON', value: '0.005' },
  { label: '0.01 MON', value: '0.01' },
];

export default function CreateScreen() {
  const { profile } = useStore();
  const [scene, setScene] = useState(0);
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [offsetMin, setOffsetMin] = useState(120);
  const [depositEth, setDepositEth] = useState('0.001');
  const [genderPref, setGenderPref] = useState<'any' | 'same'>('any');

  const meetAtLabel = new Date(Date.now() + offsetMin * 60_000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Screen>
      <Card title="场景">
        <Chips
          value={scene}
          onChange={setScene}
          options={[
            { label: '逛超市', value: 0 },
            { label: '同城出行', value: 1 },
          ]}
        />
        <Field
          label="地点"
          value={place}
          onChangeText={setPlace}
          placeholder={scene === 0 ? '例：山姆会员店（XX 路店）' : '例：T3 航站楼到市区'}
        />
        <Field label="补充说明（可选）" value={note} onChangeText={setNote} placeholder="例：拼单+搭手拎东西" />
      </Card>

      <Card title="时间">
        <Chips value={offsetMin} onChange={setOffsetMin} options={OFFSETS} />
        <Row label="约定见面时间" value={`今天 ${meetAtLabel}`} />
        <Row label="打卡截止" value="见面时间后 1 小时" />
      </Card>

      <Card title="押金与安全偏好">
        <ThemedText type="small" themeColor="textSecondary">
          双方各缴同额押金，互相打卡后自动全额退回
        </ThemedText>
        <Chips value={depositEth} onChange={setDepositEth} options={DEPOSITS} />
        <ThemedText type="small" themeColor="textSecondary">
          匹配范围
        </ThemedText>
        <Chips
          value={genderPref}
          onChange={setGenderPref}
          options={[
            { label: '不限性别', value: 'any' },
            { label: `仅匹配同性别（${profile?.gender === 'male' ? '男' : '女'}）`, value: 'same' },
          ]}
        />
      </Card>

      <Button
        title="开始 AI 撮合"
        disabled={place.trim().length === 0}
        onPress={() =>
          router.push({
            pathname: '/match',
            params: { scene: String(scene), place: place.trim(), note, offsetMin: String(offsetMin), depositEth, genderPref },
          })
        }
      />

      <Notice>选择"仅匹配同性别"后不会降级推荐其他候选人，宁可匹配不到也不放宽条件。</Notice>
    </Screen>
  );
}
