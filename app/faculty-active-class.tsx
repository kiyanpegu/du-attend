import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { OTPDisplay } from '@/components/app/OTPDisplay';
import { ProgressBar } from '@/components/app/ProgressBar';
import { StudentRow } from '@/components/app/StudentRow';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import type { FacultySessionReport } from '@/types/models';
import { useFocusEffect , useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function FacultyActiveClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const [report, setReport] = useState<FacultySessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSession = useCallback(async () => {
    const user = await authService.getActiveUser();
    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    // Check if subjectId was passed and no active session exists yet
    let activeSession = await attendanceService.getActiveSessionForFaculty(user.id);

    if (!activeSession && params.subjectId) {
      const startRes = await attendanceService.startClass(user.id, params.subjectId);
      if (startRes.ok && startRes.data) {
        activeSession = startRes.data;
      }
    }

    if (!activeSession) {
      setReport(null);
      setLoading(false);
      return;
    }

    const sessionReport = await attendanceService.getSessionReport(activeSession.id);
    setReport(sessionReport);

    if (sessionReport) {
      setSecondsLeft(attendanceService.getSecondsRemaining(sessionReport.session));
    }
    setLoading(false);
  }, [params.subjectId, router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        if (active) {
          await loadSession();
        }
      };

      run();

      // Poll every 2 seconds for live submissions from students
      const pollInterval = setInterval(run, 2000);

      return () => {
        active = false;
        clearInterval(pollInterval);
      };
    }, [loadSession])
  );

  // Local second countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRegenerateOtp = async () => {
    if (!report) return;

    setActionLoading(true);
    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.regenerateOtp(user.id, report.session.id);
    setActionLoading(false);

    if (result.ok && result.data) {
      setSecondsLeft(attendanceService.getSecondsRemaining(result.data));
      await loadSession();
      Alert.alert('New OTP Active', 'A new 6-digit OTP has been generated for 60 seconds.');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleMarkManual = async (studentId: string, status: 'present' | 'absent') => {
    if (!report) return;

    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.markManual(user.id, report.session.id, studentId, status);
    if (result.ok) {
      await loadSession();
    } else {
      Alert.alert('Unable to mark attendance', result.message);
    }
  };

  const handleEndClass = () => {
    if (!report) return;

    const unmarkedCount = report.unmarkedCount;

    Alert.alert(
      'End Class & Finalize Attendance',
      unmarkedCount > 0
        ? `Are you sure? ${unmarkedCount} unmarked student${unmarkedCount === 1 ? '' : 's'} will be recorded as Absent. OTP will be immediately invalidated.`
        : 'Are you sure you want to end this class session? The OTP will be invalidated and attendance finalized.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const user = await authService.getActiveUser();
            if (!user) return;

            const result = await attendanceService.endClass(user.id, report.session.id);
            setActionLoading(false);

            if (result.ok) {
              Alert.alert('Class Finalized', 'Class ended successfully. Attendance records have been saved.');
              router.replace('/faculty-dashboard' as never);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleCancelClass = () => {
    if (!report) return;

    Alert.alert(
      'Cancel Class',
      'Canceling will invalidate the OTP and exclude this session from conducted class totals. No attendance will be counted. Are you sure?',
      [
        { text: 'Keep Class', style: 'cancel' },
        {
          text: 'Cancel Class',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const user = await authService.getActiveUser();
            if (!user) return;

            const result = await attendanceService.cancelClass(user.id, report.session.id);
            setActionLoading(false);

            if (result.ok) {
              Alert.alert('Class Cancelled', 'Session was cancelled and excluded from class totals.');
              router.replace('/faculty-dashboard' as never);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading live attendance session..." />;
  }

  if (!report) {
    return (
      <AppScreen>
        <Header title="Active Class" subtitle="Session Management" showBack />
        <Card style={styles.noActiveCard}>
          <IconSymbol size={48} name="tray" color={APP_COLORS.textMuted} />
          <Text style={styles.noActiveTitle}>No Active Class Session</Text>
          <Text style={styles.noActiveDesc}>
            You do not currently have any live attendance class running.
          </Text>
          <AppButton
            title="Start a Class"
            onPress={() => router.replace('/faculty-select-subject' as never)}
            variant="primary"
            style={styles.startClassBtn}
          />
        </Card>
      </AppScreen>
    );
  }

  const isExpired = secondsLeft <= 0;

  return (
    <AppScreen scrollable>
      <Header
        title={report.subject.name}
        subtitle={`${report.subject.code} • Started at ${new Date(report.session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        showBack
        onBack={() => router.replace('/faculty-dashboard' as never)}
      />

      {/* OTP Display Block */}
      <View style={styles.otpSection}>
        <OTPDisplay
          otp={report.session.otp}
          secondsRemaining={secondsLeft}
          expired={isExpired}
        />

        <View style={styles.otpActions}>
          <AppButton
            title={isExpired ? 'Generate New OTP (60s)' : 'Regenerate OTP'}
            onPress={handleRegenerateOtp}
            loading={actionLoading}
            variant={isExpired ? 'primary' : 'outline'}
            size="medium"
            style={styles.regenerateBtn}
          />
        </View>
      </View>

      {/* Live Statistics Cards */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Live Statistics</Text>

        <View style={styles.statRow}>
          <View style={styles.statTextRow}>
            <Text style={styles.statRowLabel}>Present</Text>
            <Text style={styles.statRowValue}>{report.presentCount}</Text>
          </View>
          <ProgressBar 
            progress={report.enrolledCount > 0 ? (report.presentCount / report.enrolledCount) * 100 : 0} 
            standing="good" 
            height={8} 
          />
        </View>

        <View style={styles.statRow}>
          <View style={styles.statTextRow}>
            <Text style={styles.statRowLabel}>Absent</Text>
            <Text style={styles.statRowValue}>{report.absentCount}</Text>
          </View>
          <ProgressBar 
            progress={report.enrolledCount > 0 ? (report.absentCount / report.enrolledCount) * 100 : 0} 
            standing="critical" 
            height={8} 
          />
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Students</Text>
          <Text style={styles.totalValue}>{report.enrolledCount}</Text>
        </View>
      </View>

      {/* Roster & Manual Attendance Section */}
      <View style={styles.rosterSectionHeader}>
        <View>
          <Text style={styles.rosterTitle}>STUDENT ATTENDANCE ROSTER</Text>
          <Text style={styles.rosterSubtitle}>
            Live OTP submissions & manual attendance controls
          </Text>
        </View>
      </View>

      {report.roster.map((studentStatus, index) => (
        <StudentRow
          key={studentStatus.student.id}
          index={index}
          studentStatus={studentStatus}
          showActions={true}
          onMarkPresent={() => handleMarkManual(studentStatus.student.id, 'present')}
          onMarkAbsent={() => handleMarkManual(studentStatus.student.id, 'absent')}
        />
      ))}

      {/* Control Actions: End Class & Cancel Class */}
      <View style={styles.classControls}>
        <AppButton
          title="End Class & Finalize Attendance"
          onPress={handleEndClass}
          loading={actionLoading}
          variant="primary"
          style={styles.endClassBtn}
        />

        <AppButton
          title="Cancel Class"
          onPress={handleCancelClass}
          loading={actionLoading}
          variant="danger"
          style={styles.cancelClassBtn}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  otpSection: {
    marginBottom: 16,
  },
  otpActions: {
    marginTop: 10,
    alignItems: 'center',
  },
  regenerateBtn: {
    width: '100%',
  },
  statsCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 16,
  },
  statTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statRowLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  rosterSectionHeader: {
    marginBottom: 12,
  },
  rosterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  rosterSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  classControls: {
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  endClassBtn: {
    width: '100%',
  },
  cancelClassBtn: {
    width: '100%',
  },
  noActiveCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  noActiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  noActiveDesc: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  startClassBtn: {
    width: '100%',
  },
});