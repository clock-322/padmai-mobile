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

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DIVISIONS = ['A', 'B', 'C'];

const AddStudentModal: React.FC<AddStudentModalProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addStudent, { isLoading }] = useAddStudentMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    motherName: '',
    class: '',
    division: '',
    classRollNo: '',
    gender: '' as 'male' | 'female' | '',
    idNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setFormData({ firstName: '', lastName: '', fatherName: '', motherName: '', class: '', division: '', classRollNo: '', gender: '', idNumber: '' });
      setErrors({});
    }
  }, [visible]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim())  e.firstName  = 'First name is required';
    if (!formData.lastName.trim())   e.lastName   = 'Last name is required';
    if (!formData.fatherName.trim()) e.fatherName = 'Father name is required';
    if (!formData.motherName.trim()) e.motherName = 'Mother name is required';
    if (!formData.class.trim())      e.class      = 'Class is required';
    if (!formData.division)          e.division   = 'Division is required';
    if (!formData.classRollNo.trim()) e.classRollNo = 'Roll number is required';
    if (!formData.gender)            e.gender     = 'Gender is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.id) { showToast('User not found. Please log in again.', 'error'); return; }
    try {
      const result = await addStudent({
        parentId: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        class: formData.class,
        section: formData.division,          // map division → section for API
        registrationNo: `${formData.class}${formData.division}${formData.classRollNo}`,
        classRollNo: formData.classRollNo,
        gender: formData.gender as 'male' | 'female',
        idNumber: formData.idNumber || undefined,
      }).unwrap();
      if (result.success) {
        showToast('Student added successfully!', 'success');
        onClose();
        onSuccess?.();
      } else {
        showToast(result.message || 'Failed to add student', 'error');
      }
    } catch (error: any) {
      showToast(error?.data?.message || error?.error || 'Failed to add student', 'error');
    }
  };

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add Student</Text>
              <TouchableOpacity onPress={onClose} disabled={isLoading} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

              {/* First Name */}
              <View style={styles.field}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput style={[styles.input, errors.firstName && styles.inputError]}
                  value={formData.firstName} onChangeText={v => update('firstName', v)}
                  placeholder="Enter first name" placeholderTextColor="#999" editable={!isLoading} />
                {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}
              </View>

              {/* Last Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput style={[styles.input, errors.lastName && styles.inputError]}
                  value={formData.lastName} onChangeText={v => update('lastName', v)}
                  placeholder="Enter last name" placeholderTextColor="#999" editable={!isLoading} />
                {errors.lastName ? <Text style={styles.error}>{errors.lastName}</Text> : null}
              </View>

              {/* Father Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Father's Name *</Text>
                <TextInput style={[styles.input, errors.fatherName && styles.inputError]}
                  value={formData.fatherName} onChangeText={v => update('fatherName', v)}
                  placeholder="Enter father's name" placeholderTextColor="#999" editable={!isLoading} />
                {errors.fatherName ? <Text style={styles.error}>{errors.fatherName}</Text> : null}
              </View>

              {/* Mother Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Mother's Name *</Text>
                <TextInput style={[styles.input, errors.motherName && styles.inputError]}
                  value={formData.motherName} onChangeText={v => update('motherName', v)}
                  placeholder="Enter mother's name" placeholderTextColor="#999" editable={!isLoading} />
                {errors.motherName ? <Text style={styles.error}>{errors.motherName}</Text> : null}
              </View>

              {/* Gender */}
              <View style={styles.field}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.divisionRow}>
                  {(['male', 'female'] as const).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.divisionBtn, formData.gender === g && styles.divisionBtnActive]}
                      onPress={() => update('gender', g)}
                      disabled={isLoading}
                    >
                      <Text style={[styles.divisionBtnText, formData.gender === g && styles.divisionBtnTextActive]}>
                        {g === 'male' ? '👦 Male' : '👧 Female'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}
              </View>

              {/* Class */}
              <View style={styles.field}>
                <Text style={styles.label}>Class *</Text>
                <TextInput style={[styles.input, errors.class && styles.inputError]}
                  value={formData.class} onChangeText={v => update('class', v)}
                  placeholder="e.g., 5" placeholderTextColor="#999"
                  keyboardType="numeric" editable={!isLoading} />
                {errors.class ? <Text style={styles.error}>{errors.class}</Text> : null}
              </View>

              {/* Division */}
              <View style={styles.field}>
                <Text style={styles.label}>Division *</Text>
                <View style={styles.divisionRow}>
                  {DIVISIONS.map(div => (
                    <TouchableOpacity
                      key={div}
                      style={[styles.divisionBtn, formData.division === div && styles.divisionBtnActive]}
                      onPress={() => update('division', div)}
                      disabled={isLoading}
                    >
                      <Text style={[styles.divisionBtnText, formData.division === div && styles.divisionBtnTextActive]}>
                        {div}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.division ? <Text style={styles.error}>{errors.division}</Text> : null}
              </View>

              {/* Roll Number */}
              <View style={styles.field}>
                <Text style={styles.label}>Roll Number *</Text>
                <TextInput style={[styles.input, errors.classRollNo && styles.inputError]}
                  value={formData.classRollNo} onChangeText={v => update('classRollNo', v)}
                  placeholder="e.g., 15" placeholderTextColor="#999"
                  keyboardType="numeric" editable={!isLoading} />
                {errors.classRollNo ? <Text style={styles.error}>{errors.classRollNo}</Text> : null}
              </View>

              {/* Student ID Number */}
              <View style={styles.field}>
                <Text style={styles.label}>Student ID Number</Text>
                <TextInput style={styles.input}
                  value={formData.idNumber} onChangeText={v => update('idNumber', v)}
                  placeholder="Enter student ID (optional)" placeholderTextColor="#999" editable={!isLoading} />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>ℹ️ Roll number is used for attendance. Students will be listed in roll number order.</Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose} disabled={isLoading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.submitBtn, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Student</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%', elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  form: { padding: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#fff' },
  inputError: { borderColor: '#dc3545' },
  error: { fontSize: 12, color: '#dc3545', marginTop: 4 },
  divisionRow: { flexDirection: 'row', gap: 12 },
  divisionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#dee2e6', alignItems: 'center' },
  divisionBtnActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  divisionBtnText: { fontSize: 18, fontWeight: '700', color: '#495057' },
  divisionBtnTextActive: { color: '#fff' },
  infoBox: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, marginTop: 4 },
  infoText: { fontSize: 13, color: '#1976d2', lineHeight: 18 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef' },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
  submitBtn: { backgroundColor: '#2F6FED' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.6 },
});

export default AddStudentModal;
