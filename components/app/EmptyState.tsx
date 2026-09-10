import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';

interface EmptyStateProps {
  icon?: IconSymbolName;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon = 'tray', title, message, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <IconSymbol size={40} name={icon} color={APP_COLORS.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: APP_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 20,
  },
});
