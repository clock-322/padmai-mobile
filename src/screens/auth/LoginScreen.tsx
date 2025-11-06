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
import { useLoginMutation } from '../../store/services/authApi';
import { persistCredentials, setCredentials } from '../../store/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

const LoginScreen = ({ onNavigateToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const { showToast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
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

    setLoading(true);
    const timeoutMs = 15000;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject({ error: 'Request timed out' }), timeoutMs));
    try {
      const response = await Promise.race([
        loginMutation({ email: email.trim(), password }).unwrap(),
        timeoutPromise,
      ]) as any;
      const apiUser = response.data.user;
      const token = response.data.token;
      const normalizedRole = apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role;
      const userForState: any = { id: apiUser.id, name: apiUser.name, email: apiUser.email, role: normalizedRole };

      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
      showToast('Login successful!', 'success');
    } catch (error: any) {
      const apiMessage = error?.data?.message || error?.error || 'Login failed. Please try again.';
      console.debug('Login error', JSON.stringify(error));
      showToast(apiMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'parent' | 'teacher' | 'schoolOwner') => {
    const credentials = {
      parent: { email: 'parent@padmai.demo', password: 'Demo@123' },
      teacher: { email: 'teacher@padmai.demo', password: 'Demo@123' },
      schoolOwner: { email: 'owner@padmai.demo', password: 'Demo@123' },
    };

    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    
    setLoading(true);
    const timeoutMs = 15000;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject({ error: 'Request timed out' }), timeoutMs));
    try {
      const response = await Promise.race([
        loginMutation({ email: credentials[role].email, password: credentials[role].password }).unwrap(),
        timeoutPromise,
      ]) as any;
      const apiUser = response.data.user;
      const token = response.data.token;
      const normalizedRole = apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role;
      const userForState: any = { id: apiUser.id, name: apiUser.name, email: apiUser.email, role: normalizedRole };
      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
    } catch (error: any) {
      console.debug('Quick login error', JSON.stringify(error));
      Alert.alert('Login Failed', error?.data?.message || error?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>Padmai</Text>
          <Text style={styles.subtitle}>School Management System</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {(loading || isLoggingIn) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.quickLoginTitle}>Quick Login</Text>
          
          <View style={styles.quickLoginButtons}>
            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin('parent')}
              disabled={loading}
            >
              <Text style={styles.quickLoginIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.quickLoginText}>Login as Parent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin('teacher')}
              disabled={loading}
            >
              <Text style={styles.quickLoginIcon}>👩‍🏫</Text>
              <Text style={styles.quickLoginText}>Login as Teacher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin('schoolOwner')}
              disabled={loading}
            >
              <Text style={styles.quickLoginIcon}>🏫</Text>
              <Text style={styles.quickLoginText}>Login as School Owner</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.footerLink}>Sign Up</Text>
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
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickLoginButtons: {
    gap: 12,
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickLoginIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickLoginText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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

export default LoginScreen;