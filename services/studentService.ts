import { attendanceService } from '@/services/attendanceService';
import { DEFAULT_TIMETABLE, scheduleService } from '@/services/scheduleService';
import { storageService } from '@/services/storageService';
import type { ClassScheduleItem, DayOfWeek } from '@/types/models';

export { DEFAULT_TIMETABLE };

export const studentService = {
  async getProfile(userId: string) {
    const database = await storageService.getDatabase();
    const user = database.users.find((item) => item.id === userId && item.role === 'student' && item.active);
    const student = database.students.find((item) => item.userId === userId && item.active);

    if (!user || !student) {
      return null;
    }

    const programme = database.programmes.find((item) => item.id === student.programmeId) ?? null;
    const semester = database.semesters.find((item) => item.id === student.semesterId) ?? null;
    const department = database.departments.find((item) => item.id === programme?.departmentId) ?? null;
    const university = database.universities.find((item) => item.id === department?.universityId) ?? null;

    return { user, student, programme, semester, department, university };
  },

  async getDashboard(userId: string) {
    return attendanceService.getStudentDashboard(userId);
  },

  async getSubjects(userId: string) {
    return attendanceService.getStudentSubjectSummaries(userId);
  },

  async getHistory(userId: string) {
    return attendanceService.getStudentHistory(userId);
  },

  async getSchedule(day?: DayOfWeek, userId?: string): Promise<ClassScheduleItem[]> {
    const targetDay = day ?? 'Monday';
    return scheduleService.getScheduleForDay(targetDay, userId, 'student');
  },

  async getTodaySchedule(userId?: string): Promise<{ day: DayOfWeek; items: ClassScheduleItem[]; isWeekend: boolean }> {
    return scheduleService.getTodaySchedule(userId, 'student');
  },
};
