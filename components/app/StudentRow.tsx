import { APP_COLORS } from '@/constants/duAttend';
import type { SessionStudentStatus } from '@/types/models';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { StatusBadge } from './StatusBadge';

interface StudentRowProps {
  studentStatus: SessionStudentStatus;
  index?: number;
  onMarkPresent?: () => void;
  onMarkAbsent?: () => void;
  showActions?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StudentRow({
  studentStatus,
  index = 0,
  onMarkPresent,
  onMarkAbsent,
  showActions = false,
  style,
}: StudentRowProps) {
  const { student, user, record } = studentStatus;

  const getStatus = (): 'present' | 'absent' | 'unmarked' => {
    if (!record) return 'unmarked';
    return record.status;
  };

  const status = getStatus();
  
  const isEven = index % 2 === 0;

  return (
    <View style={[styles.container, isEven && styles.evenRow, style]}>
      <View style={styles.content}>
        <View style={styles.studentInfo}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <View style={styles.idRow}>
            <Text style={styles.studentId}>{student.studentId}</Text>
            {record?.markedBy && (
              <Text style={styles.methodTag}>
                • {record.markedBy === 'otp' ? 'OTP' : 'Manual'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statusContainer}>
          {showActions ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.presentButton,
                  status === 'present' && styles.presentActive,
                ]}
                onPress={onMarkPresent}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.actionText,
                    styles.presentText,
                    status === 'present' && styles.activeText,
                  ]}
                >
                  Present
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.absentButton,
                  status === 'absent' && styles.absentActive,
                ]}
                onPress={onMarkAbsent}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.actionText,
                    styles.absentText,
                    status === 'absent' && styles.activeText,
                  ]}
                >
                  Absent
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <StatusBadge status={status} size="small" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.surface,
  },
  evenRow: {
    backgroundColor: APP_COLORS.surfaceVariant, // Zebra striping highlight
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  studentInfo: {
    flex: 1,
    paddingRight: 12,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  studentId: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  methodTag: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginLeft: 6,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  presentButton: {
    backgroundColor: `${APP_COLORS.success}15`,
    borderColor: `${APP_COLORS.success}40`,
  },
  presentActive: {
    backgroundColor: APP_COLORS.success,
    borderColor: APP_COLORS.success,
  },
  absentButton: {
    backgroundColor: `${APP_COLORS.danger}15`,
    borderColor: `${APP_COLORS.danger}40`,
  },
  absentActive: {
    backgroundColor: APP_COLORS.danger,
    borderColor: APP_COLORS.danger,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presentText: {
    color: APP_COLORS.success,
  },
  absentText: {
    color: APP_COLORS.danger,
  },
  activeText: {
    color: '#ffffff',
  },
});
