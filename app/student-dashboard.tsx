import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { AttendanceSafetyCard } from '@/components/app/AttendanceSafetyCard';
import { Card } from '@/components/app/Card';
import { CircularProgress } from '@/components/app/CircularProgress';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { cloudService } from '@/services/cloudService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, ClassScheduleItem, DayOfWeek, StudentDashboardData, SubjectAttendanceSummary } from '@/types/models';
import { calculateAttendanceAdvice } from '@/utils/format';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

export default function StudentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<{ day: DayOfWeek; items: ClassScheduleItem[]; isWeekend: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'student') {
      router.replace('/student-login' as never);
      return;
    }

    const [dashboard, liveSessions, schedule] = await Promise.all([
      studentService.getDashboard(user.id),
      attendanceService.getActiveSessionsForStudent(user.id),
      studentService.getTodaySchedule(user.id),
    ]);

    if (!dashboard) {
      router.replace('/student-login' as never);
      return;
    }

    setData(dashboard);
    setActiveSessions(liveSessions);
    setTodaySchedule(schedule);
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

      // Subscribe to real-time session changes from cloud if online
      const unsubscribeCloud = cloudService.subscribeToActiveSessions(() => {
        if (mounted) {
          run();
        }
      });

      // Check for active classes every 5 seconds while on dashboard as safety heartbeat
      const interval = setInterval(run, 5000);

      return () => {
        mounted = false;
        unsubscribeCloud();
        clearInterval(interval);
      };
    }, [loadData])
  );

  if (loading || !data) {
    return <LoadingState message="Loading your attendance dashboard..." />;
  }

  const { user, student, programme, semester, subjects, overall } = data;
  const hasLiveClass = activeSessions.length > 0;
  const liveSubjectSummary = hasLiveClass
    ? subjects.find((s) => s.subject.id === activeSessions[0]?.subjectId)
    : null;
  const liveSubjectName = liveSubjectSummary?.subject.name ?? 'Ongoing Class';
  const liveSubjectCode = liveSubjectSummary?.subject.code ?? '';
  const liveFacultyName = liveSubjectSummary?.facultyName ?? 'Faculty Instructor';

  // Greeting based on current hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Quick Action Services config
  const QUICK_SERVICES: {
    id: string;
    label: string;
    icon: IconSymbolName;
    route?: string;
    bgTint: string;
    iconColor: string;
  }[] = [
    {
      id: 'otp',
      label: 'Mark OTP',
      icon: 'key.fill',
      route: '/student-mark-attendance',
      bgTint: '#FFF1ED',
      iconColor: APP_COLORS.primaryWarm,
    },
    {
      id: 'schedule',
      label: 'Timetable',
      icon: 'calendar',
      route: '/student-schedule',
      bgTint: '#FFF7ED',
      iconColor: APP_COLORS.secondaryWarm,
    },
    {
      id: 'subjects',
      label: 'My Courses',
      icon: 'book.fill',
      route: '/student-subjects',
      bgTint: APP_COLORS.categoryBg,
      iconColor: APP_COLORS.categoryText,
    },
    {
      id: 'history',
      label: 'History',
      icon: 'clock.fill',
      route: '/student-history',
      bgTint: APP_COLORS.subSurface,
      iconColor: APP_COLORS.obsidian,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: 'person.fill',
      route: '/student-profile',
      bgTint: APP_COLORS.subSurface,
      iconColor: APP_COLORS.textSecondary,
    },
    {
      id: 'updates',
      label: 'In-App Sync',
      icon: 'arrow.clockwise',
      route: '/student-profile',
      bgTint: '#EEFAF4',
      iconColor: APP_COLORS.safeText,
    },
  ];

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        {/* 1. Aurora Hero Header Section */}
        <View style={[styles.heroContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Subtle Organic Aurora Mesh Gradient */}
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="auroraGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                <Stop offset="0%" stopColor="#FF552E" />
                <Stop offset="45%" stopColor="#FF7043" />
                <Stop offset="100%" stopColor="#FFA133" />
              </LinearGradient>
              <RadialGradient id="auroraGlow" cx="85%" cy="15%" rx="65%" ry="65%">
                <Stop offset="0%" stopColor="#FFD180" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#FF552E" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#auroraGrad)" rx={28} />
            <Rect width="100%" height="100%" fill="url(#auroraGlow)" rx={28} />
          </Svg>

          {/* Hero Top Navigation Bar */}
          <View style={styles.heroTopBar}>
            <View style={styles.heroBrandWrap}>
              <View style={styles.heroLogoCircle}>
                <IconSymbol size={18} name="graduationcap.fill" color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.heroBrandTitle}>DU Attend</Text>
                <Text style={styles.heroBrandSubtitle}>Dibrugarh University</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.heroProfileBtn}
              onPress={() => router.push('/student-profile' as never)}
              activeOpacity={0.8}
            >
              <IconSymbol size={18} name="person.fill" color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Welcome Greeting & Student Identity */}
          <View style={styles.heroGreetingArea}>
            <Text style={styles.heroGreetingLabel}>{greeting} 👋,</Text>
            <Text style={styles.heroStudentName} numberOfLines={1}>
              {user.name}
            </Text>

            {/* Academic Context Pills */}
            <View style={styles.heroAcademicPillsRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{student.studentId}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  {programme?.name ?? 'BCA'} • {semester?.name ?? '1st Sem'}
                </Text>
              </View>
            </View>
          </View>

          {/* Overlapping Floating Status Pill */}
          <TouchableOpacity
            style={styles.heroFloatingAlert}
            onPress={() => {
              if (hasLiveClass) {
                router.push('/student-mark-attendance' as never);
              } else {
                router.push('/student-schedule' as never);
              }
            }}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.heroAlertIconBox,
                hasLiveClass ? styles.heroAlertIconBoxLive : styles.heroAlertIconBoxCalm,
              ]}
            >
              <IconSymbol
                size={16}
                name={hasLiveClass ? 'dot.radiowaves.left.and.right' : 'checkmark.shield.fill'}
                color={hasLiveClass ? APP_COLORS.primaryWarm : APP_COLORS.safeText}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroAlertTitle} numberOfLines={1}>
                {hasLiveClass ? `Class Live: ${liveSubjectName}` : 'All Caught Up • No live class now'}
              </Text>
              <Text style={styles.heroAlertSub}>
                {hasLiveClass ? 'Tap to submit your 6-digit OTP' : 'View full weekly timetable'}
              </Text>
            </View>

            <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 2. Floating Attendance Summary Card (Master Visual Focal Point) */}
        <View style={styles.overallFloatingCard}>
          <View style={styles.overallHeader}>
            <View>
              <Text style={styles.overallKicker}>OVERALL ATTENDANCE</Text>
              <Text style={styles.overallSubhead}>BCA 1st Semester Standing</Text>
            </View>
            <StatusBadge status={overall.standing === 'none' ? 'good' : overall.standing} size="small" />
          </View>

          {/* Prominent Metric & Circular Ring Row */}
          <View style={styles.overallMetricRow}>
            <View style={styles.overallScoreArea}>
              <View style={styles.overallScoreWrap}>
                <Text style={styles.overallScoreNumber}>{overall.percentage || 0}</Text>
                <Text style={styles.overallScorePercent}>%</Text>
              </View>
              <Text style={styles.overallThresholdHint}>
                Dibrugarh Univ min 75% required
              </Text>
            </View>

            <View style={styles.overallGaugeArea}>
              <CircularProgress
                progress={overall.percentage || 0}
                standing={overall.standing === 'none' ? 'good' : overall.standing}
                radius={48}
                strokeWidth={9}
                centerContent="icon"
              />
            </View>
          </View>

          {/* Supporting 3-Column Stats Strip */}
          <View style={styles.statCountersStrip}>
            <View style={styles.statCounterCell}>
              <Text style={styles.statCounterNum}>{overall.attended}</Text>
              <Text style={styles.statCounterDesc}>Attended</Text>
            </View>
            <View style={styles.statCounterDivider} />
            <View style={styles.statCounterCell}>
              <Text style={styles.statCounterNum}>{overall.missed}</Text>
              <Text style={styles.statCounterDesc}>Missed</Text>
            </View>
            <View style={styles.statCounterDivider} />
            <View style={styles.statCounterCell}>
              <Text style={styles.statCounterNum}>{overall.conducted}</Text>
              <Text style={styles.statCounterDesc}>Conducted</Text>
            </View>
          </View>

          {/* Tactile Primary Button */}
          <AppButton
            title={hasLiveClass ? 'Submit Attendance OTP (Class Live 🟢)' : 'Mark Attendance with OTP'}
            onPress={() => router.push('/student-mark-attendance' as never)}
            variant="primary"
            style={styles.overallActionBtn}
          />
        </View>

        {/* 3. Live Class Urgency Card (When Active) */}
        {hasLiveClass && (
          <View style={styles.liveBannerCard}>
            <View style={styles.liveBannerHeader}>
              <View style={styles.liveBannerPill}>
                <View style={styles.liveBannerPulseDot} />
                <Text style={styles.liveBannerPillText}>ATTENDANCE OPEN NOW</Text>
              </View>
              <Text style={styles.liveBannerTimer}>Active session</Text>
            </View>

            <Text style={styles.liveBannerSubject}>{liveSubjectName}</Text>
            <Text style={styles.liveBannerMeta}>
              {liveSubjectCode ? `${liveSubjectCode} • ` : ''}Room 102 • Instructor: {liveFacultyName}
            </Text>

            <AppButton
              title="Enter Attendance OTP"
              onPress={() => router.push('/student-mark-attendance' as never)}
              variant="primary"
              size="medium"
              style={styles.liveBannerAction}
            />
          </View>
        )}

        {/* 4. Quick Services / Actions Grid (Reference "Services" Section) */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <Text style={styles.sectionSubtitle}>Frequently used tools and shortcuts</Text>

          <View style={styles.servicesGrid}>
            {QUICK_SERVICES.map((srv) => (
              <TouchableOpacity
                key={srv.id}
                style={styles.servicePill}
                onPress={() => srv.route && router.push(srv.route as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: srv.bgTint }]}>
                  <IconSymbol size={17} name={srv.icon} color={srv.iconColor} />
                </View>
                <Text style={styles.serviceLabel} numberOfLines={1}>
                  {srv.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Attendance Safety Advisor */}
        <View style={styles.sectionWrapper}>
          <AttendanceSafetyCard
            attended={overall.attended}
            conducted={overall.conducted}
            target={75}
          />
        </View>

        {/* 6. Today's Schedule Section */}
        {todaySchedule && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionTitle}>{"Today's Schedule"}</Text>
                <Text style={styles.sectionSubtitle}>
                  {todaySchedule.isWeekend
                    ? 'Weekend • Previewing Monday classes'
                    : `${todaySchedule.day} • ${todaySchedule.items.length} classes`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/student-schedule' as never)}>
                <Text style={styles.viewAllLink}>Full Timetable →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleList}>
              {todaySchedule.items.slice(0, 3).map((item) => (
                <Card
                  key={item.id}
                  style={[styles.scheduleCard, item.status === 'live' && styles.scheduleCardLive]}
                  onPress={() => {
                    if (item.status === 'live') {
                      router.push('/student-mark-attendance' as never);
                    } else {
                      router.push('/student-schedule' as never);
                    }
                  }}
                  padded={false}
                >
                  <View style={styles.scheduleCardInner}>
                    <View style={styles.scheduleTimeBadge}>
                      <IconSymbol size={13} name="clock.fill" color={APP_COLORS.primaryWarm} />
                      <Text style={styles.scheduleTimeText}>{item.timeSlot.split(' - ')[0]}</Text>
                    </View>

                    <View style={styles.scheduleDetails}>
                      <Text style={styles.scheduleSubject} numberOfLines={1}>
                        {item.subjectName}
                      </Text>
                      <Text style={styles.scheduleMeta}>
                        {item.subjectCode} • {item.room} • {item.facultyName}
                      </Text>
                    </View>

                    {item.status === 'live' ? (
                      <View style={styles.scheduleLiveBadge}>
                        <View style={styles.scheduleLiveDot} />
                        <Text style={styles.scheduleLiveText}>LIVE</Text>
                      </View>
                    ) : (
                      <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 7. Course Breakdown Section */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionTitle}>Course Breakdown</Text>
              <Text style={styles.sectionSubtitle}>{`${subjects.length} Enrolled Courses`}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/student-subjects' as never)}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coursesList}>
            {subjects.length === 0 ? (
              <Text style={styles.emptyText}>No subjects enrolled yet.</Text>
            ) : (
              subjects.map((summary: SubjectAttendanceSummary) => {
                const perc = summary.conducted === 0 ? 0 : Math.round((summary.attended / summary.conducted) * 100);
                const advice = calculateAttendanceAdvice(summary.attended, summary.conducted, 75);
                const barColor = perc >= 75 ? APP_COLORS.safeText : perc >= 65 ? APP_COLORS.attentionText : APP_COLORS.shortageText;

                return (
                  <Card
                    key={summary.subject.id}
                    style={styles.courseCard}
                    onPress={() => router.push('/student-subjects' as never)}
                    padded={false}
                  >
                    <View style={styles.courseCardInner}>
                      <View style={styles.courseCardHeader}>
                        <View style={styles.courseInfoLeft}>
                          <View style={styles.courseCodePill}>
                            <Text style={styles.courseCodeText}>{summary.subject.code}</Text>
                          </View>
                          <Text style={styles.courseName} numberOfLines={1}>
                            {summary.subject.name}
                          </Text>
                        </View>
                        <Text style={styles.coursePercentage}>{perc}%</Text>
                      </View>

                      <View style={styles.courseMetaRow}>
                        <Text style={styles.courseCount}>
                          {summary.attended} / {summary.conducted} classes attended
                        </Text>
                        {advice.status !== 'none' && (
                          <StatusBadge status={summary.standing} size="small" />
                        )}
                      </View>

                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      </AppScreen>

      {/* Unified 5-Tab Student Bottom Navigation Dock */}
      <StudentBottomNav currentTab="home" hasActiveClass={hasLiveClass} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.canvas,
  },
  scrollContent: {
    padding: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
    backgroundColor: APP_COLORS.canvas,
  },

  /* 1. Aurora Hero Header */
  heroContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#FF5E36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroBrandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  heroProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGreetingArea: {
    marginBottom: 16,
  },
  heroGreetingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 4,
  },
  heroStudentName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  heroAcademicPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroFloatingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    marginTop: 10,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroAlertIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAlertIconBoxLive: {
    backgroundColor: '#FFF1ED',
  },
  heroAlertIconBoxCalm: {
    backgroundColor: '#EEFAF4',
  },
  heroAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  heroAlertSub: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 1,
  },

  /* 2. Floating Attendance Card */
  overallFloatingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: TOKENS.rounded.card,
    padding: 20,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    marginBottom: 20,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  overallSubhead: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  overallMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  overallScoreArea: {
    flex: 1,
  },
  overallScoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallScoreNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -1.2,
  },
  overallScorePercent: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    marginLeft: 2,
  },
  overallThresholdHint: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  overallGaugeArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCountersStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statCounterCell: {
    alignItems: 'center',
    flex: 1,
  },
  statCounterNum: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  statCounterDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  statCounterDivider: {
    width: 1,
    height: 22,
    backgroundColor: APP_COLORS.border,
  },
  overallActionBtn: {
    marginTop: 16,
  },

  /* 3. Live Banner Urgency Card */
  liveBannerCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 94, 54, 0.2)',
    shadowColor: '#FF5E36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  liveBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  liveBannerPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  liveBannerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.4,
  },
  liveBannerTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  liveBannerSubject: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  liveBannerMeta: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 14,
  },
  liveBannerAction: {
    width: '100%',
  },

  /* 4. Quick Services Section */
  servicesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 8,
    flexBasis: '47%',
    flexGrow: 1,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  serviceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.text,
    flex: 1,
  },

  /* Common Sections */
  sectionWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.primaryWarm,
  },

  /* 5. Schedule List Cards */
  scheduleList: {
    gap: 10,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  scheduleCardLive: {
    borderColor: 'rgba(255, 94, 54, 0.3)',
    backgroundColor: '#FFFDFD',
  },
  scheduleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  scheduleTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  scheduleMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  scheduleLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  scheduleLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  scheduleLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.3,
  },

  /* 6. Course Breakdown Cards */
  coursesList: {
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  courseCardInner: {
    padding: 16,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  courseCodePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  courseCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    flex: 1,
  },
  coursePercentage: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  courseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseCount: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.subSurface,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyText: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 16,
  },
});
