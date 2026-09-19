import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, GEOFENCE_CONFIG, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { APP_COLORS, GEOFENCE_CONFIG, OTP_CONFIG, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { cloudService } from '@/services/cloudService';
import type { FacultySessionReport } from '@/types/models';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FacultyActiveClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const [report, setReport] = useState<FacultySessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'unmarked' | 'absent'>('all');

  const loadSession = useCallback(async () => {
    const user = await authService.getActiveUser();
    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    // Check if subjectId was passed and no active session exists yet
    let activeSession = await attendanceService.getActiveSessionForFaculty(user.id);

    if (!activeSession && params.subjectId) {
      const startRes = await attendanceService.startClass(user.id, params.subjectId);
      if (startRes.ok && startRes.data) {
        activeSession = startRes.data;
      }
    }

    if (!activeSession) {
      setReport(null);
      setLoading(false);
      return;
    }

    const sessionReport = await attendanceService.getSessionReport(activeSession.id);
    setReport(sessionReport);

    if (sessionReport) {
      setSecondsLeft(attendanceService.getSecondsRemaining(sessionReport.session));
    }
    setLoading(false);
  }, [params.subjectId, router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        if (active) {
          await loadSession();
        }
      };

      run();

      // Poll every 2 seconds for live submissions from students
      const pollInterval = setInterval(run, 2000);

      return () => {
        active = false;
        clearInterval(pollInterval);
      };
    }, [loadSession])
  );

  // Local second countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Real-time student attendance submission listener from cloud
  useEffect(() => {
    if (!report?.session.id || !cloudService.isOnline()) return;

    const unsubscribe = cloudService.subscribeToSessionRoster(report.session.id, () => {
      loadSession();
    });

    return () => {
      unsubscribe();
    };
  }, [report?.session.id, loadSession]);

  const handleRegenerateOtp = async () => {
    if (!report) return;

    setActionLoading(true);
    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.regenerateOtp(user.id, report.session.id);
    setActionLoading(false);

    if (result.ok && result.data) {
      setSecondsLeft(attendanceService.getSecondsRemaining(result.data));
      await loadSession();
      Alert.alert('New OTP Active', 'A new 6-digit OTP has been generated for 60 seconds.');
      Alert.alert(
        'New OTP Active',
        `A new 6-digit OTP has been generated for ${Math.round(OTP_CONFIG.expiresInSeconds / 60)} minutes.`
      );
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleMarkManual = async (studentId: string, status: 'present' | 'absent') => {
    if (!report) return;

    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.markManual(user.id, report.session.id, studentId, status);
    if (result.ok) {
      await loadSession();
    } else {
      Alert.alert('Unable to mark attendance', result.message);
    }
  };

  const handleEndClass = () => {
    if (!report) return;

    const unmarkedCount = report.unmarkedCount;

    Alert.alert(
      'End Class & Finalize Attendance',
      unmarkedCount > 0
        ? `Are you sure? ${unmarkedCount} unmarked student${unmarkedCount === 1 ? '' : 's'} will be recorded as Absent. OTP will be immediately invalidated.`
        : 'Are you sure you want to end this class session? The OTP will be invalidated and attendance finalized.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const user = await authService.getActiveUser();
            if (!user) return;

            const result = await attendanceService.endClass(user.id, report.session.id);
            setActionLoading(false);

            if (result.ok) {
              Alert.alert('Class Finalized', 'Class ended successfully. Attendance records have been saved.');
              router.replace('/faculty-dashboard' as never);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleCancelClass = () => {
    if (!report) return;

    Alert.alert(
      'Cancel Class',
      'Canceling will invalidate the OTP and exclude this session from conducted class totals. No attendance will be counted. Are you sure?',
      [
        { text: 'Keep Class', style: 'cancel' },
        {
          text: 'Cancel Class',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const user = await authService.getActiveUser();
            if (!user) return;

            const result = await attendanceService.cancelClass(user.id, report.session.id);
            setActionLoading(false);

            if (result.ok) {
              Alert.alert('Class Cancelled', 'Session was cancelled and excluded from class totals.');
              router.replace('/faculty-dashboard' as never);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  // Filter and search roster
  const filteredRoster = useMemo(() => {
    if (!report) return [];

    return report.roster.filter((item) => {
      // Status filter
      const itemStatus = item.record?.status || 'unmarked';
      if (statusFilter === 'present' && itemStatus !== 'present') return false;
      if (statusFilter === 'absent' && itemStatus !== 'absent') return false;
      if (statusFilter === 'unmarked' && itemStatus !== 'unmarked') return false;

      // Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.user.name.toLowerCase().includes(query);
        const matchesId = item.student.studentId.toLowerCase().includes(query);
        return matchesName || matchesId;
      }

      return true;
    });
  }, [report, statusFilter, searchQuery]);

  if (loading) {
    return <LoadingState message="Loading live attendance command center..." />;
  }

  if (!report) {
    return (
      <AppScreen>
        {/* Top bar back */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/faculty-dashboard' as never)}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            activeOpacity={0.7}
          >
            <IconSymbol size={20} name="chevron.left" color={APP_COLORS.text} />
          </TouchableOpacity>
          <View style={styles.navTitles}>
            <Text style={styles.navTitle}>Active Class</Text>
            <Text style={styles.navSubtitle}>Session Command Center</Text>
          </View>
        </View>

        <View style={styles.noActiveCard}>
          <View style={styles.noActiveIconCircle}>
            <IconSymbol size={36} name="tray" color={APP_COLORS.textMuted} />
          </View>
          <Text style={styles.noActiveTitle}>No Active Class Session</Text>
          <Text style={styles.noActiveDesc}>
            You do not currently have any live attendance class running. Select a course to launch an OTP.
          </Text>
          <AppButton
            title="Start Attendance"
            onPress={() => router.replace('/faculty-select-subject' as never)}
            variant="primary"
            style={styles.startClassBtn}
          />
        </View>
      </AppScreen>
    );
  }

  const isExpired = secondsLeft <= 0;
  const isUrgent = !isExpired && secondsLeft <= 15;
  const turnoutPercent = report.enrolledCount > 0
    ? Math.round((report.presentCount / report.enrolledCount) * 100)
    : 0;

  // Format OTP as 3-digit clusters (e.g. "482 — 716")
  const rawOtp = report.session.otp || '000000';
  const otpPart1 = rawOtp.slice(0, 3);
  const otpPart2 = rawOtp.slice(3, 6);

  const formattedStartTime = new Date(report.session.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AppScreen scrollable>
      {/* Top Command Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/faculty-dashboard' as never)}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="chevron.left" color={APP_COLORS.text} />
        </TouchableOpacity>
        <View style={styles.navTitles}>
          <View style={styles.liveBadgeRow}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>LIVE COMMAND CENTER</Text>
          </View>
          <Text style={styles.navTitle} numberOfLines={1}>
            {report.subject.name}
          </Text>
        </View>
      </View>

      {/* Session Metadata Context Card */}
      <View style={styles.contextCard}>
        <View style={styles.contextRow}>
          <View style={styles.codePill}>
            <Text style={styles.codePillText}>{report.subject.code}</Text>
          </View>
          <View style={styles.contextItem}>
            <IconSymbol size={13} name="mappin.and.ellipse" color={APP_COLORS.textSecondary} />
            <Text style={styles.contextItemText}>{GEOFENCE_CONFIG.classroomName}</Text>
          </View>
          <View style={styles.contextItem}>
            <IconSymbol size={13} name="clock.fill" color={APP_COLORS.textSecondary} />
            <Text style={styles.contextItemText}>Started {formattedStartTime}</Text>
          </View>
        </View>

        <View style={styles.syncRow}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Realtime sync active (2s auto-refresh)</Text>
          <View style={[styles.syncDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.syncText}>🟢 Live Cloud Sync Active (Supabase Connected)</Text>
        </View>
      </View>

      {/* Podium-Grade Tactile OTP Broadcast Display */}
      <View style={[
        styles.otpCard,
        isExpired && styles.otpCardExpired,
        isUrgent && styles.otpCardUrgent,
      ]}>
        <View style={styles.otpHeader}>
          <View style={styles.otpHeaderLeft}>
            <IconSymbol
              size={16}
              name="broadcast.tower"
              color={isExpired ? APP_COLORS.danger : isUrgent ? APP_COLORS.warning : APP_COLORS.primaryWarm}
            />
            <Text style={styles.otpHeaderLabel}>BROADCAST VERIFICATION CODE</Text>
          </View>
          <View style={[
            styles.statusPill,
            isExpired ? styles.statusPillExpired : isUrgent ? styles.statusPillUrgent : styles.statusPillActive,
          ]}>
            <Text style={[
              styles.statusPillText,
              isExpired ? styles.statusTextExpired : isUrgent ? styles.statusTextUrgent : styles.statusTextActive,
            ]}>
              {isExpired ? 'EXPIRED' : isUrgent ? 'ROTATING SOON' : '60S ROTATION'}
              {isExpired ? 'EXPIRED' : isUrgent ? 'ROTATING SOON' : `${Math.round(OTP_CONFIG.expiresInSeconds / 60)}M WINDOW`}
            </Text>
          </View>
        </View>

        {/* Big Tabular OTP Digits Display */}
        <View style={styles.otpDisplayArea}>
          {isExpired ? (
            <View style={styles.expiredArea}>
              <IconSymbol size={32} name="lock.slash.fill" color={APP_COLORS.danger} />
              <Text style={styles.expiredMainText}>OTP EXPIRED</Text>
              <Text style={styles.expiredSubText}>Tap rotate below to issue a fresh 60s code</Text>
              <Text style={styles.expiredSubText}>Tap rotate below to issue a fresh verification code</Text>
            </View>
          ) : (
            <View style={styles.digitsRow}>
              <View style={styles.digitCluster}>
                <Text style={styles.digitText}>{otpPart1}</Text>
              </View>
              <View style={styles.digitDivider}>
                <Text style={styles.dividerDash}>—</Text>
              </View>
              <View style={styles.digitCluster}>
                <Text style={styles.digitText}>{otpPart2}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Horizontal Countdown Meter */}
        {!isExpired && (
          <View style={styles.meterContainer}>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${Math.max(0, Math.min(100, (secondsLeft / 60) * 100))}%` },
                  { width: `${Math.max(0, Math.min(100, (secondsLeft / OTP_CONFIG.expiresInSeconds) * 100))}%` },
                  isUrgent && styles.meterFillUrgent,
                ]}
              />
            </View>
            <View style={styles.meterLabelRow}>
              <Text style={styles.meterHelpText}>Project or share with present students</Text>
              <View style={styles.timerBadge}>
                <IconSymbol
                  size={12}
                  name="timer"
                  color={isUrgent ? APP_COLORS.warning : APP_COLORS.textSecondary}
                />
                <Text style={[styles.timerSecText, isUrgent && styles.timerSecUrgent]}>
                  {secondsLeft}s remaining
                  {Math.floor(secondsLeft / 60) > 0 ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s remaining` : `${secondsLeft}s remaining`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Rotate / Regenerate CTA */}
        <View style={styles.otpActionRow}>
          <AppButton
            title={isExpired ? 'Generate New OTP (60s)' : 'Rotate Code (New OTP)'}
            onPress={handleRegenerateOtp}
            loading={actionLoading}
            variant={isExpired ? 'primary' : 'outline'}
            size="medium"
            style={styles.rotateBtn}
          />
        </View>
      </View>

      {/* Operational Metrics Cluster */}
      <View style={styles.metricsCluster}>
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel}>TURNOUT</Text>
          <Text style={styles.metricValue}>{turnoutPercent}%</Text>
          <Text style={styles.metricSub}>{report.presentCount} of {report.enrolledCount}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricTile}>
          <Text style={[styles.metricLabel, { color: APP_COLORS.success }]}>PRESENT</Text>
          <Text style={[styles.metricValue, { color: APP_COLORS.success }]}>{report.presentCount}</Text>
          <Text style={styles.metricSub}>Recorded</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricTile}>
          <Text style={[styles.metricLabel, { color: APP_COLORS.textSecondary }]}>PENDING</Text>
          <Text style={[styles.metricValue, { color: APP_COLORS.textSecondary }]}>{report.unmarkedCount}</Text>
          <Text style={styles.metricSub}>Unmarked</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricTile}>
          <Text style={[styles.metricLabel, { color: APP_COLORS.danger }]}>ABSENT</Text>
          <Text style={[styles.metricValue, { color: APP_COLORS.danger }]}>{report.absentCount}</Text>
          <Text style={styles.metricSub}>Explicit</Text>
        </View>
      </View>

      {/* Segmented Turnout Visual Bar */}
      <View style={styles.segmentedBar}>
        <View
          style={[
            styles.segmentPresent,
            { flex: Math.max(0.001, report.presentCount) },
          ]}
        />
        <View
          style={[
            styles.segmentAbsent,
            { flex: Math.max(0.001, report.absentCount) },
          ]}
        />
        <View
          style={[
            styles.segmentUnmarked,
            { flex: Math.max(0.001, report.unmarkedCount) },
          ]}
        />
      </View>

      {/* Student Roster Section Header */}
      <View style={styles.rosterSectionHeader}>
        <View style={styles.rosterTitleBox}>
          <Text style={styles.rosterTitle}>STUDENT ATTENDANCE ROSTER</Text>
          <Text style={styles.rosterSubtitle}>
            Live OTP check-ins & instant manual overrides ({filteredRoster.length} of {report.roster.length})
          </Text>
        </View>
      </View>

      {/* Search & Status Filter Controls */}
      <View style={styles.filterToolbar}>
        {/* Search input */}
        <View style={styles.searchBox}>
          <IconSymbol size={16} name="magnifyingglass" color={APP_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student by name or ID..."
            placeholderTextColor={APP_COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(
            [
              { key: 'all', label: `All (${report.roster.length})` },
              { key: 'present', label: `Present (${report.presentCount})` },
              { key: 'unmarked', label: `Pending (${report.unmarkedCount})` },
              { key: 'absent', label: `Absent (${report.absentCount})` },
            ] as const
          ).map((filter) => {
            const isSelected = statusFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setStatusFilter(filter.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Roster Table / List */}
      <View style={styles.rosterList}>
        {filteredRoster.length === 0 ? (
          <View style={styles.rosterEmpty}>
            <Text style={styles.rosterEmptyText}>No students match this filter.</Text>
          </View>
        ) : (
          filteredRoster.map((item, index) => {
            const status = item.record?.status || 'unmarked';
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            const isUnmarked = status === 'unmarked';
            const isEven = index % 2 === 0;

            return (
              <View
                key={item.student.id}
                style={[styles.studentCard, isEven && styles.studentCardEven]}
              >
                {/* Student Info */}
                <View style={styles.studentInfo}>
                  <View style={styles.studentHeaderRow}>
                    <View style={styles.rollBadge}>
                      <Text style={styles.rollBadgeText}>{item.student.studentId}</Text>
                    </View>
                    {item.record?.markedBy && (
                      <View style={[
                        styles.methodBadge,
                        item.record.markedBy === 'otp' ? styles.methodOtp : styles.methodManual,
                      ]}>
                        <Text style={[
                          styles.methodBadgeText,
                          item.record.markedBy === 'otp' ? styles.methodOtpText : styles.methodManualText,
                        ]}>
                          {item.record.markedBy === 'otp' ? 'OTP VERIFIED' : 'MANUAL OVERRIDE'}
                        </Text>
                      </View>
                    )}
                    {isUnmarked && (
                      <View style={styles.methodPending}>
                        <Text style={styles.methodPendingText}>PENDING</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.user.name}
                  </Text>
                </View>

                {/* Manual 1-Tap Toggle Action Buttons */}
                <View style={styles.rosterActionGroup}>
                  <TouchableOpacity
                    style={[
                      styles.actionToggleBtn,
                      styles.presentToggleBtn,
                      isPresent && styles.presentToggleActive,
                    ]}
                    onPress={() => handleMarkManual(item.student.id, 'present')}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${item.user.name} Present`}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      size={14}
                      name="checkmark"
                      color={isPresent ? '#FFFFFF' : APP_COLORS.success}
                    />
                    <Text
                      style={[
                        styles.actionToggleText,
                        styles.presentToggleText,
                        isPresent && styles.activeToggleText,
                      ]}
                    >
                      Present
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionToggleBtn,
                      styles.absentToggleBtn,
                      isAbsent && styles.absentToggleActive,
                    ]}
                    onPress={() => handleMarkManual(item.student.id, 'absent')}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${item.user.name} Absent`}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      size={14}
                      name="xmark"
                      color={isAbsent ? '#FFFFFF' : APP_COLORS.danger}
                    />
                    <Text
                      style={[
                        styles.actionToggleText,
                        styles.absentToggleText,
                        isAbsent && styles.activeToggleText,
                      ]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Session Finalization Section */}
      <View style={styles.finalizationSection}>
        <View style={styles.finalizationHeader}>
          <Text style={styles.finalizationTitle}>SESSION FINALIZATION</Text>
          <Text style={styles.finalizationNote}>
            Ending the class invalidates the OTP and records all unmarked students as Absent.
          </Text>
        </View>

        <AppButton
          title="End Class & Finalize Attendance"
          onPress={handleEndClass}
          loading={actionLoading}
          variant="primary"
          size="large"
          style={styles.endClassBtn}
        />

        <TouchableOpacity
          style={styles.cancelSessionBtn}
          onPress={handleCancelClass}
          disabled={actionLoading}
          activeOpacity={0.7}
        >
          <IconSymbol size={15} name="trash.fill" color={APP_COLORS.danger} />
          <Text style={styles.cancelSessionText}>Cancel Session (Discard Without Saving)</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: TOKENS.spacing.md,
    paddingTop: TOKENS.spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...TOKENS.shadows.subtle,
  },
  navTitles: {
    flex: 1,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.success,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.success,
    letterSpacing: 1.1,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
  },
  navSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  contextCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
    paddingHorizontal: TOKENS.spacing.base,
    paddingVertical: 10,
    marginBottom: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 71, 0.2)',
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.safeText,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '500',
    color: APP_COLORS.textMuted,
  },
  otpCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.lg,
    marginBottom: TOKENS.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 94, 54, 0.4)',
    ...TOKENS.shadows.subtle,
  },
  otpCardExpired: {
    borderColor: APP_COLORS.danger,
    backgroundColor: '#FFFBFB',
  },
  otpCardUrgent: {
    borderColor: APP_COLORS.warning,
    backgroundColor: '#FFFDF9',
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  otpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  otpHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  statusPillActive: {
    backgroundColor: APP_COLORS.categoryBg,
  },
  statusPillUrgent: {
    backgroundColor: APP_COLORS.attentionBg,
  },
  statusPillExpired: {
    backgroundColor: APP_COLORS.shortageBg,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTextActive: {
    color: APP_COLORS.categoryText,
  },
  statusTextUrgent: {
    color: APP_COLORS.warning,
  },
  statusTextExpired: {
    color: APP_COLORS.danger,
  },
  otpDisplayArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  digitCluster: {
    backgroundColor: APP_COLORS.canvas,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  digitText: {
    fontSize: 38,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  digitDivider: {
    paddingHorizontal: 2,
  },
  dividerDash: {
    fontSize: 28,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
  },
  expiredArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  expiredMainText: {
    fontSize: 26,
    fontWeight: '800',
    color: APP_COLORS.danger,
    letterSpacing: 2,
    marginTop: 6,
  },
  expiredSubText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
  },
  meterContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  meterTrack: {
    height: 6,
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: APP_COLORS.primaryWarm,
    borderRadius: 3,
  },
  meterFillUrgent: {
    backgroundColor: APP_COLORS.warning,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  meterHelpText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerSecText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  timerSecUrgent: {
    color: APP_COLORS.warning,
  },
  otpActionRow: {
    marginTop: 4,
  },
  rotateBtn: {
    width: '100%',
  },
  metricsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: APP_COLORS.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: APP_COLORS.border,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: TOKENS.spacing.lg,
    backgroundColor: APP_COLORS.subSurface,
  },
  segmentPresent: {
    backgroundColor: APP_COLORS.success,
  },
  segmentAbsent: {
    backgroundColor: APP_COLORS.danger,
  },
  segmentUnmarked: {
    backgroundColor: APP_COLORS.subSurface,
  },
  rosterSectionHeader: {
    marginBottom: TOKENS.spacing.sm,
  },
  rosterTitleBox: {
    gap: 2,
  },
  rosterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.1,
  },
  rosterSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  filterToolbar: {
    gap: 10,
    marginBottom: TOKENS.spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: APP_COLORS.text,
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterChipSelected: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  rosterList: {
    gap: 8,
    marginBottom: TOKENS.spacing.xl,
  },
  rosterEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  rosterEmptyText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  studentCardEven: {
    backgroundColor: '#FAFBFC',
  },
  studentInfo: {
    flex: 1,
    paddingRight: 10,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rollBadge: {
    backgroundColor: APP_COLORS.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodOtp: {
    backgroundColor: APP_COLORS.safeBg,
  },
  methodManual: {
    backgroundColor: APP_COLORS.subSurface,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  methodOtpText: {
    color: APP_COLORS.success,
  },
  methodManualText: {
    color: APP_COLORS.textSecondary,
  },
  methodPending: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodPendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  rosterActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presentToggleBtn: {
    backgroundColor: APP_COLORS.safeBg,
    borderColor: 'rgba(23, 135, 84, 0.3)',
  },
  presentToggleActive: {
    backgroundColor: APP_COLORS.success,
    borderColor: APP_COLORS.success,
  },
  absentToggleBtn: {
    backgroundColor: APP_COLORS.shortageBg,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  absentToggleActive: {
    backgroundColor: APP_COLORS.danger,
    borderColor: APP_COLORS.danger,
  },
  actionToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presentToggleText: {
    color: APP_COLORS.success,
  },
  absentToggleText: {
    color: APP_COLORS.danger,
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  finalizationSection: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.base,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.xxxl,
    gap: 12,
    ...TOKENS.shadows.subtle,
  },
  finalizationHeader: {
    gap: 2,
  },
  finalizationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.1,
  },
  finalizationNote: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    lineHeight: 16,
  },
  endClassBtn: {
    width: '100%',
  },
  cancelSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  cancelSessionText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.danger,
  },
  noActiveCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  noActiveIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_COLORS.subSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noActiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 6,
  },
  noActiveDesc: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  startClassBtn: {
    width: '100%',
  },
});