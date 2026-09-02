import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chips, Field, Notice, Screen } from '@/components/ui-kit';
import { useStore } from '@/lib/store';

export default function VerifyScreen() {
  const { profile, saveProfile } = useStore();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'female');
  const [idTail, setIdTail] = useState(profile?.idTail ?? '');

  const valid = nickname.trim().length > 0 && /^\d{4}$/.test(idTail);

  async function submit() {
    await saveProfile({ nickname: nickname.trim(), gender, idTail, verified: true });
    router.back();
  }

  return (
    <Screen>
      <Card title="实名信息">
        <Field label="昵称" value={nickname} onChangeText={setNickname} placeholder="对方只能看到昵称" />
        <ThemedText type="small" themeColor="textSecondary">
          性别（用于安全偏好筛选）
        </ThemedText>
        <Chips
          value={gender}
          onChange={setGender}
          options={[
            { label: '女', value: 'female' },
            { label: '男', value: 'male' },
          ]}
        />
        <Field
          label="身份证后四位"
          value={idTail}
          onChangeText={(v) => setIdTail(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="1234"
        />
        <Button title="提交认证" disabled={!valid} onPress={() => void submit()} />
      </Card>

      <Notice>
        这是 Demo 的模拟认证：只做本地校验与标记，没有接真实身份核验接口，证件信息不会上链、也不会发给对方，
        对方只能看到"已实名"标识。上线前必须替换成正式实名通道。
      </Notice>
    </Screen>
  );
}
