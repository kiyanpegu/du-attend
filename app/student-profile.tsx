import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { AppUpdateCard } from '@/components/app/AppUpdateCard';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, SubjectAttendanceSummary } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function StudentProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectAttendanceSummary[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
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
        <Header
          title="Student Profile"
          subtitle="Academic Identity & Settings"
          showBack={false}
          rightAction={{
            icon: 'arrow.clockwise',
            onPress: loadData,
            label: 'Refresh',
          }}
        />

        {/* Student Identity Card (Visual Focus) */}
        <Card style={styles.identityCard} padded>
          <View style={styles.avatarWrap}>
            <IconSymbol size={36} name="person.fill" color={APP_COLORS.primary} />
          </View>
          <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.userStudentId}>Roll No: {student.studentId}</Text>
          <Text style={styles.userAcademicTag}>
            {programme?.name ?? 'BCA'} • {semester?.name ?? '1st Semester'}
          </Text>
          <Text style={styles.userInstitutionText}>
            {university?.name ?? 'Dibrugarh University'}
          </Text>
          <View style={styles.badgeWrapper}>
            <StatusBadge
              status={student.active ? 'present' : 'critical'}
              label={student.active ? 'ENROLLED & ACTIVE' : 'INACTIVE'}
              size="small"
            />
          </View>
        </Card>

        {/* Academic Information Card */}
        <Card style={styles.sectionCard} padded>
          <Text style={styles.sectionTitle}>ACADEMIC INFORMATION</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>University</Text>
            <Text style={styles.infoValue}>{university?.name ?? 'Dibrugarh University'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {department?.name ?? 'CCSA'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Programme</Text>
            <Text style={styles.infoValue}>{programme?.name ?? 'BCA'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semester</Text>
            <Text style={styles.infoValue}>{semester?.name ?? 'BCA 1st Semester'}</Text>
          </View>

          <View style={styles.infoRowNoBorder}>
            <Text style={styles.infoLabel}>Student Roll ID</Text>
            <Text style={styles.infoValue}>{student.studentId}</Text>
          </View>
        </Card>

        {/* Enrolled Courses Card */}
        <Card style={styles.sectionCard} padded>
          <View style={styles.enrolledHeaderRow}>
            <Text style={styles.sectionTitle}>ENROLLED SUBJECTS</Text>
            <Text style={styles.enrolledCountBadge}>{subjects.length} Courses</Text>
          </View>

          {subjects.map((sub, idx) => (
            <View
              key={sub.subject.id || idx}
              style={[
                styles.subjectRow,
                idx === subjects.length - 1 && styles.subjectRowLast,
              ]}
            >
              <View style={styles.subjectInfo}>
                <View style={styles.subjectCodePill}>
                  <Text style={styles.subjectCodeText}>{sub.subject.code}</Text>
                </View>
                <View style={styles.subjectTextWrap}>
                  <Text style={styles.subName} numberOfLines={1}>
                    {sub.subject.name}
                  </Text>
                  <Text style={styles.subFaculty} numberOfLines={1}>
                    {sub.facultyName}
                  </Text>
                </View>
              </View>
              <StatusBadge status={sub.standing} size="small" />
            </View>
          ))}
        </Card>

        {/* In-App Self-Updating System */}
        <AppUpdateCard style={{ marginBottom: TOKENS.spacing.lg }} />

        {/* Destructive Sign Out Action */}
        <View style={styles.actionWrap}>
          <AppButton
            title="Sign Out from DU Attend"
            onPress={handleLogout}
            variant="danger"
            icon="rectangle.portrait.and.arrow.right"
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
    backgroundColor: APP_COLORS.canvas,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  identityCard: {
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    marginBottom: TOKENS.spacing.md,
    borderRadius: TOKENS.rounded.card,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: APP_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 94, 54, 0.25)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 2,
    textAlign: 'center',
  },
  userStudentId: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  userAcademicTag: {
    fontSize: 13,
    color: APP_COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  userInstitutionText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 10,
  },
  badgeWrapper: {
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: TOKENS.spacing.md,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  infoRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  enrolledHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enrolledCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  subjectRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  subjectInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  subjectCodePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: TOKENS.rounded.xs,
  },
  subjectCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  subjectTextWrap: {
    flex: 1,
  },
  subName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 1,
  },
  subFaculty: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  actionWrap: {
    marginTop: 6,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
