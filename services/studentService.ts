import { attendanceService } from '@/services/attendanceService';
import { storageService } from '@/services/storageService';
import type { ClassScheduleItem, DayOfWeek } from '@/types/models';

const DEFAULT_TIMETABLE: ClassScheduleItem[] = [
  // Monday
  { id: 'tt-mon-1', dayOfWeek: 'Monday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-mon-2', dayOfWeek: 'Monday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals', room: 'Lab-1', facultyName: 'Faculty 1' },
  { id: 'tt-mon-3', dayOfWeek: 'Monday', timeSlot: '12:30 PM - 01:30 PM', startTime: '12:30', endTime: '13:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematics', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-mon-4', dayOfWeek: 'Monday', timeSlot: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00', subjectId: 'subject-english', subjectCode: 'BCA-104', subjectName: 'English Communication', room: 'CS-102', facultyName: 'Faculty 1' },
  // Tuesday
  { id: 'tt-tue-1', dayOfWeek: 'Tuesday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals', room: 'Lab-1', facultyName: 'Faculty 1' },
  { id: 'tt-tue-2', dayOfWeek: 'Tuesday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-tue-3', dayOfWeek: 'Tuesday', timeSlot: '12:30 PM - 01:30 PM', startTime: '12:30', endTime: '13:30', subjectId: 'subject-english', subjectCode: 'BCA-104', subjectName: 'English Communication', room: 'CS-102', facultyName: 'Faculty 1' },
  { id: 'tt-tue-4', dayOfWeek: 'Tuesday', timeSlot: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematics', room: 'CS-201', facultyName: 'Faculty 1' },
  // Wednesday
  { id: 'tt-wed-1', dayOfWeek: 'Wednesday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematics', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-wed-2', dayOfWeek: 'Wednesday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-wed-3', dayOfWeek: 'Wednesday', timeSlot: '12:30 PM - 01:30 PM', startTime: '12:30', endTime: '13:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals', room: 'Lab-1', facultyName: 'Faculty 1' },
  // Thursday
  { id: 'tt-thu-1', dayOfWeek: 'Thursday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-thu-2', dayOfWeek: 'Thursday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematics', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-thu-3', dayOfWeek: 'Thursday', timeSlot: '12:30 PM - 01:30 PM', startTime: '12:30', endTime: '13:30', subjectId: 'subject-english', subjectCode: 'BCA-104', subjectName: 'English Communication', room: 'CS-102', facultyName: 'Faculty 1' },
  // Friday
  { id: 'tt-fri-1', dayOfWeek: 'Friday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals', room: 'Lab-1', facultyName: 'Faculty 1' },
  { id: 'tt-fri-2', dayOfWeek: 'Friday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-fri-3', dayOfWeek: 'Friday', timeSlot: '12:30 PM - 01:30 PM', startTime: '12:30', endTime: '13:30', subjectId: 'subject-mathematics', subjectCode: 'BCA-103', subjectName: 'Mathematics', room: 'CS-201', facultyName: 'Faculty 1' },
];

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
    const schedule = DEFAULT_TIMETABLE.filter((item) => item.dayOfWeek === targetDay);

    if (!userId) {
      return schedule;
    }

    const activeSessions = await attendanceService.getActiveSessionsForStudent(userId);
    const liveSubjectIds = new Set(activeSessions.map((s) => s.subjectId));

    return schedule.map((item) => ({
      ...item,
      status: liveSubjectIds.has(item.subjectId) ? 'live' : 'upcoming',
    }));
  },

  async getTodaySchedule(userId?: string): Promise<{ day: DayOfWeek; items: ClassScheduleItem[]; isWeekend: boolean }> {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const todayName = isWeekend ? 'Monday' : days[dayIndex - 1];

    const items = await this.getSchedule(todayName, userId);
    return {
      day: todayName,
      items,
      isWeekend,
    };
  },
};
