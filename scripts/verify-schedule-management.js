const assert = require('assert');

// Mock AsyncStorage in memory for testing
const store = {};
const mockAsyncStorage = {
  getItem: async (key) => store[key] ?? null,
  setItem: async (key, val) => { store[key] = val; },
  removeItem: async (key) => { delete store[key]; },
};

console.log('--- STARTING SCHEDULE MANAGEMENT VERIFICATION TESTS ---');

// Verify model structures and mock schedule service logic
const DEFAULT_TIMETABLE = [
  { id: 'tt-mon-1', dayOfWeek: 'Monday', timeSlot: '09:30 AM - 10:30 AM', startTime: '09:30', endTime: '10:30', subjectId: 'subject-pst', subjectCode: 'BCA-101', subjectName: 'Problem Solving Techniques', room: 'CS-201', facultyName: 'Faculty 1' },
  { id: 'tt-mon-2', dayOfWeek: 'Monday', timeSlot: '10:45 AM - 11:45 AM', startTime: '10:45', endTime: '11:45', subjectId: 'subject-computer-fundamentals', subjectCode: 'BCA-102', subjectName: 'Computer Fundamentals', room: 'Lab-1', facultyName: 'Faculty 1' },
];

let overrides = [];

function cancelClass(timetableItemId, reason) {
  const base = DEFAULT_TIMETABLE.find(t => t.id === timetableItemId);
  assert(base, 'Base timetable item exists');
  overrides.push({
    id: 'ov-1',
    timetableItemId,
    subjectId: base.subjectId,
    action: 'cancelled',
    reason,
    originalDay: base.dayOfWeek,
    originalTimeSlot: base.timeSlot,
    active: true,
  });
}

function rescheduleClass(timetableItemId, newDay, newTimeSlot, newRoom, reason) {
  const base = DEFAULT_TIMETABLE.find(t => t.id === timetableItemId);
  assert(base, 'Base timetable item exists');
  overrides.push({
    id: 'ov-2',
    timetableItemId,
    subjectId: base.subjectId,
    action: 'rescheduled',
    reason,
    originalDay: base.dayOfWeek,
    originalTimeSlot: base.timeSlot,
    newDayOfWeek: newDay,
    newTimeSlot,
    newRoom: newRoom || base.room,
    active: true,
  });
}

function resolveScheduleForDay(day) {
  const activeOverrides = overrides.filter(o => o.active);
  const baseItems = DEFAULT_TIMETABLE.filter(t => t.dayOfWeek === day);
  const resolved = [];

  baseItems.forEach(item => {
    const ov = activeOverrides.find(o => o.timetableItemId === item.id);
    if (!ov) {
      resolved.push({ ...item, status: 'upcoming' });
    } else if (ov.action === 'cancelled') {
      resolved.push({ ...item, status: 'cancelled', cancellationReason: ov.reason });
    } else if (ov.action === 'rescheduled') {
      resolved.push({
        ...item,
        status: 'rescheduled',
        rescheduledTo: { dayOfWeek: ov.newDayOfWeek, timeSlot: ov.newTimeSlot, room: ov.newRoom }
      });
    }
  });

  const incoming = activeOverrides.filter(o => o.action === 'rescheduled' && o.newDayOfWeek === day && o.originalDay !== day);
  incoming.forEach(ov => {
    const original = DEFAULT_TIMETABLE.find(t => t.id === ov.timetableItemId);
    resolved.push({
      id: `${original.id}-rescheduled`,
      dayOfWeek: day,
      timeSlot: ov.newTimeSlot,
      subjectName: original.subjectName,
      status: 'upcoming',
      rescheduledFrom: { dayOfWeek: ov.originalDay, timeSlot: ov.originalTimeSlot }
    });
  });

  return resolved;
}

// 1. Initial timetable resolution
let monday = resolveScheduleForDay('Monday');
assert.strictEqual(monday.length, 2);
assert.strictEqual(monday[0].status, 'upcoming');
console.log('✓ Test 1: Default timetable resolves successfully');

// 2. Cancel a class
cancelClass('tt-mon-1', 'Departmental Seminar');
monday = resolveScheduleForDay('Monday');
assert.strictEqual(monday[0].status, 'cancelled');
assert.strictEqual(monday[0].cancellationReason, 'Departmental Seminar');
console.log('✓ Test 2: Class cancellation applied with reason');

// 3. Reschedule second class to Thursday
rescheduleClass('tt-mon-2', 'Thursday', '02:00 PM - 03:00 PM', 'Lab-2', 'Makeup Lecture');
monday = resolveScheduleForDay('Monday');
assert.strictEqual(monday[1].status, 'rescheduled');
assert.strictEqual(monday[1].rescheduledTo.dayOfWeek, 'Thursday');
console.log('✓ Test 3: Rescheduling marks original slot as rescheduled');

// 4. Verify Thursday schedule has incoming class
let thursday = resolveScheduleForDay('Thursday');
assert.strictEqual(thursday.length, 1);
assert.strictEqual(thursday[0].subjectName, 'Computer Fundamentals');
assert.strictEqual(thursday[0].rescheduledFrom.dayOfWeek, 'Monday');
console.log('✓ Test 4: Target day reflects incoming rescheduled class slot');

// 5. Restore cancellation
overrides.find(o => o.id === 'ov-1').active = false;
monday = resolveScheduleForDay('Monday');
assert.strictEqual(monday[0].status, 'upcoming');
assert.strictEqual(monday[0].cancellationReason, undefined);
console.log('✓ Test 5: Restoring class reverts slot back to upcoming state');

console.log('=========================================');
console.log('ALL SCHEDULE MANAGEMENT TESTS PASSED!   ');
console.log('=========================================');

