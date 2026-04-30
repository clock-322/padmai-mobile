import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

const DEMO_CREDENTIALS = {
  parent:      { email: 'parent@kilbil.demo',  password: 'Demo@123' },
  teacher:     { email: 'teacher@kilbil.demo', password: 'Demo@123' },
  schoolOwner: { email: 'owner@kilbil.demo',   password: 'Demo@123' },
};

const LoginScreen = ({ onNavigateToRegister }: LoginScreenProps) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const dispatch = useDispatch();
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const { showToast } = useToast();

  const doLogin = async (em: string, pw: string) => {
    setLoading(true);
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej({ error: 'Request timed out' }), 15000)
    );
    try {
      const response = await Promise.race([
        loginMutation({ email: em.trim(), password: pw }).unwrap(),
        timeout,
      ]) as any;
      const apiUser = response.data.user;
      const token   = response.data.token;
      const normalizedRole = apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role;
      const userForState: any = {
        id: apiUser.id, name: apiUser.name,
        email: apiUser.email, role: normalizedRole,
      };
      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
      showToast('Login successful!', 'success');
    } catch (error: any) {
      showToast(error?.data?.message || error?.error || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error'); return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    doLogin(email, password);
  };

  const handleRoleLogin = (role: 'parent' | 'teacher' | 'schoolOwner') => {
    const creds = DEMO_CREDENTIALS[role];
    doLogin(creds.email, creds.password);
  };

  const busy = loading || isLoggingIn;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🏫</Text>
          <Text style={styles.logo}>Kilbil School</Text>
          <Text style={styles.subtitle}>School Management System</Text>
        </View>

        {/* Email/Password Form */}
        <View style={styles.formCard}>
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
              editable={!busy}
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
              editable={!busy}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, busy && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginButtonText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 40 },

  header: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 56, marginBottom: 8 },
  logo: { fontSize: 36, fontWeight: '800', color: '#2F6FED', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center' },

  roleSection: { marginBottom: 24 },
  roleSectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#333',
    marginBottom: 14, textAlign: 'center',
  },
  roleButton: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, borderRadius: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  roleParent:  { backgroundColor: '#2F6FED' },
  roleTeacher: { backgroundColor: '#28A745' },
  roleOwner:   { backgroundColor: '#6F42C1' },
  roleEmoji: { fontSize: 30, marginRight: 14 },
  roleTextBox: { flex: 1 },
  roleLabel: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  roleDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  roleArrow: { fontSize: 26, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 12, color: '#999', fontSize: 13 },

  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#dee2e6', borderRadius: 10,
    padding: 14, fontSize: 15, backgroundColor: '#f8f9fa', color: '#212529',
  },
  loginButton: {
    backgroundColor: '#2F6FED', paddingVertical: 15,
    borderRadius: 10, alignItems: 'center', marginTop: 4,
  },
  loginButtonDisabled: { backgroundColor: '#b0c4f5' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  footerText: { fontSize: 15, color: '#666' },
  footerLink: { fontSize: 15, color: '#2F6FED', fontWeight: '700' },
});

export default LoginScreen;
