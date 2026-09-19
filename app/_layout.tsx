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
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { MandatoryUpdateModal } from '@/components/app/MandatoryUpdateModal';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { cloudService } from '@/services/cloudService';
import { notificationService } from '@/services/notificationService';
import { storageService } from '@/services/storageService';
import { AppUpdateStatus, updateService } from '@/services/updateService';
import * as Updates from 'expo-updates';

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

  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Check for mandatory updates (OTA bundle or APK)
    async function checkAppUpdates() {
      try {
        const result = await updateService.checkForUpdate();
        if (result.isAvailable) {
          setUpdateStatus(result);
          setShowUpdateModal(true);
        }
      } catch (err) {
        console.warn('App update check error:', err);
      }
    }

    checkAppUpdates();
    const interval = setInterval(checkAppUpdates, 60000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    // Listen for live attendance broadcasts and schedule overrides from Supabase
    const notifiedSessions = new Set<string>();
    const notifiedOverrides = new Set<string>();

    const checkCloudAlerts = async () => {
      try {
        const user = await authService.getActiveUser();
        if (!user || user.role !== 'student') return;

        // 1. Check live sessions for this student
        const liveSessions = await attendanceService.getActiveSessionsForStudent(user.id);
        for (const session of liveSessions) {
          if (!notifiedSessions.has(session.id) && attendanceService.getSecondsRemaining(session) > 0) {
            notifiedSessions.add(session.id);
            const db = await storageService.getDatabase();
            const subject = db.subjects.find((s) => s.id === session.subjectId);
            await notificationService.notifyAttendanceSessionStarted({
              subjectName: subject?.name || 'Class',
              durationMinutes: Math.round(attendanceService.getSecondsRemaining(session) / 60) || 10,
            });
          }
        }

        // 2. Check schedule overrides (cancellations/reschedules)
        if (cloudService.isOnline()) {
          const overrides = await cloudService.getActiveScheduleOverrides();
          for (const ov of overrides) {
            if (!notifiedOverrides.has(ov.id)) {
              notifiedOverrides.add(ov.id);
              const db = await storageService.getDatabase();
              const subject = db.subjects.find((s) => s.id === ov.subjectId);
              const subjectName = subject?.name || 'Lecture';
              if (ov.action === 'cancelled') {
                await notificationService.notifyClassCancelled({
                  subjectName,
                  slotTime: ov.originalTimeSlot,
                  reason: ov.reason,
                });
              } else if (ov.action === 'rescheduled') {
                await notificationService.notifyClassRescheduled({
                  subjectName,
                  originalTime: ov.originalTimeSlot,
                  newDay: ov.newDayOfWeek || '',
                  newTime: ov.newTimeSlot || '',
                  room: ov.newRoom,
                });
              }
            }
          }
        }
      } catch {
        // Defensive check — never interrupt app UI
      }
    };

    checkCloudAlerts();

    // Subscribe to realtime changes
    const unsubSessions = cloudService.subscribeToActiveSessions(checkCloudAlerts);
    const unsubOverrides = cloudService.subscribeToScheduleOverrides(checkCloudAlerts);

    // Heartbeat poll every 4 seconds as reliable fallback
    const interval = setInterval(checkCloudAlerts, 4000);

    return () => {
      unsubSessions();
      unsubOverrides();
      clearInterval(interval);
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
      <MandatoryUpdateModal visible={showUpdateModal} updateStatus={updateStatus} />
    </ErrorBoundary>
  );
}
