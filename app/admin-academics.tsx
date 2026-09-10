import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import type { Subject } from '@/types/models';
import { useFocusEffect , useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Tab = 'subjects' | 'semesters' | 'programmes' | 'departments';

export default function AdminAcademicsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('subjects');
  const [academics, setAcademics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Add Subject
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State for Generic Add (Department / Programme / Semester)
  const [showAddGeneric, setShowAddGeneric] = useState(false);
  const [genericName, setGenericName] = useState('');

  // Modal State for Edit Subject
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await authService.getActiveUser();

    if (!user || user.role !== 'admin') {
      router.replace('/admin-login' as never);
      return;
    }

    const data = await adminService.getAcademics();
    setAcademics(data);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddSubject = async () => {
    if (!newSubCode.trim() || !newSubName.trim()) {
      Alert.alert('Required', 'Please enter both Subject Code and Name.');
      return;
    }

    setSaving(true);
    const result = await adminService.addSubject({
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
    });
    setSaving(false);

    if (result.ok) {
      setShowAddSubject(false);
      setNewSubCode('');
      setNewSubName('');
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleAddGeneric = async () => {
    if (!genericName.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }

    setSaving(true);
    let result: any = { ok: false };

    if (activeTab === 'departments') {
      result = await adminService.addDepartment(genericName.trim());
    } else if (activeTab === 'programmes') {
      result = await adminService.addProgramme(genericName.trim());
    } else if (activeTab === 'semesters') {
      result = await adminService.addSemester(genericName.trim());
    }

    setSaving(false);

    if (result.ok) {
      setShowAddGeneric(false);
      setGenericName('');
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleToggleSubjectActive = async (subject: Subject) => {
    const result = await adminService.updateSubject(subject.id, { active: !subject.active });
    if (result.ok) {
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSaveEditSubject = async () => {
    if (!editingSubject) return;

    setSaving(true);
    const result = await adminService.updateSubject(editingSubject.id, {
      code: editCode.trim().toUpperCase(),
      name: editName.trim(),
    });
    setSaving(false);

    if (result.ok) {
      setEditingSubject(null);
      await loadData();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  if (loading || !academics) {
    return <LoadingState message="Loading academic structure..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Academic Catalogue"
        subtitle="Courses, Semesters & Departments"
        showBack
        rightAction={{
          icon: 'plus.circle.fill',
          onPress: () => {
            if (activeTab === 'subjects') {
              setShowAddSubject(true);
            } else {
              setShowAddGeneric(true);
            }
          },
          label: 'Add',
        }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { id: 'subjects', label: `Subjects (${academics.subjects.length})` },
          { id: 'semesters', label: `Semesters (${academics.semesters.length})` },
          { id: 'programmes', label: `Programmes (${academics.programmes.length})` },
          { id: 'departments', label: `Departments (${academics.departments.length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id as Tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Contents */}
      {activeTab === 'subjects' && (
        <View style={styles.section}>
          {academics.subjects.map((sub: Subject) => (
            <Card key={sub.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{sub.name}</Text>
                  <Text style={styles.itemMeta}>Code: {sub.code} • BCA 1st Sem</Text>
                </View>
                <StatusBadge
                  status={sub.active ? 'good' : 'critical'}
                  label={sub.active ? 'ACTIVE' : 'INACTIVE'}
                  size="small"
                />
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setEditingSubject(sub);
                    setEditCode(sub.code);
                    setEditName(sub.name);
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol size={14} name="pencil" color={APP_COLORS.primary} />
                  <Text style={[styles.actionBtnText, { color: APP_COLORS.primary }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleSubjectActive(sub)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={14}
                    name={sub.active ? 'xmark.circle' : 'checkmark.circle'}
                    color={sub.active ? APP_COLORS.danger : APP_COLORS.success}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: sub.active ? APP_COLORS.danger : APP_COLORS.success },
                    ]}
                  >
                    {sub.active ? 'Disable' : 'Enable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'semesters' && (
        <View style={styles.section}>
          {academics.semesters.map((sem: any) => (
            <Card key={sem.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{sem.name}</Text>
              <Text style={styles.itemMeta}>Affiliation: BCA Programme</Text>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'programmes' && (
        <View style={styles.section}>
          {academics.programmes.map((prog: any) => (
            <Card key={prog.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{prog.name}</Text>
              <Text style={styles.itemMeta}>Department: Computer Applications</Text>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'departments' && (
        <View style={styles.section}>
          {academics.departments.map((dept: any) => (
            <Card key={dept.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{dept.name}</Text>
              <Text style={styles.itemMeta}>University: Dibrugarh University</Text>
            </Card>
          ))}
        </View>
      )}

      {/* Add Subject Modal */}
      <Modal visible={showAddSubject} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Subject</Text>
            <Text style={styles.modalSubtitle}>Create a subject for BCA 1st Semester</Text>

            <AppInput
              label="Subject Code *"
              placeholder="e.g. BCA-105"
              value={newSubCode}
              onChangeText={setNewSubCode}
              autoCapitalize="characters"
            />

            <AppInput
              label="Subject Name *"
              placeholder="e.g. Digital Logic & Circuits"
              value={newSubName}
              onChangeText={setNewSubName}
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setShowAddSubject(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <AppButton
                title="Save Subject"
                onPress={handleAddSubject}
                loading={saving}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic Add Modal */}
      <Modal visible={showAddGeneric} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {activeTab.slice(0, -1).toUpperCase()}
            </Text>
            <Text style={styles.modalSubtitle}>Expand university academic hierarchy</Text>

            <AppInput
              label="Name *"
              placeholder={`e.g. ${activeTab === 'departments' ? 'Mathematics' : activeTab === 'programmes' ? 'MCA' : 'BCA 2nd Semester'}`}
              value={genericName}
              onChangeText={setGenericName}
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setShowAddGeneric(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <AppButton
                title="Save"
                onPress={handleAddGeneric}
                loading={saving}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal visible={editingSubject !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Subject</Text>
            <Text style={styles.modalSubtitle}>Modify code or title</Text>

            <AppInput
              label="Subject Code"
              value={editCode}
              onChangeText={setEditCode}
              autoCapitalize="characters"
            />

            <AppInput
              label="Subject Name"
              value={editName}
              onChangeText={setEditName}
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setEditingSubject(null)}
                variant="outline"
                style={styles.modalBtn}
              />
              <AppButton
                title="Save Changes"
                onPress={handleSaveEditSubject}
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
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  itemCard: {
    marginBottom: 10,
    backgroundColor: APP_COLORS.surfaceVariant,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 10,
    marginTop: 10,
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
