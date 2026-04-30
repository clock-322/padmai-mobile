import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useGetAllStudentsQuery, useGetTeachersQuery } from '../../store/services/teachersApi';
import { useGetClassAttendanceMutation } from '../../store/services/attendanceApi';
import { useGetAllProgressQuery } from '../../store/services/progressApi';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';
import StatCard from '../../components/admin/StatCard';

interface StudentStat {
  id: string;
  name: string;
  className: string;
  classId: string;
  present: number;
  total: number;
  percentage: number;
  attendanceStatus?: string | null;
  mathGrade?: number;
  englishGrade?: number;
  scienceGrade?: number;
  averageGrade?: number;
  allSubjects?: { name: string; pct: number }[];
}

const StatisticsScreen = () => {
  const { user } = useAuth();
  const { students: localStudents, attendance: localAttendance } = useData();

  // API data
  const { data: apiStudentsData, refetch: refetchStudents } = useGetAllStudentsQuery();
  const { data: apiTeachersData, refetch: refetchTeachers } = useGetTeachersQuery();
  const { data: allProgressData, refetch: refetchProgress } = useGetAllProgressQuery();
  const [getClassAttendance] = useGetClassAttendanceMutation();

  const [activeTab, setActiveTab] = useState<'attendance' | 'progress'>('attendance');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [attendanceData, setAttendanceData] = useState<StudentStat[]>([]);
  const [progressData, setProgressData] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Refetch API data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      refetchStudents();
      refetchTeachers();
      refetchProgress();
      return () => { mountedRef.current = false; };
    }, [refetchStudents, refetchTeachers, refetchProgress])
  );

  // Merge API students with local students; API takes priority
  const allStudents = React.useMemo(() => {
    const apiStudents = apiStudentsData?.success ? (apiStudentsData.data?.students || []) : [];
    if (apiStudents.length > 0) {
      return apiStudents.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        classId: `class_${s.class}`,
        className: `Class ${s.class}${s.section ? ' ' + s.section : ''}`,
        classNum: s.class,
        section: s.section,
        rollNo: s.classRollNo,
      }));
    }
    // Fallback to local static data
    return localStudents.map(s => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      className: s.classId?.replace('class_', 'Class ') || 'Unknown',
      classNum: s.classId?.replace('class_', '') || '0',
      section: '',
      rollNo: '',
    }));
  }, [apiStudentsData, localStudents]);

  // Build class options from actual student data
  const getClassOptions = useCallback(() => {
    const classSet = new Map<string, string>();
    allStudents.forEach(s => {
      if (!classSet.has(s.classId)) {
        classSet.set(s.classId, s.className.split(' ').slice(0, 2).join(' ')); // "Class 5"
      }
    });
    const sorted = Array.from(classSet.entries())
      .sort((a, b) => {
        const aNum = parseInt(a[0].replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(b[0].replace(/\D/g, ''), 10) || 0;
        return aNum - bNum;
      })
      .map(([id, name]) => ({ id, name }));
    return [{ id: 'all', name: 'All Classes' }, ...sorted];
  }, [allStudents]);

  // Get all teachers with assigned classes
  const assignedTeachers = React.useMemo(() => {
    if (!apiTeachersData?.success) return [];
    return (apiTeachersData.data?.teachers || []).filter(t => t.class && t.class !== '');
  }, [apiTeachersData]);

  // Load attendance data from API
  useEffect(() => {
    loadAttendanceData();
  }, [selectedClass, dateRange, allStudents, assignedTeachers]);

  useEffect(() => {
    loadProgressData();
  }, [selectedClass, allStudents, allProgressData]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      // Determine the date to fetch attendance for (today)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Fetch attendance from each teacher's class
      const attendanceMap = new Map<string, { status: string | null }>();

      if (assignedTeachers.length > 0) {
        const fetchPromises = assignedTeachers.map(async (teacher) => {
          try {
            const res = await getClassAttendance({
              teacherId: teacher._id,
              date: todayStr,
            }).unwrap();
            if (res.success && res.data?.students) {
              res.data.students.forEach(s => {
                attendanceMap.set(s.id, { status: s.attendanceStatus });
              });
            }
          } catch {
            // Skip teachers whose API call fails
          }
        });
        await Promise.all(fetchPromises);
      }

      // Filter students by selected class
      let filtered = allStudents;
      if (selectedClass !== 'all') {
        filtered = allStudents.filter(s => s.classId === selectedClass);
      }

      // Build student stats using API attendance data
      const studentStats: StudentStat[] = filtered.map(student => {
        const attendanceRecord = attendanceMap.get(student.id);
        const hasAttendance = attendanceRecord && attendanceRecord.status !== null;
        const isPresent = attendanceRecord?.status === 'present';
        const isAbsent = attendanceRecord?.status === 'absent';

        // For today's snapshot, percentage is based on whether marked present
        // If attendance is marked, present=100%, absent=0%
        // If not marked yet, show as not yet marked (0 of 0)
        const present = isPresent ? 1 : 0;
        const total = hasAttendance ? 1 : 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          id: student.id,
          name: student.name,
          className: student.className,
          classId: student.classId,
          present,
          total,
          percentage,
          attendanceStatus: attendanceRecord?.status || null,
        };
      });

      // Sort by class then by name
      studentStats.sort((a, b) => {
        const aNum = parseInt(a.classId.replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(b.classId.replace(/\D/g, ''), 10) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name);
      });

      if (mountedRef.current) {
        setAttendanceData(studentStats);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadProgressData = () => {
    let filtered = [...allStudents];
    if (selectedClass !== 'all') {
      filtered = allStudents.filter(s => s.classId === selectedClass);
    }
    // Sort by class then name
    filtered.sort((a, b) => {
      const aNum = parseInt(a.classId.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.classId.replace(/\D/g, ''), 10) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });

    // Build a map of studentId -> latest progress from backend
    const progressMap = new Map<string, { [subject: string]: { marks: number; total: number } }>();
    const progressRecords = allProgressData?.data || [];
    progressRecords.forEach((record: any) => {
      const sid = record.studentId;
      if (!progressMap.has(sid)) progressMap.set(sid, {});
      const subjectMap = progressMap.get(sid)!;
      (record.subjects || []).forEach((s: any) => {
        if (s.marksObtained !== null && s.marksObtained !== undefined) {
          // Keep latest (overwrite with newer records)
          subjectMap[s.subject] = { marks: s.marksObtained, total: s.totalMarks };
        }
      });
    });

    const progress: StudentStat[] = filtered.map((student) => {
      const subjectData = progressMap.get(student.id);
      const getSubjectPct = (name: string) => {
        const d = subjectData?.[name];
        return d && d.total > 0 ? Math.round((d.marks / d.total) * 100) : undefined;
      };

      const mathGrade = getSubjectPct('Math') ?? getSubjectPct('Mathematics');
      const englishGrade = getSubjectPct('English');
      const scienceGrade = getSubjectPct('Science');

      // Build all subjects list for detailed view
      const allSubjectsList = subjectData
        ? Object.entries(subjectData).map(([name, d]) => ({
            name,
            pct: d.total > 0 ? Math.round((d.marks / d.total) * 100) : 0,
          }))
        : [];

      // Compute average from all available subjects
      const allSubjects = subjectData ? Object.values(subjectData) : [];
      const avgGrade = allSubjects.length > 0
        ? Math.round(allSubjects.reduce((sum, s) => sum + (s.marks / s.total) * 100, 0) / allSubjects.length)
        : undefined;

      return {
        id: student.id,
        name: student.name,
        classId: student.classId,
        className: student.className,
        present: 0,
        total: 0,
        percentage: 0,
        mathGrade: mathGrade ?? 0,
        englishGrade: englishGrade ?? 0,
        scienceGrade: scienceGrade ?? 0,
        averageGrade: avgGrade ?? 0,
        allSubjects: allSubjectsList,
      };
    });

    setProgressData(progress);
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
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        <View style={styles.summaryCards}>
          <StatCard
            title="Total Students"
            value={attendanceData.length}
            icon="👥"
            color="#2F6FED"
          />
          <StatCard
            title="Present"
            value={attendanceData.filter(s => s.attendanceStatus === 'present').length}
            icon="✅"
            color="#28A745"
          />
          <StatCard
            title="Absent"
            value={attendanceData.filter(s => s.attendanceStatus === 'absent').length}
            icon="❌"
            color="#DC3545"
          />
          <StatCard
            title="Not Marked"
            value={attendanceData.filter(s => !s.attendanceStatus).length}
            icon="⏳"
            color="#FFC107"
          />
        </View>
      </View>

      {/* Attendance Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Attendance by Class</Text>
        {getClassOptions().filter(opt => opt.id !== 'all').map(({ id: classId, name: className }) => {
          const classStudents = attendanceData.filter(s => s.classId === classId);
          const markedStudents = classStudents.filter(s => s.total > 0);
          const avgPercentage = markedStudents.length > 0
            ? Math.round(markedStudents.reduce((sum, s) => sum + s.percentage, 0) / markedStudents.length)
            : 0;

          return (
            <View key={classId} style={styles.chartItem}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartLabel}>{className} ({classStudents.length} students)</Text>
                <Text style={[styles.chartValue, { color: getAttendanceColor(avgPercentage) }]}>
                  {markedStudents.length > 0 ? `${avgPercentage}%` : 'N/A'}
                </Text>
              </View>
              <View style={styles.chartBar}>
                <View
                  style={[
                    styles.chartFill,
                    {
                      width: `${avgPercentage}%`,
                      backgroundColor: getAttendanceColor(avgPercentage),
                    },
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
            key={student.id || student._id}
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
                <Text style={styles.studentClass}>{student.className} · ID: {student.id}</Text>
                <Text style={styles.attendanceDetails}>
                  {student.attendanceStatus
                    ? student.attendanceStatus.charAt(0).toUpperCase() + student.attendanceStatus.slice(1)
                    : 'Not marked'}
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
        {(() => {
          const withData = progressData.filter(s => s.averageGrade > 0);
          const avgGrade = withData.length > 0
            ? Math.round(withData.reduce((sum, s) => sum + s.averageGrade, 0) / withData.length)
            : 0;
          return (
            <View style={styles.summaryCards}>
              <StatCard
                title="Total Students"
                value={progressData.length}
                icon="👥"
                color="#2F6FED"
              />
              <StatCard
                title="Avg Grade"
                value={withData.length > 0 ? `${avgGrade}%` : 'N/A'}
                icon="📈"
                color="#28A745"
              />
              <StatCard
                title="High Achievers (90%+)"
                value={withData.filter(s => s.averageGrade >= 90).length}
                icon="⭐"
                color="#28A745"
              />
              <StatCard
                title="Needs Support (<70%)"
                value={withData.filter(s => s.averageGrade > 0 && s.averageGrade < 70).length}
                icon="📚"
                color="#DC3545"
              />
            </View>
          );
        })()}
      </View>

      {/* Student Progress Cards */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Student Progress</Text>
        {progressData.map((student) => (
          <TouchableOpacity
            key={student.id || student._id}
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
                <Text style={styles.studentClass}>{student.className} · ID: {student.id}</Text>
              </View>
            </View>
            <View style={styles.gradesContainer}>
              {student.allSubjects && student.allSubjects.length > 0 ? (
                <>
                  {student.allSubjects.slice(0, 3).map((subj, i) => (
                    <View key={i} style={styles.gradeItem}>
                      <Text style={styles.gradeLabel} numberOfLines={1}>{subj.name}</Text>
                      <Text style={[styles.gradeValue, { color: getGradeColor(subj.pct) }]}>
                        {subj.pct}%
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.gradeItem, styles.averageGrade]}>
                    <Text style={styles.gradeLabel}>Average</Text>
                    <Text style={[styles.gradeValue, { color: student.averageGrade ? getGradeColor(student.averageGrade) : '#999' }]}>
                      {student.averageGrade ? `${student.averageGrade}%` : 'N/A'}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Math</Text>
                    <Text style={[styles.gradeValue, { color: student.mathGrade ? getGradeColor(student.mathGrade) : '#999' }]}>
                      {student.mathGrade ? `${student.mathGrade}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>English</Text>
                    <Text style={[styles.gradeValue, { color: student.englishGrade ? getGradeColor(student.englishGrade) : '#999' }]}>
                      {student.englishGrade ? `${student.englishGrade}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Science</Text>
                    <Text style={[styles.gradeValue, { color: student.scienceGrade ? getGradeColor(student.scienceGrade) : '#999' }]}>
                      {student.scienceGrade ? `${student.scienceGrade}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.gradeItem, styles.averageGrade]}>
                    <Text style={styles.gradeLabel}>Average</Text>
                    <Text style={[styles.gradeValue, { color: student.averageGrade ? getGradeColor(student.averageGrade) : '#999' }]}>
                      {student.averageGrade ? `${student.averageGrade}%` : 'N/A'}
                    </Text>
                  </View>
                </>
              )}
            </View>
            {/* Show remaining subjects if more than 3 */}
            {student.allSubjects && student.allSubjects.length > 3 && (
              <View style={styles.extraGradesContainer}>
                {student.allSubjects.slice(3).map((subj, i) => (
                  <View key={i} style={styles.extraGradeItem}>
                    <Text style={styles.gradeLabel} numberOfLines={1}>{subj.name}</Text>
                    <Text style={[styles.gradeValue, { color: getGradeColor(subj.pct) }]}>
                      {subj.pct}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
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
            <Text style={styles.logo}>🏫 Kilbil School</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {(user?.fullName || (user as any)?.name || '').split(' ')[0]}!</Text>
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatarCircle}>
              <Text style={styles.adminAvatarInitials}>
                {(user?.fullName || (user as any)?.name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{user?.fullName || (user as any)?.name}</Text>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2F6FED" />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : activeTab === 'attendance' ? renderAttendanceTab() : renderProgressTab()}
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  adminAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adminAvatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
  extraGradesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  extraGradeItem: {
    alignItems: 'center',
    minWidth: '22%',
    paddingVertical: 4,
  },
});

export default StatisticsScreen;
