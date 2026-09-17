import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Tab = 'students' | 'faculty';

export default function AdminEnrollmentsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [data, setData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const assignments = await adminService.getAssignments();
    setData(assignments);

    if (assignments.students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(assignments.students[0].student.id);
    }
    if (assignments.faculties.length > 0 && !selectedFacultyId) {
      setSelectedFacultyId(assignments.faculties[0].faculty.id);
    }

    setLoading(false);
  }, [router, selectedStudentId, selectedFacultyId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleEnrollment = async (studentId: string, subjectId: string, currentActive: boolean) => {
    await adminService.setEnrollment(studentId, subjectId, !currentActive);
    await loadData();
  };

  const handleToggleFacultyAssignment = async (facultyId: string, subjectId: string, currentActive: boolean) => {
    await adminService.setFacultyAssignment(facultyId, subjectId, !currentActive);
    await loadData();
  };

  if (loading || !data) {
    return <LoadingState message="Loading course enrolments & assignments..." />;
  }

  const currentStudent =
    data.students.find((s: any) => s.student.id === selectedStudentId) || data.students[0];
  const currentFaculty =
    data.faculties.find((f: any) => f.faculty.id === selectedFacultyId) || data.faculties[0];

  const studentEnrolledCount = currentStudent
    ? data.subjects.filter((sub: any) =>
        data.enrollments.some(
          (e: any) => e.studentId === currentStudent.student.id && e.subjectId === sub.id && e.active
        )
      ).length
    : 0;

  const facultyAssignedCount = currentFaculty
    ? data.subjects.filter((sub: any) =>
        data.facultyAssignments.some(
          (a: any) => a.facultyId === currentFaculty.faculty.id && a.subjectId === sub.id && a.active
        )
      ).length
    : 0;

  return (
    <AppScreen scrollable>
      <Header
        title="Enrolment Matrix"
        subtitle="Course rosters & faculty assignments"
        showBack
      />

      {/* Dual Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'students' && styles.tabBtnActive]}
          onPress={() => setActiveTab('students')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'students' }}
        >
          <IconSymbol
            size={16}
            name="person.2.fill"
            color={activeTab === 'students' ? '#ffffff' : APP_COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            Student Enrolments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'faculty' && styles.tabBtnActive]}
          onPress={() => setActiveTab('faculty')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'faculty' }}
        >
          <IconSymbol
            size={16}
            name="briefcase.fill"
            color={activeTab === 'faculty' ? '#ffffff' : APP_COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'faculty' && styles.tabTextActive]}>
            Faculty Assignments
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'students' ? (
        <View style={styles.contentWrap}>
          {/* Student Selector Rail */}
          <Text style={styles.selectorLabel}>SELECT STUDENT RECORD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.selectorRail}
          >
            {data.students.map((s: any) => {
              const isSelected = selectedStudentId === s.student.id;
              return (
                <TouchableOpacity
                  key={s.student.id}
                  style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                  onPress={() => setSelectedStudentId(s.student.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.selectorChipText, isSelected && styles.selectorChipTextActive]}>
                    {s.student.studentId}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Student Summary Hero */}
          {currentStudent && (
            <Card style={styles.activeEntityCard} padded={false}>
              <View style={styles.entityRow}>
                <View style={styles.entityIconBox}>
                  <IconSymbol size={22} name="person.fill" color={APP_COLORS.obsidian} />
                </View>
                <View style={styles.entityTextWrap}>
                  <View style={styles.entityBadgeRow}>
                    <View style={styles.entityIdBadge}>
                      <Text style={styles.entityIdBadgeText}>{currentStudent.student.studentId}</Text>
                    </View>
                    <Text style={styles.entityAffiliation}>BCA 1st Semester</Text>
                  </View>
                  <Text style={styles.entityName}>{currentStudent.user.name}</Text>
                  <Text style={styles.entityCount}>
                    Enrolled in {studentEnrolledCount} of {data.subjects.length} curriculum subjects
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Section Subheading */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>CURRICULUM COURSE ENROLMENT</Text>
            <Text style={styles.sectionSubtitle}>
              Tap course row or status toggle to add or remove student enrollment
            </Text>
          </View>

          {/* Subjects Toggle Cards */}
          <View style={styles.cardsList}>
            {data.subjects.map((subject: any) => {
              const isEnrolled = data.enrollments.some(
                (e: any) =>
                  e.studentId === currentStudent?.student.id &&
                  e.subjectId === subject.id &&
                  e.active
              );

              return (
                <Card key={subject.id} style={styles.itemCard} padded={false}>
                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() =>
                      handleToggleEnrollment(currentStudent?.student.id, subject.id, isEnrolled)
                    }
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isEnrolled }}
                    accessibilityLabel={`Toggle enrollment in ${subject.name}`}
                  >
                    <View style={styles.toggleInfo}>
                      <View style={styles.subjectCodePill}>
                        <Text style={styles.subjectCodeText}>{subject.code}</Text>
                      </View>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectMeta}>
                        BCA 1st Semester • {APP_IDENTITY.name} CCSA
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusToggle,
                        isEnrolled ? styles.statusEnrolled : styles.statusNotEnrolled,
                      ]}
                    >
                      <IconSymbol
                        size={15}
                        name={isEnrolled ? 'checkmark' : 'plus'}
                        color={isEnrolled ? APP_COLORS.safeText : APP_COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          { color: isEnrolled ? APP_COLORS.safeText : APP_COLORS.textSecondary },
                        ]}
                      >
                        {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.contentWrap}>
          {/* Faculty Selector Rail */}
          <Text style={styles.selectorLabel}>SELECT FACULTY INSTRUCTOR</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.selectorRail}
          >
            {data.faculties.map((f: any) => {
              const isSelected = selectedFacultyId === f.faculty.id;
              return (
                <TouchableOpacity
                  key={f.faculty.id}
                  style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                  onPress={() => setSelectedFacultyId(f.faculty.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.selectorChipText, isSelected && styles.selectorChipTextActive]}>
                    {f.faculty.facultyId}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Faculty Summary Hero */}
          {currentFaculty && (
            <Card style={styles.activeEntityCard} padded={false}>
              <View style={styles.entityRow}>
                <View style={styles.entityIconBox}>
                  <IconSymbol size={22} name="briefcase.fill" color={APP_COLORS.obsidian} />
                </View>
                <View style={styles.entityTextWrap}>
                  <View style={styles.entityBadgeRow}>
                    <View style={styles.entityIdBadge}>
                      <Text style={styles.entityIdBadgeText}>{currentFaculty.faculty.facultyId}</Text>
                    </View>
                    <Text style={styles.entityAffiliation}>Department Faculty</Text>
                  </View>
                  <Text style={styles.entityName}>{currentFaculty.user.name}</Text>
                  <Text style={styles.entityCount}>
                    Assigned to {facultyAssignedCount} of {data.subjects.length} curriculum subjects
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Section Subheading */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>TEACHING APPOINTMENT ASSIGNMENTS</Text>
            <Text style={styles.sectionSubtitle}>
              Tap course row or status toggle to assign instructor to course
            </Text>
          </View>

          {/* Subjects Assignment Cards */}
          <View style={styles.cardsList}>
            {data.subjects.map((subject: any) => {
              const isAssigned = data.facultyAssignments.some(
                (a: any) =>
                  a.facultyId === currentFaculty?.faculty.id &&
                  a.subjectId === subject.id &&
                  a.active
              );

              return (
                <Card key={subject.id} style={styles.itemCard} padded={false}>
                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() =>
                      handleToggleFacultyAssignment(currentFaculty?.faculty.id, subject.id, isAssigned)
                    }
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isAssigned }}
                    accessibilityLabel={`Toggle assignment for ${subject.name}`}
                  >
                    <View style={styles.toggleInfo}>
                      <View style={styles.subjectCodePill}>
                        <Text style={styles.subjectCodeText}>{subject.code}</Text>
                      </View>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectMeta}>
                        BCA 1st Semester • {APP_IDENTITY.name} CCSA
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusToggle,
                        isAssigned ? styles.statusEnrolled : styles.statusNotEnrolled,
                      ]}
                    >
                      <IconSymbol
                        size={15}
                        name={isAssigned ? 'checkmark' : 'plus'}
                        color={isAssigned ? APP_COLORS.safeText : APP_COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          { color: isAssigned ? APP_COLORS.safeText : APP_COLORS.textSecondary },
                        ]}
                      >
                        {isAssigned ? 'Assigned' : 'Not Assigned'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: TOKENS.spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  tabBtnActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  contentWrap: {
    paddingBottom: 24,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  horizontalScroll: {
    marginBottom: TOKENS.spacing.md,
  },
  selectorRail: {
    gap: 8,
  },
  selectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: TOKENS.rounded.full,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  selectorChipActive: {
    backgroundColor: APP_COLORS.obsidian,
    borderColor: APP_COLORS.obsidian,
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
  activeEntityCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.md,
    ...TOKENS.shadows.subtle,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: TOKENS.spacing.md,
  },
  entityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 25, 30, 0.08)',
  },
  entityTextWrap: {
    flex: 1,
  },
  entityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  entityIdBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entityIdBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  entityAffiliation: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '600',
  },
  entityName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
  },
  entityCount: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeaderWrap: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  cardsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subjectCodePill: {
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  subjectCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subjectMeta: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.full,
    borderWidth: 1,
  },
  statusEnrolled: {
    backgroundColor: APP_COLORS.safeBg,
    borderColor: 'rgba(23, 135, 84, 0.2)',
  },
  statusNotEnrolled: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderColor: APP_COLORS.border,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
