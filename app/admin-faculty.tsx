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

export default function AdminFacultyScreen() {
  const router = useRouter();
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Add Faculty
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacultyId, setNewFacultyId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State for Edit Faculty
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [editName, setEditName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const data = await adminService.getFaculty();
    setFacultyList(data);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddFaculty = async () => {
    if (!newFacultyId.trim() || !newName.trim()) {
      Alert.alert('Required', 'Please provide both Faculty ID (e.g. FAC002) and Name.');
      return;
    }

    setSaving(true);
    try {
      const result = await adminService.addFaculty({
        facultyId: newFacultyId.trim().toUpperCase(),
        name: newName.trim(),
        password: newPassword || 'faculty123',
      });

      if (result.ok) {
        Alert.alert('Success', `Faculty ${newFacultyId.trim().toUpperCase()} added successfully.`);
        setShowAddModal(false);
        setNewFacultyId('');
        setNewName('');
        setNewPassword('');
        await loadData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to add faculty.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faculty: any) => {
    const nextActive = !faculty.faculty.active;
    const result = await adminService.updateFaculty(faculty.faculty.id, { active: nextActive });
    if (result.ok) {
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFaculty) return;
    setSaving(true);
    const result = await adminService.updateFaculty(editingFaculty.faculty.id, {
      name: editName.trim(),
    });
    setSaving(false);

    if (result.ok) {
      setEditingFaculty(null);
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      f.faculty.facultyId.toLowerCase().includes(q) ||
      f.user.name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <LoadingState message="Loading faculty members..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Faculty Management"
        subtitle={`Total Instructors: ${facultyList.length}`}
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
          placeholder="Search by Faculty ID or name..."
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

      {/* Faculty List */}
      {filteredFaculty.length === 0 ? (
        <EmptyState
          icon="person.2"
          title="No Faculty Found"
          message={search ? 'No faculty matched your query.' : 'No faculty accounts registered.'}
        />
      ) : (
        filteredFaculty.map((item) => (
          <Card key={item.faculty.id} style={styles.facultyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.facultyInfo}>
                <Text style={styles.facultyName}>{item.user.name}</Text>
                <Text style={styles.facultyMeta}>
                  Faculty ID: {item.faculty.facultyId} • {item.subjects.length} Assigned Subject{item.subjects.length === 1 ? '' : 's'}
                </Text>
              </View>
              <StatusBadge
                status={item.faculty.active ? 'good' : 'critical'}
                label={item.faculty.active ? 'ACTIVE' : 'DISABLED'}
                size="small"
              />
            </View>

            {item.subjects.length > 0 && (
              <View style={styles.subjectsRow}>
                {item.subjects.map((sub: any) => (
                  <View key={sub.id} style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>{sub.name} ({sub.code})</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditingFaculty(item);
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
                  name={item.faculty.active ? 'xmark.circle' : 'checkmark.circle'}
                  color={item.faculty.active ? APP_COLORS.danger : APP_COLORS.success}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: item.faculty.active ? APP_COLORS.danger : APP_COLORS.success },
                  ]}
                >
                  {item.faculty.active ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {/* Add Faculty Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Faculty</Text>
            <Text style={styles.modalSubtitle}>Create an instructor account</Text>

            <AppInput
              label="Faculty ID *"
              placeholder="e.g. FAC002"
              value={newFacultyId}
              onChangeText={setNewFacultyId}
              autoCapitalize="characters"
            />

            <AppInput
              label="Full Name *"
              placeholder="e.g. Dr. Ananya Bora"
              value={newName}
              onChangeText={setNewName}
            />

            <AppInput
              label="Initial Password (Optional)"
              placeholder="Defaults to faculty123"
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
                title="Add Faculty"
                onPress={handleAddFaculty}
                loading={saving}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal visible={editingFaculty !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Faculty</Text>
            <Text style={styles.modalSubtitle}>ID: {editingFaculty?.faculty.facultyId}</Text>

            <AppInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setEditingFaculty(null)}
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
  facultyCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  facultyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  facultyMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  subjectPill: {
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '600',
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

