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
  expiresInSeconds: 300, // 5 minutes for stable physical classroom verification
};

export const GEOFENCE_CONFIG = {
  // Dibrugarh University Centre for Computer Science and Applications (CCSA)
  targetLatitude: 27.4526,
  targetLongitude: 94.9185,
  allowedRadiusMeters: 100,
  campusName: 'Dibrugarh University — CCSA Campus',
  classroomName: 'CCSA Lecture Hall 1',
};

export const STORAGE_KEYS = {
  database: 'duAttendDatabase',
  authSession: 'duAttendAuthSession',
  legacyStudentId: 'loggedInStudentId',
  legacyAttendanceData: 'attendanceData',
  legacyAttendanceMigrated: 'duAttendLegacyAttendanceMigrated',
};

export const APP_COLORS = {
  // Canvas & Surfaces (DU Attend Neo-Tactile)
  canvas: '#F4F6F9',
  background: '#F4F6F9', // Primary background canvas
  surface: '#FFFFFF', // Clean floating cards, modals, sheets
  surfaceVariant: '#FFFFFF', // Backwards compatibility for cards
  subSurface: '#ECEEF2', // Inputs, secondary pill backgrounds
  card: '#FFFFFF',
  cardAlt: '#ECEEF2',
  border: '#E2E4E9', // Clean soft boundary
  borderSubtle: 'rgba(17, 19, 24, 0.05)', // Almost invisible separator

  // Primary & Warm Accents (Aurora & Brand)
  primaryWarm: '#FF5E36', // Coral/Warm Accent
  secondaryWarm: '#FFA133', // Amber Accent
  primary: '#FF5E36', // Main brand accent
  primaryDark: '#E04820',
  primarySoft: 'rgba(255, 94, 54, 0.1)',
  onPrimary: '#FFFFFF',

  // Obsidian / Dark Hardware Elements (Buttons, High-Contrast Headers)
  obsidian: '#18191E',
  obsidianSoft: '#282A32',
  charcoal: '#111318',

  // Secondary & Tertiary Neutrals
  secondary: '#ECEEF2',
  tertiary: '#FFA133',

  // Semantic Status Tokens (Reference Pastel Micro-Pills)
  safeBg: '#EEFAF4',
  safeText: '#178754',
  success: '#178754',
  successSoft: '#EEFAF4',
  successDark: '#0E5C38',

  attentionBg: '#FFF7ED',
  attentionText: '#C2410C',
  warning: '#C2410C',
  warningSoft: '#FFF7ED',
  warningDark: '#9A3412',

  shortageBg: '#FEF2F2',
  shortageText: '#DC2626',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerDark: '#991B1B',

  categoryBg: '#FFF1ED',
  categoryText: '#E05A47',

  info: '#2563EB',
  infoSoft: '#EFF6FF',

  // Typography & Neutrals
  text: '#111318', // Primary high-contrast text
  textSecondary: '#717682', // Secondary metadata / subtitles
  textMuted: '#959BA7', // Captions, placeholders, subtle hints
  muted: '#717682',
  subtle: '#959BA7',
  black: '#111318',
  white: '#FFFFFF',
};

// Consistent Typography Hierarchy (DU Attend Neo-Tactile)
export const TYPOGRAPHY = {
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 38,
    color: APP_COLORS.text,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    lineHeight: 32,
    color: APP_COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 26,
    color: APP_COLORS.text,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
    color: APP_COLORS.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 21,
    color: APP_COLORS.text,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 21,
    color: APP_COLORS.text,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: APP_COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: APP_COLORS.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    color: APP_COLORS.text,
  },
  microPill: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
};

// Spacing, Rounded, and Shadow Scale
export const TOKENS = {
  spacing: {
    base: 16,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  rounded: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 24,
    card: 26,
    full: 9999,
  },
  shadows: {
    subtle: {
      shadowColor: '#101426',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    card: {
      shadowColor: '#101426',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#101426',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 26,
      elevation: 6,
    },
    tactileButton: {
      shadowColor: '#18191E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 4,
    },
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
