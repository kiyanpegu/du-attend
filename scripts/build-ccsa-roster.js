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

const subjects = [
  // BCA 1st Sem
  { id: 'subject-pst', code: 'BCA-101', name: 'Problem Solving Techniques', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-computer-fundamentals', code: 'BCA-102', name: 'Computer Fundamentals', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-mathematics', code: 'BCA-103', name: 'Mathematics', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  { id: 'subject-english', code: 'BCA-104', name: 'English Communication', programmeId: 'programme-bca', semesterId: 'semester-bca-1', active: true },
  // BCA 3rd Sem
  { id: 'subject-bca3-ds', code: 'BCA-301', name: 'Data Structures & Algorithms', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-dbms', code: 'BCA-302', name: 'Database Management Systems', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  { id: 'subject-bca3-oops', code: 'BCA-303', name: 'Object Oriented Programming', programmeId: 'programme-bca', semesterId: 'semester-bca-3', active: true },
  // BCA 5th Sem
  { id: 'subject-bca5-web', code: 'BCA-501', name: 'Web Technology & Frameworks', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-os', code: 'BCA-502', name: 'Operating Systems & Linux', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  { id: 'subject-bca5-se', code: 'BCA-503', name: 'Software Engineering & Agile', programmeId: 'programme-bca', semesterId: 'semester-bca-5', active: true },
  // MCA 1st Sem
  { id: 'subject-mca1-ai', code: 'MCA-101', name: 'Artificial Intelligence & Machine Learning', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-dsa', code: 'MCA-102', name: 'Advanced Algorithms & Complexity', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  { id: 'subject-mca1-cn', code: 'MCA-103', name: 'Advanced Computer Networks', programmeId: 'programme-mca', semesterId: 'semester-mca-1', active: true },
  // MCA 3rd Sem
  { id: 'subject-mca3-cloud', code: 'MCA-301', name: 'Cloud Computing & Distributed Systems', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  { id: 'subject-mca3-cyber', code: 'MCA-302', name: 'Cybersecurity & Cryptography', programmeId: 'programme-mca', semesterId: 'semester-mca-3', active: true },
  // PGDCA 1st Sem
  { id: 'subject-pgdca1-it', code: 'PGDCA-101', name: 'Information Technology & Applications', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
  { id: 'subject-pgdca1-prog', code: 'PGDCA-102', name: 'Programming in C & Python', programmeId: 'programme-pgdca', semesterId: 'semester-pgdca-1', active: true },
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
        username: fn, // username is first name only
        active: true,
        developmentPassword: fn, // password is first name itself
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

const outputCode = `// Autogenerated from Dibrugarh University CCSA student records (https://www.ccsdu.in/Present_Stu.php)
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
