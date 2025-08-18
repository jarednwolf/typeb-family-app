/**
 * Chat Preview Component
 * Shows recent chat messages preview on dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
// import { Message } from '../types/chat'; // Will be imported when chat types are available
import { useSelector } from 'react-redux';
import { selectFamily, selectFamilyMembers } from '../../store/slices/familySlice';
import { selectUserProfile } from '../../store/slices/authSlice';

interface ChatPreviewProps {
  onOpenChat?: () => void;
  maxMessages?: number;
}

// Mock Message type until we have the real one
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'system';
}

const ChatPreview: React.FC<ChatPreviewProps> = ({
  onOpenChat,
  maxMessages = 3,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);
  const currentUser = useSelector(selectUserProfile);

  useEffect(() => {
    loadRecentMessages();
  }, [family]);

  const loadRecentMessages = async () => {
    if (!family?.id) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual chat service call
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          senderId: 'user1',
          senderName: 'Mom',
          content: 'Great job on your tasks today! 🎉',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          isRead: false,
          type: 'text',
        },
        {
          id: '2',
          senderId: 'user2',
          senderName: 'Dad',
          content: 'Who wants pizza for dinner?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isRead: true,
          type: 'text',
        },
        {
          id: '3',
          senderId: 'user3',
          senderName: 'Emma',
          content: 'I finished my homework!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isRead: true,
          type: 'text',
        },
      ];
      
      setMessages(mockMessages.slice(0, maxMessages));
      setUnreadCount(mockMessages.filter(m => !m.isRead).length);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageTime = (timestamp: Date): string => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return format(messageDate, 'MMM d');
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUser?.id;
    
    return (
      <View key={message.id} style={styles.messageItem}>
        {!isOwnMessage && message.senderAvatar ? (
          <Image source={{ uri: message.senderAvatar }} style={styles.avatar} />
        ) : !isOwnMessage ? (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {message.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : null}
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>
              {isOwnMessage ? 'You' : message.senderName}
            </Text>
            <Text style={styles.messageTime}>
              {formatMessageTime(message.timestamp)}
            </Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {message.content}
          </Text>
        </View>
        
        {!message.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onOpenChat}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Icon name="message-square" size={18} color={colors.primary} />
          <Text style={styles.title}>Family Chat</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={16} color={colors.gray400} />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <TouchableOpacity 
          style={styles.emptyContainer}
          onPress={onOpenChat}
        >
          <Icon name="message-circle" size={24} color={colors.gray300} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation!</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.messagesList}>
          {messages.map(renderMessage)}
        </View>
      )}

      {messages.length > 0 && (
        <TouchableOpacity 
          style={styles.footer}
          onPress={onOpenChat}
        >
          <View style={styles.inputPlaceholder}>
            <Icon name="edit-3" size={14} color={colors.gray400} />
            <Text style={styles.inputPlaceholderText}>Type a message...</Text>
          </View>
          <View style={styles.sendButton}>
            <Icon name="send" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 11,
  },
  messagesList: {
    paddingVertical: spacing.xs,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.captionSemibold,
    color: colors.primary,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    ...typography.captionSemibold,
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    color: colors.gray400,
    fontSize: 11,
  },
  messageText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info,
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  inputPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputPlaceholderText: {
    ...typography.caption,
    color: colors.gray400,
    marginLeft: spacing.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySemibold,
    color: colors.gray700,
    marginTop: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
  },
});

export default ChatPreview;