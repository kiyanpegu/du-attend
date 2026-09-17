import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, GEOFENCE_CONFIG, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { GeofenceResult, locationService } from '@/services/locationService';
import { subjectService } from '@/services/subjectService';
import type { AttendanceSession, Subject } from '@/types/models';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StudentMarkAttendance() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [successInfo, setSuccessInfo] = useState<{
    subjectName: string;
    subjectCode?: string;
    timestamp: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceResult | null>(null);
  const [simulateClassroom, setSimulateClassroom] = useState(true);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [, setTick] = useState(0);

  const verifyLocation = useCallback(async (simulated: boolean) => {
    setCheckingLocation(true);
    try {
      const result = await locationService.checkClassroomGeofence(simulated);
      setGeofenceStatus(result);
      return result;
    } finally {
      setCheckingLocation(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const runAsyncCheck = async () => {
      const result = await locationService.checkClassroomGeofence(simulateClassroom);
      if (active) {
        setGeofenceStatus(result);
      }
    };
    runAsyncCheck();
    return () => {
      active = false;
    };
  }, [simulateClassroom]);

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

  useEffect(() => {
    if (activeSessions.length === 0) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessions.length]);

  const handleDigitPress = (digit: string) => {
    if (otp.length < 6) {
      const nextOtp = otp + digit;
      setOtp(nextOtp);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    if (otp.length > 0) {
      setOtp(otp.slice(0, -1));
      setErrorMessage(null);
    }
  };

  const handleClear = () => {
    setOtp('');
    setErrorMessage(null);
  };

  const handleSubmitOtp = async () => {
    const trimmed = otp.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setErrorMessage('OTP must be exactly 6 numeric digits.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      // 1. Verify classroom geofence
      const locationCheck = await verifyLocation(simulateClassroom);
      if (!locationCheck.isInside) {
        setErrorMessage(locationCheck.message);
        setLoading(false);
        return;
      }

      const user = await authService.getActiveUser();
      if (!user) {
        router.replace('/student-login' as never);
        return;
      }

      const result = await attendanceService.submitOtp(user.id, trimmed);

      if (result.ok) {
        // Find subject name
        const matchingSession = activeSessions.find((s) => s.otp === trimmed);
        const sub = matchingSession ? subjects[matchingSession.subjectId] : undefined;
        const subjectName = sub?.name ?? 'Class Lecture';
        const subjectCode = sub?.code ?? 'BCA';

        setSuccessInfo({
          subjectName,
          subjectCode,
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

  const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;
  const activeSubject = activeSession ? subjects[activeSession.subjectId] : null;
  const secondsRemaining = activeSession
    ? attendanceService.getSecondsRemaining(activeSession)
    : 0;

  return (
    <AppScreen scrollable>
      <Header
        title="Mark Attendance"
        subtitle="Submit Classroom OTP"
        showBack
        onBack={() => router.replace('/student-dashboard' as never)}
        rightAction={{
          icon: 'arrow.clockwise',
          onPress: () => {
            fetchActive();
            verifyLocation(simulateClassroom);
          },
          label: 'Sync',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        {successInfo ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconOuter}>
              <IconSymbol size={48} name="checkmark.circle.fill" color={APP_COLORS.safeText} />
            </View>
            <Text style={styles.successTitle}>Attendance Verified</Text>
            <Text style={styles.successSubtitle}>
              Your attendance record has been confirmed and stored on the university server.
            </Text>

            <Card style={styles.receiptCard} padded>
              <View style={styles.receiptHeader}>
                <View style={styles.receiptHeaderLeft}>
                  <Text style={styles.receiptInstitution}>DIBRUGARH UNIVERSITY</Text>
                  <Text style={styles.receiptDepartment}>Centre for Computer Science & Applications</Text>
                </View>
                <StatusBadge status="present" label="VERIFIED" size="small" />
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptSubjectBlock}>
                <Text style={styles.receiptSubjectName}>{successInfo.subjectName}</Text>
                {successInfo.subjectCode ? (
                  <Text style={styles.receiptSubjectCode}>{successInfo.subjectCode} • BCA 1st Semester</Text>
                ) : null}
              </View>

              <View style={styles.receiptInfoGrid}>
                <View style={styles.receiptInfoRow}>
                  <View style={styles.receiptInfoItem}>
                    <Text style={styles.receiptInfoLabel}>RECORDED AT</Text>
                    <View style={styles.receiptInfoValueRow}>
                      <IconSymbol size={13} name="clock.fill" color={APP_COLORS.textSecondary} />
                      <Text style={styles.receiptInfoValue}>{successInfo.timestamp}</Text>
                    </View>
                  </View>
                  <View style={styles.receiptInfoItem}>
                    <Text style={styles.receiptInfoLabel}>STATUS</Text>
                    <Text style={[styles.receiptInfoValue, { color: APP_COLORS.safeText, fontWeight: '700' }]}>
                      PRESENT
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptInfoRow}>
                  <View style={styles.receiptInfoItem}>
                    <Text style={styles.receiptInfoLabel}>VERIFICATION METHOD</Text>
                    <Text style={styles.receiptInfoValue}>6-Digit OTP + Geofence</Text>
                  </View>
                  <View style={styles.receiptInfoItem}>
                    <Text style={styles.receiptInfoLabel}>CAMPUS VENUE</Text>
                    <Text style={styles.receiptInfoValue}>CCSA Hall 1 (≤100m)</Text>
                  </View>
                </View>
              </View>
            </Card>

            <View style={styles.successActions}>
              <AppButton
                title="Return to Dashboard"
                onPress={() => router.replace('/student-dashboard' as never)}
                variant="primary"
                icon="house.fill"
              />
              <AppButton
                title="View Timetable"
                onPress={() => router.replace('/student-schedule' as never)}
                variant="outline"
                icon="calendar"
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.contentWrap}>
            {/* Active Session Context Card */}
            {activeSession ? (
              <Card style={styles.contextCard} padded>
                <View style={styles.contextHeader}>
                  <View style={styles.contextHeaderLeft}>
                    <StatusBadge status="present" label="LIVE CLASS" size="small" />
                    <Text style={styles.contextSubjectCode}>{activeSubject?.code ?? 'BCA'}</Text>
                  </View>
                  <View style={[styles.timerBadge, secondsRemaining <= 30 && styles.timerBadgeUrgent]}>
                    <IconSymbol
                      size={12}
                      name="clock.fill"
                      color={secondsRemaining <= 30 ? APP_COLORS.danger : APP_COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timerBadgeText,
                        secondsRemaining <= 30 && styles.timerBadgeTextUrgent,
                      ]}
                    >
                      {secondsRemaining > 0 ? `${formatRemaining(secondsRemaining)} remaining` : 'Code expired'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.contextSubjectName} numberOfLines={2}>
                  {activeSubject?.name ?? 'Live Lecture Session'}
                </Text>

                <View style={styles.contextMetaRow}>
                  <View style={styles.contextMetaItem}>
                    <IconSymbol size={13} name="building.columns" color={APP_COLORS.textMuted} />
                    <Text style={styles.contextMetaText}>{GEOFENCE_CONFIG.classroomName}</Text>
                  </View>
                  <Text style={styles.contextMetaDot}>•</Text>
                  <View style={styles.contextMetaItem}>
                    <IconSymbol size={13} name="person" color={APP_COLORS.textMuted} />
                    <Text style={styles.contextMetaText}>Dibrugarh University</Text>
                  </View>
                </View>
              </Card>
            ) : (
              <Card style={styles.contextEmptyCard} padded>
                <View style={styles.contextEmptyIcon}>
                  <IconSymbol size={22} name="calendar.badge.clock" color={APP_COLORS.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contextEmptyTitle}>Awaiting Class Broadcast</Text>
                  <Text style={styles.contextEmptySubtitle}>
                    Your faculty will display a 6-digit code on the projector. It updates automatically when live.
                  </Text>
                </View>
              </Card>
            )}

            {/* Location Verification Status Card */}
            <Card style={styles.locationCard} padded>
              <View style={styles.locationHeaderRow}>
                <View
                  style={[
                    styles.locationIconWrap,
                    checkingLocation
                      ? styles.locationIconNeutral
                      : geofenceStatus?.isInside
                      ? styles.locationIconSafe
                      : styles.locationIconWarning,
                  ]}
                >
                  <IconSymbol
                    size={18}
                    name={
                      checkingLocation
                        ? 'arrow.trianglehead.clockwise'
                        : geofenceStatus?.isInside
                        ? 'checkmark.shield.fill'
                        : 'exclamationmark.triangle.fill'
                    }
                    color={
                      checkingLocation
                        ? APP_COLORS.textSecondary
                        : geofenceStatus?.isInside
                        ? APP_COLORS.safeText
                        : APP_COLORS.attentionText
                    }
                  />
                </View>
                <View style={styles.locationTextWrap}>
                  <View style={styles.locationTitleRow}>
                    <Text style={styles.locationTitle}>Classroom Geofence</Text>
                    <StatusBadge
                      status={geofenceStatus?.isInside ? 'present' : 'warning'}
                      label={
                        checkingLocation
                          ? 'CHECKING'
                          : geofenceStatus?.isInside
                          ? 'VERIFIED'
                          : 'OUTSIDE ZONE'
                      }
                      size="small"
                    />
                  </View>
                  <Text style={styles.locationSubtitle}>
                    {checkingLocation
                      ? 'Verifying physical proximity to CCSA Lecture Hall 1...'
                      : geofenceStatus?.message ?? 'Location verification required.'}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDivider} />

              <View style={styles.simulationRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.simulationLabel}>Simulate Campus GPS</Text>
                  <Text style={styles.simulationHint}>
                    {simulateClassroom
                      ? 'Simulating presence within CCSA (Testing Mode)'
                      : 'Using physical device GPS sensor'}
                  </Text>
                </View>
                <Switch
                  value={simulateClassroom}
                  onValueChange={(val) => setSimulateClassroom(val)}
                  trackColor={{ false: APP_COLORS.border, true: APP_COLORS.obsidian }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>

            {/* Tactile OTP Section */}
            <View style={styles.otpSection}>
              <Text style={styles.otpSectionHeader}>ENTER 6-DIGIT CODE</Text>

              {/* Hidden input for screen readers and hardware keyboards */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setErrorMessage(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                accessibilityLabel="6-Digit Classroom OTP"
              />

              {/* 6 Tactile Digit Boxes */}
              <TouchableOpacity
                style={styles.otpBoxesRow}
                activeOpacity={0.9}
                onPress={() => inputRef.current?.focus()}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otp[index];
                  const isFilled = digit !== undefined;
                  const isActive = index === otp.length;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        isFilled && styles.otpBoxFilled,
                        isActive && styles.otpBoxActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.otpBoxText,
                          isFilled ? styles.otpBoxTextFilled : styles.otpBoxTextPlaceholder,
                        ]}
                      >
                        {isFilled ? digit : '•'}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Error Message Box */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <IconSymbol size={16} name="xmark.circle.fill" color={APP_COLORS.shortageText} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* On-Screen Tactile Keypad */}
              <View style={styles.keypadContainer}>
                <View style={styles.keypadRow}>
                  {['1', '2', '3'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      style={styles.keypadKey}
                      onPress={() => handleDigitPress(digit)}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadKeyText}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  {['4', '5', '6'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      style={styles.keypadKey}
                      onPress={() => handleDigitPress(digit)}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadKeyText}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  {['7', '8', '9'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      style={styles.keypadKey}
                      onPress={() => handleDigitPress(digit)}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadKeyText}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  <TouchableOpacity
                    style={[styles.keypadKey, styles.keypadUtilityKey]}
                    onPress={handleClear}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.keypadUtilityText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.keypadKey}
                    onPress={() => handleDigitPress('0')}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.keypadKeyText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keypadKey, styles.keypadUtilityKey]}
                    onPress={handleBackspace}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.keypadBackspaceText}>⌫</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action CTA */}
              <View style={styles.submitSection}>
                <AppButton
                  title={
                    loading
                      ? 'Verifying...'
                      : otp.length < 6
                      ? 'Enter 6-Digit OTP'
                      : !geofenceStatus?.isInside
                      ? 'Location Verification Required'
                      : 'Verify & Mark Attendance'
                  }
                  onPress={handleSubmitOtp}
                  loading={loading}
                  disabled={otp.length !== 6 || loading || !geofenceStatus?.isInside}
                  variant={otp.length === 6 && geofenceStatus?.isInside ? 'primary' : 'secondary'}
                  icon="checkmark.seal.fill"
                  style={styles.submitButton}
                />
              </View>
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
  contentWrap: {
    paddingBottom: 40,
  },
  contextCard: {
    marginBottom: TOKENS.spacing.md,
    backgroundColor: APP_COLORS.surface,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contextHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextSubjectCode: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: TOKENS.rounded.full,
  },
  timerBadgeUrgent: {
    backgroundColor: APP_COLORS.shortageBg,
  },
  timerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  timerBadgeTextUrgent: {
    color: APP_COLORS.shortageText,
  },
  contextSubjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  contextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextMetaText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  contextMetaDot: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  contextEmptyCard: {
    marginBottom: TOKENS.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: APP_COLORS.surface,
  },
  contextEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  contextEmptySubtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    lineHeight: 18,
  },
  locationCard: {
    marginBottom: TOKENS.spacing.lg,
    backgroundColor: APP_COLORS.surface,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconSafe: {
    backgroundColor: APP_COLORS.safeBg,
  },
  locationIconWarning: {
    backgroundColor: APP_COLORS.attentionBg,
  },
  locationIconNeutral: {
    backgroundColor: APP_COLORS.subSurface,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  locationSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 17,
  },
  locationDivider: {
    height: 1,
    backgroundColor: APP_COLORS.borderSubtle,
    marginVertical: 12,
  },
  simulationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simulationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  simulationHint: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  otpSection: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    alignItems: 'center',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  otpSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    top: 0,
    left: 0,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: TOKENS.rounded.md,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpBoxActive: {
    borderColor: APP_COLORS.obsidian,
    backgroundColor: APP_COLORS.surface,
  },
  otpBoxFilled: {
    backgroundColor: APP_COLORS.surface,
    borderColor: APP_COLORS.border,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  otpBoxText: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  otpBoxTextFilled: {
    color: APP_COLORS.text,
  },
  otpBoxTextPlaceholder: {
    color: APP_COLORS.textMuted,
    fontSize: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.shortageBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: TOKENS.rounded.sm,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.shortageText,
    flex: 1,
  },
  keypadContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    height: 52,
    borderRadius: TOKENS.rounded.md,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  keypadKeyText: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  keypadUtilityKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keypadUtilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  keypadBackspaceText: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  submitSection: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_COLORS.safeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(23, 135, 84, 0.2)',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  receiptCard: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: APP_COLORS.surface,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeaderLeft: {
    flex: 1,
  },
  receiptInstitution: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 1.1,
  },
  receiptDepartment: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 1,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: APP_COLORS.borderSubtle,
    marginVertical: 16,
  },
  receiptSubjectBlock: {
    marginBottom: 16,
  },
  receiptSubjectName: {
    fontSize: 19,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  receiptSubjectCode: {
    fontSize: 13,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  receiptInfoGrid: {
    gap: 12,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptInfoItem: {
    flex: 1,
  },
  receiptInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  receiptInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  receiptInfoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successActions: {
    width: '100%',
  },
});
