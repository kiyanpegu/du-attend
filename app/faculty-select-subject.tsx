import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { EmptyState } from '@/components/app/EmptyState';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, GEOFENCE_CONFIG, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import type { Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        'You already have an active class session running. Would you like to view it or cancel it first?',
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
        Alert.alert('Unable to Start Attendance', result.message);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while starting the attendance session.');
    } finally {
      setStartingSubjectId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your assigned courses..." />;
  }

  return (
    <AppScreen scrollable>
      {/* Neo-Tactile Navigation Top Bar */}
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
          <Text style={styles.navTitle}>Start Attendance</Text>
          <Text style={styles.navSubtitle}>Select a course to launch live OTP</Text>
        </View>
      </View>

      {/* Quick Guidance Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconBox}>
          <IconSymbol size={18} name="clock.fill" color={APP_COLORS.primaryWarm} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>60-Second Rotating OTP</Text>
          <Text style={styles.bannerText}>
            Starting a session generates a rolling verification code. Students within {GEOFENCE_CONFIG.campusName} range can check in instantly.
          </Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ASSIGNED COURSES</Text>
        <Text style={styles.sectionBadge}>{subjects.length} Total</Text>
      </View>

      {/* Course Cards List */}
      {subjects.length === 0 ? (
        <EmptyState
          icon="book.closed.fill"
          title="No Assigned Courses"
          message="Contact your university administrator to assign courses to your faculty account."
        />
      ) : (
        <View style={styles.listContainer}>
          {subjects.map((subject) => {
            const isStarting = startingSubjectId === subject.id;
            return (
              <View key={subject.id} style={styles.courseCard}>
                {/* Card Top Row: Code Pill + Venue */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{subject.code}</Text>
                  </View>
                  <View style={styles.venueBadge}>
                    <IconSymbol size={12} name="mappin.and.ellipse" color={APP_COLORS.textSecondary} />
                    <Text style={styles.venueText}>{GEOFENCE_CONFIG.classroomName}</Text>
                  </View>
                </View>

                {/* Course Title */}
                <Text style={styles.courseTitle}>{subject.name}</Text>

                {/* Meta details */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <IconSymbol size={14} name="graduationcap.fill" color={APP_COLORS.textMuted} />
                    <Text style={styles.metaText}>BCA • 1st Semester</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaItem}>
                    <IconSymbol size={14} name="person.2.fill" color={APP_COLORS.textMuted} />
                    <Text style={styles.metaText}>All Enrolled Students</Text>
                  </View>
                </View>

                {/* Bottom Action Button */}
                <View style={styles.actionRow}>
                  <AppButton
                    title={isStarting ? 'Launching Session...' : 'Launch Live Attendance'}
                    onPress={() => handleStartClass(subject)}
                    loading={isStarting}
                    disabled={startingSubjectId !== null}
                    variant="primary"
                    size="medium"
                    style={styles.launchBtn}
                  />
                </View>
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
    gap: 14,
    marginBottom: TOKENS.spacing.lg,
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
    ...TYPOGRAPHY.h2,
  },
  navSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    padding: TOKENS.spacing.base,
    marginBottom: TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: APP_COLORS.categoryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  bannerText: {
    ...TYPOGRAPHY.caption,
    color: APP_COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TOKENS.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.1,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  listContainer: {
    gap: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.xxl,
  },
  courseCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.base,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: TOKENS.rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 71, 0.2)',
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
    letterSpacing: 0.5,
  },
  venueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  venueText: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
    paddingTop: TOKENS.spacing.md,
  },
  launchBtn: {
    width: '100%',
  },
});