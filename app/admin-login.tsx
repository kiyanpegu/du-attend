import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { authService } from '@/services/authService';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter your Admin username (e.g. ADMIN001).');
      return;
    }

    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login('admin', username.trim(), password);

      if (result.ok) {
        router.replace('/admin-dashboard' as never);
      } else {
        Alert.alert('Login Failed', result.message || 'Incorrect Admin Username or Password.');
      }
    } catch {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Admin Demo Credentials',
      'For testing, use the preloaded administrator account:\n\nUsername: ADMIN001\nPassword: admin123\n\nIn production, this integrates with university administration security policies.'
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'System Administration',
      'This is an independent demo prototype.\n\nQuick Test Login:\n• Username: ADMIN001\n• Password: admin123\n\nAdmin has full control over departments, courses, students, faculty, and reports.'
    );
  };

  return (
    <AppScreen scrollable>
      {/* Top Back Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/' as never)}
          accessibilityRole="button"
          accessibilityLabel="Back to Role Selection"
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="chevron.left" color={APP_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.backButtonText}>Back to Roles</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Header & Identity */}
        <View style={styles.headerArea}>
          <View style={styles.iconBox}>
            <IconSymbol size={32} name="shield.lefthalf.filled" color={APP_COLORS.obsidian} />
          </View>
          <View style={styles.portalBadge}>
            <Text style={styles.portalBadgeText}>ADMINISTRATIVE ACCESS</Text>
          </View>
          <Text style={styles.title}>System Administration</Text>
          <Text style={styles.subtitle}>
            Authorized personnel portal for university curriculum, faculty assignments, and master audits.
          </Text>
        </View>

        {/* Demo Auto-Fill Pill */}
        <TouchableOpacity
          style={styles.quickFillPill}
          onPress={() => {
            setUsername('ADMIN001');
            setPassword('admin123');
          }}
          accessibilityRole="button"
          accessibilityLabel="Auto-fill Demo Admin Credentials"
          activeOpacity={0.7}
        >
          <IconSymbol size={13} name="key.fill" color={APP_COLORS.obsidian} />
          <Text style={styles.quickFillText}>Auto-fill Demo: ADMIN001 / admin123</Text>
        </TouchableOpacity>

        {/* Floating Form Card */}
        <View style={styles.formCard}>
          <AppInput
            label="Admin Username"
            placeholder="e.g. ADMIN001"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="characters"
            autoCorrect={false}
            leftIcon="person.text.rectangle"
          />

          <AppInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon="lock.fill"
            rightLabel={
              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPassword}>Security Help</Text>
              </TouchableOpacity>
            }
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <IconSymbol
                  size={18}
                  name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  color={APP_COLORS.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* Remember Me Toggle */}
          <TouchableOpacity
            style={styles.rememberMe}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <IconSymbol
              size={20}
              name={rememberMe ? 'checkmark.square.fill' : 'square'}
              color={rememberMe ? APP_COLORS.obsidian : APP_COLORS.textMuted}
            />
            <Text style={styles.rememberText}>Remember me on this terminal</Text>
          </TouchableOpacity>

          {/* Primary Action Button */}
          <AppButton
            title="Sign In as Administrator"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="large"
            style={styles.submitBtn}
          />
        </View>

        {/* Help & Demo Support */}
        <TouchableOpacity
          style={styles.helpCenter}
          onPress={handleSupport}
          activeOpacity={0.7}
        >
          <IconSymbol size={15} name="questionmark.circle" color={APP_COLORS.textSecondary} />
          <Text style={styles.helpText}>
            Need demo credentials? <Text style={styles.helpLink}>View Demo Accounts</Text>
          </Text>
        </TouchableOpacity>

        {/* Security / University Footer Note */}
        <View style={styles.securityNoteArea}>
          <Text style={styles.disclaimerText}>
            {APP_IDENTITY.university} • Centre for Computer Science & Applications
          </Text>
          <Text style={styles.auditNoticeText}>
            Authorized access only. All authentication attempts are logged for security auditing.
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: TOKENS.spacing.md,
    paddingTop: TOKENS.spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...TOKENS.shadows.subtle,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingBottom: TOKENS.spacing.xxxl,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.12)',
  },
  portalBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.12)',
  },
  portalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: TOKENS.rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.12)',
    alignSelf: 'center',
    marginBottom: 20,
    ...TOKENS.shadows.subtle,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.obsidian,
  },
  formCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 20,
    ...TOKENS.shadows.subtle,
  },
  forgotPassword: {
    fontSize: 12,
    color: APP_COLORS.obsidian,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 10,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  rememberText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
  },
  helpCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  helpLink: {
    color: APP_COLORS.obsidian,
    fontWeight: '700',
  },
  securityNoteArea: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  auditNoticeText: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});
