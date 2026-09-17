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
  let backgroundColor = APP_COLORS.subSurface;
  let textColor = APP_COLORS.textSecondary;
  let iconName: IconSymbolName = 'info.circle';
  let text = label || status.toUpperCase();

  switch (status.toLowerCase()) {
    case 'good':
    case 'present':
      backgroundColor = APP_COLORS.safeBg;
      textColor = APP_COLORS.safeText;
      iconName = 'checkmark';
      break;
    case 'active':
      backgroundColor = APP_COLORS.safeBg;
      textColor = APP_COLORS.safeText;
      iconName = 'circle.fill';
      break;
    case 'warning':
      backgroundColor = APP_COLORS.attentionBg;
      textColor = APP_COLORS.attentionText;
      iconName = 'exclamationmark.triangle.fill';
      break;
    case 'critical':
    case 'absent':
      backgroundColor = APP_COLORS.shortageBg;
      textColor = APP_COLORS.shortageText;
      iconName = 'xmark';
      break;
    case 'cancelled':
      backgroundColor = APP_COLORS.shortageBg;
      textColor = APP_COLORS.shortageText;
      iconName = 'slash.circle';
      break;
    case 'ended':
      backgroundColor = APP_COLORS.subSurface;
      textColor = APP_COLORS.textSecondary;
      iconName = 'clock.fill';
      break;
    default:
      backgroundColor = APP_COLORS.categoryBg;
      textColor = APP_COLORS.categoryText;
      iconName = 'info.circle';
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
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999, // Pill shape
  },
  icon: {
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
