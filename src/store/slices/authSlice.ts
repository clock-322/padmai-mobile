import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/authApi';

type Role = 'parent' | 'teacher' | 'admin' | 'schoolOwner';

export interface AuthUser {
  id: string;
  name: string; // API returns `name`; elsewhere may use fullName
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
    hydrated(state) {
      state.isHydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
      state.token = payload.data.token;
      // Normalize role if backend uses 'admin' while app has 'schoolOwner'
      const normalizedRole: Role = (payload.data.user.role === 'admin' ? 'schoolOwner' : payload.data.user.role) as Role;
      state.user = { ...payload.data.user, role: normalizedRole } as AuthUser;
    });
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.token = payload.data.token;
      const normalizedRole: Role = (payload.data.user.role === 'admin' ? 'schoolOwner' : payload.data.user.role) as Role;
      state.user = { ...payload.data.user, role: normalizedRole } as AuthUser;
    });
    builder.addMatcher(authApi.endpoints.editProfile.matchFulfilled, (state, { payload }) => {
      // Normalize role if backend uses 'admin' while app has 'schoolOwner'
      const normalizedRole: Role = (payload.data.user.role === 'admin' ? 'schoolOwner' : payload.data.user.role) as Role;
      state.user = { ...payload.data.user, role: normalizedRole } as AuthUser;
    });
  },
});

export const { setCredentials, updateUser, logout, hydrated } = authSlice.actions;
export default authSlice.reducer;

export const persistCredentials = async (token: string, user: AuthUser) => {
  await AsyncStorage.multiSet([
    ['auth.token', token],
    ['auth.user', JSON.stringify(user)],
  ]);
};

export const clearCredentials = async () => {
  await AsyncStorage.multiRemove(['auth.token', 'auth.user']);
};

export const loadCredentials = async (): Promise<{ token: string | null; user: AuthUser | null }> => {
  const [[, token], [, userStr]] = await AsyncStorage.multiGet(['auth.token', 'auth.user']);
  return { token: token ?? null, user: userStr ? (JSON.parse(userStr) as AuthUser) : null };
};


