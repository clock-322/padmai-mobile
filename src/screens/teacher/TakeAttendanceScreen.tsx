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
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClassAttendanceMutation, useSetAttendanceMutation } from '../../store/services/attendanceApi';
import type { AttendanceStudent } from '../../store/services/attendanceApi';

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
  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [originalAttendanceData, setOriginalAttendanceData] = useState<{[key: string]: 'present' | 'absent' | null}>({});
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

        // Initialize attendance data from API response
        // Map 'late' status to 'absent' for display (since we removed late option)
        const initialData: {[key: string]: 'present' | 'absent'} = {};
        const originalData: {[key: string]: 'present' | 'absent' | null} = {};
        
        response.data.students.forEach(student => {
          let status = student.attendanceStatus || 'present';
          // Convert 'late' to 'absent' since we removed the late option
          if (status === 'late') {
            status = 'absent';
          }
          initialData[student.id] = status as 'present' | 'absent';
          // Store original status, but map 'late' to 'absent' for consistency
          originalData[student.id] = status === 'late' ? 'absent' : (student.attendanceStatus as 'present' | 'absent' | null);
        });

        setAttendanceData(initialData);
        setOriginalAttendanceData(originalData);
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

  const updateAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status,
    }));
    
    // Check if there are changes compared to original
    const hasChanged = originalAttendanceData[studentId] !== status;
    const otherStudentsChanged = Object.keys(attendanceData).some(
      id => id !== studentId && originalAttendanceData[id] !== attendanceData[id]
    );
    
    setHasChanges(hasChanged || otherStudentsChanged || Object.keys(attendanceData).some(
      id => originalAttendanceData[id] !== (id === studentId ? status : attendanceData[id])
    ));
  };

  const saveAttendance = async () => {
    if (!user?.id || !classData) {
      Alert.alert('Error', 'Unable to save attendance. Please try again.');
      return;
    }

    setIsSaving(true);
    try {
      // Get only the students that have changed
      const studentsToUpdate = classData.students.filter(student => {
        const currentStatus = attendanceData[student.id];
        const originalStatus = originalAttendanceData[student.id];
        return currentStatus && currentStatus !== originalStatus;
      });

      if (studentsToUpdate.length === 0) {
        Alert.alert('Info', 'No changes to save.');
        setIsSaving(false);
        return;
      }

      // Save attendance for each changed student
      const savePromises = studentsToUpdate.map(student =>
        setAttendance({
          teacherId: user.id!,
          studentId: student.id,
          status: attendanceData[student.id]!,
          date: selectedDate,
        }).unwrap()
      );

      await Promise.all(savePromises);
      
      // Reload attendance data to get updated status
      await loadAttendance();
      
      Alert.alert('Success', 'Attendance saved successfully!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      const errorMessage = error?.data?.message || 'Failed to save attendance. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAttendance = () => {
    // Reset to original values
    const resetData: {[key: string]: 'present' | 'absent'} = {};
    Object.keys(originalAttendanceData).forEach(studentId => {
      resetData[studentId] = (originalAttendanceData[studentId] || 'present') as 'present' | 'absent';
    });
    setAttendanceData(resetData);
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
            <View key={student.id} style={styles.studentItem}>
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
                {getStatusOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusButton,
                      attendanceData[student.id] === option.value && styles.selectedStatusButton,
                      { borderColor: option.color }
                    ]}
                    onPress={() => updateAttendance(student.id, option.value as 'present' | 'absent')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendanceData[student.id] === option.value && styles.selectedStatusButtonText,
                      { color: attendanceData[student.id] === option.value ? '#fff' : option.color }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
