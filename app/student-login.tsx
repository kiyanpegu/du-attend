import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { authService } from '@/services/authService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StudentLogin() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!studentId.trim()) {
      Alert.alert('Required', 'Please enter your Student ID (e.g. BCA001).');
      return;
    }

    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login('student', studentId.trim(), password);

      if (result.ok) {
        router.replace('/student-dashboard' as never);
      } else {
        Alert.alert('Login Failed', result.message || 'Incorrect Student ID or Password.');
      }
    } catch {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Demo Account Details',
      'For testing, use the preloaded student account:\n\nStudent ID: BCA001\nPassword: student123\n\nIn production, this integrates with university SSO.'
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Demo IT Support',
      'This is an independent demo prototype.\n\nQuick Test Login:\n• ID: BCA001\n• Password: student123\n\nResetting the database in Dev Tools restores default accounts.'
    );
  };

  return (
    <AppScreen scrollable>
      {/* Top Back Bar */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace('/' as never)}
        activeOpacity={0.7}
      >
        <IconSymbol size={20} name="chevron.left" color={APP_COLORS.textSecondary} />
        <Text style={styles.backBtnText}>Role Selection</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.branding}>
          <IconSymbol size={48} name="graduationcap.fill" color={APP_COLORS.primary} />
        </View>

        <Text style={styles.title}>Student Portal</Text>
        <Text style={styles.subtitle}>Enter your student credentials to view and mark attendance.</Text>

        {/* Quick Fill Demo Helper */}
        <TouchableOpacity
          style={styles.quickFillPill}
          onPress={() => {
            setStudentId('BCA001');
            setPassword('student123');
          }}
          activeOpacity={0.7}
        >
          <IconSymbol size={14} name="key.fill" color={APP_COLORS.primary} />
          <Text style={styles.quickFillText}>Auto-fill Demo: BCA001 / student123</Text>
        </TouchableOpacity>

        <AppInput
          label="Student ID"
          placeholder="e.g. BCA001"
          value={studentId}
          onChangeText={setStudentId}
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
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          }
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <IconSymbol size={20} name={showPassword ? 'eye.slash.fill' : 'eye.fill'} color={APP_COLORS.textMuted} />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity 
          style={styles.rememberMe}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.7}
        >
          <IconSymbol 
            size={20} 
            name={rememberMe ? 'checkmark.square.fill' : 'square'} 
            color={rememberMe ? APP_COLORS.primary : APP_COLORS.textMuted} 
          />
          <Text style={styles.rememberText}>Remember me on this device</Text>
        </TouchableOpacity>

        <AppButton
          title="Sign In as Student"
          onPress={handleLogin}
          loading={loading}
          variant="primary"
          style={styles.submitBtn}
        />

        <TouchableOpacity style={styles.helpCenter} onPress={handleSupport} activeOpacity={0.7}>
          <IconSymbol size={16} name="questionmark.circle" color={APP_COLORS.textSecondary} />
          <Text style={styles.helpText}>
            Need help? <Text style={styles.helpLink}>View Demo Accounts</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  branding: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: APP_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: APP_COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.surfaceVariant,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${APP_COLORS.primary}40`,
    alignSelf: 'center',
    marginBottom: 16,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
  forgotPassword: {
    fontSize: 13,
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  rememberText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  helpCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  helpText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  helpLink: {
    color: APP_COLORS.primary,
    fontWeight: '700',
  },
});