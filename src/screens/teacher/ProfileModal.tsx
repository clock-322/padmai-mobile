import React, { useState } from 'react';
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
import { useData } from '../../providers/DataProvider';
import EditProfileModal from '../../components/EditProfileModal';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, logout } = useAuth();
  const { students } = useData();
  const [showEditModal, setShowEditModal] = useState(false);

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
    // TODO: Implement class switching
    console.debug('Switch class functionality will be implemented');
  };

  const getTeacherClasses = () => {
    // TODO: Get teacher's classes from data
    return ['Class 1A', 'Class 2B', 'Class 3C'];
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
                  {user?.fullName?.charAt(0) || 'T'}
                </Text>
              </View>
              <Text style={styles.name}>{user?.fullName || 'Teacher'}</Text>
              <Text style={styles.email}>{user?.email || 'teacher@school.com'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Classes</Text>
              {getTeacherClasses().map((className, index) => (
                <View key={index} style={styles.classItem}>
                  <Text style={styles.className}>{className}</Text>
                  <Text style={styles.studentCount}>
                    {students.filter(s => s.classId === `class_${index + 1}`).length} students
                  </Text>
                </View>
              ))}
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
