const { SEED_DATABASE } = require('../constants/seedData');

console.log('==============================================');
console.log('   CCSA STUDENT DATASET VERIFICATION TEST     ');
console.log('==============================================');

// Test 1: Programmes and Semesters
console.log('Programmes count:', SEED_DATABASE.programmes.length);
console.log('Semesters count:', SEED_DATABASE.semesters.length);
console.log('Subjects count:', SEED_DATABASE.subjects.length);

if (SEED_DATABASE.programmes.length < 3) {
  console.error('FAIL: Expected at least 3 programmes');
  process.exit(1);
}
if (SEED_DATABASE.semesters.length < 6) {
  console.error('FAIL: Expected at least 6 semesters');
  process.exit(1);
}
console.log('✓ Test 1 Passed: Academic structures loaded correctly');

// Test 2: Student count
const studentUsers = SEED_DATABASE.users.filter(u => u.role === 'student');
console.log('Total Student Users:', studentUsers.length);
console.log('Total Student Profiles:', SEED_DATABASE.students.length);
console.log('Total Enrollments:', SEED_DATABASE.enrollments.length);

if (studentUsers.length < 314) {
  console.error('FAIL: Expected at least 314 student users');
  process.exit(1);
}
console.log('✓ Test 2 Passed: All 314+ student records seeded');

// Test 3: Kiyan Pegu user record & credentials
const kiyanUser = studentUsers.find(u => u.name.toLowerCase().includes('kiyan'));
if (!kiyanUser) {
  console.error('FAIL: Kiyan Pegu user not found');
  process.exit(1);
}
console.log('Kiyan User:', {
  id: kiyanUser.id,
  name: kiyanUser.name,
  username: kiyanUser.username,
  password: kiyanUser.developmentPassword
});

if (kiyanUser.username !== 'kiyan') {
  console.error('FAIL: Kiyan username should be "kiyan"');
  process.exit(1);
}
if (kiyanUser.developmentPassword !== 'kiyan') {
  console.error('FAIL: Kiyan password should be "kiyan"');
  process.exit(1);
}
console.log('✓ Test 3 Passed: Kiyan Pegu credentials verified (kiyan / kiyan)');

// Test 4: Student profile & enrollments for Kiyan
const kiyanStudent = SEED_DATABASE.students.find(s => s.userId === kiyanUser.id);
if (!kiyanStudent) {
  console.error('FAIL: Kiyan student profile not found');
  process.exit(1);
}
console.log('Kiyan Student Profile:', {
  id: kiyanStudent.id,
  studentId: kiyanStudent.studentId,
  programmeId: kiyanStudent.programmeId,
  semesterId: kiyanStudent.semesterId
});

const kiyanEnrollments = SEED_DATABASE.enrollments.filter(e => e.studentId === kiyanStudent.id);
console.log('Kiyan Enrollments count:', kiyanEnrollments.length);
if (kiyanEnrollments.length === 0) {
  console.error('FAIL: Kiyan has no enrollments');
  process.exit(1);
}
console.log('✓ Test 4 Passed: Kiyan Pegu enrolled in semester subjects');

// Test 5: Simulated authentication logic for Kiyan & Demo
function mockAuth(username, password) {
  const normalizedInput = (username || '').trim().toUpperCase();
  const user = SEED_DATABASE.users.find(item => {
    if (item.role !== 'student' || !item.active) return false;
    if (item.username.toUpperCase() === normalizedInput) return true;
    if (item.name.toUpperCase() === normalizedInput) return true;
    const studentRec = SEED_DATABASE.students.find(s => s.userId === item.id && s.active);
    if (studentRec && studentRec.studentId.toUpperCase() === normalizedInput) return true;
    return false;
  });

  if (!user) return { ok: false, message: 'User not found' };

  const passMatch =
    user.developmentPassword === password ||
    user.developmentPassword.toLowerCase() === (password || '').trim().toLowerCase();

  if (!passMatch) return { ok: false, message: 'Invalid password' };

  return { ok: true, user };
}

// Check lower-case
const authKiyan = mockAuth('kiyan', 'kiyan');
if (!authKiyan.ok || authKiyan.user.name !== 'Kiyan Pegu') {
  console.error('FAIL: mockAuth for kiyan/kiyan failed', authKiyan);
  process.exit(1);
}

// Check capitalized First Name (common on mobile keyboards)
const authKiyanCap = mockAuth('Kiyan', 'Kiyan');
if (!authKiyanCap.ok || authKiyanCap.user.name !== 'Kiyan Pegu') {
  console.error('FAIL: mockAuth for Kiyan/Kiyan failed', authKiyanCap);
  process.exit(1);
}

// Check Student ID
const authKiyanId = mockAuth(kiyanStudent.studentId, 'kiyan');
if (!authKiyanId.ok || authKiyanId.user.name !== 'Kiyan Pegu') {
  console.error('FAIL: mockAuth for Kiyan by studentId failed', authKiyanId);
  process.exit(1);
}

// Check legacy demo student
const authDemo = mockAuth('BCA001', 'student123');
if (!authDemo.ok) {
  console.error('FAIL: mockAuth for demo student failed', authDemo);
  process.exit(1);
}

console.log('✓ Test 5 Passed: Flexible login scenarios verified (first name, capitalized, studentId, demo)');

console.log('==============================================');
console.log('   ALL CCSA INTEGRATION TESTS PASSED!         ');
console.log('==============================================');
