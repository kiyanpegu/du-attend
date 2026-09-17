import { APP_COLORS, TOKENS } from '@/constants/duAttend';
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
    if (disabled) return APP_COLORS.subSurface;
    switch (variant) {
      case 'primary': return APP_COLORS.obsidian;
      case 'secondary': return APP_COLORS.subSurface;
      case 'danger': return APP_COLORS.shortageBg;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return APP_COLORS.obsidian;
    }
  };

  const getTextColor = () => {
    if (disabled) return APP_COLORS.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return APP_COLORS.text;
      case 'danger': return APP_COLORS.shortageText;
      case 'outline': return APP_COLORS.text;
      case 'ghost': return APP_COLORS.primary;
      default: return '#FFFFFF';
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'large': return 54;
      case 'medium': return 46;
      case 'small': return 36;
      default: return 54;
    }
  };

  const isPrimary = variant === 'primary' && !disabled;
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
        },
        isPrimary && styles.primaryShadow,
        variant === 'outline' && styles.outline,
        isDanger && styles.dangerBorder,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={title || 'Button'}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <IconSymbol 
              name={icon} 
              size={size === 'small' ? 15 : 18} 
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
    borderRadius: TOKENS.rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primaryShadow: {
    shadowColor: '#18191E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: APP_COLORS.border,
  },
  dangerBorder: {
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
