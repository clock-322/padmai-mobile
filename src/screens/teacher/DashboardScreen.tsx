import React, { useState, useEffect, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useGetClassStudentsMutation } from '../../store/services/studentsApi';
import { ClassStudentApi, GetClassStudentsSuccessResponse } from '../../types/students';
import { useGetTeacherByIdQuery } from '../../store/services/teachersApi';
import TeacherHeaderRight from '../../components/teacher/TeacherHeaderRight';
import ProfileModal from './ProfileModal';
import EmptyClassState from '../../components/teacher/EmptyClassState';
import WelcomeCard from '../../components/WelcomeCard';
import WelcomeCarouselModal from '../../components/WelcomeCarouselModal';
import { trackWelcomeCardImpression } from '../../utils/analytics';

type SortOption = 'name' | 'rollNo' | 'registrationNo';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [getClassStudents] = useGetClassStudentsMutation();
  const { data: teacherProfileData } = useGetTeacherByIdQuery(user?.id ?? '', {
    skip: !user?.id,
  });
  const [classData, setClassData] = useState<GetClassStudentsSuccessResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [localSubject, setLocalSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  useEffect(() => {
    loadClassStudents();
    trackWelcomeCardImpression('teacher');
    // Load subject from local storage (backend doesn't persist subject field)
    if (user?.id) {
      AsyncStorage.getItem('kilbil_teacher_subjects').then((raw) => {
        if (raw) {
          const map = JSON.parse(raw);
          if (map[user.id]) setLocalSubject(map[user.id]);
        }
      }).catch(() => {});
    }
  }, []);

  const loadClassStudents = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    try {
      const response = await Promise.race([
        getClassStudents({ teacherId: user.id }).unwrap(),
        timeout,
      ]) as any;
      if (response.success) {
        setClassData(response.data);
      } else {
        setClassData(null);
      }
    } catch (error: any) {
      console.error('Error loading class students:', error);
      setClassData(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    if (!classData?.students) return [];

    let filtered = classData.students;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.registrationNo.toLowerCase().includes(query) ||
          student.classRollNo.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        case 'rollNo':
          return parseInt(a.classRollNo) - parseInt(b.classRollNo);
        case 'registrationNo':
          return a.registrationNo.localeCompare(b.registrationNo);
        default:
          return 0;
      }
    });

    return sorted;
  }, [classData?.students, searchQuery, sortBy]);

  const handleMarkAttendance = () => {
    navigation.navigate('TeacherAttendanceTab', {
      screen: 'TakeAttendance',
    });
  };

  const handleViewProfile = (student: ClassStudentApi) => {
    // TODO: Navigate to student profile or show modal
    Alert.alert('Student Profile', `${student.firstName} ${student.lastName}\nRoll No: ${student.classRollNo}\nRegistration: ${student.registrationNo}`);
  };

  const handleContactAdmin = () => {
    Alert.alert('Contact Admin', 'Please contact your administrator to get assigned to a class.');
  };

  const handleSwitchClass = () => {
    Alert.alert('Switch Class', 'Class switching functionality will be available soon.');
  };

  const getRecentActivity = () => {
    // TODO: Get actual recent activity
    return [
      { id: '1', type: 'task', message: 'Created Math assignment', time: '2 hours ago' },
      { id: '2', type: 'event', message: 'Added parent meeting to calendar', time: '4 hours ago' },
      { id: '3', type: 'chat', message: 'Received message from Sarah\'s parent', time: '1 day ago' },
    ];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
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
              <Text style={styles.teacherRole}>
                {teacherProfileData?.data?.teacher?.subject
                  ? `${teacherProfileData.data.teacher.subject} Teacher`
                  : (user as any)?.subject
                  ? `${(user as any).subject} Teacher`
                  : localSubject
                  ? `${localSubject} Teacher`
                  : 'Teacher'}
              </Text>
              {(teacherProfileData?.data?.teacher?.class || (user as any)?.class) && (
                <Text style={styles.teacherClassBadge}>
                  Class Teacher · Class{' '}
                  {teacherProfileData?.data?.teacher?.class ?? (user as any)?.class}
                  {' – '}Section{' '}
                  {teacherProfileData?.data?.teacher?.section ?? (user as any)?.section}
                </Text>
              )}
            </View>
          </View>
          
          {classData && (
            <View style={styles.classSelector}>
              <Text style={styles.selectorLabel}>Current Class:</Text>
              <TouchableOpacity style={styles.selectorButton}>
                <Text style={styles.selectorButtonText}>
                  Class {classData.class} - Section {classData.section}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Welcome Card */}
        <WelcomeCard
          onPress={() => setIsCarouselVisible(true)}
          accentColor="#28A745"
        />

        {/* My Classes / Students Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes / Students</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2F6FED" />
              <Text style={styles.loadingText}>Loading class data...</Text>
            </View>
          ) : !classData ? (
            <EmptyClassState
              onContactAdmin={handleContactAdmin}
              onSwitchClass={handleSwitchClass}
            />
          ) : (
            <>
              {/* Class Header & KPI */}
              <View style={styles.classHeaderCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.classHeaderTitle}>
                    Class {classData.class} - Section {classData.section}
                  </Text>
                  <TouchableOpacity
                    style={styles.takeAttendanceHeaderButton}
                    onPress={handleMarkAttendance}
                  >
                    <Text style={styles.takeAttendanceHeaderButtonText}>Take Attendance</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.kpiCard}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiNumber}>{classData.count}</Text>
                    <Text style={styles.kpiLabel}>Total Students</Text>
                  </View>
                </View>
              </View>

              {/* Search and Sort */}
              <View style={styles.searchSortContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                />
                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>Sort by:</Text>
                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
                    onPress={() => setSortBy('name')}
                  >
                    <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>Name</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'rollNo' && styles.sortButtonActive]}
                    onPress={() => setSortBy('rollNo')}
                  >
                    <Text style={[styles.sortButtonText, sortBy === 'rollNo' && styles.sortButtonTextActive]}>Roll No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'registrationNo' && styles.sortButtonActive]}
                    onPress={() => setSortBy('registrationNo')}
                  >
                    <Text style={[styles.sortButtonText, sortBy === 'registrationNo' && styles.sortButtonTextActive]}>Reg No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Students List */}
              <View style={styles.studentsListContainer}>
                <Text style={styles.studentsListTitle}>
                  Students ({filteredAndSortedStudents.length})
                </Text>
                {filteredAndSortedStudents.length === 0 ? (
                  <View style={styles.noStudentsContainer}>
                    <Text style={styles.noStudentsText}>
                      {searchQuery ? 'No students found matching your search.' : 'No students in this class.'}
                    </Text>
                  </View>
                ) : (
                  filteredAndSortedStudents.map((student) => (
                    <View key={student._id} style={styles.studentItem}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {student.firstName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.firstName} {student.lastName}
                        </Text>
                        <Text style={styles.studentDetails}>
                          Roll No: {student.classRollNo} • Reg: {student.registrationNo}
                        </Text>
                      </View>
                      <View style={styles.studentActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleViewProfile(student)}
                        >
                          <Text style={styles.actionButtonText}>Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonPrimary]}
                          onPress={handleMarkAttendance}
                        >
                          <Text style={styles.actionButtonPrimaryText}>Attendance</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </View>

      </ScrollView>
      
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
      <WelcomeCarouselModal
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        userRole="teacher"
      />
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
  teacherClassBadge: {
    fontSize: 12,
    color: '#B3D4FF',
    marginTop: 2,
    opacity: 0.85,
  },
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 16,
    color: '#fff',
    marginRight: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectorButtonText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  selectorArrow: {
    color: '#fff',
    fontSize: 12,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  classCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  classCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedClassCard: {
    borderWidth: 2,
    borderColor: '#2F6FED',
  },
  classCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classCardCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  takeAttendanceButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  takeAttendanceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  studentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  studentInfo: {
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
  studentDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionButtonPrimary: {
    backgroundColor: '#2F6FED',
  },
  actionButtonText: {
    color: '#2F6FED',
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  attendancePercentage: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  messageButtonText: {
    color: '#2F6FED',
    fontSize: 12,
    fontWeight: '600',
  },
  classHeaderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  takeAttendanceHeaderButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  takeAttendanceHeaderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchSortContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortButtonActive: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  studentsListContainer: {
    marginTop: 8,
  },
  studentsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noStudentsContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noStudentsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  activityItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DashboardScreen;
