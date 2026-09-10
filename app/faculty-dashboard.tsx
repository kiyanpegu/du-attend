import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { attendanceService } from '@/services/attendanceService';
import { authService } from '@/services/authService';
import { facultyService } from '@/services/facultyService';
import type { FacultyDashboardData, Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FacultyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'faculty') {
      router.replace('/faculty-login' as never);
      return;
    }

    const dashboard = await facultyService.getDashboard(user.id);

    if (!dashboard) {
      router.replace('/faculty-login' as never);
      return;
    }

    setData(dashboard);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        if (mounted) {
          await loadData();
        }
      };

      run();
      const interval = setInterval(run, 4000);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [loadData])
  );

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/' as never);
        },
      },
    ]);
  };

  const handleStartClass = async (subject: Subject) => {
    if (data?.activeSession) {
      Alert.alert(
        'Active Class in Progress',
        'You already have an active class running. Please complete or cancel it before starting a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Active Class',
            onPress: () => router.push('/faculty-active-class' as never),
          },
        ]
      );
      return;
    }

    setLoading(true);
    const user = await authService.getActiveUser();
    if (!user) return;

    const result = await attendanceService.startClass(user.id, subject.id);
    setLoading(false);

    if (result.ok) {
      router.push('/faculty-active-class' as never);
    } else {
      Alert.alert('Unable to Start Class', result.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading faculty dashboard..." />;
  }

  if (!data) {
    return null;
  }

  const { user, faculty, assignedSubjects, activeSession, recentSessions } = data;
  const activeSubject = assignedSubjects.find((s) => s.id === activeSession?.subjectId);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const getSubjectColor = (index: number) => {
    const colors = [APP_COLORS.primary, APP_COLORS.success, APP_COLORS.warning, APP_COLORS.info, APP_COLORS.danger];
    return colors[index % colors.length];
  };

  const getSubjectAccent = (index: number) => {
    return { borderLeftWidth: 4, borderLeftColor: getSubjectColor(index) };
  };

  const getSubjectLastSessionInfo = (subjectId: string) => {
    const lastSession = data.recentSessions.find(s => s.subject.id === subjectId && s.session.status === 'ended');
    if (!lastSession || lastSession.enrolledCount === 0) return null;
    const pct = Math.round((lastSession.presentCount / lastSession.enrolledCount) * 100);
    return `${pct}% Present`;
  };

  const getSubjectEnrolledCount = (subjectId: string) => {
    const lastSession = data.recentSessions.find(s => s.subject.id === subjectId);
    if (lastSession) return lastSession.enrolledCount;
    return 0; // fallback if no sessions ever
  };

  return (
    <AppScreen scrollable>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol size={32} name="graduationcap.fill" color={APP_COLORS.primary} />
          <Text style={styles.headerTitle}>DU Attend</Text>
        </View>
        <AppButton 
          title=""
          variant="outline"
          onPress={handleLogout}
          icon="rectangle.portrait.and.arrow.right"
          style={styles.logoutBtn}
        />
      </View>

      <View style={styles.container}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.welcomeTitle}>{greeting}, {user.name}</Text>
            <Text style={styles.welcomeSubtitle}>Faculty ID: {faculty.facultyId}</Text>
          </View>
          
          <AppButton
            title="Start New Class"
            icon="play.circle.fill"
            onPress={() => {
              if (activeSession) {
                router.push('/faculty-active-class' as never);
              } else if (assignedSubjects.length === 1) {
                handleStartClass(assignedSubjects[0]);
              } else {
                router.push('/faculty-select-subject' as never);
              }
            }}
            variant="primary"
            style={styles.startClassBtn}
          />
        </View>

        {activeSession && (
          <Card style={styles.activeCard} padded={false}>
            <View style={styles.activeContent}>
              <View style={styles.activeHeader}>
                <View style={styles.liveTagWrap}>
                  <View style={styles.liveDot} />
                  <Text style={styles.activeLabel}>CLASS IN PROGRESS</Text>
                </View>
                <StatusBadge status="active" size="small" />
              </View>

              <Text style={styles.activeSubject}>{activeSubject?.name ?? 'Assigned Subject'}</Text>
              <Text style={styles.activeCode}>{activeSubject?.code ?? 'Active Session'}</Text>

              <View style={styles.activeOtpRow}>
                <View style={styles.activeOtpBox}>
                  <Text style={styles.activeOtpLabel}>CURRENT OTP</Text>
                  <Text style={styles.activeOtpVal}>{activeSession.otp}</Text>
                </View>
                <AppButton
                  title="Manage Live Class"
                  onPress={() => router.push('/faculty-active-class' as never)}
                  variant="primary"
                  size="medium"
                  style={styles.manageBtn}
                />
              </View>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>My Subjects</Text>
        {assignedSubjects.length === 0 ? (
          <Text style={styles.emptyText}>No subjects assigned.</Text>
        ) : (
          <View style={styles.subjectsGrid}>
            {assignedSubjects.map((subject, index) => {
              const lastSessionPct = getSubjectLastSessionInfo(subject.id);
              const enrolledCount = getSubjectEnrolledCount(subject.id);
              
              return (
                <Card key={subject.id} style={[styles.subjectCard, getSubjectAccent(index)]}>
                  <View style={styles.subjectCardTop}>
                    <View style={styles.subjectCardText}>
                      <View style={styles.subjectBadge}>
                        <Text style={styles.subjectBadgeText}>{subject.code}</Text>
                      </View>
                      <Text style={styles.subjectName} numberOfLines={2}>{subject.name}</Text>
                    </View>
                    <IconSymbol size={24} name="book.fill" color={getSubjectColor(index)} />
                  </View>
                  <View style={styles.subjectCardBottom}>
                    <View>
                      <Text style={styles.subjectMetaLabel}>Students</Text>
                      <Text style={styles.subjectMetaValue}>{enrolledCount} Enrolled</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.subjectMetaLabel}>Last Session</Text>
                      <Text style={[styles.subjectMetaValue, { color: APP_COLORS.success }]}>
                        {lastSessionPct ?? 'N/A'}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Quick Action Navigation Tiles for Reports and History */}
        <View style={styles.quickModulesRow}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/faculty-reports' as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: `${APP_COLORS.primary}20` }]}>
              <IconSymbol size={20} name="chart.bar.fill" color={APP_COLORS.primary} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={styles.moduleTitle}>Attendance Reports</Text>
              <Text style={styles.moduleSubtitle}>Averages & student eligibility</Text>
            </View>
            <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/faculty-history' as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: `${APP_COLORS.success}20` }]}>
              <IconSymbol size={20} name="clock.arrow.circlepath" color={APP_COLORS.success} />
            </View>
            <View style={styles.moduleTextWrap}>
              <Text style={styles.moduleTitle}>Session History</Text>
              <Text style={styles.moduleSubtitle}>Audit conducted classes</Text>
            </View>
            <IconSymbol size={16} name="chevron.right" color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {recentSessions.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <TouchableOpacity onPress={() => router.push('/faculty-history' as never)}>
                <Text style={styles.viewAllHistory}>View All History →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine} />
              
              {recentSessions.slice(0, 5).map((report, index) => (
                <View key={report.session.id} style={styles.timelineItem}>
                  <View style={[styles.timelineIconWrap, index === 0 ? styles.timelineIconActive : styles.timelineIconInactive]}>
                    <IconSymbol 
                      size={14} 
                      name={index === 0 ? "checkmark" : "clock.fill"} 
                      color={index === 0 ? APP_COLORS.primary : APP_COLORS.textMuted} 
                    />
                  </View>
                  
                  <View style={[styles.timelineContent, index > 0 && { opacity: 0.8 }]}>
                    <View style={styles.timelineContentLeft}>
                      <Text style={styles.timelineTitle}>{report.subject.name}</Text>
                      <Text style={styles.timelineMeta}>
                        {new Date(report.session.startedAt).toLocaleDateString('en-IN', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })} • {new Date(report.session.startedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.timelinePill}>
                      <IconSymbol size={14} name="person.3.fill" color={APP_COLORS.success} />
                      <Text style={styles.timelinePillText}>
                        {report.presentCount}/{report.enrolledCount} Present
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.disclaimerText}>
          Independent demo prototype. Not an official Dibrugarh University application.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.primary,
  },
  logoutBtn: {
    borderWidth: 0,
    width: 44,
    height: 44,
    paddingHorizontal: 0,
  },
  welcomeSection: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
  },
  startClassBtn: {
    width: '100%',
  },
  activeCard: {
    backgroundColor: `${APP_COLORS.primary}15`,
    borderColor: APP_COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 16,
    marginBottom: 24,
  },
  activeContent: {
    padding: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.success,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.primary,
    letterSpacing: 1.2,
  },
  activeSubject: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  activeCode: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 12,
  },
  activeOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  activeOtpBox: {},
  activeOtpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
  },
  activeOtpVal: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.primary,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  manageBtn: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    paddingVertical: 16,
  },
  subjectsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
  },
  subjectCard: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subjectCardText: {
    flex: 1,
    paddingRight: 16,
  },
  subjectBadge: {
    backgroundColor: APP_COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  subjectCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    paddingTop: 12,
  },
  subjectMetaLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 2,
  },
  subjectMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  recentSection: {
    marginTop: 8,
  },
  timelineContainer: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  timelineLine: {
    position: 'absolute',
    left: 31,
    top: 32,
    bottom: 32,
    width: 2,
    backgroundColor: APP_COLORS.border,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 8,
    borderWidth: 4,
    borderColor: APP_COLORS.surfaceVariant,
    zIndex: 2,
  },
  timelineIconActive: {
    backgroundColor: `${APP_COLORS.primary}30`,
  },
  timelineIconInactive: {
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: APP_COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 8,
  },
  timelineContentLeft: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  timelineMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  timelinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  timelinePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  quickModulesRow: {
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surfaceVariant,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 12,
  },
  moduleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextWrap: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllHistory: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.primary,
  },
  disclaimerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    lineHeight: 16,
  },
});
