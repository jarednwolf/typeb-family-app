/**
 * MessageBubble Component
 * Displays a single chat message with reactions and reply support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ChatMessage } from '../../types/chat';
import { ReactionDisplay } from '../reactions/ReactionDisplay';
import { addMessageReaction, removeMessageReaction } from '../../services/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  currentUserId: string;
  onReply?: () => void;
  onUserPress?: () => void;
  onImagePress?: () => void;
  onLongPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  currentUserId,
  onReply,
  onUserPress,
  onImagePress,
  onLongPress,
}) => {
  const [imageError, setImageError] = useState(false);

  const getBubbleColor = () => {
    if (message.type === 'system') return '#F3F4F6';
    if (isOwnMessage) return '#3B82F6';
    return '#E5E7EB';
  };

  const getTextColor = () => {
    if (message.type === 'system') return '#6B7280';
    if (isOwnMessage) return '#FFFFFF';
    return '#1F2937';
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <View>
            {/* Reply Preview */}
            {message.replyTo && (
              <View
                style={{
                  backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                  borderLeftWidth: 2,
                  borderLeftColor: isOwnMessage ? '#93C5FD' : '#6B7280',
                  paddingLeft: 8,
                  paddingVertical: 4,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: isOwnMessage ? '#DBEAFE' : '#6B7280',
                    fontWeight: '500',
                  }}
                >
                  {message.replyTo.senderName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isOwnMessage ? '#E0E7FF' : '#9CA3AF',
                  }}
                  numberOfLines={1}
                >
                  {message.replyTo.preview}
                </Text>
              </View>
            )}
            
            {/* Message Text */}
            <Text
              style={{
                fontSize: 15,
                color: getTextColor(),
                lineHeight: 20,
              }}
            >
              {message.text}
            </Text>
          </View>
        );

      case 'image':
        return (
          <TouchableOpacity onPress={onImagePress} activeOpacity={0.9}>
            <Image
              source={{ uri: message.thumbnailUrl || message.imageUrl }}
              style={{
                width: MAX_BUBBLE_WIDTH - 16,
                height: 200,
                borderRadius: 8,
                backgroundColor: '#F3F4F6',
              }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            {imageError && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
                  Image failed to load
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );

      case 'system':
        return (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 13,
                color: '#6B7280',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {message.text}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (message.type === 'system') {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#F9FAFB',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          {renderMessageContent()}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <TouchableOpacity onPress={onUserPress} style={{ marginRight: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: message.senderRole === 'parent' ? '#3B82F6' : '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              {message.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      {!showAvatar && !isOwnMessage && <View style={{ width: 40 }} />}

      {/* Message Bubble */}
      <View style={{ maxWidth: MAX_BUBBLE_WIDTH }}>
        {/* Sender Name */}
        {!isOwnMessage && showAvatar && (
          <Text
            style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 2,
              marginLeft: 8,
            }}
          >
            {message.senderName}
          </Text>
        )}

        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={0.7}
          style={{
            backgroundColor: getBubbleColor(),
            borderRadius: 18,
            borderBottomLeftRadius: isOwnMessage ? 18 : 4,
            borderBottomRightRadius: isOwnMessage ? 4 : 18,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minWidth: 60,
          }}
        >
          {renderMessageContent()}

          {/* Message Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: isOwnMessage ? '#DBEAFE' : '#9CA3AF',
              }}
            >
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
            </Text>
            {isOwnMessage && (
              <>
                {message.editedAt && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#DBEAFE',
                      marginLeft: 4,
                    }}
                  >
                    • edited
                  </Text>
                )}
                <View style={{ marginLeft: 4 }}>
                  {message.status === 'sent' && (
                    <Ionicons name="checkmark" size={12} color="#DBEAFE" />
                  )}
                  {message.status === 'delivered' && (
                    <Ionicons name="checkmark-done" size={12} color="#DBEAFE" />
                  )}
                  {message.status === 'read' && (
                    <Ionicons name="checkmark-done" size={12} color="#10B981" />
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View
            style={{
              marginTop: 4,
              alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
          >
            <ReactionDisplay
              reactions={message.reactions as any}
              currentUserId={currentUserId}
              onAddReaction={async (reactionType) => {
                await addMessageReaction(
                  message.id,
                  currentUserId,
                  message.senderName,
                  reactionType
                );
              }}
              onRemoveReaction={async () => {
                await removeMessageReaction(message.id, currentUserId);
              }}
              contentId={message.id}
              contentType="message"
              size="small"
              compact
            />
          </View>
        )}

        {/* Action Buttons */}
        {!isOwnMessage && onReply && (
          <TouchableOpacity
            onPress={onReply}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              marginLeft: 8,
            }}
          >
            <Ionicons name="arrow-undo-outline" size={14} color="#6B7280" />
            <Text
              style={{
                fontSize: 12,
                color: '#6B7280',
                marginLeft: 4,
              }}
            >
              Reply
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MessageBubble;