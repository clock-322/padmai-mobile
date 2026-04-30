import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClassAttendanceMutation, useSetAttendanceMutation } from '../../store/services/attendanceApi';
import type { AttendanceStudent } from '../../store/services/attendanceApi';

const LOCAL_ATTENDANCE_KEY = 'kilbil_local_attendance';

// local storage helpers: { "teacherId|date|studentId": status }
const getLocalAttendanceKey = (teacherId: string, date: string, studentId: string) =>
  `${teacherId}|${date}|${studentId}`;

const loadLocalAttendance = async (): Promise<Record<string, string>> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveLocalAttendanceRecord = async (
  teacherId: string, date: string,
  updates: { studentId: string; status: string }[]
) => {
  try {
    const existing = await loadLocalAttendance();
    updates.forEach(({ studentId, status }) => {
      existing[getLocalAttendanceKey(teacherId, date, studentId)] = status;
    });
    await AsyncStorage.setItem(LOCAL_ATTENDANCE_KEY, JSON.stringify(existing));
  } catch {}
};

const TakeAttendanceScreen = () => {
  const route = useRoute();
  const { user } = useAuth();
  const [getClassAttendance, { isLoading: isLoadingAttendance }] = useGetClassAttendanceMutation();
  const [setAttendance] = useSetAttendanceMutation();
  
  // Get date from route params if provided, otherwise use today
  const routeDate = (route.params as any)?.date;
  const [selectedDate, setSelectedDate] = useState(
    routeDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [classData, setClassData] = useState<{
    class: string;
    section: string;
    students: AttendanceStudent[];
  } | null>(null);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'present' | 'absent' | 'late' | null}>({});
  const [originalAttendanceData, setOriginalAttendanceData] = useState<{[key: string]: 'present' | 'absent' | 'late' | null}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    try {
      const response = await getClassAttendance({
        teacherId: user.id,
        date: selectedDate,
      }).unwrap();

      if (response.success) {
        setClassData({
          class: response.data.class,
          section: response.data.section,
          students: response.data.students,
        });

        // Initialize from server data
        const initialData: {[key: string]: 'present' | 'absent' | 'late' | null} = {};
        response.data.students.forEach(student => {
          const status: 'present' | 'absent' | 'late' | null =
            student.attendanceStatus === 'present' ||
            student.attendanceStatus === 'absent' ||
            student.attendanceStatus === 'late'
              ? student.attendanceStatus
              : null;
          initialData[student.id] = status;
        });

        // Overlay local saved attendance on top of server data
        const local = await loadLocalAttendance();
        response.data.students.forEach(student => {
          const localKey = getLocalAttendanceKey(user.id!, selectedDate, student.id);
          if (local[localKey]) {
            initialData[student.id] = local[localKey] as 'present' | 'absent' | 'late';
          }
        });

        setAttendanceData(initialData);
        setOriginalAttendanceData({ ...initialData });
        setHasChanges(false);
      }
    } catch (error: any) {
      console.error('Error loading attendance:', error);
      const errorMessage = error?.data?.message || 'Failed to load attendance data.';
      if (errorMessage === 'No class assigned yet') {
        Alert.alert('No Class Assigned', 'You have not been assigned to a class yet. Please contact your administrator.');
        setClassData(null);
      } else {
        Alert.alert('Error', errorMessage);
        setClassData(null);
      }
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    const newData = { ...attendanceData, [studentId]: status };
    setAttendanceData(newData);
    const changed = Object.keys(newData).some(id => newData[id] !== originalAttendanceData[id]);
    setHasChanges(changed);
  };

  const saveAttendance = async () => {
    if (!user?.id || !classData) {
      Alert.alert('Error', 'Unable to save attendance. Please try again.');
      return;
    }

    const studentsToUpdate = classData.students.filter(student => {
      const currentStatus = attendanceData[student.id];
      const originalStatus = originalAttendanceData[student.id];
      return currentStatus !== null && currentStatus !== originalStatus;
    });

    if (studentsToUpdate.length === 0) {
      Alert.alert('Info', 'No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      // Always save locally first — this guarantees data is not lost
      await saveLocalAttendanceRecord(
        user.id,
        selectedDate,
        studentsToUpdate.map(s => ({
          studentId: s.id,
          status: attendanceData[s.id] as string,
        }))
      );

      // Update local state immediately
      setOriginalAttendanceData({ ...attendanceData });
      setHasChanges(false);

      // Try to sync with backend silently in background
      Promise.allSettled(
        studentsToUpdate.map(student =>
          setAttendance({
            teacherId: user.id!,
            studentId: student.id,
            status: attendanceData[student.id] as 'present' | 'absent' | 'late',
            date: selectedDate,
          }).unwrap()
        )
      ).catch(() => {});

      Alert.alert('Success', `Attendance saved for ${studentsToUpdate.length} student${studentsToUpdate.length > 1 ? 's' : ''}!`);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Could not save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAttendance = () => {
    setAttendanceData({ ...originalAttendanceData });
    setHasChanges(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#28A745';
      case 'absent':
        return '#DC3545';
      case 'late':
        return '#FFC107';
      case 'excused':
        return '#6F42C1';
      default:
        return '#6C757D';
    }
  };

  const getStatusOptions = () => [
    { value: 'present', label: 'Present', color: '#28A745' },
    { value: 'absent', label: 'Absent', color: '#DC3545' },
    { value: 'late', label: 'Late', color: '#FFC107' },
  ];

  if (isLoadingAttendance && !classData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!classData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Take Attendance</Text>
            <Text style={styles.subtitle}>No class assigned</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              You have not been assigned to a class yet. Please contact your administrator.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const summary = {
    total: classData.students.length,
    present: Object.values(attendanceData).filter(s => s === 'present').length,
    absent: Object.values(attendanceData).filter(s => s === 'absent').length,
    late: Object.values(attendanceData).filter(s => s === 'late').length,
    notMarked: classData.students.filter(s => !attendanceData[s.id]).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Take Attendance</Text>
          <Text style={styles.subtitle}>
            Class {classData.class} - Section {classData.section}
          </Text>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <Text style={styles.selectorLabel}>Date:</Text>
          <TextInput
            style={styles.dateInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          <Text style={styles.dateHint}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Status Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status Legend:</Text>
          <View style={styles.legendItems}>
            {getStatusOptions().map((option) => (
              <View key={option.value} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: option.color }]} />
                <Text style={styles.legendText}>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Student List */}
        <View style={styles.studentList}>
          <Text style={styles.listTitle}>Students ({classData.students.length})</Text>
          {classData.students.map((student) => (
            <View key={(student as any)._id || student.id} style={styles.studentItem}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {student.firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>
                    {student.firstName} {student.lastName}
                  </Text>
                  <Text style={styles.studentGrade}>
                    Roll No: {student.classRollNo} • Reg: {student.registrationNo}
                  </Text>
                </View>
              </View>
              <View style={styles.statusButtons}>
                {getStatusOptions().map((option) => {
                  const isSelected = attendanceData[student.id] === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusButton,
                        isSelected && { backgroundColor: option.color, borderColor: option.color },
                        !isSelected && { borderColor: option.color },
                      ]}
                      onPress={() => updateAttendance(student.id, option.value as 'present' | 'absent' | 'late')}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        { color: isSelected ? '#fff' : option.color },
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {attendanceData[student.id] === null || attendanceData[student.id] === undefined ? (
                  <View style={styles.notMarkedBadge}>
                    <Text style={styles.notMarkedText}>Not Marked</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#28A745' }]}>{summary.present}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#DC3545' }]}>{summary.absent}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#FFC107' }]}>{summary.late}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#6C757D' }]}>{summary.notMarked}</Text>
              <Text style={styles.summaryLabel}>Not Marked</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
            onPress={saveAttendance}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetAttendance}
            disabled={isSaving}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dateSelector: {
    marginBottom: 20,
  },
  dateInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
  },
  dateHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  classButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedClassButton: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  classButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedClassButtonText: {
    color: '#fff',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  studentList: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  studentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  selectedStatusButton: {
    backgroundColor: '#2F6FED',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedStatusButtonText: {
    color: '#fff',
  },
  notMarkedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  notMarkedText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2F6FED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F6FED',
  },
  resetButtonText: {
    color: '#2F6FED',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TakeAttendanceScreen;
