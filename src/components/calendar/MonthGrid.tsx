import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DayCell, { DayCellProps } from './DayCell';

export interface MonthGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Array<{
    id: string;
    date: string;
    type: 'event' | 'task' | 'holiday';
  }>;
  onDateSelect: (date: Date) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
}) => {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getLastDayOfPreviousMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return formatDateKey(eventDate) === dateKey;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDayOfPrevMonth = getLastDayOfPreviousMonth(currentDate);
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate ? formatDateKey(date) === formatDateKey(selectedDate) : false,
      });
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push({
        day,
        date,
        isCurrentMonth: true,
        isToday: formatDateKey(date) === formatDateKey(today),
        isSelected: selectedDate ? formatDateKey(date) === formatDateKey(selectedDate) : false,
      });
    }
    
    // Next month's leading days to fill the grid
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate ? formatDateKey(date) === formatDateKey(selectedDate) : false,
      });
    }
    
    return days;
  };

  const days = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Week day headers */}
      <View style={styles.weekHeader}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayHeader}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((dayData, index) => (
          <DayCell
            key={`${currentDate.getMonth()}-${dayData.day}-${index}`}
            day={dayData.day}
            isCurrentMonth={dayData.isCurrentMonth}
            isToday={dayData.isToday}
            isSelected={dayData.isSelected}
            events={getEventsForDate(dayData.date)}
            onPress={() => onDateSelect(dayData.date)}
            date={dayData.date}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 350, // Ensure enough space for full calendar
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 300, // 6 rows × 50px height
  },
});

export default MonthGrid;
