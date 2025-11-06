import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import ProfileIcon from '../../components/ProfileIcon';
import MonthGrid from '../../components/calendar/MonthGrid';
import EventListItem from '../../components/EventListItem';
import { Event } from '../../types/auth';

interface EventDetailModalProps {
  visible: boolean;
  event: Event | null;
  createdByName?: string;
  onClose: () => void;
  onAction: (action: string, event: Event) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
  event,
  createdByName,
  onClose,
  onAction,
}) => {
  const { user } = useAuth();

  if (!event) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRoleBasedActions = () => {
    switch (user?.role) {
      case 'parent':
        return [
          { key: 'message', label: 'Message Teacher', color: '#2F6FED' },
          { key: 'profile', label: 'View in Profile', color: '#28A745' },
        ];
      case 'teacher':
        return [
          { key: 'edit', label: 'Edit Task', color: '#2F6FED' },
          { key: 'followup', label: 'Create Follow-up', color: '#28A745' },
        ];
      case 'schoolOwner':
        return [
          { key: 'complete', label: 'Mark Complete', color: '#28A745' },
          { key: 'notify', label: 'Notify Parent', color: '#FFC107' },
        ];
      default:
        return [];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{event.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.eventDetailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(event.type) }]}>
                <Text style={styles.typeBadgeText}>
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.eventDetailRow}>
              <Text style={styles.detailLabel}>Date & Time:</Text>
              <Text style={styles.detailValue}>{formatDateTime(event.date)}</Text>
            </View>
            
            <View style={styles.eventDetailRow}>
              <Text style={styles.detailLabel}>Created by:</Text>
              <Text style={styles.detailValue}>{createdByName || 'Unknown Teacher'}</Text>
            </View>
            
            {event.notes && (
              <View style={styles.eventDetailRow}>
                <Text style={styles.detailLabel}>Notes:</Text>
                <Text style={styles.detailValue}>{event.notes}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.modalActions}>
            {getRoleBasedActions().map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => onAction(action.key, event)}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getTypeColor = (type: 'event' | 'task' | 'holiday') => {
  switch (type) {
    case 'event':
      return '#2F6FED';
    case 'task':
      return '#28A745';
    case 'holiday':
      return '#FFC107';
    default:
      return '#6C757D';
  }
};

const CalendarScreen = () => {
  const { user } = useAuth();
  const { events, users } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [events, user]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [modalVisible]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const allEvents = events || [];
      
      // Apply role-based filtering
      const filtered = allEvents.filter(event => {
        switch (user?.role) {
          case 'parent':
            return event.studentId === user.childId;
          case 'teacher':
            // TODO: Add teacher.classes property to user data
            return true; // For now, show all events
          case 'schoolOwner':
            return true; // Show all events
          default:
            return false;
        }
      });
      
      setFilteredEvents(filtered);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const userData = users.find(u => u.id === userId);
    return userData ? userData.fullName : 'Unknown Teacher';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleModalAction = (action: string, event: Event) => {
    // TODO: Implement actual actions
    let message = '';
    switch (action) {
      case 'message':
        message = 'Message teacher functionality will be implemented';
        break;
      case 'profile':
        message = 'View in profile functionality will be implemented';
        break;
      case 'edit':
        message = 'Edit task functionality will be implemented';
        break;
      case 'followup':
        message = 'Create follow-up functionality will be implemented';
        break;
      case 'complete':
        message = 'Mark complete functionality will be implemented';
        break;
      case 'notify':
        message = 'Notify parent functionality will be implemented';
        break;
      default:
        message = 'Action will be implemented';
    }
    
    Alert.alert('Action', message);
    setModalVisible(false);
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateKey;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedDateEvents = getEventsForSelectedDate();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📅 Calendar</Text>
            <Text style={styles.headerSubtitle}>
              {user?.role === 'parent' ? 'Your child\'s events' : 
               user?.role === 'teacher' ? 'Class events' : 
               'All school events'}
            </Text>
          </View>
          <ProfileIcon />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.monthInfo}>
              <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
              <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Grid */}
        <MonthGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={filteredEvents}
          onDateSelect={handleDateSelect}
        />

        {/* Selected Date Events */}
        {selectedDate && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsHeader}>
              <Text style={styles.eventsTitle}>
                {formatSelectedDate(selectedDate)}
              </Text>
              <Text style={styles.eventsCount}>
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  createdByName={getUserName(event.createdBy)}
                  onPress={handleEventPress}
                />
              ))
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No events for this date</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Event Detail Modal */}
      <EventDetailModal
        visible={modalVisible}
        event={selectedEvent}
        createdByName={selectedEvent ? getUserName(selectedEvent.createdBy) : undefined}
        onClose={() => setModalVisible(false)}
        onAction={handleModalAction}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
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
  },
  calendarHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: '#2F6FED',
    fontWeight: 'bold',
  },
  monthInfo: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayButton: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#2F6FED',
    borderRadius: 10,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  eventsSection: {
    marginTop: 8,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  eventsCount: {
    fontSize: 14,
    color: '#666',
  },
  noEventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
    marginBottom: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CalendarScreen;
