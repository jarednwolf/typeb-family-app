/**
 * ChatScreen Component
 * Main chat interface with real-time updates and moderation features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';
import {
  ChatMessage,
  TypingIndicator,
  ChatRoom,
} from '../../types/chat';
import {
  subscribeToMessages,
  subscribeToTypingIndicators,
  getMessages,
  markMessageAsRead,
  deleteMessage,
  moderateMessage as moderateMessageService,
  reportMessage,
  createOrGetFamilyChatRoom,
  getChatRoom,
  getPendingMessages,
  sendSystemMessage,
} from '../../services/chat';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import * as Haptics from 'expo-haptics';

// Define navigation types
type RootStackParamList = {
  Chat: undefined;
  ImageViewer: { imageUrl: string };
  ModerationPanel: { chatId: string };
};

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  const familyMembers = useSelector((state: RootState) => state.family.members);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string>('');
  
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeMessages = useRef<(() => void) | null>(null);
  const unsubscribeTyping = useRef<(() => void) | null>(null);

  // Initialize chat room
  useEffect(() => {
    const initializeChatRoom = async () => {
      if (!family) return;
      
      setIsLoading(true);
      try {
        const room = await createOrGetFamilyChatRoom(
          family.id,
          family.name,
          family.parentIds
        );
        setChatRoom(room);
        
        // Load initial messages
        const initialMessages = await getMessages(room.id, 50);
        setMessages(initialMessages);
        
        // Mark messages as read
        initialMessages.forEach(msg => {
          if (userProfile && !msg.readBy?.[userProfile.id] && msg.senderId !== userProfile.id) {
            markMessageAsRead(msg.id, userProfile.id);
          }
        });
        
        // Load pending messages count for parents
        if (userProfile?.role === 'parent') {
          const pending = await getPendingMessages(room.id);
          setPendingCount(pending.length);
        }
      } catch (error) {
        console.error('Error initializing chat room:', error);
        Alert.alert('Error', 'Failed to load chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChatRoom();
  }, [family, userProfile]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatRoom) return;
    
    unsubscribeMessages.current = subscribeToMessages(
      chatRoom.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
        
        // Mark new messages as read
        updatedMessages.forEach(msg => {
          if (userProfile && !msg.readBy?.[userProfile.id] && msg.senderId !== userProfile.id) {
            markMessageAsRead(msg.id, userProfile.id);
          }
        });
        
        // Update pending count for parents
        if (userProfile?.role === 'parent') {
          const pending = updatedMessages.filter(m => m.moderationStatus === 'pending');
          setPendingCount(pending.length);
        }
      },
      (error) => {
        console.error('Error listening to messages:', error);
      }
    );
    
    return () => {
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
    };
  }, [chatRoom, userProfile]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!chatRoom) return;
    
    unsubscribeTyping.current = subscribeToTypingIndicators(
      chatRoom.id,
      (indicators) => {
        // Filter out current user
        const filtered = indicators.filter(i => i.userId !== userProfile?.id);
        setTypingUsers(filtered);
      }
    );
    
    return () => {
      if (unsubscribeTyping.current) {
        unsubscribeTyping.current();
      }
    };
  }, [chatRoom, userProfile]);

  const handleRefresh = useCallback(async () => {
    if (!chatRoom) return;
    
    setIsRefreshing(true);
    try {
      const refreshedMessages = await getMessages(chatRoom.id, 50);
      setMessages(refreshedMessages);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [chatRoom]);

  const handleLoadMore = useCallback(async () => {
    if (!chatRoom || messages.length === 0) return;
    
    try {
      // In production, implement pagination with lastMessage
      // const lastMessage = messages[messages.length - 1];
      // const olderMessages = await getMessages(chatRoom.id, 50, lastMessage);
      // setMessages([...messages, ...olderMessages]);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  }, [chatRoom, messages]);

  const handleMessageLongPress = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
    setSelectedMessage(null);
  }, []);

  const handleDelete = useCallback(async (message: ChatMessage) => {
    if (!userProfile) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(message.id, userProfile.id, userProfile.role);
              setSelectedMessage(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  }, [userProfile]);

  const handleModerate = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
    setShowModerationModal(true);
  }, []);

  const handleModerationAction = useCallback(async (approved: boolean, note?: string) => {
    if (!selectedMessage || !userProfile) return;
    
    try {
      await moderateMessageService(
        selectedMessage.id,
        userProfile.id,
        approved,
        note
      );
      
      // Send system message about moderation
      if (chatRoom) {
        await sendSystemMessage(
          chatRoom.id,
          family!.id,
          'moderation',
          { approved, moderatorName: userProfile.displayName },
          approved 
            ? `Message approved by ${userProfile.displayName}`
            : `Message removed by ${userProfile.displayName}`
        );
      }
      
      setShowModerationModal(false);
      setSelectedMessage(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to moderate message');
    }
  }, [selectedMessage, userProfile, chatRoom, family]);

  const handleReport = useCallback(async (message: ChatMessage) => {
    if (!userProfile) return;
    
    Alert.alert(
      'Report Message',
      'Why are you reporting this message?',
      [
        {
          text: 'Inappropriate',
          onPress: () => submitReport(message, 'inappropriate'),
        },
        {
          text: 'Bullying',
          onPress: () => submitReport(message, 'bullying'),
        },
        {
          text: 'Spam',
          onPress: () => submitReport(message, 'spam'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [userProfile]);

  const submitReport = async (
    message: ChatMessage,
    reason: 'inappropriate' | 'bullying' | 'spam'
  ) => {
    if (!userProfile) return;
    
    try {
      await reportMessage(
        message.id,
        userProfile.id,
        reason,
        `Reported by ${userProfile.displayName}`
      );
      Alert.alert('Reported', 'Thank you for helping keep our chat safe.');
    } catch (error) {
      Alert.alert('Error', 'Failed to report message');
    }
  };

  const handleImagePress = useCallback((imageUrl: string) => {
    setViewerImageUrl(imageUrl);
    setShowImageViewer(true);
  }, []);

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.senderId === userProfile?.id;
    const showSenderName = index === 0 || messages[index - 1]?.senderId !== item.senderId;
    
    return (
      <ChatBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderName={showSenderName}
        onLongPress={() => handleMessageLongPress(item)}
        onReplyPress={() => handleReply(item)}
        onImagePress={handleImagePress}
        onModeratePress={() => handleModerate(item)}
        onReportPress={() => handleReport(item)}
      />
    );
  }, [userProfile, messages, handleMessageLongPress, handleReply, handleImagePress, handleModerate, handleReport]);

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const typingText = typingUsers.length === 1
      ? `${typingUsers[0].userName} is typing...`
      : `${typingUsers.length} people are typing...`;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
        </View>
        <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
          {typingText}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {family?.name} Chat
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {familyMembers.length} members
        </Text>
      </View>
      
      {userProfile?.role === 'parent' && pendingCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ModerationPanel', { chatId: chatRoom!.id })}
          style={[styles.pendingBadge, { backgroundColor: theme.colors.warning }]}
        >
          <Text style={styles.pendingText}>{pendingCount}</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        onPress={() => Alert.alert('Chat Settings', 'Settings coming soon!')}
        style={styles.settingsButton}
      >
        <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chatRoom) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Chat unavailable
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderTypingIndicator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Start the conversation!
              </Text>
            </View>
          }
        />
        
        <ChatInput
          chatId={chatRoom.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(undefined)}
          disabled={false}
          allowVoice={chatRoom.allowVoiceMessages}
          allowImage={chatRoom.allowImages}
          onMessageSent={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        />
      </KeyboardAvoidingView>

      {/* Moderation Modal */}
      <Modal
        visible={showModerationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModerationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Moderate Message
            </Text>
            
            {selectedMessage && (
              <View style={[styles.messagePreview, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.previewSender, { color: theme.colors.textSecondary }]}>
                  {selectedMessage.senderName}
                </Text>
                <Text style={[styles.previewText, { color: theme.colors.textPrimary }]}>
                  {selectedMessage.text || 'Media message'}
                </Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => handleModerationAction(true)}
                style={[styles.approveButton, { backgroundColor: theme.colors.success }]}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleModerationAction(false, 'Inappropriate content')}
                style={[styles.rejectButton, { backgroundColor: theme.colors.error }]}
              >
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowModerationModal(false)}
                style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.cancelText, { color: theme.colors.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <TouchableOpacity
          style={styles.imageViewerOverlay}
          activeOpacity={1}
          onPress={() => setShowImageViewer(false)}
        >
          <Image
            source={{ uri: viewerImageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: spacing.XS,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.M,
  },
  headerTitle: {
    fontSize: typography.title3.fontSize,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: typography.caption1.fontSize,
    marginTop: 2,
  },
  settingsButton: {
    padding: spacing.XS,
  },
  pendingBadge: {
    paddingHorizontal: spacing.S,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginRight: spacing.S,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: typography.caption2.fontSize,
    fontWeight: '700',
  },
  messagesList: {
    paddingVertical: spacing.M,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    marginRight: spacing.S,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  typingText: {
    fontSize: typography.caption1.fontSize,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.M,
    fontSize: typography.subheadline.fontSize,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.XL,
  },
  errorText: {
    fontSize: typography.body.fontSize,
    marginTop: spacing.M,
    marginBottom: spacing.L,
    textAlign: 'center',
  },
  errorButton: {
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    borderRadius: borderRadius.medium,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.XXL,
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    marginTop: spacing.M,
    fontSize: typography.subheadline.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.L,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.large,
    padding: spacing.L,
  },
  modalTitle: {
    fontSize: typography.title3.fontSize,
    fontWeight: '700',
    marginBottom: spacing.M,
  },
  messagePreview: {
    padding: spacing.M,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.L,
  },
  previewSender: {
    fontSize: typography.caption1.fontSize,
    fontWeight: '600',
    marginBottom: spacing.XS,
  },
  previewText: {
    fontSize: typography.body.fontSize,
  },
  modalActions: {
    gap: spacing.S,
  },
  approveButton: {
    paddingVertical: spacing.M,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  rejectButton: {
    paddingVertical: spacing.M,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: spacing.M,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});