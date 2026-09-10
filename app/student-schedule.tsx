import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, ClassScheduleItem, DayOfWeek } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [scheduleItems, setScheduleItems] = useState<ClassScheduleItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (dayToLoad?: DayOfWeek) => {
    try {
      const user = await authService.getActiveUser();
      if (!user || user.role !== 'student') {
        router.replace('/student-login' as never);
        return;
      }

      const activeDay = dayToLoad ?? selectedDay;
      const [items, live] = await Promise.all([
        studentService.getSchedule(activeDay, user.id),
        attendanceService.getActiveSessionsForStudent(user.id),
      ]);

      setScheduleItems(items);
      setActiveSessions(live);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [router, selectedDay]);

  useFocusEffect(
    useCallback(() => {
      // Auto-detect current weekday on first focus
      const dayIndex = new Date().getDay();
      const currentWeekday: DayOfWeek = (dayIndex >= 1 && dayIndex <= 5) ? DAYS[dayIndex - 1] : 'Monday';
      setSelectedDay(currentWeekday);
      loadData(currentWeekday);
    }, [loadData])
  );

  const handleDaySelect = (day: DayOfWeek) => {
    setSelectedDay(day);
    loadData(day);
  };

  if (loading) {
    return <LoadingState message="Loading academic timetable..." />;
  }

  const liveSessionSubjectIds = new Set(activeSessions.map((s) => s.subjectId));

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        <Header
          title="Class Schedule"
          subtitle="BCA 1st Semester • Weekly Timetable"
          showBack={false}
        />

        {/* Day Selector Pills */}
        <View style={styles.daySelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
            {DAYS.map((day) => {
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => handleDaySelect(day)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                    {day.slice(0, 3)}
                  </Text>
                  <Text style={[styles.dayPillSubtext, isSelected && styles.dayPillSubtextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Day Header */}
        <View style={styles.daySummaryBar}>
          <View style={styles.daySummaryLeft}>
            <IconSymbol size={18} name="calendar" color={APP_COLORS.primary} />
            <Text style={styles.daySummaryTitle}>{`${selectedDay}'s Classes`}</Text>
          </View>
          <Text style={styles.daySummaryCount}>{scheduleItems.length} Sessions</Text>
        </View>

        {/* Schedule List */}
        <View style={styles.timelineList}>
          {scheduleItems.map((item, index) => {
            const isLive = liveSessionSubjectIds.has(item.subjectId);

            return (
              <Card
                key={item.id}
                style={[styles.classCard, isLive && styles.classCardLive]}
                padded={false}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.subjectMetaWrap}>
                    <View style={styles.subjectCodePill}>
                      <Text style={styles.subjectCodeText}>{item.subjectCode}</Text>
                    </View>
                    <View style={styles.timeWrap}>
                      <IconSymbol size={13} name="clock.fill" color={APP_COLORS.textSecondary} />
                      <Text style={styles.timeText}>{item.timeSlot}</Text>
                    </View>
                  </View>

                  {isLive ? (
                    <StatusBadge status="active" label="LIVE CLASS" size="small" />
                  ) : (
                    <View style={styles.orderPill}>
                      <Text style={styles.orderText}>Period {index + 1}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.className}>{item.subjectName}</Text>
                  
                  <View style={styles.locationInstructorRow}>
                    <View style={styles.infoBadge}>
                      <IconSymbol size={13} name="building.columns.fill" color={APP_COLORS.textMuted} />
                      <Text style={styles.infoBadgeText}>{item.room}</Text>
                    </View>
                    <View style={styles.infoBadge}>
                      <IconSymbol size={13} name="person.fill" color={APP_COLORS.textMuted} />
                      <Text style={styles.infoBadgeText}>{item.facultyName}</Text>
                    </View>
                  </View>
                </View>

                {isLive && (
                  <View style={styles.liveActionFooter}>
                    <Text style={styles.livePromptText}>Attendance is active right now!</Text>
                    <AppButton
                      title="Enter OTP"
                      onPress={() => router.push('/student-mark-attendance' as never)}
                      size="small"
                      variant="primary"
                    />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </AppScreen>

      <StudentBottomNav currentTab="schedule" hasActiveClass={activeSessions.length > 0} />
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
  daySelectorContainer: {
    paddingVertical: 12,
  },
  dayScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayPill: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 76,
  },
  dayPillActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  dayPillText: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  dayPillTextActive: {
    color: APP_COLORS.onPrimary,
  },
  dayPillSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  dayPillSubtextActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  daySummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  daySummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daySummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  daySummaryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  timelineList: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  classCard: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  classCardLive: {
    borderColor: APP_COLORS.success,
    backgroundColor: '#12222D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  subjectMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectCodePill: {
    backgroundColor: APP_COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.primary,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  orderPill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  cardBody: {
    padding: 16,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 10,
    lineHeight: 22,
  },
  locationInstructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoBadgeText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  liveActionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: APP_COLORS.successSoft,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  livePromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.success,
  },
});

