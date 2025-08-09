import React, { useState, useCallback, useMemo } from 'react';
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
import CustomCategoryModal from '../../components/categories/CustomCategoryModal';
import PremiumBadge from '../../components/premium/PremiumBadge';
import { spacing, borderRadius } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { createTask } from '../../store/slices/tasksSlice';
import { selectFamilyMembers, addTaskCategory } from '../../store/slices/familySlice';
import { TaskPriority, CreateTaskInput, TaskCategory } from '../../types/models';
import notificationService from '../../services/notifications';
import { useTheme } from '../../contexts/ThemeContext';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}


const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#F44336' },
  { value: 'medium', label: 'Medium', color: '#FFC107' },
  { value: 'low', label: 'Low', color: '#4CAF50' },
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const familyMembers = useSelector(selectFamilyMembers);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  const { theme, isDarkMode } = useTheme();
  
  // Get categories from family or use defaults
  const categories = useMemo(() => {
    if (family?.taskCategories && family.taskCategories.length > 0) {
      return family.taskCategories.map(cat => ({
        id: cat.id,
        label: cat.name,
        icon: cat.icon || 'folder',
        color: cat.color || '#6B7280',
      }));
    }
    // Default categories
    return [
      { id: '1', label: 'Chores', icon: 'home', color: '#10B981' },
      { id: '2', label: 'Homework', icon: 'book', color: '#3B82F6' },
      { id: '3', label: 'Exercise', icon: 'heart', color: '#F59E0B' },
      { id: '4', label: 'Personal', icon: 'user', color: '#8B5CF6' },
      { id: '5', label: 'Other', icon: 'more-horizontal', color: '#6B7280' },
    ];
  }, [family]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '1');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>(userProfile?.id || '');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [points, setPoints] = useState('10');
  const [enableReminder, setEnableReminder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

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

    // Check if user has a family
    const familyId = userProfile?.familyId;
    if (!familyId) {
      Alert.alert(
        'No Family',
        'You need to create or join a family before creating tasks.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create task input matching the CreateTaskInput interface
      const newTask: CreateTaskInput = {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId,
        priority,
        assignedTo,
        dueDate: dueDate, // Keep as Date object
        points: parseInt(points, 10),
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: enableReminder,
      };

      await dispatch(createTask({
        familyId: familyId,
        userId: userProfile?.id || '',
        input: newTask
      })).unwrap();
      
      // Don't schedule notifications - they might be causing issues
      // The backend should handle this
      
      // Reset form state
      setTitle('');
      setDescription('');
      setCategoryId('1');
      setPriority('medium');
      setAssignedTo(userProfile?.id || '');
      setDueDate(new Date());
      setPoints('10');
      setEnableReminder(true);
      setErrors({});
      
      // Close modal immediately after successful creation
      onClose();
      
    } catch (error) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      // Always reset submitting state
      setIsSubmitting(false);
    }
  }, [validateForm, title, description, categoryId, priority, assignedTo, dueDate, points, enableReminder, userProfile, dispatch, onClose, isSubmitting]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // setShowDatePicker(Platform.OS === 'ios');
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };
  
  const handleCustomCategoryCreate = useCallback(async (categoryData: Omit<TaskCategory, 'id'>) => {
    if (!family?.id || !userProfile?.id) return;
    
    try {
      // Generate a unique ID for the category
      const category: TaskCategory = {
        ...categoryData,
        id: `custom_${Date.now()}`,
      };
      
      // Add the category to the family
      await dispatch(addTaskCategory({
        familyId: family.id,
        userId: userProfile.id,
        category
      })).unwrap();
      
      // Select the new category
      setCategoryId(category.id);
      setShowCustomCategoryModal(false);
      
      Alert.alert('Success', 'Custom category created!');
    } catch (error) {
      console.error('Failed to create custom category:', error);
      Alert.alert('Error', 'Failed to create custom category');
    }
  }, [family, userProfile, dispatch]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Create New Task"
      scrollable={true}
    >
      <View style={styles.container} testID="create-task-screen">
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
          <View style={styles.section} testID="category-selector">
            <View style={styles.categoryHeader}>
              <Text style={styles.label}>Category</Text>
              {family?.isPremium && (
                <TouchableOpacity
                  style={styles.addCategoryButton}
                  onPress={() => setShowCustomCategoryModal(true)}
                  testID="add-category-button"
                >
                  <Feather name="plus" size={16} color={theme.colors.primary} />
                  <Text style={styles.addCategoryText}>Add Custom</Text>
                  <PremiumBadge size="small" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    categoryId === cat.id && styles.categoryChipActive,
                    { borderColor: categoryId === cat.id ? cat.color : theme.colors.textSecondary },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  testID={`category-${cat.id}`}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      categoryId === cat.id && { color: cat.color },
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
                    { borderColor: priority === pri.value ? pri.color : theme.colors.textSecondary },
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
          <View style={styles.section} testID="assignee-selector">
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
          <View style={styles.section} testID="due-date-picker">
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              testID="due-date-button"
            >
              <Feather name="calendar" size={20} color={theme.colors.textTertiary} />
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
                <Feather name="bell" size={20} color={theme.colors.textPrimary} />
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
                  false: theme.colors.textSecondary,
                  true: theme.colors.success
                }}
                thumbColor={isDarkMode ? '#FFFFFF' : theme.colors.surface}
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
              testID="save-task-button"
            />
          </View>
      </View>
      
      {/* Custom Category Modal */}
      {showCustomCategoryModal && (
        <CustomCategoryModal
          visible={showCustomCategoryModal}
          onClose={() => setShowCustomCategoryModal(false)}
          onSave={handleCustomCategoryCreate}
          existingCategories={family?.taskCategories || []}
        />
      )}
    </Modal>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.L,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.S,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: spacing.XS,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginRight: spacing.S,
    backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
  },
  categoryChipActive: {
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
  },
  categoryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: spacing.XS,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: spacing.S,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.XL,
    gap: spacing.M,
  },
  actionButton: {
    flex: 1,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderText: {
    marginLeft: spacing.M,
    flex: 1,
  },
  reminderSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: spacing.XXS,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.S,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XS,
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.colors.primary + '10',
  },
  addCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default CreateTaskModal;