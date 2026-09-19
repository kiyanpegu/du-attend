const fs = require('fs');
const roster = fs.readFileSync('constants/ccsaRoster.ts', 'utf8');

const lines = roster.split('\n');
let foundUser = false;
let userJson = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"username": "kiyan"')) {
    console.log('User found around line', i);
    console.log(lines.slice(Math.max(0, i - 5), i + 6).join('\n'));
    break;
  }
}

let enrCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"student-bca1-053"')) {
    console.log('Enrollment found at line', i, lines[i + 1] || '');
    enrCount++;
  }
}
console.log('Total enrollments for student-bca1-053:', enrCount);


