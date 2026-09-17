import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type StudentTab = 'home' | 'schedule' | 'subjects' | 'history' | 'profile';

interface StudentBottomNavProps {
  currentTab: StudentTab;
  hasActiveClass?: boolean;
}

interface NavItemConfig {
  tab: StudentTab;
  label: string;
  icon: IconSymbolName;
  route: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { tab: 'home', label: 'Home', icon: 'house.fill', route: '/student-dashboard' },
  { tab: 'schedule', label: 'Schedule', icon: 'calendar', route: '/student-schedule' },
  { tab: 'subjects', label: 'Subjects', icon: 'book.fill', route: '/student-subjects' },
  { tab: 'history', label: 'History', icon: 'clock.fill', route: '/student-history' },
  { tab: 'profile', label: 'Profile', icon: 'person.fill', route: '/student-profile' },
];

export function StudentBottomNav({ currentTab, hasActiveClass = false }: StudentBottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = (item: NavItemConfig) => {
    if (item.tab === currentTab) return;
    router.replace(item.route as never);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.tab === currentTab;
          const color = isActive ? APP_COLORS.obsidian : APP_COLORS.textMuted;

          return (
            <TouchableOpacity
              key={item.tab}
              style={styles.navItem}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <IconSymbol size={22} name={item.icon} color={color} />
                {item.tab === 'home' && hasActiveClass && !isActive && (
                  <View style={styles.liveBadgeDot} />
                )}
              </View>
              <Text style={[styles.navText, { color }, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: APP_COLORS.subSurface,
  },
  liveBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  navText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  navTextActive: {
    fontWeight: '700',
    color: APP_COLORS.obsidian,
  },
});

