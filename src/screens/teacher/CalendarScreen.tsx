import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useGetTeacherByIdQuery } from '../../store/services/teachersApi';
import TeacherHeaderRight from '../../components/teacher/TeacherHeaderRight';
import ProfileModal from './ProfileModal';
import MonthGrid from '../../components/calendar/MonthGrid';
import EventListItem from '../../components/EventListItem';

const CalendarScreen = () => {
  const { user } = useAuth();
  const { events, users, students, addEvent, removeEvent } = useData();
  const { data: teacherProfileData } = useGetTeacherByIdQuery(user?.id ?? '', {
    skip: !user?.id,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', time: '', notes: '', type: 'event' });

  useEffect(() => {
    loadEvents();
  }, [events, user?.role]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // TODO: Filter events by teacher's classes
      const allEvents = events || [];
      setFilteredEvents(allEvents);
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

  const handleEventPress = (event: any) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const EVENT_TYPES = [
    { value: 'event', label: 'Event', color: '#2F6FED' },
    { value: 'holiday', label: 'Holiday', color: '#FF9800' },
    { value: 'test', label: 'Test', color: '#DC3545' },
    { value: 'meeting', label: 'Meeting', color: '#28A745' },
  ];

  const handleCreateEvent = () => {
    setEventForm({ title: '', time: '09:00', notes: '', type: 'event' });
    setCreateModalVisible(true);
  };

  const confirmCreateEvent = () => {
    if (!eventForm.title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    const time = eventForm.time || '09:00';
    const newEvent: any = {
      id: `event_${Date.now()}`,
      title: eventForm.title,
      date: `${dateStr}T${time}:00.000Z`,
      type: eventForm.type,
      notes: eventForm.notes,
      createdBy: (user as any)?.id || 'teacher',
    };
    addEvent(newEvent);
    setCreateModalVisible(false);
    Alert.alert('Event Created', `"${newEvent.title}" has been added to the calendar.`);
  };

  const handleDeleteEvent = (event: any) => {
    Alert.alert(
      'Delete Event',
      `Delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeEvent(event.id);
            setModalVisible(false);
            Alert.alert('Deleted', 'Event has been removed.');
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appBranding}>
              <Text style={styles.appIcon}>📚</Text>
              <Text style={styles.appName}>Kilbil School</Text>
            </View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome, {(user as any)?.name?.split(' ')[0] || 'Teacher'}!</Text>
              <TeacherHeaderRight onPress={() => setProfileModalVisible(true)} />
            </View>
          </View>
        </View>
        
        <View style={styles.teacherInfoCard}>
          <View style={styles.teacherAvatar}>
            <Text style={styles.teacherAvatarText}>👨‍🏫</Text>
          </View>
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherName}>{(user as any)?.name || 'Teacher Name'}</Text>
            <Text style={styles.teacherRole}>
              {teacherProfileData?.data?.teacher?.subject
                ? `${teacherProfileData.data.teacher.subject} Teacher`
                : (user as any)?.subject
                ? `${(user as any).subject} Teacher`
                : 'Teacher'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Navigation */}
        <View style={styles.calendarHeader}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.monthInfo}>
              <Text style={styles.monthText}>
                {formatMonthYear(currentDate)}
              </Text>
              <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
              <Text style={styles.navButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <MonthGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={filteredEvents}
          onDateSelect={handleDateSelect}
        />

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
              <Text style={styles.createButtonText}>+ Create Event</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.eventsCount}>{getEventsForSelectedDate().length} events</Text>
          
          {getEventsForSelectedDate().length > 0 ? (
            getEventsForSelectedDate().map(event => (
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
              <TouchableOpacity style={styles.createEventButton} onPress={handleCreateEvent}>
                <Text style={styles.createEventButtonText}>Create your first event</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEvent?.title || 'Event Details'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedEvent && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalDetail}>
                  📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
                <Text style={styles.modalDetail}>
                  📝 Notes: {selectedEvent.notes || 'N/A'}
                </Text>
                {selectedEvent.studentId && (
                  <Text style={styles.modalDetail}>
                    🧑‍🎓 Student: {students.find(s => s.id === selectedEvent.studentId)?.name || 'N/A'}
                  </Text>
                )}
                {selectedEvent.classId && (
                  <Text style={styles.modalDetail}>
                    🏫 Class: {selectedEvent.classId.replace('class_', 'Class ')}
                  </Text>
                )}
                <Text style={styles.modalDetail}>
                  👨‍🏫 Created By: {getUserName(selectedEvent.createdBy)}
                </Text>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => selectedEvent && handleDeleteEvent(selectedEvent)}>
                    <Text style={styles.actionButtonText}>Delete Event</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Create Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.createModalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Event</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.createInputLabel}>Type</Text>
            <View style={styles.typeButtons}>
              {EVENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeButton, eventForm.type === t.value && { backgroundColor: t.color, borderColor: t.color }]}
                  onPress={() => setEventForm(prev => ({ ...prev, type: t.value }))}
                >
                  <Text style={[styles.typeButtonText, eventForm.type === t.value && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.createInputLabel}>Title *</Text>
            <TextInput
              style={styles.createInput}
              placeholder="Event title"
              value={eventForm.title}
              onChangeText={v => setEventForm(prev => ({ ...prev, title: v }))}
            />
            <Text style={styles.createInputLabel}>Time (HH:MM)</Text>
            <TextInput
              style={styles.createInput}
              placeholder="09:00"
              value={eventForm.time}
              onChangeText={v => setEventForm(prev => ({ ...prev, time: v }))}
            />
            <Text style={styles.createInputLabel}>Notes</Text>
            <TextInput
              style={[styles.createInput, styles.createInputMultiline]}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
              value={eventForm.notes}
              onChangeText={v => setEventForm(prev => ({ ...prev, notes: v }))}
            />
            <View style={styles.createModalActions}>
              <TouchableOpacity style={[styles.createModalButton, styles.createCancelButton]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.createCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createModalButton, styles.createConfirmButton]} onPress={confirmCreateEvent}>
                <Text style={styles.createConfirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
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
    marginTop: 10,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  appBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
  },
  teacherInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherAvatarText: {
    fontSize: 24,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  teacherRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  calendarHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonText: {
    fontSize: 18,
    color: '#2F6FED',
    fontWeight: 'bold',
  },
  monthInfo: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2F6FED',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todayButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  eventsSection: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createEventButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  modalDetail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  createInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
    marginTop: 8,
  },
  createInput: {
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212529',
    marginBottom: 4,
  },
  createInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  createModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  createModalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  createCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
  },
  createConfirmButton: {
    backgroundColor: '#2F6FED',
  },
  createCancelButtonText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '700',
  },
  createConfirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CalendarScreen;
