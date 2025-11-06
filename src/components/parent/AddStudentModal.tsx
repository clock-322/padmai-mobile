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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAddStudentMutation } from '../../store/services/studentsApi';
import { StudentFormData } from '../../types/students';

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addStudent, { isLoading }] = useAddStudentMutation();

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
    if (visible) {
      // Reset form when modal opens
      setFormData({
        firstName: '',
        lastName: '',
        class: '',
        section: '',
        registrationNo: '',
        classRollNo: '',
      });
      setErrors({});
    }
  }, [visible]);

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      showToast('User not found. Please log in again.', 'error');
      return;
    }

    try {
      const result = await addStudent({
        parentId: user.id,
        ...formData,
      }).unwrap();

      if (result.success) {
        showToast('Student added successfully!', 'success');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast(result.message || 'Failed to add student', 'error');
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.error || 'Failed to add student';
      showToast(errorMessage, 'error');
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const updateField = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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
              <Text style={styles.headerTitle}>Add Student</Text>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isLoading}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Class */}
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

              {/* Section */}
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

              {/* Registration No */}
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
                {errors.registrationNo && <Text style={styles.errorText}>{errors.registrationNo}</Text>}
              </View>

              {/* Class Roll No */}
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
                {errors.classRollNo && <Text style={styles.errorText}>{errors.classRollNo}</Text>}
              </View>

              {/* Info Text */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  ℹ️ All fields are required. Make sure to enter accurate information.
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Student</Text>
                )}
              </TouchableOpacity>
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
  form: {
    padding: 20,
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
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
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
  submitButton: {
    backgroundColor: '#2F6FED',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AddStudentModal;


