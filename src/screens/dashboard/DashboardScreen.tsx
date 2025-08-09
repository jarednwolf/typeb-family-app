import React, { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUserProfile } from '../../store/slices/authSlice';
import { selectTasks, selectTaskStats, completeTask } from '../../store/slices/tasksSlice';
import { selectFamily } from '../../store/slices/familySlice';
import { TaskCard } from '../../components/cards/TaskCard';
import { StatsCard } from '../../components/cards/StatsCard';
import { FilterTabs, FilterTab } from '../../components/common/FilterTabs';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import PremiumBadge from '../../components/premium/PremiumBadge';
import { useTheme } from '../../contexts/ThemeContext';
import { TaskStatus } from '../../types/models';

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming';

export const DashboardScreen: FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useTheme();
  
  // Redux state
  const userProfile = useAppSelector(selectUserProfile);
  const tasks = useAppSelector(selectTasks);
  const family = useAppSelector(selectFamily);
  const stats = useAppSelector(selectTaskStats);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const confettiRef = useRef<any>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

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
    const name = userProfile?.displayName || 'there';
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }, [userProfile]);

  // Get today's tasks (both pending and completed)
  const todaysTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    // If a task is being completed, keep it in its original position
    if (completingTaskId) {
      const completingTaskIndex = todayTasks.findIndex(t => t.id === completingTaskId);
      if (completingTaskIndex !== -1) {
        const completingTask = todayTasks[completingTaskIndex];
        const otherTasks = todayTasks.filter(t => t.id !== completingTaskId);
        
        // Sort other tasks normally
        const sortedOthers = otherTasks.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return 0;
        });
        
        // Insert completing task back at its original position
        const pendingCount = sortedOthers.filter(t => t.status !== 'completed').length;
        const insertPosition = completingTask.status === 'completed' ? pendingCount : completingTaskIndex;
        sortedOthers.splice(Math.min(insertPosition, sortedOthers.length), 0, completingTask);
        
        return sortedOthers;
      }
    }

    // Normal sorting when no task is being completed
    return todayTasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });
  }, [tasks, completingTaskId]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const totalTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }).length;

    const completedTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow && task.status === 'completed';
    }).length;

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [tasks]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionPercentage / 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Trigger confetti at 100%
    if (completionPercentage === 100 && !showConfetti && todaysTasks.length > 0) {
      setShowConfetti(true);
      setTimeout(() => {
        confettiRef.current?.start();
      }, 100);
    } else if (completionPercentage < 100 && showConfetti) {
      setShowConfetti(false);
    }
  }, [completionPercentage]);

  // Handle task press
  const handleTaskPress = (task: any) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Handle create task
  const handleCreateTask = () => {
    // Navigate to the Tasks tab, then to CreateTask screen
    navigation.navigate('Tasks', { screen: 'CreateTask' });
  };

  // Handle task completion with animation delay
  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      // Set the completing task to prevent immediate reordering
      setCompletingTaskId(taskId);
      
      // Dispatch the completion action
      await dispatch(completeTask({
        taskId,
        userId: userProfile?.id || '',
      })).unwrap();
      
      // Wait for visual feedback to be seen (1.5 seconds)
      setTimeout(() => {
        setCompletingTaskId(null); // Now allow reordering
      }, 1500);
    } catch (error) {
      console.error('Failed to complete task:', error);
      setCompletingTaskId(null);
    }
  }, [dispatch, userProfile]);

  // Create dynamic styles based on theme
  const styles = useMemo(() => StyleSheet.create({
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
    progressContainer: {
      marginHorizontal: theme.spacing.L,
      marginTop: theme.spacing.M,
      marginBottom: theme.spacing.L,
      padding: theme.spacing.M,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      ...theme.shadows.small,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.S,
    },
    progressTitle: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    progressPercentage: {
      fontSize: theme.typography.headline.fontSize,
      fontWeight: '700',
      color: isDarkMode ? theme.colors.white : theme.colors.primary,
    },
    progressBarBackground: {
      height: 12,
      backgroundColor: theme.colors.separator,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 6,
    },
    congratsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.S,
    },
    congratsText: {
      fontSize: theme.typography.callout.fontSize,
      color: theme.colors.success,
      fontWeight: '600',
      marginLeft: theme.spacing.XS,
    },
    tasksContainer: {
      paddingTop: theme.spacing.S,
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
      color: isDarkMode ? theme.colors.info : theme.colors.primary,
      fontWeight: '500',
    },
    tasksList: {
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
      backgroundColor: isDarkMode ? theme.colors.info : theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    analyticsContainer: {
      marginTop: theme.spacing.XL,
      paddingHorizontal: theme.spacing.L,
    },
    analyticsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.L,
      ...theme.shadows.small,
    },
    analyticsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.L,
    },
    analyticsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.S,
    },
    analyticsTitleText: {
      fontSize: theme.typography.headline.fontSize,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    analyticsStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    analyticsStat: {
      alignItems: 'center',
    },
    analyticsStatValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.XXS,
    },
    analyticsStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    analyticsUpgrade: {
      marginTop: theme.spacing.M,
      paddingTop: theme.spacing.M,
      borderTopWidth: 1,
      borderTopColor: theme.colors.separator,
    },
    analyticsUpgradeText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  }), [theme, isDarkMode]);

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

        {/* Daily Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: completionPercentage === 100
                    ? theme.colors.success
                    : isDarkMode ? theme.colors.info : theme.colors.primary,
                }
              ]}
            />
          </View>
          {completionPercentage === 100 && (
            <View style={styles.congratsContainer}>
              <Feather name="award" size={20} color={theme.colors.success} />
              <Text style={styles.congratsText}>All tasks completed! Great job!</Text>
            </View>
          )}
        </View>
        
        {/* Analytics Preview Card */}
        <View style={styles.analyticsContainer}>
          <TouchableOpacity
            style={styles.analyticsCard}
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.8}
          >
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsTitle}>
                <Feather name="bar-chart-2" size={24} color={theme.colors.primary} />
                <Text style={styles.analyticsTitleText}>Analytics Dashboard</Text>
                {family?.isPremium && <PremiumBadge size="small" />}
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </View>
            
            <View style={styles.analyticsStats}>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>{stats.total}</Text>
                <Text style={styles.analyticsStatLabel}>Total Tasks</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>{stats.completionRate}%</Text>
                <Text style={styles.analyticsStatLabel}>Completion</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>{stats.overdue}</Text>
                <Text style={styles.analyticsStatLabel}>Overdue</Text>
              </View>
            </View>
            
            {!family?.isPremium && (
              <View style={styles.analyticsUpgrade}>
                <Text style={styles.analyticsUpgradeText}>
                  Unlock detailed insights with Premium
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's Tasks */}
        <View style={styles.tasksContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks')}
              testID="view-all-tasks"
              accessibilityLabel="View all tasks"
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {todaysTasks.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No tasks for today"
              message="Enjoy your free time or add a new task"
              onAction={handleCreateTask}
            />
          ) : (
            <View style={styles.tasksList}>
              {todaysTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                  onComplete={() => handleCompleteTask(task.id)}
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

      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{x: -10, y: 0}}
          fadeOut={true}
          autoStart={false}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </SafeAreaView>
  );
};