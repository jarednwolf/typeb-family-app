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
import { TaskCard } from '../../components/cards/TaskCard';
import { FilterTabs, FilterTab } from '../../components/common/FilterTabs';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { Task, TaskStatus, TaskPriority } from '../../types/models';
import { Alert } from 'react-native';

type SortOption = 'dueDate' | 'priority' | 'title' | 'status';
type FilterOption = 'all' | 'pending' | 'completed' | 'overdue';

export const TasksScreen: FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  
  // Redux state
  const tasks = useAppSelector(selectTasks);
  const loading = useAppSelector(selectTasksLoading);
  const family = useAppSelector(selectFamily);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    if (family?.id) {
      dispatch(fetchFamilyTasks({ familyId: family.id }) as any);
    }
  }, [family?.id, dispatch]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    if (!family?.id) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchFamilyTasks({ familyId: family.id }) as any).unwrap();
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setRefreshing(false);
    }
  }, [family?.id, dispatch]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    const now = new Date();
    switch (activeFilter) {
      case 'pending':
        filtered = filtered.filter(task => task.status === 'pending');
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < now && task.status === 'pending';
        });
        break;
      case 'all':
      default:
        // No additional filtering
        break;
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
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [tasks, searchQuery, activeFilter, sortBy]);

  // Filter tabs configuration
  const filterTabs: FilterTab[] = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { id: 'overdue', label: 'Overdue', count: tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status === 'pending';
    }).length },
  ];

  // Handle task press
  const handleTaskPress = (task: Task) => {
    // Navigation route exists in TasksStackParamList as TaskDetail
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    try {
      const userId = useAppSelector((s) => s.auth.user?.uid as string);
      if (!userId) {
        console.warn('[TasksScreen] Missing userId; cannot complete task');
        Alert.alert('Heads up', 'You need to be signed in to complete a task.');
        return;
      }
      await dispatch(completeTask({ taskId, userId }) as any).unwrap();
    } catch (error) {
      console.error('[TasksScreen] Failed to complete task', error);
      Alert.alert("Oops, something went wrong. Let's try again!");
    }
  };

  // Handle create task
  const handleCreateTask = () => {
    navigation.navigate('CreateTask');
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={() => handleTaskPress(item)}
      onComplete={() => handleTaskComplete(item.id)}
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header} accessible accessibilityLabel="Tasks list controls">
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={theme.colors.textSecondary} />
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

      {/* Sort Button */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          testID="sort-button"
          accessibilityLabel={`Sort tasks, current: ${sortBy}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: showSortMenu }}
        >
          <Feather name="filter" size={20} color={theme.colors.textPrimary} />
          <Text style={styles.sortText}>Sort by {sortBy}</Text>
          <Feather name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        
        {showSortMenu && (
          <View style={styles.sortMenu} accessible accessibilityLabel="Sort options menu">
            {(['dueDate', 'priority', 'title', 'status'] as SortOption[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.sortMenuItem, sortBy === option && styles.sortMenuItemActive]}
                onPress={() => {
                  setSortBy(option);
                  setShowSortMenu(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: sortBy === option }}
                accessibilityLabel={`Sort by ${option === 'dueDate' ? 'Due Date' : option}`}
              >
                <Text style={[
                  styles.sortMenuText,
                  sortBy === option && styles.sortMenuTextActive
                ]}>
                  {option === 'dueDate' ? 'Due Date' :
                   option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {sortBy === option && (
                  <Feather name="check" size={16} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={filterTabs}
        activeTab={activeFilter}
        onTabPress={(tabId) => setActiveFilter(tabId as FilterOption)}
        testID="task-filters"
      />
    </View>
  );

  if (loading && tasks.length === 0) {
    return <LoadingState variant="spinner" />;
  }

  return (
    <SafeAreaView style={styles.container} testID="tasks-screen">
      <View style={styles.headerContainer}>
        <Text style={styles.title} accessibilityRole="header">Tasks</Text>
        <TouchableOpacity
          onPress={handleCreateTask}
          testID="create-task-button"
          accessibilityLabel="Create new task"
        >
          <Feather name="plus-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAndSortedTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title={searchQuery ? 'No tasks found' : 'No tasks yet'}
            message={searchQuery ? 'Try adjusting your search' : 'Create your first task to get started'}
            onAction={!searchQuery ? handleCreateTask : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
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
      >
        <Feather name="plus" size={24} color={theme.colors.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  header: {
    backgroundColor: theme.colors.surface,
    paddingBottom: theme.spacing.M,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundTexture,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.M,
    marginHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.M,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.S,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  },
  sortContainer: {
    paddingHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.M,
    zIndex: 1000,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.XS,
  },
  sortText: {
    marginLeft: theme.spacing.XS,
    marginRight: theme.spacing.XXS,
    fontSize: theme.typography.callout.fontSize,
    color: theme.colors.textPrimary,
  },
  sortMenu: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.S,
    paddingHorizontal: theme.spacing.M,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  sortMenuItemActive: {
    backgroundColor: theme.colors.backgroundTexture,
  },
  sortMenuText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  },
  sortMenuTextActive: {
    fontWeight: '600',
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});