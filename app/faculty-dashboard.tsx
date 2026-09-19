import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import { notificationService } from '@/services/notificationService';
import { scheduleService } from '@/services/scheduleService';
import type { ClassScheduleItem, DayOfWeek, FacultyDashboardData, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FacultyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<{ day: DayOfWeek; items: ClassScheduleItem[]; isWeekend: boolean } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    const [dashboard, sched, unread] = await Promise.all([
      facultyService.getDashboard(user.id),
      scheduleService.getTodaySchedule(user.id, 'faculty'),
      notificationService.getUnreadCount(),
    ]);

    if (!dashboard) {
      router.replace('/faculty-login' as never);
      return;
    }

    setData(dashboard);
    setTodaySchedule(sched);
    setUnreadNotifications(unread);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        if (mounted) {
          await loadData();
        }
      };

      run();
      const interval = setInterval(run, 4000);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [loadData])
  );

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Faculty Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/' as never);
        },
      },
    ]);
  };

  const handleStartClass = async (subject: Subject) => {
    if (data?.activeSession) {
      Alert.alert(
        'Active Class in Progress',
        'You already have an active class running. Please complete or cancel it before starting a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Active Class',
            onPress: () => router.push('/faculty-active-class' as never),
          },
        ]
      );
      return;
    }

    setLoading(true);
    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.startClass(user.id, subject.id);
    setLoading(false);

    if (result.ok) {
      router.push('/faculty-active-class' as never);
    } else {
      Alert.alert('Unable to Start Attendance', result.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading faculty portal..." />;
  }

  if (!data) {
    return null;
  }

  const { user, faculty, assignedSubjects, activeSession, recentSessions } = data;
  const activeSubject = assignedSubjects.find((s) => s.id === activeSession?.subjectId);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const getSubjectLastSessionInfo = (subjectId: string) => {
    const lastSession = data.recentSessions.find(
      (s) => s.subject.id === subjectId && s.session.status === 'ended'
    );
    if (!lastSession || lastSession.enrolledCount === 0) return null;
    const pct = Math.round((lastSession.presentCount / lastSession.enrolledCount) * 100);
    return `${pct}% Attendance`;
  };

  const getSubjectEnrolledCount = (subjectId: string) => {
    const lastSession = data.recentSessions.find((s) => s.subject.id === subjectId);
    if (lastSession) return lastSession.enrolledCount;
    return 0;
  };

  return (
    <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <IconSymbol size={26} name="building.columns.fill" color={APP_COLORS.primary} />
          <View>
            <Text style={styles.brandTitle}>DU Attend</Text>
            <Text style={styles.portalTag}>FACULTY PORTAL</Text>
          </View>
        </View>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as never)}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <IconSymbol size={18} name="bell.fill" color={APP_COLORS.textSecondary} />
            {unreadNotifications > 0 && <View style={styles.unreadBadgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Sign out"
          >
            <IconSymbol size={18} name="rectangle.portrait.and.arrow.right" color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Faculty Identity & Welcome Context */}
      <View style={styles.contextHero}>
        <Text style={styles.welcomeHeading}>{greeting}, {user.name}</Text>
        <Text style={styles.contextMeta}>
          Faculty ID: {faculty.facultyId} • Department of Computer Science & Applications
        </Text>
      </View>

      {/* High-Priority Active Session Alert */}
      {activeSession ? (
        <Card style={styles.activeBannerCard} padded>
          <View style={styles.activeTopRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE BROADCAST IN PROGRESS</Text>
            </View>
            <StatusBadge status="present" label="STREAMING" size="small" />
          </View>

          <Text style={styles.activeSubjectTitle} numberOfLines={2}>
            {activeSubject?.name ?? 'Live Lecture Session'}
          </Text>
          <Text style={styles.activeSubjectSub}>
            {activeSubject?.code ?? 'BCA'} • CCSA Lecture Hall 1
          </Text>

          <View style={styles.activeOtpBox}>
            <View style={styles.activeOtpRow}>
              <View>
                <Text style={styles.activeOtpLabel}>CURRENT BROADCAST CODE</Text>
                <Text style={styles.activeOtpCode}>{activeSession.otp}</Text>
              </View>
            </View>
            <AppButton
              title="Command Center"
              onPress={() => router.push('/faculty-active-class' as never)}
              variant="primary"
              size="medium"
              icon="arrow.up.right"
              style={styles.commandCenterBtn}
            />
          </View>
        </Card>
      ) : (
        /* Primary Class Starter Button */
        <View style={styles.primaryActionWrap}>
          <AppButton
            title="Start New Attendance Session"
            icon="plus.circle.fill"
            onPress={() => {
              if (assignedSubjects.length === 1) {
                handleStartClass(assignedSubjects[0]);
              } else {
                router.push('/faculty-select-subject' as never);
              }
            }}
            variant="primary"
            size="large"
            style={styles.startClassBtn}
          />
        </View>
      )}

      {/* Operational Teaching Metrics */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{activeSession ? '1 Live' : 'Idle'}</Text>
          <Text style={styles.metricLabel}>Active Class</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Active Class</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{assignedSubjects.length}</Text>
          <Text style={styles.metricLabel}>Assigned Courses</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Courses</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{recentSessions.length}</Text>
          <Text style={styles.metricLabel}>Conducted Classes</Text>
          <Text style={styles.metricValue}>{data.totalConducted ?? recentSessions.length}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Conducted</Text>
        </View>
      </View>

      {/* Today's Teaching Schedule Section */}
      {todaySchedule && todaySchedule.items.length > 0 && (
        <View style={styles.schedulePreviewSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
              TODAY'S SCHEDULE ({todaySchedule.day.toUpperCase()})
            </Text>
            <TouchableOpacity onPress={() => router.push('/faculty-schedule' as never)}>
              <Text style={styles.viewAllLink}>Manage Schedule →</Text>
            </TouchableOpacity>
          </View>

          {todaySchedule.items.map((slot) => {
            const isCancelled = slot.status === 'cancelled';
            const isRescheduled = slot.status === 'rescheduled';
            const isLive = slot.status === 'live';

            return (
              <Card
                key={slot.id}
                style={[
                  styles.todaySlotCard,
                  isCancelled && styles.slotCancelled,
                  isLive && styles.slotLive,
                ]}
                padded
              >
                <View style={styles.slotRow}>
                  <View style={styles.slotTimeWrap}>
                    <Text style={styles.slotTime}>{slot.timeSlot.split(' - ')[0]}</Text>
                    <Text style={styles.slotRoom}>{slot.room}</Text>
                  </View>
                  <View style={styles.slotInfoWrap}>
                    <Text
                      style={[styles.slotSubject, isCancelled && styles.textStrikethrough]}
                      numberOfLines={2}
                    >
                      {slot.subjectName}
                    </Text>
                    <Text style={styles.slotCode}>{slot.subjectCode}</Text>
                    {isCancelled && (
                      <Text style={styles.slotCancelledReason} numberOfLines={1}>
                        Cancelled: {slot.cancellationReason || 'Faculty unavailable'}
                      </Text>
                    )}
                    {isRescheduled && slot.rescheduledTo && (
                      <Text style={styles.slotRescheduledNote} numberOfLines={1}>
                        Moved to: {slot.rescheduledTo.dayOfWeek} ({slot.rescheduledTo.timeSlot})
                      </Text>
                    )}
                  </View>
                  <View style={styles.slotBadgeWrap}>
                    {isLive && <StatusBadge status="present" label="LIVE" size="small" />}
                    {isCancelled && <StatusBadge status="shortage" label="CANCELLED" size="small" />}
                    {isRescheduled && <StatusBadge status="attention" label="MOVED" size="small" />}
                    {!isLive && !isCancelled && !isRescheduled && (
                      <StatusBadge status="safe" label="UPCOMING" size="small" />
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Assigned Subjects Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>ASSIGNED COURSES</Text>
        <Text style={styles.sectionCounter}>{assignedSubjects.length} Total</Text>
      </View>

      {assignedSubjects.length === 0 ? (
        <Card style={styles.emptySubjectCard} padded>
          <IconSymbol size={28} name="book" color={APP_COLORS.textMuted} />
          <Text style={styles.emptySubjectText}>No courses assigned to your faculty profile.</Text>
        </Card>
      ) : (
        assignedSubjects.map((subject) => {
          const lastSessionInfo = getSubjectLastSessionInfo(subject.id);
          const enrolledCount = getSubjectEnrolledCount(subject.id);
          const isCurrentActive = activeSession?.subjectId === subject.id;

          return (
            <Card key={subject.id} style={styles.courseCard} padded>
              <View style={styles.courseTopRow}>
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>{subject.code}</Text>
                </View>
                <Text style={styles.enrolledText}>{enrolledCount} Students Enrolled</Text>
              </View>

              <Text style={styles.courseTitle} numberOfLines={2}>
                {subject.name}
              </Text>

              <View style={styles.courseBottomRow}>
                <View style={styles.lastSessionWrap}>
                  <Text style={styles.lastSessionLabel}>Recent Participation</Text>
                  <Text style={[styles.lastSessionValue, lastSessionInfo && { color: APP_COLORS.safeText }]}>
                    {lastSessionInfo ?? 'No sessions yet'}
                  </Text>
                </View>

                {isCurrentActive ? (
                  <AppButton
                    title="Live Now"
                    onPress={() => router.push('/faculty-active-class' as never)}
                    variant="primary"
                    size="small"
                    icon="arrow.up.right"
                  />
                ) : (
                  <AppButton
                    title="Start Attendance"
                    onPress={() => handleStartClass(subject)}
                    variant="secondary"
                    size="small"
                    icon="play.fill"
                  />
                )}
              </View>
            </Card>
          );
        })
      )}

      {/* Quick Operational Modules */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>FACULTY SERVICES</Text>
      </View>

      <View style={styles.modulesGrid}>
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/notifications' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.moduleIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <IconSymbol size={20} name="bell.fill" color="#3B82F6" />
          </View>
          <View style={styles.moduleTextWrap}>
            <Text style={styles.moduleTitle}>Notifications & Alerts</Text>
            <Text style={styles.moduleSubtitle}>Review schedule updates and alerts</Text>
          </View>
          <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/faculty-schedule' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.moduleIconWrap, { backgroundColor: '#FFF7ED' }]}>
            <IconSymbol size={20} name="calendar" color={APP_COLORS.secondaryWarm} />
          </View>
          <View style={styles.moduleTextWrap}>
            <Text style={styles.moduleTitle}>Teaching Schedule</Text>
            <Text style={styles.moduleSubtitle}>Cancel, reschedule & manage class slots</Text>
          </View>
          <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/faculty-reports' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.moduleIconWrap, { backgroundColor: APP_COLORS.categoryBg }]}>
            <IconSymbol size={20} name="chart.bar.fill" color={APP_COLORS.categoryText} />
          </View>
          <View style={styles.moduleTextWrap}>
            <Text style={styles.moduleTitle}>Attendance Reports</Text>
            <Text style={styles.moduleSubtitle}>Export CSV sheets & student averages</Text>
          </View>
          <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/faculty-history' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.moduleIconWrap, { backgroundColor: APP_COLORS.safeBg }]}>
            <IconSymbol size={20} name="clock.arrow.circlepath" color={APP_COLORS.safeText} />
          </View>
          <View style={styles.moduleTextWrap}>
            <Text style={styles.moduleTitle}>Session History</Text>
            <Text style={styles.moduleSubtitle}>Audit and review conducted classes</Text>
          </View>
          <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Recent Sessions Timeline */}
      {recentSessions.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>RECENTLY CONDUCTED CLASSES</Text>
            <TouchableOpacity onPress={() => router.push('/faculty-history' as never)}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.slice(0, 4).map((report) => (
            <Card key={report.session.id} style={styles.recentSessionCard} padded>
              <View style={styles.recentSessionHeader}>
                <Text style={styles.recentSessionTitle} numberOfLines={1}>
                  {report.subject.name}
                </Text>
                <View style={styles.recentTurnoutPill}>
                  <Text style={styles.recentTurnoutText}>
                    {report.presentCount}/{report.enrolledCount} Present
                  </Text>
                </View>
              </View>
              <Text style={styles.recentSessionTime}>
                {new Date(report.session.startedAt).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                •{' '}
                {new Date(report.session.startedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Card>
          ))}
        </View>
      )}

      <Text style={styles.disclaimerText}>
        Independent demo prototype. Not an official Dibrugarh University application.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TOKENS.spacing.md,
    paddingTop: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  portalTag: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
    letterSpacing: 0.8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primary,
  },
  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  contextHero: {
    marginBottom: TOKENS.spacing.lg,
  },
  welcomeHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  contextMeta: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    lineHeight: 18,
  },
  activeBannerCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primaryWarm,
    marginBottom: TOKENS.spacing.lg,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.8,
  },
  activeSubjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  activeSubjectSub: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 14,
  },
  activeOtpBox: {
    backgroundColor: APP_COLORS.subSurface,
    padding: 14,
    borderRadius: TOKENS.rounded.md,
    gap: 12,
  },
  activeOtpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commandCenterBtn: {
    width: '100%',
  },
  activeOtpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  activeOtpCode: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 3,
  },
  primaryActionWrap: {
    marginBottom: TOKENS.spacing.lg,
  },
  startClassBtn: {
    width: '100%',
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: TOKENS.spacing.xl,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  metricItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: APP_COLORS.borderSubtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  sectionCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  emptySubjectCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: TOKENS.spacing.lg,
  },
  emptySubjectText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 8,
  },
  courseCard: {
    marginBottom: TOKENS.spacing.md,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
  },
  courseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.xs,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  enrolledText: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textMuted,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  courseBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  lastSessionWrap: {
    flex: 1,
  },
  lastSessionLabel: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
  },
  lastSessionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 1,
  },
  modulesGrid: {
    gap: 10,
    marginBottom: TOKENS.spacing.xl,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    padding: 14,
    borderRadius: TOKENS.rounded.lg,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    gap: 12,
  },
  moduleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextWrap: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  recentSection: {
    marginBottom: TOKENS.spacing.lg,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.primaryWarm,
  },
  recentSessionCard: {
    marginBottom: 8,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
  },
  recentSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  recentTurnoutPill: {
    backgroundColor: APP_COLORS.safeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  recentTurnoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.safeText,
  },
  recentSessionTime: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  schedulePreviewSection: {
    marginBottom: TOKENS.spacing.lg,
  },
  todaySlotCard: {
    marginBottom: 8,
    borderRadius: TOKENS.rounded.md,
    backgroundColor: APP_COLORS.surface,
  },
  slotCancelled: {
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    backgroundColor: '#FFFDFD',
  },
  slotLive: {
    borderColor: APP_COLORS.primaryWarm,
    borderWidth: 1.5,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotTimeWrap: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.subSurface,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: TOKENS.rounded.sm,
  },
  slotTime: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
  },
  slotRoom: {
    fontSize: 9,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  slotInfoWrap: {
    flex: 1,
    minWidth: 0,
  },
  slotSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  slotCode: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 1,
  },
  slotCancelledReason: {
    fontSize: 10,
    color: APP_COLORS.danger,
    fontWeight: '600',
    marginTop: 2,
  },
  slotRescheduledNote: {
    fontSize: 10,
    color: APP_COLORS.attentionText,
    fontWeight: '600',
    marginTop: 2,
  },
  slotBadgeWrap: {
    flexShrink: 0,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: APP_COLORS.textMuted,
  },
});
