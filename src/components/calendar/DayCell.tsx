import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export interface DayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: Array<{
    type: 'event' | 'task' | 'holiday';
  }>;
  onPress: () => void;
  date: Date;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  onPress,
  date,
}) => {
  const getEventDotColor = (type: 'event' | 'task' | 'holiday') => {
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

  const renderEventDots = () => {
    if (events.length === 0) return null;
    
    const maxDots = 3;
    const visibleEvents = events.slice(0, maxDots);
    
    return (
      <View style={styles.dotsContainer}>
        {visibleEvents.map((event, index) => (
          <View
            key={index}
            style={[
              styles.eventDot,
              { backgroundColor: getEventDotColor(event.type) },
            ]}
          />
        ))}
        {events.length > maxDots && (
          <Text style={styles.moreIndicator}>+</Text>
        )}
      </View>
    );
  };

  const formatDateForAccessibility = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const accessibilityLabel = `${formatDateForAccessibility(date)}${events.length > 0 ? ` — ${events.length} event${events.length > 1 ? 's' : ''}` : ''}`;

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        isSelected && styles.selectedDay,
        isToday && !isSelected && styles.todayCell,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <View style={styles.dayContent}>
        <Text style={[
          styles.dayText,
          !isCurrentMonth && styles.inactiveDayText,
          isSelected && styles.selectedDayText,
          isToday && !isSelected && styles.todayText,
        ]}>
          {day}
        </Text>
        {renderEventDots()}
      </View>
      
      {events.length > 0 && isSelected && (
        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>{events.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayCell: {
    width: '14.28%',
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#2F6FED',
    borderRadius: 25,
  },
  todayCell: {
    backgroundColor: 'rgba(47, 111, 237, 0.1)',
    borderRadius: 25,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  inactiveDayText: {
    color: '#999999',
    fontWeight: 'normal',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#2F6FED',
    fontWeight: 'bold',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreIndicator: {
    fontSize: 8,
    color: '#666',
    marginLeft: 2,
  },
  eventCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  eventCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default DayCell;