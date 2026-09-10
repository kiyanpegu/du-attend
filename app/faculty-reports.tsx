import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { ProgressBar } from '@/components/app/ProgressBar';
import { StatusBadge } from '@/components/app/StatusBadge';
import { APP_COLORS } from '@/constants/duAttend';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import { storageService } from '@/services/storageService';
import type { Subject } from '@/types/models';
import { calculatePercentage, getAttendanceStanding } from '@/utils/format';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

export default function FacultyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<SubjectReportData[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      subjectReports.push({
        subject,
        totalConducted,
        averagePercentage,
        students: studentsReport.sort((a, b) => a.studentPublicId.localeCompare(b.studentPublicId)),
        criticalCount,
        warningCount,
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

  if (loading) {
    return <LoadingState message="Calculating attendance reports..." />;
  }

  if (reports.length === 0) {
    return (
      <AppScreen>
        <Header title="Reports" subtitle="Subject Attendance Reports" showBack />
        <EmptyState
          icon="chart.bar"
          title="No Assigned Subjects"
          message="You have no assigned subjects to generate reports for."
        />
      </AppScreen>
    );
  }

  const activeReport = reports.find((r) => r.subject.id === selectedSubjectId) || reports[0];

  return (
    <AppScreen scrollable>
      <Header title="Attendance Reports" subtitle="Student Eligibility & Analytics" showBack />

      {/* Subject Tab Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {reports.map((r) => (
          <TouchableOpacity
            key={r.subject.id}
            style={[styles.tabChip, activeReport.subject.id === r.subject.id && styles.tabChipActive]}
            onPress={() => setSelectedSubjectId(r.subject.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabChipText, activeReport.subject.id === r.subject.id && styles.tabChipTextActive]}
            >
              {r.subject.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subject Summary Card */}
      <Card style={styles.summaryCard} padded={false}>
        <View style={styles.summaryContent}>
          <Text style={styles.summarySubjectName}>{activeReport.subject.name}</Text>
          <Text style={styles.summaryCode}>
            {activeReport.subject.code} • BCA 1st Semester
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricNumber}>{activeReport.totalConducted}</Text>
              <Text style={styles.metricLabel}>Classes Conducted</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricNumber, { color: APP_COLORS.primary }]}>
                {activeReport.totalConducted === 0 ? 'N/A' : `${activeReport.averagePercentage}%`}
              </Text>
              <Text style={styles.metricLabel}>Class Average</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricNumber, { color: APP_COLORS.danger }]}>
                {activeReport.criticalCount}
              </Text>
              <Text style={styles.metricLabel}>Critical (&lt;50%)</Text>
            </View>
          </View>

          <ProgressBar
            progress={activeReport.averagePercentage}
            standing={activeReport.averagePercentage >= 75 ? 'good' : activeReport.averagePercentage >= 50 ? 'warning' : 'critical'}
            height={8}
            style={styles.summaryProgress}
          />
        </View>
      </Card>

      {/* Student List */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionTitle}>STUDENT ATTENDANCE BREAKDOWN</Text>
        <Text style={styles.sectionSubtitle}>
          Minimum 75% required for university exam eligibility
        </Text>
      </View>

      {activeReport.students.length === 0 ? (
        <Text style={styles.emptyStudentsText}>No students enrolled in this subject.</Text>
      ) : (
        activeReport.students.map((st) => (
          <Card key={st.studentId} style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{st.studentName}</Text>
                <Text style={styles.studentId}>{st.studentPublicId}</Text>
              </View>
              <StatusBadge status={st.standing} size="small" />
            </View>

            <View style={styles.studentStatsRow}>
              <Text style={styles.studentStatText}>
                {st.attended} of {st.conducted} classes attended
              </Text>
              <Text style={[styles.studentPctText, { color: st.percentage >= 75 ? APP_COLORS.success : st.percentage >= 50 ? APP_COLORS.warning : APP_COLORS.danger }]}>
                {st.conducted === 0 ? 'No classes' : `${st.percentage}%`}
              </Text>
            </View>

            <ProgressBar
              progress={st.percentage}
              standing={st.standing === 'none' ? 'good' : st.standing}
              height={6}
              style={styles.studentProgress}
            />
          </Card>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  tabChipActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    marginBottom: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  summaryContent: {
    padding: 16,
  },
  summarySubjectName: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  summaryCode: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryProgress: {
    marginTop: 4,
  },
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  emptyStudentsText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  studentCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  studentId: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  studentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  studentStatText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  studentPctText: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  studentProgress: {
    marginBottom: 2,
  },
});