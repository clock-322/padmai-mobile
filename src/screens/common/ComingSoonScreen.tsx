import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

const PARENT_FEATURES: FeatureItem[] = [
  { icon: '💬', title: 'Chat with Teachers', description: 'Directly message your teachers and admins' },
  { icon: '📋', title: 'PTA Scheduler', description: 'Parents and teachers can select a suitable meeting day and schedule PTM meeting easily' },
  { icon: '📍', title: 'Live Tracking / Location', description: "Track your children's current location in real time for safety and peace of mind" },
  { icon: '🤖', title: 'AI Teacher & Videos', description: 'Students can ask questions to AI and get video-based guidance for better learning' },
  { icon: '📢', title: 'News & Announcement Feed', description: 'Stay updated with school news, announcements, and important updates in one place' },
  { icon: '📚', title: 'Study Material', description: 'Teachers can send PDF, documents and study material directly to students' },
  { icon: '🧩', title: 'IQ & Mystery Games', description: 'Students can play games and win reward points to get school accessories according to their needs' },
  { icon: '🎁', title: 'Reward Points', description: 'Students redeem reward points and get school accessories according to their needs' },
  { icon: '📝', title: 'Homework Tracker', description: 'Track daily homework assignments' },
];

const TEACHER_FEATURES: FeatureItem[] = [
  { icon: '📝', title: 'Homework Assignment', description: 'Assign and track homework' },
  { icon: '📊', title: 'Report Cards', description: 'Generate student report cards' },
  { icon: '👥', title: 'Parent Meetings', description: 'Schedule parent-teacher meetings' },
  { icon: '📚', title: 'Study Material', description: 'Share notes and study resources' },
  { icon: '📍', title: 'Live Tracking of Students', description: 'Live location of students or current location' },
  { icon: '🔔', title: 'Push Notifications', description: 'Remind students/parents about homework, assignments, projects and activities' },
];

const ADMIN_FEATURES: FeatureItem[] = [
  { icon: '💬', title: 'Chat System', description: 'In-app messaging for staff and parents' },
  { icon: '📍', title: 'Student Live Tracking', description: 'Track student locations in real-time for safety' },
  { icon: '💰', title: 'Financial Overview', description: 'Comprehensive financial dashboards with income, expenses, and reports' },
  { icon: '📄', title: 'Document Management', description: 'Centralized document storage for certificates and records' },
  { icon: '📋', title: 'Timetable Creation', description: 'Create and assign class timetables' },
  { icon: '📊', title: 'Report Generation', description: 'Generate detailed school reports' },
  { icon: '📢', title: 'Bulk Notifications', description: 'Send announcements to all parents' },
];

const ComingSoonScreen = ({ route }: any) => {
  const role = route?.params?.role || 'parent';

  const features =
    role === 'teacher'
      ? TEACHER_FEATURES
      : role === 'admin'
      ? ADMIN_FEATURES
      : PARENT_FEATURES;

  const themeColor =
    role === 'teacher' ? '#43A047' : role === 'admin' ? '#7B1FA2' : '#2F6FED';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🚀</Text>
          <Text style={styles.headerTitle}>Coming Soon</Text>
          <Text style={styles.headerSubtitle}>
            Exciting new features are on the way!
          </Text>
        </View>

        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: themeColor + '15' }]}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: themeColor + '20' }]}>
                <Text style={[styles.badgeText, { color: themeColor }]}>Soon</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Stay tuned for updates!
          </Text>
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
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  featureList: {
    paddingHorizontal: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 13,
    color: '#888',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ComingSoonScreen;
