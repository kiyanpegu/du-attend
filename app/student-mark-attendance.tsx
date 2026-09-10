import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { subjectService } from '@/services/subjectService';
import type { AttendanceSession, Subject } from '@/types/models';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function StudentMarkAttendance() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [successInfo, setSuccessInfo] = useState<{
    subjectName: string;
    timestamp: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const user = await authService.getActiveUser();
      if (!user || user.role !== 'student') {
        router.replace('/student-login' as never);
        return;
      }

      const [liveSessions, allSubjects] = await Promise.all([
        attendanceService.getActiveSessionsForStudent(user.id),
        subjectService.listSubjects(),
      ]);

      const map: Record<string, Subject> = {};
      allSubjects.forEach((s) => {
        map[s.id] = s;
      });

      setActiveSessions(liveSessions);
      setSubjects(map);
    } catch {
      // ignore
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchActive();
    };
    load();
    const interval = setInterval(load, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchActive]);

  const handleSubmitOtp = async () => {
    const trimmed = otp.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setErrorMessage('OTP must be exactly 6 numeric digits.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await authService.getActiveUser();
      if (!user) {
        router.replace('/student-login' as never);
        return;
      }

      const result = await attendanceService.submitOtp(user.id, trimmed);

      if (result.ok) {
        // Find subject name
        const matchingSession = activeSessions.find((s) => s.otp === trimmed);
        const subjectName = matchingSession ? subjects[matchingSession.subjectId]?.name ?? 'Class' : 'Class';

        setSuccessInfo({
          subjectName,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setOtp('');
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('Failed to submit OTP. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scrollable>
      <Header title="Mark Attendance" subtitle="Submit Instructor OTP" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        {successInfo ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconOuter}>
              <IconSymbol size={72} name="checkmark.circle.fill" color={APP_COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>Attendance Marked</Text>
            <Text style={styles.successMessage}>
              Your attendance has been recorded.
            </Text>

            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.bookIcon}>
                  <IconSymbol size={24} name="book.fill" color={APP_COLORS.textSecondary} />
                </View>
                <View style={styles.summaryTitleWrap}>
                  <Text style={styles.summarySubject} numberOfLines={2}>{successInfo.subjectName}</Text>
                  <Text style={styles.summarySubtext}>BCA 1st Semester • Dibrugarh University</Text>
                </View>
              </View>
              <View style={styles.summaryFooter}>
                <View style={styles.summaryTimeWrap}>
                  <IconSymbol size={14} name="clock.fill" color={APP_COLORS.textSecondary} />
                  <Text style={styles.summaryTimeText}>Today, {successInfo.timestamp}</Text>
                </View>
                <StatusBadge status="present" size="small" />
              </View>
            </Card>

            <View style={styles.successActions}>
              <AppButton
                title="Done"
                onPress={() => router.replace('/student-dashboard' as never)}
                variant="primary"
                style={styles.successBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.headerArea}>
              <IconSymbol size={48} name="key.fill" color={APP_COLORS.primary} />
              <Text style={styles.screenTitle}>Mark Attendance</Text>
              <Text style={styles.screenSubtitle}>
                Enter the 6-digit OTP displayed by your faculty.
              </Text>
            </View>

            <View style={styles.otpForm}>
              <TextInput
                style={styles.otpInputField}
                placeholder="••••••"
                placeholderTextColor={APP_COLORS.textMuted}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setErrorMessage(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              {errorMessage && (
                <View style={styles.errorBox}>
                  <IconSymbol size={16} name="xmark.circle.fill" color={APP_COLORS.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {activeSessions.length > 0 && (
                <View style={styles.timerWrap}>
                  <IconSymbol size={16} name="clock.fill" color={APP_COLORS.danger} />
                  <Text style={styles.timerText}>
                    {activeSessions.length === 1
                      ? `OTP is valid for ${attendanceService.getSecondsRemaining(activeSessions[0])}s`
                      : `${activeSessions.length} active classes found`}
                  </Text>
                </View>
              )}

              <AppButton
                title={loading ? 'Verifying...' : 'Submit Attendance'}
                onPress={handleSubmitOtp}
                loading={loading}
                disabled={otp.length !== 6 || loading}
                variant="primary"
                icon="person.fill.checkmark"
                style={styles.submitButton}
              />
            </View>

            <View style={{ marginTop: 24 }}>
              <AppButton
                title="Cancel and return to Dashboard"
                onPress={() => router.replace('/student-dashboard' as never)}
                variant="ghost"
                icon="arrow.left"
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  otpForm: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  otpInputField: {
    backgroundColor: APP_COLORS.surface,
    width: '100%',
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.primarySoft,
    color: APP_COLORS.text,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 24,
    fontVariant: ['tabular-nums'],
    marginBottom: 24,
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.danger,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${APP_COLORS.danger}15`,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${APP_COLORS.danger}30`,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.danger,
    flex: 1,
  },
  submitButton: {
    width: '100%',
    height: 56,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${APP_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${APP_COLORS.primary}30`,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    paddingBottom: 16,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleWrap: {
    flex: 1,
  },
  summarySubject: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTimeText: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  successActions: {
    width: '100%',
  },
  successBtn: {
    width: '100%',
  },
});
