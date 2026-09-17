import { AppScreen } from '@/components/app/AppScreen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
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

    // After 2.2 seconds, hide splash
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.splashMain, { opacity: fadeAnim }]}>
          <View style={styles.splashLogoContainer}>
            <View style={styles.splashLogoGlow} />
            <View style={styles.splashLogo}>
              <IconSymbol size={56} name="graduationcap.fill" color={APP_COLORS.primaryWarm} />
            </View>
          </View>
          <Text style={styles.splashTitle}>{APP_IDENTITY.name}</Text>
          <Text style={styles.splashSubtitle}>Attendance Management Prototype</Text>
          
          <View style={styles.loadingDots}>
            <View style={[styles.dot, { opacity: 0.9 }]} />
            <View style={[styles.dot, { opacity: 0.5 }]} />
            <View style={[styles.dot, { opacity: 0.25 }]} />
          </View>
        </Animated.View>
        
        <View style={styles.splashFooter}>
          <Text style={styles.splashFooterText}>Dibrugarh University • CCSA Campus</Text>
        </View>
      </View>
    );
  }

  return (
    <AppScreen scrollable>
      <View style={styles.container}>
        {/* Brand / Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.universityBadge}>
            <View style={styles.universityBadgeDot} />
            <Text style={styles.universityBadgeText}>DIBRUGARH UNIVERSITY • CCSA</Text>
          </View>
          <Text style={styles.heroTitle}>{APP_IDENTITY.name}</Text>
          <Text style={styles.heroSubtitle}>
            Smart, geofenced mobile attendance for campus lectures, real-time OTP check-ins, and academic eligibility tracking.
          </Text>
        </View>

        {/* Role Selection Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>SELECT ACCESS PORTAL</Text>
          <Text style={styles.sectionHeaderSubtitle}>Choose your account type</Text>
        </View>

        {/* Role Cards Grid */}
        <View style={styles.roleGrid}>
          {/* Student Role Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/student-login' as never)}
            accessibilityRole="button"
            accessibilityLabel="Sign in as Student"
            activeOpacity={0.75}
          >
            <View style={styles.roleCardContent}>
              <View style={styles.roleIconWrapPrimary}>
                <IconSymbol size={28} name="person.crop.circle.fill" color={APP_COLORS.primaryWarm} />
              </View>
              <View style={styles.roleTextGroup}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>Student Portal</Text>
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>STUDENT</Text>
                  </View>
                </View>
                <Text style={styles.roleDesc}>
                  Enter live 60-second OTPs, view timetable, and check semester exam eligibility.
                </Text>
              </View>
            </View>
            <View style={styles.roleCardFooter}>
              <Text style={styles.roleActionText}>Sign in as Student</Text>
              <IconSymbol size={14} name="chevron.right" color={APP_COLORS.primaryWarm} />
            </View>
          </TouchableOpacity>

          {/* Faculty Role Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/faculty-login' as never)}
            accessibilityRole="button"
            accessibilityLabel="Sign in as Faculty"
            activeOpacity={0.75}
          >
            <View style={styles.roleCardContent}>
              <View style={styles.roleIconWrapSecondary}>
                <IconSymbol size={28} name="briefcase.fill" color={APP_COLORS.categoryText} />
              </View>
              <View style={styles.roleTextGroup}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>Faculty Portal</Text>
                  <View style={styles.facultyTag}>
                    <Text style={styles.facultyTagText}>FACULTY</Text>
                  </View>
                </View>
                <Text style={styles.roleDesc}>
                  Broadcast rotating OTPs, manage student rosters, and generate CSV reports.
                </Text>
              </View>
            </View>
            <View style={styles.roleCardFooter}>
              <Text style={styles.roleActionTextSecondary}>Sign in as Faculty</Text>
              <IconSymbol size={14} name="chevron.right" color={APP_COLORS.categoryText} />
            </View>
          </TouchableOpacity>

          {/* Admin Role Card (Restrained) */}
          <TouchableOpacity
            style={[styles.roleCard, styles.adminCard]}
            onPress={() => router.push('/admin-login' as never)}
            accessibilityRole="button"
            accessibilityLabel="Sign in as Administrator"
            activeOpacity={0.75}
          >
            <View style={styles.adminCardContent}>
              <View style={styles.roleIconWrapAdmin}>
                <IconSymbol size={22} name="shield.lefthalf.filled" color={APP_COLORS.obsidian} />
              </View>
              <View style={styles.adminTextGroup}>
                <Text style={styles.adminTitle}>System Administrator</Text>
                <Text style={styles.adminDesc}>
                  Curriculum configuration, faculty course assignments, and master audits.
                </Text>
              </View>
              <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Development Tools Action */}
        <TouchableOpacity
          style={styles.devToolsButton}
          onPress={() => router.push('/dev-tools' as never)}
          accessibilityRole="button"
          accessibilityLabel="Open Development Tools"
          activeOpacity={0.7}
        >
          <IconSymbol size={15} name="slider.horizontal.3" color={APP_COLORS.textSecondary} />
          <Text style={styles.devToolsText}>Development Tools & Reset Database</Text>
        </TouchableOpacity>

        {/* Prototype Disclaimer */}
        <Text style={styles.disclaimerText}>
          Independent demonstration prototype for Dibrugarh University attendance workflows. Not an official university release.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashMain: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splashLogoContainer: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  splashLogoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 94, 54, 0.15)',
  },
  splashLogo: {
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.card,
    zIndex: 2,
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  splashSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 36,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 36,
  },
  splashFooterText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Main Welcome Portal Styles
  container: {
    paddingVertical: TOKENS.spacing.lg,
    paddingHorizontal: 4,
  },
  heroSection: {
    marginBottom: TOKENS.spacing.xl,
    paddingTop: TOKENS.spacing.xs,
  },
  universityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: TOKENS.rounded.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 71, 0.2)',
  },
  universityBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.categoryText,
  },
  universityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.categoryText,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    color: APP_COLORS.textSecondary,
    lineHeight: 21,
  },
  sectionHeaderRow: {
    marginBottom: TOKENS.spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 1.1,
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  roleGrid: {
    gap: 14,
    marginBottom: TOKENS.spacing.xl,
  },
  roleCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.base,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  roleCardContent: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  roleIconWrapPrimary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapSecondary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: APP_COLORS.categoryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapAdmin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  activeTag: {
    backgroundColor: APP_COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: TOKENS.rounded.full,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.6,
  },
  facultyTag: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: TOKENS.rounded.full,
  },
  facultyTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.categoryText,
    letterSpacing: 0.6,
  },
  roleDesc: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    lineHeight: 18,
  },
  roleCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  roleActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.primaryWarm,
  },
  roleActionTextSecondary: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  adminCard: {
    backgroundColor: APP_COLORS.surface,
  },
  adminCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminTextGroup: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  adminDesc: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 16,
  },
  devToolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: TOKENS.rounded.md,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 16,
    ...TOKENS.shadows.subtle,
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
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});