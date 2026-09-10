import { AppScreen } from '@/components/app/AppScreen';
import { AttendanceCard } from '@/components/app/AttendanceCard';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { subjectService } from '@/services/subjectService';
import type { AttendanceHistoryItem, AttendanceSession, DateFilter, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    setLoading(false);
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
        <Header title="Session History" subtitle="Verification Records & Logs" showBack={false} />

        {/* Quick Summary Bar */}
        <View style={styles.summaryStatsCard}>
          <View style={styles.summaryStatItem}>
            <View style={styles.summaryStatIconWrap}>
              <IconSymbol size={16} name="checkmark" color={APP_COLORS.success} />
            </View>
            <View>
              <Text style={styles.summaryStatNumber}>{presentCount}</Text>
              <Text style={styles.summaryStatLabel}>Present</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStatItem}>
            <View style={[styles.summaryStatIconWrap, { backgroundColor: `${APP_COLORS.danger}15` }]}>
              <IconSymbol size={16} name="xmark" color={APP_COLORS.danger} />
            </View>
            <View>
              <Text style={styles.summaryStatNumber}>{absentCount}</Text>
              <Text style={styles.summaryStatLabel}>Absent</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStatItem}>
            <View style={[styles.summaryStatIconWrap, { backgroundColor: `${APP_COLORS.primary}15` }]}>
              <IconSymbol size={16} name="clock.arrow.circlepath" color={APP_COLORS.primary} />
            </View>
            <View>
              <Text style={styles.summaryStatNumber}>{history.length}</Text>
              <Text style={styles.summaryStatLabel}>Filtered</Text>
            </View>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          {/* Status Filters */}
          <Text style={styles.filterLabel}>STATUS FILTER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'present', label: `Present (${presentCount})` },
              { id: 'absent', label: `Absent (${absentCount})` },
              { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterChip, selectedStatus === item.id && styles.filterChipActive]}
                onPress={() => setSelectedStatus(item.id as never)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, selectedStatus === item.id && styles.filterChipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subject Filters */}
          <Text style={styles.filterLabel}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSubjectId === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedSubjectId('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterChipText, selectedSubjectId === 'all' && styles.filterChipTextActive]}
              >
                All Subjects
              </Text>
            </TouchableOpacity>
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[styles.filterChip, selectedSubjectId === sub.id && styles.filterChipActive]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, selectedSubjectId === sub.id && styles.filterChipTextActive]}
                >
                  {sub.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date Filters */}
          <Text style={styles.filterLabel}>TIME RANGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Past 7 Days' },
              { id: 'month', label: 'Past 30 Days' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterChip, selectedDate === item.id && styles.filterChipActive]}
                onPress={() => setSelectedDate(item.id as DateFilter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, selectedDate === item.id && styles.filterChipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Header */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            Showing {history.length} record{history.length === 1 ? '' : 's'}
          </Text>
        </View>

        {loading ? (
          <LoadingState message="Loading attendance history..." />
        ) : history.length === 0 ? (
          <EmptyState
            icon="clock.arrow.circlepath"
            title="No History Found"
            message="No attendance sessions matched your selected filters."
          />
        ) : (
          history.map((item, idx) => (
            <AttendanceCard key={`${item.sessionId}-${idx}`} item={item} />
          ))
        )}
      </AppScreen>

      <StudentBottomNav currentTab="history" hasActiveClass={activeSessions.length > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  summaryStatsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  summaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  summaryStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${APP_COLORS.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: APP_COLORS.border,
  },
  filterSection: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: APP_COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
});
