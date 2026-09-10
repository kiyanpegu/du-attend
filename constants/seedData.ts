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

const students = [
  { publicId: 'BCA001', name: 'Student 1', password: 'student123' },
  { publicId: 'BCA002', name: 'Student 2', password: 'student456' },
  { publicId: 'BCA003', name: 'Student 3', password: 'student789' },
  { publicId: 'BCA004', name: 'Student 4', password: 'student321' },
  { publicId: 'BCA005', name: 'Student 5', password: 'student654' },
];

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
      name: 'Computer Applications',
    },
  ],
  programmes: [
    {
      id: SEED_IDS.programme,
      departmentId: SEED_IDS.department,
      name: 'BCA',
    },
  ],
  semesters: [
    {
      id: SEED_IDS.semester,
      programmeId: SEED_IDS.programme,
      name: 'BCA 1st Semester',
    },
  ],
  users: [
    ...students.map((student) => ({
      id: `user-${student.publicId.toLowerCase()}`,
      role: 'student' as const,
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
  students: students.map((student) => ({
    id: `student-${student.publicId.toLowerCase()}`,
    userId: `user-${student.publicId.toLowerCase()}`,
    studentId: student.publicId,
    programmeId: SEED_IDS.programme,
    semesterId: SEED_IDS.semester,
    active: true,
  })),
  faculties: [
    {
      id: SEED_IDS.faculty,
      userId: SEED_IDS.facultyUser,
      facultyId: 'FAC001',
      active: true,
    },
  ],
  subjects: [
    {
      id: SEED_IDS.subjects.pst,
      code: 'BCA-101',
      name: 'Problem Solving Techniques',
      programmeId: SEED_IDS.programme,
      semesterId: SEED_IDS.semester,
      active: true,
    },
    {
      id: SEED_IDS.subjects.fundamentals,
      code: 'BCA-102',
      name: 'Computer Fundamentals',
      programmeId: SEED_IDS.programme,
      semesterId: SEED_IDS.semester,
      active: true,
    },
    {
      id: SEED_IDS.subjects.mathematics,
      code: 'BCA-103',
      name: 'Mathematics',
      programmeId: SEED_IDS.programme,
      semesterId: SEED_IDS.semester,
      active: true,
    },
    {
      id: SEED_IDS.subjects.english,
      code: 'BCA-104',
      name: 'English',
      programmeId: SEED_IDS.programme,
      semesterId: SEED_IDS.semester,
      active: true,
    },
  ],
  enrollments: students.flatMap((student) =>
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

export const DEVELOPMENT_CREDENTIALS = {
  students: students.map((student) => ({
    id: student.publicId,
    password: student.password,
  })),
  faculty: [{ id: 'FAC001', password: 'faculty123' }],
  admin: [{ id: 'ADMIN001', password: 'admin123' }],
};
