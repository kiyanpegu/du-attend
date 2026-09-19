import { AppButton } from '@/components/app/AppButton';
import { Card } from '@/components/app/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS } from '@/constants/duAttend';
import { AppUpdateStatus, updateService } from '@/services/updateService';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface MandatoryUpdateModalProps {
  visible: boolean;
  updateStatus: AppUpdateStatus | null;
}

export function MandatoryUpdateModal({ visible, updateStatus }: MandatoryUpdateModalProps) {
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string>('Downloading update...');

  if (!visible || !updateStatus) return null;

  const handleUpdateNow = async () => {
    setUpdating(true);
    setErrorMsg(null);
    setProgressStep(
      updateStatus.type === 'ota' ? 'Downloading latest bundle...' : 'Opening download link...'
    );

    try {
      if (updateStatus.type === 'ota') {
        setProgressStep('Installing and reloading app...');
      }

      const res = await updateService.applyUpdate(updateStatus);

      if (!res.ok) {
        setErrorMsg(res.message || 'Failed to apply update. Please retry.');
        setUpdating(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred while updating.');
      setUpdating(false);
    }
  };

  const currentVer = updateService.getCurrentVersion();
  const newVer = updateStatus.version || 'Latest';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Non-dismissible: user must update to continue using the app
      }}
    >
      <View style={styles.backdrop}>
        <Card style={styles.card} padded>
          {/* Icon Header */}
          <View style={styles.iconCircleWrap}>
            <View style={styles.iconGlow} />
            <View style={styles.iconCircle}>
              <IconSymbol size={36} name="arrow.down.circle.fill" color="#FFFFFF" />
            </View>
          </View>

          {/* Badge */}
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>MANDATORY UPDATE</Text>
          </View>

          {/* Titles */}
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.description}>
            A new version of {APP_IDENTITY.name} is available with critical schedule synchronization,
            restore bug fixes, and notification updates.
          </Text>

          {/* Version Pill */}
          <View style={styles.versionBox}>
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>INSTALLED</Text>
              <Text style={styles.versionValue}>v{currentVer}</Text>
            </View>
            <IconSymbol size={16} name="arrow.right" color={APP_COLORS.textMuted} />
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>AVAILABLE</Text>
              <Text style={[styles.versionValue, styles.versionHighlight]}>
                {newVer.startsWith('v') ? newVer : `v${newVer}`}
              </Text>
            </View>
          </View>

          {/* Update Mechanism Note */}
          <Text style={styles.updateTypeNote}>
            {updateStatus.type === 'ota'
              ? '⚡ Instant Over-The-Air Update — No APK re-install needed.'
              : '📦 APK Update — Direct download link.'}
          </Text>

          {/* Error Notice if failed */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <IconSymbol size={16} name="exclamationmark.triangle.fill" color={APP_COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Action Button */}
          {updating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={APP_COLORS.primary} />
              <Text style={styles.loadingText}>{progressStep}</Text>
            </View>
          ) : (
            <AppButton
              title={errorMsg ? 'Retry Update' : 'Update Now to Continue'}
              onPress={handleUpdateNow}
              variant="primary"
              size="large"
              icon="arrow.clockwise"
              style={styles.actionBtn}
            />
          )}

          <Text style={styles.disclaimerText}>
            App access is temporarily paused until this update is applied to prevent schedule and attendance desync.
          </Text>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    ...TOKENS.shadows.card,
  },
  iconCircleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 94, 54, 0.25)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    backgroundColor: '#FEECEC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: TOKENS.rounded.full,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.danger,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: TOKENS.rounded.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 10,
  },
  versionColumn: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  versionHighlight: {
    color: APP_COLORS.primary,
    fontWeight: '800',
  },
  updateTypeNote: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F1',
    padding: 10,
    borderRadius: TOKENS.rounded.sm,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: APP_COLORS.danger,
    flex: 1,
    lineHeight: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    width: '100%',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: TOKENS.rounded.md,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  actionBtn: {
    width: '100%',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 10,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 10,
  },
});
