import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import type { Subject } from '@/types/models';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function FacultySelectSubjectScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSubjectId, setStartingSubjectId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    const assigned = await facultyService.getAssignedSubjects(user.id);
    setSubjects(assigned);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartClass = async (subject: Subject) => {
    const user = await authService.getActiveUser();
    if (!user) return;

    // Check if there is already an active session
    const active = await attendanceService.getActiveSessionForFaculty(user.id);
    if (active) {
      Alert.alert(
        'Active Class Running',
        'You already have a class active. Would you like to go to it or cancel it first?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Active Class',
            onPress: () => router.push('/faculty-active-class' as never),
          },
        ]
      );
      return;
    }

    setStartingSubjectId(subject.id);
    try {
      const result = await attendanceService.startClass(user.id, subject.id);
      if (result.ok) {
        router.replace('/faculty-active-class' as never);
      } else {
        Alert.alert('Unable to Start Class', result.message);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while starting the class.');
    } finally {
      setStartingSubjectId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your assigned subjects..." />;
  }

  return (
    <AppScreen scrollable>
      <Header title="Start a Class" subtitle="Select Subject for Attendance" showBack />

      <View style={styles.banner}>
        <IconSymbol size={20} name="info.circle.fill" color={APP_COLORS.info} />
        <Text style={styles.bannerText}>
          Starting a class will generate a unique 6-digit OTP valid for 60 seconds. You can start attendance whenever you are ready.
        </Text>
      </View>

      {subjects.length === 0 ? (
        <EmptyState
          icon="book"
          title="No Assigned Subjects"
          message="Contact your university administrator to assign subjects to your faculty account."
        />
      ) : (
        subjects.map((subject) => (
          <Card key={subject.id} style={styles.subjectCard}>
            <View style={styles.cardContent}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectMeta}>
                  {subject.code} • BCA 1st Semester
                </Text>
              </View>

              <AppButton
                title={startingSubjectId === subject.id ? 'Starting...' : 'Start Class'}
                onPress={() => handleStartClass(subject)}
                loading={startingSubjectId === subject.id}
                variant="primary"
                size="medium"
                style={styles.startBtn}
              />
            </View>
          </Card>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${APP_COLORS.info}15`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: `${APP_COLORS.info}30`,
  },
  bannerText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  subjectCard: {
    marginBottom: 12,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  subjectMeta: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  startBtn: {
    paddingHorizontal: 18,
  },
});