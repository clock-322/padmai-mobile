import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import { useModal } from '../../contexts/ModalContext';
import ProfileIcon from '../../components/ProfileIcon';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'teacher' | 'admin';
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'message' | 'task' | 'announcement';
  taskId?: string;
}

interface ChatThread {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
}

const ChatScreen = () => {
  const { user } = useAuth();
  const { students, events, chats, chatMessages, users } = useData();
  const { showAlert, showError, showSuccess } = useModal();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChatData();
  }, []);

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading delay
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Resolve effective parent id from fixtures when Redux user id doesn't match JSON
      let effectiveParentId: string | undefined = user?.id;
      const hasChatsForUser = chats.some(c => c.parentId === effectiveParentId);
      if (!hasChatsForUser) {
        const matchedParent = users.find(
          u => u.email === (user as any)?.email || u.fullName === (user as any)?.name || u.fullName === (user as any)?.fullName
        );
        if (matchedParent) {
          effectiveParentId = matchedParent.id;
        }
      }
      if (!chats.some(c => c.parentId === effectiveParentId)) {
        effectiveParentId = chats[0]?.parentId; // final fallback to demo data
      }

      // Resolve a child for UI copy/fallbacks
      const childFromUser = students.find(s => (user as any)?.childId && s.id === (user as any)?.childId);
      const childFromChats = students.find(s => chats.find(c => c.parentId === effectiveParentId && c.studentId === s.id));
      const child = childFromUser || childFromChats || students[0];

      // Get actual chat threads from data
      const parentChats = chats.filter(chat => chat.parentId === effectiveParentId);
      
      // Enhance with teacher and student info
      const enhancedThreads = parentChats.map(chat => {
        const teacher = users.find(u => u.id === chat.teacherId);
        const student = students.find(s => s.id === chat.studentId);
        
        // Get last message for this thread
        const threadMessages = chatMessages.filter(msg => msg.threadId === chat.threadId);
        const lastMessage = threadMessages.length > 0 
          ? threadMessages[threadMessages.length - 1]
          : null;

        return {
          id: chat.threadId,
          title: `${teacher?.fullName || 'Teacher'} - ${student?.name || 'Student'}`,
          participants: [chat.parentId, chat.teacherId],
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            senderName: lastMessage.senderName,
            senderRole: lastMessage.senderRole,
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            isRead: lastMessage.isRead,
            type: lastMessage.type,
          } : undefined,
          unreadCount: chat.unreadCount,
          isActive: chat.isActive,
        };
      });

      // Mock messages for active thread
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 'teacher-1',
          senderName: 'Ms. Johnson',
          senderRole: 'teacher',
          content: `Hello! ${child.name} had a wonderful day today. They participated actively in all activities.`,
          timestamp: '2024-01-20T10:30:00Z',
          isRead: true,
          type: 'message',
        },
        {
          id: 'msg-2',
          senderId: user?.id || '',
          senderName: ((user as any)?.fullName || (user as any)?.name || ''),
          senderRole: 'parent',
          content: 'Thank you for the update! That\'s great to hear.',
          timestamp: '2024-01-20T10:35:00Z',
          isRead: true,
          type: 'message',
        },
        {
          id: 'msg-3',
          senderId: 'teacher-1',
          senderName: 'Ms. Johnson',
          senderRole: 'teacher',
          content: 'I\'ve assigned a new math homework for tomorrow.',
          timestamp: '2024-01-20T11:00:00Z',
          isRead: true,
          type: 'task',
          taskId: 'task-1',
        },
        {
          id: 'msg-4',
          senderId: 'teacher-1',
          senderName: 'Ms. Johnson',
          senderRole: 'teacher',
          content: 'Please ensure they complete pages 45-50 in their workbook.',
          timestamp: '2024-01-20T11:01:00Z',
          isRead: false,
          type: 'message',
        },
      ];

      setChatThreads(enhancedThreads);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent':
        return '#28A745';
      case 'teacher':
        return '#2F6FED';
      case 'admin':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent':
        return '👨‍👩‍👧‍👦';
      case 'teacher':
        return '👩‍🏫';
      case 'admin':
        return '🏫';
      default:
        return '👤';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📝';
      case 'announcement':
        return '📢';
      default:
        return '💬';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeThread || !user) return;

    try {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: user.fullName,
        senderRole: 'parent',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'message',
      };

      // Add to local state immediately for instant UI update
      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      // TODO: Save to actual data store/API
      console.debug('Sending message:', newMessage);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleThreadSelect = (threadId: string) => {
    setActiveThread(threadId);
    // Mark messages as read
    setChatThreads(prev =>
      prev.map(thread =>
        thread.id === threadId ? { ...thread, unreadCount: 0, isActive: true } : { ...thread, isActive: false }
      )
    );

    // Load actual messages for this thread
    const threadMessages = chatMessages.filter(msg => msg.threadId === threadId);
    const sortedMessages = threadMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    setMessages(sortedMessages);
  };

  const handleViewTask = (taskId: string) => {
    showAlert('Task Details', `Viewing task: ${taskId}`, () => {
      showSuccess('Navigation', 'Opening Calendar...');
    });
  };

  const handleNewChat = () => {
    showAlert('New Chat', 'Starting a new conversation with school staff...');
  };

  const renderChatList = () => (
    <View style={styles.chatListContainer}>
      <View style={styles.chatListHeader}>
        <Text style={styles.chatListTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {chatThreads.map((thread) => (
        <TouchableOpacity
          key={thread.id}
          style={[
            styles.chatThreadItem,
            thread.isActive && styles.activeChatThread,
          ]}
          onPress={() => handleThreadSelect(thread.id)}
        >
          <View style={styles.threadInfo}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            {thread.lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {thread.lastMessage.content}
              </Text>
            )}
          </View>
          <View style={styles.threadMeta}>
            {thread.lastMessage && (
              <Text style={styles.lastMessageTime}>
                {formatTime(thread.lastMessage.timestamp)}
              </Text>
            )}
            {thread.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChatMessages = () => {
    if (!activeThread) {
      return (
        <View style={styles.emptyChatContainer}>
          <Text style={styles.emptyChatIcon}>💬</Text>
          <Text style={styles.emptyChatTitle}>Select a Chat</Text>
          <Text style={styles.emptyChatSubtitle}>
            Choose a conversation from the list to start messaging.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>
            {chatThreads.find(thread => thread.id === activeThread)?.title}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveThread(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.senderId === user?.id && styles.ownMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{msg.senderName}</Text>
                <Text style={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
              
              {msg.type === 'task' ? (
                <View style={styles.taskMessage}>
                  <Text style={styles.taskIcon}>📝</Text>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>New Assignment</Text>
                    <Text style={styles.messageContent}>{msg.content}</Text>
                    <TouchableOpacity
                      style={styles.viewTaskButton}
                      onPress={() => handleViewTask(msg.taskId || '')}
                    >
                      <Text style={styles.viewTaskButtonText}>View Task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.messageContent}>{msg.content}</Text>
              )}
              
              <View style={styles.messageFooter}>
                <Text style={styles.messageTypeIcon}>
                  {getMessageTypeIcon(msg.type)}
                </Text>
                <View style={styles.messageRole}>
                  <Text style={styles.roleIcon}>
                    {getRoleIcon(msg.senderRole)}
                  </Text>
                  <Text
                    style={[
                      styles.roleText,
                      { color: getRoleColor(msg.senderRole) },
                    ]}
                  >
                    {msg.senderRole}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.messageInputContainer}
        >
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6FED" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.content}>
        {!activeThread ? renderChatList() : renderChatMessages()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  content: {
    flex: 1,
  },
  chatListContainer: {
    flex: 1,
    padding: 20,
  },
  chatListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chatListTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatThreadItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeChatThread: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2F6FED',
  },
  threadInfo: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  threadMeta: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2F6FED',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  taskMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F6FED',
    marginBottom: 4,
  },
  viewTaskButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewTaskButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTypeIcon: {
    fontSize: 12,
  },
  messageRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageInputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2F6FED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;