import {
  CCSA_ENROLLMENTS,
  CCSA_PROGRAMMES,
  CCSA_SEMESTERS,
  CCSA_STUDENT_USERS,
  CCSA_STUDENTS,
  CCSA_SUBJECTS,
} from '@/constants/ccsaRoster';
import type { LocalDatabase } from '@/types/models';

const now = new Date('2026-08-23T00:00:00.000Z').toISOString();

export const SEED_IDS = {
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

// Legacy demo students for testing compatibility
const demoStudents = [
  { publicId: 'BCA001', name: 'Student 1', password: 'student123' },
  { publicId: 'BCA002', name: 'Student 2', password: 'student456' },
  { publicId: 'BCA003', name: 'Student 3', password: 'student789' },
  { publicId: 'BCA004', name: 'Student 4', password: 'student321' },
  { publicId: 'BCA005', name: 'Student 5', password: 'student654' },
];

const demoUsers = demoStudents.map((student) => ({
  id: `user-${student.publicId.toLowerCase()}`,
  role: 'student' as const,
  name: student.name,
  username: student.publicId,
  active: true,
  developmentPassword: student.password,
  createdAt: now,
  updatedAt: now,
}));

const demoStudentProfiles = demoStudents.map((student) => ({
  id: `student-${student.publicId.toLowerCase()}`,
  userId: `user-${student.publicId.toLowerCase()}`,
  studentId: student.publicId,
  programmeId: SEED_IDS.programme,
  semesterId: SEED_IDS.semester,
  active: true,
}));

const demoEnrollments = demoStudents.flatMap((student) =>
  Object.values(SEED_IDS.subjects).map((subjectId) => ({
    id: `enrollment-${student.publicId.toLowerCase()}-${subjectId}`,
    studentId: `student-${student.publicId.toLowerCase()}`,
    subjectId,
    active: true,
  }))
);

export const SEED_DATABASE: LocalDatabase = {
  universities: [
    {
      id: SEED_IDS.university,
      name: 'Dibrugarh University',
    },
  ],
  departments: [
    {
      id: SEED_IDS.department,
      universityId: SEED_IDS.university,
      name: 'Centre for Computer Science and Applications',
    },
  ],
  programmes: CCSA_PROGRAMMES,
  semesters: CCSA_SEMESTERS,
  users: [
    ...demoUsers,
    ...CCSA_STUDENT_USERS,
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
  students: [
    ...demoStudentProfiles,
    ...CCSA_STUDENTS,
  ],
  faculties: [
    {
      id: SEED_IDS.faculty,
      userId: SEED_IDS.facultyUser,
      facultyId: 'FAC001',
      active: true,
    },
  ],
  subjects: CCSA_SUBJECTS,
  enrollments: [
    ...demoEnrollments,
    ...CCSA_ENROLLMENTS,
  ],
  facultyAssignments: CCSA_SUBJECTS.map((subject) => ({
    id: `assignment-fac001-${subject.id}`,
    facultyId: SEED_IDS.faculty,
    subjectId: subject.id,
    active: true,
  })),
  attendanceSessions: [],
  attendanceRecords: [],
  scheduleOverrides: [],
};

export const DEVELOPMENT_CREDENTIALS = {
  students: [
    { id: 'kiyan', name: 'Kiyan Pegu', password: 'kiyan' },
    { id: 'abhigyan', name: 'Abhigyan Konwar', password: 'abhigyan' },
    { id: 'BCA001', name: 'Demo Student 1', password: 'student123' },
    { id: 'BCA002', name: 'Demo Student 2', password: 'student456' },
    { id: 'BCA1-053', name: 'Kiyan Pegu (ID)', password: 'kiyan' },
  ],
  faculty: [{ id: 'FAC001', password: 'faculty123' }],
  admin: [{ id: 'ADMIN001', password: 'admin123' }],
};
