import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ProfileIcon from '../../components/ProfileIcon';

const ChatScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>💬 Chat</Text>
            <Text style={styles.headerSubtitle}>
              Communicate with teachers and school staff
            </Text>
          </View>
          <ProfileIcon />
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.body}>
        <Text style={styles.bellIcon}>🔔</Text>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Live messaging with teachers and school staff will be available from the next academic year.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B3D4FF',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  bellIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChatScreen;
