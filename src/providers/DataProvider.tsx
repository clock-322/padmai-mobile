import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, Attendance, Event, Payment } from '../types/auth';

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
    // Simulate loading static data
    const loadData = async () => {
      try {
        // In a real app, you might load from API or local storage
        // For demo purposes, we're using static JSON imports
        setUsers(usersData as User[]);
        setStudents(studentsData as Student[]);
        setAttendance(attendanceData as Attendance[]);
        setEvents(eventsData as Event[]);
        setPayments(paymentsData as Payment[]);
        setPaymentsAdmin(paymentsAdminData as any[]);
        setTeachers(teachersData as any[]);
        setCourses(coursesData as any[]);
        setChats(chatsData as any[]);
        setChatMessages(chatMessagesData as any[]);
        
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
    isLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

