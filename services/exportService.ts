import type { FacultySessionReport } from '@/types/models';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function escapeCsvField(field: string | number): string {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface StudentReportRow {
  studentPublicId: string;
  studentName: string;
  attended: number;
  conducted: number;
  percentage: number;
  standing: string;
}

export const exportService = {
  generateSubjectCsv(
    subjectCode: string,
    subjectName: string,
    totalConducted: number,
    students: StudentReportRow[]
  ): string {
    const timestamp = new Date().toLocaleString();
    const rows: string[] = [
      `Dibrugarh University — Subject Attendance Report`,
      `Subject: ${subjectCode} - ${subjectName}`,
      `Total Classes Conducted: ${totalConducted}`,
      `Generated On: ${timestamp}`,
      ``,
      [
        'Roll Number',
        'Student Name',
        'Conducted Classes',
        'Attended Classes',
        'Missed Classes',
        'Attendance Percentage',
        'Exam Eligibility (75% Regulation)',
      ].join(','),
    ];

    students.forEach((st) => {
      const missed = Math.max(0, st.conducted - st.attended);
      const isEligible = st.percentage >= 75 ? 'Eligible' : st.percentage >= 50 ? 'Warning' : 'Critical (Not Eligible)';
      rows.push(
        [
          escapeCsvField(st.studentPublicId),
          escapeCsvField(st.studentName),
          escapeCsvField(st.conducted),
          escapeCsvField(st.attended),
          escapeCsvField(missed),
          escapeCsvField(`${st.percentage}%`),
          escapeCsvField(isEligible),
        ].join(',')
      );
    });

    return rows.join('\n');
  },

  generateMasterAuditCsv(reports: FacultySessionReport[]): string {
    const timestamp = new Date().toLocaleString();
    const rows: string[] = [
      `Dibrugarh University — Master Attendance Audit Log`,
      `Generated On: ${timestamp}`,
      `Total Sessions Recorded: ${reports.length}`,
      ``,
      [
        'Session Date',
        'Session ID',
        'Subject Code',
        'Subject Name',
        'Faculty Name',
        'Faculty ID',
        'Status',
        'Enrolled Students',
        'Present Count',
        'Absent Count',
        'Attendance Rate',
      ].join(','),
    ];

    reports.forEach((r) => {
      const dateStr = new Date(r.session.startedAt).toLocaleDateString();
      const attendanceRate = r.enrolledCount > 0 ? `${Math.round((r.presentCount / r.enrolledCount) * 100)}%` : '0%';
      rows.push(
        [
          escapeCsvField(dateStr),
          escapeCsvField(r.session.id),
          escapeCsvField(r.subject.code),
          escapeCsvField(r.subject.name),
          escapeCsvField(r.facultyUser.name),
          escapeCsvField(r.faculty.facultyId),
          escapeCsvField(r.session.status.toUpperCase()),
          escapeCsvField(r.enrolledCount),
          escapeCsvField(r.presentCount),
          escapeCsvField(r.absentCount),
          escapeCsvField(attendanceRate),
        ].join(',')
      );
    });

    return rows.join('\n');
  },

  async exportAndShareCsv(fileName: string, csvContent: string): Promise<{ ok: boolean; message: string }> {
    try {
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return { ok: true, message: `Report "${fileName}" downloaded.` };
        }
        return { ok: false, message: 'Web document not available.' };
      }

      // Native Mobile (Android / iOS)
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${fileName}`,
          UTI: 'public.comma-separated-values-text',
        });
        return { ok: true, message: `Report ready for sharing.` };
      }

      return { ok: true, message: `File saved to ${fileUri}` };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Failed to export CSV report.' };
    }
  },
};
