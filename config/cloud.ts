import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Cloud Project Configuration (with guaranteed inlined fallbacks)
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xczioqwkdzbqadesbvmt.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_orydkh3_Mh2sii9ej5wFLA_P98yqrrA';

export const CLOUD_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://')),
};

export function isCloudConfigured(): boolean {
  return CLOUD_CONFIG.isConfigured;
}

// Custom storage adapter for Supabase auth in React Native / Expo (SSR-safe)
const CustomAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && !('window' in globalThis)) {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && !('window' in globalThis)) {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore storage errors on server/restricted envs
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && !('window' in globalThis)) {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

export const supabase: SupabaseClient | null = CLOUD_CONFIG.isConfigured
  ? createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.anonKey, {
      auth: {
        storage: CustomAsyncStorage,
        autoRefreshToken: typeof window !== 'undefined',
        persistSession: typeof window !== 'undefined',
        detectSessionInUrl: false,
      },
    })
  : null;

