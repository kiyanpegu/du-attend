import { APP_COLORS } from '@/constants/duAttend';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
  size?: 'large' | 'medium' | 'small';
  icon?: IconSymbolName;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  loading = false,
  disabled = false,
  size = 'large',
  icon,
}: AppButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return APP_COLORS.border;
    switch (variant) {
      case 'primary': return APP_COLORS.primary;
      case 'secondary': return APP_COLORS.surfaceVariant;
      case 'danger': return APP_COLORS.danger;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return APP_COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return APP_COLORS.textSecondary;
    switch (variant) {
      case 'outline': return APP_COLORS.text;
      case 'ghost': return APP_COLORS.primary;
      case 'secondary': return APP_COLORS.text;
      default: return '#FFFFFF';
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'large': return 56;
      case 'medium': return 48;
      case 'small': return 36;
      default: return 56;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
        },
        variant === 'outline' && styles.outline,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title || 'Button'}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <IconSymbol 
              name={icon} 
              size={size === 'small' ? 16 : 20} 
              color={getTextColor()} 
              style={{ marginRight: title ? 8 : 0 }}
            />
          )}
          {!!title && (
            <Text style={[styles.text, { color: getTextColor() }, size === 'small' && styles.smallText]}>
              {title}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 14,
  },
});
