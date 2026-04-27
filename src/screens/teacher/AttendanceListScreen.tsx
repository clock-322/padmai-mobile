import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClassAttendanceMutation } from '../../store/services/attendanceApi';
import TeacherHeaderRight from '../../components/teacher/TeacherHeaderRight';
import ProfileModal from './ProfileModal';

const AttendanceListScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [getClassAttendance, { isLoading }] = useGetClassAttendanceMutation();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [classData, setClassData] = useState<{
    class: string;
    section: string;
    summary: {
      total: number;
      present: number;
      absent: number;
      notMarked: number;
    };
    students: Array<{
      id: string;
      firstName: string;
      lastName: string;
      classRollNo: string;
      registrationNo: string;
      attendanceStatus: 'present' | 'absent' | 'late' | null;
    }>;
  } | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
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
          summary: response.data.summary,
          students: response.data.students,
        });
      }
    } catch (error: any) {
      console.error('Error loading attendance data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#28A745';
      case 'absent':
        return '#DC3545';
      case 'late':
        return '#FFC107';
      default:
        return '#6C757D';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      default:
        return 'Not Marked';
    }
  };

  const handleTakeAttendance = () => {
    navigation.navigate('TakeAttendance', { date: selectedDate });
  };

  const handleViewReport = () => {
    navigation.navigate('AttendanceReport');
  };

  if (isLoading && !classData) {
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
            <View style={styles.headerTop}>
              <Text style={styles.logo}>🏫 Kilbil School</Text>
              <View style={styles.headerRight}>
                <Text style={styles.welcomeText}>Welcome, {(user as any)?.name?.split(' ')[0]}!</Text>
                <TeacherHeaderRight onPress={() => setProfileModalVisible(true)} />
              </View>
            </View>
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherAvatar}>👩‍🏫</Text>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{(user as any)?.name}</Text>
                <Text style={styles.teacherRole}>Teacher</Text>
              </View>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              You have not been assigned to a class yet. Please contact your administrator.
            </Text>
          </View>
        </ScrollView>
        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>🏫 Kilbil School</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {(user as any)?.name?.split(' ')[0]}!</Text>
              <TeacherHeaderRight onPress={() => setProfileModalVisible(true)} />
            </View>
          </View>
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherAvatar}>👩‍🏫</Text>
            <View style={styles.teacherDetails}>
              <Text style={styles.teacherName}>{(user as any)?.name}</Text>
              <Text style={styles.teacherRole}>Teacher</Text>
            </View>
          </View>
          {classData && (
            <View style={styles.classInfo}>
              <Text style={styles.classInfoText}>
                Class {classData.class} - Section {classData.section}
              </Text>
            </View>
          )}
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

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Attendance Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{classData.summary.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#28A745' }]}>{classData.summary.present}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#DC3545' }]}>{classData.summary.absent}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#FFC107' }]}>
                {classData.summary.notMarked}
              </Text>
              <Text style={styles.summaryLabel}>Not Marked</Text>
            </View>
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
              <View style={styles.studentStatus}>
                <View style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(student.attendanceStatus || 'not_marked') }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(student.attendanceStatus)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTakeAttendance}>
            <Text style={styles.primaryButtonText}>Take Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewReport}>
            <Text style={styles.secondaryButtonText}>View Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B3D4FF',
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teacherAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  teacherRole: {
    fontSize: 14,
    color: '#B3D4FF',
  },
  classInfo: {
    marginTop: 8,
  },
  classInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  summaryCard: {
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F6FED',
    minWidth: 40,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
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
  studentStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lastAttendanceText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2F6FED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F6FED',
  },
  secondaryButtonText: {
    color: '#2F6FED',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceListScreen;
