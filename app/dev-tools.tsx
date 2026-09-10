import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { DEVELOPMENT_CREDENTIALS } from '@/constants/seedData';
import { authService } from '@/services/authService';
import { storageService } from '@/services/storageService';
import type { LocalDatabase } from '@/types/models';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  return (
    <AppScreen scrollable>
      <Header title="Developer Tools" subtitle="Prototype Utilities & Test Data" showBack />

      <View style={styles.devBanner}>
        <IconSymbol size={20} name="exclamationmark.triangle.fill" color={APP_COLORS.warning} />
        <Text style={styles.devBannerText}>
          DEVELOPMENT USE ONLY — These utilities provide quick testing shortcuts and database reset mechanisms.
        </Text>
      </View>

      {/* Quick Login Section */}
      <Text style={styles.sectionTitle}>1-Tap Rapid Role Switcher</Text>

      {/* Students */}
      <Card style={styles.credCard}>
        <Text style={styles.roleHeader}>STUDENTS (BCA 1st Sem)</Text>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.students.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.loginPill}
              onPress={() => handleQuickLogin('student', st.id, st.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <IconSymbol size={14} name="person.fill" color={APP_COLORS.primary} />
              <Text style={styles.loginPillText}>{st.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Faculty */}
      <Card style={styles.credCard}>
        <Text style={styles.roleHeader}>FACULTY INSTRUCTORS</Text>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.faculty.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.loginPill, { borderColor: `${APP_COLORS.success}40` }]}
              onPress={() => handleQuickLogin('faculty', f.id, f.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <IconSymbol size={14} name="person.2.fill" color={APP_COLORS.success} />
              <Text style={[styles.loginPillText, { color: APP_COLORS.success }]}>{f.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Admin */}
      <Card style={styles.credCard}>
        <Text style={styles.roleHeader}>SYSTEM ADMINISTRATOR</Text>
        <View style={styles.pillsWrap}>
          {DEVELOPMENT_CREDENTIALS.admin.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.loginPill, { borderColor: `${APP_COLORS.warning}40` }]}
              onPress={() => handleQuickLogin('admin', a.id, a.password)}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <IconSymbol size={14} name="shield.fill" color={APP_COLORS.warning} />
              <Text style={[styles.loginPillText, { color: APP_COLORS.warning }]}>{a.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Database Diagnostic Counts */}
      <Text style={styles.sectionTitle}>Database Status</Text>
      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Total Users</Text>
          <Text style={styles.statVal}>{database.users.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Registered Students</Text>
          <Text style={styles.statVal}>{database.students.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Faculty Members</Text>
          <Text style={styles.statVal}>{database.faculties.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Subjects / Courses</Text>
          <Text style={styles.statVal}>{database.subjects.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Course Enrolments</Text>
          <Text style={styles.statVal}>{database.enrollments.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Attendance Sessions</Text>
          <Text style={styles.statVal}>{database.attendanceSessions.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Attendance Records</Text>
          <Text style={styles.statVal}>{database.attendanceRecords.length}</Text>
        </View>
      </Card>

      {/* Danger Zone: Resets */}
      <Text style={styles.sectionTitle}>Database Reset Tools</Text>
      <View style={styles.resetActions}>
        <AppButton
          title="Reset Attendance History"
          onPress={handleResetAttendance}
          loading={actionLoading}
          variant="outline"
          style={styles.resetBtn}
        />
        <AppButton
          title="Reset All Database to Initial Seed"
          onPress={handleResetFullDatabase}
          loading={actionLoading}
          variant="danger"
          style={styles.resetBtn}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${APP_COLORS.warning}15`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${APP_COLORS.warning}30`,
  },
  devBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.warning,
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  credCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  roleHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: `${APP_COLORS.primary}40`,
  },
  loginPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
  statsCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  statKey: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  resetActions: {
    gap: 12,
    marginBottom: 30,
  },
  resetBtn: {
    width: '100%',
  },
});
