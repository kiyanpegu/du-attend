import { APP_COLORS } from '@/constants/duAttend';
import type { AttendanceHistoryItem } from '@/types/models';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

interface AttendanceCardProps {
  item: AttendanceHistoryItem;
  onPress?: () => void;
}

export function AttendanceCard({ item, onPress }: AttendanceCardProps) {
  const getStatusColor = () => {
    if (item.status === 'present') return APP_COLORS.success;
    if (item.status === 'absent') return APP_COLORS.danger;
    return APP_COLORS.textMuted;
  };

  const getStatusLabel = () => {
    if (item.sessionStatus === 'cancelled') return 'Cancelled';
    return item.status === 'present' ? 'Present' : 'Absent';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName} numberOfLines={1}>{item.subjectName}</Text>
          <Text style={styles.subjectCode}>{item.subjectCode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Faculty</Text>
          <Text style={styles.detailValue}>{item.facultyName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
        </View>
        {item.sessionStatus !== 'cancelled' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{item.method === 'otp' ? 'OTP' : 'Manual'}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: APP_COLORS.text,
    fontWeight: '500',
  },
});
