export type Role = 'student' | 'faculty' | 'admin';

export type AttendanceSessionStatus = 'active' | 'ended' | 'cancelled';
export type AttendanceRecordStatus = 'present' | 'absent';
export type AttendanceMethod = 'otp' | 'manual';
export type AttendanceStanding = 'good' | 'warning' | 'critical' | 'none';

export type DateFilter = 'all' | 'today' | 'week' | 'month';

export interface University {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  universityId: string;
  name: string;
}

export interface Programme {
  id: string;
  departmentId: string;
  name: string;
}

export interface Semester {
  id: string;
  programmeId: string;
  name: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  username: string;
  active: boolean;
  developmentPassword: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  programmeId: string;
  semesterId: string;
  active: boolean;
}

export interface Faculty {
  id: string;
  userId: string;
  facultyId: string;
  active: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  programmeId: string;
  semesterId: string;
  active: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  active: boolean;
}

export interface FacultyAssignment {
  id: string;
  facultyId: string;
  subjectId: string;
  active: boolean;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  facultyId: string;
  startedAt: string;
  endedAt: string | null;
  status: AttendanceSessionStatus;
  otp: string;
  otpExpiresAt: string;
  cancelledAt: string | null;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceRecordStatus;
  markedAt: string;
  markedBy: AttendanceMethod;
  markedByUserId: string | null;
}

export interface AuthSession {
  userId: string;
  role: Role;
  signedInAt: string;
}

export interface LocalDatabase {
  universities: University[];
  departments: Department[];
  programmes: Programme[];
  semesters: Semester[];
  users: User[];
  students: Student[];
  faculties: Faculty[];
  subjects: Subject[];
  enrollments: Enrollment[];
  facultyAssignments: FacultyAssignment[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
}

export interface SubjectAttendanceSummary {
  subject: Subject;
  facultyName: string;
  conducted: number;
  attended: number;
  missed: number;
  percentage: number;
  standing: AttendanceStanding;
  latestRecord: AttendanceHistoryItem | null;
}

export interface OverallAttendanceSummary {
  conducted: number;
  attended: number;
  missed: number;
  percentage: number;
  standing: AttendanceStanding;
}

export interface AttendanceHistoryItem {
  sessionId: string;
  recordId: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  facultyId: string;
  date: string;
  status: AttendanceRecordStatus | 'cancelled';
  method: AttendanceMethod | 'none';
  sessionStatus: AttendanceSessionStatus;
}

export interface StudentDashboardData {
  user: User;
  student: Student;
  programme: Programme;
  semester: Semester;
  subjects: SubjectAttendanceSummary[];
  overall: OverallAttendanceSummary;
  recent: AttendanceHistoryItem[];
}

export interface FacultyDashboardData {
  user: User;
  faculty: Faculty;
  assignedSubjects: Subject[];
  activeSession: AttendanceSession | null;
  recentSessions: FacultySessionReport[];
}

export interface SessionStudentStatus {
  student: Student;
  user: User;
  record: AttendanceRecord | null;
}

export interface FacultySessionReport {
  session: AttendanceSession;
  subject: Subject;
  faculty: Faculty;
  facultyUser: User;
  roster: SessionStudentStatus[];
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  enrolledCount: number;
  secondsRemaining: number;
  otpExpired: boolean;
}

export interface AttendanceFilter {
  subjectId?: string;
  status?: AttendanceRecordStatus | 'cancelled' | 'all';
  date?: DateFilter;
}

export interface ServiceResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlot: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  room: string;
  facultyName: string;
  status?: 'live' | 'upcoming' | 'completed';
}

