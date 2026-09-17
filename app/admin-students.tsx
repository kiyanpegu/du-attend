import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Add Student
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State for Edit Student
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const data = await adminService.getStudents();
    setStudents(data);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddStudent = async () => {
    if (!newStudentId.trim() || !newName.trim()) {
      Alert.alert('Required', 'Please provide both a Student ID (e.g. BCA006) and Name.');
      return;
    }

    setSaving(true);
    try {
      const result = await adminService.addStudent({
        studentId: newStudentId.trim().toUpperCase(),
        name: newName.trim(),
        password: newPassword || 'student123',
      });

      if (result.ok) {
        Alert.alert('Success', `Student ${newStudentId.trim().toUpperCase()} added successfully.`);
        setShowAddModal(false);
        setNewStudentId('');
        setNewName('');
        setNewPassword('');
        await loadData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to add student.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (student: any) => {
    const nextActive = !student.student.active;
    const result = await adminService.updateStudent(student.student.id, { active: nextActive });
    if (result.ok) {
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setSaving(true);
    const result = await adminService.updateStudent(editingStudent.student.id, {
      name: editName.trim(),
    });
    setSaving(false);

    if (result.ok) {
      setEditingStudent(null);
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.student.studentId.toLowerCase().includes(q) ||
      s.user.name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <LoadingState message="Loading enrolled students..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Student Directory"
        subtitle={`${students.length} students registered`}
        showBack
        rightAction={{
          icon: 'plus.circle.fill',
          onPress: () => setShowAddModal(true),
          label: 'Add',
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <IconSymbol size={18} name="magnifyingglass" color={APP_COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Roll ID or student name..."
          placeholderTextColor={APP_COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <IconSymbol size={16} name="xmark.circle.fill" color={APP_COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Summary Strip */}
      <View style={styles.countSummaryRow}>
        <Text style={styles.countSummaryText}>
          {search ? `Found ${filteredStudents.length} of ${students.length} students` : `Enrolled Cohort (${students.length})`}
        </Text>
        <Text style={styles.departmentLabel}>
          {APP_IDENTITY.name} • BCA 1st Semester
        </Text>
      </View>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon="person.2"
          title="No Students Found"
          message={search ? 'No student matched your search query.' : 'No students registered in the system.'}
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredStudents.map((item) => (
            <Card key={item.student.id} style={styles.studentCard} padded={false}>
              <View style={styles.cardMain}>
                <View style={styles.topRow}>
                  <View style={styles.rollBadge}>
                    <Text style={styles.rollBadgeText}>{item.student.studentId}</Text>
                  </View>
                  <StatusBadge
                    status={item.student.active ? 'good' : 'critical'}
                    label={item.student.active ? 'ACTIVE' : 'DISABLED'}
                    size="small"
                  />
                </View>

                <Text style={styles.studentName}>{item.user.name}</Text>
                <Text style={styles.studentAcademic}>
                  {item.programme?.name ?? 'BCA'} • {item.semester?.name ?? '1st Semester'} • Dibrugarh University CCSA
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingStudent(item);
                    setEditName(item.user.name);
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol size={14} name="pencil" color={APP_COLORS.obsidian} />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    item.student.active ? styles.toggleDisable : styles.toggleEnable,
                  ]}
                  onPress={() => handleToggleActive(item)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={14}
                    name={item.student.active ? 'xmark.circle' : 'checkmark.circle'}
                    color={item.student.active ? APP_COLORS.shortageText : APP_COLORS.safeText}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: item.student.active ? APP_COLORS.shortageText : APP_COLORS.safeText },
                    ]}
                  >
                    {item.student.active ? 'Disable' : 'Enable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add Student Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New Student</Text>
            <Text style={styles.modalSubtitle}>Enrol student into BCA 1st Semester</Text>

            <AppInput
              label="Student Roll ID *"
              placeholder="e.g. BCA006"
              value={newStudentId}
              onChangeText={setNewStudentId}
              autoCapitalize="characters"
              leftIcon="person.text.rectangle"
            />

            <AppInput
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={newName}
              onChangeText={setNewName}
              leftIcon="person.fill"
            />

            <AppInput
              label="Initial Password (Optional)"
              placeholder="Defaults to student123"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              leftIcon="lock.fill"
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <AppButton
                title="Add Student"
                onPress={handleAddStudent}
                loading={saving}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Student Modal */}
      <Modal visible={editingStudent !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Student Details</Text>
            <Text style={styles.modalSubtitle}>
              Roll ID: {editingStudent?.student.studentId}
            </Text>

            <AppInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              leftIcon="person.fill"
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setEditingStudent(null)}
                variant="outline"
                style={styles.modalBtn}
              />
              <AppButton
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={saving}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 10,
    ...TOKENS.shadows.subtle,
  },
  searchInput: {
    flex: 1,
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  countSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  countSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  departmentLabel: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    fontWeight: '500',
  },
  listContainer: {
    gap: 10,
    marginBottom: 24,
  },
  studentCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  cardMain: {
    padding: TOKENS.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rollBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  studentAcademic: {
    ...TYPOGRAPHY.caption,
    color: APP_COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
    borderBottomLeftRadius: TOKENS.rounded.card,
    borderBottomRightRadius: TOKENS.rounded.card,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.obsidian,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleDisable: {
    backgroundColor: APP_COLORS.shortageBg,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  toggleEnable: {
    backgroundColor: APP_COLORS.safeBg,
    borderColor: 'rgba(23, 135, 84, 0.2)',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
