import { isCloudConfigured, supabase } from '@/config/cloud';
import type { AttendanceRecord, AttendanceSession, Role, User } from '@/types/models';

// Map PostgreSQL snake_case to frontend camelCase
function toSessionModel(row: any): AttendanceSession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    facultyId: row.faculty_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    status: row.status,
    otp: row.otp,
    otpExpiresAt: row.otp_expires_at,
    cancelledAt: row.cancelled_at ?? null,
  };
}

function toRecordModel(row: any): AttendanceRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    studentId: row.student_id,
    status: row.status,
    markedAt: row.marked_at,
    markedBy: row.marked_by,
    markedByUserId: row.marked_by_user_id ?? null,
  };
}

function toUserModel(row: any): User {
  return {
    id: row.id,
    role: row.role as Role,
    name: row.name,
    username: row.username,
    active: row.active,
    developmentPassword: row.password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const cloudService = {
  isOnline(): boolean {
    return isCloudConfigured() && supabase !== null;
  },

  // --------------------------------------------------------------------------
  // Authentication & Users
  // --------------------------------------------------------------------------
  async authenticateUser(username: string, password: string): Promise<User | null> {
    if (!this.isOnline() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username.trim())
        .eq('active', true)
        .single();

      if (error || !data) return null;
      if (data.password !== password) return null;
      return toUserModel(data);
    } catch {
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // Attendance Sessions
  // --------------------------------------------------------------------------
  async getActiveSessions(): Promise<AttendanceSession[]> {
    if (!this.isOnline() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('status', 'active');

      if (error || !data) return [];
      return data.map(toSessionModel);
    } catch {
      return [];
    }
  },

  async createSession(session: AttendanceSession): Promise<boolean> {
    if (!this.isOnline() || !supabase) return false;
    try {
      const { error } = await supabase.from('attendance_sessions').insert({
        id: session.id,
        subject_id: session.subjectId,
        faculty_id: session.facultyId,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        status: session.status,
        otp: session.otp,
        otp_expires_at: session.otpExpiresAt,
        cancelled_at: session.cancelledAt,
      });
      return !error;
    } catch {
      return false;
    }
  },

  async updateSession(sessionId: string, updates: Partial<AttendanceSession>): Promise<boolean> {
    if (!this.isOnline() || !supabase) return false;
    try {
      const payload: Record<string, any> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.endedAt !== undefined) payload.ended_at = updates.endedAt;
      if (updates.cancelledAt !== undefined) payload.cancelled_at = updates.cancelledAt;
      if (updates.otp) payload.otp = updates.otp;
      if (updates.otpExpiresAt) payload.otp_expires_at = updates.otpExpiresAt;

      const { error } = await supabase
        .from('attendance_sessions')
        .update(payload)
        .eq('id', sessionId);
      return !error;
    } catch {
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // Attendance Records
  // --------------------------------------------------------------------------
  async createAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    if (!this.isOnline() || !supabase) return false;
    try {
      const { error } = await supabase.from('attendance_records').insert({
        id: record.id,
        session_id: record.sessionId,
        student_id: record.studentId,
        status: record.status,
        marked_at: record.markedAt,
        marked_by: record.markedBy,
        marked_by_user_id: record.markedByUserId,
      });
      return !error;
    } catch {
      return false;
    }
  },

  async getSessionRecords(sessionId: string): Promise<AttendanceRecord[]> {
    if (!this.isOnline() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId);

      if (error || !data) return [];
      return data.map(toRecordModel);
    } catch {
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // Real-Time Subscriptions
  // --------------------------------------------------------------------------
  subscribeToActiveSessions(onSessionChanged: () => void): () => void {
    if (!this.isOnline() || !supabase) return () => {};

    try {
      const channel = supabase
        .channel('public:attendance_sessions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance_sessions' },
          () => {
            onSessionChanged();
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } catch {
      return () => {};
    }
  },

  subscribeToSessionRoster(
    sessionId: string,
    onRecordAddedOrUpdated: (record: AttendanceRecord) => void
  ): () => void {
    if (!this.isOnline() || !supabase) return () => {};

    try {
      const channel = supabase
        .channel(`public:attendance_records:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.new) {
              onRecordAddedOrUpdated(toRecordModel(payload.new));
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } catch {
      return () => {};
    }
  },
};
