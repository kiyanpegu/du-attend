import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/duAttend';
import { createId } from '@/utils/format';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NOTIFICATION_CHANNELS = {
  CLASSES: 'classes',
  ATTENDANCE: 'attendance',
  ALERTS: 'alerts',
} as const;

export type AppNotificationType =
  | 'live_attendance'
  | 'class_cancelled'
  | 'class_rescheduled'
  | 'attendance_shortage'
  | 'system';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
  data?: {
    url?: string;
    subjectName?: string;
    slotTime?: string;
    newDay?: string;
    newTime?: string;
    percentage?: number;
    classesNeeded?: number;
    sessionId?: string;
    [key: string]: any;
  };
}

class NotificationService {
  private initialized = false;

  /**
   * Initializes notification channels on Android and verifies permissions.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    if (Platform.OS === 'android') {
      try {
        // High priority channel for routine cancellations and rescheduling
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CLASSES, {
          name: 'Class Schedule Updates',
          description: 'Instant alerts for cancelled or rescheduled lectures',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0066CC',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Max priority heads-up channel for live attendance sessions
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ATTENDANCE, {
          name: 'Live Attendance Alerts',
          description: 'Urgent notifications when an instructor opens attendance check-in',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 400, 200, 400],
          lightColor: '#10B981',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Informational channel for attendance shortage advisories (<75%)
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ALERTS, {
          name: 'Academic Attendance Alerts',
          description: 'Notifications regarding attendance thresholds and academic requirements',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#EF4444',
          showBadge: true,
        });
      } catch (err) {
        console.warn('Error setting up notification channels:', err);
      }
    }

    this.initialized = true;
    return true;
  }

  /**
   * Request notification permission from the user (Android 13+ and iOS).
   */
  async requestPermissionsAsync(): Promise<boolean> {
    try {
      await this.initialize();
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // In-App Notification History Persistence
  // --------------------------------------------------------------------------

  async saveNotification(entry: {
    type: AppNotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<AppNotification> {
    try {
      const existing = await this.getNotifications();
      const newNotification: AppNotification = {
        id: createId('notif'),
        type: entry.type,
        title: entry.title,
        body: entry.body,
        timestamp: new Date().toISOString(),
        read: false,
        data: entry.data,
      };

      // Keep up to 100 recent notifications
      const updated = [newNotification, ...existing].slice(0, 100);
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(updated));
      return newNotification;
    } catch (err) {
      console.warn('Failed to save notification to storage:', err);
      return {
        id: createId('notif'),
        type: entry.type,
        title: entry.title,
        body: entry.body,
        timestamp: new Date().toISOString(),
        read: false,
        data: entry.data,
      };
    }
  }

  async getNotifications(): Promise<AppNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.notifications);
      if (!raw) return [];
      return JSON.parse(raw) as AppNotification[];
    } catch {
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch {
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const existing = await this.getNotifications();
      const updated = existing.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const existing = await this.getNotifications();
      const updated = existing.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.notifications);
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Scheduled System & Push Notifications
  // --------------------------------------------------------------------------

  /**
   * Trigger immediate system notification when a class lecture is cancelled.
   */
  async notifyClassCancelled(params: {
    subjectName: string;
    slotTime: string;
    reason?: string;
  }): Promise<string | null> {
    try {
      await this.initialize();
      const reasonText = params.reason ? ` (${params.reason})` : '';
      const title = `❌ Class Cancelled: ${params.subjectName}`;
      const body = `The ${params.slotTime} lecture has been cancelled${reasonText}. This slot is excluded from attendance calculation.`;

      // Persist to in-app notification history
      await this.saveNotification({
        type: 'class_cancelled',
        title,
        body,
        data: {
          url: '/student-schedule',
          subjectName: params.subjectName,
          slotTime: params.slotTime,
        },
      });

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            url: '/student-schedule',
            type: 'class_cancelled',
            subjectName: params.subjectName,
            slotTime: params.slotTime,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          channelId: NOTIFICATION_CHANNELS.CLASSES,
        },
      });

      return identifier;
    } catch (error) {
      console.warn('Failed to schedule cancellation notification:', error);
      return null;
    }
  }

  /**
   * Trigger immediate system notification when a class lecture is rescheduled.
   */
  async notifyClassRescheduled(params: {
    subjectName: string;
    originalTime: string;
    newDay: string;
    newTime: string;
    room?: string;
  }): Promise<string | null> {
    try {
      await this.initialize();
      const roomText = params.room ? ` in ${params.room}` : '';
      const title = `🗓️ Class Rescheduled: ${params.subjectName}`;
      const body = `Originally at ${params.originalTime}, moved to ${params.newDay} at ${params.newTime}${roomText}.`;

      // Persist to in-app notification history
      await this.saveNotification({
        type: 'class_rescheduled',
        title,
        body,
        data: {
          url: '/student-schedule',
          subjectName: params.subjectName,
          newDay: params.newDay,
          newTime: params.newTime,
        },
      });

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            url: '/student-schedule',
            type: 'class_rescheduled',
            subjectName: params.subjectName,
            newDay: params.newDay,
            newTime: params.newTime,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          channelId: NOTIFICATION_CHANNELS.CLASSES,
        },
      });

      return identifier;
    } catch (error) {
      console.warn('Failed to schedule reschedule notification:', error);
      return null;
    }
  }

  /**
   * Trigger immediate heads-up notification when an instructor begins live attendance.
   */
  async notifyAttendanceSessionStarted(params: {
    subjectName: string;
    room?: string;
    durationMinutes?: number;
    sessionId?: string;
  }): Promise<string | null> {
    try {
      await this.initialize();
      const roomText = params.room ? ` in ${params.room}` : '';
      const durationText = params.durationMinutes ? ` (${params.durationMinutes} min window)` : '';
      const title = `⚡ Live Attendance: ${params.subjectName}`;
      const body = `Check-in is now OPEN${roomText}${durationText}. Enter classroom OTP to mark presence!`;

      // Persist to in-app notification history
      await this.saveNotification({
        type: 'live_attendance',
        title,
        body,
        data: {
          url: '/student-mark-attendance',
          subjectName: params.subjectName,
          sessionId: params.sessionId,
        },
      });

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            url: '/student-mark-attendance',
            type: 'live_attendance',
            subjectName: params.subjectName,
            sessionId: params.sessionId,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          channelId: NOTIFICATION_CHANNELS.ATTENDANCE,
        },
      });

      return identifier;
    } catch (error) {
      console.warn('Failed to schedule attendance session notification:', error);
      return null;
    }
  }

  /**
   * Trigger advisory notification when student attendance in a subject falls below 75%.
   */
  async notifyAttendanceShortage(params: {
    subjectName: string;
    percentage: number;
    classesNeeded: number;
  }): Promise<string | null> {
    try {
      await this.initialize();
      const title = `⚠️ Attendance Shortage Warning: ${params.subjectName}`;
      const body = `Your attendance is ${params.percentage.toFixed(1)}% (below 75% required). Attend next ${params.classesNeeded} class(es) to recover.`;

      // Persist to in-app notification history
      await this.saveNotification({
        type: 'attendance_shortage',
        title,
        body,
        data: {
          url: '/student-subjects',
          subjectName: params.subjectName,
          percentage: params.percentage,
          classesNeeded: params.classesNeeded,
        },
      });

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            url: '/student-subjects',
            type: 'attendance_shortage',
            subjectName: params.subjectName,
          },
          sound: true,
        },
        trigger: {
          channelId: NOTIFICATION_CHANNELS.ALERTS,
        },
      });

      return identifier;
    } catch (error) {
      console.warn('Failed to schedule shortage warning notification:', error);
      return null;
    }
  }

  /**
   * Add listener for when a user taps a notification in the system tray.
   */
  addResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
