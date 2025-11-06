import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useGetPaymentsByStudentIdMutation } from '../../store/services/paymentsApi';
import { PaymentApiItem } from '../../types/payments';
import { useGetStudentsByParentIdMutation } from '../../store/services/studentsApi';
import { StudentApi } from '../../types/students';
import ProfileIcon from '../../components/ProfileIcon';
import AddStudentModal from '../../components/parent/AddStudentModal';
import StudentCard from '../../components/parent/StudentCard';
import StudentProfileModal from '../../components/parent/StudentProfileModal';
import WelcomeCard from '../../components/WelcomeCard';
import WelcomeCarouselModal from '../../components/WelcomeCarouselModal';
import { trackWelcomeCardImpression } from '../../utils/analytics';

interface QuickSummary {
  attendance: {
    present: number;
    absent: number;
    percentage: number;
  };
  upcomingEvents: number;
  payments: {
    due: number;
    amount: number;
    status: 'Due' | 'Paid';
  };
}

interface RecentActivity {
  id: string;
  type: 'message' | 'task' | 'payment' | 'attendance';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

const HomeDashboard = () => {
  const { user } = useAuth();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const { students, events, attendance, isLoading: dataLoading } = useData();
  const [summary, setSummary] = useState<QuickSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiPayments, setApiPayments] = useState<PaymentApiItem[]>([]);
  const [fetchPayments, { isLoading: loadingPayments }] = useGetPaymentsByStudentIdMutation();
  
