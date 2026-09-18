const fs = require('fs');
const path = require('path');

const contentPath = 'C:/Users/Asus/.gemini/antigravity/brain/36acaf85-aa99-4d05-afe8-98b700de5ae4/.system_generated/steps/3903/content.md';
const content = fs.readFileSync(contentPath, 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const rawData = JSON.parse(jsonStr);

function cleanName(raw) {
  return raw.trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => {
      let upper = w.toUpperCase();
      if (upper === 'MD' || upper === 'MD.') return 'Md';
      if (upper === 'MISS' || upper === 'MISS.') return 'Miss';
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function getFirstName(clean) {
  let s = clean.replace(/^(Miss\.?|Md\.?)\s+/i, '').trim();
  let parts = s.split(' ');
  return parts[0].toLowerCase();
}

const programmes = [
  { id: 'programme-bca', departmentId: 'department-computer-applications', name: 'Bachelor of Computer Application (BCA)', code: 'BCA' },
  { id: 'programme-mca', departmentId: 'department-computer-applications', name: 'Master of Computer Application (MCA)', code: 'MCA' },
  { id: 'programme-pgdca', departmentId: 'department-computer-applications', name: 'Post Graduate Diploma in Computer Application (PGDCA)', code: 'PGDCA' }
];

const semesters = [
  { id: 'semester-bca-1', programmeId: 'programme-bca', name: 'BCA 1st Semester', semNum: '1', code: 'BCA1' },
  { id: 'semester-bca-3', programmeId: 'programme-bca', name: 'BCA 3rd Semester', semNum: '3', code: 'BCA3' },
  { id: 'semester-bca-5', programmeId: 'programme-bca', name: 'BCA 5th Semester', semNum: '5', code: 'BCA5' },
  { id: 'semester-mca-1', programmeId: 'programme-mca', name: 'MCA 1st Semester', semNum: '1', code: 'MCA1' },
  { id: 'semester-mca-3', programmeId: 'programme-mca', name: 'MCA 3rd Semester', semNum: '3', code: 'MCA3' },
  { id: 'semester-pgdca-1', programmeId: 'programme-pgdca', name: 'PGDCA 1st Semester', semNum: '1', code: 'PGDCA1' }
];

// Official CCSA Odd Semester 2026 Subjects (All Faculty anonymous as Course Instructor)
const subjects = [
  // --- BCA 1st Semester ---
  { id: 'subject-pst', code: 'BCA-101', name: 'Problem Solving Techniques', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-computer-fundamentals', code: 'BCA-102', name: 'Computer Fundamentals & Applications', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-mathematics', code: 'BCA-103', name: 'Mathematical Foundation of Computer Science - I', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-english', code: 'BCA-104', name: 'English Communication', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-evs', code: 'BCA-105', name: 'Environmental Studies', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-iks-bca1', code: 'BCA-106', name: 'Indian Knowledge System', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-audit-1', code: 'BCA-107', name: 'Audit Course - I', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-pst-lab', code: 'BCA-101L', name: 'Problem Solving Techniques Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-cfa-lab', code: 'BCA-102L', name: 'Computer Fundamentals Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },

  // --- BCA 3rd Semester ---
  { id: 'subject-bca3-fla', code: 'BCA-301', name: 'Formal Language & Automata', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-os', code: 'BCA-302', name: 'Operating Systems', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-os-lab', code: 'BCA-302L', name: 'Operating Systems Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-iss', code: 'BCA-303', name: 'Introduction to Software Security', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-iss-lab', code: 'BCA-303L', name: 'Software Security Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-se', code: 'BCA-304', name: 'Software Engineering', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-se-lab', code: 'BCA-304L', name: 'Software Engineering Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-maths', code: 'BCA-305', name: 'Mathematics - III', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },

  // --- BCA 5th Semester ---
  { id: 'subject-bca5-or', code: 'BCA-501', name: 'Operations Research', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-or-lab', code: 'BCA-501L', name: 'Operations Research Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-iwp', code: 'BCA-502', name: 'Internet & Web Programming', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-iwp-lab', code: 'BCA-502L', name: 'Internet & Web Programming Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-cc', code: 'BCA-503', name: 'Cloud Computing', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-icg', code: 'BCA-504', name: 'Introduction to Computer Graphics', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-icg-lab', code: 'BCA-504L', name: 'Computer Graphics Laboratory', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-minor-project', code: 'BCA-505', name: 'Minor Project Work', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },

  // --- MCA 1st Semester ---
  { id: 'subject-mca1-latex', code: 'MCA-101', name: 'Technical Writing & LaTeX', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-dd', code: 'MCA-102', name: 'Digital Design & Architecture', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-dd-lab', code: 'MCA-102L', name: 'Digital Design Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-oopd', code: 'MCA-103', name: 'Object Oriented Programming & Design', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-op', code: 'MCA-104', name: 'Optimization Techniques', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-dm', code: 'MCA-105', name: 'Discrete Mathematics', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-cpps', code: 'MCA-107', name: 'Computer Programming & Problem Solving', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-cpps-lab', code: 'MCA-107L', name: 'CPPS Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-iks', code: 'MCA-108', name: 'Indian Knowledge System', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },

  // --- MCA 3rd Semester ---
  { id: 'subject-mca3-ai', code: 'MCA-301', name: 'Artificial Intelligence', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-daa', code: 'MCA-302', name: 'Design & Analysis of Algorithms', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-daa-lab', code: 'MCA-302L', name: 'DAA Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-wt', code: 'MCA-303', name: 'Web Technologies', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-wt-lab', code: 'MCA-303L', name: 'Web Technologies Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-pp', code: 'MCA-304', name: 'Python Programming', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-pp-lab', code: 'MCA-304L', name: 'Python Programming Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-cc', code: 'MCA-305', name: 'Cloud Computing', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-dmml', code: 'MCA-306', name: 'Data Mining & Machine Learning', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-dmml-lab', code: 'MCA-306L', name: 'Data Mining & ML Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-se', code: 'MCA-307', name: 'Software Engineering', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-se-lab', code: 'MCA-307L', name: 'Software Engineering Laboratory', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-skill', code: 'MCA-308', name: 'Skill Training', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },

  // --- PGDCA ---
  { id: 'subject-pgdca-c', code: 'PGDCA-101', name: 'Programming in C', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-c-lab', code: 'PGDCA-101L', name: 'C Programming Laboratory', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-dccn', code: 'PGDCA-102', name: 'Data Communication & Computer Networks', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-dccn-lab', code: 'PGDCA-102L', name: 'DCCN Laboratory', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-fc', code: 'PGDCA-103', name: 'Fundamentals of Computers', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-fc-lab', code: 'PGDCA-103L', name: 'FC Laboratory', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-rdbms', code: 'PGDCA-104', name: 'Relational Database Management Systems', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-rdbms-lab', code: 'PGDCA-104L', name: 'RDBMS Laboratory', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca-project', code: 'PGDCA-105', name: 'Project Work', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true }
];

const now = new Date('2026-08-23T00:00:00.000Z').toISOString();

const users = [];
const students = [];
const enrollments = [];

rawData[0].programmes.forEach(p => {
  const pObj = programmes.find(item => p.programme.includes(item.code));
  p.semesters.forEach(s => {
    const semNum = s.semester.charAt(0);
    const sObj = semesters.find(item => item.programmeId === pObj.id && item.semNum === semNum);
    const semesterSubjects = subjects.filter(sub => sub.semesterId === sObj.id);

    s.students.forEach((st, idx) => {
      const cleaned = cleanName(st.name);
      const fn = getFirstName(cleaned);
      const num = String(idx + 1).padStart(3, '0');
      const studentId = `${sObj.code}-${num}`;
      const idKey = studentId.toLowerCase();

      // User Model
      const userId = `user-${idKey}`;
      users.push({
        id: userId,
        role: 'student',
        name: cleaned,
        username: fn,
        active: true,
        developmentPassword: fn,
        createdAt: now,
        updatedAt: now,
      });

      // Student Model
      const studentModelId = `student-${idKey}`;
      students.push({
        id: studentModelId,
        userId: userId,
        studentId: studentId,
        programmeId: pObj.id,
        semesterId: sObj.id,
        active: true,
      });

      // Enroll in semester subjects
      semesterSubjects.forEach(sub => {
        enrollments.push({
          id: `enrollment-${idKey}-${sub.id}`,
          studentId: studentModelId,
          subjectId: sub.id,
          active: true,
        });
      });
    });
  });
});

console.log(`Generated ${users.length} student users`);
console.log(`Generated ${students.length} student profiles`);
console.log(`Generated ${enrollments.length} enrollments`);

const outputCode = `// Autogenerated from Dibrugarh University CCSA student records & Odd Semester 2026 Routine
import type { Enrollment, Programme, Semester, Student, Subject, User } from '@/types/models';

export const CCSA_PROGRAMMES: Programme[] = ${JSON.stringify(programmes.map(({ id, departmentId, name }) => ({ id, departmentId, name })), null, 2)};

export const CCSA_SEMESTERS: Semester[] = ${JSON.stringify(semesters.map(({ id, programmeId, name }) => ({ id, programmeId, name })), null, 2)};

export const CCSA_SUBJECTS: Subject[] = ${JSON.stringify(subjects, null, 2)};

export const CCSA_STUDENT_USERS: User[] = ${JSON.stringify(users, null, 2)};

export const CCSA_STUDENTS: Student[] = ${JSON.stringify(students, null, 2)};

export const CCSA_ENROLLMENTS: Enrollment[] = ${JSON.stringify(enrollments, null, 2)};
`;

const targetFile = path.resolve('c:/Users/Asus/CollegeAttendance/constants/ccsaRoster.ts');
fs.writeFileSync(targetFile, outputCode, 'utf8');
console.log('Successfully wrote', targetFile);
