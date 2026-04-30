import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useGetStudentsByParentIdMutation } from '../../store/services/studentsApi';
import { StudentApi } from '../../types/students';
import ProfileIcon from '../../components/ProfileIcon';

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  reason?: string;
}

interface MonthlyStats {
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

// Fixed Indian public holidays (MM-DD — same date every year)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-26': 'Republic Day',
  '04-14': 'Dr. Ambedkar Jayanti',
  '05-01': 'Maharashtra Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas',
};

// Movable Indian holidays by exact date (add future years as needed)
const MOVABLE_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-14': 'Makar Sankranti',
  '2025-03-14': 'Holi',
  '2025-04-06': 'Ram Navami',
  '2025-04-18': 'Good Friday',
  '2025-05-12': 'Buddha Purnima',
  '2025-06-07': 'Eid ul-Adha',
  '2025-08-16': 'Janmashtami',
  '2025-08-27': 'Ganesh Chaturthi',
  '2025-10-02': 'Dussehra',
  '2025-10-20': 'Diwali',
  '2025-10-21': 'Diwali',
  '2025-11-05': 'Guru Nanak Jayanti',
  // 2026
  '2026-01-14': 'Makar Sankranti',
  '2026-03-04': 'Holi',
  '2026-03-30': 'Ram Navami',
  '2026-04-03': 'Good Friday',
  '2026-04-21': 'Eid ul-Fitr',
  '2026-08-05': 'Janmashtami',
  '2026-08-23': 'Ganesh Chaturthi',
  '2026-10-19': 'Dussehra',
  '2026-11-08': 'Diwali',
  '2026-11-09': 'Diwali',
  '2026-11-24': 'Guru Nanak Jayanti',
};

const getHolidayName = (dateStr: string): string | null => {
  // Check exact YYYY-MM-DD first (movable feasts)
  if (MOVABLE_HOLIDAYS[dateStr]) return MOVABLE_HOLIDAYS[dateStr];
  // Then check fixed MM-DD holidays
  const mmdd = dateStr.slice(5);
  return FIXED_HOLIDAYS[mmdd] || null;
};

