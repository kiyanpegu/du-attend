import { SEED_IDS } from '@/constants/seedData';
import { attendanceService } from '@/services/attendanceService';
import { storageService } from '@/services/storageService';
import type { Faculty, Role, ServiceResult, Student, Subject, User } from '@/types/models';
import { createId, normalizeCredential } from '@/utils/format';

function now() {
  return new Date().toISOString();
}

function makeUser(role: Role, username: string, name: string, password: string): User {
  return {
    id: createId(`user-${role}`),
    role,
    name,
    username: normalizeCredential(username),
    active: true,
    developmentPassword: password,
    createdAt: now(),
    updatedAt: now(),
  };
}

export const adminService = {
  async getOverview() {
    const database = await storageService.getDatabase();
    const reports = await this.getReports();

    return {
      students: database.students.length,
      activeStudents: database.students.filter((item) => item.active).length,
      faculties: database.faculties.length,
      activeFaculties: database.faculties.filter((item) => item.active).length,
      departments: database.departments.length,
      programmes: database.programmes.length,
      semesters: database.semesters.length,
      subjects: database.subjects.length,
      sessions: database.attendanceSessions.length,
      records: database.attendanceRecords.length,
      reports,
    };
  },

  async getStudents() {
    const database = await storageService.getDatabase();

    return database.students.map((student) => ({
      student,
      user: database.users.find((user) => user.id === student.userId)!,
      programme: database.programmes.find((programme) => programme.id === student.programmeId) ?? null,
      semester: database.semesters.find((semester) => semester.id === student.semesterId) ?? null,
    }));
  },

  async addStudent(input: { studentId: string; name: string; password: string; programmeId?: string; semesterId?: string }) {
    const database = await storageService.getDatabase();
    const studentId = normalizeCredential(input.studentId);

    if (database.students.some((student) => student.studentId.toUpperCase() === studentId)) {
      return { ok: false, message: 'Student ID already exists.' };
    }

    const user = makeUser('student', studentId, input.name.trim() || studentId, input.password || 'student123');
    const student: Student = {
      id: createId('student'),
      userId: user.id,
      studentId,
      programmeId: input.programmeId || SEED_IDS.programme,
      semesterId: input.semesterId || SEED_IDS.semester,
      active: true,
    };

    database.users.push(user);
    database.students.push(student);

    database.subjects
      .filter((subject) => subject.programmeId === student.programmeId && subject.semesterId === student.semesterId)
      .forEach((subject) => {
        database.enrollments.push({
          id: createId('enrollment'),
          studentId: student.id,
          subjectId: subject.id,
          active: true,
        });
      });

    await storageService.saveDatabase(database);
    return { ok: true, message: 'Student added.', data: student };
  },

  async updateStudent(studentId: string, input: { name?: string; active?: boolean }) {
    const database = await storageService.getDatabase();
    const student = database.students.find((item) => item.id === studentId);
    const user = database.users.find((item) => item.id === student?.userId);

    if (!student || !user) {
      return { ok: false, message: 'Student not found.' };
    }

    if (input.name !== undefined) {
      user.name = input.name.trim() || user.name;
      user.updatedAt = now();
    }

    if (input.active !== undefined) {
      student.active = input.active;
      user.active = input.active;
      user.updatedAt = now();
    }

    await storageService.saveDatabase(database);
    return { ok: true, message: 'Student updated.', data: student };
  },

  async getFaculty() {
    const database = await storageService.getDatabase();

    return database.faculties.map((faculty) => ({
      faculty,
      user: database.users.find((user) => user.id === faculty.userId)!,
      subjects: database.facultyAssignments
        .filter((assignment) => assignment.facultyId === faculty.id && assignment.active)
        .map((assignment) => database.subjects.find((subject) => subject.id === assignment.subjectId))
        .filter((subject): subject is Subject => subject !== undefined),
    }));
  },

  async addFaculty(input: { facultyId: string; name: string; password: string }) {
    const database = await storageService.getDatabase();
    const facultyId = normalizeCredential(input.facultyId);

    if (database.faculties.some((faculty) => faculty.facultyId.toUpperCase() === facultyId)) {
      return { ok: false, message: 'Faculty ID already exists.' };
    }

    const user = makeUser('faculty', facultyId, input.name.trim() || facultyId, input.password || 'faculty123');
    const faculty: Faculty = {
      id: createId('faculty'),
      userId: user.id,
      facultyId,
      active: true,
    };

    database.users.push(user);
    database.faculties.push(faculty);
    await storageService.saveDatabase(database);
    return { ok: true, message: 'Faculty added.', data: faculty };
  },

  async updateFaculty(facultyId: string, input: { name?: string; active?: boolean }) {
    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.id === facultyId);
    const user = database.users.find((item) => item.id === faculty?.userId);

    if (!faculty || !user) {
      return { ok: false, message: 'Faculty not found.' };
    }

    if (input.name !== undefined) {
      user.name = input.name.trim() || user.name;
      user.updatedAt = now();
    }

    if (input.active !== undefined) {
      faculty.active = input.active;
      user.active = input.active;
      user.updatedAt = now();
    }

    await storageService.saveDatabase(database);
    return { ok: true, message: 'Faculty updated.', data: faculty };
  },

  async getAcademics() {
    const database = await storageService.getDatabase();
    return {
      universities: database.universities,
      departments: database.departments,
      programmes: database.programmes,
      semesters: database.semesters,
      subjects: database.subjects,
    };
  },

  async addDepartment(name: string) {
    const database = await storageService.getDatabase();
    database.departments.push({
      id: createId('department'),
      universityId: SEED_IDS.university,
      name: name.trim(),
    });
    await storageService.saveDatabase(database);
    return { ok: true, message: 'Department added.' };
  },

  async addProgramme(name: string, departmentId = SEED_IDS.department) {
    const database = await storageService.getDatabase();
    database.programmes.push({ id: createId('programme'), departmentId, name: name.trim() });
    await storageService.saveDatabase(database);
    return { ok: true, message: 'Programme added.' };
  },

  async addSemester(name: string, programmeId = SEED_IDS.programme) {
    const database = await storageService.getDatabase();
    database.semesters.push({ id: createId('semester'), programmeId, name: name.trim() });
    await storageService.saveDatabase(database);
    return { ok: true, message: 'Semester added.' };
  },

  async addSubject(input: { code: string; name: string; programmeId?: string; semesterId?: string }) {
    const database = await storageService.getDatabase();
    const subject: Subject = {
      id: createId('subject'),
      code: normalizeCredential(input.code),
      name: input.name.trim(),
      programmeId: input.programmeId || SEED_IDS.programme,
      semesterId: input.semesterId || SEED_IDS.semester,
      active: true,
    };
    database.subjects.push(subject);
    await storageService.saveDatabase(database);
    return { ok: true, message: 'Subject added.', data: subject };
  },

  async updateSubject(subjectId: string, input: { name?: string; code?: string; active?: boolean }) {
    const database = await storageService.getDatabase();
    const subject = database.subjects.find((item) => item.id === subjectId);

    if (!subject) {
      return { ok: false, message: 'Subject not found.' };
    }

    if (input.name !== undefined) {
      subject.name = input.name.trim() || subject.name;
    }

    if (input.code !== undefined) {
      subject.code = normalizeCredential(input.code);
    }

    if (input.active !== undefined) {
      subject.active = input.active;
    }

    await storageService.saveDatabase(database);
    return { ok: true, message: 'Subject updated.', data: subject };
  },

  async getAssignments() {
    const database = await storageService.getDatabase();
    return {
      students: await this.getStudents(),
      faculties: await this.getFaculty(),
      subjects: database.subjects,
      enrollments: database.enrollments,
      facultyAssignments: database.facultyAssignments,
    };
  },

  async setEnrollment(studentId: string, subjectId: string, active: boolean): Promise<ServiceResult> {
    const database = await storageService.getDatabase();
    let enrollment = database.enrollments.find((item) => item.studentId === studentId && item.subjectId === subjectId);

    if (enrollment) {
      enrollment.active = active;
    } else {
      database.enrollments.push({ id: createId('enrollment'), studentId, subjectId, active });
    }

    await storageService.saveDatabase(database);
    return { ok: true, message: active ? 'Student enrolled.' : 'Student removed from subject.' };
  },

  async setFacultyAssignment(facultyId: string, subjectId: string, active: boolean): Promise<ServiceResult> {
    const database = await storageService.getDatabase();
    let assignment = database.facultyAssignments.find(
      (item) => item.facultyId === facultyId && item.subjectId === subjectId
    );

    if (assignment) {
      assignment.active = active;
    } else {
      database.facultyAssignments.push({ id: createId('assignment'), facultyId, subjectId, active });
    }

    await storageService.saveDatabase(database);
    return { ok: true, message: active ? 'Faculty assigned.' : 'Faculty assignment removed.' };
  },

  async getAttendanceReports() {
    const database = await storageService.getDatabase();
    const reports = await Promise.all(
      database.attendanceSessions.map((session) => attendanceService.getSessionReport(session.id))
    );
    return reports.filter((report): report is NonNullable<typeof report> => report !== null);
  },

  async getReports() {
    const database = await storageService.getDatabase();
    const attendanceReports = await this.getAttendanceReports();
    const endedSessions = attendanceReports.filter((report) => report.session.status === 'ended');
    const totalConducted = endedSessions.reduce((sum, report) => sum + report.enrolledCount, 0);
    const totalPresent = endedSessions.reduce((sum, report) => sum + report.presentCount, 0);
    const totalAbsent = Math.max(0, totalConducted - totalPresent);

    return {
      totalConducted,
      totalPresent,
      totalAbsent,
      sessionsEnded: endedSessions.length,
      sessionsCancelled: attendanceReports.filter((report) => report.session.status === 'cancelled').length,
      activeSessions: database.attendanceSessions.filter((session) => session.status === 'active').length,
    };
  },
};
