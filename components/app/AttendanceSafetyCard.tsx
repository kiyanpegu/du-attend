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
          bgColor: APP_COLORS.safeBg,
          borderColor: 'transparent',
          textColor: APP_COLORS.safeText,
          badgeBg: APP_COLORS.safeBg,
          iconName: 'checkmark.shield.fill' as const,
          badgeLabel: 'ELIGIBLE (≥75%)',
          accentColor: APP_COLORS.safeText,
        };
      case 'warning':
        return {
          bgColor: APP_COLORS.attentionBg,
          borderColor: 'transparent',
          textColor: APP_COLORS.attentionText,
          badgeBg: APP_COLORS.attentionBg,
          iconName: 'exclamationmark.triangle.fill' as const,
          badgeLabel: 'ATTENTION (<75%)',
          accentColor: APP_COLORS.attentionText,
        };
      case 'critical':
        return {
          bgColor: APP_COLORS.shortageBg,
          borderColor: 'transparent',
          textColor: APP_COLORS.shortageText,
          badgeBg: APP_COLORS.shortageBg,
          iconName: 'xmark.shield.fill' as const,
          badgeLabel: 'SHORTAGE RISK',
          accentColor: APP_COLORS.shortageText,
        };
      default:
        return {
          bgColor: APP_COLORS.subSurface,
          borderColor: 'transparent',
          textColor: APP_COLORS.textSecondary,
          badgeBg: APP_COLORS.subSurface,
          iconName: 'circle.fill' as const,
          badgeLabel: 'NO DATA',
          accentColor: APP_COLORS.textSecondary,
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <Card style={styles.card}>
      {/* Header with Title and Badge */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg }]}>
            <IconSymbol size={15} name={theme.iconName} color={theme.accentColor} />
          </View>
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
        <Text style={[styles.messageText, { color: theme.textColor }]}>
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
        <IconSymbol size={12} name="info.circle.fill" color={APP_COLORS.textMuted} />
        <Text style={styles.policyText}>
          DU Regulation: Minimum 75% attendance mandatory for End-Sem Exam eligibility.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  messageBanner: {
    borderRadius: 14,
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
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    height: 22,
    backgroundColor: APP_COLORS.border,
  },
  policyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 4,
  },
  policyText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
});
