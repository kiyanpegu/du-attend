import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { exportService } from '@/services/exportService';
import type { FacultySessionReport } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
    setReports(
      allReports.sort(
        (a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime()
      )
    );
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
      Alert.alert(
        'Record Updated',
        `Student status updated to ${newStatus.toUpperCase()} by Administrator.`
      );
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

  const handleExportMasterCsv = async () => {
    try {
      const csv = exportService.generateMasterAuditCsv(reports);
      const res = await exportService.exportAndShareCsv('DU_Attend_Master_Audit_Report.csv', csv);
      if (!res.ok) {
        Alert.alert('Export Notice', res.message);
      }
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to export master report.');
    }
  };

  if (loading) {
    return <LoadingState message="Loading university attendance records..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Attendance Records"
        subtitle="Institutional Audit & Record Corrections"
        showBack
      />

      {/* Master Export Card */}
      <Card style={styles.exportHeroCard} padded={false}>
        <View style={styles.exportHeroContent}>
          <View style={styles.exportIconBox}>
            <IconSymbol size={24} name="doc.text.fill" color={APP_COLORS.obsidian} />
          </View>
          <View style={styles.exportTextWrap}>
            <Text style={styles.exportTitle}>Master Attendance Audit CSV</Text>
            <Text style={styles.exportSubtitle}>
              Export all {reports.length} classroom sessions across all BCA courses for administrative filing.
            </Text>
          </View>
        </View>

        <View style={styles.exportActionWrap}>
          <AppButton
            title={`Export Master Audit CSV (${reports.length} Sessions)`}
            onPress={handleExportMasterCsv}
            variant="primary"
            size="large"
            icon="square.and.arrow.up"
            style={styles.exportBtn}
          />
        </View>
      </Card>

      {/* Course Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRail}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedSubjectId('all')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedSubjectId === 'all' }}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedSubjectId === 'all' && styles.filterChipTextActive,
            ]}
          >
            All Courses ({reports.length})
          </Text>
        </TouchableOpacity>

        {uniqueSubjects.map((sub: any) => {
          const isSelected = selectedSubjectId === sub.id;
          return (
            <TouchableOpacity
              key={sub.id}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedSubjectId(sub.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {sub.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtered Record Count */}
      <View style={styles.recordCountRow}>
        <Text style={styles.recordCountText}>
          Displaying {filteredReports.length} session{filteredReports.length === 1 ? '' : 's'}
        </Text>
        <Text style={styles.departmentLabel}>
          {APP_IDENTITY.name} • CCSA Records
        </Text>
      </View>

      {/* Sessions List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon="clock.arrow.circlepath"
          title="No Sessions Recorded"
          message="No attendance sessions recorded for the selected filter."
        />
      ) : (
        <View style={styles.sessionList}>
          {filteredReports.map((report) => {
            const isExpanded = expandedSessionId === report.session.id;
            const turnoutPercent =
              report.enrolledCount > 0
                ? Math.round((report.presentCount / report.enrolledCount) * 100)
                : 0;

            return (
              <Card key={report.session.id} style={styles.sessionCard} padded={false}>
                <TouchableOpacity
                  onPress={() => toggleExpand(report.session.id)}
                  style={styles.sessionHeader}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Session for ${report.subject.name}`}
                >
                  <View style={styles.sessionTopRow}>
                    <View style={styles.subjectCodePill}>
                      <Text style={styles.subjectCodeText}>{report.subject.code}</Text>
                    </View>
                    <Text style={styles.sessionDate}>
                      {new Date(report.session.startedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <StatusBadge status={report.session.status} size="small" />
                  </View>

                  <Text style={styles.subjectName}>{report.subject.name}</Text>
                  <Text style={styles.sessionInstructor}>
                    Instructor: {report.facultyUser.name} ({report.faculty.facultyId})
                  </Text>

                  {report.session.status === 'ended' && (
                    <View style={styles.metricsContainer}>
                      <View style={styles.countsRow}>
                        <View style={styles.countItem}>
                          <Text style={[styles.countVal, { color: APP_COLORS.safeText }]}>
                            {report.presentCount}
                          </Text>
                          <Text style={styles.countLbl}>Present</Text>
                        </View>
                        <View style={styles.countItem}>
                          <Text style={[styles.countVal, { color: APP_COLORS.shortageText }]}>
                            {report.absentCount}
                          </Text>
                          <Text style={styles.countLbl}>Absent</Text>
                        </View>
                        <View style={styles.countItem}>
                          <Text style={styles.countVal}>{report.enrolledCount}</Text>
                          <Text style={styles.countLbl}>Enrolled</Text>
                        </View>
                        <View style={styles.countItem}>
                          <Text
                            style={[
                              styles.countVal,
                              {
                                color:
                                  turnoutPercent >= 75
                                    ? APP_COLORS.safeText
                                    : APP_COLORS.attentionText,
                              },
                            ]}
                          >
                            {turnoutPercent}%
                          </Text>
                          <Text style={styles.countLbl}>Turnout</Text>
                        </View>
                      </View>

                      <View style={styles.turnoutMeter}>
                        <View
                          style={[
                            styles.turnoutFill,
                            {
                              width: `${Math.min(100, turnoutPercent)}%`,
                              backgroundColor:
                                turnoutPercent >= 75
                                  ? APP_COLORS.safeText
                                  : APP_COLORS.secondaryWarm,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.expandRow}>
                    <Text style={styles.expandText}>
                      {isExpanded
                        ? 'Hide student attendance audit log'
                        : `View & edit attendance log (${report.roster.length} students)`}
                    </Text>
                    <IconSymbol
                      size={15}
                      name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      color={APP_COLORS.obsidian}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.rosterWrap}>
                    <View style={styles.rosterHeaderRow}>
                      <Text style={styles.rosterTitle}>
                        STUDENT AUDIT ROSTER • TAP ROW TO OVERRIDE
                      </Text>
                    </View>

                    {report.roster.length === 0 ? (
                      <Text style={styles.emptyRoster}>No students enrolled in this session.</Text>
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
                            accessibilityRole="button"
                            accessibilityLabel={`Correct attendance for ${item.user.name}`}
                          >
                            <View style={styles.studentDetails}>
                              <View style={styles.studentIdBadge}>
                                <Text style={styles.studentIdBadgeText}>
                                  {item.student.studentId}
                                </Text>
                              </View>
                              <View style={styles.studentNameWrap}>
                                <Text style={styles.studentName}>{item.user.name}</Text>
                                {item.record?.markedBy && (
                                  <Text style={styles.methodTag}>
                                    {item.record.markedBy === 'otp'
                                      ? 'OTP Verified'
                                      : 'Manual Override'}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <View style={styles.statusAndEdit}>
                              <StatusBadge status={status} size="small" />
                              <View style={styles.pencilBox}>
                                <IconSymbol size={13} name="pencil" color={APP_COLORS.obsidian} />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* Admin Record Correction Modal */}
      <Modal visible={correctingRecord !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <IconSymbol size={24} name="pencil.and.outline" color={APP_COLORS.obsidian} />
            </View>

            <Text style={styles.modalTitle}>Override Attendance Record</Text>
            <Text style={styles.modalSubtitle}>
              Manual administrative correction for institutional audit logs
            </Text>

            <View style={styles.studentSummaryBox}>
              <View style={styles.studentSummaryRow}>
                <Text style={styles.summaryLabel}>Student:</Text>
                <Text style={styles.summaryValue}>{correctingRecord?.studentName}</Text>
              </View>
              <View style={styles.studentSummaryRow}>
                <Text style={styles.summaryLabel}>Roll ID:</Text>
                <Text style={styles.summaryValue}>{correctingRecord?.studentPublicId}</Text>
              </View>
              <View style={styles.studentSummaryRow}>
                <Text style={styles.summaryLabel}>Recorded Status:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        correctingRecord?.currentStatus === 'present'
                          ? APP_COLORS.safeText
                          : APP_COLORS.shortageText,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {correctingRecord?.currentStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.correctionBtnStack}>
              <AppButton
                title="Mark as Present"
                onPress={() => handleApplyCorrection('present')}
                loading={savingCorrection}
                variant="primary"
                size="large"
                style={styles.correctBtn}
              />
              <AppButton
                title="Mark as Absent"
                onPress={() => handleApplyCorrection('absent')}
                loading={savingCorrection}
                variant="danger"
                size="large"
                style={styles.correctBtn}
              />
              <AppButton
                title="Cancel"
                onPress={() => setCorrectingRecord(null)}
                variant="outline"
                size="large"
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
  exportHeroCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.md,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  exportHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: TOKENS.spacing.md,
  },
  exportIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.08)',
  },
  exportTextWrap: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  exportSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 17,
  },
  exportActionWrap: {
    paddingHorizontal: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.md,
  },
  exportBtn: {
    width: '100%',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterRail: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  recordCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  recordCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  departmentLabel: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  sessionList: {
    gap: 12,
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  sessionHeader: {
    padding: TOKENS.spacing.md,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectCodePill: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  sessionDate: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '600',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sessionInstructor: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 12,
  },
  metricsContainer: {
    marginBottom: 12,
  },
  countsRow: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
  },
  countVal: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  countLbl: {
    fontSize: 10,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  turnoutMeter: {
    height: 4,
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  turnoutFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.obsidian,
  },
  rosterWrap: {
    backgroundColor: APP_COLORS.surfaceVariant,
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  rosterHeaderRow: {
    marginBottom: 8,
  },
  rosterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  emptyRoster: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  studentDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentIdBadge: {
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  studentIdBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  studentNameWrap: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  methodTag: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  statusAndEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pencilBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.card,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 16,
  },
  studentSummaryBox: {
    backgroundColor: APP_COLORS.surfaceVariant,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    gap: 6,
  },
  studentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: APP_COLORS.text,
    fontWeight: '700',
  },
  correctionBtnStack: {
    gap: 10,
  },
  correctBtn: {
    width: '100%',
  },
});
