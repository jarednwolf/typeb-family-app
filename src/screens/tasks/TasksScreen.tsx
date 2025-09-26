import React, { FC, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectTasks, selectTasksLoading, fetchFamilyTasks, completeTask } from '../../store/slices/tasksSlice';
import { selectFamily } from '../../store/slices/familySlice';
import { selectUserProfile } from '../../store/slices/authSlice';
import { TaskCard } from '../../components/cards/TaskCard';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { TasksScreenSkeleton } from '../../components/common/Skeletons';
import { useTheme } from '../../contexts/ThemeContext';
import { Task, TaskStatus, TaskPriority, DEFAULT_TASK_CATEGORIES } from '../../types/models';

type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';
type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export const TasksScreen: FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useTheme();
  
  // Redux state
  const tasks = useAppSelector(selectTasks);
  const loading = useAppSelector(selectTasksLoading);
  const family = useAppSelector(selectFamily);
  const userProfile = useAppSelector(selectUserProfile);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Dropdown states
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    if (family?.id && userProfile?.id) {
      dispatch(fetchFamilyTasks({ familyId: family.id, userId: userProfile.id }) as any);
    }
  }, [family?.id, userProfile?.id, dispatch]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    if (!family?.id || !userProfile?.id) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchFamilyTasks({ familyId: family.id, userId: userProfile.id }) as any).unwrap();
    } catch (error) {
      console.error('Task refresh error:', error, { familyId: family.id, userId: userProfile.id });
    } finally {
      setRefreshing(false);
    }
  }, [family?.id, userProfile?.id, dispatch]);

  // Helper function to format field names
  const formatFieldName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'dueDate': 'Due Date',
      'createdAt': 'Created',
      'priority': 'Priority',
      'title': 'Title',
      'all': 'All',
      'pending': 'Pending',
      'completed': 'Done',
      'overdue': 'Overdue',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };
    
    return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter(task => task.status === 'pending');
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < today && task.status === 'pending';
        });
        break;
      case 'all':
      default:
        // No status filtering
        break;
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aRank = a.priority ? priorityOrder[a.priority] : priorityOrder.low;
          const bRank = b.priority ? priorityOrder[b.priority] : priorityOrder.low;
          return aRank - bRank;
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  // Handle task press
  const handleTaskPress = (task: any) => {
    // Navigation route exists in TasksStackParamList as TaskDetail
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    try {
      if (!userProfile?.id) {
        console.warn('[TasksScreen] Missing userId; cannot complete task');
        Alert.alert('Heads up', 'You need to be signed in to complete a task.');
        return;
      }
      await dispatch(completeTask({ taskId, userId: userProfile.id }) as any).unwrap();
    } catch (error) {
      console.error('Task complete error:', error, { taskId, userId: userProfile?.id });
    }
  };

  // Handle create task
  const handleCreateTask = () => {
    // Navigate to the Tasks tab first, then to CreateTask
    navigation.navigate('Tasks', { screen: 'CreateTask' });
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: any }) => (
    <TaskCard
      task={item}
      onPress={() => handleTaskPress(item)}
      onComplete={() => handleTaskComplete(item.id)}
    />
  );

  // Render dropdown menu
  const renderDropdown = (
    isOpen: boolean,
    setIsOpen: (value: boolean) => void,
    currentValue: string,
    options: string[],
    onSelect: (value: any) => void,
    label: string
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => {
          setIsOpen(!isOpen);
          // Close all other dropdowns
          if (!isOpen) {
            setShowSortMenu(false);
            setShowStatusMenu(false);
            setShowPriorityMenu(false);
            setIsOpen(true);
          }
        }}
        accessibilityLabel={`${label}, current: ${formatFieldName(currentValue)}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.dropdownTextContainer}>
          <Text style={styles.dropdownLabel}>{label}</Text>
          <Text style={styles.dropdownValue} numberOfLines={1} ellipsizeMode="tail">
            {formatFieldName(currentValue)}
          </Text>
        </View>
        <Feather name="chevron-down" size={14} color={theme.colors.textSecondary} style={styles.dropdownIcon} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownMenuItem,
                currentValue === option && styles.dropdownMenuItemActive
              ]}
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: currentValue === option }}
            >
              <Text style={[
                styles.dropdownMenuText,
                currentValue === option && styles.dropdownMenuTextActive
              ]}>
                {formatFieldName(option)}
              </Text>
              {currentValue === option && (
                <Feather name="check" size={14} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render search bar only
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Feather
        name="search"
        size={20}
        color={theme.colors.textSecondary}
        accessibilityLabel="Search icon"
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search tasks..."
        placeholderTextColor={theme.colors.textTertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        testID="task-search"
        accessibilityLabel="Search tasks"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => setSearchQuery('')}
          testID="clear-search"
          accessibilityLabel="Clear search"
        >
          <Feather name="x-circle" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Create dynamic styles based on theme
  const styles = useMemo(() => {
    return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.L,
      paddingVertical: theme.spacing.M,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.separator,
    },
    title: {
      fontSize: theme.typography.title2.fontSize,
      fontWeight: theme.typography.title2.fontWeight as any,
      color: theme.colors.textPrimary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundTexture,
      borderRadius: 10,
      paddingHorizontal: theme.spacing.M,
      marginHorizontal: theme.spacing.L,
      marginTop: theme.spacing.S,
      marginBottom: theme.spacing.S,
      height: 44,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.S,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.textPrimary,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.L,
      marginBottom: theme.spacing.M,
      gap: theme.spacing.S,
      zIndex: 9998,
    },
    dropdownContainer: {
      flex: 1,
      zIndex: 9999,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundTexture,
      paddingHorizontal: theme.spacing.S,
      paddingVertical: theme.spacing.XS,
      borderRadius: theme.borderRadius.medium,
    },
    dropdownTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
    },
    dropdownLabel: {
      fontSize: theme.typography.caption1.fontSize,
      color: theme.colors.textSecondary,
      marginRight: 4,
      flexShrink: 0,
    },
    dropdownValue: {
      fontSize: theme.typography.caption1.fontSize,
      color: theme.colors.textPrimary,
      fontWeight: '500',
      flexShrink: 1,
    },
    dropdownIcon: {
      marginLeft: 4,
      flexShrink: 0,
    },
    dropdownMenu: {
      position: 'absolute',
      top: 32,
      left: 0,
      minWidth: 120,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.15,
      shadowRadius: 4,
      elevation: 10,
      zIndex: 10000,
    },
    dropdownMenuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.XS,
      paddingHorizontal: theme.spacing.S,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.separator,
    },
    dropdownMenuItemActive: {
      backgroundColor: theme.colors.backgroundTexture,
    },
    dropdownMenuText: {
      fontSize: theme.typography.caption1.fontSize,
      color: theme.colors.textPrimary,
    },
    dropdownMenuTextActive: {
      fontWeight: '600',
      color: isDarkMode ? theme.colors.info : theme.colors.primary,
    },
    listContent: {
      paddingBottom: 100,
      flexGrow: 1,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDarkMode ? theme.colors.info : theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    validationButton: {
      position: 'relative',
      padding: theme.spacing.S,
    },
    validationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    validationBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
  });
  }, [theme, isDarkMode]);

  // Check if user is a manager (parent)
  const isManager = userProfile?.role === 'parent';
  
  // Count tasks pending validation
  const pendingValidationCount = useMemo(() => {
    return tasks.filter(task =>
      task.status === 'completed' &&
      task.requiresPhoto &&
      task.photoUrl &&
      (!task.validationStatus || task.validationStatus === 'pending')
    ).length;
  }, [tasks]);

  // This conditional return must come AFTER all hooks
  if (loading && tasks.length === 0) {
    return <TasksScreenSkeleton />;
  }
  
  return (
    <SafeAreaView style={styles.container} testID="tasks-screen">
      <View style={styles.headerContainer}>
        <Text style={styles.title} accessibilityRole="header">Tasks</Text>
        {isManager && family?.isPremium && pendingValidationCount > 0 && (
          <TouchableOpacity
            style={styles.validationButton}
            onPress={() => navigation.navigate('PhotoValidation')}
            accessibilityLabel={`Review ${pendingValidationCount} photo validations`}
          >
            <Feather name="camera" size={20} color={theme.colors.primary} />
            <View style={styles.validationBadge}>
              <Text style={styles.validationBadgeText}>{pendingValidationCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Filter Dropdowns - Outside of FlatList for proper touch handling */}
      <View
        style={styles.filtersContainer}
        pointerEvents="box-none"
        accessibilityRole="toolbar"
        accessibilityLabel="Task filters toolbar"
      >
        {/* Sort By Dropdown */}
        {renderDropdown(
          showSortMenu,
          setShowSortMenu,
          sortBy,
          ['dueDate', 'priority', 'createdAt', 'title'],
          setSortBy,
          'Sort'
        )}

        {/* Status Filter */}
        {renderDropdown(
          showStatusMenu,
          setShowStatusMenu,
          statusFilter,
          ['all', 'pending', 'completed', 'overdue'],
          setStatusFilter,
          'Status'
        )}

        {/* Priority Filter */}
        {renderDropdown(
          showPriorityMenu,
          setShowPriorityMenu,
          priorityFilter,
          ['all', 'high', 'medium', 'low'],
          setPriorityFilter,
          'Priority'
        )}
      </View>

      <FlatList
        data={filteredAndSortedTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        windowSize={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title={searchQuery ? 'No tasks found' : 'No tasks yet'}
            message={searchQuery ? 'Try adjusting your search' : 'Create your first task to get started'}
            onAction={!searchQuery ? handleCreateTask : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.S }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateTask}
        activeOpacity={0.8}
        testID="create-task-fab"
        accessibilityLabel="Create new task"
        accessibilityRole="button"
        accessibilityHint="Opens the create task form"
      >
        <Feather name="plus" size={24} color={theme.colors.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};