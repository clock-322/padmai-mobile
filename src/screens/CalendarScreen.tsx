import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fetchEvents } from '../api/api';
import { format, isSameDay, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  audience: string;
}

interface GroupedEvent {
  date: string;
  events: Event[];
}

const CalendarScreen = () => {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const events = await fetchEvents();
      
      // Group events by date
      const grouped = events.reduce((groups: { [key: string]: Event[] }, event) => {
        const date = format(parseISO(event.starts_at), 'yyyy-MM-dd');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
        return groups;
      }, {});

      // Convert to array and sort by date
      const sortedGroups = Object.entries(grouped)
        .map(([date, events]) => ({
          date,
          events: events.sort((a, b) => 
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
          )
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setGroupedEvents(sortedGroups);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventTime}>
        {format(parseISO(item.starts_at), 'h:mm a')} - {format(parseISO(item.ends_at), 'h:mm a')}
      </Text>
      <Text style={styles.eventAudience}>Audience: {item.audience}</Text>
    </View>
  );

  const renderDateGroup = ({ item }: { item: GroupedEvent }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>
        {format(parseISO(item.date), 'EEEE, MMMM dd, yyyy')}
      </Text>
      {item.events.map((event) => (
        <View key={event.id} style={styles.eventItem}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>
            {format(parseISO(event.starts_at), 'h:mm a')} - {format(parseISO(event.ends_at), 'h:mm a')}
          </Text>
          <Text style={styles.eventAudience}>Audience: {event.audience}</Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedEvents}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  eventItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventAudience: {
    fontSize: 12,
    color: '#888',
  },
});

export default CalendarScreen;
