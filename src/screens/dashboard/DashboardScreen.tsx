import React, { FC, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { selectTasks, selectTaskStats } from '../../store/slices/tasksSlice';
import { selectFamily } from '../../store/slices/familySlice';
import { TaskCard } from '../../components/cards/TaskCard';
import { StatsCard } from '../../components/cards/StatsCard';
import { FilterTabs, FilterTab } from '../../components/common/FilterTabs';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { Task, TaskStatus } from '../../types/models';

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming';

export const DashboardScreen: FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  
  // Redux state
  const user = useAppSelector(selectUser);
  const tasks = useAppSelector(selectTasks);
  const family = useAppSelector(selectFamily);
  const stats = useAppSelector(selectTaskStats);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Dispatch actions to load tasks and family data
      // await dispatch(fetchTasks()).unwrap();
      // await dispatch(fetchFamily()).unwrap();
      setTimeout(() => setLoading(false), 1000); // Simulated loading
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  // Get greeting based on time of day
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.displayName || 'there';
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }, [user]);

  // Filter tasks based on active filter
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case 'today':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      case 'overdue':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < today && task.status !== 'completed';
        });
      case 'upcoming':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= tomorrow;
        });
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, activeFilter]);

  // Filter tabs configuration
  const filterTabs: FilterTab[] = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'today', label: 'Today', count: filteredTasks.length },
    { id: 'overdue', label: 'Overdue', count: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length },
    { id: 'upcoming', label: 'Upcoming', count: tasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date()).length },
  ];

  // Handle task press
  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Handle create task
  const handleCreateTask = () => {
    navigation.navigate('CreateTask');
  };

  if (loading) {
    return <LoadingState variant="spinner" />;
  }

  return (
    <SafeAreaView style={styles.container} testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            testID="dashboard-refresh"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header} testID="dashboard-header">
          <View>
            <Text style={styles.greeting} accessibilityRole="header">
              {getGreeting}
            </Text>
            {family && (
              <Text style={styles.familyName}>
                {family.name}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
            testID="settings-button"
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Feather name="settings" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer} testID="dashboard-stats">
          <StatsCard
            title="Today's Tasks"
            value={stats?.total || 0}
            icon="check-circle"
            color={theme.colors.success}
          />
          <StatsCard
            title="Completion Rate"
            value={`${stats?.completionRate || 0}%`}
            icon="trending-up"
            color={theme.colors.info}
          />
        </View>

        {/* Filter Tabs */}
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabPress={(tabId) => setActiveFilter(tabId as FilterType)}
          testID="dashboard-filters"
        />

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks')}
              testID="view-all-tasks"
              accessibilityLabel="View all tasks"
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon="inbox"
              title={activeFilter === 'today' ? 'No tasks for today' : 'No tasks found'}
              message={activeFilter === 'today' ? 'Enjoy your free time or add a new task' : 'Try changing the filter or create a new task'}
              onAction={handleCreateTask}
            />
          ) : (
            <View style={styles.tasksList}>
              {filteredTasks.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                  onComplete={() => {
                    // TODO: Dispatch complete task action
                    console.log('Complete task:', task.id);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Family Activity (Optional) */}
        {family && family.memberIds.length > 1 && (
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Family Activity</Text>
            <View style={styles.activityList}>
              {/* TODO: Add activity feed items */}
              <Text style={styles.activityPlaceholder}>
                Activity feed coming soon...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.L,
    paddingTop: theme.spacing.L,
    paddingBottom: theme.spacing.M,
  },
  greeting: {
    fontSize: theme.typography.title1.fontSize,
    fontWeight: theme.typography.title1.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XXS,
  },
  familyName: {
    fontSize: theme.typography.subheadline.fontSize,
    color: theme.colors.textSecondary,
  },
  settingsButton: {
    padding: theme.spacing.XS,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.L,
    paddingBottom: theme.spacing.M,
    gap: theme.spacing.M,
  },
  tasksContainer: {
    paddingTop: theme.spacing.L,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.M,
  },
  sectionTitle: {
    fontSize: theme.typography.headline.fontSize,
    fontWeight: theme.typography.headline.fontWeight as any,
    color: theme.colors.textPrimary,
  },
  viewAllText: {
    fontSize: theme.typography.callout.fontSize,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  tasksList: {
    paddingHorizontal: theme.spacing.L,
    gap: theme.spacing.S,
  },
  activityContainer: {
    marginTop: theme.spacing.XL,
    paddingHorizontal: theme.spacing.L,
  },
  activityList: {
    marginTop: theme.spacing.M,
  },
  activityPlaceholder: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.L,
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