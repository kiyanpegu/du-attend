import { OTP_CONFIG } from '@/constants/duAttend';
import { SEED_IDS } from '@/constants/seedData';
import { cloudService } from '@/services/cloudService';
import { storageService } from '@/services/storageService';
import type {
    AttendanceFilter,
    AttendanceHistoryItem,
    AttendanceRecord,
    AttendanceRecordStatus,
    AttendanceSession,
    FacultySessionReport,
    LocalDatabase,
    OverallAttendanceSummary,
    ServiceResult,
    SessionStudentStatus,
    StudentDashboardData,
    Subject,
    SubjectAttendanceSummary,
} from '@/types/models';
import { calculatePercentage, createId, getAttendanceStanding, isWithinDateFilter } from '@/utils/format';
import * as Crypto from 'expo-crypto';

// In-memory rate limiting state for OTP brute-force protection
const otpAttemptsMap: Record<string, { count: number; firstAttemptAt: number; lockedUntil: number }> = {};
const MAX_OTP_ATTEMPTS = 5;
const OTP_ATTEMPT_WINDOW_MS = 60 * 1000;
const OTP_LOCKOUT_DURATION_MS = 30 * 1000;

function checkRateLimit(studentUserId: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = otpAttemptsMap[studentUserId];

  if (!entry) {
    return { allowed: true };
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (now - entry.firstAttemptAt > OTP_ATTEMPT_WINDOW_MS) {
    delete otpAttemptsMap[studentUserId];
    return { allowed: true };
  }

  if (entry.count >= MAX_OTP_ATTEMPTS) {
    entry.lockedUntil = now + OTP_LOCKOUT_DURATION_MS;
    const waitSeconds = Math.ceil(OTP_LOCKOUT_DURATION_MS / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(studentUserId: string): void {
  const now = Date.now();
  const entry = otpAttemptsMap[studentUserId];

  if (!entry || now - entry.firstAttemptAt > OTP_ATTEMPT_WINDOW_MS) {
    otpAttemptsMap[studentUserId] = {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    };
  } else {
    entry.count += 1;
    if (entry.count >= MAX_OTP_ATTEMPTS) {
      entry.lockedUntil = now + OTP_LOCKOUT_DURATION_MS;
    }
  }
}

function clearFailedAttempts(studentUserId: string): void {
  delete otpAttemptsMap[studentUserId];
}

export function generateOtp(): string {
  try {
    const randomArray = Crypto.getRandomValues(new Uint32Array(1));
    const randomNum = 100000 + (randomArray[0] % 900000);
    return randomNum.toString();
  } catch {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

function getSecondsRemaining(session: AttendanceSession) {
  return Math.max(0, Math.ceil((new Date(session.otpExpiresAt).getTime() - Date.now()) / 1000));
}

function getSubjectFacultyName(database: LocalDatabase, subjectId: string) {
  const assignment = database.facultyAssignments.find((item) => item.subjectId === subjectId && item.active);
  const faculty = database.faculties.find((item) => item.id === assignment?.facultyId);
  const user = database.users.find((item) => item.id === faculty?.userId);
  return {
    faculty,
    user,
    name: user?.name ?? 'Unassigned',
    facultyId: faculty?.facultyId ?? 'N/A',
  };
}

function getRoster(database: LocalDatabase, subjectId: string): SessionStudentStatus[] {
  const enrollments = database.enrollments.filter((item) => item.subjectId === subjectId && item.active);

  return enrollments
    .map((enrollment) => {
      const student = database.students.find((item) => item.id === enrollment.studentId && item.active);
      const user = database.users.find((item) => item.id === student?.userId && item.active);

      if (!student || !user) {
        return null;
      }

      const status: SessionStudentStatus = {
        student,
        user,
        record: null,
      };
      return status;
    })
    .filter((item): item is SessionStudentStatus => item !== null);
}

function buildSessionReport(database: LocalDatabase, session: AttendanceSession): FacultySessionReport | null {
  const subject = database.subjects.find((item) => item.id === session.subjectId);
  const faculty = database.faculties.find((item) => item.id === session.facultyId);
  const facultyUser = database.users.find((item) => item.id === faculty?.userId);

  if (!subject || !faculty || !facultyUser) {
    return null;
  }

  const records = database.attendanceRecords.filter((record) => record.sessionId === session.id);
  const roster = getRoster(database, session.subjectId).map((item) => ({
    ...item,
    record: records.find((record) => record.studentId === item.student.id) ?? null,
  }));
  const presentCount = roster.filter((item) => item.record?.status === 'present').length;
  const absentCount = roster.filter((item) => item.record?.status === 'absent').length;
  const unmarkedCount = Math.max(0, roster.length - presentCount - absentCount);

  return {
    session,
    subject,
    faculty,
    facultyUser,
    roster,
    presentCount,
    absentCount,
    unmarkedCount,
    enrolledCount: roster.length,
    secondsRemaining: getSecondsRemaining(session),
    otpExpired: getSecondsRemaining(session) <= 0,
  };
}

function getStudentConductedSessions(database: LocalDatabase, studentId: string, subjectId?: string) {
  const studentEnrollmentSubjectIds = database.enrollments
    .filter((item) => item.studentId === studentId && item.active)
    .map((item) => item.subjectId);

  return database.attendanceSessions.filter(
    (session) =>
      session.status === 'ended' &&
      studentEnrollmentSubjectIds.includes(session.subjectId) &&
      (!subjectId || session.subjectId === subjectId)
  );
}

function getRecordForStudent(database: LocalDatabase, sessionId: string, studentId: string) {
  return database.attendanceRecords.find(
    (record) => record.sessionId === sessionId && record.studentId === studentId
  );
}

function buildSubjectSummary(
  database: LocalDatabase,
  studentId: string,
  subject: Subject
): SubjectAttendanceSummary {
  const sessions = getStudentConductedSessions(database, studentId, subject.id);
  const attended = sessions.filter(
    (session) => getRecordForStudent(database, session.id, studentId)?.status === 'present'
  ).length;
  const conducted = sessions.length;
  const missed = Math.max(0, conducted - attended);
  const percentage = calculatePercentage(attended, conducted);
  const latestRecord = buildStudentHistory(database, studentId, { subjectId: subject.id })[0] ?? null;

  return {
    subject,
    facultyName: getSubjectFacultyName(database, subject.id).name,
    conducted,
    attended,
    missed,
    percentage,
    standing: getAttendanceStanding(percentage, conducted),
    latestRecord,
  };
}

function buildOverallSummary(subjects: SubjectAttendanceSummary[]): OverallAttendanceSummary {
  const conducted = subjects.reduce((sum, subject) => sum + subject.conducted, 0);
  const attended = subjects.reduce((sum, subject) => sum + subject.attended, 0);
  const missed = Math.max(0, conducted - attended);
  const percentage = calculatePercentage(attended, conducted);

  return {
    conducted,
    attended,
    missed,
    percentage,
    standing: getAttendanceStanding(percentage, conducted),
  };
}

function buildStudentHistory(
  database: LocalDatabase,
  studentId: string,
  filter: AttendanceFilter = {}
): AttendanceHistoryItem[] {
  const enrolledSubjectIds = database.enrollments
    .filter((item) => item.studentId === studentId && item.active)
    .map((item) => item.subjectId);

  const items: AttendanceHistoryItem[] = [];

  database.attendanceSessions.forEach((session) => {
    if (!enrolledSubjectIds.includes(session.subjectId)) {
      return;
    }

    if (filter.subjectId && session.subjectId !== filter.subjectId) {
      return;
    }

    if (session.status === 'active') {
      return;
    }

    if (filter.date && !isWithinDateFilter(session.startedAt, filter.date)) {
      return;
    }

    const subject = database.subjects.find((item) => item.id === session.subjectId);
    const facultyDetails = getSubjectFacultyName(database, session.subjectId);

    if (!subject) {
      return;
    }

    if (session.status === 'cancelled') {
      if (filter.status && filter.status !== 'all' && filter.status !== 'cancelled') {
        return;
      }

      items.push({
        sessionId: session.id,
        recordId: null,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        facultyName: facultyDetails.name,
        facultyId: facultyDetails.facultyId,
        date: session.cancelledAt ?? session.startedAt,
        status: 'cancelled',
        method: 'none',
        sessionStatus: session.status,
      });
      return;
    }

    const record = getRecordForStudent(database, session.id, studentId);
    const status = record?.status ?? 'absent';

    if (filter.status && filter.status !== 'all' && filter.status !== status) {
      return;
    }

    items.push({
      sessionId: session.id,
      recordId: record?.id ?? null,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      facultyName: facultyDetails.name,
      facultyId: facultyDetails.facultyId,
      date: record?.markedAt ?? session.endedAt ?? session.startedAt,
      status,
      method: record?.markedBy ?? 'manual',
      sessionStatus: session.status,
    });
  });

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const attendanceService = {
  getSecondsRemaining,

  async startClass(facultyUserId: string, subjectId: string): Promise<ServiceResult<AttendanceSession>> {
    let createdSession: AttendanceSession | null = null;
    let errorMessage: string | null = null;
    let existingSessionData: AttendanceSession | undefined = undefined;

    await storageService.updateDatabase((database) => {
      const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

      if (!faculty) {
        errorMessage = 'Faculty account not found.';
        return;
      }

      const subject = database.subjects.find((item) => item.id === subjectId && item.active);

      if (!subject) {
        errorMessage = 'Subject not found.';
        return;
      }

      const isAssigned = database.facultyAssignments.some(
        (item) => item.facultyId === faculty.id && item.subjectId === subjectId && item.active
      );

      if (!isAssigned) {
        errorMessage = 'You are not assigned to this subject.';
        return;
      }

      const existingActive = database.attendanceSessions.find(
        (session) => session.facultyId === faculty.id && session.status === 'active'
      );

      if (existingActive) {
        errorMessage = 'End or cancel the active class before starting another one.';
        existingSessionData = existingActive;
        return;
      }

      let otp = generateOtp();
      const activeOtps = new Set(
        database.attendanceSessions.filter((session) => session.status === 'active').map((session) => session.otp)
      );

      while (activeOtps.has(otp)) {
        otp = generateOtp();
      }

      const startedAtDate = new Date();
      createdSession = {
        id: createId('session'),
        subjectId,
        facultyId: faculty.id,
        startedAt: startedAtDate.toISOString(),
        endedAt: null,
        status: 'active',
        otp,
        otpExpiresAt: new Date(startedAtDate.getTime() + OTP_CONFIG.expiresInSeconds * 1000).toISOString(),
        cancelledAt: null,
      };

      database.attendanceSessions.push(createdSession);
    });

    if (errorMessage || !createdSession) {
      return {
        ok: false,
        message: errorMessage ?? 'Failed to start class session.',
        data: existingSessionData,
      };
    }

    if (cloudService.isOnline()) {
      await cloudService.createSession(createdSession);
    }

    return {
      ok: true,
      message: 'Attendance session started successfully.',
      data: createdSession,
    };
  },

  async regenerateOtp(facultyUserId: string, sessionId: string): Promise<ServiceResult<AttendanceSession>> {
    let updatedSession: AttendanceSession | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const session = database.attendanceSessions.find((item) => item.id === sessionId);
      const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

      if (!session) {
        errorMessage = 'Attendance session not found.';
        return;
      }

      if (!faculty || session.facultyId !== faculty.id) {
        errorMessage = 'You are not authorized for this session.';
        return;
      }

      if (session.status !== 'active') {
        errorMessage = `Session is ${session.status}.`;
        return;
      }

      let newOtp = generateOtp();
      const activeOtps = new Set(
        database.attendanceSessions
          .filter((s) => s.status === 'active' && s.id !== session.id)
          .map((s) => s.otp)
      );

      while (activeOtps.has(newOtp)) {
        newOtp = generateOtp();
      }

      const now = new Date();
      session.otp = newOtp;
      session.otpExpiresAt = new Date(now.getTime() + OTP_CONFIG.expiresInSeconds * 1000).toISOString();
      updatedSession = session;
    });

    const finalSession = updatedSession as AttendanceSession | null;
    if (errorMessage || !finalSession) {
      return { ok: false, message: errorMessage ?? 'Failed to regenerate OTP.' };
    }

    if (cloudService.isOnline()) {
      await cloudService.updateSession(finalSession.id, {
        otp: finalSession.otp,
        otpExpiresAt: finalSession.otpExpiresAt,
      });
    }

    return {
      ok: true,
      message: 'New OTP generated (valid for 60 seconds).',
      data: finalSession,
    };
  },

  async getActiveSessionForFaculty(facultyUserId: string) {
    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

    if (!faculty) {
      return null;
    }

    return (
      database.attendanceSessions.find((session) => session.facultyId === faculty.id && session.status === 'active') ?? null
    );
  },

  async getActiveSessionsForStudent(studentUserId: string) {
    if (cloudService.isOnline()) {
      try {
        const cloudSessions = await cloudService.getActiveSessions();
        if (cloudSessions.length > 0) {
          await storageService.updateDatabase((database) => {
            cloudSessions.forEach((cSession) => {
              const idx = database.attendanceSessions.findIndex((s) => s.id === cSession.id);
              if (idx >= 0) {
                database.attendanceSessions[idx] = cSession;
              } else {
                database.attendanceSessions.push(cSession);
              }
            });
          });
        }
      } catch {
        // Fallback to local
      }
    }

    const database = await storageService.getDatabase();
    const student = database.students.find((item) => item.userId === studentUserId && item.active);

    if (!student) {
      return [];
    }

    const subjectIds = database.enrollments
      .filter((item) => item.studentId === student.id && item.active)
      .map((item) => item.subjectId);

    return database.attendanceSessions.filter(
      (session) => session.status === 'active' && subjectIds.includes(session.subjectId)
    );
  },

  async submitOtp(studentUserId: string, otpInput: string): Promise<ServiceResult<AttendanceRecord>> {
    const rateCheck = checkRateLimit(studentUserId);
    if (!rateCheck.allowed) {
      return {
        ok: false,
        message: `Too many failed attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      };
    }

    const otp = otpInput.trim();
    if (!/^\d{6}$/.test(otp)) {
      return { ok: false, message: 'OTP must be exactly 6 digits.' };
    }

    if (cloudService.isOnline()) {
      try {
        const cloudSessions = await cloudService.getActiveSessions();
        if (cloudSessions.length > 0) {
          await storageService.updateDatabase((database) => {
            cloudSessions.forEach((cSession) => {
              const idx = database.attendanceSessions.findIndex((s) => s.id === cSession.id);
              if (idx >= 0) {
                database.attendanceSessions[idx] = cSession;
              } else {
                database.attendanceSessions.push(cSession);
              }
            });
          });
        }
      } catch {
        // Fallback to local
      }
    }

    let createdRecord: AttendanceRecord | null = null;
    let existingRecordFound: AttendanceRecord | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const student = database.students.find((item) => item.userId === studentUserId && item.active);

      if (!student) {
        errorMessage = 'Student account not found.';
        return;
      }

      const allMatchingSession = database.attendanceSessions.find((session) => session.otp === otp);
      const activeSessions = database.attendanceSessions.filter((session) => session.status === 'active');

      if (activeSessions.length === 0 && !allMatchingSession) {
        recordFailedAttempt(studentUserId);
        errorMessage = 'No active attendance session found.';
        return;
      }

      if (!allMatchingSession) {
        recordFailedAttempt(studentUserId);
        errorMessage = 'Invalid OTP. Please check the code.';
        return;
      }

      if (allMatchingSession.status === 'ended') {
        recordFailedAttempt(studentUserId);
        errorMessage = 'This attendance session has already ended.';
        return;
      }

      if (allMatchingSession.status === 'cancelled') {
        recordFailedAttempt(studentUserId);
        errorMessage = 'This attendance session was cancelled.';
        return;
      }

      if (getSecondsRemaining(allMatchingSession) <= 0) {
        recordFailedAttempt(studentUserId);
        errorMessage = 'OTP has expired. Ask your faculty to regenerate it.';
        return;
      }

      const isEnrolled = database.enrollments.some(
        (item) => item.studentId === student.id && item.subjectId === allMatchingSession.subjectId && item.active
      );

      if (!isEnrolled) {
        recordFailedAttempt(studentUserId);
        errorMessage = 'You are not enrolled in this subject.';
        return;
      }

      const existingRecord = database.attendanceRecords.find(
        (record) => record.sessionId === allMatchingSession.id && record.studentId === student.id
      );

      if (existingRecord) {
        existingRecordFound = existingRecord;
        errorMessage = 'Attendance already marked for this class session.';
        return;
      }

      createdRecord = {
        id: createId('record'),
        sessionId: allMatchingSession.id,
        studentId: student.id,
        status: 'present',
        markedAt: new Date().toISOString(),
        markedBy: 'otp',
        markedByUserId: studentUserId,
      };

      database.attendanceRecords.push(createdRecord);
    });

    if (errorMessage) {
      return {
        ok: false,
        message: errorMessage,
        data: existingRecordFound ?? undefined,
      };
    }

    if (!createdRecord) {
      return { ok: false, message: 'Failed to record attendance.' };
    }

    clearFailedAttempts(studentUserId);

    if (cloudService.isOnline() && createdRecord) {
      await cloudService.createAttendanceRecord(createdRecord);
    }

    return {
      ok: true,
      message: 'Attendance marked successfully.',
      data: createdRecord,
    };
  },

  async markManual(
    facultyUserId: string,
    sessionId: string,
    studentId: string,
    status: AttendanceRecordStatus
  ): Promise<ServiceResult<AttendanceRecord>> {
    let resultRecord: AttendanceRecord | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const session = database.attendanceSessions.find((item) => item.id === sessionId);
      const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

      if (!session) {
        errorMessage = 'Attendance session not found.';
        return;
      }

      if (!faculty || session.facultyId !== faculty.id) {
        errorMessage = 'You are not allowed to mark this session.';
        return;
      }

      if (session.status === 'cancelled') {
        errorMessage = 'Attendance session is cancelled.';
        return;
      }

      if (session.status === 'ended') {
        errorMessage = 'Attendance session has ended.';
        return;
      }

      const isEnrolled = database.enrollments.some(
        (item) => item.studentId === studentId && item.subjectId === session.subjectId && item.active
      );

      if (!isEnrolled) {
        errorMessage = 'Student is not enrolled in this subject.';
        return;
      }

      let record = database.attendanceRecords.find(
        (item) => item.sessionId === session.id && item.studentId === studentId
      );

      if (record) {
        record.status = status;
        record.markedAt = new Date().toISOString();
        record.markedBy = 'manual';
        record.markedByUserId = facultyUserId;
        resultRecord = record;
      } else {
        record = {
          id: createId('record'),
          sessionId: session.id,
          studentId,
          status,
          markedAt: new Date().toISOString(),
          markedBy: 'manual',
          markedByUserId: facultyUserId,
        };
        database.attendanceRecords.push(record);
        resultRecord = record;
      }
    });

    if (errorMessage || !resultRecord) {
      return { ok: false, message: errorMessage ?? 'Failed to mark attendance.' };
    }

    return { ok: true, message: `Marked ${status}.`, data: resultRecord };
  },

  async endClass(facultyUserId: string, sessionId: string): Promise<ServiceResult<AttendanceSession>> {
    let endedSession: AttendanceSession | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const session = database.attendanceSessions.find((item) => item.id === sessionId);
      const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

      if (!session) {
        errorMessage = 'Attendance session not found.';
        return;
      }

      if (!faculty || session.facultyId !== faculty.id) {
        errorMessage = 'You are not allowed to end this class.';
        return;
      }

      if (session.status !== 'active') {
        errorMessage = `Attendance session already ${session.status}.`;
        return;
      }

      const endedAt = new Date().toISOString();
      const roster = getRoster(database, session.subjectId);

      roster.forEach(({ student }) => {
        const existing = database.attendanceRecords.find(
          (record) => record.sessionId === session.id && record.studentId === student.id
        );

        if (!existing) {
          database.attendanceRecords.push({
            id: createId('record'),
            sessionId: session.id,
            studentId: student.id,
            status: 'absent',
            markedAt: endedAt,
            markedBy: 'manual',
            markedByUserId: facultyUserId,
          });
        }
      });

      session.status = 'ended';
      session.endedAt = endedAt;
      endedSession = session;
    });

    const finalEndedSession = endedSession as AttendanceSession | null;
    if (errorMessage || !finalEndedSession) {
      return { ok: false, message: errorMessage ?? 'Failed to end class.' };
    }

    if (finalEndedSession && cloudService.isOnline()) {
      await cloudService.updateSession(finalEndedSession.id, {
        status: 'ended',
        endedAt: finalEndedSession.endedAt,
      });
    }

    return { ok: true, message: 'Class ended and attendance finalized.', data: finalEndedSession };
  },

  async cancelClass(facultyUserId: string, sessionId: string): Promise<ServiceResult<AttendanceSession>> {
    let cancelledSession: AttendanceSession | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const session = database.attendanceSessions.find((item) => item.id === sessionId);
      const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

      if (!session) {
        errorMessage = 'Attendance session not found.';
        return;
      }

      if (!faculty || session.facultyId !== faculty.id) {
        errorMessage = 'You are not allowed to cancel this class.';
        return;
      }

      if (session.status !== 'active') {
        errorMessage = `Attendance session already ${session.status}.`;
        return;
      }

      session.status = 'cancelled';
      session.cancelledAt = new Date().toISOString();
      session.endedAt = session.cancelledAt;
      database.attendanceRecords = database.attendanceRecords.filter((record) => record.sessionId !== session.id);
      cancelledSession = session;
    });

    const finalCancelledSession = cancelledSession as AttendanceSession | null;
    if (errorMessage || !finalCancelledSession) {
      return { ok: false, message: errorMessage ?? 'Failed to cancel class.' };
    }

    if (finalCancelledSession && cloudService.isOnline()) {
      await cloudService.updateSession(finalCancelledSession.id, {
        status: 'cancelled',
        cancelledAt: finalCancelledSession.cancelledAt,
      });
    }

    return { ok: true, message: 'Class cancelled. Attendance will not count.', data: finalCancelledSession };
  },

  async getSessionReport(sessionId: string) {
    if (cloudService.isOnline()) {
      try {
        const cloudRecords = await cloudService.getSessionRecords(sessionId);
        if (cloudRecords.length > 0) {
          await storageService.updateDatabase((database) => {
            cloudRecords.forEach((cRecord) => {
              const idx = database.attendanceRecords.findIndex(
                (r) => r.sessionId === cRecord.sessionId && r.studentId === cRecord.studentId
              );
              if (idx >= 0) {
                database.attendanceRecords[idx] = cRecord;
              } else {
                database.attendanceRecords.push(cRecord);
              }
            });
          });
        }
      } catch {
        // Fallback to local
      }
    }

    const database = await storageService.getDatabase();
    const session = database.attendanceSessions.find((item) => item.id === sessionId);

    if (!session) {
      return null;
    }

    return buildSessionReport(database, session);
  },

  async getFacultySessionReports(facultyUserId: string) {
    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === facultyUserId && item.active);

    if (!faculty) {
      return [];
    }

    return database.attendanceSessions
      .filter((session) => session.facultyId === faculty.id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map((session) => buildSessionReport(database, session))
      .filter((report): report is FacultySessionReport => report !== null);
  },

  async getStudentDashboard(studentUserId: string): Promise<StudentDashboardData | null> {
    const database = await storageService.getDatabase();
    const user = database.users.find((item) => item.id === studentUserId && item.role === 'student' && item.active);
    const student = database.students.find((item) => item.userId === studentUserId && item.active);

    if (!user || !student) {
      return null;
    }

    const programme = database.programmes.find((item) => item.id === student.programmeId);
    const semester = database.semesters.find((item) => item.id === student.semesterId);

    if (!programme || !semester) {
      return null;
    }

    const subjectIds = database.enrollments
      .filter((item) => item.studentId === student.id && item.active)
      .map((item) => item.subjectId);
    const subjects = database.subjects
      .filter((subject) => subject.active && subjectIds.includes(subject.id))
      .map((subject) => buildSubjectSummary(database, student.id, subject));

    return {
      user,
      student,
      programme,
      semester,
      subjects,
      overall: buildOverallSummary(subjects),
      recent: buildStudentHistory(database, student.id).slice(0, 5),
    };
  },

  async getStudentHistory(studentUserId: string, filter: AttendanceFilter = {}) {
    const database = await storageService.getDatabase();
    const student = database.students.find((item) => item.userId === studentUserId && item.active);

    if (!student) {
      return [];
    }

    return buildStudentHistory(database, student.id, filter);
  },

  async getStudentSubjectSummaries(studentUserId: string) {
    const dashboard = await this.getStudentDashboard(studentUserId);
    return dashboard?.subjects ?? [];
  },

  async correctRecord(recordId: string, status: AttendanceRecordStatus, adminUserId = SEED_IDS.adminUser) {
    let updatedRecord: AttendanceRecord | null = null;
    let errorMessage: string | null = null;

    await storageService.updateDatabase((database) => {
      const record = database.attendanceRecords.find((item) => item.id === recordId);

      if (!record) {
        errorMessage = 'Attendance record not found.';
        return;
      }

      record.status = status;
      record.markedBy = 'manual';
      record.markedByUserId = adminUserId;
      record.markedAt = new Date().toISOString();
      updatedRecord = record;
    });

    if (errorMessage || !updatedRecord) {
      return { ok: false, message: errorMessage ?? 'Failed to update record.' };
    }

    return { ok: true, message: 'Attendance record updated.', data: updatedRecord };
  },
};
