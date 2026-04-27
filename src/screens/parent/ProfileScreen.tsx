import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useNavigation } from '@react-navigation/native';
import { useModal } from '../../contexts/ModalContext';
import EditProfileModal, { getStoredAvatarUri } from '../../components/EditProfileModal';

const { width } = Dimensions.get('window');

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  type?: 'default' | 'danger';
}

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { students } = useData();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useModal();
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    getStoredAvatarUri().then(uri => setAvatarUri(uri));
  }, [showEditModal]); // reload after edit modal closes
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  const child = students.find(s => s.id === user?.childId);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleChangePassword = () => {
    setCpCurrent('');
    setCpNew('');
    setCpConfirm('');
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async () => {
    if (!cpCurrent.trim()) { showAlert('Error', 'Please enter your current password'); return; }
    if (cpNew.length < 6)  { showAlert('Error', 'New password must be at least 6 characters'); return; }
    if (cpNew !== cpConfirm) { showAlert('Error', 'Passwords do not match'); return; }
    setCpLoading(true);
    await new Promise<void>(r => setTimeout(r, 1000));
    setCpLoading(false);
    setShowChangePasswordModal(false);
    showAlert('Success', 'Password changed successfully!');
  };

  const handleNotificationSettings = () => {
    showAlert('Notifications', 'Coming Soon from Next Year\n\nPush notifications for attendance, events and messages will be available from the next academic year.');
  };

  const handlePrivacySettings = () => {
    showAlert('Privacy', 'Privacy settings will be implemented');
  };

  const handleHelpSupport = () => {
    showAlert(
      'Help & Support',
      'For any help or support, please contact:\n\nKishor Nerkar\n📞 9021487657\n\nWe are always here to assist you and your family.'
    );
  };

  const handleAbout = () => {
    showAlert('About', 'Kilbil School Management System\nVersion 1.0.0\n\nA comprehensive school management solution for parents, teachers, and administrators.');
  };

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to log out?',
      logout,
      () => console.log('Logout cancelled')
    );
  };

  const profileMenuItems: ProfileMenuItem[] = [
    {
      id: 'edit',
      title: 'Edit Profile',
      icon: '✏️',
      onPress: handleEditProfile,
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: '🔒',
      onPress: handleChangePassword,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      onPress: handleNotificationSettings,
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      icon: '🛡️',
      onPress: handlePrivacySettings,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: '❓',
      onPress: handleHelpSupport,
    },
    {
      id: 'about',
      title: 'About',
      icon: 'ℹ️',
      onPress: handleAbout,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: '🚪',
      onPress: handleLogout,
      type: 'danger',
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'parent':
        return 'Parent';
      case 'teacher':
        return 'Teacher';
      case 'schoolOwner':
        return 'School Owner';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent':
        return '👨‍👩‍👧‍👦';
      case 'teacher':
        return '👩‍🏫';
      case 'schoolOwner':
        return '🏫';
      default:
        return '👤';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>👤 Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatar} onPress={handleEditProfile}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials((user as any)?.name || '')}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editAvatarIcon}>📷</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{(user as any)?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.roleIcon}>{getRoleIcon(user?.role || '')}</Text>
                <Text style={styles.roleText}>
                  {getRoleDisplayName(user?.role || '')}
                </Text>
              </View>
            </View>
          </View>

          {child && (
            <View style={styles.childInfo}>
              <Text style={styles.childInfoTitle}>Your Child</Text>
              <View style={styles.childCard}>
                <Text style={styles.childAvatar}>{child.avatar}</Text>
                <View style={styles.childDetails}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childGrade}>{child.grade} - {child.class}</Text>
                  <Text style={styles.childTeacher}>Teacher: {child.teacher}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {profileMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.type === 'danger' && styles.dangerMenuItem,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.menuItemText,
                    item.type === 'danger' && styles.dangerText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Kilbil School Management</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            A comprehensive school management solution for parents, teachers, and administrators.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleNotificationSettings}
            >
              <Text style={styles.quickActionIcon}>🔔</Text>
              <Text style={styles.quickActionText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleHelpSupport}
            >
              <Text style={styles.quickActionIcon}>❓</Text>
              <Text style={styles.quickActionText}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAbout}
            >
              <Text style={styles.quickActionIcon}>ℹ️</Text>
              <Text style={styles.quickActionText}>About</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Change Password Modal */}
      <Modal visible={showChangePasswordModal} transparent animationType="slide" onRequestClose={() => setShowChangePasswordModal(false)}>
        <View style={styles.cpOverlay}>
          <View style={styles.cpModal}>
            <Text style={styles.cpTitle}>Change Password</Text>

            <Text style={styles.cpLabel}>Current Password</Text>
            <TextInput style={styles.cpInput} value={cpCurrent} onChangeText={setCpCurrent}
              secureTextEntry placeholder="Enter current password" placeholderTextColor="#999" editable={!cpLoading} />

            <Text style={styles.cpLabel}>New Password</Text>
            <TextInput style={styles.cpInput} value={cpNew} onChangeText={setCpNew}
              secureTextEntry placeholder="Min. 6 characters" placeholderTextColor="#999" editable={!cpLoading} />

            <Text style={styles.cpLabel}>Confirm New Password</Text>
            <TextInput style={styles.cpInput} value={cpConfirm} onChangeText={setCpConfirm}
              secureTextEntry placeholder="Re-enter new password" placeholderTextColor="#999" editable={!cpLoading} />

            <View style={styles.cpButtons}>
              <TouchableOpacity style={styles.cpCancel} onPress={() => setShowChangePasswordModal(false)} disabled={cpLoading}>
                <Text style={styles.cpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cpSubmit, cpLoading && styles.cpSubmitDisabled]} onPress={handleChangePasswordSubmit} disabled={cpLoading}>
                {cpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cpSubmitText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B3D4FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editAvatarIcon: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  roleText: {
    fontSize: 14,
    color: '#2F6FED',
    fontWeight: '600',
  },
  childInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  childInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    color: '#333',
    marginBottom: 2,
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childTeacher: {
    fontSize: 12,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F6FED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerMenuItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dangerText: {
    color: '#DC3545',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  appInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: width < 400 ? '48%' : '23%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  cpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  cpModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '88%' },
  cpTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  cpLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  cpInput: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 12, fontSize: 15, color: '#333', marginBottom: 16 },
  cpButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cpCancel: { flex: 1, paddingVertical: 13, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' },
  cpCancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  cpSubmit: { flex: 1, paddingVertical: 13, borderRadius: 8, backgroundColor: '#2F6FED', alignItems: 'center' },
  cpSubmitDisabled: { opacity: 0.6 },
  cpSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ProfileScreen;