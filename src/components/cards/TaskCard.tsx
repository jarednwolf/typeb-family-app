/**
 * TaskCard Component - Premium task display card
 * 
 * Features:
 * - Clean, minimal design
 * - Task completion checkbox
 * - Category badge with icon
 * - Priority indicator
 * - Due date display
 * - Assignee information
 * - Photo validation badge
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Task, TaskCategory } from '../../types/models';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  showAssignee?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onPress, 
  onComplete,
  showAssignee = true 
}) => {
  const isOverdue = task.dueDate &&
    (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) < new Date() &&
    task.status !== 'completed';
  const isCompleted = task.status === 'completed';
  
  // Get category icon based on category name
  const getCategoryIcon = (category: TaskCategory): keyof typeof Feather.glyphMap => {
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      'chores': 'home',
      'homework': 'book',
      'exercise': 'heart',
      'personal': 'user',
      'routine': 'repeat',
      'other': 'more-horizontal',
    };
    return iconMap[category.id] || 'more-horizontal';
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
  
  return (
    <TouchableOpacity 
      style={[styles.container, isCompleted && styles.containerCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {/* Checkbox */}
        <TouchableOpacity 
          onPress={onComplete}
          style={[
            styles.checkbox,
            isCompleted && styles.checkboxCompleted
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isCompleted && (
            <Feather name="check" size={16} color={colors.white} />
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
            
            {/* Priority Indicator */}
            {task.priority === 'high' && !isCompleted && (
              <View style={styles.priorityBadge}>
                <Feather name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.priorityText}>High</Text>
              </View>
            )}
            
            {/* Recurring Indicator */}
            {task.isRecurring && (
              <View style={styles.recurringBadge}>
                <Feather name="repeat" size={12} color={colors.textSecondary} />
              </View>
            )}
          </View>
          
          {/* Footer Row */}
          <View style={styles.footer}>
            {/* Assignee */}
            {showAssignee && task.assignedTo && (
              <View style={styles.assigneeContainer}>
                <Feather name="user" size={12} color={colors.textTertiary} />
                <Text style={styles.assignee} numberOfLines={1}>
                  {task.assignedTo}
                </Text>
              </View>
            )}
            
            {/* Due Date */}
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Feather
                  name="calendar"
                  size={12}
                  color={isOverdue && !isCompleted ? colors.error : colors.textTertiary}
                />
                <Text 
                  style={[
                    styles.dueDate, 
                    isOverdue && !isCompleted && styles.dueDateOverdue
                  ]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Right Section - Validation Badge */}
      {task.requiresPhoto && isCompleted && (
        <View style={styles.validationBadge}>
          <Feather
            name={task.validationStatus === 'approved' ? 'check-circle' : 
                  task.validationStatus === 'rejected' ? 'x-circle' : 'clock'}
            size={20}
            color={task.validationStatus === 'approved' ? colors.success : 
                   task.validationStatus === 'rejected' ? colors.error : colors.warning}
          />
        </View>
      )}
      
      {/* Premium Badge for photo tasks */}
      {task.requiresPhoto && !isCompleted && (
        <View style={styles.premiumBadge}>
          <Feather name="camera" size={16} color={colors.premium} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    marginHorizontal: spacing.M,
    marginVertical: spacing.XS,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  
  containerCompleted: {
    opacity: 0.7,
  },
  
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.large,
    borderWidth: 2,
    borderColor: colors.separator,
    marginRight: spacing.S,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  
  content: {
    flex: 1,
  },
  
  title: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.XXS,
    fontWeight: '500',
  },
  
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.XS,
    flexWrap: 'wrap',
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.XS,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    marginRight: spacing.XS,
    marginBottom: 2,
  },
  
  categoryIcon: {
    marginRight: 4,
  },
  
  categoryText: {
    ...typography.caption1,
    fontWeight: '500',
  },
  
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.XS,
    marginBottom: 2,
  },
  
  priorityText: {
    ...typography.caption1,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  recurringBadge: {
    marginRight: spacing.XS,
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
    marginRight: spacing.XS,
  },
  
  assignee: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dueDate: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  
  dueDateOverdue: {
    color: colors.error,
    fontWeight: '600',
  },
  
  validationBadge: {
    marginLeft: spacing.S,
  },
  
  premiumBadge: {
    marginLeft: spacing.S,
  },
});

export default TaskCard;