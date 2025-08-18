/**
 * ChatInterface Component
 * Main chat interface with messages, input, and real-time updates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToMessages,
  sendMessage,
  markMessageAsRead,
  subscribeToTypingIndicators,
  updateTypingIndicator,
} from '../../services/chat';
import type { ChatMessage } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { VoiceMessage } from './VoiceMessage';

interface ChatInterfaceProps {
  chatId: string;
  familyId: string;
  familyName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'parent' | 'child';
  familyMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'parent' | 'child';
    isOnline?: boolean;
  }>;
  onBack?: () => void;
  onMemberPress?: (memberId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatId,
  familyId,
  familyName,
  currentUserId,
  currentUserName,
  currentUserRole,
  familyMembers,
  onBack,
  onMemberPress,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeMessages = useRef<(() => void) | null>(null);
  const unsubscribeTyping = useRef<(() => void) | null>(null);

  // Subscribe to messages
  useEffect(() => {
    setIsLoading(true);
    
    unsubscribeMessages.current = subscribeToMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
        
        // Mark messages as read
        newMessages.forEach((msg) => {
          if (msg.senderId !== currentUserId && !msg.readBy?.[currentUserId]) {
            markMessageAsRead(msg.id, currentUserId);
          }
        });
      },
      (error) => {
        console.error('Error loading messages:', error);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
    };
  }, [chatId, currentUserId]);

  // Subscribe to typing indicators
  useEffect(() => {
    unsubscribeTyping.current = subscribeToTypingIndicators(
      chatId,
      (indicators) => {
        const otherTypingUsers = indicators
          .filter((ind) => ind.userId !== currentUserId)
          .map((ind) => ({ userId: ind.userId, userName: ind.userName }));
        setTypingUsers(otherTypingUsers);
      }
    );

    return () => {
      if (unsubscribeTyping.current) {
        unsubscribeTyping.current();
      }
    };
  }, [chatId, currentUserId]);

  // Handle typing indicator
  const handleTypingChange = useCallback((text: string) => {
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingIndicator(chatId, currentUserId, currentUserName, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator(chatId, currentUserId, currentUserName, false);
    }, 3000);
  }, [chatId, currentUserId, currentUserName, isTyping]);

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    setIsTyping(false);
    updateTypingIndicator(chatId, currentUserId, currentUserName, false);

    try {
      await sendMessage(
        chatId,
        currentUserId,
        currentUserName,
        currentUserRole,
        text,
        undefined, // avatar
        replyingTo || undefined
      );
      
      setReplyingTo(null);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Refresh messages
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Messages will auto-refresh via subscription
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const showAvatar = index === messages.length - 1 || 
      messages[index + 1]?.senderId !== item.senderId;

    if (item.type === 'voice') {
      return (
        <VoiceMessage
          message={item}
          isOwnMessage={isOwnMessage}
          showAvatar={showAvatar}
          currentUserId={currentUserId}
        />
      );
    }

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        currentUserId={currentUserId}
        onReply={() => setReplyingTo(item)}
        onUserPress={() => onMemberPress?.(item.senderId)}
      />
    );
  };

  // Key extractor
  const keyExtractor = (item: ChatMessage) => item.id;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <ChatHeader
        familyName={familyName}
        onlineCount={familyMembers.filter(m => m.isOnline).length}
        totalCount={familyMembers.length}
        onBack={onBack}
        onMembersPress={() => {
          // Show members modal
        }}
      />

      {/* Messages List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={{
              paddingVertical: 16,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#3B82F6"
              />
            }
            ListEmptyComponent={
              <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                transform: [{ scaleY: -1 }],
              }}>
                <Text style={{ fontSize: 16, color: '#6B7280' }}>
                  No messages yet
                </Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>
                  Start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <View
            style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Replying to {replyingTo.senderName}
                </Text>
                <Text
                  style={{ fontSize: 13, color: '#374151', marginTop: 2 }}
                  numberOfLines={1}
                >
                  {replyingTo.text || 'Media message'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
          disabled={isSending}
          placeholder={
            typingUsers.length > 0
              ? `${typingUsers[0].userName} is typing...`
              : 'Type a message...'
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatInterface;