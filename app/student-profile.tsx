import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, SubjectAttendanceSummary } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function StudentProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectAttendanceSummary[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'student') {
      router.replace('/student-login' as never);
      return;
    }

    const [profile, subs, live] = await Promise.all([
      studentService.getProfile(user.id),
      studentService.getSubjects(user.id),
      attendanceService.getActiveSessionsForStudent(user.id),
    ]);

    setProfileData(profile);
    setSubjects(subs);
    setActiveSessions(live);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from DU Attend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/' as never);
        },
      },
    ]);
  };

  if (loading || !profileData) {
    return <LoadingState message="Loading student profile..." />;
  }

  const { user, student, programme, semester, department, university } = profileData;

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        <Header title="Student Profile" subtitle="Academic Record & Settings" showBack={false} />

        {/* Profile Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrap}>
            <IconSymbol size={40} name="person.fill" color={APP_COLORS.primary} />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userStudentId}>{student.studentId}</Text>
          <StatusBadge
            status={student.active ? 'good' : 'critical'}
            label={student.active ? 'ACTIVE ENROLMENT' : 'DISABLED'}
            style={styles.statusBadge}
          />
        </View>

        {/* Academic Affiliation */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACADEMIC AFFILIATION</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>University</Text>
            <Text style={styles.infoValue}>{university?.name ?? 'Dibrugarh University'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{department?.name ?? 'Centre for Computer Science and Applications'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Programme</Text>
            <Text style={styles.infoValue}>{programme?.name ?? 'BCA'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semester</Text>
            <Text style={styles.infoValue}>{semester?.name ?? 'BCA 1st Semester'}</Text>
          </View>
        </Card>

        {/* Enrolled Courses */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ENROLLED SUBJECTS ({subjects.length})</Text>

          {subjects.map((sub, idx) => (
            <View key={sub.subject.id || idx} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subName}>{sub.subject.name}</Text>
                <Text style={styles.subCode}>
                  {sub.subject.code} • {sub.facultyName}
                </Text>
              </View>
              <StatusBadge status={sub.standing} size="small" />
            </View>
          ))}
        </Card>

        {/* Actions & Disclaimers */}
        <View style={styles.actionWrap}>
          <AppButton
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
          />
          <Text style={styles.disclaimerText}>
            Independent demo prototype. Not an official Dibrugarh University application.
          </Text>
        </View>
      </AppScreen>

      <StudentBottomNav currentTab="profile" hasActiveClass={activeSessions.length > 0} />
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
  avatarCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: `${APP_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: `${APP_COLORS.primary}40`,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  userStudentId: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 10,
  },
  sectionCard: {
    marginBottom: 16,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  infoLabel: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  subjectInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  subCode: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  actionWrap: {
    marginTop: 10,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
