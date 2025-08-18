/**
 * CommentCard Component
 * Displays a single comment in a card format
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '../../services/comments';
import { ReactionDisplay } from '../reactions/ReactionDisplay';
import { addCommentReaction, removeCommentReaction } from '../../services/comments';
import { ReactionType } from '../../services/reactions';

interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  currentUserName: string;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  currentUserName,
  onReply,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const isAuthor = comment.userId === currentUserId;
  const isDeleted = !!comment.deletedAt;

  const handleAddReaction = async (reactionType: ReactionType) => {
    await addCommentReaction(
      comment.id,
      currentUserId,
      currentUserName,
      reactionType
    );
  };

  const handleRemoveReaction = async () => {
    await removeCommentReaction(comment.id, currentUserId);
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: compact ? 12 : 16,
        marginVertical: compact ? 4 : 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: compact ? 6 : 8,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            borderRadius: compact ? 14 : 18,
            backgroundColor: comment.userRole === 'parent' ? '#3B82F6' : '#10B981',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: compact ? 8 : 10,
          }}
        >
          <Text
            style={{
              fontSize: compact ? 12 : 14,
              fontWeight: '600',
              color: '#FFFFFF',
            }}
          >
            {comment.userName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* User Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text
              style={{
                fontSize: compact ? 13 : 14,
                fontWeight: '600',
                color: '#1F2937',
              }}
            >
              {comment.userName}
            </Text>
            {comment.userRole === 'parent' && (
              <View
                style={{
                  backgroundColor: '#EBF5FF',
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  marginLeft: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#3B82F6',
                  }}
                >
                  PARENT
                </Text>
              </View>
            )}
            {comment.edited && !compact && (
              <Text
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  marginLeft: 6,
                  fontStyle: 'italic',
                }}
              >
                (edited)
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: compact ? 11 : 12,
              color: '#6B7280',
              marginTop: 2,
            }}
          >
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </Text>
        </View>

        {/* Action Menu */}
        {showActions && !isDeleted && (
          <TouchableOpacity
            onPress={() => {
              // Show action menu
              if (isAuthor && onEdit && onDelete) {
                // Show edit/delete options
              } else if (onDelete) {
                // Show delete/report options
              }
            }}
            style={{
              padding: 4,
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment Text */}
      <Text
        style={{
          fontSize: compact ? 13 : 14,
          color: isDeleted ? '#9CA3AF' : '#374151',
          fontStyle: isDeleted ? 'italic' : 'normal',
          lineHeight: compact ? 18 : 20,
          marginBottom: compact ? 8 : 12,
        }}
      >
        {comment.text}
      </Text>

      {/* Footer Actions */}
      {!isDeleted && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Reactions */}
          <ReactionDisplay
            reactions={comment.reactions as Record<string, {
              userId: string;
              userName: string;
              reactionType: ReactionType;
              timestamp: number;
            }> | undefined}
            currentUserId={currentUserId}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            contentId={comment.id}
            contentType="comment"
            size="small"
            compact
          />

          {/* Reply Count */}
          {comment.replyCount && comment.replyCount > 0 && (
            <TouchableOpacity
              onPress={onReply}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
              <Text
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  marginLeft: 4,
                }}
              >
                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Reply Button */}
          {onReply && (!comment.replyCount || comment.replyCount === 0) && !compact && (
            <TouchableOpacity
              onPress={onReply}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
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
      )}
    </View>
  );
};

export default CommentCard;