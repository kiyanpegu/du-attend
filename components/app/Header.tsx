import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { useRouter } from 'expo-router';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

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
    paddingVertical: 12,
    marginBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rightActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
});
