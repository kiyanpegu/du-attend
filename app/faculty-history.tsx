import { AppScreen } from '@/components/app/AppScreen';
import { EmptyState } from '@/components/app/EmptyState';
import { LoadingState } from '@/components/app/LoadingState';
import { ProgressBar } from '@/components/app/ProgressBar';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import type { FacultySessionReport, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FacultyHistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<FacultySessionReport[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ended' | 'cancelled'>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    const [allReports, assignedSubs] = await Promise.all([
      attendanceService.getFacultySessionReports(user.id),
      facultyService.getAssignedSubjects(user.id),
    ]);

    setSessions(allReports);
    setSubjects(assignedSubs);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((report) => {
      if (selectedSubjectId !== 'all' && report.session.subjectId !== selectedSubjectId) {
        return false;
      }
      if (selectedStatus !== 'all' && report.session.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [sessions, selectedSubjectId, selectedStatus]);

  // Operational historical summary metrics
  const summaryStats = useMemo(() => {
    const totalSessions = sessions.length;
    const conductedSessions = sessions.filter((s) => s.session.status === 'ended');
    const conductedCount = conductedSessions.length;
    const cancelledCount = sessions.filter((s) => s.session.status === 'cancelled').length;

    let totalTurnoutPct = 0;
    let sessionsWithEnrolled = 0;

    conductedSessions.forEach((s) => {
      if (s.enrolledCount > 0) {
        totalTurnoutPct += (s.presentCount / s.enrolledCount) * 100;
        sessionsWithEnrolled++;
      }
    });

    const averageTurnout = sessionsWithEnrolled > 0
      ? Math.round(totalTurnoutPct / sessionsWithEnrolled)
      : 0;

    return {
      totalSessions,
      conductedCount,
      cancelledCount,
      averageTurnout,
    };
  }, [sessions]);

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const hasActiveFilters = selectedSubjectId !== 'all' || selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSelectedSubjectId('all');
    setSelectedStatus('all');
  };

  if (loading) {
    return <LoadingState message="Loading class session history..." />;
  }

  return (
    <AppScreen scrollable>
      {/* Top Navigation Bar */}
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
          <Text style={styles.navTitle}>Session History</Text>
          <Text style={styles.navSubtitle}>Past Conducted Lecture Records</Text>
        </View>
      </View>

      {/* Operational Summary Strip */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>CONDUCTED</Text>
          <Text style={[styles.summaryValue, { color: APP_COLORS.text }]}>
            {summaryStats.conductedCount}
          </Text>
          <Text style={styles.summarySub}>Total Classes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>AVG TURNOUT</Text>
          <Text style={[styles.summaryValue, { color: APP_COLORS.primaryWarm }]}>
            {summaryStats.averageTurnout}%
          </Text>
          <Text style={styles.summarySub}>Student Rate</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>CANCELLED</Text>
          <Text style={[styles.summaryValue, { color: summaryStats.cancelledCount > 0 ? APP_COLORS.danger : APP_COLORS.textSecondary }]}>
            {summaryStats.cancelledCount}
          </Text>
          <Text style={styles.summarySub}>Excluded</Text>
        </View>
      </View>

      {/* Filter Toolbar */}
      <View style={styles.filterSection}>
        {/* Status Filter Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterGroupTitle}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'ended', label: 'Conducted / Ended' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((item) => {
              const isSelected = selectedStatus === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(item.id as never)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Course Filter Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterGroupTitle}>COURSE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedSubjectId('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedSubjectId === 'all' && styles.filterChipTextActive]}>
                All Courses
              </Text>
            </TouchableOpacity>
            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedSubjectId(sub.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {sub.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Results Header with optional reset */}
      <View style={styles.resultsHeader}>
        <Text style={styles.summaryCount}>
          SHOWING {filteredSessions.length} SESSION{filteredSessions.length === 1 ? '' : 'S'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
            <Text style={styles.resetFilterText}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Historical Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon="clock.arrow.circlepath"
          title="No Sessions Found"
          message={
            hasActiveFilters
              ? 'No attendance sessions matched your selected filters.'
              : 'You have not conducted any class attendance sessions yet.'
          }
        />
      ) : (
        <View style={styles.sessionList}>
          {filteredSessions.map((report) => {
            const isExpanded = expandedSessionId === report.session.id;
            const isEnded = report.session.status === 'ended';
            const turnoutPct = report.enrolledCount > 0
              ? Math.round((report.presentCount / report.enrolledCount) * 100)
              : 0;

            const formattedDate = new Date(report.session.startedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = new Date(report.session.startedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={report.session.id} style={styles.sessionCard}>
                <TouchableOpacity
                  onPress={() => toggleExpand(report.session.id)}
                  style={styles.sessionCardInner}
                  activeOpacity={0.7}
                >
                  {/* Top Meta Line: Course Code + Date + Status */}
                  <View style={styles.sessionMetaRow}>
                    <View style={styles.metaLeftGroup}>
                      <View style={styles.codePill}>
                        <Text style={styles.codePillText}>{report.subject.code}</Text>
                      </View>
                      <View style={styles.dateTimeBadge}>
                        <IconSymbol size={12} name="clock.fill" color={APP_COLORS.textMuted} />
                        <Text style={styles.dateTimeText}>{formattedDate} • {formattedTime}</Text>
                      </View>
                    </View>
                    <StatusBadge
                      status={isEnded ? 'ended' : 'cancelled'}
                      label={isEnded ? 'Conducted' : 'Cancelled'}
                      size="small"
                    />
                  </View>

                  {/* Subject Name */}
                  <Text style={styles.subjectName}>{report.subject.name}</Text>

                  {/* Turnout Block if Conducted */}
                  {isEnded ? (
                    <View style={styles.turnoutBlock}>
                      <View style={styles.turnoutHeader}>
                        <View style={styles.turnoutRateBox}>
                          <Text style={styles.turnoutRateVal}>{turnoutPct}%</Text>
                          <Text style={styles.turnoutRateLbl}>Turnout</Text>
                        </View>
                        <View style={styles.turnoutDetails}>
                          <View style={styles.turnoutStat}>
                            <View style={[styles.statDot, { backgroundColor: APP_COLORS.success }]} />
                            <Text style={styles.turnoutStatText}>
                              <Text style={styles.boldText}>{report.presentCount}</Text> Present
                            </Text>
                          </View>
                          <View style={styles.turnoutStat}>
                            <View style={[styles.statDot, { backgroundColor: APP_COLORS.danger }]} />
                            <Text style={styles.turnoutStatText}>
                              <Text style={styles.boldText}>{report.absentCount}</Text> Absent
                            </Text>
                          </View>
                          <View style={styles.turnoutStat}>
                            <View style={[styles.statDot, { backgroundColor: APP_COLORS.textMuted }]} />
                            <Text style={styles.turnoutStatText}>
                              <Text style={styles.boldText}>{report.enrolledCount}</Text> Enrolled
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Restrained Turnout Progress Bar */}
                      <ProgressBar
                        progress={turnoutPct}
                        standing={turnoutPct >= 75 ? 'good' : turnoutPct >= 50 ? 'warning' : 'critical'}
                        height={5}
                        style={styles.turnoutProgressBar}
                      />
                    </View>
                  ) : (
                    <View style={styles.cancelledNote}>
                      <IconSymbol size={13} name="exclamationmark.triangle.fill" color={APP_COLORS.danger} />
                      <Text style={styles.cancelledText}>
                        Class was cancelled • Excluded from conducted attendance totals
                      </Text>
                    </View>
                  )}

                  {/* Expand / Collapse Roster Trigger */}
                  <View style={styles.expandRow}>
                    <Text style={styles.expandText}>
                      {isExpanded ? 'Hide student breakdown' : `View student roster (${report.roster.length} students)`}
                    </Text>
                    <IconSymbol
                      size={14}
                      name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      color={APP_COLORS.primaryWarm}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Student Attendance Breakdown */}
                {isExpanded && (
                  <View style={styles.rosterWrap}>
                    <View style={styles.rosterHeader}>
                      <Text style={styles.rosterTitle}>STUDENT ATTENDANCE BREAKDOWN</Text>
                      <Text style={styles.rosterCount}>{report.roster.length} Total</Text>
                    </View>

                    {report.roster.length === 0 ? (
                      <Text style={styles.emptyRoster}>No students were enrolled in this class.</Text>
                    ) : (
                      report.roster.map((item, index) => {
                        const isEven = index % 2 === 0;
                        const status = item.record?.status ?? 'absent';
                        return (
                          <View
                            key={item.student.id}
                            style={[styles.rosterRow, isEven && styles.rosterRowEven]}
                          >
                            <View style={styles.studentDetails}>
                              <View style={styles.studentIdBadge}>
                                <Text style={styles.studentIdText}>{item.student.studentId}</Text>
                              </View>
                              <Text style={styles.studentNameText} numberOfLines={1}>
                                {item.user.name}
                              </Text>
                              {item.record?.markedBy && (
                                <Text style={styles.methodTag}>
                                  • {item.record.markedBy === 'otp' ? 'OTP' : 'Manual'}
                                </Text>
                              )}
                            </View>
                            <StatusBadge status={status} size="small" />
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
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
  navTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.5,
  },
  navSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: APP_COLORS.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summarySub: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: APP_COLORS.border,
  },
  filterSection: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    padding: 12,
    marginBottom: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 10,
    ...TOKENS.shadows.subtle,
  },
  filterRow: {
    gap: 6,
  },
  filterGroupTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.canvas,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  summaryCount: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.primaryWarm,
  },
  sessionList: {
    gap: 12,
    paddingBottom: TOKENS.spacing.xxxl,
  },
  sessionCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  sessionCardInner: {
    padding: TOKENS.spacing.base,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_COLORS.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  turnoutBlock: {
    backgroundColor: APP_COLORS.canvas,
    borderRadius: TOKENS.rounded.md,
    padding: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
  },
  turnoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  turnoutRateBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  turnoutRateVal: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  turnoutRateLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  turnoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  turnoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  turnoutStatText: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  turnoutProgressBar: {
    marginTop: 2,
  },
  cancelledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.shortageBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.sm,
    marginBottom: 10,
  },
  cancelledText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.danger,
    flex: 1,
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.primaryWarm,
  },
  rosterWrap: {
    backgroundColor: APP_COLORS.canvas,
    paddingHorizontal: TOKENS.spacing.base,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rosterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  rosterCount: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  emptyRoster: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  rosterRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  studentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  studentIdBadge: {
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  studentIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
    flexShrink: 1,
  },
  methodTag: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
});