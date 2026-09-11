import AsyncStorage from '@react-native-async-storage/async-storage';

import { roleHomeRoutes, roleLoginRoutes, STORAGE_KEYS } from '@/constants/duAttend';
import { cloudService } from '@/services/cloudService';
import { storageService } from '@/services/storageService';
import type { AuthSession, Role, ServiceResult, User } from '@/types/models';
import { normalizeCredential } from '@/utils/format';

export const authService = {
  async login(role: Role, username: string, password: string): Promise<ServiceResult<AuthSession>> {
    let user: User | null = null;

    if (cloudService.isOnline()) {
      user = await cloudService.authenticateUser(username, password);
      if (user && user.role !== role) {
        return {
          ok: false,
          message: `Invalid ${role} credentials.`,
        };
      }
    }

    if (!user) {
      const database = await storageService.getDatabase();
      const normalizedUsername = normalizeCredential(username);
      user = database.users.find(
        (item) => item.role === role && item.username.toUpperCase() === normalizedUsername
      ) ?? null;

      if (!user || !user.active || user.developmentPassword !== password) {
        return {
          ok: false,
          message: `Invalid ${role} credentials.`,
        };
      }
    }

    const session: AuthSession = {
      userId: user.id,
      role,
      signedInAt: new Date().toISOString(),
    };

    await storageService.setSecureItem(STORAGE_KEYS.authSession, JSON.stringify(session));

    if (role === 'student') {
      await AsyncStorage.setItem(STORAGE_KEYS.legacyStudentId, user.username.toUpperCase());
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.legacyStudentId);
    }

    return {
      ok: true,
      message: 'Login successful.',
      data: session,
    };
  },

  async logout() {
    await storageService.removeSecureItem(STORAGE_KEYS.authSession);
    await AsyncStorage.removeItem(STORAGE_KEYS.legacyStudentId);
  },

  async getCurrentSession(): Promise<AuthSession | null> {
    const raw = await storageService.getSecureItem(STORAGE_KEYS.authSession);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();

    if (!session) {
      return null;
    }

    const database = await storageService.getDatabase();
    return database.users.find((user) => user.id === session.userId && user.active) ?? null;
  },

  async requireRole(role: Role) {
    const session = await this.getCurrentSession();

    if (!session || session.role !== role) {
      return null;
    }

    const database = await storageService.getDatabase();
    const user = database.users.find((item) => item.id === session.userId && item.role === role && item.active);

    if (!user) {
      await this.logout();
      return null;
    }

    return { session, user };
  },

  getLoginRoute(role: Role) {
    return roleLoginRoutes[role];
  },

  getHomeRoute(role: Role) {
    return roleHomeRoutes[role];
  },

  async getActiveUser(): Promise<User | null> {
    return this.getCurrentUser();
  },
};
