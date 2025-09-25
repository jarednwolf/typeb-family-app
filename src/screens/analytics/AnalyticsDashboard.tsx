import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/common/Card';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { fetchTaskStats, selectTaskStats, selectTasks } from '../../store/slices/tasksSlice';
import { selectFamilyMembers } from '../../store/slices/familySlice';
import { useTheme } from '../../contexts/ThemeContext';
import smartNotifications from '../../services/smartNotifications';
import EmptyState from '../../components/common/EmptyState';

const { width: screenWidth } = Dimensions.get('window');

interface MemberStats {
  id: string;
  name: string;
  avatar: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  averageCompletionTime: number;
  points: number;
  streak: number;
}

interface CategoryStats {
  name: string;
  color: string;
  icon: string;
  count: number;
  percentage: number;
}

interface TrendData {
  label: string;
  value: number;
}

// Helper function to calculate streak
const calculateStreak = (completedTasks: any[]): number => {
  if (completedTasks.length === 0) return 0;
  
  const sortedTasks = completedTasks
    .filter(t => t.completedAt)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  if (sortedTasks.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentDate = new Date(today);
  
  for (const task of sortedTasks) {
    const taskDate = new Date(task.completedAt);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (taskDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
};

const AnalyticsDashboard: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  const familyMembers = useSelector(selectFamilyMembers);
  const tasks = useSelector(selectTasks);
  const taskStats = useSelector(selectTaskStats);
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  
  // Calculate member statistics
  const memberStats = useMemo((): MemberStats[] => {
    return familyMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo === member.id);
      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      const totalPoints = completedTasks.reduce((sum, t) => sum + (t.points || 0), 0);
      
      // Calculate average completion time
      let totalTime = 0;
      let timeCount = 0;
      completedTasks.forEach(task => {
        if (task.completedAt && task.createdAt) {
          const time = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
          totalTime += time;
          timeCount++;
        }
      });
      
      // Calculate streak (consecutive days with completed tasks)
      const streak = calculateStreak(completedTasks);
      
      return {
        id: member.id,
        name: member.displayName || 'Unknown',
        avatar: member.displayName?.charAt(0).toUpperCase() || '?',
        tasksCompleted: completedTasks.length,
        tasksAssigned: memberTasks.length,
        completionRate: memberTasks.length > 0 
          ? Math.round((completedTasks.length / memberTasks.length) * 100)
          : 0,
        averageCompletionTime: timeCount > 0 
          ? Math.round(totalTime / timeCount / (1000 * 60 * 60)) // hours
          : 0,
        points: totalPoints,
        streak,
      };
    }).sort((a, b) => b.points - a.points); // Sort by points
  }, [familyMembers, tasks]);
  
  // Calculate category statistics
  const categoryStats = useMemo((): CategoryStats[] => {
    const categoryMap = new Map<string, CategoryStats>();
    
    tasks.forEach(task => {
      const category = task.category;
      if (category) {
        const key = category.name;
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            name: category.name,
            color: category.color || '#6B7280',
            icon: category.icon || '📋',
            count: 0,
            percentage: 0,
          });
        }
        const stat = categoryMap.get(key)!;
        stat.count++;
      }
    });
    
    const total = tasks.length;
    const stats = Array.from(categoryMap.values());
    
    // Calculate percentages
    stats.forEach(stat => {
      stat.percentage = total > 0 ? Math.round((stat.count / total) * 100) : 0;
    });
    
    return stats.sort((a, b) => b.count - a.count);
  }, [tasks]);
  
  // Calculate weekly trend data
  const trendData = useMemo((): TrendData[] => {
    const now = new Date();
    const data: TrendData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });
      
      data.push({
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        value: dayTasks.length,
      });
    }
    
    return data;
  }, [tasks]);
  
  useEffect(() => {
    loadData();
  }, [family, userProfile]);
  
  const loadData = async () => {
    if (!family?.id || !userProfile?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch task stats
      await dispatch(fetchTaskStats({
        familyId: family.id,
        userId: userProfile.id,
      })).unwrap();
      
      // Get smart insights if premium
      if (family.isPremium) {
        const insightsData = await smartNotifications.getTaskInsights(family.id);
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);
  
  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  );
  
  const renderMemberCard = (member: MemberStats, index: number) => (
    <Card key={member.id} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberRank}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{member.avatar}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <View style={styles.memberBadges}>
            {member.streak > 0 && (
              <View style={styles.streakBadge}>
                <Feather name="zap" size={12} color={theme.colors.warning} />
                <Text style={styles.streakText}>{member.streak}d</Text>
              </View>
            )}
            <View style={styles.pointsBadge}>
              <Feather name="star" size={12} color={theme.colors.primary} />
              <Text style={styles.pointsText}>{member.points}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.memberStats}>
        <View style={styles.memberStat}>
          <Text style={styles.memberStatValue}>{member.tasksCompleted}</Text>
          <Text style={styles.memberStatLabel}>Completed</Text>
        </View>
        <View style={styles.memberStat}>
          <Text style={styles.memberStatValue}>{member.completionRate}%</Text>
          <Text style={styles.memberStatLabel}>Rate</Text>
        </View>
        <View style={styles.memberStat}>
          <Text style={styles.memberStatValue}>{member.averageCompletionTime}h</Text>
          <Text style={styles.memberStatLabel}>Avg Time</Text>
        </View>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${member.completionRate}%`,
              backgroundColor: member.completionRate >= 80 
                ? theme.colors.success 
                : member.completionRate >= 50 
                  ? theme.colors.warning 
                  : theme.colors.error
            }
          ]} 
        />
      </View>
    </Card>
  );
  
  const renderCategoryChart = () => (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Tasks by Category</Text>
      <View style={styles.categoryChart}>
        {categoryStats.slice(0, 5).map((category, index) => (
          <View key={index} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <View style={styles.categoryBarContainer}>
              <View 
                style={[
                  styles.categoryBar,
                  { 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }
                ]}
              />
              <Text style={styles.categoryCount}>{category.count}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
  
  const renderTrendChart = () => (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Weekly Completion Trend</Text>
      <View style={styles.trendChart}>
        {trendData.map((day, index) => {
          const maxValue = Math.max(...trendData.map(d => d.value), 1);
          const height = (day.value / maxValue) * 100;
          
          return (
            <View key={index} style={styles.trendBar}>
              <View style={styles.trendBarContainer}>
                <View 
                  style={[
                    styles.trendBarFill,
                    { 
                      height: `${height}%`,
                      backgroundColor: theme.colors.primary,
                    }
                  ]}
                />
              </View>
              <Text style={styles.trendLabel}>{day.label}</Text>
              <Text style={styles.trendValue}>{day.value}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
  
  const renderInsights = () => {
    if (!insights) return null;
    
    return (
      <Card style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <Feather name="trending-up" size={20} color={theme.colors.primary} />
          <Text style={styles.insightsTitle}>Smart Insights</Text>
        </View>
        
        {insights.recommendations.map((recommendation: string, index: number) => (
          <View key={index} style={styles.insightItem}>
            <Feather name="info" size={16} color={theme.colors.warning} />
            <Text style={styles.insightText}>{recommendation}</Text>
          </View>
        ))}
        
        <View style={styles.insightStats}>
          <Text style={styles.insightStatText}>
            {insights.overdueCount} overdue • {insights.upcomingCount} upcoming
          </Text>
        </View>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  // Empty state when there are no tasks yet
  if ((tasks?.length || 0) === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="bar-chart-2"
          title="No Data Yet"
          message="Create and complete tasks to see analytics and insights here."
        />
      </SafeAreaView>
    );
  }
  
  return (
    <PremiumGate 
      feature="Advanced Analytics"
      featureName="Advanced Analytics"
      showUpgradePrompt={true}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            {renderStatCard('Total Tasks', taskStats.total, 'clipboard', theme.colors.primary)}
            {renderStatCard('Completed', taskStats.completed, 'check-circle', theme.colors.success)}
            {renderStatCard('Pending', taskStats.pending, 'clock', theme.colors.warning)}
            {renderStatCard('Completion', `${taskStats.completionRate}%`, 'trending-up', theme.colors.info)}
          </View>
          
          {/* Smart Insights (Premium) */}
          {insights && renderInsights()}
          
          {/* Member Leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Performance</Text>
            {memberStats.map((member, index) => renderMemberCard(member, index))}
          </View>
          
          {/* Category Distribution */}
          {renderCategoryChart()}
          
          {/* Weekly Trend */}
          {renderTrendChart()}
        </ScrollView>
      </SafeAreaView>
    </PremiumGate>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.XXL,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: spacing.L,
    gap: spacing.S,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.colors.backgroundTexture,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  periodTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.L,
    gap: spacing.M,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - spacing.L * 2 - spacing.M) / 2,
    padding: spacing.M,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.S,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: spacing.XXS,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: spacing.L,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  memberCard: {
    padding: spacing.M,
    marginBottom: spacing.M,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.M,
  },
  memberRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.S,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.M,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.XXS,
  },
  memberBadges: {
    flexDirection: 'row',
    gap: spacing.S,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: spacing.S,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    gap: 2,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: spacing.S,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    gap: 2,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.M,
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  memberStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.backgroundTexture,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartCard: {
    marginHorizontal: spacing.L,
    marginBottom: spacing.L,
    padding: spacing.L,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  categoryChart: {
    gap: spacing.M,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
    flex: 0.4,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  categoryBarContainer: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  categoryBar: {
    height: 20,
    borderRadius: borderRadius.small,
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    minWidth: 20,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarContainer: {
    width: '60%',
    height: 100,
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: borderRadius.small,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: spacing.XS,
  },
  trendValue: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  insightsCard: {
    marginHorizontal: spacing.L,
    marginBottom: spacing.L,
    padding: spacing.L,
    backgroundColor: isDarkMode ? theme.colors.info + '10' : theme.colors.info + '05',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
    marginBottom: spacing.M,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.S,
    marginBottom: spacing.S,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  insightStats: {
    marginTop: spacing.S,
    paddingTop: spacing.S,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  insightStatText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});

export default AnalyticsDashboard;