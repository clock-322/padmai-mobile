import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AdminHeaderRight: React.FC = () => {
  const navigation = useNavigation<any>();
  
  return (
    <TouchableOpacity
      accessibilityLabel="Open admin profile"
      onPress={() => navigation.navigate('AdminProfileModal')}
      style={styles.profileButton}
    >
      <Text style={styles.profileIcon}>👨‍💼</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileIcon: {
    fontSize: 20,
    color: '#fff',
  },
});

export default AdminHeaderRight;
