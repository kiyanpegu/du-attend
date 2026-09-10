import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { APP_COLORS } from '@/constants/duAttend';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, actionTitle, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionTitle && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
});
