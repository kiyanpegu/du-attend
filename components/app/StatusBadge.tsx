import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface StatusBadgeProps {
  status: 'good' | 'warning' | 'critical' | 'active' | 'ended' | 'cancelled' | 'present' | 'absent' | string;
  label?: string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  style?: ViewStyle;
}

export function StatusBadge({ status, label, size = 'medium', showIcon = true, style }: StatusBadgeProps) {
  let backgroundColor = APP_COLORS.surfaceVariant;
  let textColor = APP_COLORS.textSecondary;
  let iconName: IconSymbolName = 'info.circle';
  let text = label || status.toUpperCase();

  switch (status.toLowerCase()) {
    case 'good':
    case 'present':
      backgroundColor = APP_COLORS.successSoft;
      textColor = APP_COLORS.success;
      iconName = 'checkmark';
      break;
    case 'active':
      backgroundColor = APP_COLORS.successSoft;
      textColor = APP_COLORS.success;
      iconName = 'circle.fill';
      break;
    case 'warning':
      backgroundColor = APP_COLORS.warningSoft;
      textColor = APP_COLORS.warning;
      iconName = 'exclamationmark.triangle.fill';
      break;
    case 'critical':
    case 'absent':
      backgroundColor = APP_COLORS.dangerSoft;
      textColor = APP_COLORS.danger;
      iconName = 'xmark';
      break;
    case 'cancelled':
      backgroundColor = APP_COLORS.dangerSoft;
      textColor = APP_COLORS.danger;
      iconName = 'slash.circle';
      break;
    case 'ended':
      backgroundColor = APP_COLORS.infoSoft;
      textColor = APP_COLORS.info;
      iconName = 'clock.fill';
      break;
  }

  const iconSize = size === 'small' ? 10 : 12;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        size === 'small' && styles.smallBadge,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${text}`}
    >
      {showIcon && (
        <IconSymbol
          name={iconName}
          size={iconSize}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: textColor }, size === 'small' && styles.smallText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999, // Pill shape
    alignSelf: 'flex-start',
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999, // Pill shape
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 10,
  },
});
