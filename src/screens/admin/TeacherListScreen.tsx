import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  useGetTeachersQuery,
  useAssignTeacherClassMutation,
  Teacher,
} from '../../store/services/teachersApi';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';

const TeacherListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: teachersData, isLoading, error, refetch } = useGetTeachersQuery();
  const [assignTeacherClass, { isLoading: isAssigning }] = useAssignTeacherClassMutation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [classValue, setClassValue] = useState('');
  const [sectionValue, setSectionValue] = useState('');

  // Verify admin access
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'schoolOwner') {
      navigation.goBack();
    }
  }, [user, navigation]);

  useEffect(() => {
    if (teachersData?.data?.teachers) {
      filterTeachers();
    }
  }, [teachersData, searchQuery]);

  const filterTeachers = () => {
    if (!teachersData?.data?.teachers) return;

    let filtered = [...teachersData.data.teachers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(query) ||
          teacher.email.toLowerCase().includes(query) ||
          (teacher.class && teacher.class.toLowerCase().includes(query)) ||
          (teacher.section && teacher.section.toLowerCase().includes(query))
      );
    }

    setFilteredTeachers(filtered);
  };

  const handleAssignClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setClassValue(teacher.class || '');
    setSectionValue(teacher.section || '');
    setModalVisible(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedTeacher) return;

    if (!classValue.trim() || !sectionValue.trim()) {
      Alert.alert('Validation Error', 'Please enter both class and section');
      return;
    }

    try {
      // Optimistic update - update UI immediately
      const optimisticUpdate = {
        ...selectedTeacher,
        class: classValue.trim(),
        section: sectionValue.trim(),
      };

      // Update local state optimistically
      if (teachersData?.data?.teachers) {
        const updatedTeachers = teachersData.data.teachers.map((t) =>
          t._id === selectedTeacher._id ? optimisticUpdate : t
        );
        setFilteredTeachers(
          searchQuery
            ? updatedTeachers.filter(
                (teacher) =>
                  teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (teacher.class && teacher.class.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (teacher.section && teacher.section.toLowerCase().includes(searchQuery.toLowerCase()))
              )
            : updatedTeachers
        );
      }

      // Close modal immediately for fast UI feedback
      setModalVisible(false);
      showToast('Assignment updated successfully!', 'success');

      // Make API call
      await assignTeacherClass({
        teacherId: selectedTeacher._id,
        class: classValue.trim(),
        section: sectionValue.trim(),
      }).unwrap();

      // Refetch to ensure data is in sync
      refetch();
    } catch (error: any) {
      // Revert optimistic update on error
      refetch();
      showToast(
        error?.data?.message || 'Failed to assign class & section. Please try again.',
        'error'
      );
      setModalVisible(true); // Reopen modal on error
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedTeacher(null);
    setClassValue('');
    setSectionValue('');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading teachers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load teachers</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teachers</Text>
          <AdminHeaderRight />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search teachers..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Teachers Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredTeachers.length} {filteredTeachers.length === 1 ? 'teacher' : 'teachers'}
          </Text>
        </View>

        {/* Teachers List */}
        {filteredTeachers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No teachers found matching your search' : 'No teachers found'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredTeachers.map((teacher) => (
              <View key={teacher._id} style={styles.teacherCard}>
                <View style={styles.teacherHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherAvatarText}>
                      {teacher.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherEmail}>{teacher.email}</Text>
                  </View>
                </View>
                <View style={styles.teacherDetails}>
                  <View style={styles.assignmentRow}>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentLabel}>Class & Section:</Text>
                      <Text style={styles.assignmentValue}>
                        {teacher.class && teacher.section
                          ? `${teacher.class} - ${teacher.section}`
                          : 'Unassigned'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => handleAssignClick(teacher)}
                      disabled={isAssigning}
                    >
                      <Text style={styles.assignButtonText}>
                        {teacher.class && teacher.section ? 'Reassign' : 'Assign'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Class & Section</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTeacher && (
              <>
                <View style={styles.modalTeacherInfo}>
                  <Text style={styles.modalTeacherName}>{selectedTeacher.name}</Text>
                  <Text style={styles.modalTeacherEmail}>{selectedTeacher.email}</Text>
                </View>

                <View style={styles.modalForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Class *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 10, 11, 12"
                      placeholderTextColor="#999"
                      value={classValue}
                      onChangeText={setClassValue}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Section *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., A, B, C"
                      placeholderTextColor="#999"
                      value={sectionValue}
                      onChangeText={setSectionValue}
                      autoCapitalize="characters"
                      maxLength={1}
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={handleModalClose}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton, isAssigning && styles.saveButtonDisabled]}
                      onPress={handleAssignSubmit}
                      disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#666',
  },
  teacherDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  assignmentValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTeacherInfo: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTeacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalTeacherEmail: {
    fontSize: 14,
    color: '#666',
  },
  modalForm: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherListScreen;


