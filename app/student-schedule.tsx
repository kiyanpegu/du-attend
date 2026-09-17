import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StudentBottomNav } from '@/components/app/StudentBottomNav';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { studentService } from '@/services/studentService';
import type { AttendanceSession, ClassScheduleItem, DayOfWeek } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getClassTimelineStatus(timeSlot: string, isLive: boolean, isSelectedDayToday: boolean): 'live' | 'past' | 'upcoming' {
  if (isLive) return 'live';
  if (!isSelectedDayToday) return 'upcoming';

  try {
    const parts = timeSlot.split(' - ');
    if (parts.length < 2) return 'upcoming';

    const endPart = parts[1].trim();
    const [timeStr, meridiem] = endPart.split(' ');
    const [hourStr, minStr] = timeStr.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minStr, 10) || 0;

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    const classEndTime = new Date();
    classEndTime.setHours(hours, minutes, 0, 0);

    if (now > classEndTime) {
      return 'past';
    }
    return 'upcoming';
  } catch {
    return 'upcoming';
  }
}

export default function StudentScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [todayWeekday, setTodayWeekday] = useState<DayOfWeek>('Monday');
  const [scheduleItems, setScheduleItems] = useState<ClassScheduleItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedDayRef = useRef<DayOfWeek>('Monday');
  const hasInitializedRef = useRef(false);

  const loadScheduleForDay = useCallback(async (dayToLoad: DayOfWeek) => {
    try {
      const user = await authService.getActiveUser();
      if (!user || user.role !== 'student') {
        router.replace('/student-login' as never);
        return;
      }

      const [items, live] = await Promise.all([
        studentService.getSchedule(dayToLoad, user.id),
        attendanceService.getActiveSessionsForStudent(user.id),
      ]);

      setScheduleItems(items);
      setActiveSessions(live);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      // Auto-detect current weekday on initial focus
      const dayIndex = new Date().getDay();
      const currentWeekday: DayOfWeek = (dayIndex >= 1 && dayIndex <= 5) ? DAYS[dayIndex - 1] : 'Monday';
      setTodayWeekday(currentWeekday);

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        selectedDayRef.current = currentWeekday;
        setSelectedDay(currentWeekday);
        loadScheduleForDay(currentWeekday);
      } else {
        loadScheduleForDay(selectedDayRef.current);
      }
    }, [loadScheduleForDay])
  );

  const handleDaySelect = (day: DayOfWeek) => {
    selectedDayRef.current = day;
    setSelectedDay(day);
    loadScheduleForDay(day);
  };

  if (loading) {
    return <LoadingState message="Loading academic timetable..." />;
  }

  const liveSessionSubjectIds = new Set(activeSessions.map((s) => s.subjectId));
  const isSelectedDayToday = selectedDay === todayWeekday;

  return (
    <View style={styles.screen}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        {/* Screen Header */}
        <View style={styles.headerWrapper}>
          <Header
            title="Class Schedule"
            subtitle="BCA 1st Semester • Weekly Timetable"
            showBack={false}
          />
        </View>

        {/* Academic Context Bar */}
        <View style={styles.contextBar}>
          <View style={styles.contextLeft}>
            <View style={styles.contextIconCircle}>
              <IconSymbol size={15} name="building.columns.fill" color={APP_COLORS.primaryWarm} />
            </View>
            <View style={styles.contextTextWrapper}>
              <Text style={styles.contextTitle} numberOfLines={1}>
                Centre for Computer Science (CCSA)
              </Text>
              <Text style={styles.contextSub} numberOfLines={1}>
                Dibrugarh University • Regular Timetable
              </Text>
            </View>
          </View>
          {isSelectedDayToday && (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>TODAY</Text>
            </View>
          )}
        </View>

        {/* Tactile Day Selector */}
        <View style={styles.daySelectorArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScroll}
          >
            {DAYS.map((day) => {
              const isSelected = day === selectedDay;
              const isDayToday = day === todayWeekday;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayTab,
                    isSelected ? styles.dayTabSelected : styles.dayTabUnselected,
                  ]}
                  onPress={() => handleDaySelect(day)}
                  activeOpacity={0.75}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.dayTabHeader}>
                    <Text
                      style={[
                        styles.dayTabShort,
                        isSelected ? styles.dayTabShortSelected : styles.dayTabShortUnselected,
                      ]}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </Text>
                    {isDayToday && (
                      <View
                        style={[
                          styles.todayDot,
                          isSelected ? styles.todayDotSelected : styles.todayDotUnselected,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.dayTabFull,
                      isSelected ? styles.dayTabFullSelected : styles.dayTabFullUnselected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Day Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryTitle}>{`${selectedDay}'s Classes`}</Text>
            <Text style={styles.summarySub}>
              {scheduleItems.length === 0
                ? 'No classes scheduled'
                : `${scheduleItems.length} Lecture${scheduleItems.length === 1 ? '' : 's'} Planned`}
            </Text>
          </View>
          {isSelectedDayToday && activeSessions.length > 0 && (
            <View style={styles.activeClassIndicator}>
              <View style={styles.activePulseDot} />
              <Text style={styles.activeIndicatorText}>SESSION LIVE</Text>
            </View>
          )}
        </View>

        {/* Schedule Items List */}
        <View style={styles.scheduleList}>
          {scheduleItems.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={`No Classes on ${selectedDay}`}
              message="There are no academic lectures scheduled for this day in the BCA 1st Semester syllabus."
            />
          ) : (
            scheduleItems.map((item, index) => {
              const isLive = liveSessionSubjectIds.has(item.subjectId);
              const timelineStatus = getClassTimelineStatus(item.timeSlot, isLive, isSelectedDayToday);
              const isPast = timelineStatus === 'past';

              return (
                <Card
                  key={item.id}
                  style={[
                    styles.classCard,
                    isLive && styles.classCardLive,
                    isPast && styles.classCardPast,
                  ]}
                  padded={false}
                >
                  <View style={styles.classCardInner}>
                    {/* Header Row: Time and Status */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.timeBadge, isLive && styles.timeBadgeLive]}>
                        <IconSymbol
                          size={13}
                          name="clock.fill"
                          color={isLive ? APP_COLORS.primaryWarm : APP_COLORS.textSecondary}
                        />
                        <Text style={[styles.timeBadgeText, isLive && styles.timeBadgeTextLive]}>
                          {item.timeSlot}
                        </Text>
                      </View>

                      {isLive ? (
                        <View style={styles.livePill}>
                          <View style={styles.liveDot} />
                          <Text style={styles.livePillText}>CLASS LIVE</Text>
                        </View>
                      ) : isPast ? (
                        <View style={styles.pastPill}>
                          <IconSymbol size={11} name="checkmark" color={APP_COLORS.textMuted} />
                          <Text style={styles.pastPillText}>Completed</Text>
                        </View>
                      ) : (
                        <Text style={styles.periodText}>{`Period ${index + 1}`}</Text>
                      )}
                    </View>

                    {/* Subject Title and Course Code */}
                    <View style={styles.subjectBlock}>
                      <View style={styles.codeRow}>
                        <View style={styles.courseCodePill}>
                          <Text style={styles.courseCodeText}>{item.subjectCode}</Text>
                        </View>
                        <Text style={styles.syllabusTag}>Core Theory</Text>
                      </View>
                      <Text
                        style={[styles.subjectName, isPast && styles.subjectNamePast]}
                        numberOfLines={2}
                      >
                        {item.subjectName}
                      </Text>
                    </View>

                    {/* Metadata Row: Room and Faculty */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <IconSymbol size={13} name="building.columns.fill" color={APP_COLORS.textMuted} />
                        <Text style={styles.metaItemText}>{item.room}</Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <IconSymbol size={13} name="person.fill" color={APP_COLORS.textMuted} />
                        <Text style={styles.metaItemText} numberOfLines={1}>
                          {item.facultyName}
                        </Text>
                      </View>
                    </View>

                    {/* Urgent Action Banner if Class is Live */}
                    {isLive && (
                      <View style={styles.liveActionFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.liveActionPrompt}>Attendance is active right now</Text>
                          <Text style={styles.liveActionSub}>Verify OTP to record presence</Text>
                        </View>
                        <AppButton
                          title="Enter OTP"
                          onPress={() => router.push('/student-mark-attendance' as never)}
                          size="small"
                          variant="primary"
                        />
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </AppScreen>

      {/* Persistent Bottom Nav Dock */}
      <StudentBottomNav currentTab="schedule" hasActiveClass={activeSessions.length > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.canvas,
  },
  scrollContent: {
    padding: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
    backgroundColor: APP_COLORS.canvas,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* Academic Context Bar */
  contextBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  contextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contextTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  contextSub: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    marginTop: 1,
  },
  todayPill: {
    flexShrink: 0,
    backgroundColor: '#EEFAF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.safeText,
    letterSpacing: 0.5,
  },

  /* Tactile Day Selector */
  daySelectorArea: {
    marginBottom: 16,
  },
  dayScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  dayTabSelected: {
    backgroundColor: APP_COLORS.obsidian,
    shadowColor: '#18191E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  dayTabUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  dayTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayTabShort: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dayTabShortSelected: {
    color: '#FFFFFF',
  },
  dayTabShortUnselected: {
    color: APP_COLORS.text,
  },
  dayTabFull: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  dayTabFullSelected: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  dayTabFullUnselected: {
    color: APP_COLORS.textMuted,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  todayDotSelected: {
    backgroundColor: APP_COLORS.secondaryWarm,
  },
  todayDotUnselected: {
    backgroundColor: APP_COLORS.primaryWarm,
  },

  /* Selected Day Summary Bar */
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  activeClassIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  activeIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.4,
  },

  /* Schedule Items List */
  scheduleList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.borderSubtle,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  classCardLive: {
    borderColor: 'rgba(255, 94, 54, 0.35)',
    backgroundColor: '#FFFDFD',
  },
  classCardPast: {
    opacity: 0.78,
  },
  classCardInner: {
    padding: 16,
  },

  /* Card Header Row */
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeBadgeLive: {
    backgroundColor: '#FFF1ED',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  timeBadgeTextLive: {
    color: APP_COLORS.primaryWarm,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.primaryWarm,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.primaryWarm,
    letterSpacing: 0.3,
  },
  pastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  pastPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.textMuted,
  },

  /* Subject Block */
  subjectBlock: {
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  courseCodePill: {
    backgroundColor: APP_COLORS.categoryBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.categoryText,
  },
  syllabusTag: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    lineHeight: 22,
  },
  subjectNamePast: {
    color: APP_COLORS.textSecondary,
  },

  /* Meta Row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.subSurface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: APP_COLORS.border,
  },

  /* Live Action Footer */
  liveActionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 94, 54, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveActionPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.primaryWarm,
  },
  liveActionSub: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    marginTop: 1,
  },
});

