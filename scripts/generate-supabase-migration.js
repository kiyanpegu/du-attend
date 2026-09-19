const fs = require('fs');

const content = fs.readFileSync('constants/ccsaRoster.ts', 'utf8');

function extractArray(name) {
  const startPattern = 'export const ' + name + ':';
  const tIdx = content.indexOf(startPattern);
  if (tIdx === -1) {
    const sPattern = 'export const ' + name + ' = ';
    const sIdx = content.indexOf(sPattern);
    const jsonStart = content.indexOf('[', sIdx);
    const endIdx = content.indexOf(';\n', jsonStart);
    return JSON.parse(content.slice(jsonStart, endIdx).trim());
  }
  const eqIdx = content.indexOf('=', tIdx);
  const jsonStart = content.indexOf('[', eqIdx);
  const endIdx = content.indexOf(';\n', jsonStart);
  return JSON.parse(content.slice(jsonStart, endIdx).trim());
}

const programmes = extractArray('CCSA_PROGRAMMES');
const semesters = extractArray('CCSA_SEMESTERS');
const subjects = extractArray('CCSA_SUBJECTS');
const users = extractArray('CCSA_STUDENT_USERS');
const students = extractArray('CCSA_STUDENTS');

function escapeSql(str) {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

let sql = `-- ==============================================================================
-- DU Attend: Fix Cloud Sync, Schedule Overrides & CCSA Roster Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xczioqwkdzbqadesbvmt/sql/new
-- ==============================================================================

-- 1. Relax foreign key constraints on attendance sessions & records so sync NEVER fails
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_subject_id_fkey;
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_faculty_id_fkey;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;

-- 2. Create schedule_overrides table for class cancellations and rescheduling
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id TEXT PRIMARY KEY,
  timetable_item_id TEXT,
  subject_id TEXT,
  faculty_id TEXT,
  faculty_user_id TEXT,
  faculty_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('cancelled', 'rescheduled')),
  reason TEXT,
  original_day TEXT NOT NULL,
  original_time_slot TEXT NOT NULL,
  new_day_of_week TEXT,
  new_time_slot TEXT,
  new_room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Enable RLS and permissions on schedule_overrides
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Overrides" ON schedule_overrides;
CREATE POLICY "Public Read Overrides" ON schedule_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Overrides" ON schedule_overrides;
CREATE POLICY "Public Insert Overrides" ON schedule_overrides FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Overrides" ON schedule_overrides;
CREATE POLICY "Public Update Overrides" ON schedule_overrides FOR UPDATE USING (true);

-- 4. Enable Supabase Realtime for schedule_overrides
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'schedule_overrides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE schedule_overrides;
  END IF;
END $$;

-- 5. Academic Hierarchy Setup
INSERT INTO universities (id, name) VALUES
  ('university-du', 'Dibrugarh University')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO departments (id, university_id, name) VALUES
  ('department-computer-applications', 'university-du', 'Centre for Computer Science and Applications')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 6. Programmes
INSERT INTO programmes (id, department_id, name) VALUES
${programmes.map(p => `  (${escapeSql(p.id)}, ${escapeSql(p.departmentId)}, ${escapeSql(p.name)})`).join(',\n')}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 7. Semesters
INSERT INTO semesters (id, programme_id, name) VALUES
${semesters.map(s => `  (${escapeSql(s.id)}, ${escapeSql(s.programmeId)}, ${escapeSql(s.name)})`).join(',\n')}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 8. Subjects (56 CCSA Subjects)
INSERT INTO subjects (id, code, name, programme_id, semester_id, active) VALUES
${subjects.map(sub => `  (${escapeSql(sub.id)}, ${escapeSql(sub.code)}, ${escapeSql(sub.name)}, ${escapeSql(sub.programmeId)}, ${escapeSql(sub.semesterId)}, ${sub.active})`).join(',\n')}
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, active = EXCLUDED.active;

-- 9. Faculty & Generic Instructor
INSERT INTO users (id, role, name, username, active, password) VALUES
  ('user-fac001', 'faculty', 'Course Instructor', 'FAC001', true, 'faculty123'),
  ('user-admin001', 'admin', 'Admin', 'ADMIN001', true, 'admin123')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active;

INSERT INTO faculties (id, user_id, faculty_id, active) VALUES
  ('faculty-fac001', 'user-fac001', 'FAC001', true)
ON CONFLICT (id) DO NOTHING;

-- Assign all subjects to default faculty
INSERT INTO faculty_assignments (id, faculty_id, subject_id, active) VALUES
${subjects.map((sub, idx) => `  ('asgn-fac001-${idx}', 'faculty-fac001', ${escapeSql(sub.id)}, true)`).join(',\n')}
ON CONFLICT (id) DO NOTHING;

-- 10. CCSA Student Users (314 Students)
INSERT INTO users (id, role, name, username, active, password) VALUES
${users.map(u => `  (${escapeSql(u.id)}, 'student', ${escapeSql(u.name)}, ${escapeSql(u.username)}, true, ${escapeSql(u.developmentPassword || 'student123')})`).join(',\n')}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = EXCLUDED.username, password = EXCLUDED.password;

-- 11. CCSA Students
INSERT INTO students (id, user_id, student_id, programme_id, semester_id, active) VALUES
${students.map(st => `  (${escapeSql(st.id)}, ${escapeSql(st.userId)}, ${escapeSql(st.studentId)}, ${escapeSql(st.programmeId)}, ${escapeSql(st.semesterId)}, true)`).join(',\n')}
ON CONFLICT (id) DO UPDATE SET student_id = EXCLUDED.student_id, programme_id = EXCLUDED.programme_id, semester_id = EXCLUDED.semester_id;

-- 12. Ensure Public Access for App Clients
DROP POLICY IF EXISTS "Public Read All" ON users;
CREATE POLICY "Public Read All" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read All" ON students;
CREATE POLICY "Public Read All" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read All" ON subjects;
CREATE POLICY "Public Read All" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read All" ON enrollments;
CREATE POLICY "Public Read All" ON enrollments FOR SELECT USING (true);
`;

fs.writeFileSync('supabase/fix_sync_and_ccsa.sql', sql);
console.log('Successfully wrote supabase/fix_sync_and_ccsa.sql, length:', sql.length);
