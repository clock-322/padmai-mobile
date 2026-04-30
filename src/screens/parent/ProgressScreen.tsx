import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { useGetStudentsByParentIdMutation } from '../../store/services/studentsApi';
import { useGetStudentProgressQuery } from '../../store/services/progressApi';
import { StudentApi } from '../../types/students';
import ProfileIcon from '../../components/ProfileIcon';

const getGrade = (marks: number, total: number) => {
  const pct = (marks / total) * 100;
  if (pct >= 90) return { grade: 'A+', color: '#28A745' };
  if (pct >= 80) return { grade: 'A', color: '#28A745' };
  if (pct >= 70) return { grade: 'B', color: '#2F6FED' };
  if (pct >= 60) return { grade: 'C', color: '#FFC107' };
  if (pct >= 50) return { grade: 'D', color: '#FD7E14' };
  return { grade: 'F', color: '#DC3545' };
};

const ParentProgressScreen = () => {
  const { user } = useAuth();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const [apiStudents, setApiStudents] = useState<StudentApi[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [getStudentsByParentId] = useGetStudentsByParentIdMutation();

  const currentUser = reduxUser || user;

  const loadStudents = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingStudents(true);
    try {
      const result = await getStudentsByParentId({ parentId: currentUser.id }).unwrap();
      if (result.success && result.data?.students) {
        setApiStudents(result.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [currentUser, getStudentsByParentId]);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents])
  );

  // Fetch progress for the selected student
  const selectedStudent = apiStudents[selectedStudentIdx] || null;
  const studentId = selectedStudent?.id;
  const { data: progressData, isLoading: progressLoading } = useGetStudentProgressQuery(
    { studentId: studentId || '' },
    { skip: !studentId, refetchOnMountOrArgChange: true }
  );

  if (loadingStudents) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>📊 Progress Report</Text>
              <Text style={styles.headerSubtitle}>Academic Statistics</Text>
            </View>
            <ProfileIcon />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressRecords = progressData?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>📊 Progress Report</Text>
            <Text style={styles.headerSubtitle}>Academic Statistics</Text>
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
        {apiStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySubtitle}>Add a student to see their progress report</Text>
          </View>
        ) : selectedStudent ? (
          <>
            {/* Student Info */}
            <View style={styles.studentCard}>
              <Text style={styles.studentAvatar}>{selectedStudent.gender === 'female' ? '👧' : '👦'}</Text>
              <View>
                <Text style={styles.studentName}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </Text>
                <Text style={styles.studentClass}>
                  Class {selectedStudent.class}{selectedStudent.section ? `-${selectedStudent.section}` : ''} | Roll No: {selectedStudent.classRollNo}
                </Text>
              </View>
            </View>

            {progressLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2F6FED" />
                <Text style={styles.loadingText}>Loading marks...</Text>
              </View>
            ) : progressRecords.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Progress Data Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Marks will appear here once teachers submit them
                </Text>
              </View>
            ) : (
              progressRecords.map((record: any, idx: number) => (
                <View key={idx} style={styles.monthCard}>
                  <Text style={styles.monthTitle}>
                    {record.month || 'Report'} {record.year || ''}
                  </Text>
                  {(record.subjects || []).map((subject: any, sIdx: number) => {
                    const gradeInfo = getGrade(subject.marks, subject.total);
                    return (
                      <View key={sIdx} style={styles.subjectRow}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectMarks}>
                          {subject.marks}/{subject.total}
                        </Text>
                        <View style={[styles.gradeBadge, { backgroundColor: gradeInfo.color + '20' }]}>
                          <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
                            {gradeInfo.grade}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#B3D4FF', marginTop: 2 },
  content: { flex: 1, padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentAvatar: { fontSize: 40 },
  studentName: { fontSize: 18, fontWeight: '600', color: '#333' },
  studentClass: { fontSize: 14, color: '#666', marginTop: 2 },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F6FED',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
  subjectMarks: { fontSize: 15, fontWeight: '600', color: '#555', marginRight: 12 },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  gradeText: { fontSize: 14, fontWeight: '700' },
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

export default ParentProgressScreen;
