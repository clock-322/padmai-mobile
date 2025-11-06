import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents, fetchPayments } from '../api/api';
import { format } from 'date-fns';
import WelcomeCard from '../components/WelcomeCard';
import WelcomeCarouselModal from '../components/WelcomeCarouselModal';
import { trackWelcomeCardImpression } from '../utils/analytics';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  audience: string;
}

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending';
}

const HomeAdmin = ({ navigation }: any) => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  useEffect(() => {
    loadData();
    trackWelcomeCardImpression('admin');
  }, []);

  const loadData = async () => {
    try {
      const [events, payments] = await Promise.all([
        fetchEvents(),
        fetchPayments()
      ]);
      
      // Get next 3 events
      const sortedEvents = events
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, 3);
      setUpcomingEvents(sortedEvents);

      // Get recent 3 payments
      const sortedPayments = payments
        .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
        .slice(0, 3);
      setRecentPayments(sortedPayments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.name} — Admin</Text>
        <Text style={styles.subtitle}>Welcome to your dashboard</Text>
      </View>

      <WelcomeCard
        onPress={() => setIsCarouselVisible(true)}
        accentColor="#DC3545"
      />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Payments')}
        >
          <Text style={styles.actionButtonText}>💳 Payments</Text>
          <Text style={styles.actionButtonSubtext}>Manage payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Text style={styles.actionButtonText}>📅 Events</Text>
          <Text style={styles.actionButtonSubtext}>Manage events</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <View style={styles.paymentsList}>
            {recentPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <Text style={styles.paymentStudent}>{payment.studentName}</Text>
                <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                <Text style={[
                  styles.paymentStatus,
                  payment.status === 'paid' ? styles.paidStatus : styles.pendingStatus
                ]}>
                  {payment.status}
                </Text>
                <Text style={styles.paymentDate}>
                  Due: {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                </Text>
              </View>
            ))}
            {recentPayments.length === 0 && (
              <Text style={styles.noData}>No recent payments</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <View style={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {format(new Date(event.starts_at), 'MMM dd, yyyy • h:mm a')}
                </Text>
                <Text style={styles.eventAudience}>Audience: {event.audience}</Text>
              </View>
            ))}
            {upcomingEvents.length === 0 && (
              <Text style={styles.noData}>No upcoming events</Text>
            )}
          </View>
        )}
      </View>

      <WelcomeCarouselModal
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        userRole="admin"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#DC3545',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#F8D7DA',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  paymentsList: {
    gap: 12,
  },
  paymentItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
  },
  paymentStudent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  paidStatus: {
    color: '#28A745',
  },
  pendingStatus: {
    color: '#FFC107',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventAudience: {
    fontSize: 12,
    color: '#888',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default HomeAdmin;
