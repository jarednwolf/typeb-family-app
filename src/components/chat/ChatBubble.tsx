/**
 * ChatBubble Component
 * Displays individual chat messages with reactions and moderation status
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ChatMessage, ModerationStatus } from '../../types/chat';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import ReactionDisplay from '../reactions/ReactionDisplay';
import ReactionPicker from '../reactions/ReactionPicker';
import { addMessageReaction, removeMessageReaction } from '../../services/chat';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

interface ChatBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  onLongPress?: () => void;
  onReplyPress?: () => void;
  onImagePress?: (imageUrl: string) => void;
  onModeratePress?: () => void;
  onReportPress?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderName = false,
  onLongPress,
  onReplyPress,
  onImagePress,
  onModeratePress,
  onReportPress,
}) => {
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate message appearance
    scaleAnim.setValue(0.9);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onLongPress) {
      onLongPress();
    } else {
      // Show context menu
      Alert.alert(
        'Message Options',
        '',
        [
          {
            text: 'React',
            onPress: () => setShowReactionPicker(true),
          },
          {
            text: 'Reply',
            onPress: onReplyPress,
          },
          ...(userProfile?.role === 'parent' && message.senderRole === 'child' ? [
            {
              text: 'Moderate',
              onPress: onModeratePress,
            },
          ] : []),
          ...(!isOwnMessage ? [
            {
              text: 'Report',
              onPress: onReportPress,
              style: 'destructive' as const,
            },
          ] : []),
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ],
      );
    }
  };

  const handleReaction = async (reactionType: any) => {
    if (!userProfile) return;

    try {
      const existingReaction = message.reactions?.[userProfile.id];
      
      if (existingReaction?.reactionType === reactionType) {
        // Remove reaction if same type
        await removeMessageReaction(message.id, userProfile.id);
      } else {
        // Add or update reaction
        await addMessageReaction(
          message.id,
          userProfile.id,
          userProfile.displayName,
          reactionType
        );
      }
      
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const playVoiceMessage = async () => {
    if (!message.voiceUrl) return;
    
    // For now, just toggle the playing state
    // Audio playback will need expo-av to be installed
    setIsPlayingVoice(!isPlayingVoice);
    
    if (!isPlayingVoice) {
      // Simulate voice playback progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        setVoiceProgress(progress);
        if (progress >= 1) {
          clearInterval(interval);
          setIsPlayingVoice(false);
          setVoiceProgress(0);
        }
      }, (message.voiceDuration || 10) * 100);
    } else {
      setVoiceProgress(0);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.text}
          </Text>
        );

      case 'voice':
        return (
          <TouchableOpacity
            style={styles.voiceContainer}
            onPress={playVoiceMessage}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPlayingVoice ? 'pause-circle' : 'play-circle'}
              size={32}
              color={isOwnMessage ? '#FFFFFF' : '#007AFF'}
            />
            <View style={styles.voiceInfo}>
              <View style={styles.voiceWaveform}>
                {/* Simplified waveform visualization */}
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.voiceBar,
                      {
                        height: 10 + Math.random() * 15,
                        backgroundColor: isOwnMessage ? '#FFFFFF80' : '#007AFF40',
                        opacity: i / 20 <= voiceProgress ? 1 : 0.3,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.voiceDuration,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}
              >
                {Math.floor(message.voiceDuration || 0)}s
              </Text>
            </View>
          </TouchableOpacity>
        );

      case 'image':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.imageUrl!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.thumbnailUrl || message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'system':
        return (
          <View style={styles.systemMessageContainer}>
            <Ionicons name="information-circle" size={16} color="#666666" />
            <Text style={styles.systemMessageText}>{message.text}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderModerationStatus = () => {
    if (message.type === 'system' || message.moderationStatus === 'approved') {
      return null;
    }

    const getStatusConfig = (status: ModerationStatus) => {
      switch (status) {
        case 'pending':
          return {
            icon: 'time-outline',
            color: '#FFA500',
            text: 'Pending Review',
          };
        case 'flagged':
          return {
            icon: 'warning-outline',
            color: '#FF6B6B',
            text: 'Flagged',
          };
        case 'removed':
          return {
            icon: 'close-circle-outline',
            color: '#FF0000',
            text: 'Removed',
          };
        default:
          return null;
      }
    };

    const config = getStatusConfig(message.moderationStatus);
    if (!config) return null;

    return (
      <View style={[styles.moderationBadge, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon as any} size={12} color={config.color} />
        <Text style={[styles.moderationText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <View style={styles.replyPreview}>
        <View style={styles.replyBar} />
        <View style={styles.replyContent}>
          <Text style={styles.replySender}>{message.replyTo.senderName}</Text>
          <Text style={styles.replyText} numberOfLines={1}>
            {message.replyTo.preview}
          </Text>
        </View>
      </View>
    );
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessage}>
        {renderMessageContent()}
      </View>
    );
  }

  const isModerated = message.moderationStatus === 'removed';
  const isPending = message.moderationStatus === 'pending' && userProfile?.role !== 'parent';

  return (
    <Animated.View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
      ]}
    >
      {showSenderName && !isOwnMessage && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}

      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        disabled={isModerated}
      >
        <View
          style={[
            styles.bubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isModerated && styles.moderatedBubble,
            isPending && styles.pendingBubble,
          ]}
        >
          {renderReplyPreview()}
          {renderModerationStatus()}
          
          {isModerated ? (
            <Text style={styles.moderatedText}>
              This message has been removed
            </Text>
          ) : isPending ? (
            <View style={styles.pendingContainer}>
              <ActivityIndicator size="small" color="#999" />
              <Text style={styles.pendingText}>Awaiting approval...</Text>
            </View>
          ) : (
            renderMessageContent()
          )}

          {message.status === 'failed' && (
            <View style={styles.failedBadge}>
              <Ionicons name="alert-circle" size={16} color="#FF0000" />
              <Text style={styles.failedText}>Failed to send</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>
          {format(new Date(message.createdAt), 'h:mm a')}
        </Text>
        
        {isOwnMessage && message.status === 'read' && (
          <Ionicons
            name="checkmark-done"
            size={14}
            color="#4CAF50"
            style={styles.readReceipt}
          />
        )}
      </View>

      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <View style={styles.reactionsContainer}>
          <ReactionDisplay
            contentType="comment"
            contentId={message.id}
            compact={true}
          />
        </View>
      )}

      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelect={handleReaction}
        selectedReaction={message.reactions?.[userProfile?.id || '']?.reactionType}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    marginLeft: 8,
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  moderatedBubble: {
    backgroundColor: '#FFE0E0',
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  voiceInfo: {
    flex: 1,
    marginLeft: 8,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    gap: 2,
  },
  voiceBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 12,
    marginTop: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  moderationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  moderationText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#007AFF40',
    marginRight: 8,
    borderRadius: 1.5,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#666666',
  },
  moderatedText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  failedText: {
    fontSize: 12,
    color: '#FF0000',
    marginLeft: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999999',
  },
  readReceipt: {
    marginLeft: 4,
  },
  reactionsContainer: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});