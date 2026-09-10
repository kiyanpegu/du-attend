import { ActionTile } from '@/components/app/ActionTile';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { MetricCard } from '@/components/app/MetricCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const data = await adminService.getOverview();
    setOverview(data);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Admin console?', [
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

  if (loading || !overview) {
    return <LoadingState message="Loading university administration overview..." />;
  }

  const { reports } = overview;
  const overallRate = reports.totalConducted > 0
    ? Math.round((reports.totalPresent / reports.totalConducted) * 100)
    : 0;

  return (
    <AppScreen scrollable>
      <Header
        title="Admin Console"
        subtitle="Prototype System Administration"
        rightAction={{
          icon: 'rectangle.portrait.and.arrow.right',
          onPress: handleLogout,
          label: 'Logout',
        }}
      />

      {/* System Banner */}
      <Card style={styles.systemBanner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerBadge}>
            <IconSymbol size={20} name="building.columns.fill" color={APP_COLORS.warning} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Attendance Portal Prototype</Text>
            <Text style={styles.bannerSubtitle}>Independent Demo Prototype • Fictional Test Data</Text>
          </View>
        </View>

        <View style={styles.overallRateRow}>
          <View>
            <Text style={styles.rateLabel}>SYSTEM-WIDE ATTENDANCE RATE</Text>
            <Text style={styles.rateValue}>{reports.totalConducted > 0 ? `${overallRate}%` : 'No Data'}</Text>
          </View>
          <View style={styles.rateStats}>
            <Text style={styles.rateSubText}>{reports.totalPresent} Present</Text>
            <Text style={styles.rateSubText}>{reports.totalAbsent} Absent</Text>
            <Text style={styles.rateSubText}>{reports.sessionsEnded} Classes</Text>
          </View>
        </View>
      </Card>

      {/* Core Counts */}
      <View style={styles.metricsRow}>
        <MetricCard label="Students" value={overview.students} />
        <View style={styles.metricSpacer} />
        <MetricCard label="Faculty" value={overview.faculties} />
        <View style={styles.metricSpacer} />
        <MetricCard label="Subjects" value={overview.subjects} />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Programmes" value={overview.programmes} />
        <View style={styles.metricSpacer} />
        <MetricCard label="Semesters" value={overview.semesters} />
        <View style={styles.metricSpacer} />
        <MetricCard label="Conducted" value={reports.sessionsEnded} />
      </View>

      <Text style={styles.sectionTitle}>Management Modules</Text>

      <ActionTile
        icon="person.2.fill"
        title="Student Management"
        subtitle={`Manage ${overview.students} student records & accounts`}
        onPress={() => router.push('/admin-students' as never)}
      />

      <ActionTile
        icon="person.badge.plus"
        title="Faculty Management"
        subtitle={`Manage ${overview.faculties} instructor accounts & profiles`}
        onPress={() => router.push('/admin-faculty' as never)}
      />

      <ActionTile
        icon="book.fill"
        title="Academics & Subjects"
        subtitle="Departments, Programmes, Semesters & Course catalogue"
        onPress={() => router.push('/admin-academics' as never)}
      />

      <ActionTile
        icon="slider.horizontal.3"
        title="Enrollments & Assignments"
        subtitle="Manage student course enrolments & faculty assignments"
        onPress={() => router.push('/admin-enrollments' as never)}
      />

      <ActionTile
        icon="chart.bar.fill"
        title="Reports & Attendance Records"
        subtitle="University reports & attendance record correction tools"
        onPress={() => router.push('/admin-reports' as never)}
      />

      <ActionTile
        icon="arrow.trianglehead.clockwise"
        title="Development Tools & Reset"
        subtitle="Test accounts, seed database & storage inspection"
        onPress={() => router.push('/dev-tools' as never)}
        variant="danger"
        style={styles.devToolsTile}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  systemBanner: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderColor: APP_COLORS.border,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bannerBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${APP_COLORS.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  overallRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: APP_COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '800',
    color: APP_COLORS.warning,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  rateStats: {
    alignItems: 'flex-end',
  },
  rateSubText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metricSpacer: {
    width: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  devToolsTile: {
    marginTop: 8,
    marginBottom: 24,
  },
});
