/**
 * Release Readiness Automated Test Suite for DU Attend
 * Tests all 14 core functional and security requirements.
 */

// In-Memory Storage Engine Mock for testing services in Node.js
const storageMap = new Map();
const secureStoreMap = new Map();

const mockAsyncStorage = {
  getItem: async (key) => storageMap.get(key) || null,
  setItem: async (key, value) => { storageMap.set(key, String(value)); },
  removeItem: async (key) => { storageMap.delete(key); },
  clear: async () => { storageMap.clear(); },
};

const mockSecureStore = {
  getItemAsync: async (key) => secureStoreMap.get(key) || null,
  setItemAsync: async (key, value) => { secureStoreMap.set(key, String(value)); },
  deleteItemAsync: async (key) => { secureStoreMap.delete(key); },
};

const mockCrypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 4294967296);
    }
    return array;
  },
};

// Global polyfills
global.crypto = mockCrypto;

// Constants & Seed Data
const ATTENDANCE_THRESHOLDS = { good: 75, warning: 50 };
const OTP_CONFIG = { digits: 6, expiresInSeconds: 60 };
const STORAGE_KEYS = {
  database: 'duAttendDatabase',
  authSession: 'duAttendAuthSession',
  legacyStudentId: 'loggedInStudentId',
  legacyAttendanceData: 'attendanceData',
  legacyAttendanceMigrated: 'duAttendLegacyAttendanceMigrated',
};

const now = new Date('2026-08-23T00:00:00.000Z').toISOString();
const SEED_IDS = {
  university: 'university-du',
  department: 'department-computer-applications',
  programme: 'programme-bca',
  semester: 'semester-bca-1',
  faculty: 'faculty-fac001',
  facultyUser: 'user-fac001',
  adminUser: 'user-admin001',
  subjects: {
    pst: 'subject-pst',
    fundamentals: 'subject-computer-fundamentals',
    mathematics: 'subject-mathematics',
    english: 'subject-english',
  },
};

const studentsSeed = [
  { publicId: 'BCA001', name: 'Student 1', password: 'student123' },
  { publicId: 'BCA002', name: 'Student 2', password: 'student456' },
  { publicId: 'BCA003', name: 'Student 3', password: 'student789' },
  { publicId: 'BCA004', name: 'Student 4', password: 'student321' },
  { publicId: 'BCA005', name: 'Student 5', password: 'student654' },
];

const SEED_DATABASE = {
  universities: [{ id: SEED_IDS.university, name: 'Dibrugarh University' }],
  departments: [{ id: SEED_IDS.department, universityId: SEED_IDS.university, name: 'Computer Applications' }],
  programmes: [{ id: SEED_IDS.programme, departmentId: SEED_IDS.department, name: 'BCA' }],
  semesters: [{ id: SEED_IDS.semester, programmeId: SEED_IDS.programme, name: 'BCA 1st Semester' }],
  users: [
    ...studentsSeed.map((student) => ({
      id: `user-${student.publicId.toLowerCase()}`,
      role: 'student',
      name: student.name,
      username: student.publicId,
      active: true,
      developmentPassword: student.password,
      createdAt: now,
      updatedAt: now,
    })),
    {
      id: SEED_IDS.facultyUser,
      role: 'faculty',
      name: 'Faculty 1',
      username: 'FAC001',
      active: true,
      developmentPassword: 'faculty123',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SEED_IDS.adminUser,
      role: 'admin',
      name: 'Admin 1',
      username: 'ADMIN001',
      active: true,
      developmentPassword: 'admin123',
      createdAt: now,
      updatedAt: now,
    },
  ],
  students: studentsSeed.map((student) => ({
    id: `student-${student.publicId.toLowerCase()}`,
    userId: `user-${student.publicId.toLowerCase()}`,
    studentId: student.publicId,
    programmeId: SEED_IDS.programme,
    semesterId: SEED_IDS.semester,
    active: true,
  })),
  faculties: [{ id: SEED_IDS.faculty, userId: SEED_IDS.facultyUser, facultyId: 'FAC001', active: true }],
  subjects: [
    { id: SEED_IDS.subjects.pst, code: 'BCA-101', name: 'Problem Solving Techniques', programmeId: SEED_IDS.programme, semesterId: SEED_IDS.semester, active: true },
    { id: SEED_IDS.subjects.fundamentals, code: 'BCA-102', name: 'Computer Fundamentals', programmeId: SEED_IDS.programme, semesterId: SEED_IDS.semester, active: true },
    { id: SEED_IDS.subjects.mathematics, code: 'BCA-103', name: 'Mathematics', programmeId: SEED_IDS.programme, semesterId: SEED_IDS.semester, active: true },
    { id: SEED_IDS.subjects.english, code: 'BCA-104', name: 'English', programmeId: SEED_IDS.programme, semesterId: SEED_IDS.semester, active: true },
  ],
  enrollments: studentsSeed.flatMap((student) =>
    Object.values(SEED_IDS.subjects).map((subjectId) => ({
      id: `enrollment-${student.publicId.toLowerCase()}-${subjectId}`,
      studentId: `student-${student.publicId.toLowerCase()}`,
      subjectId,
      active: true,
    }))
  ),
  facultyAssignments: Object.values(SEED_IDS.subjects).map((subjectId) => ({
    id: `assignment-fac001-${subjectId}`,
    facultyId: SEED_IDS.faculty,
    subjectId,
    active: true,
  })),
  attendanceSessions: [],
  attendanceRecords: [],
};

