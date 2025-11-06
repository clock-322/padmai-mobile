import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileIcon = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile' as never);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity
      style={styles.profileIcon}
      onPress={handleProfilePress}
      activeOpacity={0.7}
    >
      <Text style={styles.profileIconText}>
        {getInitials(user?.fullName || 'U')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
});

export default ProfileIcon;
