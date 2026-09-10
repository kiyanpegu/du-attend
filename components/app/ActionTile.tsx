import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';

interface ActionTileProps {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
  variant = 'default',
  style,
}: ActionTileProps) {
  const getIconBackgroundColor = () => {
    switch (variant) {
      case 'primary': return `${APP_COLORS.primary}20`;
      case 'danger': return `${APP_COLORS.danger}20`;
      default: return APP_COLORS.surfaceVariant;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary': return APP_COLORS.primary;
      case 'danger': return APP_COLORS.danger;
      default: return APP_COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
        <IconSymbol size={24} name={icon} color={getIconColor()} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <IconSymbol size={20} name="chevron.right" color={APP_COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
});
