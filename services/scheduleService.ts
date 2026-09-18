import { attendanceService } from '@/services/attendanceService';
import { cloudService } from '@/services/cloudService';
import { storageService } from '@/services/storageService';
import type { ClassScheduleItem, DayOfWeek, ScheduleOverride, ServiceResult } from '@/types/models';
import { createId } from '@/utils/format';

export const DEFAULT_TIMETABLE: ClassScheduleItem[] = [
  // --- Monday ---
  { id: 'tt-mon-1', dayOfWeek: 'Monday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-mon-2', dayOfWeek: 'Monday', timeSlot: '10:30 AM - 11:30 AM', startTime: '10:30', endTime: '11:30', subjectId: 'subject-evs', subjectCode: 'BCA-105', subjectName: 'Environmental Studies', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-mon-3', dayOfWeek: 'Monday', timeSlot: '11:30 AM - 12:30 PM', startTime: '11:30', endTime: '12:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematical Foundation (MFCS-1)', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-mon-4', dayOfWeek: 'Monday', timeSlot: '01:30 PM - 02:30 PM', startTime: '13:30', endTime: '14:30', subjectId: 'subject-iks-bca1', subjectCode: 'BCA-106', subjectName: 'Indian Knowledge System', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-mon-5', dayOfWeek: 'Monday', timeSlot: '02:30 PM - 03:30 PM', startTime: '14:30', endTime: '15:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals & Applications', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-mon-6', dayOfWeek: 'Monday', timeSlot: '03:30 PM - 04:30 PM', startTime: '15:30', endTime: '16:30', subjectId: 'subject-audit-1', subjectCode: 'BCA-107', subjectName: 'Audit Course - I (Tutorial)', room: 'CS-201', facultyName: 'Course Instructor' },

  // --- Tuesday ---
  { id: 'tt-tue-1', dayOfWeek: 'Tuesday', timeSlot: '10:30 AM - 11:30 AM', startTime: '10:30', endTime: '11:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-tue-2', dayOfWeek: 'Tuesday', timeSlot: '11:30 AM - 12:30 PM', startTime: '11:30', endTime: '12:30', subjectId: 'subject-english', subjectCode: 'BCA-104', subjectName: 'English Communication', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-tue-3', dayOfWeek: 'Tuesday', timeSlot: '01:30 PM - 03:30 PM', startTime: '13:30', endTime: '15:30', subjectId: 'subject-cfa-lab', subjectCode: 'BCA-102L', subjectName: 'CFA Laboratory', room: 'Lab III', facultyName: 'Course Instructor' },

  // --- Wednesday ---
  { id: 'tt-wed-1', dayOfWeek: 'Wednesday', timeSlot: '10:30 AM - 12:30 PM', startTime: '10:30', endTime: '12:30', subjectId: 'subject-cfa-lab', subjectCode: 'BCA-102L', subjectName: 'CFA Laboratory', room: 'Lab III', facultyName: 'Course Instructor' },
  { id: 'tt-wed-2', dayOfWeek: 'Wednesday', timeSlot: '01:30 PM - 02:30 PM', startTime: '13:30', endTime: '14:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-wed-3', dayOfWeek: 'Wednesday', timeSlot: '02:30 PM - 03:30 PM', startTime: '14:30', endTime: '15:30', subjectId: 'subject-audit-1', subjectCode: 'BCA-107', subjectName: 'Audit Course - I', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-wed-4', dayOfWeek: 'Wednesday', timeSlot: '03:30 PM - 04:30 PM', startTime: '15:30', endTime: '16:30', subjectId: 'subject-evs', subjectCode: 'BCA-105', subjectName: 'Environmental Studies', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-wed-5', dayOfWeek: 'Wednesday', timeSlot: '04:30 PM - 05:30 PM', startTime: '16:30', endTime: '17:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'MFCS-1 (Tutorial)', room: 'CS-201', facultyName: 'Course Instructor' },

  // --- Thursday ---
  { id: 'tt-thu-1', dayOfWeek: 'Thursday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals & Applications', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-thu-2', dayOfWeek: 'Thursday', timeSlot: '10:30 AM - 12:30 PM', startTime: '10:30', endTime: '12:30', subjectId: 'subject-pst-lab', subjectCode: 'BCA-101L', subjectName: 'PST Laboratory', room: 'Lab III', facultyName: 'Course Instructor' },
  { id: 'tt-thu-3', dayOfWeek: 'Thursday', timeSlot: '01:30 PM - 02:30 PM', startTime: '13:30', endTime: '14:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematical Foundation (MFCS-1)', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-thu-4', dayOfWeek: 'Thursday', timeSlot: '02:30 PM - 03:30 PM', startTime: '14:30', endTime: '15:30', subjectId: 'subject-iks-bca1', subjectCode: 'BCA-106', subjectName: 'Indian Knowledge System', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-thu-5', dayOfWeek: 'Thursday', timeSlot: '03:30 PM - 04:30 PM', startTime: '15:30', endTime: '16:30', subjectId: 'subject-english', subjectCode: 'BCA-104', subjectName: 'English Communication (Tutorial)', room: 'CS-201', facultyName: 'Course Instructor' },

  // --- Friday ---
  { id: 'tt-fri-1', dayOfWeek: 'Friday', timeSlot: '10:30 AM - 12:30 PM', startTime: '10:30', endTime: '12:30', subjectId: 'subject-pst-lab', subjectCode: 'BCA-101L', subjectName: 'PST Laboratory', room: 'Lab III', facultyName: 'Course Instructor' },
  { id: 'tt-fri-2', dayOfWeek: 'Friday', timeSlot: '01:30 PM - 02:30 PM', startTime: '13:30', endTime: '14:30', subjectId: 'subject-audit-1', subjectCode: 'BCA-107', subjectName: 'Audit Course - I', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-fri-3', dayOfWeek: 'Friday', timeSlot: '02:30 PM - 03:30 PM', startTime: '14:30', endTime: '15:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals & Applications', room: 'CS-201', facultyName: 'Course Instructor' },
  { id: 'tt-fri-4', dayOfWeek: 'Friday', timeSlot: '03:30 PM - 04:30 PM', startTime: '15:30', endTime: '16:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematical Foundation (MFCS-1)', room: 'CS-201', facultyName: 'Course Instructor' },
];

export const CANCELLATION_REASONS = [
  'Faculty Official University Duty',
  'Faculty Medical Leave',
  'Departmental Seminar / Conference',
  'University Examination Duty',
  'Administrative Meeting',
  'Public Holiday / Campus Closure',
];

export const RESCHEDULE_TIME_SLOTS = [
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:45 AM - 11:45 AM',
  '12:00 PM - 01:00 PM',
  '12:30 PM - 01:30 PM',
  '02:00 PM - 03:00 PM',
  '03:15 PM - 04:15 PM',
  '04:30 PM - 05:30 PM',
];

export const scheduleService = {
  /**
   * Cancel a scheduled class with an optional reason
   */
  async cancelClass(
    facultyUserId: string,
    timetableItemId: string,
    reason?: string
  ): Promise<ServiceResult<ScheduleOverride>> {
    const baseItem = DEFAULT_TIMETABLE.find((item) => item.id === timetableItemId);
    if (!baseItem) {
      return { ok: false, message: 'Class schedule item not found.' };
    }

    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);
    const user = database.users.find((item) => item.id === facultyUserId && item.active);

    if (!faculty || !user) {
      return { ok: false, message: 'Faculty profile not found or unauthorized.' };
    }

    const isAssigned = database.facultyAssignments.some(
      (fa) => fa.facultyId === faculty.id && fa.subjectId === baseItem.subjectId && fa.active
    );

    if (!isAssigned && user.role !== 'admin') {
      return { ok: false, message: 'You are not assigned to teach this course.' };
    }

    let createdOverride: ScheduleOverride | null = null;

    await storageService.updateDatabase((db) => {
      // Deactivate any existing active override for this timetable item
      db.scheduleOverrides.forEach((o) => {
        if (o.timetableItemId === timetableItemId && o.active) {
          o.active = false;
        }
      });

      createdOverride = {
        id: createId('override'),
        timetableItemId,
        subjectId: baseItem.subjectId,
        facultyId: faculty.id,
        facultyUserId,
        facultyName: user.name,
        action: 'cancelled',
        reason: reason?.trim() || 'Faculty on official duty',
        originalDay: baseItem.dayOfWeek,
        originalTimeSlot: baseItem.timeSlot,
        createdAt: new Date().toISOString(),
        active: true,
      };

      db.scheduleOverrides.push(createdOverride);
    });

    if (!createdOverride) {
      return { ok: false, message: 'Failed to record class cancellation.' };
    }

    // Sync with cloud if online
    if (cloudService.isOnline()) {
      await cloudService.createScheduleOverride(createdOverride);
    }

    return {
      ok: true,
      message: `${baseItem.subjectName} has been marked cancelled. Students have been notified.`,
      data: createdOverride,
    };
  },

  /**
   * Reschedule a class to another day, time slot, or room
   */
  async rescheduleClass(
    facultyUserId: string,
    timetableItemId: string,
    newDayOfWeek: DayOfWeek,
    newTimeSlot: string,
    newRoom?: string,
    reason?: string
  ): Promise<ServiceResult<ScheduleOverride>> {
    const baseItem = DEFAULT_TIMETABLE.find((item) => item.id === timetableItemId);
    if (!baseItem) {
      return { ok: false, message: 'Class schedule item not found.' };
    }

    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);
    const user = database.users.find((item) => item.id === facultyUserId && item.active);

    if (!faculty || !user) {
      return { ok: false, message: 'Faculty profile not found or unauthorized.' };
    }

    const isAssigned = database.facultyAssignments.some(
      (fa) => fa.facultyId === faculty.id && fa.subjectId === baseItem.subjectId && fa.active
    );

    if (!isAssigned && user.role !== 'admin') {
      return { ok: false, message: 'You are not assigned to teach this course.' };
    }

    let createdOverride: ScheduleOverride | null = null;

    await storageService.updateDatabase((db) => {
      // Deactivate any existing active override for this item
      db.scheduleOverrides.forEach((o) => {
        if (o.timetableItemId === timetableItemId && o.active) {
          o.active = false;
        }
      });

      createdOverride = {
        id: createId('override'),
        timetableItemId,
        subjectId: baseItem.subjectId,
        facultyId: faculty.id,
        facultyUserId,
        facultyName: user.name,
        action: 'rescheduled',
        reason: reason?.trim(),
        originalDay: baseItem.dayOfWeek,
        originalTimeSlot: baseItem.timeSlot,
        newDayOfWeek,
        newTimeSlot,
        newRoom: newRoom?.trim() || baseItem.room,
        createdAt: new Date().toISOString(),
        active: true,
      };

      db.scheduleOverrides.push(createdOverride);
    });

    if (!createdOverride) {
      return { ok: false, message: 'Failed to reschedule class.' };
    }

    // Sync with cloud if online
    if (cloudService.isOnline()) {
      await cloudService.createScheduleOverride(createdOverride);
    }

    return {
      ok: true,
      message: `${baseItem.subjectName} rescheduled to ${newDayOfWeek} (${newTimeSlot}).`,
      data: createdOverride,
    };
  },

  /**
   * Restore a previously cancelled or rescheduled class back to regular timetable
   */
  async restoreClass(
    facultyUserId: string,
    overrideId: string
  ): Promise<ServiceResult<undefined>> {
    const database = await storageService.getDatabase();
    const override = database.scheduleOverrides.find((o) => o.id === overrideId && o.active);

    if (!override) {
      return { ok: false, message: 'Active schedule override not found.' };
    }

    await storageService.updateDatabase((db) => {
      const target = db.scheduleOverrides.find((o) => o.id === overrideId);
      if (target) {
        target.active = false;
      }
    });

    if (cloudService.isOnline()) {
      await cloudService.deactivateScheduleOverride(overrideId);
    }

    return {
      ok: true,
      message: 'Class restored to regular academic schedule.',
    };
  },

  /**
   * Get resolved schedule for a specific day including overrides
   */
  async getScheduleForDay(
    day: DayOfWeek,
    userId?: string,
    role?: 'student' | 'faculty' | 'admin'
  ): Promise<ClassScheduleItem[]> {
    // Cloud sync check
    if (cloudService.isOnline()) {
      try {
        const cloudOverrides = await cloudService.getActiveScheduleOverrides();
        if (cloudOverrides.length > 0) {
          await storageService.updateDatabase((db) => {
            cloudOverrides.forEach((cOverride) => {
              const idx = db.scheduleOverrides.findIndex((o) => o.id === cOverride.id);
              if (idx >= 0) {
                db.scheduleOverrides[idx] = cOverride;
              } else {
                db.scheduleOverrides.push(cOverride);
              }
            });
          });
        }
      } catch {
        // Fallback to local
      }
    }

    const database = await storageService.getDatabase();
    const activeOverrides = database.scheduleOverrides.filter((o) => o.active);

    // Filter base timetable items for the requested day
    const dayBaseItems = DEFAULT_TIMETABLE.filter((item) => item.dayOfWeek === day);

    // Fetch live attendance sessions if student or faculty userId provided
    let liveSubjectIds = new Set<string>();
    if (userId && role === 'student') {
      const activeSessions = await attendanceService.getActiveSessionsForStudent(userId);
      liveSubjectIds = new Set(activeSessions.map((s) => s.subjectId));
    } else if (userId && role === 'faculty') {
      const facultyActive = await attendanceService.getActiveSessionForFaculty(userId);
      if (facultyActive) {
        liveSubjectIds = new Set([facultyActive.subjectId]);
      }
    }

    const resolvedItems: ClassScheduleItem[] = [];

    // 1. Process regular classes on this day
    dayBaseItems.forEach((item) => {
      const override = activeOverrides.find((o) => o.timetableItemId === item.id);

      if (!override) {
        // Normal regular class
        resolvedItems.push({
          ...item,
          status: liveSubjectIds.has(item.subjectId) ? 'live' : 'upcoming',
        });
      } else if (override.action === 'cancelled') {
        // Cancelled class
        resolvedItems.push({
          ...item,
          status: 'cancelled',
          cancellationReason: override.reason,
          overrideId: override.id,
        });
      } else if (override.action === 'rescheduled') {
        // Rescheduled away from this day
        resolvedItems.push({
          ...item,
          status: 'rescheduled',
          overrideId: override.id,
          rescheduledTo: {
            dayOfWeek: override.newDayOfWeek || item.dayOfWeek,
            timeSlot: override.newTimeSlot || item.timeSlot,
            room: override.newRoom || item.room,
            reason: override.reason,
          },
        });
      }
    });

    // 2. Insert any classes that were rescheduled INTO this day from other days
    const incomingOverrides = activeOverrides.filter(
      (o) => o.action === 'rescheduled' && o.newDayOfWeek === day && o.originalDay !== day
    );

    incomingOverrides.forEach((override) => {
      const originalBase = DEFAULT_TIMETABLE.find((t) => t.id === override.timetableItemId);
      if (originalBase) {
        const timeSlot = override.newTimeSlot || originalBase.timeSlot;
        const [startTime = originalBase.startTime, endTime = originalBase.endTime] = timeSlot
          .split(' - ')
          .map((s) => s.trim());

        resolvedItems.push({
          id: `${originalBase.id}-rescheduled-${override.id}`,
          dayOfWeek: day,
          timeSlot,
          startTime,
          endTime,
          subjectId: originalBase.subjectId,
          subjectCode: originalBase.subjectCode,
          subjectName: originalBase.subjectName,
          room: override.newRoom || originalBase.room,
          facultyName: override.facultyName || originalBase.facultyName,
          status: liveSubjectIds.has(originalBase.subjectId) ? 'live' : 'upcoming',
          overrideId: override.id,
          rescheduledFrom: {
            dayOfWeek: override.originalDay,
            timeSlot: override.originalTimeSlot,
            originalRoom: originalBase.room,
          },
        });
      }
    });

    // Sort by startTime
    return resolvedItems.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  /**
   * Get teaching schedule for a specific faculty member
   */
  async getFacultySchedule(
    facultyUserId: string,
    day?: DayOfWeek
  ): Promise<ClassScheduleItem[]> {
    const targetDay = day ?? 'Monday';
    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

    if (!faculty) {
      return [];
    }

    const assignedSubjectIds = new Set(
      database.facultyAssignments
        .filter((fa) => fa.facultyId === faculty.id && fa.active)
        .map((fa) => fa.subjectId)
    );

    const allDayItems = await this.getScheduleForDay(targetDay, facultyUserId, 'faculty');
    return allDayItems.filter((item) => assignedSubjectIds.has(item.subjectId));
  },

  /**
   * Get today's schedule for faculty or student
   */
  async getTodaySchedule(
    userId?: string,
    role: 'student' | 'faculty' = 'student'
  ): Promise<{ day: DayOfWeek; items: ClassScheduleItem[]; isWeekend: boolean }> {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayIndex = new Date().getDay(); // 0: Sun, 1: Mon... 6: Sat
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const todayName = isWeekend ? 'Monday' : days[dayIndex - 1];

    const items = role === 'faculty' && userId
      ? await this.getFacultySchedule(userId, todayName)
      : await this.getScheduleForDay(todayName, userId, 'student');

    return {
      day: todayName,
      items,
      isWeekend,
    };
  },
};

