import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/duAttend';
import { SEED_DATABASE, SEED_IDS } from '@/constants/seedData';
import type { AttendanceRecord, AttendanceSession, LocalDatabase } from '@/types/models';
import { createId } from '@/utils/format';

let dbMutationPromise = Promise.resolve();

function cloneDatabase(database: LocalDatabase): LocalDatabase {
  return JSON.parse(JSON.stringify(database)) as LocalDatabase;
}

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function setJSON<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (__DEV__) {
      console.warn('Failed to set JSON in storage:', err);
    }
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    // Fallback
  }
  await AsyncStorage.setItem(key, value);
}

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    }
  } catch {
    // Fallback
  }
  return AsyncStorage.getItem(key);
}

async function removeSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Fallback
  }
  await AsyncStorage.removeItem(key);
}

function mergeById<T extends { id: string }>(current: T[], seed: T[]) {
  const existing = new Set((current ?? []).map((item) => item.id));
  return [...(current ?? []), ...(seed ?? []).filter((item) => !existing.has(item.id))];
}

function mergeSeedData(database: Partial<LocalDatabase>): LocalDatabase {
  const seed = cloneDatabase(SEED_DATABASE);

  return {
    universities: mergeById(database.universities ?? [], seed.universities),
    departments: mergeById(database.departments ?? [], seed.departments),
    programmes: mergeById(database.programmes ?? [], seed.programmes),
    semesters: mergeById(database.semesters ?? [], seed.semesters),
    users: mergeById(database.users ?? [], seed.users),
    students: mergeById(database.students ?? [], seed.students),
    faculties: mergeById(database.faculties ?? [], seed.faculties),
    subjects: mergeById(database.subjects ?? [], seed.subjects),
    enrollments: mergeById(database.enrollments ?? [], seed.enrollments),
    facultyAssignments: mergeById(database.facultyAssignments ?? [], seed.facultyAssignments),
    attendanceSessions: Array.isArray(database.attendanceSessions) ? database.attendanceSessions : [],
    attendanceRecords: Array.isArray(database.attendanceRecords) ? database.attendanceRecords : [],
  };
}

type LegacyAttendance = Record<string, Array<Record<string, boolean>>>;

async function migrateLegacyAttendance(database: LocalDatabase) {
  const alreadyMigrated = await AsyncStorage.getItem(STORAGE_KEYS.legacyAttendanceMigrated);

  if (alreadyMigrated === 'true') {
    return database;
  }

  const legacy = await getJSON<LegacyAttendance>(STORAGE_KEYS.legacyAttendanceData);

  if (!legacy) {
    await AsyncStorage.setItem(STORAGE_KEYS.legacyAttendanceMigrated, 'true');
    return database;
  }

  const migratedSessions: AttendanceSession[] = [];
  const migratedRecords: AttendanceRecord[] = [];
  const baseTime = Date.now() - Object.values(legacy).flat().length * 60 * 60 * 1000;

  Object.entries(legacy).forEach(([subjectName, history]) => {
    const subject = database.subjects.find((item) => item.name === subjectName);

    if (!subject || !Array.isArray(history)) {
      return;
    }

    history.forEach((record, index) => {
      const startedAt = new Date(baseTime + migratedSessions.length * 60 * 60 * 1000).toISOString();
      const endedAt = new Date(new Date(startedAt).getTime() + 45 * 60 * 1000).toISOString();
      const sessionId = createId('legacy-session');

      migratedSessions.push({
        id: sessionId,
        subjectId: subject.id,
        facultyId: SEED_IDS.faculty,
        startedAt,
        endedAt,
        status: 'ended',
        otp: `${900000 + index}`.slice(0, 6),
        otpExpiresAt: new Date(new Date(startedAt).getTime() + 60 * 1000).toISOString(),
        cancelledAt: null,
      });

      database.students.forEach((student) => {
        const legacyStatus = record[student.studentId];

        migratedRecords.push({
          id: createId('legacy-record'),
          sessionId,
          studentId: student.id,
          status: legacyStatus === true ? 'present' : 'absent',
          markedAt: endedAt,
          markedBy: 'manual',
          markedByUserId: SEED_IDS.facultyUser,
        });
      });
    });
  });

  if (migratedSessions.length > 0) {
    database.attendanceSessions = [...database.attendanceSessions, ...migratedSessions];
    database.attendanceRecords = [...database.attendanceRecords, ...migratedRecords];
  }

  await AsyncStorage.setItem(STORAGE_KEYS.legacyAttendanceMigrated, 'true');
  return database;
}

export const storageService = {
  async initializeDatabase(): Promise<LocalDatabase> {
    const saved = await getJSON<LocalDatabase>(STORAGE_KEYS.database);
    const withSeed = saved ? mergeSeedData(saved) : cloneDatabase(SEED_DATABASE);
    const migrated = await migrateLegacyAttendance(withSeed);
    await setJSON(STORAGE_KEYS.database, migrated);
    return migrated;
  },

  async getDatabase(): Promise<LocalDatabase> {
    return this.initializeDatabase();
  },

  async saveDatabase(database: LocalDatabase): Promise<void> {
    await setJSON(STORAGE_KEYS.database, database);
  },

  async updateDatabase(updater: (database: LocalDatabase) => LocalDatabase | void): Promise<LocalDatabase> {
    const nextPromise = dbMutationPromise.then(async () => {
      const database = await this.getDatabase();
      const updated = updater(database) ?? database;
      await this.saveDatabase(updated);
      return updated;
    });

    dbMutationPromise = nextPromise.then(() => {}, () => {});
    return nextPromise;
  },

  async resetAttendanceData(): Promise<void> {
    return this.updateDatabase((database) => {
      database.attendanceSessions = [];
      database.attendanceRecords = [];
    }).then(async () => {
      await AsyncStorage.removeItem(STORAGE_KEYS.legacyAttendanceData);
      await AsyncStorage.setItem(STORAGE_KEYS.legacyAttendanceMigrated, 'true');
    });
  },

  async resetDatabaseToSeed(): Promise<LocalDatabase> {
    const fresh = cloneDatabase(SEED_DATABASE);
    await this.saveDatabase(fresh);
    await AsyncStorage.removeItem(STORAGE_KEYS.legacyAttendanceData);
    await AsyncStorage.setItem(STORAGE_KEYS.legacyAttendanceMigrated, 'true');
    return fresh;
  },

  setSecureItem,
  getSecureItem,
  removeSecureItem,
  getJSON,
  setJSON,
};

