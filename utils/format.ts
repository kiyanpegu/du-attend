import { ATTENDANCE_THRESHOLDS } from '@/constants/duAttend';
import type { AttendanceStanding } from '@/types/models';
import * as Crypto from 'expo-crypto';

export function createId(prefix: string) {
  try {
    const bytes = Crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${Date.now()}-${hex}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function normalizeCredential(value: string) {
  return (value || '').trim().toUpperCase();
}

export function calculatePercentage(attended: number, conducted: number) {
  if (conducted <= 0 || !Number.isFinite(conducted) || !Number.isFinite(attended) || attended < 0) {
    return 0;
  }

  const ratio = (attended / conducted) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function getAttendanceStanding(percentage: number, conducted: number): AttendanceStanding {
  if (conducted <= 0) {
    return 'none';
  }

  if (percentage >= ATTENDANCE_THRESHOLDS.good) {
    return 'good';
  }

  if (percentage >= ATTENDANCE_THRESHOLDS.warning) {
    return 'warning';
  }

  return 'critical';
}

export interface AttendanceAdvice {
  status: 'safe' | 'warning' | 'critical' | 'none';
  percentage: number;
  message: string;
  shortLabel: string;
  canMissCount: number;
  mustAttendCount: number;
}

export function calculateAttendanceAdvice(
  attended: number,
  conducted: number,
  target: number = 75
): AttendanceAdvice {
  if (conducted <= 0) {
    return {
      status: 'none',
      percentage: 0,
      message: 'No classes conducted yet.',
      shortLabel: 'No classes',
      canMissCount: 0,
      mustAttendCount: 0,
    };
  }

  const percentage = calculatePercentage(attended, conducted);

  if (percentage >= target) {
    // How many classes can the student miss before dropping below target?
    // Formula: floor((100 * attended - target * conducted) / target)
    const canMiss = Math.floor((100 * attended - target * conducted) / target);
    const safeCount = Math.max(0, canMiss);

    return {
      status: 'safe',
      percentage,
      message:
        safeCount > 0
          ? `You can safely miss ${safeCount} more class${safeCount === 1 ? '' : 'es'} without dropping below ${target}%.`
          : `You are on track at ${percentage}%. Attend next class to maintain your safety margin.`,
      shortLabel: safeCount > 0 ? `Can miss ${safeCount}` : 'On track',
      canMissCount: safeCount,
      mustAttendCount: 0,
    };
  } else {
    // How many consecutive classes must the student attend to reach target?
    // Formula: ceil((target * conducted - 100 * attended) / (100 - target))
    const required = Math.ceil((target * conducted - 100 * attended) / (100 - target));
    const mustAttend = Math.max(1, required);

    return {
      status: percentage >= ATTENDANCE_THRESHOLDS.warning ? 'warning' : 'critical',
      percentage,
      message: `Attend the next ${mustAttend} class${mustAttend === 1 ? '' : 'es'} consecutively to reach ${target}%.`,
      shortLabel: `Need +${mustAttend}`,
      canMissCount: 0,
      mustAttendCount: mustAttend,
    };
  }
}

export function formatPercentage(percentage: number, conducted: number) {
  if (conducted <= 0) {
    return 'No classes yet';
  }

  return `${percentage}%`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isWithinDateFilter(value: string, filter: 'all' | 'today' | 'week' | 'month') {
  if (filter === 'all') {
    return true;
  }

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const age = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (filter === 'today') {
    return date.toDateString() === now.toDateString();
  }

  if (filter === 'week') {
    return age <= 7 * day;
  }

  return age <= 30 * day;
}
