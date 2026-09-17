import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { EmptyState } from '@/components/app/EmptyState';
import { LoadingState } from '@/components/app/LoadingState';
import { ProgressBar } from '@/components/app/ProgressBar';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, GEOFENCE_CONFIG, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { authService } from '@/services/authService';
import { exportService } from '@/services/exportService';
import { facultyService } from '@/services/facultyService';
import { storageService } from '@/services/storageService';
import type { Subject } from '@/types/models';
import { calculatePercentage, getAttendanceStanding } from '@/utils/format';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface StudentSubjectReport {
  studentId: string;
  studentPublicId: string;
  studentName: string;
  attended: number;
  conducted: number;
  percentage: number;
  standing: 'good' | 'warning' | 'critical' | 'none';
}

interface SubjectReportData {
  subject: Subject;
  totalConducted: number;
  averagePercentage: number;
  students: StudentSubjectReport[];
  criticalCount: number;
  warningCount: number;
  eligibleCount: number;
}

export default function FacultyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<SubjectReportData[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingSubjectId, setExportingSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'good' | 'warning' | 'critical'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    const database = await storageService.getDatabase();
    const assignedSubjects = await facultyService.getAssignedSubjects(user.id);

    const subjectReports: SubjectReportData[] = [];

    for (const subject of assignedSubjects) {
      // Find conducted ended sessions for this subject
      const endedSessions = database.attendanceSessions.filter(
        (s) => s.subjectId === subject.id && s.status === 'ended'
      );
      const totalConducted = endedSessions.length;

      // Find enrolled students
      const enrollments = database.enrollments.filter(
        (e) => e.subjectId === subject.id && e.active
      );

      const studentsReport: StudentSubjectReport[] = [];

      enrollments.forEach((enrollment) => {
        const student = database.students.find((s) => s.id === enrollment.studentId && s.active);
        const studentUser = database.users.find((u) => u.id === student?.userId && u.active);

        if (!student || !studentUser) return;

        const attended = endedSessions.filter((session) => {
          const record = database.attendanceRecords.find(
            (r) => r.sessionId === session.id && r.studentId === student.id
          );
          return record?.status === 'present';
        }).length;

        const percentage = calculatePercentage(attended, totalConducted);
        const standing = getAttendanceStanding(percentage, totalConducted);

        studentsReport.push({
          studentId: student.id,
          studentPublicId: student.studentId,
          studentName: studentUser.name,
          attended,
          conducted: totalConducted,
          percentage,
          standing,
        });
      });

      const totalPct = studentsReport.reduce((sum, s) => sum + s.percentage, 0);
      const averagePercentage = studentsReport.length > 0 ? Math.round(totalPct / studentsReport.length) : 0;
      const criticalCount = studentsReport.filter((s) => s.standing === 'critical').length;
      const warningCount = studentsReport.filter((s) => s.standing === 'warning').length;
      const eligibleCount = studentsReport.filter((s) => s.standing === 'good').length;

      subjectReports.push({
        subject,
        totalConducted,
        averagePercentage,
        students: studentsReport.sort((a, b) => a.studentPublicId.localeCompare(b.studentPublicId)),
        criticalCount,
        warningCount,
        eligibleCount,
      });
    }

    setReports(subjectReports);
    if (subjectReports.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectReports[0].subject.id);
    }
    setLoading(false);
  }, [router, selectedSubjectId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleExportCsv = async (report: SubjectReportData) => {
    setExportingSubjectId(report.subject.id);
    try {
      const csv = exportService.generateSubjectCsv(
        report.subject.code,
        report.subject.name,
        report.totalConducted,
        report.students
      );
      const fileName = `${report.subject.code}_Attendance_Report.csv`;
      const res = await exportService.exportAndShareCsv(fileName, csv);
      if (!res.ok) {
        Alert.alert('Export Notice', res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export report.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingSubjectId(null);
    }
  };

  const activeReport = useMemo(() => {
    if (reports.length === 0) return null;
    return reports.find((r) => r.subject.id === selectedSubjectId) || reports[0];
  }, [reports, selectedSubjectId]);

  // Filter student roster
  const filteredStudents = useMemo(() => {
    if (!activeReport) return [];

    return activeReport.students.filter((st) => {
      // Eligibility filter
      if (eligibilityFilter !== 'all') {
        if (st.standing !== eligibilityFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = st.studentName.toLowerCase().includes(query);
        const matchesId = st.studentPublicId.toLowerCase().includes(query);
        return matchesName || matchesId;
      }

      return true;
    });
  }, [activeReport, eligibilityFilter, searchQuery]);

  if (loading) {
    return <LoadingState message="Calculating attendance reports..." />;
  }

  if (reports.length === 0 || !activeReport) {
    return (
      <AppScreen>
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
            <Text style={styles.navTitle}>Attendance Reports</Text>
            <Text style={styles.navSubtitle}>Student Eligibility & Analytics</Text>
          </View>
        </View>

        <EmptyState
          icon="chart.bar"
          title="No Assigned Courses"
          message="You have no assigned courses to generate attendance reports for."
        />
      </AppScreen>
    );
  }

  const isExporting = exportingSubjectId === activeReport.subject.id;
  const averageStanding = activeReport.averagePercentage >= 75
    ? 'good'
    : activeReport.averagePercentage >= 50
    ? 'warning'
    : 'critical';

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
          <Text style={styles.navTitle}>Attendance Reports</Text>
          <Text style={styles.navSubtitle}>Student Eligibility & Course Analytics</Text>
        </View>
      </View>

      {/* Course Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {reports.map((r) => {
            const isSelected = activeReport.subject.id === r.subject.id;
            return (
              <TouchableOpacity
                key={r.subject.id}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setSelectedSubjectId(r.subject.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {r.subject.code}
                </Text>
                <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                    {r.students.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Subject Performance Overview Card */}
      <View style={styles.overviewCard}>
        {/* Card Header: Code Pill + Context */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.codePill}>
            <Text style={styles.codePillText}>{activeReport.subject.code}</Text>
          </View>
          <View style={styles.contextBadge}>
            <IconSymbol size={12} name="mappin.and.ellipse" color={APP_COLORS.textMuted} />
            <Text style={styles.contextText}>{GEOFENCE_CONFIG.classroomName}</Text>
          </View>
        </View>

        {/* Subject Title */}
        <Text style={styles.subjectTitle}>{activeReport.subject.name}</Text>
        <Text style={styles.programSubtitle}>BCA • 1st Semester • Dibrugarh University</Text>

        {/* 4-Tile Operational Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricNumber}>{activeReport.totalConducted}</Text>
            <Text style={styles.metricLabel}>CLASSES</Text>
            <Text style={styles.metricSub}>Conducted</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={[
              styles.metricNumber,
              {
                color: activeReport.totalConducted === 0
                  ? APP_COLORS.textMuted
                  : averageStanding === 'good'
                  ? APP_COLORS.success
                  : averageStanding === 'warning'
                  ? APP_COLORS.warning
                  : APP_COLORS.danger,
              },
            ]}>
              {activeReport.totalConducted === 0 ? 'N/A' : `${activeReport.averagePercentage}%`}
            </Text>
            <Text style={styles.metricLabel}>AVERAGE</Text>
            <Text style={styles.metricSub}>Attendance</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={[styles.metricNumber, { color: APP_COLORS.success }]}>
              {activeReport.eligibleCount}
            </Text>
            <Text style={[styles.metricLabel, { color: APP_COLORS.success }]}>ELIGIBLE</Text>
            <Text style={styles.metricSub}>≥75% Rate</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={[styles.metricNumber, { color: APP_COLORS.danger }]}>
              {activeReport.criticalCount}
            </Text>
            <Text style={[styles.metricLabel, { color: APP_COLORS.danger }]}>DEBAR RISK</Text>
            <Text style={styles.metricSub}>&lt;50% Rate</Text>
          </View>
        </View>

        {/* Class Attendance Benchmark Progress Bar */}
        <View style={styles.benchmarkSection}>
          <View style={styles.benchmarkHeader}>
            <Text style={styles.benchmarkTitle}>Class Attendance Benchmark</Text>
            <Text style={styles.benchmarkRequirement}>75% Required for Exam</Text>
          </View>
          <ProgressBar
            progress={activeReport.averagePercentage}
            standing={averageStanding}
            height={7}
            style={styles.benchmarkBar}
          />
        </View>

        {/* CSV Export Button */}
        <View style={styles.exportActionRow}>
          <AppButton
            title={isExporting ? 'Exporting CSV...' : `Export ${activeReport.subject.code} CSV Report`}
            onPress={() => handleExportCsv(activeReport)}
            loading={isExporting}
            variant="primary"
            size="medium"
            style={styles.exportBtn}
          />
        </View>
      </View>

      {/* Student Breakdown Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitle}>STUDENT ELIGIBILITY BREAKDOWN</Text>
          <Text style={styles.sectionSubtitle}>
            Individual attendance qualification for semester examinations ({filteredStudents.length} of {activeReport.students.length})
          </Text>
        </View>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.filterToolbar}>
        {/* Search student */}
        <View style={styles.searchBox}>
          <IconSymbol size={16} name="magnifyingglass" color={APP_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student by name or roll number..."
            placeholderTextColor={APP_COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Eligibility Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(
            [
              { key: 'all', label: `All (${activeReport.students.length})` },
              { key: 'good', label: `Eligible (${activeReport.eligibleCount})` },
              { key: 'warning', label: `Warning (${activeReport.warningCount})` },
              { key: 'critical', label: `Critical (${activeReport.criticalCount})` },
            ] as const
          ).map((filter) => {
            const isSelected = eligibilityFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setEligibilityFilter(filter.key)}
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

      {/* Student Roster Cards List */}
      <View style={styles.studentList}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyRosterCard}>
            <Text style={styles.emptyRosterText}>No students match the selected eligibility criteria.</Text>
          </View>
        ) : (
          filteredStudents.map((st, index) => {
            const isEven = index % 2 === 0;
            const pctColor = st.percentage >= 75
              ? APP_COLORS.success
              : st.percentage >= 50
              ? APP_COLORS.warning
              : APP_COLORS.danger;

            return (
              <View
                key={st.studentId}
                style={[styles.studentCard, isEven && styles.studentCardEven]}
              >
                {/* Student Top Row */}
                <View style={styles.studentTopRow}>
                  <View style={styles.studentIdentity}>
                    <View style={styles.rollBadge}>
                      <Text style={styles.rollBadgeText}>{st.studentPublicId}</Text>
                    </View>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {st.studentName}
                    </Text>
                  </View>
                  <StatusBadge
                    status={st.standing}
                    label={
                      st.standing === 'good'
                        ? 'Eligible'
                        : st.standing === 'warning'
                        ? 'Warning'
                        : st.standing === 'critical'
                        ? 'Critical Risk'
                        : 'No Classes'
                    }
                    size="small"
                  />
                </View>

                {/* Attendance Numbers */}
                <View style={styles.studentStatsRow}>
                  <Text style={styles.studentStatText}>
                    {st.attended} of {st.conducted} classes attended
                  </Text>
                  <Text style={[styles.studentPctText, { color: pctColor }]}>
                    {st.conducted === 0 ? 'No classes' : `${st.percentage}%`}
                  </Text>
                </View>

                {/* Individual Progress Bar */}
                <ProgressBar
                  progress={st.percentage}
                  standing={st.standing === 'none' ? 'good' : st.standing}
                  height={5}
                  style={styles.studentProgressBar}
                />
              </View>
            );
          })
        )}
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
  tabContainer: {
    marginBottom: TOKENS.spacing.md,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  tabChipActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: TOKENS.rounded.full,
  },
  tabBadgeActive: {
    backgroundColor: APP_COLORS.obsidianSoft,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  overviewCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.base,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.lg,
    ...TOKENS.shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  subjectTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: APP_COLORS.text,
    lineHeight: 24,
    marginBottom: 2,
  },
  programSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.canvas,
    borderRadius: TOKENS.rounded.md,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: APP_COLORS.border,
  },
  benchmarkSection: {
    marginBottom: 16,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  benchmarkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  benchmarkRequirement: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  benchmarkBar: {
    marginTop: 2,
  },
  exportActionRow: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
    paddingTop: 12,
  },
  exportBtn: {
    width: '100%',
  },
  sectionHeader: {
    marginBottom: TOKENS.spacing.sm,
  },
  sectionTitleBox: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.1,
  },
  sectionSubtitle: {
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
  studentList: {
    gap: 8,
    paddingBottom: TOKENS.spacing.xxxl,
  },
  emptyRosterCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  emptyRosterText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
  studentCard: {
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
  studentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
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
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    flexShrink: 1,
  },
  studentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  studentStatText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  studentPctText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  studentProgressBar: {
    marginTop: 2,
  },
});