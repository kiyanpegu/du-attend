import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { EmptyState } from '@/components/app/EmptyState';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
    return <LoadingState message="Loading registered students..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Student Management"
        subtitle={`Total Registered: ${students.length}`}
        showBack
        rightAction={{
          icon: 'plus.circle.fill',
          onPress: () => setShowAddModal(true),
          label: 'Add',
        }}
      />

      {/* Search Input */}
      <View style={styles.searchBar}>
        <IconSymbol size={20} name="magnifyingglass" color={APP_COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or name..."
          placeholderTextColor={APP_COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <IconSymbol size={16} name="xmark.circle.fill" color={APP_COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon="person.2"
          title="No Students Found"
          message={search ? 'No student matched your search query.' : 'No students registered in the system.'}
        />
      ) : (
        filteredStudents.map((item) => (
          <Card key={item.student.id} style={styles.studentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.user.name}</Text>
                <Text style={styles.studentMeta}>
                  {item.student.studentId} • {item.programme?.name ?? 'BCA'} • {item.semester?.name ?? '1st Sem'}
                </Text>
              </View>
              <StatusBadge
                status={item.student.active ? 'good' : 'critical'}
                label={item.student.active ? 'ACTIVE' : 'DISABLED'}
                size="small"
              />
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditingStudent(item);
                  setEditName(item.user.name);
                }}
                activeOpacity={0.7}
              >
                <IconSymbol size={14} name="pencil" color={APP_COLORS.primary} />
                <Text style={[styles.actionBtnText, { color: APP_COLORS.primary }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleToggleActive(item)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  size={14}
                  name={item.student.active ? 'xmark.circle' : 'checkmark.circle'}
                  color={item.student.active ? APP_COLORS.danger : APP_COLORS.success}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: item.student.active ? APP_COLORS.danger : APP_COLORS.success },
                  ]}
                >
                  {item.student.active ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {/* Add Student Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <Text style={styles.modalSubtitle}>Register a student into BCA 1st Semester</Text>

            <AppInput
              label="Student Public ID *"
              placeholder="e.g. BCA006"
              value={newStudentId}
              onChangeText={setNewStudentId}
              autoCapitalize="characters"
            />

            <AppInput
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={newName}
              onChangeText={setNewName}
            />

            <AppInput
              label="Initial Password (Optional)"
              placeholder="Defaults to student123"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
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
            <Text style={styles.modalTitle}>Edit Student</Text>
            <Text style={styles.modalSubtitle}>ID: {editingStudent?.student.studentId}</Text>

            <AppInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
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
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: APP_COLORS.text,
    fontSize: 15,
  },
  studentCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
    paddingRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  studentMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.surfaceVariant,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
