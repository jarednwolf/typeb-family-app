import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { theme } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { createTask } from '../../store/slices/tasksSlice';
import { selectFamilyMembers } from '../../store/slices/familySlice';
import { Task, TaskPriority } from '../../types/models';
import notificationService from '../../services/notifications';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

// Simple category type for now
type SimpleTaskCategory = 'chore' | 'errand' | 'homework' | 'appointment' | 'other';

const categories: { value: SimpleTaskCategory; label: string; icon: string; color: string }[] = [
  { value: 'chore', label: 'Chore', icon: 'home', color: '#4CAF50' },
  { value: 'errand', label: 'Errand', icon: 'shopping-cart', color: '#2196F3' },
  { value: 'homework', label: 'Homework', icon: 'book', color: '#FF9800' },
  { value: 'appointment', label: 'Appointment', icon: 'calendar', color: '#9C27B0' },
  { value: 'other', label: 'Other', icon: 'more-horizontal', color: '#607D8B' },
];

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#F44336' },
  { value: 'high', label: 'High', color: '#FF9800' },
  { value: 'medium', label: 'Medium', color: '#FFC107' },
  { value: 'low', label: 'Low', color: '#4CAF50' },
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const familyMembers = useSelector(selectFamilyMembers);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SimpleTaskCategory>('chore');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>(currentUser?.uid || '');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [points, setPoints] = useState('10');
  const [enableReminder, setEnableReminder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    const pointsNum = parseInt(points, 10);
    if (!points || isNaN(pointsNum)) {
      newErrors.points = 'Points must be a number';
    } else if (pointsNum < 1 || pointsNum > 100) {
      newErrors.points = 'Points must be between 1 and 100';
    }

    if (!assignedTo) {
      newErrors.assignedTo = 'Please select a family member';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, points, assignedTo]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a simple task object for now
      const newTask = {
        title: title.trim(),
        description: description.trim(),
        category: category as any, // Will be converted to proper TaskCategory in backend
        priority,
        assignedTo,
        createdBy: currentUser?.uid || '',
        dueDate: dueDate,
        points: parseInt(points, 10),
        status: 'pending' as const,
        familyId: (currentUser as any)?.familyId || '',
      };

      const createdTask = await dispatch(createTask({
        familyId: (currentUser as any)?.familyId || '',
        userId: currentUser?.uid || '',
        input: newTask as any
      })).unwrap();
      
      // Schedule notification reminder if enabled
      if (enableReminder && createdTask && dueDate) {
        try {
          const assignedMember = familyMembers.find(m => m.id === assignedTo);
          if (assignedMember) {
            await notificationService.scheduleTaskReminder(
              { ...createdTask, dueDate } as Task,
              assignedMember
            );
          }
        } catch (error) {
          console.error('Failed to schedule reminder:', error);
          // Don't fail the task creation if reminder scheduling fails
        }
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('chore');
      setPriority('medium');
      setAssignedTo(currentUser?.uid || '');
      setDueDate(new Date());
      setPoints('10');
      setEnableReminder(true);
      setErrors({});
      
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, title, description, category, priority, assignedTo, dueDate, points, enableReminder, currentUser, dispatch, onClose, familyMembers]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // setShowDatePicker(Platform.OS === 'ios');
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Create New Task"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Input
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              error={errors.title}
              maxLength={100}
              testID="task-title-input"
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details..."
              multiline
              numberOfLines={3}
              maxLength={500}
              error={errors.description}
              testID="task-description-input"
            />
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value as string}
                  style={[
                    styles.categoryChip,
                    category === cat.value && styles.categoryChipActive,
                    { borderColor: category === cat.value ? cat.color : theme.colors.textTertiary },
                  ]}
                  onPress={() => setCategory(cat.value)}
                  testID={`category-${cat.value}`}
                >
                  <Feather
                    name={cat.icon as any}
                    size={16}
                    color={category === cat.value ? cat.color : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.value && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((pri) => (
                <TouchableOpacity
                  key={pri.value}
                  style={[
                    styles.priorityChip,
                    priority === pri.value && styles.priorityChipActive,
                    { borderColor: priority === pri.value ? pri.color : theme.colors.textTertiary },
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
          </View>

          {/* Assign To */}
          <View style={styles.section}>
            <Text style={styles.label}>Assign To</Text>
            {errors.assignedTo && (
              <Text style={styles.errorText}>{errors.assignedTo}</Text>
            )}
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
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              testID="due-date-button"
            >
              <Feather name="calendar" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.dateText}>
                {dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {/* Date picker would be shown here when available */}
            {showDatePicker && (
              <Text style={styles.dateText}>Date picker not available in web</Text>
            )}
          </View>

          {/* Reminder Toggle */}
          <View style={styles.section}>
            <View style={styles.reminderContainer}>
              <View style={styles.reminderLeft}>
                <Feather name="bell" size={20} color={theme.colors.primary} />
                <View style={styles.reminderText}>
                  <Text style={styles.label}>Task Reminder</Text>
                  <Text style={styles.reminderSubtext}>
                    Get notified before the task is due
                  </Text>
                </View>
              </View>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                trackColor={{
                  false: theme.colors.textTertiary,
                  true: theme.colors.success
                }}
                thumbColor={theme.colors.surface}
                testID="reminder-switch"
              />
            </View>
          </View>

          {/* Points */}
          <View style={styles.section}>
            <Input
              label="Points"
              value={points}
              onChangeText={setPoints}
              placeholder="10"
              keyboardType="numeric"
              error={errors.points}
              testID="points-input"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.actionButton}
              disabled={isSubmitting}
              testID="cancel-button"
            />
            <Button
              title={isSubmitting ? 'Creating...' : 'Create Task'}
              onPress={handleSubmit}
              style={styles.actionButton}
              loading={isSubmitting}
              disabled={isSubmitting}
              testID="create-button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.XL,
  },
  section: {
    marginBottom: theme.spacing.L,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.S,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: theme.spacing.XS,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    marginRight: theme.spacing.S,
    backgroundColor: theme.colors.background,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.surface,
  },
  categoryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.XS,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.S,
  },
  priorityChip: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    backgroundColor: theme.colors.background,
  },
  priorityChipActive: {
    backgroundColor: theme.colors.surface,
  },
  priorityLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  memberScroll: {
    flexDirection: 'row',
  },
  memberChip: {
    alignItems: 'center',
    marginRight: theme.spacing.M,
    opacity: 0.6,
  },
  memberChipActive: {
    opacity: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.XS,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  memberName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  memberNameActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.textTertiary,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: theme.spacing.S,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.XL,
    gap: theme.spacing.M,
  },
  actionButton: {
    flex: 1,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderText: {
    marginLeft: theme.spacing.M,
    flex: 1,
  },
  reminderSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.XXS,
  },
});

export default CreateTaskModal;