import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';

const AttendanceReportScreen = () => {
  const { user } = useAuth();
  const { students, attendance } = useData();
  const [selectedClass, setSelectedClass] = useState('class_1');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedClass, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      const classStudents = students.filter(s => s.classId === selectedClass);
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'semester':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      const filteredAttendance = attendance.filter(a => {
        const attendanceDate = new Date(a.date);
        return classStudents.some(s => s.id === a.studentId) &&
               attendanceDate >= startDate &&
               attendanceDate <= endDate;
      });

      // Calculate statistics
      const studentStats = classStudents.map(student => {
        const studentAttendance = filteredAttendance.filter(a => a.studentId === student.id);
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const absent = studentAttendance.filter(a => a.status === 'absent').length;
        const late = studentAttendance.filter(a => a.status === 'late').length;
        const total = studentAttendance.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          ...student,
          present,
          absent,
          late,
          total,
          percentage,
        };
      });

      const overallStats = {
        totalStudents: classStudents.length,
        averageAttendance: studentStats.length > 0 
          ? Math.round(studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length)
          : 0,
        totalPresent: studentStats.reduce((sum, s) => sum + s.present, 0),
        totalAbsent: studentStats.reduce((sum, s) => sum + s.absent, 0),
        totalLate: studentStats.reduce((sum, s) => sum + s.late, 0),
      };

      setReportData({
        studentStats,
        overallStats,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassOptions = () => {
    return [
      { id: 'class_1', name: 'Class 1A' },
      { id: 'class_2', name: 'Class 2B' },
      { id: 'class_3', name: 'Class 3C' },
    ];
  };

  const getDateRangeOptions = () => [
    { id: 'week', label: 'Last Week' },
    { id: 'month', label: 'Last Month' },
    { id: 'semester', label: 'Last 3 Months' },
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#28A745';
    if (percentage >= 80) return '#FFC107';
    if (percentage >= 70) return '#FD7E14';
    return '#DC3545';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Class:</Text>
            <View style={styles.filterButtons}>
              {getClassOptions().map((classOption) => (
                <TouchableOpacity
                  key={classOption.id}
                  style={[
                    styles.filterButton,
                    selectedClass === classOption.id && styles.selectedFilterButton
                  ]}
                  onPress={() => setSelectedClass(classOption.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedClass === classOption.id && styles.selectedFilterButtonText
                  ]}>
                    {classOption.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Period:</Text>
            <View style={styles.filterButtons}>
              {getDateRangeOptions().map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    dateRange === option.id && styles.selectedFilterButton
                  ]}
                  onPress={() => setDateRange(option.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    dateRange === option.id && styles.selectedFilterButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Overall Stats */}
        {reportData && (
          <View style={styles.overallStats}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{reportData.overallStats.totalStudents}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{reportData.overallStats.averageAttendance}%</Text>
                <Text style={styles.statLabel}>Avg Attendance</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{reportData.overallStats.totalPresent}</Text>
                <Text style={styles.statLabel}>Total Present</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{reportData.overallStats.totalAbsent}</Text>
                <Text style={styles.statLabel}>Total Absent</Text>
              </View>
            </View>
          </View>
        )}

        {/* Student Details */}
        {reportData && (
          <View style={styles.studentDetails}>
            <Text style={styles.sectionTitle}>Student Details</Text>
            <Text style={styles.dateRange}>
              {new Date(reportData.dateRange.start).toLocaleDateString()} - {new Date(reportData.dateRange.end).toLocaleDateString()}
            </Text>
            {reportData.studentStats.map((student: any) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {student.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.studentInfoInner}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentGrade}>Grade {student.grade}</Text>
                  </View>
                </View>
                <View style={styles.attendanceInfo}>
                  <View style={styles.percentageContainer}>
                    <Text style={[
                      styles.percentageText,
                      { color: getAttendanceColor(student.percentage) }
                    ]}>
                      {student.percentage}%
                    </Text>
                    <View style={styles.percentageBar}>
                      <View style={[
                        styles.percentageFill,
                        { 
                          width: `${student.percentage}%`,
                          backgroundColor: getAttendanceColor(student.percentage)
                        }
                      ]} />
                    </View>
                  </View>
                  <View style={styles.attendanceBreakdown}>
                    <Text style={styles.breakdownText}>
                      P: {student.present} | A: {student.absent} | L: {student.late}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Export Button */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  filters: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFilterButton: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
  overallStats: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  studentDetails: {
    marginBottom: 20,
  },
  dateRange: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfoInner: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
  },
  attendanceInfo: {
    alignItems: 'flex-end',
  },
  percentageContainer: {
    width: '100%',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  percentageBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: 4,
  },
  attendanceBreakdown: {
    marginTop: 4,
  },
  breakdownText: {
    fontSize: 12,
    color: '#666',
  },
  exportSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  exportButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceReportScreen;
