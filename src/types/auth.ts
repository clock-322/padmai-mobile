export type Role = 'parent' | 'teacher' | 'schoolOwner';

// API role values; map app 'schoolOwner' -> api 'admin' when sending requests
export type ApiRole = 'parent' | 'teacher' | 'admin';

export interface User {
  id: string;
  fullName: string; // API returns `name`; app uses `fullName`
  email: string;
  role: Role;
  childId?: string; // Only for parents
  createdAt: string;
}

export interface EditProfilePayload {
  name: string;
  email: string;
}

export interface EditProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: { id: string; name: string; email: string; role: 'parent' | 'teacher' | 'admin' };
  };
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profileData: EditProfilePayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  childId?: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  parentId: string;
  grade: string;
  class?: string;
  teacher?: string;
  avatar?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Event {
  id: string;
  title: string;
  studentId?: string;
  classId?: string;
  date: string;
  type: 'event' | 'task' | 'holiday';
  createdBy: string;
  notes: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}