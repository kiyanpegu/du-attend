import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import type { FacultySessionReport, Subject } from '@/types/models';

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

  const filteredSessions = sessions.filter((report) => {
    if (selectedSubjectId !== 'all' && report.session.subjectId !== selectedSubjectId) {
      return false;
    }
    if (selectedStatus !== 'all' && report.session.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  if (loading) {
    return <LoadingState message="Loading class session history..." />;
  }

  return (
    <AppScreen scrollable>
      <Header title="Session History" subtitle="Past Conducted Classes" showBack />

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'ended', label: 'Conducted / Ended' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.filterChip, selectedStatus === item.id && styles.filterChipActive]}
              onPress={() => setSelectedStatus(item.id as never)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterChipText, selectedStatus === item.id && styles.filterChipTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>SUBJECT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedSubjectId('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterChipText, selectedSubjectId === 'all' && styles.filterChipTextActive]}
            >
              All Subjects
            </Text>
          </TouchableOpacity>
          {subjects.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[styles.filterChip, selectedSubjectId === sub.id && styles.filterChipActive]}
              onPress={() => setSelectedSubjectId(sub.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterChipText, selectedSubjectId === sub.id && styles.filterChipTextActive]}
              >
                {sub.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.summaryCount}>
        Showing {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
      </Text>

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon="clock.arrow.circlepath"
          title="No Sessions Found"
          message="No attendance sessions matched your filters."
        />
      ) : (
        filteredSessions.map((report) => {
          const isExpanded = expandedSessionId === report.session.id;

          return (
            <Card key={report.session.id} style={styles.sessionCard} padded={false}>
              <TouchableOpacity
                onPress={() => toggleExpand(report.session.id)}
                style={styles.sessionHeader}
                activeOpacity={0.7}
              >
                <View style={styles.sessionTopRow}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.subjectName}>{report.subject.name}</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(report.session.startedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <StatusBadge status={report.session.status} size="small" />
                </View>

                {report.session.status === 'ended' ? (
                  <View style={styles.countsRow}>
                    <View style={styles.countItem}>
                      <Text style={[styles.countVal, { color: APP_COLORS.success }]}>
                        {report.presentCount}
                      </Text>
                      <Text style={styles.countLbl}>Present</Text>
                    </View>
                    <View style={styles.countItem}>
                      <Text style={[styles.countVal, { color: APP_COLORS.danger }]}>
                        {report.absentCount}
                      </Text>
                      <Text style={styles.countLbl}>Absent</Text>
                    </View>
                    <View style={styles.countItem}>
                      <Text style={styles.countVal}>{report.enrolledCount}</Text>
                      <Text style={styles.countLbl}>Enrolled</Text>
                    </View>
                    <View style={styles.countItem}>
                      <Text style={[styles.countVal, { color: APP_COLORS.primary }]}>
                        {report.enrolledCount > 0
                          ? `${Math.round((report.presentCount / report.enrolledCount) * 100)}%`
                          : '0%'}
                      </Text>
                      <Text style={styles.countLbl}>Attendance</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cancelledNote}>
                    <Text style={styles.cancelledText}>
                      Class was cancelled • Excluded from conducted totals
                    </Text>
                  </View>
                )}

                <View style={styles.expandRow}>
                  <Text style={styles.expandText}>
                    {isExpanded ? 'Hide student roster' : 'View student roster'}
                  </Text>
                  <IconSymbol
                    size={16}
                    name={isExpanded ? 'chevron.left' : 'chevron.right'}
                    color={APP_COLORS.textMuted}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.rosterWrap}>
                  <Text style={styles.rosterTitle}>STUDENT ATTENDANCE BREAKDOWN</Text>

                  {report.roster.length === 0 ? (
                    <Text style={styles.emptyRoster}>No students enrolled.</Text>
                  ) : (
                    report.roster.map((item) => (
                      <View key={item.student.id} style={styles.rosterRow}>
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>{item.user.name}</Text>
                          <Text style={styles.studentId}>
                            {item.student.studentId}
                            {item.record?.markedBy && (
                              <Text style={styles.methodTag}>
                                {' '}• {item.record.markedBy === 'otp' ? 'OTP' : 'Manual'}
                              </Text>
                            )}
                          </Text>
                        </View>
                        <StatusBadge
                          status={item.record?.status ?? 'absent'}
                          size="small"
                        />
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
  );
}

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sessionCard: {
    marginBottom: 14,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  sessionHeader: {
    padding: 16,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  sessionDate: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
  },
  countVal: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  countLbl: {
    fontSize: 10,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  cancelledNote: {
    backgroundColor: `${APP_COLORS.danger}15`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelledText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.danger,
    textAlign: 'center',
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  rosterWrap: {
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  rosterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
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
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  studentId: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  methodTag: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
  },
});