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
    return <LoadingState message="Loading faculty instructors..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Faculty Directory"
        subtitle={`${facultyList.length} instructors registered`}
        showBack
        rightAction={{
          icon: 'plus.circle.fill',
          onPress: () => setShowAddModal(true),
          label: 'Add',
        }}
      />

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <IconSymbol size={18} name="magnifyingglass" color={APP_COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Faculty ID or name..."
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

      {/* Count Status Header */}
      <View style={styles.countSummaryRow}>
        <Text style={styles.countSummaryText}>
          {search ? `Found ${filteredFaculty.length} of ${facultyList.length} instructors` : `All Instructors (${facultyList.length})`}
        </Text>
        <Text style={styles.departmentLabel}>
          {APP_IDENTITY.name} • Centre for Computer Science & Applications
        </Text>
      </View>

      {/* Faculty List */}
      {filteredFaculty.length === 0 ? (
        <EmptyState
          icon="person.2"
          title="No Faculty Found"
          message={search ? 'No instructors matched your search criteria.' : 'No faculty accounts registered.'}
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredFaculty.map((item) => (
            <Card key={item.faculty.id} style={styles.facultyCard} padded={false}>
              <View style={styles.cardMain}>
                <View style={styles.topRow}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>{item.faculty.facultyId}</Text>
                  </View>
                  <StatusBadge
                    status={item.faculty.active ? 'good' : 'critical'}
                    label={item.faculty.active ? 'ACTIVE' : 'DISABLED'}
                    size="small"
                  />
                </View>

                <Text style={styles.facultyName}>{item.user.name}</Text>
                <Text style={styles.facultyAffiliation}>
                  Department Faculty • {item.subjects.length} Assigned Course{item.subjects.length === 1 ? '' : 's'}
                </Text>

                {item.subjects.length > 0 && (
                  <View style={styles.subjectsContainer}>
                    <Text style={styles.subjectsHeader}>TEACHING ASSIGNMENTS</Text>
                    <View style={styles.subjectsWrap}>
                      {item.subjects.map((sub: any) => (
                        <View key={sub.id} style={styles.subjectChip}>
                          <Text style={styles.subjectChipText}>
                            {sub.code}: {sub.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingFaculty(item);
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
                    item.faculty.active ? styles.toggleDisable : styles.toggleEnable,
                  ]}
                  onPress={() => handleToggleActive(item)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={14}
                    name={item.faculty.active ? 'xmark.circle' : 'checkmark.circle'}
                    color={item.faculty.active ? APP_COLORS.shortageText : APP_COLORS.safeText}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: item.faculty.active ? APP_COLORS.shortageText : APP_COLORS.safeText },
                    ]}
                  >
                    {item.faculty.active ? 'Disable' : 'Enable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add Faculty Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Faculty</Text>
            <Text style={styles.modalSubtitle}>Create instructor credentials for DU Attend</Text>

            <AppInput
              label="Faculty ID *"
              placeholder="e.g. FAC002"
              value={newFacultyId}
              onChangeText={setNewFacultyId}
              autoCapitalize="characters"
              leftIcon="person.text.rectangle"
            />

            <AppInput
              label="Full Name *"
              placeholder="e.g. Dr. Ananya Bora"
              value={newName}
              onChangeText={setNewName}
              leftIcon="person.fill"
            />

            <AppInput
              label="Initial Password (Optional)"
              placeholder="Defaults to faculty123"
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
            <Text style={styles.modalTitle}>Edit Faculty Profile</Text>
            <Text style={styles.modalSubtitle}>
              Faculty ID: {editingFaculty?.faculty.facultyId}
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
  facultyCard: {
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
  idBadge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  facultyAffiliation: {
    ...TYPOGRAPHY.caption,
    color: APP_COLORS.textSecondary,
  },
  subjectsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.borderSubtle,
  },
  subjectsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subjectsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectChip: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectChipText: {
    fontSize: 11,
    fontWeight: '600',
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
