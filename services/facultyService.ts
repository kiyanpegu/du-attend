import { attendanceService } from '@/services/attendanceService';
import { storageService } from '@/services/storageService';
import type { FacultyDashboardData } from '@/types/models';

export const facultyService = {
  async getProfile(userId: string) {
    const database = await storageService.getDatabase();
    const user = database.users.find((item) => item.id === userId && item.role === 'faculty' && item.active);
    const faculty = database.faculties.find((item) => item.userId === userId && item.active);

    if (!user || !faculty) {
      return null;
    }

    return { user, faculty };
  },

  async getAssignedSubjects(userId: string) {
    const database = await storageService.getDatabase();
    const faculty = database.faculties.find((item) => item.userId === userId && item.active);

    if (!faculty) {
      return [];
    }

    const subjectIds = database.facultyAssignments
      .filter((item) => item.facultyId === faculty.id && item.active)
      .map((item) => item.subjectId);

    return database.subjects.filter((subject) => subject.active && subjectIds.includes(subject.id));
  },

  async getRosterForSubject(subjectId: string) {
    const database = await storageService.getDatabase();
    const enrollments = database.enrollments.filter((item) => item.subjectId === subjectId && item.active);

    return enrollments
      .map((enrollment) => {
        const student = database.students.find((item) => item.id === enrollment.studentId && item.active);
        const user = database.users.find((item) => item.id === student?.userId && item.active);

        if (!student || !user) {
          return null;
        }

        return { student, user };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  },

  async getDashboard(userId: string): Promise<FacultyDashboardData | null> {
    const profile = await this.getProfile(userId);

    if (!profile) {
      return null;
    }

    const assignedSubjects = await this.getAssignedSubjects(userId);
    const activeSession = await attendanceService.getActiveSessionForFaculty(userId);
    const recentSessions = (await attendanceService.getFacultySessionReports(userId)).slice(0, 5);

    return {
      user: profile.user,
      faculty: profile.faculty,
      assignedSubjects,
      activeSession,
      recentSessions,
    };
  },
};
