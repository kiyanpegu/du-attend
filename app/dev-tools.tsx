import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { AppUpdateCard } from '@/components/app/AppUpdateCard';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { DEVELOPMENT_CREDENTIALS } from '@/constants/seedData';
import { authService } from '@/services/authService';
import { storageService } from '@/services/storageService';
import type { LocalDatabase } from '@/types/models';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DevToolsScreen() {
  const router = useRouter();
  const [database, setDatabase] = useState<LocalDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    const db = await storageService.getDatabase();
    setDatabase(db);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    storageService.getDatabase().then((db) => {
      if (active) {
        setDatabase(db);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleQuickLogin = async (role: 'student' | 'faculty' | 'admin', id: string, pass: string) => {
    setActionLoading(true);
    try {
      const res = await authService.login(role, id, pass);
      if (res.ok) {
        if (role === 'student') router.replace('/student-dashboard' as never);
        if (role === 'faculty') router.replace('/faculty-dashboard' as never);
        if (role === 'admin') router.replace('/admin-dashboard' as never);
      } else {
        Alert.alert('Login Failed', res.message);
      }
    } catch {
      Alert.alert('Error', 'Quick login failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAttendance = async () => {
    Alert.alert(
      'Reset Attendance Data',
      'This will delete all attendance sessions and records. All enrolled students and faculty will remain intact. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Attendance',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            await storageService.resetAttendanceData();
            await loadData();
            setActionLoading(false);
            Alert.alert('Success', 'All test attendance records and sessions have been cleared.');
          },
        },
      ]
    );
  };

  const handleResetFullDatabase = async () => {
    Alert.alert(
      'Reset Entire Database to Seed',
      'This will restore all students, faculties, subjects, and enrollments to initial seed values and clear all attendance records. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Full Reset',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            await storageService.resetDatabaseToSeed();
            await loadData();
            setActionLoading(false);
            Alert.alert('Success', 'Database restored to initial BCA 1st Semester seed data.');
          },
        },
      ]
    );
  };

  if (loading || !database) {
    return <LoadingState message="Loading developer utilities..." />;
  }

  const monoFont = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  });

  return (
    <AppScreen scrollable>
      {/* Top Header */}
      <Header
        title="Developer Tools"
        subtitle="Internal diagnostics, test accounts & database resets"
        showBack
      />

      {/* Developer Context Warning Banner */}
      <View style={styles.devBanner}>
        <View style={styles.devBannerIconBox}>
          <IconSymbol size={18} name="wrench.and.screwdriver" color={APP_COLORS.obsidian} />
        </View>
        <View style={styles.devBannerTextWrap}>
          <View style={styles.devBadgeRow}>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>INTERNAL CONSOLE</Text>
            </View>
            <Text style={styles.devSubBadge}>DEVELOPMENT USE ONLY</Text>
          </View>
          <Text style={styles.devBannerDesc}>
            Non-production diagnostic console for prototype testing, 1-tap authentication, and local state management.
          </Text>
        </View>
      </View>

      {/* In-App Direct Updates Utility */}
      <AppUpdateCard style={{ marginBottom: TOKENS.spacing.md }} />

      {/* 1-Tap Rapid Role Switcher Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>1-Tap Rapid Role Switcher</Text>
        <Text style={styles.sectionSubtitle}>
          Instantly authenticate as any preloaded demo user without manual typing
        </Text>
      </View>

      {/* Students Card */}
      <Card style={styles.roleSwitcherCard} padded={false}>
        <View style={styles.roleCardHeader}>
          <View style={styles.roleIconBoxStudent}>
            <IconSymbol size={16} name="person.fill" color={APP_COLORS.primaryWarm} />
          </View>
          <View style={styles.roleHeaderWrap}>
            <Text style={styles.roleTitle}>Enrolled Students</Text>
            <Text style={styles.roleMeta}>BCA 1st Semester Cohort • 5 Accounts</Text>
          </View>
        </View>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.students.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.studentLoginPill}
              onPress={() => handleQuickLogin('student', st.id, st.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as student ${st.id}`}
            >
              <Text style={[styles.loginPillText, { fontFamily: monoFont, color: APP_COLORS.primaryWarm }]}>
                {st.id}
              </Text>
              <IconSymbol size={12} name="arrow.right" color={APP_COLORS.primaryWarm} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Faculty Card */}
      <Card style={styles.roleSwitcherCard} padded={false}>
        <View style={styles.roleCardHeader}>
          <View style={styles.roleIconBoxFaculty}>
            <IconSymbol size={16} name="briefcase.fill" color={APP_COLORS.categoryText} />
          </View>
          <View style={styles.roleHeaderWrap}>
            <Text style={styles.roleTitle}>Faculty Instructors</Text>
            <Text style={styles.roleMeta}>Department Teachers • 4 Accounts</Text>
          </View>
        </View>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.faculty.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.facultyLoginPill}
              onPress={() => handleQuickLogin('faculty', f.id, f.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as faculty ${f.id}`}
            >
              <Text style={[styles.loginPillText, { fontFamily: monoFont, color: APP_COLORS.categoryText }]}>
                {f.id}
              </Text>
              <IconSymbol size={12} name="arrow.right" color={APP_COLORS.categoryText} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Admin Card */}
      <Card style={styles.roleSwitcherCard} padded={false}>
        <View style={styles.roleCardHeader}>
          <View style={styles.roleIconBoxAdmin}>
            <IconSymbol size={16} name="shield.lefthalf.filled" color={APP_COLORS.obsidian} />
          </View>
          <View style={styles.roleHeaderWrap}>
            <Text style={styles.roleTitle}>System Administrator</Text>
            <Text style={styles.roleMeta}>Academic Superuser • 1 Account</Text>
          </View>
        </View>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.admin.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.adminLoginPill}
              onPress={() => handleQuickLogin('admin', a.id, a.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as admin ${a.id}`}
            >
              <Text style={[styles.loginPillText, { fontFamily: monoFont, color: APP_COLORS.obsidian }]}>
                {a.id}
              </Text>
              <IconSymbol size={12} name="arrow.right" color={APP_COLORS.obsidian} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Database Diagnostic Status */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Local Database Diagnostics</Text>
        <Text style={styles.sectionSubtitle}>
          Real-time record counters from client persistence engine
        </Text>
      </View>

      <Card style={styles.statsCard} padded={false}>
        <View style={styles.statsCardHeader}>
          <View style={styles.statsEngineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.engineText}>AsyncStorage Local DB • Dual-Engine Ready</Text>
          </View>
          <Text style={[styles.versionLabel, { fontFamily: monoFont }]}>v1.2.1-preview</Text>
        </View>

        <View style={styles.statRowsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Total Authentication Users</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.users.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Registered Students</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.students.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Faculty Instructors</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.faculties.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Curriculum Subjects</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.subjects.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Student-Course Enrolments</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.enrollments.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Recorded Attendance Sessions</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.attendanceSessions.length}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statKey}>Individual Attendance Logs</Text>
            <Text style={[styles.statVal, { fontFamily: monoFont }]}>{database.attendanceRecords.length}</Text>
          </View>
        </View>
      </Card>

      {/* Danger Zone: Resets */}
      <View style={styles.sectionHeader}>
        <Text style={styles.dangerSectionTitle}>Danger Zone & State Reset</Text>
        <Text style={styles.sectionSubtitle}>
          Irreversible local state operations. Confirmation required.
        </Text>
      </View>

      <Card style={styles.dangerCard} padded={false}>
        <View style={styles.dangerItem}>
          <View style={styles.dangerItemTextWrap}>
            <Text style={styles.dangerItemTitle}>Clear Attendance History</Text>
            <Text style={styles.dangerItemDesc}>
              Deletes all past attendance sessions and student logs. Preserves all student, faculty, and subject records.
            </Text>
          </View>
          <AppButton
            title="Reset Attendance"
            onPress={handleResetAttendance}
            loading={actionLoading}
            variant="outline"
            style={styles.dangerBtn}
          />
        </View>

        <View style={styles.dangerDivider} />

        <View style={styles.dangerItem}>
          <View style={styles.dangerItemTextWrap}>
            <Text style={styles.dangerItemTitle}>Restore Database to Seed</Text>
            <Text style={styles.dangerItemDesc}>
              Hard reset: erases all modifications, resets all credentials, and reloads initial Dibrugarh University BCA 1st Sem data.
            </Text>
          </View>
          <AppButton
            title="Restore Full Seed"
            onPress={handleResetFullDatabase}
            loading={actionLoading}
            variant="danger"
            style={styles.dangerBtn}
          />
        </View>
      </Card>

      {/* Footer Note */}
      <Text style={styles.footerNote}>
        {APP_IDENTITY.university} • DU Attend Engineering Utilities
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  devBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.md,
    marginBottom: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  devBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBannerTextWrap: {
    flex: 1,
  },
  devBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  devBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  devBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.6,
  },
  devSubBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.attentionText,
  },
  devBannerDesc: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 17,
  },
  sectionHeader: {
    marginTop: TOKENS.spacing.xs,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  dangerSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.shortageText,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  roleSwitcherCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  roleIconBoxStudent: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxFaculty: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: APP_COLORS.categoryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxAdmin: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleHeaderWrap: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  roleMeta: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  studentLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 54, 0.25)',
  },
  facultyLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 71, 0.25)',
  },
  adminLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.15)',
  },
  loginPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.md,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  statsEngineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.safeText,
  },
  engineText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  versionLabel: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '600',
  },
  statRowsContainer: {
    paddingHorizontal: TOKENS.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  statKey: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  dangerCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    marginBottom: 20,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  dangerItem: {
    padding: TOKENS.spacing.md,
    gap: 12,
  },
  dangerItemTextWrap: {
    gap: 4,
  },
  dangerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  dangerItemDesc: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 16,
  },
  dangerBtn: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: APP_COLORS.borderSubtle,
  },
  footerNote: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
});
