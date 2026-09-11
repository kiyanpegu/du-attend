import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables supported by Expo (prefixed with EXPO_PUBLIC_)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const CLOUD_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://')),
};

export function isCloudConfigured(): boolean {
  return CLOUD_CONFIG.isConfigured;
}

// Custom storage adapter for Supabase auth in React Native / Expo
const CustomAsyncStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase: SupabaseClient | null = CLOUD_CONFIG.isConfigured
  ? createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.anonKey, {
      auth: {
        storage: CustomAsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
