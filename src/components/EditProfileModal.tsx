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
  Image,
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AVATAR_STORAGE_KEY = 'user_avatar_uri';

export const getStoredAvatarUri = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
};

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      const userName = (user as any).fullName || (user as any).name || '';
      setName(userName);
      setEmail(user.email || '');
      setErrors({});
      getStoredAvatarUri().then(uri => setAvatarUri(uri));
    }
  }, [visible, user]);

  const getInitials = (n: string) =>
    n.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);

  const handlePickImage = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.7, saveToPhotos: false },
            response => {
              if (response.assets?.[0]?.uri) {
                setAvatarUri(response.assets[0].uri);
              }
            }
          );
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          launchImageLibrary(
            { mediaType: 'photo', quality: 0.7, selectionLimit: 1 },
            response => {
              if (response.assets?.[0]?.uri) {
                setAvatarUri(response.assets[0].uri);
              }
            }
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Persist avatar locally
      if (avatarUri) {
        await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarUri);
      }
      const result = await updateProfile({ name, email });
      if (result.success) {
        showToast('Profile updated successfully', 'success');
        onClose();
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) onClose();
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
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancel} disabled={loading} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Avatar Picker */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={loading}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {getInitials((user as any)?.name || (user as any)?.fullName || '')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cameraOverlay}>
                    <Text style={styles.cameraIcon}>📷</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Tap to change photo</Text>
              </View>

              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={text => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  ℹ️ Your profile information will be updated across all devices
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center', alignItems: 'center',
  },
  closeButtonText: { fontSize: 20, color: '#666', fontWeight: 'bold' },
  form: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#2F6FED',
  },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#2F6FED',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: 'bold', color: '#fff' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#28A745',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  cameraIcon: { fontSize: 13 },
  avatarHint: { fontSize: 13, color: '#666' },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e9ecef',
    borderRadius: 8, padding: 12,
    fontSize: 16, color: '#333', backgroundColor: '#fff',
  },
  inputError: { borderColor: '#dc3545' },
  errorText: { fontSize: 12, color: '#dc3545', marginTop: 4 },
  infoContainer: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, marginTop: 8 },
  infoText: { fontSize: 13, color: '#1976d2', lineHeight: 18 },
  footer: {
    flexDirection: 'row', padding: 20,
    borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 12,
  },
  button: {
    flex: 1, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButton: { backgroundColor: '#2F6FED' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
});

export default EditProfileModal;
