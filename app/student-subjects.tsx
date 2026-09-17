import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { CircularProgress } from '@/components/app/CircularProgress';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import type { AttendanceHistoryItem, AttendanceSession, SubjectAttendanceSummary } from '@/types/models';
import { calculateAttendanceAdvice } from '@/utils/format';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StudentSubjectsScreen() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<SubjectAttendanceSummary[]>([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [subjectHistories, setSubjectHistories] = useState<Record<string, AttendanceHistoryItem[]>>({});
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'student') {
      router.replace('/student-login' as never);
      return;
    }

    const [data, live] = await Promise.all([
      attendanceService.getStudentSubjectSummaries(user.id),
      attendanceService.getActiveSessionsForStudent(user.id),
    ]);

    setSummaries(data);
    setActiveSessions(live);

    // Fetch history for all subjects
    const histories: Record<string, AttendanceHistoryItem[]> = {};
    await Promise.all(
      data.map(async (item) => {
        const history = await attendanceService.getStudentHistory(user.id, { subjectId: item.subject.id });
        histories[item.subject.id] = history;
      })
    );
    setSubjectHistories(histories);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleExpand = (subjectId: string) => {
    setExpandedSubjectId((prev) => (prev === subjectId ? null : subjectId));
  };

  if (loading) {
    return <LoadingState message="Loading enrolled subjects..." />;
  }

  const liveSubjectIds = new Set(activeSessions.map((s) => s.subjectId));

  // High-level academic performance calculations
  const totalAttended = summaries.reduce((sum, s) => sum + s.attended, 0);
  const totalConducted = summaries.reduce((sum, s) => sum + s.conducted, 0);
  const overallPercentage = totalConducted === 0 ? 0 : Math.round((totalAttended / totalConducted) * 100);
  const safeCount = summaries.filter((s) => s.standing === 'good').length;
  const atRiskCount = summaries.filter((s) => s.standing === 'warning' || s.standing === 'critical').length;
  const overallStanding: 'good' | 'warning' | 'critical' =
    totalConducted === 0 ? 'good' : overallPercentage >= 75 ? 'good' : overallPercentage >= 65 ? 'warning' : 'critical';

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        {/* Screen Header */}
        <View style={styles.headerWrapper}>
          <Header title="Your Subjects" subtitle="BCA 1st Semester • Course Breakdown" showBack />
        </View>

        {/* Overall Academic Performance Overview Card */}
        {summaries.length > 0 && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View>
                <Text style={styles.overviewKicker}>ACADEMIC OVERVIEW</Text>
                <Text style={styles.overviewSubtitle}>BCA 1st Semester Standing</Text>
              </View>
              <StatusBadge status={overallStanding} size="small" />
            </View>

            <View style={styles.overviewMetricRow}>
              <View style={styles.overviewScoreArea}>
                <View style={styles.overviewScoreWrap}>
                  <Text style={styles.overviewScoreNumber}>{overallPercentage}</Text>
                  <Text style={styles.overviewScorePercent}>%</Text>
                </View>
                <Text style={styles.overviewThresholdHint}>
                  {totalAttended} of {totalConducted} classes attended across all courses
                </Text>
              </View>

              <View style={styles.overviewGaugeArea}>
                <CircularProgress
                  progress={overallPercentage}
                  standing={overallStanding}
                  radius={34}
                  strokeWidth={7}
                  centerContent="icon"
                />
              </View>
            </View>

            <View style={styles.overviewStatsStrip}>
              <View style={styles.overviewStatCell}>
                <Text style={styles.overviewStatNum}>{summaries.length}</Text>
                <Text style={styles.overviewStatDesc}>Courses</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStatCell}>
                <Text style={[styles.overviewStatNum, { color: APP_COLORS.safeText }]}>{safeCount}</Text>
                <Text style={styles.overviewStatDesc}>Eligible (≥75%)</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStatCell}>
                <Text
                  style={[
                    styles.overviewStatNum,
                    { color: atRiskCount > 0 ? APP_COLORS.shortageText : APP_COLORS.textMuted },
                  ]}
                >
                  {atRiskCount}
                </Text>
                <Text style={styles.overviewStatDesc}>At Risk (&lt;75%)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Enrolled Courses</Text>
          <Text style={styles.sectionSubtitle}>Tap course to view session records</Text>
        </View>

        {/* Enrolled Courses List */}
        <View style={styles.subjectList}>
          {summaries.length === 0 ? (
            <EmptyState
              icon="book"
              title="No Enrolled Subjects"
              message="You are not currently enrolled in any subjects for this semester."
            />
          ) : (
            summaries.map((item) => {
              const isExpanded = expandedSubjectId === item.subject.id;
              const history = subjectHistories[item.subject.id] || [];
              const isLive = liveSubjectIds.has(item.subject.id);
              const advice = calculateAttendanceAdvice(item.attended, item.conducted, 75);
              const perc = item.conducted === 0 ? 0 : Math.round((item.attended / item.conducted) * 100);
              const barColor =
                perc >= 75
                  ? APP_COLORS.safeText
                  : perc >= 65
                  ? APP_COLORS.attentionText
                  : APP_COLORS.shortageText;

              return (
                <Card
                  key={item.subject.id}
                  style={[styles.subjectCard, isLive && styles.subjectCardLive]}
                  padded={false}
                >
                  <TouchableOpacity
                    onPress={() => toggleExpand(item.subject.id)}
                    style={styles.cardHeader}
                    activeOpacity={0.75}
                  >
                    {/* Course Code & Status Row */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.codeGroup}>
                        <View style={styles.courseCodePill}>
                          <Text style={styles.courseCodeText}>{item.subject.code}</Text>
                        </View>
                        {isLive && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveBadgeText}>CLASS LIVE</Text>
                          </View>
                        )}
                      </View>
                      <StatusBadge status={item.standing} size="small" />
                    </View>

                    {/* Subject Name & Instructor */}
                    <Text style={styles.subjectName}>{item.subject.name}</Text>
                    <View style={styles.facultyRow}>
                      <IconSymbol size={13} name="person.fill" color={APP_COLORS.textMuted} />
                      <Text style={styles.facultyName}>{item.facultyName}</Text>
                    </View>

                    {/* Performance Metrics Strip */}
                    <View style={styles.metricsStrip}>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricNum}>{item.attended}</Text>
                        <Text style={styles.metricLabel}>Attended</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCell}>
                        <Text style={styles.metricNum}>{item.missed}</Text>
                        <Text style={styles.metricLabel}>Missed</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCell}>
                        <Text style={styles.metricNum}>{item.conducted}</Text>
                        <Text style={styles.metricLabel}>Conducted</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCell}>
                        <Text style={[styles.metricNum, { color: barColor }]}>
                          {item.conducted === 0 ? 'N/A' : `${item.percentage}%`}
                        </Text>
                        <Text style={styles.metricLabel}>Standing</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${perc}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>

                    {/* Attendance Advice Box (Restrained Pastels) */}
                    {advice.status !== 'none' && (
                      <View
                        style={[
                          styles.adviceBox,
                          advice.status === 'safe' && styles.adviceBoxSafe,
                          advice.status === 'warning' && styles.adviceBoxWarning,
                          advice.status === 'critical' && styles.adviceBoxCritical,
                        ]}
                      >
                        <IconSymbol
                          size={13}
                          name={
                            advice.status === 'safe'
                              ? 'checkmark.shield.fill'
                              : advice.status === 'warning'
                              ? 'exclamationmark.triangle.fill'
                              : 'xmark.shield.fill'
                          }
                          color={
                            advice.status === 'safe'
                              ? APP_COLORS.safeText
                              : advice.status === 'warning'
                              ? APP_COLORS.attentionText
                              : APP_COLORS.shortageText
                          }
                        />
                        <Text
                          style={[
                            styles.adviceText,
                            advice.status === 'safe' && styles.adviceTextSafe,
                            advice.status === 'warning' && styles.adviceTextWarning,
                            advice.status === 'critical' && styles.adviceTextCritical,
                          ]}
                        >
                          {advice.message}
                        </Text>
                      </View>
                    )}

                    {/* Card Footer Toggle */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.expandHint}>
                        {isExpanded
                          ? 'Hide lecture records'
                          : `View ${history.length} lecture record${history.length === 1 ? '' : 's'}`}
                      </Text>
                      <IconSymbol
                        size={14}
                        name={isExpanded ? 'chevron.up' : 'chevron.down'}
                        color={APP_COLORS.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Session History Drawer */}
                  {isExpanded && (
                    <View style={styles.historyContainer}>
                      <Text style={styles.historyTitle}>LECTURE RECORD LOG ({history.length} CLASSES)</Text>

                      {history.length === 0 ? (
                        <Text style={styles.noHistoryText}>No lectures recorded yet for this course.</Text>
                      ) : (
                        history.map((h, idx) => (
                          <View key={h.sessionId || idx} style={styles.historyRow}>
                            <View style={styles.historyInfo}>
                              <Text style={styles.historyDate}>
                                {new Date(h.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                              <Text style={styles.historyMethod}>
                                {h.method === 'otp' ? 'Live OTP Check-in' : h.method === 'manual' ? 'Faculty Recorded' : 'Verified'}
                              </Text>
                            </View>
                            <StatusBadge status={h.status} size="small" />
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      </AppScreen>

      <StudentBottomNav currentTab="subjects" hasActiveClass={activeSessions.length > 0} />
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
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* Overview Card */
  overviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  overviewMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewScoreArea: {
    flex: 1,
  },
  overviewScoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overviewScoreNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -1,
  },
  overviewScorePercent: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    marginLeft: 2,
  },
  overviewThresholdHint: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
    paddingRight: 8,
  },
  overviewGaugeArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  overviewStatCell: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatNum: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  overviewStatDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  overviewStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: APP_COLORS.border,
  },

  /* Section Header */
  sectionHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  /* Subject Cards List */
  subjectList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  subjectCardLive: {
    borderColor: 'rgba(255, 94, 54, 0.35)',
    backgroundColor: '#FFFDFD',
  },
  cardHeader: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseCodePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.3,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  facultyName: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricNum: {
    fontSize: 14,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: APP_COLORS.border,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.subSurface,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  adviceBoxSafe: {
    backgroundColor: APP_COLORS.safeBg,
  },
  adviceBoxWarning: {
    backgroundColor: APP_COLORS.attentionBg,
  },
  adviceBoxCritical: {
    backgroundColor: APP_COLORS.shortageBg,
  },
  adviceText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  adviceTextSafe: {
    color: APP_COLORS.safeText,
  },
  adviceTextWarning: {
    color: APP_COLORS.attentionText,
  },
  adviceTextCritical: {
    color: APP_COLORS.shortageText,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  historyContainer: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  historyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  noHistoryText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17, 19, 24, 0.04)',
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  historyMethod: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
});
