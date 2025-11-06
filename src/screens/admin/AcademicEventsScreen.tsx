import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';

const AcademicEventsScreen = () => {
  const { user } = useAuth();
  const { events, students } = useData();
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    type: 'event',
    audience: 'whole_school',
    description: '',
    notifyParents: false,
  });

  useEffect(() => {
    loadEvents();
  }, [events, searchQuery, typeFilter, audienceFilter]);

  const loadEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.notes.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    // Apply audience filter
    if (audienceFilter !== 'all') {
      if (audienceFilter === 'whole_school') {
        filtered = filtered.filter(e => !e.studentId && !e.classId);
      } else if (audienceFilter === 'class') {
        filtered = filtered.filter(e => e.classId);
      } else if (audienceFilter === 'student') {
        filtered = filtered.filter(e => e.studentId);
      }
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      date: '',
      time: '',
      type: 'event',
      audience: 'whole_school',
      description: '',
      notifyParents: false,
    });
    setModalVisible(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      date: event.date.split('T')[0],
      time: new Date(event.date).toTimeString().slice(0, 5),
      type: event.type,
      audience: event.studentId ? 'student' : event.classId ? 'class' : 'whole_school',
      description: event.notes,
      notifyParents: false,
    });
    setModalVisible(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const eventDate = new Date(`${eventForm.date}T${eventForm.time}:00.000Z`);
    
    const eventData = {
      id: editingEvent ? editingEvent.id : `event_${Date.now()}`,
      title: eventForm.title,
      date: eventDate.toISOString(),
      type: eventForm.type,
      notes: eventForm.description,
      createdBy: user?.id || 'admin',
      ...(eventForm.audience === 'class' && { classId: 'class_1' }),
      ...(eventForm.audience === 'student' && { studentId: 's_1' }),
    };

    // TODO: Update events in data store
    Alert.alert(
      'Event Saved',
      `${editingEvent ? 'Event updated' : 'Event created'} successfully!${
        eventForm.notifyParents ? '\nParents will be notified.' : ''
      }`
    );

    setModalVisible(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (event: any) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Delete event from data store
            Alert.alert('Event Deleted', 'Event has been deleted successfully!');
          },
        },
      ]
    );
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTypeColor = (type: string) => {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'task':
        return '📝';
      case 'holiday':
        return '🎉';
      default:
        return '📋';
    }
  };

  const getAudienceText = (event: any) => {
    if (event.studentId) return 'Student';
    if (event.classId) return 'Class';
    return 'Whole School';
  };

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

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search events"
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Text style={styles.filterLabel}>Type:</Text>
            {[
              { key: 'all', label: 'All' },
              { key: 'event', label: 'Events' },
              { key: 'task', label: 'Tasks' },
              { key: 'holiday', label: 'Holidays' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  typeFilter === filter.key && styles.activeFilterButton
                ]}
                onPress={() => setTypeFilter(filter.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  typeFilter === filter.key && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Text style={styles.filterLabel}>Audience:</Text>
            {[
              { key: 'all', label: 'All' },
              { key: 'whole_school', label: 'Whole School' },
              { key: 'class', label: 'Class' },
              { key: 'student', label: 'Student' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  audienceFilter === filter.key && styles.activeFilterButton
                ]}
                onPress={() => setAudienceFilter(filter.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  audienceFilter === filter.key && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Create Event Button */}
        <View style={styles.createSection}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateEvent}
            accessibilityLabel="Create new event"
          >
            <Text style={styles.createButtonIcon}>+</Text>
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            Academic Events ({filteredEvents.length})
          </Text>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                    <Text style={styles.eventAudience}>
                      {getAudienceText(event)} • {event.notes}
                    </Text>
                  </View>
                  <View style={styles.eventActions}>
                    <View style={[
                      styles.typeChip,
                      { backgroundColor: getTypeColor(event.type) }
                    ]}>
                      <Text style={styles.typeIcon}>{getTypeIcon(event.type)}</Text>
                      <Text style={styles.typeText}>{event.type}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditEvent(event)}
                    accessibilityLabel={`Edit ${event.title}`}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteEvent(event)}
                    accessibilityLabel={`Delete ${event.title}`}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateTitle}>No Events Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || typeFilter !== 'all' || audienceFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No academic events scheduled'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Event Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </Text>
            
            <ScrollView style={styles.formContent}>
              <TextInput
                style={styles.input}
                placeholder="Event Title *"
                value={eventForm.title}
                onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
                accessibilityLabel="Event title"
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Date *"
                  value={eventForm.date}
                  onChangeText={(text) => setEventForm({ ...eventForm, date: text })}
                  accessibilityLabel="Event date"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Time *"
                  value={eventForm.time}
                  onChangeText={(text) => setEventForm({ ...eventForm, time: text })}
                  accessibilityLabel="Event time"
                />
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    const types = ['event', 'task', 'holiday'];
                    const currentIndex = types.indexOf(eventForm.type);
                    const nextIndex = (currentIndex + 1) % types.length;
                    setEventForm({ ...eventForm, type: types[nextIndex] });
                  }}
                  accessibilityLabel={`Event type: ${eventForm.type}`}
                >
                  <Text style={styles.pickerText}>Type: {eventForm.type}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    const audiences = ['whole_school', 'class', 'student'];
                    const currentIndex = audiences.indexOf(eventForm.audience);
                    const nextIndex = (currentIndex + 1) % audiences.length;
                    setEventForm({ ...eventForm, audience: audiences[nextIndex] });
                  }}
                  accessibilityLabel={`Audience: ${eventForm.audience}`}
                >
                  <Text style={styles.pickerText}>Audience: {eventForm.audience.replace('_', ' ')}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={eventForm.description}
                onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
                multiline
                numberOfLines={3}
                accessibilityLabel="Event description"
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setEventForm({ ...eventForm, notifyParents: !eventForm.notifyParents })}
                accessibilityLabel={`Notify parents: ${eventForm.notifyParents ? 'Yes' : 'No'}`}
              >
                <Text style={styles.checkboxText}>
                  {eventForm.notifyParents ? '☑️' : '☐'} Notify Parents
                </Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveButtonText}>
                  {editingEvent ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    color: '#212529',
  },
  filterScroll: {
    marginBottom: 18,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginRight: 10,
    alignSelf: 'center',
    letterSpacing: 0.2,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
    shadowColor: '#2F6FED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  createSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#2F6FED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 18,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
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
    marginBottom: 4,
  },
  eventAudience: {
    fontSize: 12,
    color: '#999',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#2F6FED',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContent: {
    maxHeight: 400,
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flex: 1,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#2F6FED',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AcademicEventsScreen;
