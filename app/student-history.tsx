import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { subjectService } from '@/services/subjectService';
import type { AttendanceHistoryItem, AttendanceSession, DateFilter, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function formatSessionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    return `${dateFormatted} • ${timeStr}`;
  } catch {
    return dateStr;
  }
}

export default function StudentHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'present' | 'absent' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<DateFilter>('all');
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await authService.getActiveUser();

      if (!user || user.role !== 'student') {
        router.replace('/student-login' as never);
        return;
      }

      const [allHistory, allSubjects, live] = await Promise.all([
        attendanceService.getStudentHistory(user.id, {
          subjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
          status: selectedStatus,
          date: selectedDate,
        }),
        subjectService.listSubjects(),
        attendanceService.getActiveSessionsForStudent(user.id),
      ]);

      setHistory(allHistory);
      setSubjects(allSubjects);
      setActiveSessions(live);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [router, selectedSubjectId, selectedStatus, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const presentCount = history.filter((h) => h.status === 'present').length;
  const absentCount = history.filter((h) => h.status === 'absent').length;
  const cancelledCount = history.filter((h) => h.status === 'cancelled').length;

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        <Header
          title="Session History"
          subtitle="Verified Lecture Timeline"
          showBack={false}
          rightAction={{
            icon: 'arrow.clockwise',
            onPress: loadData,
            label: 'Refresh',
          }}
        />

        {/* Quick Context Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: APP_COLORS.safeText }]} />
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={[styles.summaryValue, { color: APP_COLORS.safeText }]}>{presentCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: APP_COLORS.shortageText }]} />
            <Text style={styles.summaryLabel}>Absent</Text>
            <Text style={[styles.summaryValue, { color: APP_COLORS.shortageText }]}>{absentCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: APP_COLORS.textMuted }]} />
            <Text style={styles.summaryLabel}>Total Logged</Text>
            <Text style={styles.summaryValue}>{history.length}</Text>
          </View>
        </View>

        {/* Filter Controls */}
        <View style={styles.filterCard}>
          {/* Status Filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterTitle}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {[
                { id: 'all', label: `All (${history.length})` },
                { id: 'present', label: `Present (${presentCount})` },
                { id: 'absent', label: `Absent (${absentCount})` },
                ...(cancelledCount > 0 ? [{ id: 'cancelled', label: `Cancelled (${cancelledCount})` }] : []),
              ].map((item) => {
                const active = selectedStatus === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(item.id as never)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Subject Filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterTitle}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedSubjectId('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, selectedSubjectId === 'all' && styles.filterChipTextActive]}>
                  All Subjects
                </Text>
              </TouchableOpacity>
              {subjects.map((sub) => {
                const active = selectedSubjectId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedSubjectId(sub.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {sub.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Range Filter */}
          <View style={styles.filterRowNoMargin}>
            <Text style={styles.filterTitle}>TIME RANGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Past 7 Days' },
                { id: 'month', label: 'Past 30 Days' },
              ].map((item) => {
                const active = selectedDate === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedDate(item.id as DateFilter)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Timeline Records */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>TIMELINE RECORDS</Text>
          <Text style={styles.listHeaderCount}>
            {history.length} {history.length === 1 ? 'session' : 'sessions'}
          </Text>
        </View>

        {loading ? (
          <LoadingState message="Loading attendance history..." />
        ) : history.length === 0 ? (
          <EmptyState
            icon="clock.arrow.circlepath"
            title="No Attendance Records"
            message="No attendance sessions matched your selected filter criteria."
            action={
              selectedStatus !== 'all' || selectedSubjectId !== 'all' || selectedDate !== 'all' ? (
                <AppButton
                  title="Reset Filters"
                  size="small"
                  variant="outline"
                  onPress={() => {
                    setSelectedStatus('all');
                    setSelectedSubjectId('all');
                    setSelectedDate('all');
                  }}
                />
              ) : undefined
            }
          />
        ) : (
          <View style={styles.timelineList}>
            {history.map((item, idx) => {
              const isPresent = item.status === 'present';
              const isAbsent = item.status === 'absent';
              const isCancelled = item.sessionStatus === 'cancelled' || item.status === 'cancelled';

              return (
                <View key={`${item.sessionId}-${idx}`} style={styles.timelineRow}>
                  {/* Left Timeline Track */}
                  <View style={styles.timelineTrack}>
                    <View
                      style={[
                        styles.timelineNode,
                        isPresent
                          ? styles.timelineNodePresent
                          : isAbsent
                          ? styles.timelineNodeAbsent
                          : styles.timelineNodeCancelled,
                      ]}
                    >
                      <IconSymbol
                        size={12}
                        name={isPresent ? 'checkmark' : isAbsent ? 'xmark' : 'exclamationmark.triangle'}
                        color={
                          isPresent
                            ? APP_COLORS.safeText
                            : isAbsent
                            ? APP_COLORS.shortageText
                            : APP_COLORS.textMuted
                        }
                      />
                    </View>
                    {idx < history.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Right Record Card */}
                  <Card style={styles.recordCard} padded>
                    {/* Top Row: Course Code + Date + Status Badge */}
                    <View style={styles.recordTopRow}>
                      <View style={styles.recordCodePill}>
                        <Text style={styles.recordCodeText}>{item.subjectCode}</Text>
                      </View>
                      <Text style={styles.recordDateText}>{formatSessionDate(item.date)}</Text>
                      <StatusBadge
                        status={isPresent ? 'present' : isAbsent ? 'critical' : 'warning'}
                        label={isCancelled ? 'CANCELLED' : isPresent ? 'PRESENT' : 'ABSENT'}
                        size="small"
                      />
                    </View>

                    {/* Subject Name */}
                    <Text style={styles.recordSubjectName} numberOfLines={2}>
                      {item.subjectName}
                    </Text>

                    {/* Metadata Row: Faculty & Verification Method */}
                    <View style={styles.recordMetaRow}>
                      <View style={styles.recordMetaItem}>
                        <IconSymbol size={13} name="person" color={APP_COLORS.textMuted} />
                        <Text style={styles.recordMetaText}>{item.facultyName}</Text>
                      </View>
                      {!isCancelled && item.method !== 'none' && (
                        <>
                          <Text style={styles.recordMetaDot}>•</Text>
                          <View style={styles.recordMetaItem}>
                            <IconSymbol
                              size={12}
                              name={item.method === 'otp' ? 'key.fill' : 'pencil'}
                              color={APP_COLORS.textMuted}
                            />
                            <Text style={styles.recordMetaText}>
                              {item.method === 'otp' ? 'OTP Verified' : 'Faculty Marked'}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </AppScreen>

      <StudentBottomNav currentTab="history" hasActiveClass={activeSessions.length > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.canvas,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: APP_COLORS.borderSubtle,
  },
  filterCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: TOKENS.spacing.md,
    marginBottom: TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterRowNoMargin: {
    marginBottom: 0,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.subSurface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
    shadowColor: '#18191E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  timelineList: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  timelineTrack: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    zIndex: 2,
  },
  timelineNodePresent: {
    backgroundColor: APP_COLORS.safeBg,
    borderWidth: 1.5,
    borderColor: 'rgba(23, 135, 84, 0.3)',
  },
  timelineNodeAbsent: {
    backgroundColor: APP_COLORS.shortageBg,
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  timelineNodeCancelled: {
    backgroundColor: APP_COLORS.subSurface,
    borderWidth: 1.5,
    borderColor: APP_COLORS.borderSubtle,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: APP_COLORS.borderSubtle,
    marginTop: 4,
  },
  recordCard: {
    flex: 1,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.lg,
  },
  recordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordCodePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.xs,
  },
  recordCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  recordDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  recordSubjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  recordMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordMetaText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  recordMetaDot: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
  },
});