const AttendanceScreen = () => {
  const { user } = useAuth();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const { students, attendance } = useData();
  const [getStudentsByParentId] = useGetStudentsByParentIdMutation();
  const [apiStudents, setApiStudents] = useState<StudentApi[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load students list once
  const loadStudentsList = useCallback(async () => {
    const currentUser = reduxUser || user;
    if (!currentUser?.id) return;
    try {
      const res = await getStudentsByParentId({ parentId: currentUser.id }).unwrap();
      if (res.success && res.data?.students?.length) {
        setApiStudents(res.data.students);
      }
    } catch {}
  }, [reduxUser, user, getStudentsByParentId]);

  useEffect(() => { loadStudentsList(); }, [loadStudentsList]);

  const loadAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = reduxUser || user;

      // --- Primary: fetch live attendance from API via attendanceHistory ---
      let apiRecords: AttendanceRecord[] = [];
      if (currentUser?.id) {
        try {
          const res = await getStudentsByParentId({ parentId: currentUser.id }).unwrap();
          if (res.success && res.data?.students?.length) {
            setApiStudents(res.data.students);
            const apiStudent = res.data.students[selectedStudentIdx] || res.data.students[0];
            const history = apiStudent.attendanceHistory || [];
            apiRecords = history
              .filter(h => h && h.date) // skip entries with missing date
              .map((h, idx) => ({
                id: `api_${idx}`,
                studentId: apiStudent.id,
                date: h.date.slice(0, 10), // normalize to YYYY-MM-DD
                status: (h.status as 'present' | 'absent' | 'late') || 'present',
              }));
            // Use local date (not UTC) to avoid timezone off-by-one in IST
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            // Inject today's status from attendanceStatus if not already in history
            if (apiStudent.attendanceStatus) {
              const alreadyHasToday = apiRecords.some(r => r.date === todayStr);
              if (!alreadyHasToday) {
                apiRecords.push({
                  id: 'api_today',
                  studentId: apiStudent.id,
                  date: todayStr,
                  status: apiStudent.attendanceStatus as 'present' | 'absent' | 'late',
                });
              }
            }
          }
        } catch {
          // API failed — fall through to static data
        }
      }

      // --- Fallback: static JSON data ---
      let records = apiRecords;
      if (records.length === 0) {
        const childId = (currentUser as any)?.childId;
        const child = childId ? students.find(s => s.id === childId) : students.find(s => s.id === 's_1');
        if (child) {
          records = attendance.filter(r => r.studentId === child.id) as AttendanceRecord[];
        }
      }

      // Filter to current month using string comparison to avoid timezone issues
      const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const filtered = records.filter(r => {
        // r.date is already normalized to YYYY-MM-DD
        return r.date.startsWith(yearMonth);
      });

      setMonthlyAttendance(filtered);

      const present = filtered.filter(r => r.status === 'present').length;
      const absent  = filtered.filter(r => r.status === 'absent').length;
      const late    = filtered.filter(r => r.status === 'late').length;
      const total   = present + absent + late;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      setMonthlyStats({ present, absent, late, percentage });
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [reduxUser, user, students, attendance, currentMonth, getStudentsByParentId, selectedStudentIdx]);

  // Reload every time the screen is focused (catches teacher attendance updates)
  useFocusEffect(
    useCallback(() => {
      loadAttendanceData();
    }, [loadAttendanceData])
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#28A745';
      case 'absent':  return '#DC3545';
      case 'late':    return '#FFC107';
      case 'holiday': return '#FF9800';
      default:        return '#E0E0E0';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent':  return '❌';
      case 'late':    return '⏰';
      case 'holiday': return '🎉';
      default:        return '';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendanceRecord = monthlyAttendance.find(a => a.date === dateStr);
      const holiday = getHolidayName(dateStr);
      // Use local date constructor to avoid UTC timezone shift
      const [yr, mn, dy] = dateStr.split('-').map(Number);
      const dow = new Date(yr, mn - 1, dy).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const weekendLabel = dow === 0 ? 'Sunday' : 'Saturday';
      days.push({
        day,
        date: dateStr,
        status: attendanceRecord?.status || (holiday || isWeekend ? 'holiday' : 'unknown'),
        reason: attendanceRecord?.reason || holiday || (isWeekend ? weekendLabel : undefined),
      });
    }

    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6FED" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  const selectedStudent = apiStudents[selectedStudentIdx] || null;
  const calendarDays = generateCalendarDays();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📊 Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''} - {formatMonthYear(currentMonth)}
            </Text>
          </View>
          <ProfileIcon />
        </View>
      </View>

      {/* Student Picker */}
      {apiStudents.length >= 1 && (
        <View style={styles.studentPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentPickerContent}>
            {apiStudents.map((s, idx) => (
              <TouchableOpacity
                key={s.id || (s as any)._id || `s-${idx}`}
                style={[styles.studentChip, selectedStudentIdx === idx && styles.studentChipActive]}
                onPress={() => setSelectedStudentIdx(idx)}
              >
                <Text style={[styles.studentChipText, selectedStudentIdx === idx && styles.studentChipTextActive]}>
                  {s.firstName} {s.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Monthly Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyStats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyStats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyStats.percentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {formatMonthYear(currentMonth)}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.calendarHeaderDay}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayData, index) => (
              <View key={index} style={styles.calendarDay}>
                {dayData ? (
                  <View style={styles.dayContainer}>
                    <Text style={styles.dayNumber}>{dayData.day}</Text>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(dayData.status) }
                      ]}
                    >
                      <Text style={styles.statusIcon}>
                        {getStatusIcon(dayData.status)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyDay} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#28A745' }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#DC3545' }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#FFC107' }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
          </View>
        </View>

        {/* Recent Attendance Records */}
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          {monthlyAttendance
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((record) => (
              <View key={record.id} style={styles.recordItem}>
                <View style={styles.recordDate}>
                  <Text style={styles.recordDateText}>
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.recordStatus}>
                  <Text style={styles.recordStatusIcon}>
                    {getStatusIcon(record.status)}
                  </Text>
                  <Text style={[
                    styles.recordStatusText,
                    { color: getStatusColor(record.status) }
                  ]}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
                {record.reason && (
                  <Text style={styles.recordReason}>{record.reason}</Text>
                )}
              </View>
            ))}
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
    backgroundColor: '#f8f9fa',
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
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F6FED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarHeaderDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 8,
  },
  emptyDay: {
    flex: 1,
  },
  legendContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  recordsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordDate: {
    flex: 1,
  },
  recordDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  recordStatusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  recordStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  studentPicker: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  studentPickerContent: {
    gap: 8,
  },
  studentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  studentChipActive: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  studentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  studentChipTextActive: {
    color: '#fff',
  },
});

export default AttendanceScreen;