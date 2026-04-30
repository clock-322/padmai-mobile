import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import EditProfileModal from '../../components/EditProfileModal';
import { useGetTeacherByIdQuery } from '../../store/services/teachersApi';
import { useGetClassStudentsMutation } from '../../store/services/studentsApi';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [classInfo, setClassInfo] = useState<{ class?: string; section?: string } | null>(null);

  const { data: teacherProfileData, isLoading: isLoadingProfile } = useGetTeacherByIdQuery(
    (user as any)?.id ?? '',
    { skip: !(user as any)?.id }
  );
  const teacherProfile = teacherProfileData?.data?.teacher;

  const [getClassStudents] = useGetClassStudentsMutation();

  // Fetch class info from class-students endpoint as a fallback
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await getClassStudents({ teacherId: user.id }).unwrap() as any;
        if (res.success && res.data) {
          setClassInfo({ class: res.data.class, section: res.data.section });
        }
      } catch {}
    })();
  }, [user?.id]);

  // Derive assigned class from API response, class-students endpoint, OR auth user state
  const tp = teacherProfile as any;
  const assignedClass = tp?.class ?? tp?.assignedClass
    ?? classInfo?.class
    ?? (user as any)?.class ?? (user as any)?.assignedClass ?? null;
  const assignedSection = tp?.section ?? tp?.assignedSection
    ?? classInfo?.section
    ?? (user as any)?.section ?? (user as any)?.assignedSection ?? null;
  const assignedSubject = tp?.subject ?? tp?.assignedSubject
    ?? (user as any)?.subject ?? (user as any)?.assignedSubject ?? null;
  const assignedRole = tp?.role ?? (user as any)?.teacherRole ?? null;

  const handleLogout = () => {
    try {
      console.debug('🚪 Teacher logout initiated');
      onClose(); // Close modal first
      logout(); // Then logout
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still try to logout even if there's an error
      logout();
    }
  };

  const handleSwitchClass = () => {
    console.debug('Switch class functionality will be implemented');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Teacher Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user as any)?.name?.charAt(0) || 'T'}
                </Text>
              </View>
              <Text style={styles.name}>{(user as any)?.name || 'Teacher'}</Text>
              <Text style={styles.email}>{user?.email || 'teacher@school.com'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Assignment</Text>
              {isLoadingProfile ? (
                <View style={styles.classItem}>
                  <Text style={styles.className}>Loading...</Text>
                </View>
              ) : assignedClass || assignedSubject ? (
                <>
                  {assignedClass ? (
                    <View style={styles.assignmentRow}>
                      <Text style={styles.assignmentLabel}>Class</Text>
                      <Text style={styles.assignmentValue}>
                        Class {assignedClass}{assignedSection ? ` – Section ${assignedSection}` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {assignedSubject ? (
                    <View style={styles.assignmentRow}>
                      <Text style={styles.assignmentLabel}>Subject</Text>
                      <Text style={styles.assignmentValue}>{assignedSubject}</Text>
                    </View>
                  ) : null}
                  <View style={styles.assignmentRow}>
                    <Text style={styles.assignmentLabel}>Role</Text>
                    <Text style={styles.assignmentValue}>
                      {assignedRole ? assignedRole :
                        assignedSubject
                          ? `Class Teacher - ${assignedSubject} Teacher`
                          : 'Class Teacher'}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.classItem}>
                  <Text style={styles.className}>No Assignment available yet</Text>
                  <Text style={styles.studentCount}>Contact admin to get assigned</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowEditModal(true)}>
                <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSwitchClass}>
                <Text style={styles.actionButtonText}>Switch Class</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  classItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  assignmentLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  assignmentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F6FED',
  },
  actionButton: {
    backgroundColor: '#2F6FED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    padding: 16,
    borderRadius: 12,
    marginBottom: 0,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileModal;
