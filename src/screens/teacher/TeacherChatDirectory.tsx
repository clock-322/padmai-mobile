import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import TeacherHeaderRight from '../../components/teacher/TeacherHeaderRight';
import ProfileModal from './ProfileModal';

const TeacherChatDirectory = () => {
  const { user } = useAuth();
  const { students, users, chats, chatMessages } = useData();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState('class_1');

  useEffect(() => {
    loadChatThreads();
  }, [selectedClass]);

  const loadChatThreads = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Get chat threads for this teacher
      const teacherChats = chats.filter(chat => chat.teacherId === user?.id);
      
      // Filter by selected class if needed
      const classStudents = students.filter(s => s.classId === selectedClass);
      const classChats = teacherChats.filter(chat => 
        classStudents.some(student => student.id === chat.studentId)
      );

      // Enhance with student and parent info
      const enhancedThreads = classChats.map(chat => {
        const student = students.find(s => s.id === chat.studentId);
        const parent = users.find(u => u.id === chat.parentId);
        
        // Get last message for this thread
        const threadMessages = chatMessages.filter(msg => msg.threadId === chat.threadId);
        const lastMessage = threadMessages.length > 0 
          ? threadMessages[threadMessages.length - 1]
          : null;

        return {
          id: chat.threadId,
          studentId: chat.studentId,
          studentName: student?.name || 'Unknown Student',
          parentId: chat.parentId,
          parentName: parent?.fullName || 'Parent',
          lastMessage: lastMessage?.content || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || chat.lastMessageTime,
          unreadCount: chat.unreadCount,
          isActive: chat.isActive,
        };
      });

      setChatThreads(enhancedThreads);
    } catch (error) {
      console.error('Error loading chat threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassOptions = () => {
    return [
      { id: 'class_1', name: 'Class 1A' },
      { id: 'class_2', name: 'Class 2B' },
      { id: 'class_3', name: 'Class 3C' },
    ];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleThreadPress = (thread: any) => {
    navigation.navigate('ChatThread', {
      threadId: thread.id,
      studentName: thread.studentName,
      parentName: thread.parentName,
    });
  };

  const handleCreateTaskMessage = () => {
    // TODO: Navigate to create task message
    console.debug('Create task message functionality will be implemented');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6FED" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>📚 Padmai</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {user?.fullName?.split(' ')[0]}!</Text>
              <TeacherHeaderRight onPress={() => setProfileModalVisible(true)} />
            </View>
          </View>
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherAvatar}>👩‍🏫</Text>
            <View style={styles.teacherDetails}>
              <Text style={styles.teacherName}>{user?.fullName}</Text>
              <Text style={styles.teacherRole}>Teacher</Text>
            </View>
          </View>
        </View>

        {/* Class Selector */}
        <View style={styles.classSelector}>
          <Text style={styles.selectorLabel}>Class:</Text>
          <View style={styles.classButtons}>
            {getClassOptions().map((classOption) => (
              <TouchableOpacity
                key={classOption.id}
                style={[
                  styles.classButton,
                  selectedClass === classOption.id && styles.selectedClassButton
                ]}
                onPress={() => setSelectedClass(classOption.id)}
              >
                <Text style={[
                  styles.classButtonText,
                  selectedClass === classOption.id && styles.selectedClassButtonText
                ]}>
                  {classOption.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleCreateTaskMessage}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Create Task Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📢</Text>
            <Text style={styles.quickActionText}>Send Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Threads */}
        <View style={styles.threadsSection}>
          <Text style={styles.sectionTitle}>
            Parent Conversations ({chatThreads.length})
          </Text>
          {chatThreads.length > 0 ? (
            chatThreads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadItem}
                onPress={() => handleThreadPress(thread)}
              >
                <View style={styles.threadAvatar}>
                  <Text style={styles.threadAvatarText}>
                    {thread.studentName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.threadContent}>
                  <View style={styles.threadHeader}>
                    <Text style={styles.studentName}>{thread.studentName}</Text>
                    <Text style={styles.messageTime}>{formatTime(thread.lastMessageTime)}</Text>
                  </View>
                  <Text style={styles.parentName}>with {thread.parentName}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {thread.lastMessage}
                  </Text>
                </View>
                {thread.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💬</Text>
              <Text style={styles.emptyStateTitle}>No Conversations</Text>
              <Text style={styles.emptyStateText}>
                Start a conversation with parents to discuss their child's progress.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📝</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Created Math assignment for Class 1A</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>💬</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Received message from Sarah's parent</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📅</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Added parent meeting to calendar</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
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
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B3D4FF',
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teacherAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  teacherRole: {
    fontSize: 14,
    color: '#B3D4FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  classSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  classButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedClassButton: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  classButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedClassButtonText: {
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  threadsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  threadItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  threadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  parentName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: '#2F6FED',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  activitySection: {
    marginBottom: 20,
  },
  activityItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default TeacherChatDirectory;
