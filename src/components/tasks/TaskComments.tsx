import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { selectFamily } from '../../store/slices/familySlice';
import {
  Comment,
  CommentThread,
  addComment,
  subscribeToComments,
  deleteComment,
  addCommentReaction,
  removeCommentReaction,
} from '../../services/comments';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { HapticFeedback } from '../../utils/haptics';

interface TaskCommentsProps {
  taskId: string;
  isModalVisible?: boolean;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, isModalVisible = true }) => {
  const { theme, isDarkMode } = useTheme();
  const user = useAppSelector(selectUser);
  const family = useAppSelector(selectFamily);
  
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId || !family?.id || !isModalVisible) return;

    setIsLoading(true);
    const unsubscribe = subscribeToComments(
      taskId,
      'task',
      (threads) => {
        setComments(threads);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load comments:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId, family?.id, isModalVisible]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || !family?.id) return;

    setIsSubmitting(true);
    HapticFeedback.impact.light();

    try {
      await addComment(
        taskId,
        'task',
        family.id,
        (user as any).uid,
        (user as any).displayName || 'Anonymous',
        (user as any).role || 'child',
        commentText.trim(),
        undefined,
        replyingTo?.id,
        (user as any).photoURL
      );

      setCommentText('');
      setReplyingTo(null);
      HapticFeedback.notification.success();
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      HapticFeedback.notification.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(
                comment.id,
                (user as any).uid,
                (user as any).role || 'child'
              );
              HapticFeedback.notification.success();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleReaction = async (comment: Comment, reactionType: string) => {
    if (!user) return;

    HapticFeedback.impact.light();
    
    try {
      const hasReacted = comment.reactions?.[(user as any).uid];
      
      if (hasReacted) {
        await removeCommentReaction(comment.id, (user as any).uid);
      } else {
        await addCommentReaction(
          comment.id,
          (user as any).uid,
          (user as any).displayName || 'Anonymous',
          reactionType,
          (user as any).photoURL
        );
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const renderComment = ({ item: thread }: { item: CommentThread }) => {
    const { comment } = thread;
    const isOwnComment = comment.userId === (user as any)?.uid;
    const hasReacted = comment.reactions?.[(user as any)?.uid || ''];
    const reactionCount = Object.keys(comment.reactions || {}).length;

    return (
      <View style={styles.commentContainer}>
        <View style={[
          styles.commentBubble,
          { backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background }
        ]}>
          <View style={styles.commentHeader}>
            <View style={styles.userInfo}>
              <View style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary + '20' }
              ]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {comment.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                  {comment.userName}
                </Text>
                <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </Text>
              </View>
            </View>
            
            {isOwnComment && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(comment)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="trash-2" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.commentText, { color: theme.colors.textPrimary }]}>
            {comment.text}
          </Text>

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={[
                styles.reactionButton,
                hasReacted && { backgroundColor: theme.colors.primary + '20' }
              ]}
              onPress={() => handleReaction(comment, 'like')}
            >
              <Text style={styles.reactionEmoji}>👍</Text>
              {reactionCount > 0 && (
                <Text style={[
                  styles.reactionCount,
                  { color: hasReacted ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {reactionCount}
                </Text>
              )}
            </TouchableOpacity>

            {comment.depth < 2 && (
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => setReplyingTo(comment)}
              >
                <Feather name="corner-up-left" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.replyText, { color: theme.colors.textSecondary }]}>
                  Reply
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {thread.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {thread.replies.map((reply) => (
              <View key={reply.id} style={styles.replyWrapper}>
                <View style={[styles.replyLine, { backgroundColor: theme.colors.separator }]} />
                <View style={[
                  styles.commentBubble,
                  styles.replyBubble,
                  { backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background }
                ]}>
                  <View style={styles.commentHeader}>
                    <View style={styles.userInfo}>
                      <View style={[
                        styles.avatar,
                        styles.replyAvatar,
                        { backgroundColor: theme.colors.primary + '20' }
                      ]}>
                        <Text style={[styles.avatarText, styles.replyAvatarText, { color: theme.colors.primary }]}>
                          {reply.userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.userName, styles.replyUserName, { color: theme.colors.textPrimary }]}>
                          {reply.userName}
                        </Text>
                        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                          {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.commentText, styles.replyText, { color: theme.colors.textPrimary }]}>
                    {reply.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.comment.id}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        }
      />

      {replyingTo && (
        <View style={[styles.replyingToContainer, { backgroundColor: theme.colors.primary + '10' }]}>
          <Text style={[styles.replyingToText, { color: theme.colors.textPrimary }]}>
            Replying to {replyingTo.userName}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Feather name="x" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
          borderTopColor: theme.colors.separator 
        }
      ]}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: isDarkMode ? theme.colors.background : theme.colors.inputBackground,
              color: theme.colors.textPrimary 
            }
          ]}
          placeholder={replyingTo ? `Reply to ${replyingTo.userName}...` : "Add a comment..."}
          placeholderTextColor={theme.colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: theme.colors.primary },
            (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    paddingVertical: spacing.M,
  },
  commentContainer: {
    marginBottom: spacing.M,
  },
  commentBubble: {
    marginHorizontal: spacing.M,
    padding: spacing.M,
    borderRadius: borderRadius.medium,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.S,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.M,
    marginTop: spacing.S,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XXS,
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XXS,
    borderRadius: borderRadius.round,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XXS,
  },
  replyText: {
    fontSize: 12,
  },
  repliesContainer: {
    marginLeft: spacing.L,
    marginTop: spacing.S,
  },
  replyWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.S,
  },
  replyLine: {
    width: 2,
    marginRight: spacing.S,
    marginLeft: spacing.M,
  },
  replyBubble: {
    flex: 1,
    marginRight: spacing.M,
  },
  replyAvatar: {
    width: 24,
    height: 24,
  },
  replyAvatarText: {
    fontSize: 12,
  },
  replyUserName: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.XXL * 2,
  },
  emptyText: {
    marginTop: spacing.M,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginRight: spacing.S,
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.round,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
  },
  replyingToText: {
    fontSize: 12,
  },
});

export default TaskComments;