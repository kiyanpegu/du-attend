import { AppButton } from '@/components/app/AppButton';
import { Card } from '@/components/app/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { AppUpdateStatus, updateService } from '@/services/updateService';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AppUpdateCardProps {
  style?: object;
}

export function AppUpdateCard({ style }: AppUpdateCardProps) {
  const currentVersion = updateService.getCurrentVersion();
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setNoticeMessage(null);
    try {
      const result = await updateService.checkForUpdate();
      setUpdateStatus(result);
    } catch {
      setNoticeMessage('Unable to reach update server. Check your connection.');
    } finally {
      setChecking(false);
    }
  };

  const handleApply = async () => {
    if (!updateStatus || !updateStatus.isAvailable) return;
    setApplying(true);
    setNoticeMessage(null);
    try {
      const result = await updateService.applyUpdate(updateStatus);
      setNoticeMessage(result.message);
    } catch {
      setNoticeMessage('Failed to download update. Please try again later.');
    } finally {
      setApplying(false);
    }
  };

  const isAvailable = updateStatus?.isAvailable ?? false;

  return (
    <Card style={[styles.card, style]} padded>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <IconSymbol
            size={22}
            name={isAvailable ? 'arrow.triangle.2.circlepath.circle.fill' : 'checkmark.seal.fill'}
            color={isAvailable ? APP_COLORS.warning : APP_COLORS.primary}
          />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>In-App Updates</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{currentVersion}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {checking
              ? 'Checking update servers...'
              : updateStatus?.message ?? 'Seamless Over-The-Air & direct update support.'}
          </Text>
        </View>
      </View>

      {noticeMessage && (
        <View style={styles.noticeBox}>
          <IconSymbol size={16} name="info.circle.fill" color={APP_COLORS.primary} />
          <Text style={styles.noticeText}>{noticeMessage}</Text>
        </View>
      )}

      {isAvailable && updateStatus?.releaseNotes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>What&apos;s New in v{updateStatus.version}:</Text>
          <Text style={styles.notesBody}>{updateStatus.releaseNotes}</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <AppButton
          title={checking ? 'Checking...' : 'Check for Updates'}
          onPress={handleCheck}
          variant="outline"
          size="small"
          loading={checking}
          disabled={checking || applying}
          icon="arrow.clockwise"
          style={styles.actionBtn}
        />

        {isAvailable && (
          <AppButton
            title={
              applying
                ? 'Installing...'
                : updateStatus?.type === 'ota'
                ? 'Update Now (Instant)'
                : 'Download Update'
            }
            onPress={handleApply}
            variant="primary"
            size="small"
            loading={applying}
            disabled={applying}
            icon="arrow.down.circle.fill"
            style={styles.actionBtn}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: APP_COLORS.surfaceVariant,
    borderColor: APP_COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${APP_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  versionBadge: {
    backgroundColor: `${APP_COLORS.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${APP_COLORS.primary}10`,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  noticeText: {
    fontSize: 12,
    color: APP_COLORS.text,
    flex: 1,
  },
  notesBox: {
    backgroundColor: APP_COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.primary,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  notesBody: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
  },
});
