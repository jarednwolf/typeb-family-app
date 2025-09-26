/**
 * Profile Screen
 * Enhanced user profile with achievements, stats, and activity
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { RootState, AppDispatch } from '../../store/store';
import { selectUserProfile } from '../../store/slices/authSlice';
import { selectFamily } from '../../store/slices/familySlice';
import { Achievement, UserAchievement, StreakData } from '../../types/achievements';
import AchievementBadge from '../../components/celebrations/AchievementBadge';
import * as celebrationService from '../../services/celebrations';
import * as socialService from '../../services/socialIntegration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileStats {
  tasksCompleted: number;
  achievementsUnlocked: number;
  currentStreak: number;
  bestStreak: number;
  reactionsGiven: number;
  reactionsReceived: number;
  helpfulActions: number;
  contributionScore: number;
}

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const currentUser = useSelector(selectUserProfile);
  const family = useSelector(selectFamily);
  
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'stats' | 'activity'>('achievements');

  useEffect(() => {
    loadProfileData();
  }, [currentUser]);

  const loadProfileData = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Load achievements
      const userAchievements = await celebrationService.getUserAchievements(currentUser.id);
      setAchievements(userAchievements);
      
      // Load stats (mock data for now)
      const mockStats: ProfileStats = {
        tasksCompleted: 156,
        achievementsUnlocked: userAchievements.length,
        currentStreak: 7,
        bestStreak: 14,
        reactionsGiven: 42,
        reactionsReceived: 38,
        helpfulActions: 15,
        contributionScore: 850,
      };
      setStats(mockStats);
      
      // Load streak data (mock)
      const mockStreak: StreakData = {
        userId: currentUser.id,
        streakType: 'daily',
        current: 7,
        best: 14,
        startDate: new Date(Date.now() - 7 * 86400000),
        lastActiveDate: new Date(),
        freezesAvailable: 3,
        freezesUsed: 0,
      };
      setStreakData(mockStreak);
      
      // Load recent activity
      if (family) {
        const activities = await socialService.getActivityFeed(family.id, 10);
        setRecentActivity(activities.filter(a => a.actorId === currentUser.id));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfileData();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        {currentUser?.avatarUrl ? (
          <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Icon name="user" size={32} color={colors.gray400} />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{currentUser?.displayName || 'User'}</Text>
          <Text style={styles.userRole}>
            {currentUser?.role === 'parent' ? 'Parent' : 'Child'} • {family?.name}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <Icon name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Streak Display */}
      {streakData && (
        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Icon name="zap" size={20} color={colors.warning} />
            <Text style={styles.streakValue}>{streakData.current}</Text>
            <Text style={styles.streakLabel}>Current</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Icon name="trophy" size={20} color={colors.success} />
            <Text style={styles.streakValue}>{streakData.best}</Text>
            <Text style={styles.streakLabel}>Best</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Icon name="shield" size={20} color={colors.info} />
            <Text style={styles.streakValue}>{streakData.freezesAvailable}</Text>
            <Text style={styles.streakLabel}>Freezes</Text>
          </View>
        </View>
      )}

      {/* Stats Overview */}
      {stats && (
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.achievementsUnlocked}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.contributionScore}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.helpfulActions}</Text>
            <Text style={styles.statLabel}>Helps</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
        onPress={() => setActiveTab('achievements')}
      >
        <Icon 
          name="award" 
          size={16} 
          color={activeTab === 'achievements' ? colors.primary : colors.gray500} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'achievements' && styles.tabTextActive
        ]}>
          Achievements
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
        onPress={() => setActiveTab('stats')}
      >
        <Icon 
          name="bar-chart-2" 
          size={16} 
          color={activeTab === 'stats' ? colors.primary : colors.gray500} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'stats' && styles.tabTextActive
        ]}>
          Stats
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
        onPress={() => setActiveTab('activity')}
      >
        <Icon 
          name="activity" 
          size={16} 
          color={activeTab === 'activity' ? colors.primary : colors.gray500} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'activity' && styles.tabTextActive
        ]}>
          Activity
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsContainer}>
      <Text style={styles.sectionTitle}>Your Achievements</Text>
      <View style={styles.achievementsGrid}>
        {achievements.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="award" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No achievements yet</Text>
            <Text style={styles.emptySubtext}>
              Complete tasks to unlock achievements!
            </Text>
          </View>
        ) : (
          achievements.map(achievement => (
            <AchievementBadge
              key={achievement.achievementId}
              achievement={{
                id: achievement.achievementId,
                name: 'Achievement',
                description: '',
                icon: 'star',
                category: 'milestone',
                level: 'bronze',
                requirement: { type: 'count', value: 1, unit: 'tasks' },
              } as Achievement}
              size="medium"
              showLabel
              animate
            />
          ))
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Detailed Statistics</Text>
      
      <View style={styles.statSection}>
        <Text style={styles.statSectionTitle}>Engagement</Text>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Reactions Given</Text>
          <Text style={styles.statRowValue}>{stats?.reactionsGiven || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Reactions Received</Text>
          <Text style={styles.statRowValue}>{stats?.reactionsReceived || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Helpful Actions</Text>
          <Text style={styles.statRowValue}>{stats?.helpfulActions || 0}</Text>
        </View>
      </View>

      <View style={styles.statSection}>
        <Text style={styles.statSectionTitle}>Performance</Text>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Tasks Completed</Text>
          <Text style={styles.statRowValue}>{stats?.tasksCompleted || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Current Streak</Text>
          <Text style={styles.statRowValue}>{stats?.currentStreak || 0} days</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Best Streak</Text>
          <Text style={styles.statRowValue}>{stats?.bestStreak || 0} days</Text>
        </View>
      </View>
    </View>
  );

  const renderActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentActivity.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="activity" size={48} color={colors.gray300} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        recentActivity.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="check" size={16} color={colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{activity.content}</Text>
              <Text style={styles.activityTime}>
                {format(activity.timestamp, 'MMM d, h:mm a')}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderTabs()}
        
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'activity' && renderActivity()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  editButton: {
    padding: spacing.sm,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.md,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    ...typography.h3,
    color: colors.text,
    marginVertical: 4,
  },
  streakLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  streakDivider: {
    width: 1,
    backgroundColor: colors.gray200,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.gray500,
    marginLeft: spacing.xs,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  achievementsContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statsContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statSection: {
    marginBottom: spacing.md,
  },
  statSectionTitle: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statRowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statRowValue: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  activityContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.body,
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    ...typography.caption,
    color: colors.gray500,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.bodySemibold,
    color: colors.gray700,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
});

export default ProfileScreen;