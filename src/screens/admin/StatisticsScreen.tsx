import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';
import StatCard from '../../components/admin/StatCard';

const StatisticsScreen = () => {
  const { user } = useAuth();
  const { students, attendance, events } = useData();
  const [activeTab, setActiveTab] = useState<'attendance' | 'progress'>('attendance');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);

  useEffect(() => {
    loadAttendanceData();
    loadProgressData();
  }, [selectedClass, dateRange, students, attendance]);

  const loadAttendanceData = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'term':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }

    let filteredStudents = students;
    if (selectedClass !== 'all') {
      filteredStudents = students.filter(s => s.classId === selectedClass);
    }

    const filteredAttendance = attendance.filter(a => {
      const attendanceDate = new Date(a.date);
      return attendanceDate >= startDate && attendanceDate <= endDate;
    });

    const studentStats = filteredStudents.map(student => {
      const studentAttendance = filteredAttendance.filter(a => a.studentId === student.id);
      const present = studentAttendance.filter(a => a.status === 'present').length;
      const total = studentAttendance.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        ...student,
        present,
        total,
        percentage,
        className: student.classId.replace('class_', 'Class '),
      };
    });

    setAttendanceData(studentStats);
  };

  const loadProgressData = () => {
    // Generate mock progress data
    const progress = students.map(student => ({
      ...student,
      className: student.classId.replace('class_', 'Class '),
      mathGrade: Math.floor(Math.random() * 40) + 60, // 60-100
      englishGrade: Math.floor(Math.random() * 40) + 60,
      scienceGrade: Math.floor(Math.random() * 40) + 60,
      averageGrade: 0,
    }));

    // Calculate average grades
    progress.forEach(student => {
      student.averageGrade = Math.round((student.mathGrade + student.englishGrade + student.scienceGrade) / 3);
    });

    setProgressData(progress);
  };

  const getClassOptions = () => {
    const classes = [...new Set(students.map(s => s.classId))];
    return [
      { id: 'all', name: 'All Classes' },
      ...classes.map(classId => ({
        id: classId,
        name: classId.replace('class_', 'Class '),
      })),
    ];
  };

  const getDateRangeOptions = () => [
    { id: 'week', label: 'Last Week' },
    { id: 'month', label: 'Last Month' },
    { id: 'term', label: 'This Term' },
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#28A745';
    if (percentage >= 80) return '#FFC107';
    if (percentage >= 70) return '#FD7E14';
    return '#DC3545';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return '#28A745';
    if (grade >= 80) return '#FFC107';
    if (grade >= 70) return '#FD7E14';
    return '#DC3545';
  };

  const handleStudentPress = (student: any) => {
    Alert.alert(
      'Student Details',
      `${student.name}\nClass: ${student.className}\nAttendance: ${student.percentage}%\nMath: ${student.mathGrade || 'N/A'}\nEnglish: ${student.englishGrade || 'N/A'}\nScience: ${student.scienceGrade || 'N/A'}`
    );
  };

  const renderAttendanceTab = () => (
    <View>
      {/* Class and Date Range Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Class:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {getClassOptions().map((classOption) => (
            <TouchableOpacity
              key={classOption.id}
              style={[
                styles.filterButton,
                selectedClass === classOption.id && styles.activeFilterButton
              ]}
              onPress={() => setSelectedClass(classOption.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedClass === classOption.id && styles.activeFilterButtonText
              ]}>
                {classOption.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Period:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {getDateRangeOptions().map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterButton,
                dateRange === option.id && styles.activeFilterButton
              ]}
              onPress={() => setDateRange(option.id)}
            >
              <Text style={[
                styles.filterButtonText,
                dateRange === option.id && styles.activeFilterButtonText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Attendance Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.summaryCards}>
          <StatCard
            title="Total Students"
            value={attendanceData.length}
            icon="👥"
            color="#2F6FED"
          />
          <StatCard
            title="Avg Attendance"
            value={`${attendanceData.length > 0 ? Math.round(attendanceData.reduce((sum, s) => sum + s.percentage, 0) / attendanceData.length) : 0}%`}
            icon="📊"
            color="#28A745"
          />
          <StatCard
            title="Excellent (90%+)"
            value={attendanceData.filter(s => s.percentage >= 90).length}
            icon="⭐"
            color="#28A745"
          />
          <StatCard
            title="Needs Attention (<70%)"
            value={attendanceData.filter(s => s.percentage < 70).length}
            icon="⚠️"
            color="#DC3545"
          />
        </View>
      </View>

      {/* Attendance Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Attendance by Class</Text>
        {[...new Set(attendanceData.map(s => s.className))].map(className => {
          const classStudents = attendanceData.filter(s => s.className === className);
          const avgPercentage = classStudents.length > 0 
            ? Math.round(classStudents.reduce((sum, s) => sum + s.percentage, 0) / classStudents.length)
            : 0;
          
          return (
            <View key={className} style={styles.chartItem}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartLabel}>{className}</Text>
                <Text style={styles.chartValue}>{avgPercentage}%</Text>
              </View>
              <View style={styles.chartBar}>
                <View 
                  style={[
                    styles.chartFill, 
                    { 
                      width: `${avgPercentage}%`,
                      backgroundColor: getAttendanceColor(avgPercentage)
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Student List */}
      <View style={styles.studentListSection}>
        <Text style={styles.sectionTitle}>Student Attendance</Text>
        {attendanceData.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={styles.studentCard}
            onPress={() => handleStudentPress(student)}
            accessibilityLabel={`${student.name}, ${student.percentage}% attendance`}
          >
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {student.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentClass}>{student.className}</Text>
                <Text style={styles.attendanceDetails}>
                  {student.present} of {student.total} days
                </Text>
              </View>
            </View>
            <View style={styles.attendanceInfo}>
              <Text style={[
                styles.attendancePercentage,
                { color: getAttendanceColor(student.percentage) }
              ]}>
                {student.percentage}%
              </Text>
              <View style={styles.attendanceBar}>
                <View 
                  style={[
                    styles.attendanceFill, 
                    { 
                      width: `${student.percentage}%`,
                      backgroundColor: getAttendanceColor(student.percentage)
                    }
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressTab = () => (
    <View>
      {/* Class Filter */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Class:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {getClassOptions().map((classOption) => (
            <TouchableOpacity
              key={classOption.id}
              style={[
                styles.filterButton,
                selectedClass === classOption.id && styles.activeFilterButton
              ]}
              onPress={() => setSelectedClass(classOption.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedClass === classOption.id && styles.activeFilterButtonText
              ]}>
                {classOption.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Progress Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Academic Progress</Text>
        <View style={styles.summaryCards}>
          <StatCard
            title="Total Students"
            value={progressData.length}
            icon="👥"
            color="#2F6FED"
          />
          <StatCard
            title="Avg Grade"
            value={`${progressData.length > 0 ? Math.round(progressData.reduce((sum, s) => sum + s.averageGrade, 0) / progressData.length) : 0}%`}
            icon="📈"
            color="#28A745"
          />
          <StatCard
            title="High Achievers (90%+)"
            value={progressData.filter(s => s.averageGrade >= 90).length}
            icon="⭐"
            color="#28A745"
          />
          <StatCard
            title="Needs Support (<70%)"
            value={progressData.filter(s => s.averageGrade < 70).length}
            icon="📚"
            color="#DC3545"
          />
        </View>
      </View>

      {/* Student Progress Cards */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Student Progress</Text>
        {progressData.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={styles.progressCard}
            onPress={() => handleStudentPress(student)}
            accessibilityLabel={`${student.name}, average grade ${student.averageGrade}%`}
          >
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {student.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentClass}>{student.className}</Text>
              </View>
            </View>
            <View style={styles.gradesContainer}>
              <View style={styles.gradeItem}>
                <Text style={styles.gradeLabel}>Math</Text>
                <Text style={[styles.gradeValue, { color: getGradeColor(student.mathGrade) }]}>
                  {student.mathGrade}%
                </Text>
              </View>
              <View style={styles.gradeItem}>
                <Text style={styles.gradeLabel}>English</Text>
                <Text style={[styles.gradeValue, { color: getGradeColor(student.englishGrade) }]}>
                  {student.englishGrade}%
                </Text>
              </View>
              <View style={styles.gradeItem}>
                <Text style={styles.gradeLabel}>Science</Text>
                <Text style={[styles.gradeValue, { color: getGradeColor(student.scienceGrade) }]}>
                  {student.scienceGrade}%
                </Text>
              </View>
              <View style={[styles.gradeItem, styles.averageGrade]}>
                <Text style={styles.gradeLabel}>Average</Text>
                <Text style={[styles.gradeValue, { color: getGradeColor(student.averageGrade) }]}>
                  {student.averageGrade}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'attendance' && styles.activeTabButton]}
            onPress={() => setActiveTab('attendance')}
            accessibilityLabel="View attendance statistics"
          >
            <Text style={[styles.tabButtonText, activeTab === 'attendance' && styles.activeTabButtonText]}>
              Attendance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'progress' && styles.activeTabButton]}
            onPress={() => setActiveTab('progress')}
            accessibilityLabel="View academic progress"
          >
            <Text style={[styles.tabButtonText, activeTab === 'progress' && styles.activeTabButtonText]}>
              Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'attendance' ? renderAttendanceTab() : renderProgressTab()}
      </ScrollView>
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
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#2F6FED',
    shadowColor: '#2F6FED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 0.2,
  },
  activeTabButtonText: {
    color: '#fff',
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  filterScroll: {
    marginBottom: 18,
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
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 18,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartItem: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  chartBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 4,
  },
  studentListSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attendanceDetails: {
    fontSize: 12,
    color: '#999',
  },
  attendanceInfo: {
    alignItems: 'flex-end',
  },
  attendancePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendanceBar: {
    width: 80,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressCard: {
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
  gradesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  gradeItem: {
    alignItems: 'center',
    flex: 1,
  },
  averageGrade: {
    borderLeftWidth: 1,
    borderLeftColor: '#e9ecef',
    paddingLeft: 8,
  },
  gradeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StatisticsScreen;
