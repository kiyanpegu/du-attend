import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface OTPDisplayProps {
  otp: string;
  secondsRemaining: number;
  expired?: boolean;
  style?: ViewStyle;
}

export function OTPDisplay({ otp, secondsRemaining, expired = false, style }: OTPDisplayProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Verification Code</Text>
      <View style={styles.otpContainer}>
        {expired ? (
          <Text style={styles.expiredText}>OTP EXPIRED</Text>
        ) : (
          <Text style={styles.otpText}>{otp}</Text>
        )}
      </View>
      {!expired && (
        <View style={styles.timerContainer}>
          <IconSymbol size={16} name="timer" color={APP_COLORS.textMuted} />
          <Text style={styles.timerLabel}>Expires in <Text style={[
            styles.timerText,
            secondsRemaining <= 10 && styles.timerUrgent
          ]}>
            {secondsRemaining}s
          </Text></Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 54, 0.3)',
    ...TOKENS.shadows.subtle,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  otpContainer: {
    minWidth: 180,
    alignItems: 'center',
  },
  otpText: {
    fontSize: 48,
    fontWeight: '700',
    color: APP_COLORS.primary,
    letterSpacing: 12,
    fontVariant: ['tabular-nums'],
  },
  expiredText: {
    fontSize: 32,
    fontWeight: '700',
    color: APP_COLORS.danger,
    letterSpacing: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  timerLabel: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: APP_COLORS.danger,
  },
});