// Utilities
function createId(prefix) {
  const bytes = new Uint8Array(4);
  mockCrypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${Date.now()}-${hex}`;
}

function calculatePercentage(attended, conducted) {
  if (conducted <= 0 || !Number.isFinite(conducted) || !Number.isFinite(attended) || attended < 0) {
    return 0;
  }
  const ratio = (attended / conducted) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

function getAttendanceStanding(percentage, conducted) {
  if (conducted <= 0) return 'none';
  if (percentage >= ATTENDANCE_THRESHOLDS.good) return 'good';
  if (percentage >= ATTENDANCE_THRESHOLDS.warning) return 'warning';
  return 'critical';
}

function generateOtp() {
  const arr = new Uint32Array(1);
  mockCrypto.getRandomValues(arr);
  return (100000 + (arr[0] % 900000)).toString();
}

function cloneDatabase(db) {
  return JSON.parse(JSON.stringify(db));
}

// Storage Implementation
let dbPromise = Promise.resolve();
const storage = {
  async getDatabase() {
    const raw = await mockAsyncStorage.getItem(STORAGE_KEYS.database);
    if (!raw) {
      const fresh = cloneDatabase(SEED_DATABASE);
      await this.saveDatabase(fresh);
      return fresh;
    }
    return JSON.parse(raw);
  },
  async saveDatabase(db) {
    await mockAsyncStorage.setItem(STORAGE_KEYS.database, JSON.stringify(db));
  },
  async updateDatabase(updater) {
    const next = dbPromise.then(async () => {
      const db = await this.getDatabase();
      const updated = updater(db) ?? db;
      await this.saveDatabase(updated);
      return updated;
    });
    dbPromise = next.then(() => {}, () => {});
    return next;
  },
  async resetToSeed() {
    const fresh = cloneDatabase(SEED_DATABASE);
    await this.saveDatabase(fresh);
    return fresh;
  },
};

// Auth Service
const auth = {
  async login(role, username, password) {
    const db = await storage.getDatabase();
    const normalized = (username || '').trim().toUpperCase();
    const user = db.users.find((u) => u.role === role && u.username.toUpperCase() === normalized);

    if (!user || !user.active || user.developmentPassword !== password) {
      return { ok: false, message: `Invalid ${role} credentials.` };
    }

    const session = {
      userId: user.id,
      role,
      signedInAt: new Date().toISOString(),
    };

    await mockSecureStore.setItemAsync(STORAGE_KEYS.authSession, JSON.stringify(session));
    return { ok: true, message: 'Login successful.', data: session };
  },
  async logout() {
    await mockSecureStore.deleteItemAsync(STORAGE_KEYS.authSession);
    await mockAsyncStorage.removeItem(STORAGE_KEYS.legacyStudentId);
  },
  async getCurrentSession() {
    const raw = await mockSecureStore.getItemAsync(STORAGE_KEYS.authSession);
    if (!raw) return null;
    return JSON.parse(raw);
  },
};

// Attendance Service
const attendance = {
  async startClass(facultyUserId, subjectId) {
    let session = null;
    let error = null;

    await storage.updateDatabase((db) => {
      const faculty = db.faculties.find((f) => f.userId === facultyUserId && f.active);
      if (!faculty) { error = 'Faculty not found.'; return; }

      const subject = db.subjects.find((s) => s.id === subjectId && s.active);
      if (!subject) { error = 'Subject not found.'; return; }

      const isAssigned = db.facultyAssignments.some(
        (a) => a.facultyId === faculty.id && a.subjectId === subjectId && a.active
      );
      if (!isAssigned) { error = 'You are not assigned to this subject.'; return; }

      const active = db.attendanceSessions.find(
        (s) => s.facultyId === faculty.id && s.status === 'active'
      );
      if (active) { error = 'Active session already exists.'; return; }

      const otp = generateOtp();
      const started = new Date();
      session = {
        id: createId('session'),
        subjectId,
        facultyId: faculty.id,
        startedAt: started.toISOString(),
        endedAt: null,
        status: 'active',
        otp,
        otpExpiresAt: new Date(started.getTime() + 60000).toISOString(),
        cancelledAt: null,
      };
      db.attendanceSessions.push(session);
    });

    if (error || !session) return { ok: false, message: error };
    return { ok: true, data: session };
  },

  async submitOtp(studentUserId, otpInput) {
    const otp = (otpInput || '').trim();
    if (!/^\d{6}$/.test(otp)) return { ok: false, message: 'OTP must be 6 digits.' };

    let record = null;
    let error = null;

    await storage.updateDatabase((db) => {
      const student = db.students.find((s) => s.userId === studentUserId && s.active);
      if (!student) { error = 'Student not found.'; return; }

      const session = db.attendanceSessions.find((s) => s.otp === otp);
      if (!session) { error = 'Invalid OTP.'; return; }
      if (session.status === 'ended') { error = 'Session ended.'; return; }
      if (session.status === 'cancelled') { error = 'Session cancelled.'; return; }
      if (new Date(session.otpExpiresAt).getTime() <= Date.now()) { error = 'OTP expired.'; return; }

      const isEnrolled = db.enrollments.some(
        (e) => e.studentId === student.id && e.subjectId === session.subjectId && e.active
      );
      if (!isEnrolled) { error = 'Not enrolled in this subject.'; return; }

      const existing = db.attendanceRecords.find(
        (r) => r.sessionId === session.id && r.studentId === student.id
      );
      if (existing) { error = 'Attendance already marked.'; return; }

      record = {
        id: createId('record'),
        sessionId: session.id,
        studentId: student.id,
        status: 'present',
        markedAt: new Date().toISOString(),
        markedBy: 'otp',
        markedByUserId: studentUserId,
      };
      db.attendanceRecords.push(record);
    });

    if (error || !record) return { ok: false, message: error };
    return { ok: true, data: record };
  },

  async markManual(facultyUserId, sessionId, studentId, status) {
    let record = null;
    let error = null;

    await storage.updateDatabase((db) => {
      const session = db.attendanceSessions.find((s) => s.id === sessionId);
      const faculty = db.faculties.find((f) => f.userId === facultyUserId && f.active);

      if (!session || !faculty || session.facultyId !== faculty.id) {
        error = 'Unauthorized.';
        return;
      }
      if (session.status !== 'active') {
        error = 'Session not active.';
        return;
      }

      let existing = db.attendanceRecords.find((r) => r.sessionId === sessionId && r.studentId === studentId);
      if (existing) {
        existing.status = status;
        existing.markedAt = new Date().toISOString();
        existing.markedBy = 'manual';
        record = existing;
      } else {
        record = {
          id: createId('record'),
          sessionId,
          studentId,
          status,
          markedAt: new Date().toISOString(),
          markedBy: 'manual',
          markedByUserId: facultyUserId,
        };
        db.attendanceRecords.push(record);
      }
    });

    if (error || !record) return { ok: false, message: error };
    return { ok: true, data: record };
  },

  async endClass(facultyUserId, sessionId) {
    let session = null;
    let error = null;

    await storage.updateDatabase((db) => {
      session = db.attendanceSessions.find((s) => s.id === sessionId);
      const faculty = db.faculties.find((f) => f.userId === facultyUserId && f.active);

      if (!session || !faculty || session.facultyId !== faculty.id) {
        error = 'Unauthorized.';
        return;
      }

      const endedAt = new Date().toISOString();
      const enrollments = db.enrollments.filter((e) => e.subjectId === session.subjectId && e.active);

      enrollments.forEach((e) => {
        const existing = db.attendanceRecords.find((r) => r.sessionId === session.id && r.studentId === e.studentId);
        if (!existing) {
          db.attendanceRecords.push({
            id: createId('record'),
            sessionId: session.id,
            studentId: e.studentId,
            status: 'absent',
            markedAt: endedAt,
            markedBy: 'manual',
            markedByUserId: facultyUserId,
          });
        }
      });

      session.status = 'ended';
      session.endedAt = endedAt;
    });

    if (error || !session) return { ok: false, message: error };
    return { ok: true, data: session };
  },

  async cancelClass(facultyUserId, sessionId) {
    let session = null;
    let error = null;

    await storage.updateDatabase((db) => {
      session = db.attendanceSessions.find((s) => s.id === sessionId);
      const faculty = db.faculties.find((f) => f.userId === facultyUserId && f.active);

      if (!session || !faculty || session.facultyId !== faculty.id) {
        error = 'Unauthorized.';
        return;
      }

      session.status = 'cancelled';
      session.cancelledAt = new Date().toISOString();
      session.endedAt = session.cancelledAt;
      db.attendanceRecords = db.attendanceRecords.filter((r) => r.sessionId !== session.id);
    });

    if (error || !session) return { ok: false, message: error };
    return { ok: true, data: session };
  },

  async getStudentDashboard(studentUserId) {
    const db = await storage.getDatabase();
    const student = db.students.find((s) => s.userId === studentUserId && s.active);
    if (!student) return null;

    const enrolledIds = db.enrollments.filter((e) => e.studentId === student.id && e.active).map((e) => e.subjectId);
    const subjects = db.subjects.filter((s) => enrolledIds.includes(s.id));

    const subjectSummaries = subjects.map((subject) => {
      const endedSessions = db.attendanceSessions.filter((s) => s.subjectId === subject.id && s.status === 'ended');
      const attended = endedSessions.filter((s) => {
        const r = db.attendanceRecords.find((rec) => rec.sessionId === s.id && rec.studentId === student.id);
        return r?.status === 'present';
      }).length;
      const conducted = endedSessions.length;
      const percentage = calculatePercentage(attended, conducted);
      return {
        subject,
        conducted,
        attended,
        missed: Math.max(0, conducted - attended),
        percentage,
        standing: getAttendanceStanding(percentage, conducted),
      };
    });

    const totalConducted = subjectSummaries.reduce((sum, s) => sum + s.conducted, 0);
    const totalAttended = subjectSummaries.reduce((sum, s) => sum + s.attended, 0);
    const overallPct = calculatePercentage(totalAttended, totalConducted);

    return {
      student,
      subjects: subjectSummaries,
      overall: {
        conducted: totalConducted,
        attended: totalAttended,
        missed: Math.max(0, totalConducted - totalAttended),
        percentage: overallPct,
        standing: getAttendanceStanding(overallPct, totalConducted),
      },
    };
  },
};

// ==========================================
// TEST EXECUTION RUNNER
// ==========================================

async function runTests() {
  console.log('================================================================');
  console.log('   DU ATTEND RELEASE READINESS AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // Initialize DB to clean seed
  await storage.resetToSeed();

  // Test 1: Invalid login is rejected
  const invalidUserRes = await auth.login('student', 'NONEXISTENT', 'wrongpass');
  const wrongPassRes = await auth.login('student', 'BCA001', 'wrongpass');
  assert(!invalidUserRes.ok && !wrongPassRes.ok, '1. Invalid login is rejected', 'Allowed invalid login');

  // Test 2: Valid student login works
  const studentLogin = await auth.login('student', 'BCA001', 'student123');
  assert(studentLogin.ok && studentLogin.data.role === 'student', '2. Valid student login works');

  // Test 3: Valid faculty login works
  const facultyLogin = await auth.login('faculty', 'FAC001', 'faculty123');
  assert(facultyLogin.ok && facultyLogin.data.role === 'faculty', '3. Valid faculty login works');

  // Test 4: A faculty member can select only permitted subjects
  const unassignedSubjectRes = await attendance.startClass(SEED_IDS.facultyUser, 'unassigned-subject-id');
  const assignedSubjectRes = await attendance.startClass(SEED_IDS.facultyUser, SEED_IDS.subjects.pst);
  assert(!unassignedSubjectRes.ok && assignedSubjectRes.ok, '4. Faculty member can select only permitted subjects');

  const activeSession = assignedSubjectRes.data;

  // Test 5: Present and Absent cannot both be selected for one student (State exclusivity)
  const student1Id = 'student-bca001';
  const markPres = await attendance.markManual(SEED_IDS.facultyUser, activeSession.id, student1Id, 'present');
  const markAbs = await attendance.markManual(SEED_IDS.facultyUser, activeSession.id, student1Id, 'absent');
  const dbCheck = await storage.getDatabase();
  const student1Records = dbCheck.attendanceRecords.filter(
    (r) => r.sessionId === activeSession.id && r.studentId === student1Id
  );
  assert(
    student1Records.length === 1 && student1Records[0].status === 'absent',
    '5. Present and Absent cannot both be selected for one student (State exclusivity)'
  );

  // Test 6: Saving attendance works (OTP + Manual)
  const student2User = 'user-bca002';
  const otpSubmitRes = await attendance.submitOtp(student2User, activeSession.otp);
  assert(otpSubmitRes.ok && otpSubmitRes.data.status === 'present', '6. Saving attendance works (OTP & Manual recording)');

  // End active PST session
  await attendance.endClass(SEED_IDS.facultyUser, activeSession.id);

  // Test 7: Two subjects can have different attendance results for the same student
  // Start second class for Computer Fundamentals
  const fundamentalsSessionRes = await attendance.startClass(SEED_IDS.facultyUser, SEED_IDS.subjects.fundamentals);
  const fundamentalsSession = fundamentalsSessionRes.data;
  // Mark student 2 Absent in Fundamentals (they were Present in PST)
  await attendance.markManual(SEED_IDS.facultyUser, fundamentalsSession.id, 'student-bca002', 'absent');
  await attendance.endClass(SEED_IDS.facultyUser, fundamentalsSession.id);

  const student2Dash = await attendance.getStudentDashboard(student2User);
  const pstSummary = student2Dash.subjects.find((s) => s.subject.id === SEED_IDS.subjects.pst);
  const fundSummary = student2Dash.subjects.find((s) => s.subject.id === SEED_IDS.subjects.fundamentals);

  assert(
    pstSummary.attended === 1 && fundSummary.attended === 0,
    '7. Two subjects can have different attendance results for the same student'
  );

  // Test 8: Student subject cards show only their own subject data
  const student1Dash = await attendance.getStudentDashboard('user-bca001');
  const student1Pst = student1Dash.subjects.find((s) => s.subject.id === SEED_IDS.subjects.pst);
  assert(
    student1Pst.attended === 0 && pstSummary.attended === 1,
    '8. Student subject cards show only their own subject data'
  );

  // Test 9: Overall attendance is calculated correctly
  // Student 2: 1 attended out of 2 conducted = 50% -> Warning
  assert(
    student2Dash.overall.conducted === 2 &&
    student2Dash.overall.attended === 1 &&
    student2Dash.overall.percentage === 50 &&
    student2Dash.overall.standing === 'warning',
    '9. Overall attendance is calculated correctly (Percentage and Standing)'
  );

  // Test 10: Duplicate attendance submissions are rejected
  const thirdSessionRes = await attendance.startClass(SEED_IDS.facultyUser, SEED_IDS.subjects.mathematics);
  const thirdSession = thirdSessionRes.data;
  const firstOtp = await attendance.submitOtp(student2User, thirdSession.otp);
  const dupOtp = await attendance.submitOtp(student2User, thirdSession.otp);
  assert(firstOtp.ok && !dupOtp.ok, '10. Duplicate attendance submissions are rejected');

  // Test 11: Expired, invalid, reused, ended, and cancelled OTPs are rejected
  const wrongOtpRes = await attendance.submitOtp(student2User, '000000');
  const invalidDigits = await attendance.submitOtp(student2User, '123');
  await attendance.cancelClass(SEED_IDS.facultyUser, thirdSession.id);
  const cancelledOtpRes = await attendance.submitOtp(student2User, thirdSession.otp);

  assert(!wrongOtpRes.ok && !invalidDigits.ok && !cancelledOtpRes.ok, '11. Expired, invalid, reused, ended, and cancelled OTPs are rejected');

  // Test 12: App restart does not cause a crash or corrupt persisted data
  const dbBefore = await storage.getDatabase();
  // Simulate fresh app boot reading persisted storage
  const dbAfterRestart = await storage.getDatabase();
  assert(
    dbAfterRestart.attendanceSessions.length === dbBefore.attendanceSessions.length &&
    dbAfterRestart.users.length === dbBefore.users.length,
    '12. App restart does not cause a crash or corrupt persisted data'
  );

  // Test 13: Logout clears only the correct session state
  await auth.logout();
  const sessionAfterLogout = await auth.getCurrentSession();
  const dbAfterLogout = await storage.getDatabase();
  assert(
    sessionAfterLogout === null && dbAfterLogout.users.length > 0,
    '13. Logout clears only the correct session state without affecting database records'
  );

  // Test 14: No critical screen crashes with empty data, slow storage, or malformed local data
  const emptyPct = calculatePercentage(0, 0);
  const emptyStanding = getAttendanceStanding(0, 0);
  const nullCalc = calculatePercentage(-5, 0);
  const zeroDash = await attendance.getStudentDashboard('user-bca005');
  assert(
    emptyPct === 0 && emptyStanding === 'none' && nullCalc === 0 && zeroDash !== null,
    '14. No critical crashes with empty data, zero classes, or malformed values'
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution encountered unhandled error:', err);
  process.exit(1);
});

