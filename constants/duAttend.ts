import type { AttendanceStanding, Role } from '@/types/models';

export const APP_IDENTITY = {
  name: 'DU Attend',
  subtitle: 'Attendance Management Prototype',
  university: 'Campus Demo',
  disclaimer: 'Independent demo prototype. Not an official Dibrugarh University application.',
  prototypeNote: 'Independent demonstration prototype for mobile attendance workflows.',
  legalNote: 'Independent demo prototype. Not an official Dibrugarh University application.',
};

export const ATTENDANCE_THRESHOLDS = {
  good: 75,
  warning: 50,
};

export const OTP_CONFIG = {
  digits: 6,
  expiresInSeconds: 60,
};

export const STORAGE_KEYS = {
  database: 'duAttendDatabase',
  authSession: 'duAttendAuthSession',
  legacyStudentId: 'loggedInStudentId',
  legacyAttendanceData: 'attendanceData',
  legacyAttendanceMigrated: 'duAttendLegacyAttendanceMigrated',
};

export const APP_COLORS = {
  // Canvas / Levels
  background: '#0F172A', // Level 0
  surface: '#1E293B', // Level 1 (Inland)
  surfaceVariant: '#334155', // Level 2 (Cards)
  card: '#334155',
  cardAlt: '#334155',
  border: 'rgba(255,255,255,0.1)', // Low contrast borders

  // Primary & Accents
  primary: '#2563eb', // Primary Blue
  primarySoft: 'rgba(37, 99, 235, 0.1)',
  primaryDark: '#002a78',
  onPrimary: '#ffffff',
  
  secondary: '#3a4a5f',
  tertiary: '#bc4800', // Orange accent

  // Status Colors (Semantic Logic)
  success: '#10b981', // Emerald Green
  successSoft: 'rgba(16, 185, 129, 0.1)',
  successDark: '#047857',
  
  warning: '#f59e0b', // Amber (Late/Warning)
  warningSoft: 'rgba(245, 158, 11, 0.1)',
  warningDark: '#b45309',
  
  danger: '#ef4444', // Absent / Critical
  dangerSoft: 'rgba(239, 68, 68, 0.1)',
  dangerDark: '#b91c1c',
  
  info: '#3b82f6',
  infoSoft: 'rgba(59, 130, 246, 0.1)',
  
  // Text & Neutrals (Slate grays)
  text: '#e1e2ed',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  muted: '#94a3b8',
  subtle: '#64748b',
  black: '#020617',
};

// Stitch Spacing & Rounded tokens
export const TOKENS = {
  spacing: {
    base: 4,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  rounded: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
};

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  cancelled: 'Cancelled',
};

export const ATTENDANCE_METHOD_LABELS = {
  otp: 'OTP',
  manual: 'Manual',
  none: 'None',
};

export const STANDING_LABELS: Record<AttendanceStanding, string> = {
  good: 'Good / Eligible',
  warning: 'Warning',
  critical: 'Critical',
  none: 'No classes yet',
};

export const roleLoginRoutes: Record<Role, string> = {
  student: '/student-login',
  faculty: '/faculty-login',
  admin: '/admin-login',
};

export const roleHomeRoutes: Record<Role, string> = {
  student: '/student-dashboard',
  faculty: '/faculty-dashboard',
  admin: '/admin-dashboard',
};
