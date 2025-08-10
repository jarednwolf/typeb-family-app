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

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Task, TaskCategory } from '../../types/models';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../hooks/redux';
import { selectFamilyMembers } from '../../store/slices/familySlice';

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
}

interface TaskCardProps {
  task: TaskCardTask;
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
  const { theme, isDarkMode } = useTheme();
  const familyMembers = useAppSelector(selectFamilyMembers);
  
  const isOverdue = task.dueDate &&
    (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) < new Date() &&
    task.status !== 'completed';
  const isCompleted = task.status === 'completed';
  
  // Get user display name from family members
  const getUserName = (userId: string): string => {
    const member = familyMembers.find(m => m.id === userId);
    return member?.displayName || 'Unknown';
  };
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  // Get category icon based on category name or ID
  const getCategoryIcon = (category: TaskCategory): keyof typeof Feather.glyphMap => {
    // Map both category IDs and names to icons
    const categoryKey = category.id.toLowerCase();
    const categoryName = category.name.toLowerCase();
    
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      'chores': 'home',
      'homework': 'book-open',
      'academic-cap': 'book-open', // Handle the academic-cap case
      'exercise': 'heart',
      'personal': 'user',
      'routine': 'repeat',
      'other': 'grid',
      'dots-horizontal': 'grid', // Handle dots-horizontal case
      '1': 'home', // Map numeric IDs too
      '2': 'book-open',
      '3': 'heart',
      '4': 'user',
      '5': 'grid',
    };
    
    // Try to match by ID first, then by name
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
            <Feather name="check" size={16} color={theme.colors.white} />
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
                <Feather name="alert-circle" size={12} color={theme.colors.error} />
                <Text style={styles.priorityText}>High</Text>
              </View>
            )}
            
            {/* Recurring Indicator */}
            {task.isRecurring && (
              <View style={styles.recurringBadge}>
                <Feather name="repeat" size={12} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
          
          {/* Footer Row */}
          <View style={styles.footer}>
            {/* Assignee */}
            {showAssignee && task.assignedTo && (
              <View style={styles.assigneeContainer}>
                <Feather name="user" size={12} color={theme.colors.textTertiary} />
                <Text style={styles.assignee} numberOfLines={1}>
                  {getUserName(task.assignedTo)}
                </Text>
              </View>
            )}
            
            {/* Due Date */}
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
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
      
      {/* Right Section - Validation Badge */}
      {task.requiresPhoto && isCompleted && (
        <View style={styles.validationBadge}>
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
        <View style={styles.premiumBadge}>
          <Feather name="camera" size={16} color={theme.colors.premium} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.M,
    marginHorizontal: theme.spacing.M,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
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
    borderRadius: theme.borderRadius.large,
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
    marginRight: theme.spacing.XS,
    marginBottom: 2,
  },
  
  priorityText: {
    ...theme.typography.caption1,
    color: theme.colors.error,
    fontWeight: '600',
    marginLeft: 4,
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
});

export default TaskCard;