import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';
import StatCard from '../../components/admin/StatCard';
import PaymentRow from '../../components/admin/PaymentRow';
import { Payment } from '../../components/admin/PaymentRow';
import { useGetTeachersQuery, useGetAllStudentsQuery } from '../../store/services/teachersApi';
import { useGetAllPaymentsQuery } from '../../store/services/paymentsApi';
import WelcomeCard from '../../components/WelcomeCard';
import WelcomeCarouselModal from '../../components/WelcomeCarouselModal';
import { trackWelcomeCardImpression } from '../../utils/analytics';

type DashboardStackParamList = {
  AdminDashboard: undefined;
  StudentList: undefined;
  TeacherList: undefined;
  AdminProfileModal: undefined;
};

type DashboardScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();
  const { students, attendance, events, paymentsAdmin } = useData();
  const { data: teachersData, isLoading: teachersLoading } = useGetTeachersQuery();
  const { data: allStudentsData } = useGetAllStudentsQuery();
  const { data: allPaymentsData } = useGetAllPaymentsQuery();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    averageAttendance: 0,
    paymentsDue: 0,
    paymentsTotal: 0,
    upcomingEvents: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
    trackWelcomeCardImpression('admin');
  }, [students, attendance, events, paymentsAdmin, teachersData, allStudentsData, allPaymentsData]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate total students - prefer API data over local
      const totalStudents = allStudentsData?.data?.count || allStudentsData?.data?.students?.length || students.length;

      // Get total teachers from API
      const totalTeachers = teachersData?.data?.count || 0;

      // Calculate average attendance for current term
      const today = new Date();
      const termStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const termAttendance = attendance.filter(a => {
        const attendanceDate = new Date(a.date);
        return attendanceDate >= termStart;
      });

      const studentAttendanceMap = new Map();
      termAttendance.forEach(a => {
        if (!studentAttendanceMap.has(a.studentId)) {
          studentAttendanceMap.set(a.studentId, { present: 0, total: 0 });
        }
        const stats = studentAttendanceMap.get(a.studentId);
        stats.total++;
        if (a.status === 'present') stats.present++;
      });

      const attendancePercentages = Array.from(studentAttendanceMap.values())
        .map(stats => (stats.present / stats.total) * 100);
      const averageAttendance = attendancePercentages.length > 0
        ? Math.round(attendancePercentages.reduce((sum, p) => sum + p, 0) / attendancePercentages.length)
        : 0;

      // Calculate payments - prefer API data
      const apiPayments = allPaymentsData?.data?.payments || [];
      const allPayments = apiPayments.length > 0 ? apiPayments : paymentsAdmin;
      const paymentsDue = allPayments.filter((p: any) => p.status === 'due' || p.status === 'pending' || p.status === 'overdue').length;
      const paymentsTotal = allPayments.length;

      // Calculate upcoming events (next 30 days)
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const upcomingEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= nextMonth;
      }).length;

      setDashboardData({
        totalStudents,
        totalTeachers,
        averageAttendance,
        paymentsDue,
        paymentsTotal,
        upcomingEvents,
      });

      // Get recent payments (last 6)
      const sortedPayments = [...paymentsAdmin].sort((a, b) => 
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
      setRecentPayments(sortedPayments.slice(0, 6));

      // Get recent attendance by class
      const classAttendance = new Map();
      const todayStr = today.toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.date === todayStr);
      
      students.forEach(student => {
        const studentAttendance = todayAttendance.find(a => a.studentId === student.id);
        if (!classAttendance.has(student.classId)) {
          classAttendance.set(student.classId, { present: 0, total: 0 });
        }
        const classStats = classAttendance.get(student.classId);
        classStats.total++;
        if (studentAttendance?.status === 'present') classStats.present++;
      });

      const classAttendanceArray = Array.from(classAttendance.entries()).map(([classId, stats]) => ({
        classId,
        className: classId.replace('class_', 'Class '),
        present: stats.present,
        total: stats.total,
        percentage: Math.round((stats.present / stats.total) * 100),
      }));

      setRecentAttendance(classAttendanceArray);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = (payment: Payment) => {
    Alert.alert(
      'Mark as Received',
      `Mark payment of ₹${payment.amount} from ${payment.parentName} as received?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Received',
          onPress: () => {
            // TODO: Update payment status in data store
            Alert.alert('Success', 'Payment marked as received!');
          },
        },
      ]
    );
  };

  const handleSendReminder = (payment: Payment) => {
    Alert.alert('Reminder Sent', `Reminder sent to ${payment.parentName}`);
  };

  const handleViewHistory = (payment: Payment) => {
    Alert.alert('Payment History', `Viewing history for ${payment.studentName}`);
  };

  const handleExportCSV = () => {
    Alert.alert('Export CSV', 'CSV export functionality would be implemented here');
  };

  if (loading || teachersLoading) {
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
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatarCircle}>
              <Text style={styles.adminAvatarEmoji}>👨‍💼</Text>
            </View>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{(user as any)?.name}</Text>
              <Text style={styles.adminRole}>School Administrator</Text>
            </View>
          </View>
        </View>

        {/* Welcome Card */}
        <WelcomeCard
          onPress={() => setIsCarouselVisible(true)}
          accentColor="#DC3545"
        />

        {/* KPI Cards */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            <StatCard
              title="Total Students"
              value={dashboardData.totalStudents}
              icon="👥"
              color="#2F6FED"
              onPress={() => navigation.navigate('StudentList')}
              accessibilityLabel={`Total students: ${dashboardData.totalStudents}`}
            />
            <StatCard
              title="Teachers"
              value={dashboardData.totalTeachers}
              icon="👨‍🏫"
              color="#FF6B35"
              onPress={() => navigation.navigate('TeacherList')}
              accessibilityLabel={`Total teachers: ${dashboardData.totalTeachers}`}
            />
            <StatCard
              title="Avg Attendance"
              value={`${dashboardData.averageAttendance}%`}
              icon="📊"
              color="#28A745"
              subtitle="This term"
              accessibilityLabel={`Average attendance: ${dashboardData.averageAttendance} percent`}
            />
            <StatCard
              title="Payments Due"
              value={`${dashboardData.paymentsDue}/${dashboardData.paymentsTotal}`}
              icon="💳"
              color="#FFC107"
              accessibilityLabel={`Payments due: ${dashboardData.paymentsDue} out of ${dashboardData.paymentsTotal}`}
            />
            <StatCard
              title="Upcoming Events"
              value={dashboardData.upcomingEvents}
              icon="📅"
              color="#6F42C1"
              accessibilityLabel={`Upcoming events: ${dashboardData.upcomingEvents}`}
            />
          </View>
        </View>

        {/* Recent Payments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentPayments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onMarkReceived={handleMarkReceived}
              onSendReminder={handleSendReminder}
              onViewHistory={handleViewHistory}
            />
          ))}
        </View>

        {/* Recent Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Attendance by Class</Text>
          {recentAttendance.map((classData) => (
            <View key={classData.classId} style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Text style={styles.className}>{classData.className}</Text>
                <Text style={styles.attendancePercentage}>
                  {classData.percentage}%
                </Text>
              </View>
              <View style={styles.attendanceBar}>
                <View 
                  style={[
                    styles.attendanceFill, 
                    { width: `${classData.percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.attendanceDetails}>
                {classData.present} of {classData.total} students present
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>💳</Text>
              <Text style={styles.quickActionText}>View Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Attendance Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Create Event</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleExportCSV}
            >
              <Text style={styles.quickActionIcon}>📤</Text>
              <Text style={styles.quickActionText}>Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              { icon: '🎥', title: 'Webinar for Students', desc: "Webinar to understand children's growth for their bright future" },
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

        {/* Features of Kilbil School Application */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.sectionTitle}>Features of Kilbil School Application</Text>
          <View style={styles.comingSoonGrid}>
            {[
              { icon: '💬', title: 'Chats with Teachers & Parents', desc: 'Direct messaging between teachers and parents' },
              { icon: '📍', title: 'Live Tracking of Students', desc: 'Monitor student locations in real-time' },
              { icon: '🚌', title: 'Bus Live Tracking', desc: 'Track school buses in real-time' },
              { icon: '💰', title: 'Financial Overview & Reporting', desc: 'Comprehensive financial dashboards with income, expenses' },
              { icon: '🔗', title: 'Integration with Transport App', desc: 'Seamless integration with transport management' },
              { icon: '📄', title: 'Document Management', desc: 'Centralized document storage for certificates and records' },
              { icon: '🚨', title: 'Emergency Broadcast', desc: 'Send urgent notifications to all parents, teachers, and staff' },
              { icon: '🗓️', title: 'Timetable & Curriculum Creation', desc: 'Create and manage class timetables and curriculum' },
              { icon: '🔔', title: 'Bulk Notifications', desc: 'Send reminders or notifications individually or in bulk' },
              { icon: '📊', title: 'Report Generation', desc: 'Generate detailed school reports' },
              { icon: '📋', title: 'PTM Scheduler', desc: 'Schedule parent-teacher meetings easily' },
              { icon: '📢', title: 'News & Announcement Feed', desc: 'Stay updated with school news and announcements' },
              { icon: '📚', title: 'Study Material', desc: 'Share study materials with students' },
              { icon: '🧩', title: 'IQ & Mystery Games', desc: 'Students play games and earn reward points' },
              { icon: '🎁', title: 'Reward Points', desc: 'Students buy school items with earned reward points' },
              { icon: '📝', title: 'Homework & Assignment Tracker', desc: 'Track daily homework and assignments' },
              { icon: '⚠️', title: 'Behaviour & Incident Reporting', desc: 'Report and track student behaviour and incidents' },
              { icon: '📂', title: 'File Sharing for Study Material', desc: 'Share PDFs and documents with students' },
              { icon: '✅', title: 'Attendance Report', desc: 'Comprehensive attendance reports by class and student' },
              { icon: '📈', title: 'Progress Report', desc: 'Monthly, unit test and term examination reports' },
              { icon: '💳', title: 'Payment System', desc: 'Complete payment management with records and dues' },
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

      <WelcomeCarouselModal
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        userRole="admin"
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
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B3D4FF',
    lineHeight: 22,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adminAvatarEmoji: {
    fontSize: 26,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  adminRole: {
    fontSize: 14,
    color: '#B3D4FF',
    lineHeight: 20,
    fontWeight: '500',
  },
  kpiSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 18,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  viewAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2F6FED',
    borderRadius: 10,
    shadowColor: '#2F6FED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  attendanceCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  attendancePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F6FED',
    letterSpacing: -0.5,
  },
  attendanceBar: {
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: '#2F6FED',
    borderRadius: 5,
  },
  attendanceDetails: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  comingSoonSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    marginTop: -10,
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

export default DashboardScreen;
