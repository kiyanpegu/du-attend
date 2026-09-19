import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { AppNotification, AppNotificationType, notificationService } from '@/services/notificationService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'all' | 'live' | 'schedule' | 'alerts';

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getNotificationConfig(type: AppNotificationType): {
  icon: IconSymbolName;
  iconBg: string;
  iconColor: string;
  badgeText: string;
} {
  switch (type) {
    case 'live_attendance':
      return {
        icon: 'bolt.fill',
        iconBg: '#E8F8F0',
        iconColor: APP_COLORS.safeText,
        badgeText: 'LIVE CLASS',
      };
    case 'class_cancelled':
      return {
        icon: 'xmark.circle.fill',
        iconBg: '#FEECEC',
        iconColor: APP_COLORS.danger,
        badgeText: 'CANCELLED',
      };
    case 'class_rescheduled':
      return {
        icon: 'calendar.badge.clock',
        iconBg: '#FFF3E0',
        iconColor: APP_COLORS.secondaryWarm,
        badgeText: 'RESCHEDULED',
      };
    case 'attendance_shortage':
      return {
        icon: 'exclamationmark.triangle.fill',
        iconBg: '#FEECEC',
        iconColor: APP_COLORS.danger,
        badgeText: 'SHORTAGE',
      };
    case 'system':
    default:
      return {
        icon: 'bell.fill',
        iconBg: '#EEF2FF',
        iconColor: '#3B82F6',
        badgeText: 'NOTICE',
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await notificationService.clearAll();
            loadNotifications();
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.read) {
      await notificationService.markAsRead(item.id);
      loadNotifications();
    }

    if (item.data?.url) {
      router.push(item.data.url as never);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'live') return item.type === 'live_attendance';
    if (filter === 'schedule') return item.type === 'class_cancelled' || item.type === 'class_rescheduled';
    if (filter === 'alerts') return item.type === 'attendance_shortage' || item.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <LoadingState message="Loading notification history..." />;
  }

  return (
    <AppScreen scrollable={false}>
      <Header
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        showBack
      />

      {/* Action Bar */}
      <View style={styles.topActionsRow}>
        <View style={styles.filtersScroll}>
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'live', label: 'Live' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'alerts', label: 'Alerts' },
            ] as const
          ).map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {notifications.length > 0 && (
          <View style={styles.bulkActionsRow}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.textActionBtn} activeOpacity={0.7}>
                <Text style={styles.textActionLabel}>Mark Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClearAll} style={styles.textActionBtn} activeOpacity={0.7}>
              <Text style={[styles.textActionLabel, styles.dangerLabel]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No Notifications Found"
            message={
              filter === 'all'
                ? "You're all caught up! Class schedules, live attendance check-ins, and advisories will appear here."
                : 'No notifications in this category.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={APP_COLORS.primary}
            />
          }
          renderItem={({ item }) => {
            const cfg = getNotificationConfig(item.type);

            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNotificationPress(item)}
              >
                <Card
                  style={[
                    styles.notificationCard,
                    !item.read && styles.notificationCardUnread,
                  ]}
                  padded
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconAndBadgeRow}>
                      <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
                        <IconSymbol size={18} name={cfg.icon as any} color={cfg.iconColor} />
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: cfg.iconBg }]}>
                        <Text style={[styles.typeBadgeText, { color: cfg.iconColor }]}>
                          {cfg.badgeText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeAndStatusWrap}>
                      <Text style={styles.timestamp}>{formatRelativeTime(item.timestamp)}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>

                  <Text style={[styles.notificationTitle, !item.read && styles.titleBold]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notificationBody}>
                    {item.body}
                  </Text>

                  {item.data?.url && (
                    <View style={styles.actionPromptRow}>
                      <Text style={styles.actionPromptText}>Tap to view details</Text>
                      <IconSymbol size={12} name="chevron.right" color={APP_COLORS.primary} />
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.subSurface,
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.obsidian,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 6,
  },
  textActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  textActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  dangerLabel: {
    color: APP_COLORS.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  notificationCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
  },
  notificationCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 94, 54, 0.25)',
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.xs,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeAndStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primary,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  titleBold: {
    fontWeight: '800',
    color: APP_COLORS.obsidian,
  },
  notificationBody: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 17,
  },
  actionPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
});
