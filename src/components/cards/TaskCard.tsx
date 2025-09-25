/**
 * TaskCard Component - Premium task display card with engagement features
 * 
 * Features:
 * - Clean, minimal design
 * - Task completion checkbox with animation
 * - Category badge with icon
 * - Priority indicator
 * - Due date display
 * - Assignee information
 * - Photo validation badge
 * - Completion celebration animation
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Task, TaskCategory } from '../../types/models';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../hooks/redux';
import { selectFamilyMembers } from '../../store/slices/familySlice';
import { selectUserProfile } from '../../store/slices/authSlice';
import CompletionAnimation from '../animations/CompletionAnimation';
import { ReactionDisplay } from '../reactions';
import { useHaptics } from '../../utils/haptics';
import { usePressAnimation, useFadeAnimation, usePulseAnimation } from '../../utils/animations';
import {
  useAccessibility,
  getAccessibilityLabel,
  getAccessibilityHint,
  useReduceMotion,
} from '../../contexts/AccessibilityContext';

// Task type that can handle both serialized (string dates) and non-serialized (Date objects)
interface TaskCardTask {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  category: TaskCategory;
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
  parentReactions?: Record<string, any>;
}

interface TaskCardProps {
  task: TaskCardTask;
  onPress: () => void;
  onComplete: () => void;
  showAssignee?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  showAssignee = true
}) => {
  const { theme, isDarkMode } = useTheme();
  const familyMembers = useAppSelector(selectFamilyMembers);
  const userProfile = useAppSelector(selectUserProfile);
  const [showAnimation, setShowAnimation] = useState(false);
  const haptics = useHaptics();
  const { settings, announce } = useAccessibility();
  const reduceMotion = useReduceMotion();
  
  // Animation hooks
  const { animatedStyle: pressAnimatedStyle, handlePressIn, handlePressOut } = usePressAnimation(0.97);
  const { animatedStyle: fadeAnimatedStyle, fadeIn } = useFadeAnimation(0, 1, 300);
  
  // Urgency pulse animation for urgent/overdue tasks
  const urgencyPulse = useSharedValue(0);
  const borderGlow = useSharedValue(0);
  
  // Trigger fade in on mount
  React.useEffect(() => {
    fadeIn();
  }, []);
  
  // Calculate urgency levels
  const now = new Date();
  const dueDate = task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null;
  const hoursUntilDue = dueDate ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
  
  const isOverdue = dueDate && dueDate < now && task.status !== 'completed';
  const isDueSoon = !isOverdue && hoursUntilDue !== null && hoursUntilDue <= 24 && task.status !== 'completed';
  const isUrgent = task.priority === 'urgent' || (task.priority === 'high' && isDueSoon);
  const isCompleted = task.status === 'completed';
  
  // Priority color mapping
  const getPriorityColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isOverdue) return theme.colors.error;
    if (isUrgent) return theme.colors.error;
    if (task.priority === 'high') return theme.colors.warning;
    if (isDueSoon) return theme.colors.info;
    return theme.colors.separator;
  };
  
  // Setup urgency animations
  useEffect(() => {
    if (!reduceMotion && (isUrgent || isOverdue) && !isCompleted) {
      // Pulse animation for urgent tasks
      urgencyPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
      
      // Border glow animation
      borderGlow.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [isUrgent, isOverdue, isCompleted, reduceMotion]);
  
  // Animated styles for urgency
  const urgencyAnimatedStyle = useAnimatedStyle(() => {
    if (!isUrgent && !isOverdue) return {};
    
    return {
      borderWidth: interpolate(borderGlow.value, [0, 1], [2, 3]),
      borderColor: getPriorityColor(),
      shadowOpacity: interpolate(urgencyPulse.value, [0, 1], [0.1, 0.3]),
      shadowRadius: interpolate(urgencyPulse.value, [0, 1], [4, 8]),
    };
  });
  
  // Priority indicator pulse
  const priorityPulse = useRef(new RNAnimated.Value(1)).current;
  
  useEffect(() => {
    if (!reduceMotion && (isUrgent || task.priority === 'high') && !isCompleted) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(priorityPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          RNAnimated.timing(priorityPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isUrgent, task.priority, isCompleted, reduceMotion]);
  
  // Get user display name from family members
  const getUserName = (userId: string): string => {
    const member = familyMembers.find(m => m.id === userId || m.displayName === userId);
    return member?.displayName || userId || 'Unknown';
  };
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  // Fallback for environments where reanimated's Animated.View is undefined (e.g., tests)
  const AnimatedContainer: any = (Animated as any)?.View || View;
  
  // Get category icon based on provided icon, name, or ID
  const getCategoryIcon = (category: TaskCategory): keyof typeof Feather.glyphMap => {
    const providedIcon = (category as any).icon;
    if (providedIcon && (Feather as any)?.glyphMap?.[providedIcon]) {
      return providedIcon as keyof typeof Feather.glyphMap;
    }
    const categoryKey = category.id.toLowerCase();
    const categoryName = category.name.toLowerCase();
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      'chores': 'home',
      'homework': 'book',
      'academic-cap': 'book',
      'exercise': 'heart',
      'personal': 'user',
      'routine': 'repeat',
      'other': 'more-horizontal',
      'custom': 'more-horizontal',
      'dots-horizontal': 'more-horizontal',
      '1': 'home',
      '2': 'book',
      '3': 'heart',
      '4': 'user',
      '5': 'more-horizontal',
    };
    return iconMap[categoryKey] || iconMap[categoryName] || iconMap[category.id] || 'grid';
  };
  
  // Format due date
  const formatDueDate = (date: Date | string): string => {
    const dueDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for date comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    if (dueDateOnly.getTime() === today.getTime()) {
      return `Today at ${dueDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${dueDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    } else if (dueDateOnly < today) {
      return `Overdue`;
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Handle task completion with animation and accessibility announcement
  const handleComplete = () => {
    if (!isCompleted) {
      haptics.taskComplete(); // Add haptic feedback
      setShowAnimation(true);
      
      // Announce task completion for screen readers
      if (settings.announceStateChanges) {
        announce(`Task ${task.title} completed. Great job!`, { delay: 300 });
      }
    }
    onComplete();
  };

  const handleAnimationEnd = () => {
    setShowAnimation(false);
  };
  
  // Generate accessibility label for the task card
  const taskAccessibilityLabel = getAccessibilityLabel('Task', task.title, {
    isCompleted,
    isOverdue,
    priority: task.priority === 'high' ? 'high' : undefined,
    dueDate: task.dueDate ? formatDueDate(task.dueDate) : undefined,
  });
  
  const taskAccessibilityHint = getAccessibilityHint('view task details');
  
  const handlePress = () => {
    handlePressOut();
    onPress();
  };
  
  return (
    <AnimatedContainer style={[pressAnimatedStyle, fadeAnimatedStyle, urgencyAnimatedStyle]}>
      <TouchableOpacity
        style={[
          styles.container,
          isCompleted && styles.containerCompleted,
          isOverdue && !isCompleted && styles.containerOverdue,
          isUrgent && !isCompleted && styles.containerUrgent,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} // We're handling opacity with animations
        accessibilityLabel={taskAccessibilityLabel}
        accessibilityHint={taskAccessibilityHint}
        accessibilityRole="button"
        accessibilityState={{
          checked: isCompleted,
        }}
      >
      <View style={styles.leftSection}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={handleComplete}
          style={[
            styles.checkbox,
            isCompleted && styles.checkboxCompleted
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={isCompleted ? 'Task completed' : 'Mark task as complete'}
          accessibilityHint={isCompleted ? 'Task is already completed' : 'Double tap to complete this task'}
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: isCompleted,
          }}
        >
          {isCompleted && (
            <Feather name="check" size={24} color={theme.colors.white} />
          )}
        </TouchableOpacity>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text 
            style={[
              styles.title,
              isCompleted && styles.titleCompleted
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          
          {/* Metadata Row */}
          <View style={styles.metadata}>
            {/* Category Badge */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: task.category.color + '20' }
              ]}
              accessibilityLabel={`Category: ${task.category.name}`}
            >
              <Feather
                name={getCategoryIcon(task.category)}
                size={12}
                color={task.category.color}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText, { color: task.category.color }]}>
                {task.category.name}
              </Text>
            </View>
            
            {/* Enhanced Priority Indicator */}
            {(task.priority !== 'low' || isOverdue || isDueSoon) && !isCompleted && (
              <RNAnimated.View
                style={[
                  styles.priorityBadge,
                  task.priority === 'urgent' && styles.priorityBadgeUrgent,
                  task.priority === 'high' && styles.priorityBadgeHigh,
                  task.priority === 'medium' && styles.priorityBadgeMedium,
                  isOverdue && styles.priorityBadgeOverdue,
                  {
                    transform: [{ scale: priorityPulse }],
                  },
                ]}
                accessibilityLabel={`${
                  isOverdue ? 'Overdue' :
                  isDueSoon ? 'Due soon' :
                  task.priority
                } priority task`}
              >
                <Feather
                  name={
                    isOverdue ? 'alert-triangle' :
                    task.priority === 'urgent' ? 'zap' :
                    task.priority === 'high' ? 'alert-circle' :
                    isDueSoon ? 'clock' :
                    'flag'
                  }
                  size={12}
                  color={
                    isOverdue || task.priority === 'urgent' ? theme.colors.white :
                    task.priority === 'high' ? theme.colors.error :
                    isDueSoon ? theme.colors.info :
                    theme.colors.warning
                  }
                />
                <Text style={[
                  styles.priorityText,
                  (isOverdue || task.priority === 'urgent') && styles.priorityTextWhite,
                ]}>
                  {isOverdue ? 'High' :
                   isDueSoon ? 'Due Soon' :
                   task.priority === 'urgent' ? 'Urgent' :
                   task.priority === 'high' ? 'High' :
                   'Medium'}
                </Text>
              </RNAnimated.View>
            )}
            
            {/* Recurring Indicator */}
            {task.isRecurring && (
              <View
                style={styles.recurringBadge}
                accessibilityLabel="Recurring task"
              >
                <Feather name="repeat" size={12} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
          
          {/* Footer Row */}
          <View style={styles.footer}>
            {/* Assignee */}
            {showAssignee && task.assignedTo && (
              <View
                style={styles.assigneeContainer}
                accessibilityLabel={`Assigned to ${getUserName(task.assignedTo)}`}
              >
                <Feather name="user" size={12} color={theme.colors.textTertiary} />
                <Text style={styles.assignee} numberOfLines={1}>
                  {getUserName(task.assignedTo)}
                </Text>
              </View>
            )}
            
            {/* Due Date */}
            {task.dueDate && (
              <View
                style={styles.dueDateContainer}
                accessibilityLabel={`Due ${formatDueDate(task.dueDate)}${isOverdue && !isCompleted ? ', overdue' : ''}`}
              >
                <Feather
                  name="calendar"
                  size={12}
                  color={isOverdue && !isCompleted ? theme.colors.error : theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.dueDate,
                    (isOverdue && !isCompleted) ? styles.dueDateOverdue : null
                  ]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Priority side indicator */}
      {(task.priority === 'urgent' || task.priority === 'high' || isOverdue) && !isCompleted && (
        <View
          style={[
            styles.prioritySideIndicator,
            { backgroundColor: getPriorityColor() }
          ]}
        />
      )}
      
      {/* Right Section - Validation Badge */}
      {task.requiresPhoto && isCompleted && (
        <View
          style={styles.validationBadge}
          accessibilityLabel={
            task.validationStatus === 'approved' ? 'Photo approved' :
            task.validationStatus === 'rejected' ? 'Photo rejected' :
            'Photo pending validation'
          }
        >
          <Feather
            name={task.validationStatus === 'approved' ? 'check-circle' :
                  task.validationStatus === 'rejected' ? 'x-circle' : 'clock'}
            size={20}
            color={task.validationStatus === 'approved' ? theme.colors.success :
                   task.validationStatus === 'rejected' ? theme.colors.error : theme.colors.warning}
          />
        </View>
      )}
      
      {/* Premium Badge for photo tasks */}
      {task.requiresPhoto && !isCompleted && (
        <View
          style={styles.premiumBadge}
          accessibilityLabel="Photo required for completion"
        >
          <Feather name="camera" size={16} color={theme.colors.premium} />
        </View>
      )}

      {/* Completion Animation Overlay */}
      {showAnimation && (
        <View style={styles.animationOverlay}>
          <CompletionAnimation
            onAnimationEnd={handleAnimationEnd}
            showStarburst={true}
          />
        </View>
      )}
      
      {/* Enhanced Reaction Display - Week 4 Social Features */}
      {userProfile && (
        <View style={[
          styles.reactionContainer,
          !isCompleted && styles.reactionContainerActive
        ]}>
          <ReactionDisplay
            contentType="task"
            contentId={task.id}
            reactions={task.parentReactions}
            compact={true}
            maxReactionsShown={3}
            currentUserId={userProfile.id}
            onAddReaction={async (reaction) => {
              // Add haptic feedback for reactions
              haptics.selection();
              // Announce for accessibility
              if (settings.announceStateChanges) {
                announce(`Added ${reaction} reaction to task`);
              }
            }}
            onRemoveReaction={async () => {
              haptics.selection();
            }}
            onReactionAdded={(reaction) => {
              // Add haptic feedback for reactions
              haptics.selection();
              // Announce for accessibility
              if (settings.announceStateChanges) {
                announce(`Added ${reaction} reaction to task`);
              }
            }}
          />
        </View>
      )}
      </TouchableOpacity>
    </AnimatedContainer>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.M,
    marginHorizontal: theme.spacing.M,
    marginVertical: theme.spacing.XS,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.elevation[4], // Use new elevation system
    position: 'relative',
  },
  
  containerCompleted: {
    opacity: 0.7,
  },
  
  containerOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  
  containerUrgent: {
    backgroundColor: isDarkMode ? theme.colors.error + '10' : theme.colors.error + '05',
  },
  
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  checkbox: {
    width: 44, // Updated to meet minimum touch target
    height: 44, // Updated to meet minimum touch target
    borderRadius: 22, // Half of width/height
    borderWidth: 2,
    borderColor: theme.colors.separator,
    marginRight: theme.spacing.S,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  
  checkboxCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  
  content: {
    flex: 1,
  },
  
  title: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XXS,
    fontWeight: '500',
  },
  
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textTertiary,
  },
  
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
    flexWrap: 'wrap',
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.XS,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.XS,
    marginBottom: 2,
  },
  
  categoryIcon: {
    marginRight: 4,
  },
  
  categoryText: {
    ...theme.typography.caption1,
    fontWeight: '500',
  },
  
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.XS,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.XS,
    marginBottom: 2,
    backgroundColor: theme.colors.warning + '20',
  },
  
  priorityBadgeUrgent: {
    backgroundColor: theme.colors.error,
  },
  
  priorityBadgeHigh: {
    backgroundColor: theme.colors.error + '20',
  },
  
  priorityBadgeMedium: {
    backgroundColor: theme.colors.warning + '20',
  },
  
  priorityBadgeOverdue: {
    backgroundColor: theme.colors.error,
  },
  
  priorityText: {
    ...theme.typography.caption1,
    color: theme.colors.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  priorityTextWhite: {
    color: theme.colors.white,
  },
  
  prioritySideIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  
  recurringBadge: {
    marginRight: theme.spacing.XS,
    marginBottom: 2,
  },
  
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.XS,
  },
  
  assignee: {
    ...theme.typography.caption1,
    color: theme.colors.textTertiary,
    marginLeft: 4,
  },
  
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dueDate: {
    ...theme.typography.caption1,
    color: theme.colors.textTertiary,
    marginLeft: 4,
  },
  
  dueDateOverdue: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  
  validationBadge: {
    marginLeft: theme.spacing.S,
  },
  
  premiumBadge: {
    marginLeft: theme.spacing.S,
  },

  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  
  reactionContainer: {
    marginTop: theme.spacing.XS,
    marginLeft: 44 + theme.spacing.S, // Align with content (checkbox width + margin)
  },
  
  reactionContainerActive: {
    opacity: 0.8, // Slightly subdued when task is not completed
  },
});

// Memoize to reduce unnecessary re-renders in long lists
const areEqual = (prev: TaskCardProps, next: TaskCardProps) => {
  const a = prev.task;
  const b = next.task;
  return (
    prev.showAssignee === next.showAssignee &&
    a.id === b.id &&
    a.title === b.title &&
    a.status === b.status &&
    a.priority === b.priority &&
    String(a.updatedAt) === String(b.updatedAt) &&
    a.validationStatus === b.validationStatus &&
    a.photoUrl === b.photoUrl &&
    String(a.dueDate || '') === String(b.dueDate || '') &&
    a.requiresPhoto === b.requiresPhoto
  );
};

const MemoTaskCard = React.memo(TaskCard, areEqual);

export { MemoTaskCard as TaskCard };
export default MemoTaskCard;