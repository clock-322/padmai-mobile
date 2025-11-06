import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useUpdateStudentMutation, useDeleteStudentMutation } from '../../store/services/studentsApi';
import { StudentApi, StudentFormData } from '../../types/students';

interface StudentProfileModalProps {
  visible: boolean;
  student: StudentApi | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  visible,
  student,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    class: '',
    section: '',
    registrationNo: '',
    classRollNo: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

  useEffect(() => {
    if (visible && student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class,
        section: student.section,
        registrationNo: student.registrationNo,
        classRollNo: student.classRollNo,
      });
      setIsEditMode(false);
      setErrors({});
    }
  }, [visible, student]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.class.trim()) {
      newErrors.class = 'Class is required';
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required';
    }

    if (!formData.registrationNo.trim()) {
      newErrors.registrationNo = 'Registration number is required';
    }

    if (!formData.classRollNo.trim()) {
      newErrors.classRollNo = 'Class roll number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id || !student) {
      showToast('User or student not found.', 'error');
      return;
    }

    try {
      const result = await updateStudent({
        studentId: student.id,
        parentId: user.id,
        ...formData,
      }).unwrap();

      if (result.success) {
        showToast('Student updated successfully!', 'success');
        setIsEditMode(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast(result.message || 'Failed to update student', 'error');
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.error || 'Failed to update student';
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = () => {
    if (!student) return;

    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.firstName} ${student.lastName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteStudent({ studentId: student.id }).unwrap();
              if (result.success) {
                showToast('Student deleted successfully', 'success');
                onClose();
                if (onSuccess) {
                  onSuccess();
                }
              } else {
                showToast(result.message || 'Failed to delete student', 'error');
              }
            } catch (error: any) {
              const errorMessage = error?.data?.message || error?.error || 'Failed to delete student';
              showToast(errorMessage, 'error');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!isUpdating && !isDeleting) {
      if (isEditMode) {
        setIsEditMode(false);
        // Restore original data
        if (student) {
          setFormData({
            firstName: student.firstName,
            lastName: student.lastName,
            class: student.class,
            section: student.section,
            registrationNo: student.registrationNo,
            classRollNo: student.classRollNo,
          });
        }
      } else {
        onClose();
      }
    }
  };

  const updateField = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName}`;
  const isLoading = isUpdating || isDeleting;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'Edit Student' : 'Student Profile'}
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isLoading}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {isEditMode ? (
                // Edit Mode - Form
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={[styles.input, errors.firstName && styles.inputError]}
                      value={formData.firstName}
                      onChangeText={(text) => updateField('firstName', text)}
                      placeholder="Enter first name"
                      placeholderTextColor="#999"
                      editable={!isLoading}
                    />
                    {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                      style={[styles.input, errors.lastName && styles.inputError]}
                      value={formData.lastName}
                      onChangeText={(text) => updateField('lastName', text)}
                      placeholder="Enter last name"
                      placeholderTextColor="#999"
                      editable={!isLoading}
                    />
                    {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Class *</Text>
                    <TextInput
                      style={[styles.input, errors.class && styles.inputError]}
                      value={formData.class}
                      onChangeText={(text) => updateField('class', text)}
                      placeholder="e.g., 10"
                      placeholderTextColor="#999"
                      editable={!isLoading}
                    />
                    {errors.class && <Text style={styles.errorText}>{errors.class}</Text>}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Section *</Text>
                    <TextInput
                      style={[styles.input, errors.section && styles.inputError]}
                      value={formData.section}
                      onChangeText={(text) => updateField('section', text)}
                      placeholder="e.g., A"
                      placeholderTextColor="#999"
                      editable={!isLoading}
                    />
                    {errors.section && <Text style={styles.errorText}>{errors.section}</Text>}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Registration Number *</Text>
                    <TextInput
                      style={[styles.input, errors.registrationNo && styles.inputError]}
                      value={formData.registrationNo}
                      onChangeText={(text) => updateField('registrationNo', text)}
                      placeholder="e.g., REG2024001"
                      placeholderTextColor="#999"
                      editable={!isLoading}
                    />
                    {errors.registrationNo && (
                      <Text style={styles.errorText}>{errors.registrationNo}</Text>
                    )}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Class Roll Number *</Text>
                    <TextInput
                      style={[styles.input, errors.classRollNo && styles.inputError]}
                      value={formData.classRollNo}
                      onChangeText={(text) => updateField('classRollNo', text)}
                      placeholder="e.g., 15"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                    {errors.classRollNo && (
                      <Text style={styles.errorText}>{errors.classRollNo}</Text>
                    )}
                  </View>
                </>
              ) : (
                // View Mode - Display
                <>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>👦</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Full Name</Text>
                      <Text style={styles.infoValue}>{fullName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Class</Text>
                      <Text style={styles.infoValue}>{student.class}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Section</Text>
                      <Text style={styles.infoValue}>{student.section}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Registration Number</Text>
                      <Text style={styles.infoValue}>{student.registrationNo}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Class Roll Number</Text>
                      <Text style={styles.infoValue}>{student.classRollNo}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {isEditMode ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
                    onPress={handleUpdate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => setIsEditMode(true)}
                    disabled={isLoading}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    fontSize: 64,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2F6FED',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#2F6FED',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default StudentProfileModal;


