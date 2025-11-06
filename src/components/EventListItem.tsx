import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Event } from '../types/auth';

export interface EventListItemProps {
  event: Event;
  createdByName?: string;
  onPress: (event: Event) => void;
}

const EventListItem: React.FC<EventListItemProps> = ({
  event,
  createdByName,
  onPress,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

  const getTypeIcon = (type: 'event' | 'task' | 'holiday') => {
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

  const getAvatarInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event)}
      activeOpacity={0.7}
      accessibilityLabel={`${event.title}, ${event.type}, ${formatTime(event.date)}`}
      accessibilityRole="button"
    >
      <View style={styles.leftContent}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {getAvatarInitials(createdByName)}
          </Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.eventSubtitle} numberOfLines={1}>
            {createdByName || 'Unknown Teacher'}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <View style={styles.timeContainer}>
          <Text style={styles.eventIcon}>{getTypeIcon(event.type)}</Text>
          <Text style={styles.eventTime}>{formatTime(event.date)}</Text>
        </View>
        <View
          style={[
            styles.typePill,
            { backgroundColor: getTypeColor(event.type) },
          ]}
        >
          <Text style={styles.typeText}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F6FED',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
});

export default EventListItem;