  // Student management state
  const [apiStudents, setApiStudents] = useState<StudentApi[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentApi | null>(null);
  const [getStudentsByParentId] = useGetStudentsByParentIdMutation();
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      // Find child data - use childId from user or fallback to static student
      const currentUser = reduxUser || user;
      const childId = (currentUser as any)?.childId;
      const child = childId ? students.find(s => s.id === childId) : students.find(s => s.id === 's_1');
      
      if (!child) {
        setLoading(false);
        return;
      }

      // Calculate attendance summary (last 7 days)
      const last7Days = attendance.filter(a => 
        a.studentId === child.id && 
        new Date(a.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      const present = last7Days.filter(a => a.status === 'present').length;
      const absent = last7Days.filter(a => a.status === 'absent').length;
      const percentage = last7Days.length > 0 ? Math.round((present / last7Days.length) * 100) : 0;

      // Get upcoming events (next 3)
      const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

      // Fetch payment data from API using studentId with timeout
      // Use hardcoded STU001 as fallback similar to PaymentsScreen
      const studentId = 'STU001';
      
      const paymentPromise = fetchPayments({ studentId }).unwrap();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment API timeout')), 3000)
      );
      
      try {
        const paymentsResponse = await Promise.race([paymentPromise, timeoutPromise]) as any;
        const paymentsData = paymentsResponse.data?.payments || [];
        setApiPayments(paymentsData);
        
        // Calculate payment summary from API data
        const totalAmount = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
        const paymentCount = paymentsData.length;
        
        setSummary({
          attendance: { present, absent, percentage },
          upcomingEvents: upcomingEvents.length,
          payments: {
            due: paymentCount,
            amount: totalAmount,
            status: paymentCount > 0 ? 'Due' : 'Paid'
          }
        });
      } catch (error) {
        console.error('Error fetching payments:', error);
        // Fallback to default summary if API fails
        setSummary({
          attendance: { present, absent, percentage },
          upcomingEvents: upcomingEvents.length,
          payments: {
            due: 0,
            amount: 0,
            status: 'Paid'
          }
        });
      }

      // Generate recent activity
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'message',
          title: 'Message from Teacher',
          description: 'Alex had a great day today!',
          timestamp: '2 hours ago',
          icon: '💬'
        },
        {
          id: '2',
          type: 'attendance',
          title: 'Attendance Updated',
          description: 'Present today',
          timestamp: '1 day ago',
          icon: '✅'
        },
        {
          id: '3',
          type: 'task',
          title: 'New Assignment',
          description: 'Math homework due tomorrow',
          timestamp: '2 days ago',
          icon: '📝'
        },
        {
          id: '4',
          type: 'payment',
          title: 'Payment Reminder',
          description: 'School fees due next week',
          timestamp: '3 days ago',
          icon: '💳'
        }
      ];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [reduxUser, user, students, attendance, events, fetchPayments]);

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
    if (!dataLoading && students.length > 0) {
      loadDashboardData();
    }
  }, [dataLoading, students.length, loadDashboardData]);

  useEffect(() => {
    const currentUser = reduxUser || user;
    if (currentUser?.id) {
      loadStudents();
    }
    trackWelcomeCardImpression('parent');
  }, [reduxUser, user, loadStudents]);


  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'attendance':
        Alert.alert('Navigation', 'Opening Attendance screen...');
        break;
      case 'calendar':
        Alert.alert('Navigation', 'Opening Calendar screen...');
        break;
      case 'payment':
        Alert.alert('Navigation', 'Opening Payments screen...');
        break;
      case 'message':
        Alert.alert('Navigation', 'Opening Chat screen...');
        break;
    }
  };

  const handleViewPayments = () => {
    Alert.alert('Navigation', 'Opening Payments screen...');
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6FED" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const currentUser = reduxUser || user;
  const childId = (currentUser as any)?.childId;
  const child = childId ? students.find(s => s.id === childId) : students.find(s => s.id === 's_1');

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `₹${amount}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>📚 Padmai</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {((currentUser as any)?.name || (currentUser as any)?.fullName || 'User')?.split(' ')[0]}!</Text>
              <ProfileIcon />
            </View>
          </View>
          {child && (
            <View style={styles.childInfo}>
              <Text style={styles.childAvatar}>👦</Text>
              <View style={styles.childDetails}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childGrade}>Grade {child.grade}</Text>
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
              {apiStudents.map((student) => (
                <StudentCard
                  key={student.id}
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

        {/* Quick Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryCards}>
            {/* Attendance Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Attendance</Text>
              <Text style={styles.cardValue}>
                {summary?.attendance.present || 0} / {summary?.attendance.absent || 0}
              </Text>
              <Text style={styles.cardSubtext}>
                {summary?.attendance.percentage || 0}% present
              </Text>
              <View style={styles.sparkline}>
                {[1, 0, 1, 1, 0, 1, 1].map((dot, index) => (
                  <View
                    key={index}
                    style={[
                      styles.sparklineDot,
                      { backgroundColor: dot ? '#28A745' : '#DC3545' }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Events Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardIcon}>📅</Text>
              <Text style={styles.cardTitle}>Upcoming Events</Text>
              <Text style={styles.cardValue}>{summary?.upcomingEvents || 0}</Text>
              <Text style={styles.cardSubtext}>Next 7 days</Text>
            </View>

            {/* Payments Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardIcon}>💳</Text>
              <Text style={styles.cardTitle}>Payments</Text>
              <Text style={styles.cardValue}>
                {summary?.payments.amount ? formatCurrency(summary.payments.amount) : '₹0'}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: summary?.payments.status === 'Due' ? '#DC3545' : '#28A745' }
              ]}>
                <Text style={styles.statusText}>{summary?.payments.status || 'Paid'}</Text>
              </View>
              <TouchableOpacity style={styles.viewButton} onPress={handleViewPayments}>
                <Text style={styles.viewButtonText}>View Payments</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('attendance')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>View Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('calendar')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Open Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('payment')}
            >
              <Text style={styles.quickActionIcon}>💳</Text>
              <Text style={styles.quickActionText}>Mark Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('message')}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Message Teacher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            💡 Payments are processed via school portal
          </Text>
          <Text style={styles.footerSubtext}>
            Updated 2 days ago
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
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
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F6FED',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparklineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
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
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  footerInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
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
});

export default HomeDashboard;