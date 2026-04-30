import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClassStudentsMutation } from '../../store/services/studentsApi';
import { ClassStudentApi } from '../../types/students';
import TeacherHeaderRight from '../../components/teacher/TeacherHeaderRight';
import ProfileModal from './ProfileModal';
import { SubjectProgress, useSaveProgressMutation } from '../../store/services/progressApi';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Academic year months (June to April)
const ACADEMIC_MONTHS = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]; // June=5 to April=3

type ReportType = 'monthly' | 'unit_test_1' | 'unit_test_2' | 'term_exam_1' | 'term_exam_2';

const REPORT_TYPES: { key: ReportType; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'unit_test_1', label: 'Unit Test 1' },
  { key: 'unit_test_2', label: 'Unit Test 2' },
  { key: 'term_exam_1', label: 'Term Exam 1' },
  { key: 'term_exam_2', label: 'Term Exam 2' },
];

const DEFAULT_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Social Studies',
  'Hindi', 'Marathi', 'Computer', 'Art', 'Physical Education',
];

const computeGrade = (obtained: number, total: number): string => {
  if (total === 0) return '-';
  const pct = (obtained / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

const gradeColor = (grade: string): string => {
  if (grade === 'A+' || grade === 'A') return '#28A745';
  if (grade === 'B+' || grade === 'B') return '#2F6FED';
  if (grade === 'C') return '#FF9800';
  if (grade === 'D') return '#FF6B35';
  if (grade === 'F') return '#DC3545';
  return '#666';
};

// Local storage key for progress (until backend is ready)
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadLocalProgress = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalProgress = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

const ProgressScreen = () => {
  const { user } = useAuth();
  const [getClassStudents] = useGetClassStudentsMutation();
  const [saveProgressApi] = useSaveProgressMutation();

  const today = new Date();
  // Default to current month if in academic year (June-April), otherwise default to June
  const initialMonth = ACADEMIC_MONTHS.includes(today.getMonth()) ? today.getMonth() : 5;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');

  const [students, setStudents] = useState<ClassStudentApi[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [classInfo, setClassInfo] = useState<{ class: string; section: string } | null>(null);

  // Map: studentId -> SubjectProgress[]
  const [progressMap, setProgressMap] = useState<Record<string, SubjectProgress[]>>({});

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ClassStudentApi | null>(null);
  const [editingSubjects, setEditingSubjects] = useState<SubjectProgress[]>([]);
  const [saving, setSaving] = useState(false);

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const storageKey = selectedReportType === 'monthly'
    ? `progress_${user?.id}_${selectedYear}_${selectedMonth}`
    : `progress_${user?.id}_${selectedYear}_${selectedReportType}`;

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    loadProgressForMonth();
  }, [selectedMonth, selectedYear, selectedReportType, students]);

  const fetchStudents = async () => {
    if (!user?.id) { setLoadingStudents(false); return; }
    setLoadingStudents(true);
    try {
      const res = await getClassStudents({ teacherId: user.id }).unwrap();
      if (res.success) {
        setStudents(res.data.students);
        setClassInfo({ class: res.data.class, section: res.data.section });
      }
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadProgressForMonth = async () => {
    const stored = await loadLocalProgress(storageKey);
    if (stored) {
      setProgressMap(stored);
    } else {
      // Initialize empty progress for all students
      const initial: Record<string, SubjectProgress[]> = {};
      students.forEach((s) => {
        initial[s._id] = DEFAULT_SUBJECTS.map((sub) => ({
          subject: sub,
          marksObtained: null,
          totalMarks: 100,
          grade: '-',
          remarks: '',
        }));
      });
      setProgressMap(initial);
    }
  };

  const handleEditStudent = (student: ClassStudentApi) => {
    setEditingStudent(student);
    const existing = progressMap[student._id];
    if (existing && existing.length > 0) {
      setEditingSubjects(existing.map((s) => ({ ...s })));
    } else {
      setEditingSubjects(
        DEFAULT_SUBJECTS.map((sub) => ({
          subject: sub,
          marksObtained: null,
          totalMarks: 100,
          grade: '-',
          remarks: '',
        }))
      );
    }
    setEditModalVisible(true);
  };

  const handleMarksChange = (index: number, value: string) => {
    const num = value === '' ? null : parseInt(value, 10);
    setEditingSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const obtained = num === null ? null : Math.min(num, s.totalMarks);
        const grade = obtained !== null ? computeGrade(obtained, s.totalMarks) : '-';
        return { ...s, marksObtained: obtained, grade };
      })
    );
  };

  const handleTotalChange = (index: number, value: string) => {
    const num = value === '' ? 100 : parseInt(value, 10) || 100;
    setEditingSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const grade = s.marksObtained !== null ? computeGrade(s.marksObtained, num) : '-';
        return { ...s, totalMarks: num, grade };
      })
    );
  };

  const handleRemarksChange = (index: number, value: string) => {
    setEditingSubjects((prev) =>
      prev.map((s, i) => (i === index ? { ...s, remarks: value } : s))
    );
  };

  const handleSaveProgress = async () => {
    if (!editingStudent) return;
    setSaving(true);
    const updated = { ...progressMap, [editingStudent._id]: editingSubjects };
    setProgressMap(updated);
    await saveLocalProgress(storageKey, updated);

    // Also save to backend API so parents can see the progress
    try {
      await saveProgressApi({
        teacherId: user?.id || '',
        studentId: editingStudent._id,
        month: selectedReportType === 'monthly' ? selectedMonth : -1,
        year: selectedYear,
        subjects: editingSubjects,
        ...(selectedReportType !== 'monthly' ? { reportType: selectedReportType } : {}),
      } as any).unwrap();
    } catch (err) {
      console.warn('Failed to sync progress to server (saved locally):', err);
    }

    setSaving(false);
    setEditModalVisible(false);
    Alert.alert('Saved', `Progress for ${editingStudent.firstName} ${editingStudent.lastName} has been saved.`);
  };

  const getStudentSummary = (studentId: string) => {
    const subjects = progressMap[studentId];
    if (!subjects) return null;
    const filled = subjects.filter((s) => s.marksObtained !== null);
    if (filled.length === 0) return null;
    const total = filled.reduce((sum, s) => sum + (s.marksObtained ?? 0), 0);
    const maxTotal = filled.reduce((sum, s) => sum + s.totalMarks, 0);
    const pct = Math.round((total / maxTotal) * 100);
    return { filled: filled.length, total: subjects.length, pct };
  };

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  if (loadingStudents) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>📊 Progress</Text>
          <View style={styles.headerRight}>
            <Text style={styles.welcomeText}>
              Welcome, {(user as any)?.name?.split(' ')[0]}!
            </Text>
            <TeacherHeaderRight onPress={() => setProfileModalVisible(true)} />
          </View>
        </View>
        {classInfo && (
          <Text style={styles.classSubtitle}>
            Class {classInfo.class} – Section {classInfo.section} · {students.length} Students
          </Text>
        )}
      </View>

      {/* Report Type Selector */}
      <View style={styles.reportTypeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reportTypeContent}>
          {REPORT_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt.key}
              style={[styles.reportTypeChip, selectedReportType === rt.key && styles.reportTypeChipActive]}
              onPress={() => setSelectedReportType(rt.key)}
            >
              <Text style={[styles.reportTypeChipText, selectedReportType === rt.key && styles.reportTypeChipTextActive]}>
                {rt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Month Selector - only show for monthly type */}
      {selectedReportType === 'monthly' && (
        <View style={styles.monthSelector}>
          <Text style={styles.monthSelectorLabel}>Reporting Month:</Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setMonthPickerVisible(true)}
          >
            <Text style={styles.monthButtonText}>
              {MONTHS[selectedMonth]} {selectedYear}
            </Text>
            <Text style={styles.monthButtonArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Students List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>
              You haven't been assigned a class yet. Contact your administrator.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              Student Progress – {selectedReportType === 'monthly'
                ? `${MONTHS[selectedMonth]} ${selectedYear}`
                : `${REPORT_TYPES.find(r => r.key === selectedReportType)?.label} ${selectedYear}`}
            </Text>
            {students.map((student) => {
              const summary = getStudentSummary(student._id);
              return (
                <View key={student._id} style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {student.firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {student.firstName} {student.lastName}
                    </Text>
                    <Text style={styles.studentMeta}>
                      Roll No: {student.classRollNo}
                    </Text>
                    {summary ? (
                      <View style={styles.progressBadgeRow}>
                        <View style={[styles.progressBadge, { backgroundColor: summary.pct >= 60 ? '#e8f5e9' : '#fff3e0' }]}>
                          <Text style={[styles.progressBadgeText, { color: summary.pct >= 60 ? '#28A745' : '#FF9800' }]}>
                            {summary.pct}% · {summary.filled}/{summary.total} subjects filled
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.notFilledText}>Not filled yet</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditStudent(student)}
                  >
                    <Text style={styles.editButtonText}>
                      {summary ? 'Edit' : 'Fill'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={monthPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Year selector */}
            <View style={styles.yearRow}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearButton, selectedYear === y && styles.yearButtonActive]}
                  onPress={() => setSelectedYear(y)}
                >
                  <Text style={[styles.yearButtonText, selectedYear === y && styles.yearButtonTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Month grid - Academic year: June to April */}
            <View style={styles.monthGrid}>
              {ACADEMIC_MONTHS.map((monthIdx) => (
                <TouchableOpacity
                  key={monthIdx}
                  style={[styles.monthCell, selectedMonth === monthIdx && styles.monthCellActive]}
                  onPress={() => {
                    setSelectedMonth(monthIdx);
                    setMonthPickerVisible(false);
                  }}
                >
                  <Text style={[styles.monthCellText, selectedMonth === monthIdx && styles.monthCellTextActive]}>
                    {MONTHS[monthIdx].slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Progress Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.editOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editContent}>
            <View style={styles.editHeader}>
              <View>
                <Text style={styles.editTitle}>
                  {editingStudent?.firstName} {editingStudent?.lastName}
                </Text>
                <Text style={styles.editSubtitle}>
                  {selectedReportType === 'monthly'
                    ? `${MONTHS[selectedMonth]} ${selectedYear}`
                    : `${REPORT_TYPES.find(r => r.key === selectedReportType)?.label} ${selectedYear}`} · Progress Report
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.editClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editBody} showsVerticalScrollIndicator={false}>
              {/* Column Headers */}
              <View style={styles.subjectHeaderRow}>
                <Text style={[styles.subjectHeaderCell, { flex: 2 }]}>Subject</Text>
                <Text style={styles.subjectHeaderCell}>Marks</Text>
                <Text style={styles.subjectHeaderCell}>/ Total</Text>
                <Text style={styles.subjectHeaderCell}>Grade</Text>
              </View>

              {editingSubjects.map((subj, index) => (
                <View key={subj.subject} style={styles.subjectRow}>
                  <Text style={styles.subjectName}>{subj.subject}</Text>
                  <TextInput
                    style={styles.marksInput}
                    keyboardType="number-pad"
                    placeholder="--"
                    placeholderTextColor="#bbb"
                    value={subj.marksObtained !== null ? String(subj.marksObtained) : ''}
                    onChangeText={(v) => handleMarksChange(index, v)}
                    maxLength={3}
                  />
                  <TextInput
                    style={styles.marksInput}
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor="#bbb"
                    value={String(subj.totalMarks)}
                    onChangeText={(v) => handleTotalChange(index, v)}
                    maxLength={3}
                  />
                  <View style={[styles.gradeBadge, { backgroundColor: gradeColor(subj.grade) + '22' }]}>
                    <Text style={[styles.gradeText, { color: gradeColor(subj.grade) }]}>
                      {subj.grade}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Remarks per subject */}
              <Text style={styles.remarksHeader}>Remarks (optional)</Text>
              {editingSubjects.map((subj, index) => (
                <View key={`rem_${subj.subject}`} style={styles.remarkRow}>
                  <Text style={styles.remarkSubjectLabel}>{subj.subject}:</Text>
                  <TextInput
                    style={styles.remarkInput}
                    placeholder="Add remarks..."
                    placeholderTextColor="#bbb"
                    value={subj.remarks}
                    onChangeText={(v) => handleRemarksChange(index, v)}
                  />
                </View>
              ))}

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.editFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProgress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Progress</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  welcomeText: { fontSize: 16, fontWeight: '600', color: '#B3D4FF' },
  classSubtitle: { fontSize: 13, color: '#B3D4FF', marginTop: 2 },

  reportTypeSelector: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  reportTypeContent: {
    gap: 8,
  },
  reportTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportTypeChipActive: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  reportTypeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  reportTypeChipTextActive: {
    color: '#fff',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  monthSelectorLabel: { fontSize: 14, color: '#666', marginRight: 12 },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F6FED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  monthButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  monthButtonArrow: { color: '#fff', fontSize: 10 },

  content: { flex: 1 },
  listContainer: { padding: 16 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 14 },

  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 2 },
  studentMeta: { fontSize: 12, color: '#888', marginBottom: 4 },
  progressBadgeRow: { flexDirection: 'row' },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  progressBadgeText: { fontSize: 12, fontWeight: '600' },
  notFilledText: { fontSize: 12, color: '#aaa', fontStyle: 'italic' },

  editButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Month Picker
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  pickerClose: { fontSize: 20, color: '#666' },
  yearRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  yearButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  yearButtonActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  yearButtonText: { fontSize: 14, fontWeight: '600', color: '#555' },
  yearButtonTextActive: { color: '#fff' },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
  },
  monthCell: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  monthCellActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  monthCellText: { fontSize: 13, fontWeight: '600', color: '#555' },
  monthCellTextActive: { color: '#fff' },

  // Edit Modal
  editOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  editTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  editClose: { fontSize: 22, color: '#666', paddingTop: 2 },

  editBody: { paddingHorizontal: 16, paddingTop: 12 },

  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 4,
  },
  subjectHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textAlign: 'center',
  },

  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  marksInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 3,
  },
  gradeBadge: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginLeft: 3,
  },
  gradeText: { fontSize: 13, fontWeight: 'bold' },

  remarksHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 18,
    marginBottom: 8,
  },
  remarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  remarkSubjectLabel: {
    width: 110,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  remarkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#333',
  },

  editFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#555', fontSize: 15, fontWeight: '600' },
  saveButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#2F6FED',
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ProgressScreen;
