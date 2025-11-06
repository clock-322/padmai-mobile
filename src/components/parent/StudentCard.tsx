import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StudentApi } from '../../types/students';

interface StudentCardProps {
  student: StudentApi;
  onPress: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onPress }) => {
  const fullName = `${student.firstName} ${student.lastName}`;
  const classSection = `${student.class}${student.section ? `-${student.section}` : ''}`;

  // Determine attendance status badge
  const getAttendanceBadge = () => {
    const status = student.attendanceStatus;
    
    if (status === 'present') {
      return {
        text: 'Present',
        backgroundColor: '#28A745', // Green
      };
    } else if (status === 'absent') {
      return {
        text: 'Absent',
        backgroundColor: '#DC3545', // Red
      };
    } else {
      // Default to "Active" for null/undefined (backward compatibility)
      return {
        text: 'Active',
        backgroundColor: '#28A745', // Green (same as original Active)
      };
    }
  };

  const badge = getAttendanceBadge();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👦</Text>
        </View>

        {/* Student Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.classSection}>Class {classSection}</Text>
          <Text style={styles.rollNo}>Roll No: {student.classRollNo}</Text>
        </View>

        {/* Attendance Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={styles.statusText}>{badge.text}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  classSection: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  rollNo: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default StudentCard;

