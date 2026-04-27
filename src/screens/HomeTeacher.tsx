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
import { fetchEvents } from '../api/api';
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

const HomeTeacher = ({ navigation }: any) => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  useEffect(() => {
    loadUpcomingEvents();
    trackWelcomeCardImpression('teacher');
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const events = await fetchEvents();
      // Get next 3 events
      const sortedEvents = events
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, 3);
      setUpcomingEvents(sortedEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.name} — Teacher</Text>
        <Text style={styles.subtitle}>Welcome to your dashboard</Text>
      </View>

      <WelcomeCard
        onPress={() => setIsCarouselVisible(true)}
        accentColor="#28A745"
      />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Text style={styles.actionButtonText}>📅 Events</Text>
          <Text style={styles.actionButtonSubtext}>View school events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Attendance tracking will be available soon')}
        >
          <Text style={styles.actionButtonText}>📊 Attendance</Text>
          <Text style={styles.actionButtonSubtext}>Track student attendance</Text>
        </TouchableOpacity>
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
              <Text style={styles.noEvents}>No upcoming events</Text>
            )}
          </View>
        )}
      </View>

      <WelcomeCarouselModal
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        userRole="teacher"
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
    backgroundColor: '#28A745',
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
    color: '#E8F5E8',
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
  eventsList: {
    gap: 12,
  },
  eventItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28A745',
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
  noEvents: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default HomeTeacher;  
