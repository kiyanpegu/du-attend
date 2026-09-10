import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import type { SubjectAttendanceSummary } from '@/types/models';
import { calculateAttendanceAdvice } from '@/utils/format';

interface SubjectCardProps {
  summary: SubjectAttendanceSummary;
  onPress?: () => void;
}

export function SubjectCard({ summary, onPress }: SubjectCardProps) {
  const advice = calculateAttendanceAdvice(summary.attended, summary.conducted, 75);

  return (
    <Card style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{summary.subject.name}</Text>
          <Text style={styles.subtitle}>{summary.subject.code} • {summary.facultyName}</Text>
        </View>
        <StatusBadge status={summary.standing} />
      </View>

      {/* Advice Pill */}
      {advice.status !== 'none' && (
        <View
          style={[
            styles.advicePill,
            advice.status === 'safe' && styles.advicePillSafe,
            advice.status === 'warning' && styles.advicePillWarning,
            advice.status === 'critical' && styles.advicePillCritical,
          ]}
        >
          <IconSymbol
            size={13}
            name={
              advice.status === 'safe'
                ? 'checkmark.shield.fill'
                : advice.status === 'warning'
                ? 'exclamationmark.triangle.fill'
                : 'xmark.shield.fill'
            }
            color={
              advice.status === 'safe'
                ? APP_COLORS.success
                : advice.status === 'warning'
                ? APP_COLORS.warning
                : APP_COLORS.danger
            }
          />
          <Text
            style={[
              styles.adviceText,
              advice.status === 'safe' && styles.adviceTextSafe,
              advice.status === 'warning' && styles.adviceTextWarning,
              advice.status === 'critical' && styles.adviceTextCritical,
            ]}
          >
            {advice.message}
          </Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.statsRow}>
          <Text style={styles.progressText}>
            {summary.attended} / {summary.conducted} classes
          </Text>
          <Text style={styles.percentageText}>{summary.percentage}%</Text>
        </View>
        <ProgressBar progress={summary.percentage || 0} standing={summary.standing === 'none' ? 'good' : summary.standing} />
      </View>

      {summary.latestRecord && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Latest: {summary.latestRecord.status === 'present' ? 'Present' : 'Absent'}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  advicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  advicePillSafe: {
    backgroundColor: `${APP_COLORS.success}12`,
    borderColor: `${APP_COLORS.success}30`,
  },
  advicePillWarning: {
    backgroundColor: `${APP_COLORS.warning}12`,
    borderColor: `${APP_COLORS.warning}30`,
  },
  advicePillCritical: {
    backgroundColor: `${APP_COLORS.danger}12`,
    borderColor: `${APP_COLORS.danger}30`,
  },
  adviceText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  adviceTextSafe: {
    color: APP_COLORS.success,
  },
  adviceTextWarning: {
    color: APP_COLORS.warning,
  },
  adviceTextCritical: {
    color: APP_COLORS.danger,
  },
  progressContainer: {
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
});
