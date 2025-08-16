import React, { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { DashboardScreenSkeleton } from '../../components/common/Skeletons';
import PremiumBadge from '../../components/premium/PremiumBadge';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { TaskStatus } from '../../types/models';
import { elevation } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming';

export const ParallaxDashboardScreen: FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  
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
  
  // Parallax animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_SCROLL_DISTANCE);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Dispatch actions to load tasks and family data
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
    if (!reduceMotion) {
      Animated.timing(progressAnim, {
        toValue: completionPercentage / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(completionPercentage / 100);
    }

    // Trigger confetti at 100%
    if (completionPercentage === 100 && !showConfetti && todaysTasks.length > 0) {
      setShowConfetti(true);
      setTimeout(() => {
        confettiRef.current?.start();
      }, 100);
    } else if (completionPercentage < 100 && showConfetti) {
      setShowConfetti(false);
    }
  }, [completionPercentage, reduceMotion]);

  // Handle task press
  const handleTaskPress = (task: any) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Handle create task
  const handleCreateTask = () => {
    navigation.navigate('Tasks', { screen: 'CreateTask' });
  };

  // Handle task completion with animation delay
  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      
      await dispatch(completeTask({
        taskId,
        userId: userProfile?.id || '',
      })).unwrap();
      
      setTimeout(() => {
        setCompletingTaskId(null);
      }, 1500);
    } catch (error) {
      console.error('Failed to complete task:', error);
      setCompletingTaskId(null);
    }
  }, [dispatch, userProfile]);

  // Parallax animated styles
  const headerTranslateY = reduceMotion ? 0 : scrollYClamped.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
    extrapolate: 'clamp',
  });

  const headerOpacity = reduceMotion ? 1 : scrollYClamped.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0.3],
    extrapolate: 'clamp',
  });

  const titleScale = reduceMotion ? 1 : scrollYClamped.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const progressScale = reduceMotion ? 1 : scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.1, 1, 0.95],
    extrapolate: 'clamp',
  });

  const progressTranslateY = reduceMotion ? 0 : scrollY.interpolate({
    inputRange: [-100, 0, HEADER_SCROLL_DISTANCE],
    outputRange: [-20, 0, -30],
    extrapolate: 'clamp',
  });

  const fabScale = reduceMotion ? 1 : scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Create dynamic styles based on theme
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: HEADER_MAX_HEIGHT,
      paddingBottom: 100,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_MAX_HEIGHT,
      paddingTop: insets.top,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
      zIndex: 1,
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.L,
      paddingTop: theme.spacing.L,
      justifyContent: 'center',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
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
      ...elevation[4],
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
      ...elevation[8],
    },
    analyticsContainer: {
      marginTop: theme.spacing.XL,
      paddingHorizontal: theme.spacing.L,
    },
    analyticsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.L,
      ...elevation[2],
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
    headerBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.05,
    },
    headerGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 100,
      backgroundColor: theme.colors.primary,
      opacity: 0.1,
    },
  }), [theme, isDarkMode, insets]);

  if (loading) {
    return <DashboardScreenSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} testID="dashboard-screen">
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}
      >
        {/* Background decoration */}
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Animated.View style={{ transform: [{ scale: titleScale }] }}>
              <Text style={styles.greeting} accessibilityRole="header">
                {getGreeting}
              </Text>
              {family && (
                <Text style={styles.familyName}>
                  {family.name}
                </Text>
              )}
            </Animated.View>
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
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            testID="dashboard-refresh"
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Progress with parallax */}
        <Animated.View
          style={[
            styles.progressContainer,
            {
              transform: [
                { scale: progressScale },
                { translateY: progressTranslateY },
              ],
            },
          ]}
        >
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
        </Animated.View>
        
        {/* Analytics Preview Card with entrance animation */}
        <Animated.View
          style={[
            styles.analyticsContainer,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 200],
                outputRange: [0.7, 1],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 200],
                    outputRange: [30, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
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
        </Animated.View>

        {/* Today's Tasks with stagger animation */}
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
              {todaysTasks.map((task, index) => (
                <Animated.View
                  key={task.id}
                  style={{
                    opacity: scrollY.interpolate({
                      inputRange: [200 + index * 50, 250 + index * 50],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                    transform: [
                      {
                        translateY: scrollY.interpolate({
                          inputRange: [200 + index * 50, 250 + index * 50],
                          outputRange: [20, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  }}
                >
                  <TaskCard
                    task={task}
                    onPress={() => handleTaskPress(task)}
                    onComplete={() => handleCompleteTask(task.id)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Family Activity */}
        {family && family.memberIds.length > 1 && (
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Family Activity</Text>
            <View style={styles.activityList}>
              <Text style={styles.activityPlaceholder}>
                Activity feed coming soon...
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating Action Button with scale animation */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleCreateTask}
          activeOpacity={0.8}
          testID="create-task-fab"
          accessibilityLabel="Create new task"
          accessibilityRole="button"
        >
          <Feather name="plus" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </Animated.View>

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

export default ParallaxDashboardScreen;