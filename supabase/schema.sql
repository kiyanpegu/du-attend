-- ==============================================================================
-- DU Attend: Dibrugarh University Attendance System Database Schema
-- Compatible with PostgreSQL & Supabase
-- ==============================================================================

-- 1. Academic Hierarchy Tables
CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  university_id TEXT REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programmes (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  programme_id TEXT REFERENCES programmes(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- 2. User & Identity Tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  programme_id TEXT REFERENCES programmes(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS faculties (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  faculty_id TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Course Structure & Enrollment
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  programme_id TEXT REFERENCES programmes(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS faculty_assignments (
  id TEXT PRIMARY KEY,
  faculty_id TEXT REFERENCES faculties(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(faculty_id, subject_id)
);

-- 4. Attendance Core Engine
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id TEXT REFERENCES faculties(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'ended', 'cancelled')) DEFAULT 'active',
  otp TEXT NOT NULL,
  otp_expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marked_by TEXT NOT NULL CHECK (marked_by IN ('otp', 'manual')),
  marked_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(session_id, student_id)
);

-- ==============================================================================
-- Row-Level Security (RLS) & Realtime Publication
-- ==============================================================================

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow Public Access for Demo Prototype Mode
CREATE POLICY "Public Read All" ON universities FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON departments FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON programmes FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON semesters FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON users FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON students FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON faculties FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON faculty_assignments FOR SELECT USING (true);

-- Attendance Sessions Policies
CREATE POLICY "Public Read Sessions" ON attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Public Insert Sessions" ON attendance_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Sessions" ON attendance_sessions FOR UPDATE USING (true);

-- Attendance Records Policies
CREATE POLICY "Public Read Records" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Public Insert Records" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Records" ON attendance_records FOR UPDATE USING (true);

-- Enable Supabase Realtime for Active Class Alerts & Live Rosters
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;

-- ==============================================================================
-- Initial Seed Data: Dibrugarh University BCA 1st Semester
-- ==============================================================================

INSERT INTO universities (id, name) VALUES
  ('university-du', 'Dibrugarh University')
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, university_id, name) VALUES
  ('department-computer-applications', 'university-du', 'Computer Applications')
ON CONFLICT (id) DO NOTHING;

INSERT INTO programmes (id, department_id, name) VALUES
  ('programme-bca', 'department-computer-applications', 'BCA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO semesters (id, programme_id, name) VALUES
  ('semester-bca-1', 'programme-bca', 'BCA 1st Semester')
ON CONFLICT (id) DO NOTHING;

-- Demo Users
INSERT INTO users (id, role, name, username, active, password) VALUES
  ('user-bca001', 'student', 'Student 1', 'BCA001', true, 'student123'),
  ('user-bca002', 'student', 'Student 2', 'BCA002', true, 'student456'),
  ('user-bca003', 'student', 'Student 3', 'BCA003', true, 'student789'),
  ('user-bca004', 'student', 'Student 4', 'BCA004', true, 'student321'),
  ('user-bca005', 'student', 'Student 5', 'BCA005', true, 'student654'),
  ('user-fac001', 'faculty', 'Faculty 1', 'FAC001', true, 'faculty123'),
  ('user-admin001', 'admin', 'Admin 1', 'ADMIN001', true, 'admin123')
ON CONFLICT (id) DO NOTHING;

-- Students
INSERT INTO students (id, user_id, student_id, programme_id, semester_id, active) VALUES
  ('student-bca001', 'user-bca001', 'BCA001', 'programme-bca', 'semester-bca-1', true),
  ('student-bca002', 'user-bca002', 'BCA002', 'programme-bca', 'semester-bca-1', true),
  ('student-bca003', 'user-bca003', 'BCA003', 'programme-bca', 'semester-bca-1', true),
  ('student-bca004', 'user-bca004', 'BCA004', 'programme-bca', 'semester-bca-1', true),
  ('student-bca005', 'user-bca005', 'BCA005', 'programme-bca', 'semester-bca-1', true)
ON CONFLICT (id) DO NOTHING;

-- Faculty
INSERT INTO faculties (id, user_id, faculty_id, active) VALUES
  ('faculty-fac001', 'user-fac001', 'FAC001', true)
ON CONFLICT (id) DO NOTHING;

-- Subjects
INSERT INTO subjects (id, code, name, programme_id, semester_id, active) VALUES
  ('subject-pst', 'BCA-101', 'Problem Solving Techniques', 'programme-bca', 'semester-bca-1', true),
  ('subject-computer-fundamentals', 'BCA-102', 'Computer Fundamentals', 'programme-bca', 'semester-bca-1', true),
  ('subject-mathematics', 'BCA-103', 'Mathematics', 'programme-bca', 'semester-bca-1', true),
  ('subject-english', 'BCA-104', 'English', 'programme-bca', 'semester-bca-1', true)
ON CONFLICT (id) DO NOTHING;

-- Enrollments for all students
INSERT INTO enrollments (id, student_id, subject_id, active) VALUES
  ('enr-bca001-pst', 'student-bca001', 'subject-pst', true),
  ('enr-bca001-cf', 'student-bca001', 'subject-computer-fundamentals', true),
  ('enr-bca001-math', 'student-bca001', 'subject-mathematics', true),
  ('enr-bca001-eng', 'student-bca001', 'subject-english', true),
  ('enr-bca002-pst', 'student-bca002', 'subject-pst', true),
  ('enr-bca002-cf', 'student-bca002', 'subject-computer-fundamentals', true),
  ('enr-bca002-math', 'student-bca002', 'subject-mathematics', true),
  ('enr-bca002-eng', 'student-bca002', 'subject-english', true)
ON CONFLICT (id) DO NOTHING;

-- Faculty Assignments
INSERT INTO faculty_assignments (id, faculty_id, subject_id, active) VALUES
  ('asgn-fac001-pst', 'faculty-fac001', 'subject-pst', true),
  ('asgn-fac001-cf', 'faculty-fac001', 'subject-computer-fundamentals', true),
  ('asgn-fac001-math', 'faculty-fac001', 'subject-mathematics', true),
  ('asgn-fac001-eng', 'faculty-fac001', 'subject-english', true)
ON CONFLICT (id) DO NOTHING;
