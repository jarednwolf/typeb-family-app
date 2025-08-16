import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUserProfile } from '../../store/slices/authSlice';
import { selectTasks, fetchFamilyTasks } from '../../store/slices/tasksSlice';
import { selectFamily, selectFamilyMembers } from '../../store/slices/familySlice';
import { LoadingState } from '../../components/common/LoadingState';
import { useTheme } from '../../contexts/ThemeContext';
import QuickApprovalCard from '../../components/tasks/QuickApprovalCard';
import ChildTaskGrid from '../../components/tasks/ChildTaskGrid';
import AccountabilityMetrics from '../../components/analytics/AccountabilityMetrics';
import PhotoVerificationQueue from '../../components/tasks/PhotoVerificationQueue';
import StreakDisplay from '../../components/engagement/StreakDisplay';
import ProgressRing from '../../components/engagement/ProgressRing';

const { width: screenWidth } = Dimensions.get('window');

interface ChildAccountability {
  childId: string;
  name: string;
  avatar: string;
  todayTotal: number;
  todayCompleted: number;
  pendingVerification: number;
  currentStreak: number;
  completionRate: number;
  lastActivity: Date | null;
  overdueCount: number;
}

export const ParentDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useTheme();
  
  // Redux state
  const userProfile = useAppSelector(selectUserProfile);
  const tasks = useAppSelector(selectTasks);
  const family = useAppSelector(selectFamily);
  const familyMembers = useAppSelector(selectFamilyMembers);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showAllChildren, setShowAllChildren] = useState(true);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  
  // Filter for children only
  const children = useMemo(() => {
    return familyMembers.filter(member => member.role === 'child');
  }, [familyMembers]);
  
  // Calculate tasks pending verification
  const pendingVerificationTasks = useMemo(() => {
    return tasks.filter(task => 
      task.status === 'completed' && 
      task.requiresPhoto && 
      task.photoUrl &&
      (!task.validationStatus || task.validationStatus === 'pending')
    );
  }, [tasks]);
  
  // Calculate accountability metrics for each child
  const childrenAccountability = useMemo((): ChildAccountability[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return children.map(child => {
      // Get all tasks for this child
      const childTasks = tasks.filter(t => t.assignedTo === child.id);
      
      // Today's tasks
      const todayTasks = childTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });
      
      // Completed today tasks
      const completedToday = todayTasks.filter(t => t.status === 'completed');
      
      // Pending verification for this child
      const pendingVerification = childTasks.filter(task =>
        task.status === 'completed' && 
        task.requiresPhoto && 
        task.photoUrl &&
        (!task.validationStatus || task.validationStatus === 'pending')
      );
      
      // Overdue tasks
      const overdueTasks = childTasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
      });
      
      // Calculate streak
      const streak = calculateStreak(childTasks);
      
      // Calculate overall completion rate (last 7 days)
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentTasks = childTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= sevenDaysAgo && dueDate < today;
      });
      const recentCompleted = recentTasks.filter(t => t.status === 'completed');
      const completionRate = recentTasks.length > 0 
        ? Math.round((recentCompleted.length / recentTasks.length) * 100)
        : 0;
      
      // Get last activity
      const lastCompletedTask = childTasks
        .filter(t => t.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
      
      return {
        childId: child.id,
        name: child.displayName || 'Unknown',
        avatar: child.displayName?.charAt(0).toUpperCase() || '?',
        todayTotal: todayTasks.length,
        todayCompleted: completedToday.length,
        pendingVerification: pendingVerification.length,
        currentStreak: streak,
        completionRate,
        lastActivity: lastCompletedTask?.completedAt ? new Date(lastCompletedTask.completedAt) : null,
        overdueCount: overdueTasks.length,
      };
    });
  }, [children, tasks]);
  
  // Calculate family accountability score
  const familyAccountabilityScore = useMemo(() => {
    if (childrenAccountability.length === 0) return 0;
    
    const totalTodayTasks = childrenAccountability.reduce((sum, child) => sum + child.todayTotal, 0);
    const totalCompleted = childrenAccountability.reduce((sum, child) => sum + child.todayCompleted, 0);
    
    if (totalTodayTasks === 0) return 100;
    return Math.round((totalCompleted / totalTodayTasks) * 100);
  }, [childrenAccountability]);
  
  // Calculate best family streak
  const bestFamilyStreak = useMemo(() => {
    if (childrenAccountability.length === 0) return 0;
    return Math.max(...childrenAccountability.map(c => c.currentStreak), 0);
  }, [childrenAccountability]);
  
  // Helper function to calculate streak
  const calculateStreak = (childTasks: any[]): number => {
    const completedTasks = childTasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (completedTasks.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    const uniqueDays = new Set<string>();
    
    for (const task of completedTasks) {
      const taskDate = new Date(task.completedAt);
      const dateKey = `${taskDate.getFullYear()}-${taskDate.getMonth()}-${taskDate.getDate()}`;
      uniqueDays.add(dateKey);
    }
    
    // Check consecutive days from today backwards
    while (true) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      if (uniqueDays.has(dateKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Check if we're still on today and no tasks completed today
        if (streak === 0 && currentDate.getTime() === today.getTime()) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    
    return streak;
  };
  
  // Load initial data
  useEffect(() => {
    loadDashboardData();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const loadDashboardData = async () => {
    if (!family?.id || !userProfile?.id) return;
    
    try {
      setLoading(true);
      await dispatch(fetchFamilyTasks({
        familyId: family.id,
        userId: userProfile.id,
      })).unwrap();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);
  
  const handleChildSelect = (childId: string) => {
    setSelectedChildId(selectedChildId === childId ? null : childId);
    setShowAllChildren(false);
  };
  
  const handleApproveTask = async (taskId: string) => {
    // Implementation will be added when we create the validation action
    console.log('Approving task:', taskId);
  };
  
  const handleRejectTask = async (taskId: string) => {
    // Implementation will be added when we create the validation action
    console.log('Rejecting task:', taskId);
  };
  
  // Get greeting based on time of day
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = userProfile?.displayName || 'there';
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }, [userProfile]);
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  if (loading) {
    return <LoadingState variant="spinner" />;
  }
  
  const displayedChildren = showAllChildren 
    ? childrenAccountability 
    : childrenAccountability.filter(c => c.childId === selectedChildId);
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextSection}>
                <Text style={styles.greeting}>{getGreeting}</Text>
                <Text style={styles.subtitle}>
                  Family Accountability Dashboard
                </Text>
              </View>
              {bestFamilyStreak > 0 && (
                <View style={styles.streakContainer}>
                  <StreakDisplay
                    streak={bestFamilyStreak}
                    style={styles.streakDisplay}
                  />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            >
              <Feather name="settings" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Family Accountability Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreTitle}>Today's Accountability</Text>
                <View style={styles.scoreValue}>
                  <Text style={styles.scoreNumber}>{familyAccountabilityScore}%</Text>
                  {familyAccountabilityScore >= 80 && (
                    <Feather name="trending-up" size={20} color={theme.colors.success} />
                  )}
                </View>
              </View>
              <View style={styles.progressRingContainer}>
                <ProgressRing
                  percentage={familyAccountabilityScore}
                  size="medium"
                />
              </View>
            </View>
            {pendingVerificationTasks.length > 0 && (
              <TouchableOpacity 
                style={styles.pendingAlert}
                onPress={() => navigation.navigate('PhotoValidation')}
              >
                <Feather name="alert-circle" size={16} color={theme.colors.warning} />
                <Text style={styles.pendingAlertText}>
                  {pendingVerificationTasks.length} tasks awaiting photo verification
                </Text>
                <Feather name="chevron-right" size={16} color={theme.colors.warning} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Quick Actions */}
          {pendingVerificationTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Approvals</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PhotoValidation')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <PhotoVerificationQueue
                tasks={pendingVerificationTasks.slice(0, 3)}
                onApprove={handleApproveTask}
                onReject={handleRejectTask}
              />
            </View>
          )}
          
          {/* Children Accountability Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Children's Progress</Text>
              <TouchableOpacity onPress={() => setShowAllChildren(!showAllChildren)}>
                <Text style={styles.viewAllText}>
                  {showAllChildren ? 'Hide' : 'Show All'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Child Filter Pills */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.childFilterContainer}
            >
              <TouchableOpacity
                style={[styles.childPill, showAllChildren && styles.childPillActive]}
                onPress={() => setShowAllChildren(true)}
              >
                <Text style={[styles.childPillText, showAllChildren && styles.childPillTextActive]}>
                  All Children
                </Text>
              </TouchableOpacity>
              {childrenAccountability.map(child => (
                <TouchableOpacity
                  key={child.childId}
                  style={[
                    styles.childPill,
                    selectedChildId === child.childId && styles.childPillActive
                  ]}
                  onPress={() => handleChildSelect(child.childId)}
                >
                  <View style={styles.childPillContent}>
                    <View style={styles.miniAvatar}>
                      <Text style={styles.miniAvatarText}>{child.avatar}</Text>
                    </View>
                    <Text style={[
                      styles.childPillText,
                      selectedChildId === child.childId && styles.childPillTextActive
                    ]}>
                      {child.name}
                    </Text>
                    {child.pendingVerification > 0 && (
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillBadgeText}>{child.pendingVerification}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <ChildTaskGrid
              children={displayedChildren}
              onChildPress={(childId) => navigation.navigate('ChildTasks', { childId })}
            />
          </View>
          
          {/* Accountability Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habit Formation Tracking</Text>
            <AccountabilityMetrics
              children={childrenAccountability}
              tasks={tasks}
            />
          </View>
          
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="users" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{children.length}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="check-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statNumber}>
                {childrenAccountability.reduce((sum, c) => sum + c.todayCompleted, 0)}
              </Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="camera" size={24} color={theme.colors.warning} />
              <Text style={styles.statNumber}>{pendingVerificationTasks.length}</Text>
              <Text style={styles.statLabel}>Need Review</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="zap" size={24} color={theme.colors.info} />
              <Text style={styles.statNumber}>
                {Math.max(...childrenAccountability.map(c => c.currentStreak), 0)}
              </Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.M,
  },
  headerTextSection: {
    flex: 1,
  },
  streakContainer: {
    marginRight: theme.spacing.S,
  },
  streakDisplay: {
    transform: [{ scale: 0.8 }],
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingsButton: {
    padding: theme.spacing.XS,
  },
  scoreCard: {
    marginHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.L,
    padding: theme.spacing.L,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    ...theme.shadows.medium,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTextContainer: {
    flex: 1,
  },
  progressRingContainer: {
    marginLeft: theme.spacing.M,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.M,
    padding: theme.spacing.S,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.S,
  },
  pendingAlertText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  section: {
    marginBottom: theme.spacing.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.M,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  childFilterContainer: {
    paddingHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.M,
  },
  childPill: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    backgroundColor: theme.colors.backgroundTexture,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.S,
  },
  childPillActive: {
    backgroundColor: theme.colors.primary,
  },
  childPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.XS,
  },
  childPillText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  childPillTextActive: {
    color: theme.colors.white,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  pillBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  pillBadgeText: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.L,
    gap: theme.spacing.M,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - theme.spacing.L * 2 - theme.spacing.M) / 2,
    padding: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.S,
    marginBottom: theme.spacing.XXS,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default ParentDashboard;