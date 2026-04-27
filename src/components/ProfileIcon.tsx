import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getStoredAvatarUri } from './EditProfileModal';

const ProfileIcon = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    getStoredAvatarUri().then(uri => setAvatarUri(uri));
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);

  return (
    <TouchableOpacity
      style={styles.profileIcon}
      onPress={() => navigation.navigate('Profile' as never)}
      activeOpacity={0.7}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.profileIconText}>
          {getInitials((user as any)?.name || 'U')}
        </Text>
      )}
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
    overflow: 'hidden',
  },
  profileIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default ProfileIcon;
