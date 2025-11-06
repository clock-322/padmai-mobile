import React, { createContext, useContext, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContextType, RegisterPayload, Role, EditProfilePayload } from '../types/auth';
import { RootState } from '../store';
import { clearCredentials, persistCredentials, setCredentials, logout as logoutAction, updateUser } from '../store/slices/authSlice';
import { useLoginMutation, useRegisterMutation, useEditProfileMutation } from '../store/services/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps { children: ReactNode }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [editProfileMutation] = useEditProfileMutation();

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await loginMutation({ email: email.trim(), password }).unwrap();
      const apiUser = res.data.user;
      const token = res.data.token;
      const normalizedRole: Role = (apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role) as Role;
      const userForState: any = { id: apiUser.id, name: apiUser.name, email: apiUser.email, role: normalizedRole };
      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.data?.message || e?.error || 'Login failed' };
    }
  };

  const register = async (userData: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiRole = userData.role === 'schoolOwner' ? 'admin' : userData.role;
      const res = await registerMutation({ name: userData.fullName.trim(), email: userData.email.trim(), password: userData.password, role: apiRole as any }).unwrap();
      const apiUser = res.data.user;
      const token = res.data.token;
      const normalizedRole: Role = (apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role) as Role;
      const userForState: any = { id: apiUser.id, name: apiUser.name, email: apiUser.email, role: normalizedRole };
      dispatch(setCredentials({ token, user: userForState }));
      await persistCredentials(token, userForState);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.data?.message || e?.error || 'Registration failed' };
    }
  };

  const updateProfile = async (profileData: EditProfilePayload): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await editProfileMutation({ name: profileData.name.trim(), email: profileData.email.trim() }).unwrap();
      const apiUser = res.data.user;
      const normalizedRole: Role = (apiUser.role === 'admin' ? 'schoolOwner' : apiUser.role) as Role;
      const userForState: any = { id: apiUser.id, name: apiUser.name, email: apiUser.email, role: normalizedRole };
      dispatch(updateUser(userForState));
      if (token) {
        await persistCredentials(token, userForState);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.data?.message || e?.error || 'Profile update failed' };
    }
  };

  const logout = async () => {
    await clearCredentials();
    dispatch(logoutAction());
  };

  const value: AuthContextType = {
    user: user as any,
    login,
    register,
    updateProfile,
    logout,
    isLoading: !isHydrated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};