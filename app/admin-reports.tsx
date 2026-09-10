import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import type { FacultySessionReport } from '@/types/models';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<FacultySessionReport[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Record Correction State
  const [correctingRecord, setCorrectingRecord] = useState<{
    recordId: string;
    studentName: string;
    studentPublicId: string;
    currentStatus: string;
  } | null>(null);
  const [savingCorrection, setSavingCorrection] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const allReports = await adminService.getAttendanceReports();
    setReports(allReports.sort((a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime()));
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const handleApplyCorrection = async (newStatus: 'present' | 'absent') => {
    if (!correctingRecord) return;

    setSavingCorrection(true);
    const result = await attendanceService.correctRecord(correctingRecord.recordId, newStatus);
    setSavingCorrection(false);

    if (result.ok) {
      setCorrectingRecord(null);
      await loadData();
      Alert.alert('Record Updated', `Student status updated to ${newStatus.toUpperCase()} by Administrator.`);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const uniqueSubjects = Array.from(
    new Set(reports.map((r) => JSON.stringify({ id: r.subject.id, code: r.subject.code })))
  ).map((str) => JSON.parse(str));

  const filteredReports = reports.filter((r) => {
    if (selectedSubjectId !== 'all' && r.subject.id !== selectedSubjectId) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <LoadingState message="Loading university attendance records..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Attendance Records"
        subtitle="University Session Logs & Record Correction"
        showBack
      />

      {/* Subject Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedSubjectId('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, selectedSubjectId === 'all' && styles.filterChipTextActive]}>
            All Courses ({reports.length})
          </Text>
        </TouchableOpacity>

        {uniqueSubjects.map((sub: any) => (
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

      {/* Sessions Count */}
      <Text style={styles.recordCount}>
        Displaying {filteredReports.length} session{filteredReports.length === 1 ? '' : 's'}
      </Text>

      {filteredReports.length === 0 ? (
        <EmptyState
          icon="clock.arrow.circlepath"
          title="No Sessions Recorded"
          message="No attendance sessions recorded for the selected filter."
        />
      ) : (
        filteredReports.map((report) => {
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
                    <Text style={styles.sessionInstructor}>
                      {report.subject.code} • Instructor: {report.facultyUser.name} ({report.faculty.facultyId})
                    </Text>
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

                {report.session.status === 'ended' && (
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
                      <Text style={styles.countLbl}>Turnout</Text>
                    </View>
                  </View>
                )}

                <View style={styles.expandRow}>
                  <Text style={styles.expandText}>
                    {isExpanded ? 'Hide student attendance log' : 'View & edit student attendance log'}
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
                  <Text style={styles.rosterTitle}>STUDENT ATTENDANCE LOG (TAP TO CORRECT)</Text>

                  {report.roster.length === 0 ? (
                    <Text style={styles.emptyRoster}>No students enrolled.</Text>
                  ) : (
                    report.roster.map((item) => {
                      const recordId = item.record?.id;
                      const status = item.record?.status ?? 'absent';

                      return (
                        <TouchableOpacity
                          key={item.student.id}
                          style={styles.rosterRow}
                          onPress={() => {
                            if (recordId) {
                              setCorrectingRecord({
                                recordId,
                                studentName: item.user.name,
                                studentPublicId: item.student.studentId,
                                currentStatus: status,
                              });
                            } else {
                              Alert.alert('Notice', 'No record created for cancelled class.');
                            }
                          }}
                          activeOpacity={0.7}
                        >
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

                          <View style={styles.statusAndEdit}>
                            <StatusBadge status={status} size="small" />
                            <IconSymbol size={14} name="pencil" color={APP_COLORS.primary} />
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}

      {/* Admin Record Correction Modal */}
      <Modal visible={correctingRecord !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Correct Attendance Record</Text>
            <Text style={styles.modalSubtitle}>
              Student: {correctingRecord?.studentName} ({correctingRecord?.studentPublicId})
            </Text>
            <Text style={styles.currentStatusText}>
              Current Status: <Text style={{ fontWeight: '800' }}>{correctingRecord?.currentStatus.toUpperCase()}</Text>
            </Text>

            <View style={styles.correctionBtnStack}>
              <AppButton
                title="Mark as Present"
                onPress={() => handleApplyCorrection('present')}
                loading={savingCorrection}
                variant="primary"
                style={styles.correctBtn}
              />
              <AppButton
                title="Mark as Absent"
                onPress={() => handleApplyCorrection('absent')}
                loading={savingCorrection}
                variant="danger"
                style={styles.correctBtn}
              />
              <AppButton
                title="Cancel"
                onPress={() => setCorrectingRecord(null)}
                variant="outline"
                style={styles.correctBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
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
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  recordCount: {
    fontSize: 12,
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
  sessionInstructor: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
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
    paddingVertical: 10,
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
  statusAndEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 8,
  },
  currentStatusText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginBottom: 20,
  },
  correctionBtnStack: {
    gap: 10,
  },
  correctBtn: {
    width: '100%',
  },
});

