import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: IconSymbolName;
    onPress: () => void;
    label?: string;
  };
  style?: StyleProp<ViewStyle>;
}

export function Header({ title, subtitle, showBack, onBack, rightAction, style }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <IconSymbol size={24} name="chevron.left" color={APP_COLORS.text} />
          </TouchableOpacity>
        )}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>

      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}
          activeOpacity={0.7}
        >
          <IconSymbol size={22} name={rightAction.icon} color={APP_COLORS.text} />
          {rightAction.label && (
            <Text style={styles.rightActionLabel}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  rightActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
});
