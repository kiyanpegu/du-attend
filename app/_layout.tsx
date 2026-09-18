import { APP_COLORS } from '@/constants/duAttend';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/inter';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { notificationService } from '@/services/notificationService';

// Prevent splash screen auto-hide until ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Initialize notification channels and listener
    notificationService.initialize().catch(() => {});

    const subscription = notificationService.addResponseReceivedListener((response) => {
      const targetUrl = response.notification.request.content.data?.url;
      if (typeof targetUrl === 'string') {
        try {
          router.push(targetUrl as any);
        } catch (err) {
          console.warn('Failed to route from notification tap:', err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar barStyle="light-content" backgroundColor={APP_COLORS.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: APP_COLORS.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ErrorBoundary>
  );
}
