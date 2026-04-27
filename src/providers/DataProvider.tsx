import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Attendance, Event, Payment } from '../types/auth';

const CUSTOM_EVENTS_KEY = 'kilbil_custom_events';
const DATA_VERSION_KEY = 'kilbil_data_version';
const CURRENT_DATA_VERSION = '2026-04-13-v1';

// Import JSON data files
import usersData from '../assets/data/users.json';
import studentsData from '../assets/data/students.json';
import attendanceData from '../assets/data/attendance.json';
import eventsData from '../assets/data/events.json';
import paymentsData from '../assets/data/payments.json';
import paymentsAdminData from '../assets/data/payments_admin.json';
import teachersData from '../assets/data/teachers.json';
import coursesData from '../assets/data/courses.json';
import chatsData from '../assets/data/chats.json';
import chatMessagesData from '../assets/data/chatMessages.json';

interface DataContextType {
  users: User[];
  students: Student[];
  attendance: Attendance[];
  events: Event[];
  payments: Payment[];
  paymentsAdmin: any[];
  teachers: any[];
  courses: any[];
  chats: any[];
  chatMessages: any[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  removeEvent: (eventId: string) => void;
  addPayment: (payment: any) => void;
  updatePayment: (paymentId: string, updates: any) => void;
  updatePaymentStatus: (paymentId: string, status: string, reference?: string) => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsAdmin, setPaymentsAdmin] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setUsers(usersData as User[]);
        setStudents(studentsData as Student[]);
        setAttendance(attendanceData as Attendance[]);
        setPayments(paymentsData as Payment[]);
        setPaymentsAdmin(paymentsAdminData as any[]);
        setTeachers(teachersData as any[]);
        setCourses(coursesData as any[]);
        setChats(chatsData as any[]);
        setChatMessages(chatMessagesData as any[]);

        // Clear stale data when app version changes
        try {
          const storedVersion = await AsyncStorage.getItem(DATA_VERSION_KEY);
          if (storedVersion !== CURRENT_DATA_VERSION) {
            await AsyncStorage.removeItem(CUSTOM_EVENTS_KEY);
            await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
          }
        } catch { /* ignore */ }

        // Merge static events with persisted custom events from AsyncStorage
        const staticIds = new Set((eventsData as any[]).map((e: any) => e.id));
        let customEvents: Event[] = [];
        try {
          const stored = await AsyncStorage.getItem(CUSTOM_EVENTS_KEY);
          if (stored) {
            customEvents = JSON.parse(stored) as Event[];
          }
        } catch {
          customEvents = [];
        }
        // Filter out any custom events that duplicate static IDs
        const filtered = customEvents.filter(e => !staticIds.has(e.id));
        setEvents([...(eventsData as Event[]), ...filtered]);

        console.debug('📊 Static data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    console.debug('👤 New user added:', user.email);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );
    console.debug('👤 User updated:', userId, updates);
  };

  const saveCustomEvents = async (allEvents: Event[]) => {
    const staticIds = new Set((eventsData as any[]).map((e: any) => e.id));
    const custom = allEvents.filter(e => !staticIds.has(e.id));
    try {
      await AsyncStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(custom));
    } catch (err) {
      console.error('Failed to persist custom events:', err);
    }
  };

  const addEvent = (event: Event) => {
    setEvents(prev => {
      const next = [...prev, event];
      saveCustomEvents(next);
      return next;
    });
  };

  const updateEvent = (eventId: string, updates: Partial<Event>) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === eventId ? { ...e, ...updates } : e);
      saveCustomEvents(next);
      return next;
    });
  };

  const removeEvent = (eventId: string) => {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== eventId);
      saveCustomEvents(next);
      return next;
    });
  };

  const addPayment = (payment: any) => {
    setPaymentsAdmin(prev => [...prev, payment]);
  };

  const updatePayment = (paymentId: string, updates: any) => {
    setPaymentsAdmin(prev => prev.map(p => p.id === paymentId ? { ...p, ...updates } : p));
  };

  const updatePaymentStatus = (paymentId: string, status: string, reference?: string) => {
    setPaymentsAdmin(prev => prev.map(p => p.id === paymentId ? {
      ...p,
      status,
      ...(reference ? { reference } : {}),
      ...(status === 'paid' ? { paidOn: new Date().toISOString().split('T')[0] } : {}),
    } : p));
  };

  const value: DataContextType = {
    users,
    students,
    attendance,
    events,
    payments,
    paymentsAdmin,
    teachers,
    courses,
    chats,
    chatMessages,
    addUser,
    updateUser,
    addEvent,
    updateEvent,
    removeEvent,
    addPayment,
    updatePayment,
    updatePaymentStatus,
    isLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

