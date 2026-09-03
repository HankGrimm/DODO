import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { StoreProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <StoreProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'AI 搭子' }} />
          <Stack.Screen name="verify" options={{ title: '实名认证' }} />
          <Stack.Screen name="create" options={{ title: '发起搭子' }} />
          <Stack.Screen name="match" options={{ title: 'AI 撮合结果' }} />
          <Stack.Screen name="invite" options={{ title: '邀请确认' }} />
          <Stack.Screen name="team" options={{ title: '组队与履约' }} />
          <Stack.Screen name="credit" options={{ title: '我的履约信用' }} />
        </Stack>
      </StoreProvider>
    </ThemeProvider>
  );
}
