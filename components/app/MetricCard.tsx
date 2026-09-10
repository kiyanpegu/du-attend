import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { APP_COLORS } from '@/constants/duAttend';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: number | string;
    text?: string;
    isGood: boolean;
  };
  style?: ViewStyle;
}

export function MetricCard({ label, value, delta, style }: MetricCardProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>

      {delta && (
        <View style={styles.deltaContainer}>
          <Text
            style={[
              styles.deltaText,
              { color: delta.isGood ? APP_COLORS.success : APP_COLORS.danger }
            ]}
          >
            {typeof delta.value === 'number' && delta.value > 0 ? '+' : ''}{delta.value} {delta.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minHeight: 88,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  label: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  deltaContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
