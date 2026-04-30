import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { useGetStudentsByParentIdMutation } from '../../store/services/studentsApi';
import { StudentApi } from '../../types/students';
import ProfileIcon from '../../components/ProfileIcon';
import AddStudentModal from '../../components/parent/AddStudentModal';
import StudentCard from '../../components/parent/StudentCard';
import StudentProfileModal from '../../components/parent/StudentProfileModal';
import WelcomeCard from '../../components/WelcomeCard';
import WelcomeCarouselModal from '../../components/WelcomeCarouselModal';
import { trackWelcomeCardImpression } from '../../utils/analytics';

const HomeDashboard = () => {
  const { user } = useAuth();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  // Student management state
  const [apiStudents, setApiStudents] = useState<StudentApi[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentApi | null>(null);
  const [getStudentsByParentId] = useGetStudentsByParentIdMutation();
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  const loadStudents = useCallback(async () => {
    const currentUser = reduxUser || user;
    if (!currentUser?.id) {
      return;
    }

    setLoadingStudents(true);
    try {
      const result = await getStudentsByParentId({ parentId: currentUser.id }).unwrap();
      if (result.success && result.data?.students) {
        setApiStudents(result.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Silently fail - students list will be empty
    } finally {
      setLoadingStudents(false);
    }
  }, [reduxUser, user, getStudentsByParentId]);

  useEffect(() => {
    const currentUser = reduxUser || user;
    if (currentUser?.id) {
      loadStudents();
    }
    trackWelcomeCardImpression('parent');
  }, [reduxUser, user, loadStudents]);


  const handleAddStudentSuccess = () => {
    loadStudents();
  };

  const handleStudentCardPress = (student: StudentApi) => {
    setSelectedStudent(student);
    setShowStudentProfileModal(true);
  };

  const handleStudentProfileSuccess = () => {
    loadStudents();
    setShowStudentProfileModal(false);
    setSelectedStudent(null);
  };

  const handleStudentProfileClose = () => {
    setShowStudentProfileModal(false);
    setSelectedStudent(null);
  };

  const currentUser = reduxUser || user;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>🏫 Kilbil School</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {((currentUser as any)?.name || (currentUser as any)?.fullName || 'User')?.split(' ')[0]}!</Text>
              <ProfileIcon />
            </View>
          </View>
          {apiStudents.length > 0 && (
            <View style={styles.childInfo}>
              <Text style={styles.childAvatar}>👦</Text>
              <View style={styles.childDetails}>
                <Text style={styles.childName}>{apiStudents[0].firstName} {apiStudents[0].lastName}</Text>
                <Text style={styles.childGrade}>Class {apiStudents[0].class}{apiStudents[0].section ? `-${apiStudents[0].section}` : ''}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Welcome Card */}
        <WelcomeCard
          onPress={() => setIsCarouselVisible(true)}
          accentColor="#007AFF"
        />

        {/* My Students Section */}
        <View style={styles.studentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Students</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddStudentModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Student</Text>
            </TouchableOpacity>
          </View>
          {loadingStudents ? (
            <View style={styles.loadingStudentsContainer}>
              <ActivityIndicator size="small" color="#2F6FED" />
              <Text style={styles.loadingStudentsText}>Loading students...</Text>
            </View>
          ) : apiStudents.length > 0 ? (
            <View style={styles.studentsList}>
              {apiStudents.map((student, index) => (
                <StudentCard
                  key={student.id || (student as any)._id || `student-${index}`}
                  student={student}
                  onPress={() => handleStudentCardPress(student)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👨‍🎓</Text>
              <Text style={styles.emptyStateText}>No students added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Student" to add your child's information
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 8 }} />

        {/* Benefits Section */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.comingSoonGrid}>
            {[
              { icon: '🏅', title: 'Sport Events', desc: 'Sports competitions and events for students' },
              { icon: '🧠', title: 'IQ Challenges', desc: 'Brain teasers and IQ challenges for students' },
              { icon: '🪪', title: 'Digital ID Card', desc: 'Digital ID card with live tracking or one time location' },
              { icon: '🎓', title: 'Scholarship', desc: 'Scholarship from 1st to 10th for rank holders' },
              { icon: '🏥', title: 'Medical Camp', desc: 'Regular medical camps for student health checkups' },
              { icon: '🛡️', title: 'Health Cover / Insurance', desc: 'Health cover and insurance for students' },
              { icon: '🎥', title: 'Webinar for Students', desc: "Webinar to understand your children's growth for their bright future" },
              { icon: '👨‍👩‍👧', title: 'Webinar for Parents', desc: "Webinar for parents to understand their children's growth and development" },
            ].map((item, idx) => (
              <View key={idx} style={styles.comingSoonCard}>
                <Text style={styles.comingSoonIcon}>{item.icon}</Text>
                <View style={styles.comingSoonContent}>
                  <Text style={styles.comingSoonTitle}>{item.title}</Text>
                  <Text style={styles.comingSoonDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* About Features Section */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.sectionTitle}>About Features</Text>
          <View style={styles.comingSoonGrid}>
            {[
              { icon: '✅', title: 'Daily Attendance & Live Location Tracking', desc: 'Track daily attendance and live location of students' },
              { icon: '📅', title: 'Calendar with Reminders', desc: 'Calendar with event reminder and task reminder' },
              { icon: '📊', title: 'Progress Report', desc: 'Progress report of every month, unit test and term examination' },
              { icon: '💳', title: 'Payment System', desc: 'Records, balance, dues - parents can pay from app and set autopay monthly' },
              { icon: '📋', title: 'PTA Scheduler', desc: 'Parents and teachers can select a suitable meeting day' },
              { icon: '📍', title: 'Live Tracking & Location', desc: 'Live location of students for safety' },
              { icon: '🤖', title: 'AI Teacher & Videos', desc: 'Students can ask questions to AI and get video-based guidance for better learning' },
              { icon: '📢', title: 'News & Announcement Feed', desc: 'Stay updated with school news, announcements and important updates in one place' },
              { icon: '🧩', title: 'IQ & Mystery Games', desc: 'Students can play games and win reward points to get school accessories' },
              { icon: '📚', title: 'Study Material', desc: 'Teachers will send PDF, documents and study material directly to students' },
              { icon: '🎁', title: 'Reward Points', desc: 'Students redeem reward points and get school accessories according to their needs' },
            ].map((item, idx) => (
              <View key={idx} style={styles.comingSoonCard}>
                <Text style={styles.comingSoonIcon}>{item.icon}</Text>
                <View style={styles.comingSoonContent}>
                  <Text style={styles.comingSoonTitle}>{item.title}</Text>
                  <Text style={styles.comingSoonDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddStudentModal
        visible={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={handleAddStudentSuccess}
      />
      <StudentProfileModal
        visible={showStudentProfileModal}
        student={selectedStudent}
        onClose={handleStudentProfileClose}
        onSuccess={handleStudentProfileSuccess}
      />
      <WelcomeCarouselModal
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        userRole="parent"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
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
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  childAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  childGrade: {
    fontSize: 14,
    color: '#B3D4FF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  studentsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 0,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  studentsList: {
    gap: 0,
  },
  loadingStudentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingStudentsText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  comingSoonSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  comingSoonGrid: {
    gap: 12,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comingSoonIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
    marginRight: 8,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  comingSoonDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  comingSoonBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
  },
});

export default HomeDashboard;