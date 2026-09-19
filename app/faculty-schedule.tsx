import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import { CANCELLATION_REASONS, RESCHEDULE_TIME_SLOTS, scheduleService } from '@/services/scheduleService';
import type { ClassScheduleItem, DayOfWeek, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function FacultyScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [todayWeekday, setTodayWeekday] = useState<DayOfWeek>('Monday');
  const [scheduleItems, setScheduleItems] = useState<ClassScheduleItem[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const selectedDayRef = useRef<DayOfWeek>('Monday');
  const hasInitializedRef = useRef(false);

  // Cancellation Modal State
  const [cancelModalItem, setCancelModalItem] = useState<ClassScheduleItem | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Reschedule Modal State
  const [rescheduleModalItem, setRescheduleModalItem] = useState<ClassScheduleItem | null>(null);
  const [targetDay, setTargetDay] = useState<DayOfWeek>('Monday');
  const [targetTimeSlot, setTargetTimeSlot] = useState<string>(RESCHEDULE_TIME_SLOTS[1]);
  const [targetRoom, setTargetRoom] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const loadSchedule = useCallback(async (day: DayOfWeek) => {
    try {
      const user = await authService.getActiveUser();
      if (!user || user.role !== 'faculty') {
        router.replace('/faculty-login' as never);
        return;
      }

      const [items, assigned] = await Promise.all([
        scheduleService.getScheduleForDay(day, user.id, 'faculty'),
        facultyService.getAssignedSubjects(user.id),
      ]);

      setScheduleItems(items);
      setAssignedSubjects(assigned);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const dayIndex = new Date().getDay();
      const currentWeekday: DayOfWeek = (dayIndex >= 1 && dayIndex <= 5) ? DAYS[dayIndex - 1] : 'Monday';
      setTodayWeekday(currentWeekday);

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        selectedDayRef.current = currentWeekday;
        setSelectedDay(currentWeekday);
        loadSchedule(currentWeekday);
      } else {
        loadSchedule(selectedDayRef.current);
      }
    }, [loadSchedule])
  );

  const handleDaySelect = (day: DayOfWeek) => {
    selectedDayRef.current = day;
    setSelectedDay(day);
    loadSchedule(day);
  };

  const assignedSubjectIds = useMemo(
    () => new Set(assignedSubjects.map((s) => s.id)),
    [assignedSubjects]
  );

  const displayedItems = useMemo(() => {
    if (filterMode === 'all') return scheduleItems;
    return scheduleItems.filter((item) => assignedSubjectIds.has(item.subjectId));
  }, [scheduleItems, filterMode, assignedSubjectIds]);

  // Cancel Flow
  const openCancelModal = (item: ClassScheduleItem) => {
    setCancelModalItem(item);
    setSelectedReason(CANCELLATION_REASONS[0]);
    setCustomReason('');
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModalItem) return;
    const finalReason = customReason.trim() || selectedReason;

    setActionLoading(true);
    try {
      const user = await authService.getActiveUser();
      if (!user) return;

      const result = await scheduleService.cancelClass(user.id, cancelModalItem.id, finalReason);
      setActionLoading(false);
      setCancelModalItem(null);

      if (result.ok) {
        Alert.alert('Class Cancelled', result.message);
        loadSchedule(selectedDayRef.current);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      setActionLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while cancelling the class.');
    }
  };

  // Reschedule Flow
  const openRescheduleModal = (item: ClassScheduleItem) => {
    setRescheduleModalItem(item);
    setTargetDay(selectedDay);
    setTargetTimeSlot(item.timeSlot || RESCHEDULE_TIME_SLOTS[1]);
    setTargetRoom(item.room || '');
    setRescheduleReason('');
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalItem) return;

    setActionLoading(true);
    try {
      const user = await authService.getActiveUser();
      if (!user) return;

      const result = await scheduleService.rescheduleClass(
        user.id,
        rescheduleModalItem.id,
        targetDay,
        targetTimeSlot,
        targetRoom,
        rescheduleReason
      );

      setActionLoading(false);
      setRescheduleModalItem(null);

      if (result.ok) {
        Alert.alert('Class Rescheduled', result.message);
        loadSchedule(selectedDayRef.current);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      setActionLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while rescheduling the class.');
    }
  };

  // Restore Flow
  const handleRestoreClass = async (overrideId: string, subjectName: string) => {
    Alert.alert(
      'Restore Class',
      `Restore ${subjectName} back to its regular academic schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            const user = await authService.getActiveUser();
            if (!user) return;

            const result = await scheduleService.restoreClass(user.id, overrideId);
            setActionLoading(false);

            if (result.ok) {
              Alert.alert('Class Restored', result.message);
              loadSchedule(selectedDayRef.current);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  // Start Class Shortcut
  const handleStartAttendance = async (subjectId: string) => {
    const user = await authService.getActiveUser();
    if (!user) return;

    const active = await attendanceService.getActiveSessionForFaculty(user.id);
    if (active) {
      router.push('/faculty-active-class' as never);
      return;
    }

    const startRes = await attendanceService.startClass(user.id, subjectId);
    if (startRes.ok) {
      router.push('/faculty-active-class' as never);
    } else {
      Alert.alert('Unable to Start Attendance', startRes.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading faculty teaching schedule..." />;
  }

  const isSelectedDayToday = selectedDay === todayWeekday;

  return (
    <AppScreen scrollable contentContainerStyle={styles.screenScroll}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/faculty-dashboard' as never)}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="chevron.left" color={APP_COLORS.text} />
        </TouchableOpacity>
        <View style={styles.navTitles}>
          <Text style={styles.navTitle}>Teaching Schedule</Text>
          <Text style={styles.navSubtitle}>Manage, Reschedule & Cancel Classes</Text>
        </View>
      </View>

      {/* Academic Context Bar */}
      <View style={styles.contextBar}>
        <View style={styles.contextLeft}>
          <View style={styles.contextIconCircle}>
            <IconSymbol size={15} name="building.columns.fill" color={APP_COLORS.primaryWarm} />
          </View>
          <View style={styles.contextTextWrapper}>
            <Text style={styles.contextTitle} numberOfLines={1}>
              BCA 1st Semester • CCSA
            </Text>
            <Text style={styles.contextSub} numberOfLines={1}>
              Dibrugarh University Academic Timetable
            </Text>
          </View>
        </View>
        {isSelectedDayToday && (
          <View style={styles.todayPill}>
            <Text style={styles.todayPillText}>TODAY</Text>
          </View>
        )}
      </View>

      {/* Day Selector */}
      <View style={styles.daySelectorArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map((day) => {
            const isSelected = day === selectedDay;
            const isToday = day === todayWeekday;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillSelected,
                  isToday && !isSelected && styles.dayPillToday,
                ]}
                onPress={() => handleDaySelect(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    isSelected && styles.dayPillTextSelected,
                    isToday && !isSelected && styles.dayPillTextToday,
                  ]}
                >
                  {day.slice(0, 3)}
                </Text>
                {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Toggle: My Classes vs All */}
      <View style={styles.filterRow}>
        <View style={styles.filterSegmentWrap}>
          <TouchableOpacity
            style={[styles.filterSegmentBtn, filterMode === 'my' && styles.filterSegmentActive]}
            onPress={() => setFilterMode('my')}
          >
            <Text style={[styles.filterSegmentText, filterMode === 'my' && styles.filterSegmentTextActive]}>
              My Classes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterSegmentBtn, filterMode === 'all' && styles.filterSegmentActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterSegmentText, filterMode === 'all' && styles.filterSegmentTextActive]}>
              All Classes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule Items List */}
      <View style={styles.itemsList}>
        {displayedItems.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No Classes Scheduled"
            message={`No classes found for ${selectedDay} under current filter.`}
          />
        ) : (
          displayedItems.map((item) => {
            const isMine = assignedSubjectIds.has(item.subjectId);
            const isCancelled = item.status === 'cancelled';
            const isRescheduledAway = item.status === 'rescheduled';
            const isRescheduledIn = !!item.rescheduledFrom;
            const isLive = item.status === 'live';

            return (
              <Card
                key={item.id}
                style={[
                  styles.classCard,
                  isCancelled && styles.cardCancelled,
                  isLive && styles.cardLive,
                ]}
                padded
              >
                {/* Header: Time, Room & Status */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.timeBadge}>
                    <IconSymbol size={13} name="clock.fill" color={APP_COLORS.textSecondary} />
                    <Text style={styles.timeBadgeText}>{item.timeSlot}</Text>
                  </View>

                  <View style={styles.headerRight}>
                    <View style={styles.roomPill}>
                      <Text style={styles.roomPillText}>{item.room}</Text>
                    </View>

                    {isLive && (
                      <View style={styles.livePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.livePillText}>LIVE NOW</Text>
                      </View>
                    )}

                    {isCancelled && (
                      <View style={styles.cancelledPill}>
                        <Text style={styles.cancelledPillText}>CANCELLED</Text>
                      </View>
                    )}

                    {isRescheduledAway && (
                      <View style={styles.rescheduledPill}>
                        <Text style={styles.rescheduledPillText}>RESCHEDULED</Text>
                      </View>
                    )}

                    {isRescheduledIn && (
                      <View style={styles.extraPill}>
                        <Text style={styles.extraPillText}>RESCHEDULED SLOT</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Subject Name & Details */}
                <View style={styles.cardBody}>
                  <Text style={[styles.subjectName, isCancelled && styles.textStrikethrough]}>
                    {item.subjectName}
                  </Text>
                  <Text style={styles.subjectMeta}>
                    {item.subjectCode} • {item.facultyName} {isMine && '• (Assigned to You)'}
                  </Text>
                </View>

                {/* Cancelled Notice */}
                {isCancelled && (
                  <View style={styles.noticeBannerCancelled}>
                    <IconSymbol size={15} name="exclamationmark.triangle.fill" color={APP_COLORS.danger} />
                    <Text style={styles.noticeTextCancelled}>
                      Reason: {item.cancellationReason || 'Faculty unavailable'}
                    </Text>
                  </View>
                )}

                {/* Rescheduled Notice */}
                {isRescheduledAway && item.rescheduledTo && (
                  <View style={styles.noticeBannerRescheduled}>
                    <IconSymbol size={15} name="arrow.triangle.swap" color={APP_COLORS.attentionText} />
                    <Text style={styles.noticeTextRescheduled}>
                      Moved to: {item.rescheduledTo.dayOfWeek} ({item.rescheduledTo.timeSlot}) in {item.rescheduledTo.room || item.room}
                    </Text>
                  </View>
                )}

                {/* Rescheduled In Notice */}
                {isRescheduledIn && item.rescheduledFrom && (
                  <View style={styles.noticeBannerExtra}>
                    <IconSymbol size={15} name="calendar.badge.clock" color={APP_COLORS.safeText} />
                    <Text style={styles.noticeTextExtra}>
                      Extra Class • Original Slot: {item.rescheduledFrom.dayOfWeek} ({item.rescheduledFrom.timeSlot})
                    </Text>
                  </View>
                )}

                {/* Actions Container (Available for faculty's assigned courses) */}
                {isMine && (
                  <View style={styles.cardActionsContainer}>
                    {/* Restore Action if already modified */}
                    {(isCancelled || isRescheduledAway) && item.overrideId ? (
                      <AppButton
                        title="Restore to Normal"
                        onPress={() => handleRestoreClass(item.overrideId!, item.subjectName)}
                        variant="secondary"
                        size="small"
                        icon="arrow.uturn.backward"
                        style={styles.actionBtnFull}
                      />
                    ) : (
                      <>
                        {/* Row 1: Start Attendance Shortcut if today and active */}
                        {isSelectedDayToday && !isCancelled && (
                          <AppButton
                            title={isLive ? 'Active Class Live' : 'Start Attendance'}
                            onPress={() => handleStartAttendance(item.subjectId)}
                            variant={isLive ? 'primary' : 'primary'}
                            size="small"
                            icon={isLive ? 'arrow.up.right' : 'play.fill'}
                            style={styles.actionBtnFull}
                          />
                        )}

                        {/* Row 2: Secondary actions (Reschedule & Cancel side-by-side with no wrapping) */}
                        <View style={styles.cardSecondaryActionsRow}>
                          <AppButton
                            title="Reschedule"
                            onPress={() => openRescheduleModal(item)}
                            variant="secondary"
                            size="small"
                            icon="calendar.badge.clock"
                            style={styles.actionBtnHalf}
                          />

                          <AppButton
                            title="Cancel Class"
                            onPress={() => openCancelModal(item)}
                            variant="secondary"
                            size="small"
                            icon="xmark.circle"
                            style={styles.actionBtnHalf}
                          />
                        </View>
                      </>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </View>

      {/* ===================================================================== */}
      {/* 1. Cancel Class Modal */}
      {/* ===================================================================== */}
      <Modal
        visible={cancelModalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircleDanger}>
                <IconSymbol size={22} name="xmark.circle.fill" color={APP_COLORS.danger} />
              </View>
              <View style={styles.modalHeaderTitles}>
                <Text style={styles.modalTitle}>Cancel Class</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {cancelModalItem?.subjectName} ({cancelModalItem?.timeSlot})
                </Text>
              </View>
            </View>

            <Text style={styles.modalSectionLabel}>SELECT REASON FOR CANCELLATION</Text>
            <View style={styles.reasonChipsWrap}>
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                    onPress={() => {
                      setSelectedReason(reason);
                      setCustomReason('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>OR CUSTOM NOTE FOR STUDENTS</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Attending academic conference in Guwahati"
              placeholderTextColor={APP_COLORS.textMuted}
              value={customReason}
              onChangeText={setCustomReason}
              maxLength={120}
            />

            <View style={styles.modalWarningBox}>
              <IconSymbol size={16} name="info.circle.fill" color={APP_COLORS.textSecondary} />
              <Text style={styles.modalWarningText}>
                Students will be alerted and this session will be excluded from attendance percentage counts.
              </Text>
            </View>

            <View style={styles.modalActionButtons}>
              <AppButton
                title="Keep Class"
                onPress={() => setCancelModalItem(null)}
                variant="secondary"
                size="medium"
                style={styles.modalBtnHalf}
              />
              <AppButton
                title={actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                onPress={handleConfirmCancellation}
                variant="danger"
                size="medium"
                disabled={actionLoading}
                style={styles.modalBtnHalf}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================================== */}
      {/* 2. Reschedule Class Modal */}
      {/* ===================================================================== */}
      <Modal
        visible={rescheduleModalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircleWarning}>
                <IconSymbol size={22} name="calendar.badge.clock" color={APP_COLORS.attentionText} />
              </View>
              <View style={styles.modalHeaderTitles}>
                <Text style={styles.modalTitle}>Reschedule Class</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {rescheduleModalItem?.subjectName} (Currently {rescheduleModalItem?.dayOfWeek})
                </Text>
              </View>
            </View>

            {/* Target Day Picker */}
            <Text style={styles.modalSectionLabel}>SELECT NEW DAY</Text>
            <View style={styles.dayChipsWrap}>
              {DAYS.map((day) => {
                const isSelected = targetDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                    onPress={() => setTargetDay(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Time Slot Picker */}
            <Text style={styles.modalSectionLabel}>SELECT NEW TIME SLOT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
              {RESCHEDULE_TIME_SLOTS.map((slot) => {
                const isSelected = targetTimeSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => setTargetTimeSlot(slot)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Target Room Input */}
            <Text style={styles.modalSectionLabel}>CLASSROOM / LAB</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. CS-201 or Lab-1"
              placeholderTextColor={APP_COLORS.textMuted}
              value={targetRoom}
              onChangeText={setTargetRoom}
            />

            {/* Optional Reason */}
            <Text style={styles.modalSectionLabel}>OPTIONAL REASON NOTE</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Making up for holiday lecture"
              placeholderTextColor={APP_COLORS.textMuted}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              maxLength={120}
            />

            <View style={styles.modalActionButtons}>
              <AppButton
                title="Cancel"
                onPress={() => setRescheduleModalItem(null)}
                variant="secondary"
                size="medium"
                style={styles.modalBtnHalf}
              />
              <AppButton
                title={actionLoading ? 'Saving...' : 'Confirm Reschedule'}
                onPress={handleConfirmReschedule}
                variant="primary"
                size="medium"
                disabled={actionLoading}
                style={styles.modalBtnHalf}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenScroll: {
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TOKENS.spacing.lg,
    paddingTop: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.md,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...TOKENS.shadows.subtle,
  },
  navTitles: {
    flex: 1,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
  },
  navSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  contextBar: {
    marginHorizontal: TOKENS.spacing.lg,
    marginBottom: TOKENS.spacing.md,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...TOKENS.shadows.subtle,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
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
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  todayPill: {
    backgroundColor: '#EEFAF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
    flexShrink: 0,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.safeText,
    letterSpacing: 0.8,
  },
  daySelectorArea: {
    marginBottom: TOKENS.spacing.md,
  },
  dayScroll: {
    paddingHorizontal: TOKENS.spacing.lg,
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    ...TOKENS.shadows.subtle,
  },
  dayPillSelected: {
    backgroundColor: APP_COLORS.obsidian,
  },
  dayPillToday: {
    borderColor: APP_COLORS.primaryWarm,
    borderWidth: 1.5,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  dayPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayPillTextToday: {
    color: APP_COLORS.primaryWarm,
    fontWeight: '800',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: APP_COLORS.primaryWarm,
    marginTop: 3,
  },
  todayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    paddingHorizontal: TOKENS.spacing.lg,
    marginBottom: TOKENS.spacing.md,
  },
  filterSegmentWrap: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    padding: 4,
    borderRadius: TOKENS.rounded.full,
    ...TOKENS.shadows.subtle,
  },
  filterSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: TOKENS.rounded.full,
  },
  filterSegmentActive: {
    backgroundColor: APP_COLORS.subSurface,
  },
  filterSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  filterSegmentTextActive: {
    color: APP_COLORS.obsidian,
    fontWeight: '800',
  },
  itemsList: {
    paddingHorizontal: TOKENS.spacing.lg,
    gap: 12,
  },
  classCard: {
    borderRadius: TOKENS.rounded.card,
    backgroundColor: APP_COLORS.surface,
    ...TOKENS.shadows.card,
  },
  cardCancelled: {
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    backgroundColor: '#FFFDFD',
  },
  cardLive: {
    borderColor: APP_COLORS.primaryWarm,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomPill: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  roomPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
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
  },
  cancelledPill: {
    backgroundColor: APP_COLORS.shortageBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  cancelledPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.danger,
    letterSpacing: 0.5,
  },
  rescheduledPill: {
    backgroundColor: APP_COLORS.attentionBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  rescheduledPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.attentionText,
    letterSpacing: 0.5,
  },
  extraPill: {
    backgroundColor: APP_COLORS.safeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
  },
  extraPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.safeText,
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: APP_COLORS.textMuted,
  },
  subjectMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  noticeBannerCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    padding: 10,
    borderRadius: TOKENS.rounded.md,
    marginTop: 6,
    marginBottom: 8,
  },
  noticeTextCancelled: {
    fontSize: 12,
    color: APP_COLORS.danger,
    fontWeight: '600',
    flex: 1,
  },
  noticeBannerRescheduled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9F0',
    padding: 10,
    borderRadius: TOKENS.rounded.md,
    marginTop: 6,
    marginBottom: 8,
  },
  noticeTextRescheduled: {
    fontSize: 12,
    color: APP_COLORS.attentionText,
    fontWeight: '600',
    flex: 1,
  },
  noticeBannerExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FAF5',
    padding: 10,
    borderRadius: TOKENS.rounded.md,
    marginTop: 6,
    marginBottom: 8,
  },
  noticeTextExtra: {
    fontSize: 12,
    color: APP_COLORS.safeText,
    fontWeight: '600',
    flex: 1,
  },
  cardActionsContainer: {
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  cardSecondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  actionBtnFull: {
    width: '100%',
  },
  actionBtnHalf: {
    flex: 1,
  },
  actionBtnQuarter: {
    flex: 1,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    padding: 20,
    ...TOKENS.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconCircleDanger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.shortageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconCircleWarning: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.attentionBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitles: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.subSurface,
  },
  reasonChipSelected: {
    backgroundColor: APP_COLORS.obsidian,
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  reasonChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: APP_COLORS.canvas,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: TOKENS.rounded.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: APP_COLORS.text,
  },
  modalWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.subSurface,
    padding: 10,
    borderRadius: TOKENS.rounded.md,
    marginTop: 14,
    marginBottom: 16,
  },
  modalWarningText: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBtnHalf: {
    flex: 1,
  },
  confirmCancelBtn: {
    backgroundColor: APP_COLORS.danger,
  },
  dayChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.subSurface,
  },
  dayChipSelected: {
    backgroundColor: APP_COLORS.obsidian,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  slotScroll: {
    marginBottom: 6,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.subSurface,
    marginRight: 8,
  },
  slotChipSelected: {
    backgroundColor: APP_COLORS.obsidian,
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
