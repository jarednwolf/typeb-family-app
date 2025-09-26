/**
 * CommentThread Component
 * Displays a thread of comments with nested replies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { CommentThread as CommentThreadType, Comment } from '../../services/comments';
import { ReactionDisplay } from '../reactions/ReactionDisplay';
import { addCommentReaction, removeCommentReaction } from '../../services/comments';
import { ReactionType } from '../../services/reactions';

interface CommentThreadProps {
  thread: CommentThreadType;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'parent' | 'child';
  onReply: (parentCommentId: string, text: string) => Promise<void>;
  onEdit: (commentId: string, text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  allowReplies?: boolean;
  maxDepth?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  thread,
  currentUserId,
  currentUserName,
  currentUserRole,
  onReply,
  onEdit,
  onDelete,
  onReport,
  allowReplies = true,
  maxDepth = 2,
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState('');

  const handleReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    try {
      await onReply(parentCommentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add reply');
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await onEdit(commentId, editText);
      setEditText('');
      setEditingComment(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit comment');
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(commentId),
        },
      ]
    );
  };

  const handleReport = (commentId: string) => {
    if (!onReport) return;

    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate', onPress: () => onReport(commentId, 'inappropriate') },
        { text: 'Spam', onPress: () => onReport(commentId, 'spam') },
        { text: 'Other', onPress: () => onReport(commentId, 'other') },
      ]
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isAuthor = comment.userId === currentUserId;
    const canModerate = currentUserRole === 'parent';
    const isDeleted = !!comment.deletedAt;
    const isEditing = editingComment === comment.id;

    return (
      <View
        key={comment.id}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginLeft: isReply ? 32 : 0,
          backgroundColor: isReply ? '#F9FAFB' : '#FFFFFF',
        }}
      >
        {/* Comment Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          {/* User Avatar */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: comment.userRole === 'parent' ? '#3B82F6' : '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              {comment.userName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* User Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#1F2937',
                }}
              >
                {comment.userName}
              </Text>
              {comment.userRole === 'parent' && (
                <View
                  style={{
                    backgroundColor: '#3B82F6',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    marginLeft: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    PARENT
                  </Text>
                </View>
              )}
              {comment.edited && (
                <Text
                  style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginLeft: 6,
                  }}
                >
                  (edited)
                </Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </Text>
          </View>

          {/* Actions Menu */}
          {!isDeleted && (
            <TouchableOpacity
              onPress={() => {
                if (isAuthor) {
                  Alert.alert(
                    'Comment Options',
                    '',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Edit',
                        onPress: () => {
                          setEditText(comment.text);
                          setEditingComment(comment.id);
                        },
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDelete(comment.id),
                      },
                    ]
                  );
                } else if (canModerate) {
                  Alert.alert(
                    'Moderate Comment',
                    '',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDelete(comment.id),
                      },
                      {
                        text: 'Report',
                        onPress: () => handleReport(comment.id),
                      },
                    ]
                  );
                } else {
                  handleReport(comment.id);
                }
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Comment Content */}
        {isEditing ? (
          <View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 8,
                fontSize: 14,
                color: '#1F2937',
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="Edit your comment..."
              placeholderTextColor="#9CA3AF"
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setEditingComment(null);
                  setEditText('');
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleEdit(comment.id)}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 14,
              color: isDeleted ? '#9CA3AF' : '#374151',
              fontStyle: isDeleted ? 'italic' : 'normal',
              marginBottom: 8,
            }}
          >
            {comment.text}
          </Text>
        )}

        {/* Comment Actions */}
        {!isDeleted && !isEditing && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
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
              onAddReaction={async (reactionType) => {
                await addCommentReaction(
                  comment.id,
                  currentUserId,
                  currentUserName,
                  reactionType
                );
              }}
              onRemoveReaction={async () => {
                await removeCommentReaction(comment.id, currentUserId);
              }}
              contentId={comment.id}
              contentType="comment"
              size="small"
              compact
            />

            {/* Reply Button */}
            {allowReplies && comment.depth < maxDepth - 1 && (
              <TouchableOpacity
                onPress={() => setReplyingTo(comment.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 16,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                }}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
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

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              multiline
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 8,
                fontSize: 14,
                color: '#1F2937',
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder={`Reply to ${comment.userName}...`}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReply(comment.id)}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  Reply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      {/* Main Comment */}
      {renderComment(thread.comment)}

      {/* Replies */}
      {thread.replies.length > 0 && (
        <View>
          {thread.replies.map((reply) => renderComment(reply, true))}
        </View>
      )}
    </View>
  );
};

export default CommentThread;