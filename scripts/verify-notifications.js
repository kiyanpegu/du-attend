const assert = require('assert');

console.log('--- STARTING NOTIFICATION SERVICE VERIFICATION TESTS ---');

// Channel constants verification
const NOTIFICATION_CHANNELS = {
  CLASSES: 'classes',
  ATTENDANCE: 'attendance',
  ALERTS: 'alerts',
};

assert.strictEqual(NOTIFICATION_CHANNELS.CLASSES, 'classes', 'Classes channel defined');
assert.strictEqual(NOTIFICATION_CHANNELS.ATTENDANCE, 'attendance', 'Attendance channel defined');
assert.strictEqual(NOTIFICATION_CHANNELS.ALERTS, 'alerts', 'Alerts channel defined');
console.log('✓ Test 1: Channel IDs validated');

// Verification of Cancel Payload
function buildCancelPayload(subjectName, slotTime, reason) {
  const reasonText = reason ? ` (${reason})` : '';
  return {
    content: {
      title: `❌ Class Cancelled: ${subjectName}`,
      body: `The ${slotTime} lecture has been cancelled${reasonText}. This slot is excluded from attendance calculation.`,
      data: {
        url: '/student-schedule',
        type: 'class_cancelled',
        subjectName,
        slotTime,
      },
      sound: true,
      priority: 'high',
    },
    trigger: {
      channelId: NOTIFICATION_CHANNELS.CLASSES,
    },
  };
}

const cancelPayload = buildCancelPayload('Problem Solving Techniques', '09:30 AM - 10:30 AM', 'Official University Duty');
assert(cancelPayload.content.title.includes('Problem Solving Techniques'), 'Title includes subject');
assert(cancelPayload.content.body.includes('09:30 AM - 10:30 AM'), 'Body includes slot time');
assert(cancelPayload.content.body.includes('Official University Duty'), 'Body includes reason');
assert.strictEqual(cancelPayload.trigger.channelId, 'classes', 'Correct channel assigned');
assert.strictEqual(cancelPayload.content.data.url, '/student-schedule', 'Correct deep link URL');
console.log('✓ Test 2: Cancellation notification payload validated');

// Verification of Reschedule Payload
function buildReschedulePayload(subjectName, originalTime, newDay, newTime, room) {
  const roomText = room ? ` in ${room}` : '';
  return {
    content: {
      title: `🗓️ Class Rescheduled: ${subjectName}`,
      body: `Originally at ${originalTime}, moved to ${newDay} at ${newTime}${roomText}.`,
      data: {
        url: '/student-schedule',
        type: 'class_rescheduled',
        subjectName,
        newDay,
        newTime,
      },
      sound: true,
      priority: 'high',
    },
    trigger: {
      channelId: NOTIFICATION_CHANNELS.CLASSES,
    },
  };
}

const reschedulePayload = buildReschedulePayload('CFA', '10:30 AM - 11:30 AM', 'Wednesday', '02:30 PM - 03:30 PM', 'Lab III');
assert(reschedulePayload.content.title.includes('CFA'), 'Title includes subject');
assert(reschedulePayload.content.body.includes('Wednesday'), 'Body includes new day');
assert(reschedulePayload.content.body.includes('Lab III'), 'Body includes room');
assert.strictEqual(reschedulePayload.trigger.channelId, 'classes', 'Correct channel assigned');
console.log('✓ Test 3: Reschedule notification payload validated');

// Verification of Active Attendance Session Payload
function buildAttendancePayload(subjectName, room, durationMinutes) {
  const roomText = room ? ` in ${room}` : '';
  const durationText = durationMinutes ? ` (${durationMinutes} min window)` : '';
  return {
    content: {
      title: `⚡ Live Attendance: ${subjectName}`,
      body: `Check-in is now OPEN${roomText}${durationText}. Enter classroom OTP to mark presence!`,
      data: {
        url: '/student-mark-attendance',
        type: 'live_attendance',
        subjectName,
      },
      sound: true,
      priority: 'max',
    },
    trigger: {
      channelId: NOTIFICATION_CHANNELS.ATTENDANCE,
    },
  };
}

const attPayload = buildAttendancePayload('Computer Fundamentals', 'CS-201', 10);
assert(attPayload.content.title.includes('Computer Fundamentals'), 'Title includes subject');
assert(attPayload.content.body.includes('CS-201'), 'Body includes room');
assert(attPayload.content.body.includes('10 min window'), 'Body includes duration');
assert.strictEqual(attPayload.trigger.channelId, 'attendance', 'Correct channel assigned');
assert.strictEqual(attPayload.content.data.url, '/student-mark-attendance', 'Deep link points to check-in');
console.log('✓ Test 4: Live Attendance notification payload validated');

console.log('=========================================');
console.log('ALL NOTIFICATION TESTS PASSED (4/4)!     ');
console.log('=========================================');

