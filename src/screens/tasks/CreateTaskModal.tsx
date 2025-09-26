import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
// @ts-ignore - type shim provided in src/types/patches.d.ts
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { MIDDLE_SCHOOL_TASK_TEMPLATES, TaskTemplate } from '../../data/MiddleSchoolTaskTemplates';
import { recurringTaskScheduler } from '../../services/RecurringTaskScheduler';
import { createTaskSchema, validateData } from '../../utils/validation';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}


const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#F44336' },
  { value: 'medium', label: 'Medium', color: '#FFC107' },
  { value: 'low', label: 'Low', color: '#4CAF50' },
];

// Helper function to check if an icon name is valid for Feather
const isValidFeatherIcon = (iconName: string): boolean => {
  const validIcons = ['home', 'book-open', 'heart', 'user', 'grid', 'repeat', 'folder', 'book'];
  return validIcons.includes(iconName);
};

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const familyMembers = useSelector(selectFamilyMembers);
  const userProfile = useSelector((state: RootState) => state.auth?.userProfile || null);
  const family = useSelector((state: RootState) => state.family?.currentFamily || null);
  const { theme, isDarkMode } = useTheme();
  
  // State for template selection
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  
  // Get categories from family or use defaults
  const categories = useMemo(() => {
    // Map invalid icons to valid Feather icons
    const iconMapping: Record<string, string> = {
      'academic-cap': 'book-open',  // Replace academic-cap with book-open icon
      'dots-horizontal': 'grid',     // Replace dots-horizontal with grid icon
    };
    
    if (family?.taskCategories && family.taskCategories.length > 0) {
      return family.taskCategories.map(cat => {
        // Check if icon needs to be mapped to a valid one
        const mappedIcon = iconMapping[cat.icon || ''] || cat.icon || 'folder';
        return {
          id: cat.id,
          label: cat.name,
          icon: mappedIcon,
          color: cat.color || '#6B7280',
        };
      });
    }
    // Default categories
    return [
      { id: '1', label: 'Chores', icon: 'home', color: '#10B981' },
      { id: '2', label: 'Homework', icon: 'book-open', color: '#3B82F6' },
      { id: '3', label: 'Exercise', icon: 'heart', color: '#F59E0B' },
      { id: '4', label: 'Personal', icon: 'user', color: '#8B5CF6' },
      { id: '5', label: 'Other', icon: 'grid', color: '#6B7280' },
    ];
  }, [family]);

  // Helper function to get next 15-minute interval
  const getNext15MinuteInterval = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const remainder = minutes % 15;
    
    // Calculate next 15-minute mark
    const minutesToAdd = remainder === 0 ? 15 : 15 - remainder;
    
    now.setMinutes(minutes + minutesToAdd);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    return now;
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '1');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>(userProfile?.id || '');
  const [dueDate, setDueDate] = useState<Date>(getNext15MinuteInterval());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [enableReminder, setEnableReminder] = useState(true);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [photoInstructions, setPhotoInstructions] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [showCategoryScrollIndicator, setShowCategoryScrollIndicator] = useState(true);
  const categoryScrollRef = useRef<any>(null);

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const handleCategoryScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 10;
    setShowCategoryScrollIndicator(!isAtEnd);
  };

  const validateForm = useCallback(async () => {
    const data = {
      title: title.trim(),
      description: description || undefined,
      categoryId,
      assignedTo,
      dueDate,
      isRecurring,
      recurrencePattern: isRecurring ? {
        frequency: recurrenceType,
        interval: 1,
        daysOfWeek: recurrenceType === 'weekly' ? recurrenceDays : undefined,
      } : undefined,
      requiresPhoto,
      reminderEnabled: enableReminder,
      priority,
      points: selectedTemplate?.points || 10,
    };
    const { isValid, errors } = await validateData(createTaskSchema, data as any);
    setErrors(errors);
    return isValid;
  }, [title, description, categoryId, assignedTo, dueDate, isRecurring, recurrenceType, recurrenceDays, requiresPhoto, enableReminder, priority, selectedTemplate]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: TaskTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setPriority(template.priority);
    setRequiresPhoto(template.requiresPhoto);
    setPhotoInstructions(template.photoInstructions || '');
    setEstimatedMinutes(template.estimatedMinutes);
    
    // Set category if it exists
    const matchingCategory = categories.find(cat =>
      cat.label.toLowerCase() === template.category.name.toLowerCase()
    );
    if (matchingCategory) {
      setCategoryId(matchingCategory.id);
    }
    
    // Set recurrence if template has it
    if (template.recurrence) {
      setIsRecurring(true);
      setRecurrenceType(template.recurrence.type as 'daily' | 'weekly');
      if (template.recurrence.daysOfWeek) {
        setRecurrenceDays(template.recurrence.daysOfWeek);
      }
    }
    
    setShowTemplates(false);
  }, [categories]);

  const handleSubmit = useCallback(async () => {
    if (!(await validateForm())) {
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
      // Handle recurring task separately
      if (isRecurring && selectedTemplate) {
        // Create recurring task using the scheduler
        await recurringTaskScheduler.addRecurringTask(
          familyId,
          selectedTemplate.id,
          assignedTo,
          {
            type: recurrenceType,
            daysOfWeek: recurrenceType === 'weekly' ? recurrenceDays : undefined,
            time: `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`,
          }
        );
        
        Alert.alert('Success', 'Recurring task scheduled successfully!');
      } else {
        // Create one-time task
        const newTask: CreateTaskInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId,
          priority,
          assignedTo,
          dueDate: dueDate,
          points: selectedTemplate?.points || 10,
          isRecurring: false,
          requiresPhoto: requiresPhoto,
          reminderEnabled: enableReminder,
        };

        await dispatch(createTask({
          familyId: familyId,
          userId: userProfile?.id || '',
          input: newTask
        })).unwrap();
      }
      
      // Don't schedule notifications - they might be causing issues
      // The backend should handle this
      
      // Reset form state
      setTitle('');
      setDescription('');
      setCategoryId('1');
      setPriority('medium');
      setAssignedTo(userProfile?.id || '');
      setDueDate(getNext15MinuteInterval());
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
  }, [validateForm, title, description, categoryId, priority, assignedTo, dueDate, enableReminder,
      requiresPhoto, isRecurring, selectedTemplate, recurrenceType, recurrenceDays, userProfile,
      dispatch, onClose, isSubmitting]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Preserve the time when changing the date
      const newDate = new Date(selectedDate);
      newDate.setHours(dueDate.getHours());
      newDate.setMinutes(dueDate.getMinutes());
      setDueDate(newDate);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      // Preserve the date when changing the time
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours());
      
      // Round minutes to nearest 15-minute increment
      const minutes = selectedTime.getMinutes();
      const roundedMinutes = Math.round(minutes / 15) * 15;
      
      // Handle edge case where rounding to 60 minutes
      if (roundedMinutes === 60) {
        newDate.setHours(newDate.getHours() + 1);
        newDate.setMinutes(0);
      } else {
        newDate.setMinutes(roundedMinutes);
      }
      
      setDueDate(newDate);
    }
  };

  const handleDateButtonPress = () => {
    if (showDatePicker) {
      // If date picker is already open, close it
      setShowDatePicker(false);
    } else {
      // Open date picker and close time picker if it's open
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  };

  const handleTimeButtonPress = () => {
    if (showTimePicker) {
      // If time picker is already open, close it
      setShowTimePicker(false);
    } else {
      // Open time picker and close date picker if it's open
      setShowTimePicker(true);
      setShowDatePicker(false);
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
          {/* Template Quick Start */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => setShowTemplates(!showTemplates)}
              testID="template-button"
            >
              <Feather name="zap" size={20} color={theme.colors.warning} />
              <Text style={styles.templateButtonText}>
                {selectedTemplate ? `Using: ${selectedTemplate.title}` : 'Quick Start with Template'}
              </Text>
              <Feather
                name={showTemplates ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            
            {showTemplates && (
              <View style={styles.templateList}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.templateScroll}
                >
                  {MIDDLE_SCHOOL_TASK_TEMPLATES.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateCard,
                        selectedTemplate?.id === template.id && styles.templateCardActive
                      ]}
                      onPress={() => handleTemplateSelect(template)}
                    >
                      <View style={[styles.templateIcon, { backgroundColor: template.category.color + '20' }]}>
                        <Feather name={template.category.icon as any} size={24} color={template.category.color} />
                      </View>
                      <Text style={styles.templateTitle} numberOfLines={2}>{template.title}</Text>
                      <View style={styles.templateMeta}>
                        <Feather name="clock" size={12} color={theme.colors.textTertiary} />
                        <Text style={styles.templateMetaText}>{template.estimatedMinutes}m</Text>
                        {template.requiresPhoto && (
                          <>
                            <Feather name="camera" size={12} color={theme.colors.textTertiary} />
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Title Input - Input component has its own margin */}
          <Input
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            error={errors.title}
            maxLength={100}
            testID="task-title-input"
            returnKeyType="next"
            onSubmitEditing={() => {
              // focus moves to description if present
            }}
          />

          {/* Description Input - Input component has its own margin */}
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
            returnKeyType="done"
            onSubmitEditing={async () => {
              await handleSubmit();
            }}
          />

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
            <View style={styles.categoryScrollContainer}>
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
                onScroll={handleCategoryScroll}
                scrollEventThrottle={16}
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
                    {cat.icon ? (
                      <Feather
                        name={cat.icon as keyof typeof Feather.glyphMap}
                        size={16}
                        color={categoryId === cat.id ? cat.color : theme.colors.textSecondary}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.categoryLabel,
                        categoryId === cat.id && { color: cat.color },
                        !cat.icon ? { marginLeft: 0 } : {}, // No margin if no icon
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Scroll indicator - shows when there's more content */}
              {showCategoryScrollIndicator && categories.length > 3 && (
                <View style={styles.scrollIndicator} pointerEvents="none">
                  <Text style={styles.scrollIndicatorText}>→</Text>
                </View>
              )}
            </View>
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

          {/* Due Date and Time */}
          <View style={styles.section} testID="due-date-picker">
            <Text style={styles.label}>Due Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonHalf, showDatePicker && styles.dateButtonActive]}
                onPress={handleDateButtonPress}
                testID="due-date-button"
              >
                <Feather name="calendar" size={20} color={showDatePicker ? theme.colors.primary : theme.colors.textTertiary} />
                <Text style={[styles.dateText, showDatePicker && styles.dateTextActive]}>
                  {dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonHalf, showTimePicker && styles.dateButtonActive]}
                onPress={handleTimeButtonPress}
                testID="due-time-button"
              >
                <Feather name="clock" size={20} color={showTimePicker ? theme.colors.primary : theme.colors.textTertiary} />
                <Text style={[styles.dateText, showTimePicker && styles.dateTextActive]}>
                  {dueDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                testID="date-picker"
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minuteInterval={15}
                testID="time-picker"
              />
            )}
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            {/* Photo Requirement */}
            <View style={styles.optionContainer}>
              <View style={styles.optionLeft}>
                <Feather name="camera" size={20} color={theme.colors.textPrimary} />
                <View style={styles.optionText}>
                  <Text style={styles.label}>Photo Verification</Text>
                  <Text style={styles.optionSubtext}>
                    Require photo proof of completion
                  </Text>
                </View>
              </View>
              <Switch
                value={requiresPhoto}
                onValueChange={setRequiresPhoto}
                trackColor={{
                  false: theme.colors.textSecondary,
                  true: theme.colors.success
                }}
                thumbColor={isDarkMode ? '#FFFFFF' : theme.colors.surface}
                testID="photo-switch"
              />
            </View>
            
            {requiresPhoto && (
              <Input
                label="Photo Instructions"
                value={photoInstructions}
                onChangeText={setPhotoInstructions}
                placeholder="e.g., Take a photo of your clean room"
                multiline
                numberOfLines={2}
                maxLength={200}
                style={styles.photoInstructions}
                testID="photo-instructions-input"
              />
            )}

            {/* Recurring Task */}
            <View style={[styles.optionContainer, styles.marginTop]}>
              <View style={styles.optionLeft}>
                <Feather name="repeat" size={20} color={theme.colors.textPrimary} />
                <View style={styles.optionText}>
                  <Text style={styles.label}>Recurring Task</Text>
                  <Text style={styles.optionSubtext}>
                    Automatically create this task regularly
                  </Text>
                </View>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: theme.colors.textSecondary,
                  true: theme.colors.success
                }}
                thumbColor={isDarkMode ? '#FFFFFF' : theme.colors.surface}
                testID="recurring-switch"
              />
            </View>
            
            {isRecurring && (
              <View style={styles.recurrenceOptions}>
                <View style={styles.recurrenceTypeContainer}>
                  <TouchableOpacity
                    style={[styles.recurrenceType, recurrenceType === 'daily' && styles.recurrenceTypeActive]}
                    onPress={() => setRecurrenceType('daily')}
                  >
                    <Text style={[styles.recurrenceTypeText, recurrenceType === 'daily' && styles.recurrenceTypeTextActive]}>
                      Daily
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.recurrenceType, recurrenceType === 'weekly' && styles.recurrenceTypeActive]}
                    onPress={() => setRecurrenceType('weekly')}
                  >
                    <Text style={[styles.recurrenceTypeText, recurrenceType === 'weekly' && styles.recurrenceTypeTextActive]}>
                      Weekly
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {recurrenceType === 'weekly' && (
                  <View style={styles.weekDays}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.weekDay, recurrenceDays.includes(index) && styles.weekDayActive]}
                        onPress={() => {
                          if (recurrenceDays.includes(index)) {
                            setRecurrenceDays(recurrenceDays.filter(d => d !== index));
                          } else {
                            setRecurrenceDays([...recurrenceDays, index]);
                          }
                        }}
                      >
                        <Text style={[styles.weekDayText, recurrenceDays.includes(index) && styles.weekDayTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Reminder Toggle */}
            <View style={[styles.optionContainer, styles.marginTop]}>
              <View style={styles.optionLeft}>
                <Feather name="bell" size={20} color={theme.colors.textPrimary} />
                <View style={styles.optionText}>
                  <Text style={styles.label}>Task Reminder</Text>
                  <Text style={styles.optionSubtext}>
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
              title={isSubmitting ? 'Creating...' : isRecurring ? 'Schedule Task' : 'Create Task'}
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
    marginBottom: spacing.XS,
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
  categoryScrollContainer: {
    position: 'relative',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryScrollContent: {
    paddingRight: spacing.XL, // Add padding to show there's more content
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
  dateButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: isDarkMode ? theme.colors.primary + '20' : theme.colors.primary + '10',
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: spacing.S,
  },
  dateTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: spacing.S,
  },
  dateButtonHalf: {
    flex: 1,
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
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: spacing.M,
    flex: 1,
  },
  optionSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: spacing.XXS,
  },
  marginTop: {
    marginTop: spacing.M,
  },
  photoInstructions: {
    marginTop: spacing.S,
  },
  recurrenceOptions: {
    marginTop: spacing.S,
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
  },
  recurrenceTypeContainer: {
    flexDirection: 'row',
    gap: spacing.S,
  },
  recurrenceType: {
    flex: 1,
    padding: spacing.S,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: 'center',
  },
  recurrenceTypeActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  recurrenceTypeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  recurrenceTypeTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.M,
  },
  weekDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  weekDayText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  weekDayTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.M,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  templateButtonText: {
    flex: 1,
    marginLeft: spacing.S,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  templateList: {
    marginTop: spacing.M,
  },
  templateScroll: {
    flexDirection: 'row',
  },
  templateCard: {
    width: 120,
    padding: spacing.M,
    marginRight: spacing.S,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: 'center',
  },
  templateCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.S,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.XS,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XS,
  },
  templateMetaText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
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
  scrollIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
    paddingHorizontal: spacing.XS,
    paddingVertical: spacing.XXS,
    borderRadius: borderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollIndicatorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});

export default CreateTaskModal;