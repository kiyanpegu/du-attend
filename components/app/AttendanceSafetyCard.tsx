import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { AttendanceAdvice, calculateAttendanceAdvice } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

interface AttendanceSafetyCardProps {
  attended: number;
  conducted: number;
  target?: number;
}

export function AttendanceSafetyCard({ attended, conducted, target = 75 }: AttendanceSafetyCardProps) {
  const advice: AttendanceAdvice = calculateAttendanceAdvice(attended, conducted, target);

  const getStatusTheme = () => {
    switch (advice.status) {
      case 'safe':
        return {
          bgColor: `${APP_COLORS.success}12`,
          borderColor: `${APP_COLORS.success}40`,
          textColor: APP_COLORS.success,
          badgeBg: `${APP_COLORS.success}25`,
          iconName: 'checkmark.shield.fill' as const,
          badgeLabel: 'ELIGIBLE (≥75%)',
          accentColor: APP_COLORS.success,
        };
      case 'warning':
        return {
          bgColor: `${APP_COLORS.warning}12`,
          borderColor: `${APP_COLORS.warning}40`,
          textColor: APP_COLORS.warning,
          badgeBg: `${APP_COLORS.warning}25`,
          iconName: 'exclamationmark.triangle.fill' as const,
          badgeLabel: 'ATTENTION (<75%)',
          accentColor: APP_COLORS.warning,
        };
      case 'critical':
        return {
          bgColor: `${APP_COLORS.danger}12`,
          borderColor: `${APP_COLORS.danger}40`,
          textColor: APP_COLORS.danger,
          badgeBg: `${APP_COLORS.danger}25`,
          iconName: 'xmark.shield.fill' as const,
          badgeLabel: 'SHORTAGE RISK',
          accentColor: APP_COLORS.danger,
        };
      default:
        return {
          bgColor: APP_COLORS.surfaceVariant,
          borderColor: APP_COLORS.border,
          textColor: APP_COLORS.textSecondary,
          badgeBg: APP_COLORS.surface,
          iconName: 'circle.fill' as const,
          badgeLabel: 'NO DATA',
          accentColor: APP_COLORS.textSecondary,
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <Card style={[styles.card, { borderColor: theme.borderColor }]}>
      {/* Header with Title and Badge */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <IconSymbol size={18} name={theme.iconName} color={theme.accentColor} />
          <Text style={styles.title}>Exam Eligibility Status</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.badgeText, { color: theme.textColor }]}>
            {theme.badgeLabel}
          </Text>
        </View>
      </View>

      {/* Advice Statement Banner */}
      <View style={[styles.messageBanner, { backgroundColor: theme.bgColor }]}>
        <Text style={[styles.messageText, { color: APP_COLORS.text }]}>
          {advice.message}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Required</Text>
          <Text style={styles.metricValue}>{target}%</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={[styles.metricValue, { color: theme.textColor }]}>
            {conducted > 0 ? `${advice.percentage}%` : '—'}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            {advice.status === 'safe' ? 'Safe to Miss' : 'Must Attend'}
          </Text>
          <Text style={[styles.metricValue, { color: theme.textColor }]}>
            {advice.status === 'safe'
              ? `${advice.canMissCount} class${advice.canMissCount === 1 ? '' : 'es'}`
              : advice.status === 'none'
              ? '—'
              : `${advice.mustAttendCount} consec.`}
          </Text>
        </View>
      </View>

      {/* University Regulation Disclaimer Note */}
      <View style={styles.policyFooter}>
        <IconSymbol size={12} name="circle.fill" color={APP_COLORS.textMuted} />
        <Text style={styles.policyText}>
          DU Regulation: Minimum 75% attendance mandatory for End-Sem Exam eligibility.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  messageBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: APP_COLORS.border,
  },
  policyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  policyText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
});
