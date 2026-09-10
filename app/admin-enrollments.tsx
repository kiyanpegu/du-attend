import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

  const currentStudent = data.students.find((s: any) => s.student.id === selectedStudentId) || data.students[0];
  const currentFaculty = data.faculties.find((f: any) => f.faculty.id === selectedFacultyId) || data.faculties[0];

  return (
    <AppScreen scrollable>
      <Header
        title="Enrolment Matrix"
        subtitle="Student Enrolments & Faculty Assignments"
        showBack
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'students' && styles.tabBtnActive]}
          onPress={() => setActiveTab('students')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            Student Enrolments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'faculty' && styles.tabBtnActive]}
          onPress={() => setActiveTab('faculty')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'faculty' && styles.tabTextActive]}>
            Faculty Assignments
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'students' ? (
        <View>
          {/* Student Selector */}
          <Text style={styles.selectorLabel}>SELECT STUDENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {data.students.map((s: any) => (
              <TouchableOpacity
                key={s.student.id}
                style={[
                  styles.selectorChip,
                  selectedStudentId === s.student.id && styles.selectorChipActive,
                ]}
                onPress={() => setSelectedStudentId(s.student.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    selectedStudentId === s.student.id && styles.selectorChipTextActive,
                  ]}
                >
                  {s.student.studentId} ({s.user.name})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subjects Enrolment Toggle List */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>
              SUBJECT ENROLMENTS FOR {currentStudent?.student.studentId}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap to toggle enrollment in courses
            </Text>
          </View>

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
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectCode}>{subject.code} • BCA 1st Sem</Text>
                  </View>

                  <View
                    style={[
                      styles.statusToggle,
                      isEnrolled ? styles.statusEnrolled : styles.statusNotEnrolled,
                    ]}
                  >
                    <IconSymbol
                      size={16}
                      name={isEnrolled ? 'checkmark' : 'xmark'}
                      color={isEnrolled ? APP_COLORS.success : APP_COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: isEnrolled ? APP_COLORS.success : APP_COLORS.textMuted },
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
      ) : (
        <View>
          {/* Faculty Selector */}
          <Text style={styles.selectorLabel}>SELECT FACULTY INSTRUCTOR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {data.faculties.map((f: any) => (
              <TouchableOpacity
                key={f.faculty.id}
                style={[
                  styles.selectorChip,
                  selectedFacultyId === f.faculty.id && styles.selectorChipActive,
                ]}
                onPress={() => setSelectedFacultyId(f.faculty.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    selectedFacultyId === f.faculty.id && styles.selectorChipTextActive,
                  ]}
                >
                  {f.faculty.facultyId} ({f.user.name})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subjects Assignment Toggle List */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>
              SUBJECT TEACHING ASSIGNMENTS FOR {currentFaculty?.faculty.facultyId}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap to assign or unassign course instruction
            </Text>
          </View>

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
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectCode}>{subject.code} • BCA 1st Sem</Text>
                  </View>

                  <View
                    style={[
                      styles.statusToggle,
                      isAssigned ? styles.statusEnrolled : styles.statusNotEnrolled,
                    ]}
                  >
                    <IconSymbol
                      size={16}
                      name={isAssigned ? 'checkmark' : 'xmark'}
                      color={isAssigned ? APP_COLORS.primary : APP_COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: isAssigned ? APP_COLORS.primary : APP_COLORS.textMuted },
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
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  selectorChipActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  selectorChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: APP_COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  itemCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
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
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusEnrolled: {
    backgroundColor: `${APP_COLORS.success}15`,
    borderColor: `${APP_COLORS.success}40`,
  },
  statusNotEnrolled: {
    backgroundColor: APP_COLORS.surface,
    borderColor: APP_COLORS.border,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
