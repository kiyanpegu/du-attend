import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { AttendanceSafetyCard } from '@/components/app/AttendanceSafetyCard';
import { Card } from '@/components/app/Card';
import { CircularProgress } from '@/components/app/CircularProgress';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, ClassScheduleItem, DayOfWeek, StudentDashboardData, SubjectAttendanceSummary } from '@/types/models';
import { calculateAttendanceAdvice } from '@/utils/format';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StudentDashboard() {
  const router = useRouter();
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

      // Check for active classes every 5 seconds while on dashboard
      const interval = setInterval(run, 5000);

      return () => {
        mounted = false;
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

  return (
    <View style={styles.screen}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <View style={styles.profileImageWrap}>
            <IconSymbol size={22} name="person.fill" color={APP_COLORS.surface} />
          </View>
          <View>
            <Text style={styles.appBarTitle}>DU Attend</Text>
            <Text style={styles.appBarSubtitle}>Dibrugarh University</Text>
          </View>
        </View>

        {hasLiveClass && (
          <TouchableOpacity
            style={styles.liveIndicatorBadge}
            onPress={() => router.push('/student-mark-attendance' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.livePulseDot} />
            <Text style={styles.liveIndicatorText}>CLASS LIVE</Text>
          </TouchableOpacity>
        )}
      </View>

      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeGreeting}>{greeting} 👋,</Text>
          <Text style={styles.welcomeTitle}>{user.name}</Text>
          <View style={styles.studentBadge}>
            <Text style={styles.studentBadgeText}>
              {student.studentId} • {programme?.name ?? 'BCA'} • {semester?.name ?? '1st Semester'}
            </Text>
          </View>
        </View>

        {/* Live Class Urgency Alert Banner */}
        {hasLiveClass && (
          <View style={styles.liveAlertCard}>
            <View style={styles.liveAlertHeader}>
              <View style={styles.liveAlertTag}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveAlertTagText}>ATTENDANCE OPEN NOW</Text>
              </View>
              <Text style={styles.liveAlertTime}>Active session</Text>
            </View>

            <Text style={styles.liveAlertTitle}>{liveSubjectName}</Text>
            <Text style={styles.liveAlertSubtitle}>
              {liveSubjectCode ? `${liveSubjectCode} • ` : ''}Instructor: {liveFacultyName}
            </Text>

            <AppButton
              title="Enter Attendance OTP"
              onPress={() => router.push('/student-mark-attendance' as never)}
              variant="primary"
              style={styles.liveAlertBtn}
            />
          </View>
        )}

        {/* Overall Attendance Summary Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallTitle}>Overall Semester Attendance</Text>
            <StatusBadge status={overall.standing === 'none' ? 'good' : overall.standing} size="small" />
          </View>

          <View style={styles.circularProgressContainer}>
            <CircularProgress
              progress={overall.percentage || 0}
              standing={overall.standing === 'none' ? 'good' : overall.standing}
              radius={72}
              strokeWidth={11}
            />
          </View>

          <View style={styles.statCountersRow}>
            <View style={styles.statCounter}>
              <Text style={styles.statCounterVal}>{overall.attended}</Text>
              <Text style={styles.statCounterLabel}>Attended</Text>
            </View>
            <View style={styles.statCounterDivider} />
            <View style={styles.statCounter}>
              <Text style={styles.statCounterVal}>{overall.missed}</Text>
              <Text style={styles.statCounterLabel}>Missed</Text>
            </View>
            <View style={styles.statCounterDivider} />
            <View style={styles.statCounter}>
              <Text style={styles.statCounterVal}>{overall.conducted}</Text>
              <Text style={styles.statCounterLabel}>Conducted</Text>
            </View>
          </View>
        </View>

        {/* Attendance Safety Advisor */}
        <AttendanceSafetyCard
          attended={overall.attended}
          conducted={overall.conducted}
          target={75}
        />

        {/* Today's Schedule Section */}
        {todaySchedule && (
          <View style={styles.scheduleSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{"Today's Schedule"}</Text>
                <Text style={styles.sectionSubtitle}>
                  {todaySchedule.isWeekend
                    ? 'Weekend • Previewing Monday classes'
                    : `${todaySchedule.day} • ${todaySchedule.items.length} classes`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/student-schedule' as never)}>
                <Text style={styles.viewAllText}>Full Timetable →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleCardsList}>
              {todaySchedule.items.slice(0, 3).map((item) => (
                <Card
                  key={item.id}
                  style={[styles.scheduleItemCard, item.status === 'live' && styles.scheduleItemCardLive]}
                  padded={false}
                >
                  <View style={styles.scheduleItemInner}>
                    <View style={styles.scheduleTimeBox}>
                      <IconSymbol size={13} name="clock.fill" color={APP_COLORS.primary} />
                      <Text style={styles.scheduleTimeText}>{item.timeSlot.split(' - ')[0]}</Text>
                    </View>

                    <View style={styles.scheduleDetails}>
                      <Text style={styles.scheduleSubjectName} numberOfLines={1}>
                        {item.subjectName}
                      </Text>
                      <Text style={styles.scheduleSubMeta}>
                        {item.subjectCode} • {item.room} • {item.facultyName}
                      </Text>
                    </View>

                    {item.status === 'live' ? (
                      <View style={styles.liveSmallPill}>
                        <Text style={styles.liveSmallPillText}>LIVE</Text>
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

        {/* Subjects Attendance Breakdown */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Course Breakdown</Text>
            <Text style={styles.sectionSubtitle}>{`${subjects.length} Enrolled Courses`}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/student-subjects' as never)}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subjectsGrid}>
          {subjects.length === 0 ? (
            <Text style={styles.emptyText}>No subjects enrolled yet.</Text>
          ) : (
            subjects.map((summary: SubjectAttendanceSummary) => {
              const perc = summary.conducted === 0 ? 0 : Math.round((summary.attended / summary.conducted) * 100);
              const color = perc >= 75 ? APP_COLORS.primary : perc >= 50 ? APP_COLORS.tertiary : APP_COLORS.danger;
              const advice = calculateAttendanceAdvice(summary.attended, summary.conducted, 75);

              return (
                <TouchableOpacity
                  key={summary.subject.id}
                  style={styles.subjectCard}
                  onPress={() => router.push('/student-subjects' as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectCardHeader}>
                    <View style={styles.subjectNameWrap}>
                      <Text style={styles.subjectCodeBadge}>{summary.subject.code}</Text>
                      <Text style={styles.subjectName} numberOfLines={2}>
                        {summary.subject.name}
                      </Text>
                    </View>
                    <IconSymbol size={18} name="chevron.right" color={APP_COLORS.textSecondary} />
                  </View>

                  <View style={styles.subjectCardMetrics}>
                    <Text style={styles.subjectPercentage}>{perc}%</Text>
                    <View style={styles.subjectMetricsRight}>
                      <Text style={styles.subjectCount}>
                        {summary.attended} / {summary.conducted} classes
                      </Text>
                      {advice.status !== 'none' && (
                        <Text
                          style={[
                            styles.advicePillText,
                            {
                              color:
                                advice.status === 'safe'
                                  ? APP_COLORS.success
                                  : advice.status === 'warning'
                                  ? APP_COLORS.warning
                                  : APP_COLORS.danger,
                            },
                          ]}
                        >
                          {advice.shortLabel}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: color }]} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionArea}>
          <AppButton
            title={hasLiveClass ? 'Submit OTP (Class Live 🟢)' : 'Enter OTP to Mark Attendance'}
            onPress={() => router.push('/student-mark-attendance' as never)}
            variant="primary"
          />
        </View>
      </AppScreen>

      {/* Unified 5-Tab Student Bottom Navigation */}
      <StudentBottomNav currentTab="home" hasActiveClass={hasLiveClass} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: APP_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  topAppBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: 0.3,
  },
  appBarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: APP_COLORS.textMuted,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${APP_COLORS.success}20`,
    borderWidth: 1,
    borderColor: `${APP_COLORS.success}60`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.success,
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.success,
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeGreeting: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  studentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  studentBadgeText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  liveAlertCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: `${APP_COLORS.success}12`,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${APP_COLORS.success}50`,
    padding: 16,
  },
  liveAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveAlertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${APP_COLORS.success}30`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveAlertTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.success,
    letterSpacing: 0.5,
  },
  liveAlertTime: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  liveAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  liveAlertSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
    marginBottom: 14,
  },
  liveAlertBtn: {
    marginTop: 4,
  },
  overallCard: {
    marginHorizontal: 16,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 20,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  overallTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  statCountersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  statCounter: {
    alignItems: 'center',
    flex: 1,
  },
  statCounterVal: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  statCounterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  statCounterDivider: {
    width: 1,
    height: 24,
    backgroundColor: APP_COLORS.border,
  },
  scheduleSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
  scheduleCardsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  scheduleItemCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  scheduleItemCardLive: {
    borderColor: APP_COLORS.success,
    backgroundColor: `${APP_COLORS.success}08`,
  },
  scheduleItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  scheduleTimeBox: {
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 64,
    gap: 3,
  },
  scheduleTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleSubjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  scheduleSubMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  liveSmallPill: {
    backgroundColor: APP_COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveSmallPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  subjectsGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectNameWrap: {
    flex: 1,
    paddingRight: 12,
  },
  subjectCodeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.primary,
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  subjectCardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  subjectPercentage: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  subjectMetricsRight: {
    alignItems: 'flex-end',
  },
  subjectCount: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  advicePillText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 3,
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
    paddingVertical: 20,
  },
  actionArea: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
});
