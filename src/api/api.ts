import axios from 'axios';

// Replace with your actual server URL
const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // In a real app, you'd get the token from AsyncStorage
    // For now, we'll handle this in the individual API calls
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export interface LoginResponse {
  token: string;
  role: 'parent' | 'teacher' | 'admin';
  name: string;
}

export interface Payment {
  id: string;
  studentName: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending';
}

export interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  audience: string;
}

// Auth API
export const login = async (role: string, name: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { role, name });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed');
  }
};

// Payments API
export const fetchPayments = async (): Promise<Payment[]> => {
  try {
    const response = await api.get('/payments');
    return response.data;
  } catch (error) {
    console.error('Fetch payments error:', error);
    throw new Error('Failed to fetch payments');
  }
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    console.error('Fetch events error:', error);
    throw new Error('Failed to fetch events');
  }
};

export default api;
