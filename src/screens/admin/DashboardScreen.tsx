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
import { useGetTeachersQuery } from '../../store/services/teachersApi';
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
  }, [students, attendance, events, paymentsAdmin, teachersData]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate total students
      const totalStudents = students.length;

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

      // Calculate payments
      const paymentsDue = paymentsAdmin.filter(p => p.status === 'due' || p.status === 'overdue').length;
      const paymentsTotal = paymentsAdmin.length;

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
            <Text style={styles.logo}>📚 Padmai</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {user?.fullName?.split(' ')[0]}!</Text>
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminAvatar}>👨‍💼</Text>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{user?.fullName}</Text>
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
  adminAvatar: {
    fontSize: 28,
    marginRight: 14,
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
});

export default DashboardScreen;
