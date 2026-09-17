import { AppButton } from '@/components/app/AppButton';
import { AppInput } from '@/components/app/AppInput';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { Header } from '@/components/app/Header';
import { LoadingState } from '@/components/app/LoadingState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import type { Subject } from '@/types/models';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
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
    return <LoadingState message="Loading academic catalogue..." />;
  }

  return (
    <AppScreen scrollable>
      <Header
        title="Academic Catalogue"
        subtitle="Curriculum hierarchy & course offerings"
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

      {/* Institutional Context Banner */}
      <View style={styles.contextBanner}>
        <View style={styles.contextBadge}>
          <Text style={styles.contextBadgeText}>
            {APP_IDENTITY.university} • CCSA
          </Text>
        </View>
        <Text style={styles.contextText}>
          Bachelor of Computer Application (BCA) Programme Structure
        </Text>
      </View>

      {/* Tabs Filter Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {[
          { id: 'subjects', label: `Subjects (${academics.subjects.length})` },
          { id: 'semesters', label: `Semesters (${academics.semesters.length})` },
          { id: 'programmes', label: `Programmes (${academics.programmes.length})` },
          { id: 'departments', label: `Departments (${academics.departments.length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as Tab)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Contents: Subjects */}
      {activeTab === 'subjects' && (
        <View style={styles.section}>
          {academics.subjects.map((sub: Subject) => (
            <Card key={sub.id} style={styles.subjectCard} padded={false}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectMetaRow}>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{sub.code}</Text>
                  </View>
                  <StatusBadge
                    status={sub.active ? 'good' : 'critical'}
                    label={sub.active ? 'ACTIVE' : 'INACTIVE'}
                    size="small"
                  />
                </View>
                <Text style={styles.subjectTitle}>{sub.name}</Text>
                <Text style={styles.subjectAffiliation}>
                  Curriculum Course • BCA 1st Semester • 4 Credits
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.editActionBtn}
                  onPress={() => {
                    setEditingSubject(sub);
                    setEditCode(sub.code);
                    setEditName(sub.name);
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol size={14} name="pencil" color={APP_COLORS.obsidian} />
                  <Text style={styles.editActionText}>Edit Course</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleActionBtn,
                    sub.active ? styles.toggleDisable : styles.toggleEnable,
                  ]}
                  onPress={() => handleToggleSubjectActive(sub)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={14}
                    name={sub.active ? 'xmark.circle' : 'checkmark.circle'}
                    color={sub.active ? APP_COLORS.shortageText : APP_COLORS.safeText}
                  />
                  <Text
                    style={[
                      styles.toggleActionText,
                      { color: sub.active ? APP_COLORS.shortageText : APP_COLORS.safeText },
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

      {/* Tab Contents: Semesters */}
      {activeTab === 'semesters' && (
        <View style={styles.section}>
          {academics.semesters.map((sem: any) => (
            <Card key={sem.id} style={styles.genericCard}>
              <View style={styles.genericRow}>
                <View style={styles.genericIconBox}>
                  <IconSymbol size={20} name="calendar" color={APP_COLORS.obsidian} />
                </View>
                <View style={styles.genericInfo}>
                  <Text style={styles.genericTitle}>{sem.name}</Text>
                  <Text style={styles.genericMeta}>Academic Affiliation: BCA Programme</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Tab Contents: Programmes */}
      {activeTab === 'programmes' && (
        <View style={styles.section}>
          {academics.programmes.map((prog: any) => (
            <Card key={prog.id} style={styles.genericCard}>
              <View style={styles.genericRow}>
                <View style={styles.genericIconBox}>
                  <IconSymbol size={20} name="graduationcap.fill" color={APP_COLORS.obsidian} />
                </View>
                <View style={styles.genericInfo}>
                  <Text style={styles.genericTitle}>{prog.name}</Text>
                  <Text style={styles.genericMeta}>
                    Department: Centre for Computer Science & Applications
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Tab Contents: Departments */}
      {activeTab === 'departments' && (
        <View style={styles.section}>
          {academics.departments.map((dept: any) => (
            <Card key={dept.id} style={styles.genericCard}>
              <View style={styles.genericRow}>
                <View style={styles.genericIconBox}>
                  <IconSymbol size={20} name="building.columns.fill" color={APP_COLORS.obsidian} />
                </View>
                <View style={styles.genericInfo}>
                  <Text style={styles.genericTitle}>{dept.name}</Text>
                  <Text style={styles.genericMeta}>University: {APP_IDENTITY.university}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add Subject Modal */}
      <Modal visible={showAddSubject} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Subject</Text>
            <Text style={styles.modalSubtitle}>Register course for BCA 1st Semester</Text>

            <AppInput
              label="Subject Code *"
              placeholder="e.g. BCA-105"
              value={newSubCode}
              onChangeText={setNewSubCode}
              autoCapitalize="characters"
              leftIcon="book.fill"
            />

            <AppInput
              label="Subject Name *"
              placeholder="e.g. Digital Logic & Circuits"
              value={newSubName}
              onChangeText={setNewSubName}
              leftIcon="text.alignleft"
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
      <Modal visible={showAddGeneric} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {activeTab.slice(0, -1).toUpperCase()}
            </Text>
            <Text style={styles.modalSubtitle}>Expand university academic hierarchy</Text>

            <AppInput
              label="Name *"
              placeholder={`e.g. ${
                activeTab === 'departments'
                  ? 'Information Technology'
                  : activeTab === 'programmes'
                  ? 'MCA'
                  : 'BCA 2nd Semester'
              }`}
              value={genericName}
              onChangeText={setGenericName}
              leftIcon="pencil"
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
            <Text style={styles.modalTitle}>Edit Course Information</Text>
            <Text style={styles.modalSubtitle}>Modify code or course title</Text>

            <AppInput
              label="Subject Code"
              value={editCode}
              onChangeText={setEditCode}
              autoCapitalize="characters"
              leftIcon="book.fill"
            />

            <AppInput
              label="Subject Name"
              value={editName}
              onChangeText={setEditName}
              leftIcon="text.alignleft"
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
  contextBanner: {
    backgroundColor: APP_COLORS.surface,
    padding: TOKENS.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: TOKENS.spacing.md,
    ...TOKENS.shadows.subtle,
  },
  contextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: TOKENS.rounded.full,
    marginBottom: 4,
  },
  contextBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.8,
  },
  contextText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  tabScroll: {
    marginBottom: TOKENS.spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: TOKENS.rounded.full,
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
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
    gap: 10,
  },
  subjectCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  cardHeader: {
    padding: TOKENS.spacing.md,
  },
  subjectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.5,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subjectAffiliation: {
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
  editActionBtn: {
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
  editActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.obsidian,
  },
  toggleActionBtn: {
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
  toggleActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  genericCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    ...TOKENS.shadows.subtle,
  },
  genericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genericIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: APP_COLORS.subSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericInfo: {
    flex: 1,
  },
  genericTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  genericMeta: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
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
