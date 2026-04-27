import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../../store/services/authApi';
import { persistCredentials, setCredentials } from '../../store/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import { useData } from '../../providers/DataProvider';
import { Role } from '../../types/auth';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const RegisterScreen = ({ onNavigateToLogin }: RegisterScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('parent');
  const [childId, setChildId] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation();
  const { students } = useData();
  const { showToast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length < 6) return { strength: 'Weak', color: '#dc3545' };
    if (password.length < 8) return { strength: 'Medium', color: '#ffc107' };
    return { strength: 'Strong', color: '#28a745' };
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!validatePassword(password)) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const apiRole = role === 'schoolOwner' ? 'admin' : role;
      const response = await registerMutation({
        name: fullName.trim(),
        email: email.trim(),
        password,
        role: apiRole,
      }).unwrap();

      const apiUser = response.data.user;
      const token = response.data.token;
      const normalizedRole = (apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role) as Role;
      const userForState: any = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: normalizedRole,
      };

      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
      showToast('Registration successful! Welcome to Kilbil School!', 'success');
    } catch (error: any) {
      const apiMessage = error?.data?.message || 'Registration failed. Please try again.';
      showToast(apiMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>Kilbil School</Text>
          <Text style={styles.subtitle}>Create Your Account</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign Up</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              editable={!loading}
            />
            {password.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  Password Strength: {passwordStrength.strength}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              editable={!loading}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.roleContainer}>
              {(['parent', 'teacher', 'schoolOwner'] as const).map((roleOption) => (
                <TouchableOpacity
                  key={roleOption}
                  style={[
                    styles.roleButton,
                    role === roleOption && styles.roleButtonSelected,
                  ]}
                  onPress={() => setRole(roleOption)}
                  disabled={loading}
                >
                  <Text style={styles.roleIcon}>
                    {roleOption === 'parent' ? '👨‍👩‍👧‍👦' : 
                     roleOption === 'teacher' ? '👩‍🏫' : '🏫'}
                  </Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === roleOption && styles.roleButtonTextSelected,
                    ]}
                  >
                    {roleOption === 'parent' ? 'Parent' :
                     roleOption === 'teacher' ? 'Teacher' : 'School Owner'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {role === 'parent' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Child ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={childId}
                onChangeText={setChildId}
                placeholder="Enter your child's ID"
                editable={!loading}
              />
              {students.length > 0 && (
                <Text style={styles.helpText}>
                  Available students: {students.map(s => s.name).join(', ')}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {(loading || isRegistering) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2F6FED',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  passwordStrength: {
    marginTop: 4,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  roleButtonSelected: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  registerButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  footerLink: {
    fontSize: 16,
    color: '#2F6FED',
    fontWeight: '600',
  },
});

export default RegisterScreen;