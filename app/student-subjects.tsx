import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { ProgressBar } from '@/components/app/ProgressBar';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import type { AttendanceHistoryItem, AttendanceSession, SubjectAttendanceSummary } from '@/types/models';
import { calculateAttendanceAdvice } from '@/utils/format';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        <Header title="Your Subjects" subtitle="BCA 1st Semester • Course Breakdown" showBack />

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

            return (
              <Card
                key={item.subject.id}
                style={[styles.subjectCard, isLive && styles.subjectCardLive]}
                padded={false}
              >
                <TouchableOpacity
                  onPress={() => toggleExpand(item.subject.id)}
                  style={styles.cardHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.titleRow}>
                    <View style={styles.nameWrap}>
                      <View style={styles.codeRow}>
                        <Text style={styles.subjectCode}>{item.subject.code}</Text>
                        {isLive && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveBadgeText}>CLASS LIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.subjectName}>{item.subject.name}</Text>
                      <Text style={styles.facultyName}>Instructor: {item.facultyName}</Text>
                    </View>
                    <StatusBadge status={item.standing} />
                  </View>

                  {/* Attendance Advice Box */}
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
                        size={14}
                        name={
                          advice.status === 'safe'
                            ? 'checkmark.shield.fill'
                            : advice.status === 'warning'
                            ? 'exclamationmark.triangle.fill'
                            : 'xmark.shield.fill'
                        }
                        color={
                          advice.status === 'safe'
                            ? APP_COLORS.success
                            : advice.status === 'warning'
                            ? APP_COLORS.warning
                            : APP_COLORS.danger
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

                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{item.attended}</Text>
                      <Text style={styles.statLabel}>Attended</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{item.missed}</Text>
                      <Text style={styles.statLabel}>Missed</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{item.conducted}</Text>
                      <Text style={styles.statLabel}>Conducted</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, { color: APP_COLORS.primary }]}>
                        {item.conducted === 0 ? 'N/A' : `${item.percentage}%`}
                      </Text>
                      <Text style={styles.statLabel}>Percentage</Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={item.percentage || 0}
                    standing={item.standing === 'none' ? 'good' : item.standing}
                    height={8}
                    style={styles.progressBar}
                  />

                  <View style={styles.cardFooter}>
                    <Text style={styles.expandHint}>
                      {isExpanded ? 'Hide session history' : `Tap to view ${history.length} session${history.length === 1 ? '' : 's'}`}
                    </Text>
                    <IconSymbol
                      size={16}
                      name={isExpanded ? 'chevron.left' : 'chevron.right'}
                      color={APP_COLORS.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>SESSION LOG FOR {item.subject.code}</Text>

                    {history.length === 0 ? (
                      <Text style={styles.noHistoryText}>No classes recorded yet for this subject.</Text>
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
                              Method: {h.method === 'otp' ? 'Live OTP' : h.method === 'manual' ? 'Manual by Faculty' : 'N/A'}
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
      </AppScreen>

      <StudentBottomNav currentTab="subjects" hasActiveClass={activeSessions.length > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  subjectCard: {
    marginBottom: 16,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  subjectCardLive: {
    borderColor: APP_COLORS.success,
    backgroundColor: `${APP_COLORS.success}08`,
  },
  cardHeader: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameWrap: {
    flex: 1,
    paddingRight: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.primary,
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${APP_COLORS.success}20`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.success,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.success,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  facultyName: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  adviceBoxSafe: {
    backgroundColor: `${APP_COLORS.success}12`,
    borderColor: `${APP_COLORS.success}30`,
  },
  adviceBoxWarning: {
    backgroundColor: `${APP_COLORS.warning}12`,
    borderColor: `${APP_COLORS.warning}30`,
  },
  adviceBoxCritical: {
    backgroundColor: `${APP_COLORS.danger}12`,
    borderColor: `${APP_COLORS.danger}30`,
  },
  adviceText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  adviceTextSafe: {
    color: APP_COLORS.success,
  },
  adviceTextWarning: {
    color: APP_COLORS.warning,
  },
  adviceTextCritical: {
    color: APP_COLORS.danger,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  historyContainer: {
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  noHistoryText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  historyMethod: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
});
