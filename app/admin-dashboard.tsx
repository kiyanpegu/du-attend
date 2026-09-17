import { ActionTile } from '@/components/app/ActionTile';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Admin console?', [
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
  const overallRate =
    reports.totalConducted > 0
      ? Math.round((reports.totalPresent / reports.totalConducted) * 100)
      : 0;

  return (
    <AppScreen scrollable>
      {/* Top Admin Header */}
      <Header
        title="Admin Console"
        subtitle="System Oversight & Governance"
        rightAction={{
          icon: 'rectangle.portrait.and.arrow.right',
          onPress: handleLogout,
          label: 'Logout',
        }}
      />

      {/* Institutional Context & Attendance Overview Hero */}
      <Card style={styles.systemHeroCard} padded={false}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIdentityRow}>
            <View style={styles.heroIconBox}>
              <IconSymbol size={22} name="shield.lefthalf.filled" color={APP_COLORS.obsidian} />
            </View>
            <View style={styles.heroTextWrap}>
              <View style={styles.universityBadge}>
                <Text style={styles.universityBadgeText}>
                  {APP_IDENTITY.name} • SYSTEM CONTROL
                </Text>
              </View>
              <Text style={styles.heroTitle}>Institutional Attendance Overview</Text>
            </View>
          </View>
        </View>

        <View style={styles.rateDisplaySection}>
          <View style={styles.ratePrimaryCol}>
            <Text style={styles.rateCaption}>OVERALL TURNOUT RATE</Text>
            <Text style={styles.rateBigValue}>
              {reports.totalConducted > 0 ? `${overallRate}%` : 'N/A'}
            </Text>
            {reports.totalConducted > 0 ? (
              <View style={styles.turnoutTrack}>
                <View style={[styles.turnoutFill, { width: `${Math.min(100, overallRate)}%` }]} />
              </View>
            ) : null}
          </View>

          <View style={styles.rateStatsGrid}>
            <View style={styles.rateStatItem}>
              <Text style={[styles.rateStatValue, { color: APP_COLORS.safeText }]}>
                {reports.totalPresent}
              </Text>
              <Text style={styles.rateStatLabel}>Present Logs</Text>
            </View>
            <View style={styles.rateStatItem}>
              <Text style={[styles.rateStatValue, { color: APP_COLORS.shortageText }]}>
                {reports.totalAbsent}
              </Text>
              <Text style={styles.rateStatLabel}>Absent Logs</Text>
            </View>
            <View style={styles.rateStatItem}>
              <Text style={styles.rateStatValue}>{reports.sessionsEnded}</Text>
              <Text style={styles.rateStatLabel}>Conducted</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroFooterStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusFooterText}>
            Dibrugarh University BCA 1st Sem • Real-time database sync active
          </Text>
        </View>
      </Card>

      {/* Operational Metrics Grid (2x3 Compact Layout) */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricGridRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{overview.students}</Text>
            <Text style={styles.metricTileLabel}>ENROLLED STUDENTS</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{overview.faculties}</Text>
            <Text style={styles.metricTileLabel}>ACTIVE FACULTY</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{overview.subjects}</Text>
            <Text style={styles.metricTileLabel}>CURRICULUM COURSES</Text>
          </View>
        </View>

        <View style={styles.metricGridRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{overview.programmes}</Text>
            <Text style={styles.metricTileLabel}>PROGRAMMES</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{overview.semesters}</Text>
            <Text style={styles.metricTileLabel}>SEMESTERS</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricTileNumber}>{reports.sessionsEnded}</Text>
            <Text style={styles.metricTileLabel}>CLASSES HELD</Text>
          </View>
        </View>
      </View>

      {/* Management Modules Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Management Modules</Text>
        <Text style={styles.sectionSubtitle}>
          Curriculum hierarchy, personnel rosters, and master audits
        </Text>
      </View>

      <ActionTile
        icon="person.2.fill"
        title="Student Management"
        subtitle={`Manage ${overview.students} student accounts & academic status`}
        onPress={() => router.push('/admin-students' as never)}
      />

      <ActionTile
        icon="person.badge.plus"
        title="Faculty Management"
        subtitle={`Manage ${overview.faculties} instructor accounts & credentials`}
        onPress={() => router.push('/admin-faculty' as never)}
      />

      <ActionTile
        icon="book.fill"
        title="Academics & Subjects"
        subtitle={`Departments, Programmes, Semesters & ${overview.subjects} Courses`}
        onPress={() => router.push('/admin-academics' as never)}
      />

      <ActionTile
        icon="slider.horizontal.3"
        title="Enrolments & Assignments"
        subtitle="Manage student course enrolments & faculty teaching assignments"
        onPress={() => router.push('/admin-enrollments' as never)}
      />

      <ActionTile
        icon="chart.bar.fill"
        title="Reports & Attendance Records"
        subtitle="Session logs, master audit CSV export & record corrections"
        onPress={() => router.push('/admin-reports' as never)}
      />

      {/* Developer Utilities Tile */}
      <TouchableOpacity
        style={styles.devToolsCard}
        onPress={() => router.push('/dev-tools' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.devToolsLeft}>
          <View style={styles.devToolsIcon}>
            <IconSymbol size={18} name="wrench.and.screwdriver" color={APP_COLORS.textSecondary} />
          </View>
          <View style={styles.devToolsTextWrap}>
            <Text style={styles.devToolsTitle}>Development Tools & Data Reset</Text>
            <Text style={styles.devToolsSubtitle}>
              Seed database, test accounts, storage inspection & mock resets
            </Text>
          </View>
        </View>
        <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
      </TouchableOpacity>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  systemHeroCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.md,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  heroHeader: {
    padding: TOKENS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.borderSubtle,
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.1)',
  },
  heroTextWrap: {
    flex: 1,
  },
  universityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: TOKENS.rounded.full,
    marginBottom: 4,
  },
  universityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  rateDisplaySection: {
    padding: TOKENS.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ratePrimaryCol: {
    flex: 1.2,
  },
  rateCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  rateBigValue: {
    fontSize: 32,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  turnoutTrack: {
    height: 4,
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  turnoutFill: {
    height: '100%',
    backgroundColor: APP_COLORS.safeText,
    borderRadius: 2,
  },
  rateStatsGrid: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surfaceVariant,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  rateStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  rateStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  rateStatLabel: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  heroFooterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: 8,
    backgroundColor: APP_COLORS.subSurface,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.safeText,
  },
  statusFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    flex: 1,
  },
  metricsContainer: {
    marginBottom: TOKENS.spacing.md,
    gap: 8,
  },
  metricGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    backgroundColor: APP_COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  metricTileNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  metricTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: TOKENS.spacing.xs,
    marginBottom: TOKENS.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  devToolsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginTop: 8,
    marginBottom: 24,
    ...TOKENS.shadows.subtle,
  },
  devToolsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  devToolsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devToolsTextWrap: {
    flex: 1,
  },
  devToolsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  devToolsSubtitle: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
});
