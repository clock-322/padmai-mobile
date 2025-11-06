import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeParent from '../screens/HomeParent';
import HomeTeacher from '../screens/HomeTeacher';
import HomeAdmin from '../screens/HomeAdmin';
import PaymentsScreen from '../screens/PaymentsScreen';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  // Role-based navigation
  const getHomeScreen = () => {
    switch (user?.role) {
      case 'parent':
        return 'HomeParent';
      case 'teacher':
        return 'HomeTeacher';
      case 'admin':
        return 'HomeAdmin';
      default:
        return 'HomeParent';
    }
  };

  return (
    <Stack.Navigator initialRouteName={getHomeScreen()}>
      <Stack.Screen 
        name="HomeParent" 
        component={HomeParent} 
        options={{ title: 'Home' }}
      />
      <Stack.Screen 
        name="HomeTeacher" 
        component={HomeTeacher} 
        options={{ title: 'Home' }}
      />
      <Stack.Screen 
        name="HomeAdmin" 
        component={HomeAdmin} 
        options={{ title: 'Home' }}
      />
      <Stack.Screen 
        name="Payments" 
        component={PaymentsScreen} 
        options={{ title: 'Payments' }}
      />
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ title: 'Events' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
