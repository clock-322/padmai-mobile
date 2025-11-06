import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomModal } from '../../hooks/useCustomModal';
import CustomModal from '../../components/CustomModal';
import EditProfileModal from '../../components/EditProfileModal';

const ProfileModal = () => {
  const { user, logout } = useAuth();
  const { visible, config, showConfirm, hideModal } = useCustomModal();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      logout,
      () => {
        // Cancel action - do nothing
      }
    );
  };

  const handleManageSchoolInfo = () => {
    showConfirm(
      'Manage School Info',
      'School information management would be implemented here.\n\nThis would include:\n• School name and details\n• Contact information\n• Academic calendar\n• Fee structure\n• Staff management',
      () => {
        // Confirm action - do nothing for now
      }
    );
  };

  const handleViewReports = () => {
    showConfirm(
      'View Reports',
      'Advanced reporting features would be available here.\n\nThis would include:\n• Financial reports\n• Attendance analytics\n• Academic performance\n• Export capabilities',
      () => {
        // Confirm action - do nothing for now
      }
    );
  };

  const handleSystemSettings = () => {
    showConfirm(
      'System Settings',
      'System configuration would be managed here.\n\nThis would include:\n• User permissions\n• Notification settings\n• Data backup\n• System preferences',
      () => {
        // Confirm action - do nothing for now
      }
    );
  };

  const handleHelpSupport = () => {
    showConfirm(
      'Help & Support',
      'Support resources would be available here.\n\nThis would include:\n• User documentation\n• Video tutorials\n• Contact support\n• FAQ section',
      () => {
        // Confirm action - do nothing for now
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👨‍💼</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName}</Text>
              <Text style={styles.profileRole}>School Administrator</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Teachers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>₹2.3L</Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleManageSchoolInfo}
            accessibilityLabel="Manage school information"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🏫</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage School Info</Text>
              <Text style={styles.actionSubtitle}>Update school details and settings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleViewReports}
            accessibilityLabel="View reports and analytics"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionSubtitle}>Analytics and detailed reports</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleSystemSettings}
            accessibilityLabel="Access system settings"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>⚙️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>System Settings</Text>
              <Text style={styles.actionSubtitle}>Configure system preferences</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleHelpSupport}
            accessibilityLabel="Get help and support"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>❓</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionSubtitle}>Documentation and support</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setShowEditModal(true)}
            accessibilityLabel="Edit profile information"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>✏️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Edit Profile</Text>
              <Text style={styles.actionSubtitle}>Update your personal information</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => showConfirm('Change Password', 'Password change would be implemented here', () => {})}
            accessibilityLabel="Change password"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🔒</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>Update your account password</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.logoutItem]}
            onPress={handleLogout}
            accessibilityLabel="Logout from account"
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🚪</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.logoutText]}>Logout</Text>
              <Text style={styles.actionSubtitle}>Sign out of your account</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <CustomModal
        visible={visible}
        title={config.title}
        message={config.message}
        type={config.type}
        showIcon={config.showIcon}
        buttons={config.buttons}
        onClose={hideModal}
      />

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
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
    paddingTop: 44,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  profileRole: {
    fontSize: 17,
    color: '#B3D4FF',
    marginBottom: 4,
    fontWeight: '600',
    lineHeight: 22,
  },
  profileEmail: {
    fontSize: 15,
    color: '#B3D4FF',
    lineHeight: 20,
    fontWeight: '500',
  },
  statsSection: {
    padding: 24,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 20,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2F6FED',
    marginBottom: 8,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  statLabel: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  accountSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIconText: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 22,
    color: '#adb5bd',
    fontWeight: '300',
  },
  logoutItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  logoutText: {
    color: '#DC3545',
  },
});

export default ProfileModal;
