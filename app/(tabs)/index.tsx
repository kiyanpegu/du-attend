import { AppScreen } from '@/components/app/AppScreen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY } from '@/constants/duAttend';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // After 2.5 seconds, hide splash
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.splashMain, { opacity: fadeAnim }]}>
          <View style={styles.splashLogoContainer}>
            <View style={styles.splashLogoGlow} />
            <View style={styles.splashLogo}>
              <IconSymbol size={72} name="graduationcap.fill" color={APP_COLORS.primary} />
            </View>
          </View>
          <Text style={styles.splashTitle}>{APP_IDENTITY.name}</Text>
          <Text style={styles.splashSubtitle}>{APP_IDENTITY.subtitle}</Text>
          
          <View style={styles.loadingDots}>
            <View style={[styles.dot, { opacity: 0.8 }]} />
            <View style={[styles.dot, { opacity: 0.5 }]} />
            <View style={[styles.dot, { opacity: 0.2 }]} />
          </View>
        </Animated.View>
        
        <View style={styles.splashFooter}>
          <Text style={styles.splashFooterText}>© 2024 {APP_IDENTITY.university}</Text>
        </View>
      </View>
    );
  }

  return (
    <AppScreen scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{APP_IDENTITY.name}</Text>
          <Text style={styles.headerSubtitle}>{APP_IDENTITY.university}</Text>
        </View>

        <Text style={styles.continueTitle}>Continue as</Text>

        <View style={styles.roleGrid}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/student-login' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.roleIconWrapPrimary}>
              <IconSymbol size={32} name="person.fill" color={APP_COLORS.onPrimary} />
            </View>
            <Text style={styles.roleTitle}>Student</Text>
            <Text style={styles.roleDesc}>View attendance and mark classes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/faculty-login' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.roleIconWrapPrimary}>
              <IconSymbol size={32} name="graduationcap.fill" color={APP_COLORS.onPrimary} />
            </View>
            <Text style={styles.roleTitle}>Faculty</Text>
            <Text style={styles.roleDesc}>Manage classes and attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/admin-login' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.roleIconWrapTertiary}>
              <IconSymbol size={32} name="shield.lefthalf.filled" color="#FFFFFF" />
            </View>
            <Text style={styles.roleTitle}>Administrator</Text>
            <Text style={styles.roleDesc}>Manage university attendance</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.devToolsButton}
          onPress={() => router.push('/dev-tools' as never)}
          activeOpacity={0.7}
        >
          <IconSymbol size={16} name="slider.horizontal.3" color={APP_COLORS.textSecondary} />
          <Text style={styles.devToolsText}>Development Tools</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          Independent demo prototype. Not an official Dibrugarh University application.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  // Splash Styles
  splashContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashMain: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splashLogoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  splashLogoGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: APP_COLORS.primary,
    opacity: 0.15,
  },
  splashLogo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: APP_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: APP_COLORS.primary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  splashSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 24,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primary,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 32,
  },
  splashFooterText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },

  // Role Selector Styles
  container: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: APP_COLORS.primary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
  },
  continueTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 24,
  },
  roleGrid: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    minHeight: 200,
  },
  roleIconWrapPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleIconWrapTertiary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_COLORS.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  roleDesc: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  devToolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  devToolsText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 16,
  },
});