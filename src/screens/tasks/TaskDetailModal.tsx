import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PhotoUpload from '../../components/tasks/PhotoUpload';
import { spacing, borderRadius } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { updateTask, deleteTask, completeTask } from '../../store/slices/tasksSlice';
import { selectFamilyMembers } from '../../store/slices/familySlice';
import { Task, TaskPriority } from '../../types/models';
import { useTheme } from '../../contexts/ThemeContext';
import { useTaskReactions } from '../../hooks/useTaskReactions';
import EmojiReactionPicker from '../../components/reactions/EmojiReactionPicker';
import TaskReactionDisplay from '../../components/reactions/TaskReactionDisplay';
import TaskComments from '../../components/tasks/TaskComments';

// Task type that can handle both serialized (string dates) and non-serialized (Date objects)
interface FlexibleTask {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  category: any;
  assignedTo: string;
  assignedBy: string;
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string | Date;
  completedBy?: string;
  requiresPhoto: boolean;
  photoUrl?: string;
  photoValidatedBy?: string;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  validationNotes?: string;
  dueDate?: string | Date;
  isRecurring: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  lastReminderSent?: string | Date;
  escalationLevel: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
  commentCount?: number;
}

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: FlexibleTask | null;
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#F44336' },
  { value: 'high', label: 'High', color: '#FF9800' },
  { value: 'medium', label: 'Medium', color: '#FFC107' },
  { value: 'low', label: 'Low', color: '#4CAF50' },
];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ visible, onClose, task }) => {
  const dispatch = useDispatch<AppDispatch>();
  const familyMembers = useSelector(selectFamilyMembers);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const isParent = userProfile?.role === 'parent';
  const { theme, isDarkMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [points, setPoints] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionAnchorPosition, setReactionAnchorPosition] = useState<{ x: number; y: number } | undefined>();
  const [showComments, setShowComments] = useState(false);
  
  // Reactions hook
  const {
    reactions,
    addReaction,
    removeReaction,
    hasUserReacted,
    isLoading: reactionsLoading,
  } = useTaskReactions(task?.id || '');

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setAssignedTo(task.assignedTo);
      setPoints(task.points?.toString() || '10');
      setIsEditing(false);
    }
  }, [task]);

  const handleSave = useCallback(async () => {
    if (!task) return;

    setIsSubmitting(true);
    try {
      await dispatch(updateTask({
        taskId: task.id,
        userId: userProfile?.id || '',
        updates: {
          title: title.trim(),
          description: description.trim(),
          priority,
          assignedTo,
          points: parseInt(points, 10),
        },
      })).unwrap();
      
      setIsEditing(false);
      Alert.alert('Success', 'Task updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [task, title, description, priority, assignedTo, points, dispatch]);

  const handleComplete = useCallback(async (photoUrl?: string) => {
    if (!task) return;

    // If task requires photo but none provided, show upload modal
    if (task.requiresPhoto && !photoUrl && !showPhotoUpload) {
      setShowPhotoUpload(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(completeTask({
        taskId: task.id,
        userId: userProfile?.id || '',
        photoUrl,
      })).unwrap();
      
      Alert.alert('Success', 'Task marked as complete!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowPhotoUpload(false);
    }
  }, [task, userProfile, dispatch, onClose, showPhotoUpload]);

  const handlePhotoUploaded = useCallback((photoUrl: string) => {
    handleComplete(photoUrl);
  }, [handleComplete]);

  const handleDelete = useCallback(async () => {
    if (!task) return;

    setIsSubmitting(true);
    try {
      await dispatch(deleteTask({
        taskId: task.id,
        userId: userProfile?.id || '',
      })).unwrap();
      Alert.alert('Success', 'Task deleted successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }, [task, dispatch, onClose]);

  if (!task) return null;

  const assignedMember = familyMembers.find(m => m.id === task.assignedTo);
  const createdByMember = familyMembers.find(m => m.id === task.createdBy);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Task Details'}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        testID="task-detail-modal"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              task.status === 'completed' && styles.statusCompleted,
              task.status === 'in_progress' && styles.statusInProgress,
            ]}>
              <Text style={styles.statusText}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {task.points && (
              <View style={styles.pointsBadge}>
                <Feather name="star" size={16} color={isDarkMode ? '#FFD700' : theme.colors.warning} />
                <Text style={styles.pointsText}>{task.points} pts</Text>
              </View>
            )}
          </View>

          {/* Title */}
          {isEditing ? (
            <View style={styles.section}>
              <Input
                label="Task Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                testID="task-title-input"
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.title}>{task.title}</Text>
            </View>
          )}

          {/* Description */}
          {isEditing ? (
            <View style={styles.section}>
              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Add more details..."
                multiline
                numberOfLines={3}
                testID="task-description-input"
              />
            </View>
          ) : task.description ? (
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          ) : null}

          {/* Priority */}
          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            {isEditing ? (
              <View style={styles.priorityContainer}>
                {priorities.map((pri) => (
                  <TouchableOpacity
                    key={pri.value}
                    style={[
                      styles.priorityChip,
                      priority === pri.value && styles.priorityChipActive,
                      { borderColor: priority === pri.value ? pri.color : theme.colors.separator },
                    ]}
                    onPress={() => setPriority(pri.value)}
                    testID={`priority-${pri.value}`}
                  >
                    <Text
                      style={[
                        styles.priorityLabel,
                        priority === pri.value && { color: pri.color },
                      ]}
                    >
                      {pri.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[
                styles.priorityDisplay,
                { backgroundColor: priorities.find(p => p.value === task.priority)?.color + '20' },
              ]}>
                <Text style={[
                  styles.priorityDisplayText,
                  { color: priorities.find(p => p.value === task.priority)?.color },
                ]}>
                  {priorities.find(p => p.value === task.priority)?.label}
                </Text>
              </View>
            )}
          </View>

          {/* Assigned To */}
          <View style={styles.section}>
            <Text style={styles.label}>Assigned To</Text>
            {isEditing ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.memberScroll}
              >
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberChip,
                      assignedTo === member.id && styles.memberChipActive,
                    ]}
                    onPress={() => setAssignedTo(member.id)}
                    testID={`member-${member.id}`}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {member.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.memberName,
                        assignedTo === member.id && styles.memberNameActive,
                      ]}
                    >
                      {member.displayName || 'Unknown'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.assignedDisplay}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {assignedMember?.displayName?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.assignedName}>
                  {assignedMember?.displayName || 'Unknown'}
                </Text>
              </View>
            )}
          </View>

          {/* Due Date */}
          {task.dueDate && (
            <View style={styles.section}>
              <Text style={styles.label}>Due Date</Text>
              <View style={styles.dateDisplay}>
                <Feather name="calendar" size={20} color={theme.colors.textTertiary} />
                <Text style={styles.dateText}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Points (editable) */}
          {isEditing && (
            <View style={styles.section}>
              <Input
                label="Points"
                value={points}
                onChangeText={setPoints}
                placeholder="10"
                keyboardType="numeric"
                testID="points-input"
              />
            </View>
          )}

          {/* Photo Validation */}
          {task.requiresPhoto && (
            <View style={styles.section}>
              <Text style={styles.label}>Photo Validation</Text>
              {task.photoUrl ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: task.photoUrl }} style={styles.photo} />
                  {task.validationStatus && (
                    <View style={[
                      styles.validationBadge,
                      task.validationStatus === 'approved' && styles.validationApproved,
                      task.validationStatus === 'rejected' && styles.validationRejected,
                    ]}>
                      <Text style={styles.validationText}>
                        {task.validationStatus.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.photoRequired}>Photo required for completion</Text>
              )}
            </View>
          )}

          {/* Reactions Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Reactions</Text>
            <TaskReactionDisplay
              reactions={reactions}
              onAddReaction={() => {
                // Get position for picker
                setReactionAnchorPosition({ x: 100, y: 300 });
                setShowReactionPicker(true);
              }}
              onRemoveReaction={removeReaction}
              showAddButton={task.status !== 'completed'}
            />
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.commentsHeader}
              onPress={() => setShowComments(!showComments)}
            >
              <View style={styles.commentsHeaderLeft}>
                <Text style={styles.label}>Comments</Text>
                <View style={[styles.commentBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={[styles.commentBadgeText, { color: theme.colors.primary }]}>
                    {task.commentCount || 0}
                  </Text>
                </View>
              </View>
              <Feather
                name={showComments ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            
            {showComments && (
              <View style={styles.commentsContainer}>
                <TaskComments taskId={task.id} isModalVisible={visible} />
              </View>
            )}
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Created by {createdByMember?.displayName || 'Unknown'}
            </Text>
            <Text style={styles.metadataText}>
              {new Date(task.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isEditing ? (
              <>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setTitle(task.title);
                    setDescription(task.description || '');
                    setPriority(task.priority);
                    setAssignedTo(task.assignedTo);
                    setPoints(task.points?.toString() || '10');
                    setIsEditing(false);
                  }}
                  style={styles.actionButton}
                  disabled={isSubmitting}
                  testID="cancel-button"
                />
                <Button
                  title={isSubmitting ? 'Saving...' : 'Save Changes'}
                  onPress={handleSave}
                  style={styles.actionButton}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  testID="save-button"
                />
              </>
            ) : (
              <>
                {task.status !== 'completed' && (
                  <>
                    {(isParent || task.assignedTo === userProfile?.id) && (
                      <Button
                        title="Edit"
                        variant="secondary"
                        onPress={() => setIsEditing(true)}
                        style={styles.actionButton}
                        testID="edit-task-button"
                      />
                    )}
                    {task.assignedTo === userProfile?.id && (
                      <Button
                        title={task.requiresPhoto ? "Complete with Photo" : "Complete"}
                        onPress={() => handleComplete()}
                        style={styles.actionButton}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        testID="complete-task-button"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </View>

          {/* Delete Button (for parents only) */}
          {isParent && !isEditing && (
            <View style={styles.dangerZone}>
              {showDeleteConfirm ? (
                <View style={styles.deleteConfirm}>
                  <Text style={styles.deleteConfirmText}>
                    Are you sure you want to delete this task?
                  </Text>
                  <View style={styles.deleteConfirmButtons}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setShowDeleteConfirm(false)}
                      style={styles.deleteConfirmButton}
                    />
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={handleDelete}
                      style={styles.deleteConfirmButton}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setShowDeleteConfirm(true)}
                  testID="delete-task-button"
                >
                  <Feather name="trash-2" size={20} color={theme.colors.error} />
                  <Text style={styles.deleteButtonText}>Delete Task</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Photo Upload Modal */}
          {showPhotoUpload && task && (
            <Modal
              visible={showPhotoUpload}
              onClose={() => setShowPhotoUpload(false)}
              title="Complete Task with Photo"
            >
              <PhotoUpload
                taskId={task.id}
                onPhotoUploaded={handlePhotoUploaded}
                onCancel={() => setShowPhotoUpload(false)}
                required={task.requiresPhoto}
              />
            </Modal>
          )}

          {/* Emoji Reaction Picker */}
          <EmojiReactionPicker
            visible={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onSelect={async (emoji) => {
              if (!hasUserReacted(emoji)) {
                await addReaction(emoji);
              }
              setShowReactionPicker(false);
            }}
            anchorPosition={reactionAnchorPosition}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.XL,
  },
  section: {
    marginBottom: spacing.L,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.L,
  },
  statusBadge: {
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.round,
    backgroundColor: theme.colors.textTertiary,
  },
  statusCompleted: {
    backgroundColor: theme.colors.success,
  },
  statusInProgress: {
    backgroundColor: theme.colors.info,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.background : theme.colors.surface,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XXS,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? '#FFD700' : theme.colors.warning,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.S,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.S,
  },
  priorityChip: {
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
  },
  priorityChipActive: {
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
  },
  priorityLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priorityDisplay: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.round,
  },
  priorityDisplayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberScroll: {
    flexDirection: 'row',
  },
  memberChip: {
    alignItems: 'center',
    marginRight: spacing.M,
    opacity: 0.6,
  },
  memberChipActive: {
    opacity: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.XS,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.textPrimary : theme.colors.surface,
  },
  memberName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  memberNameActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  assignedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.M,
  },
  assignedName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.colors.textTertiary,
  },
  validationBadge: {
    position: 'absolute',
    top: spacing.S,
    right: spacing.S,
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.round,
    backgroundColor: theme.colors.warning,
  },
  validationApproved: {
    backgroundColor: theme.colors.success,
  },
  validationRejected: {
    backgroundColor: theme.colors.error,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.background : theme.colors.surface,
  },
  photoRequired: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  metadata: {
    paddingTop: spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
    marginBottom: spacing.L,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: spacing.XXS,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.M,
  },
  actionButton: {
    flex: 1,
  },
  dangerZone: {
    marginTop: spacing.XL,
    paddingTop: spacing.L,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? theme.colors.error + '40' : theme.colors.error + '30',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.S,
    padding: spacing.M,
  },
  deleteButtonText: {
    fontSize: 16,
    color: theme.colors.error,
  },
  deleteConfirm: {
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.error + '20' : theme.colors.error + '10',
    borderRadius: borderRadius.medium,
  },
  deleteConfirmText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
    textAlign: 'center',
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: spacing.S,
  },
  deleteConfirmButton: {
    flex: 1,
  },
  reactionPickerContainer: {
    marginTop: spacing.M,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.S,
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  commentBadge: {
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XXS,
    borderRadius: borderRadius.round,
  },
  commentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentsContainer: {
    marginTop: spacing.M,
    maxHeight: 300,
  },
});

export default TaskDetailModal;