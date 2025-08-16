/**
 * Family Dashboard Screen
 * Shows collective progress and celebrations
 * Focus: Collaboration and support, NOT competition
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { selectCurrentFamily } from '../../store/slices/familySlice';
import { selectFamilyAchievements, selectCelebrations } from '../../store/slices/gamificationSlice';
import { useHaptics } from '../../utils/haptics';
import { soundService } from '../../services/soundService';
import CollectiveProgress from '../../components/family/CollectiveProgress';
import CelebrationFeed from '../../components/family/CelebrationFeed';
import SupportSystem from '../../components/family/SupportSystem';
import FamilyStreak from '../../components/family/FamilyStreak';
import EncouragementPrompt from '../../components/family/EncouragementPrompt';

const FamilyDashboard: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const haptics = useHaptics();
  const family = useSelector(selectCurrentFamily);
  const familyAchievements = useSelector(selectFamilyAchievements);
  const celebrations = useSelector(selectCelebrations);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'celebrate' | 'support'>('progress');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load family data, achievements, celebrations
      // This would connect to your services
      await Promise.all([
        // Load family members progress
        // Load recent celebrations
        // Load support messages
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptics.selection();
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    haptics.selection();
    soundService.play('button_tap');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading family dashboard...</Text>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={64}
          color={theme.colors.textTertiary}
        />
        <Text style={styles.emptyTitle}>No Family Yet</Text>
        <Text style={styles.emptyText}>
          Create or join a family to see collective progress
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateFamily' as never)}
        >
          <Text style={styles.createButtonText}>Create Family</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{family.name} Dashboard</Text>
        <Text style={styles.subtitle}>Together We Grow</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          onPress={() => handleTabChange('progress')}
        >
          <MaterialCommunityIcons
            name="chart-line"
            size={20}
            color={activeTab === 'progress' ? theme.colors.primary : theme.colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
            Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'celebrate' && styles.activeTab]}
          onPress={() => handleTabChange('celebrate')}
        >
          <MaterialCommunityIcons
            name="party-popper"
            size={20}
            color={activeTab === 'celebrate' ? theme.colors.primary : theme.colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'celebrate' && styles.activeTabText]}>
            Celebrate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'support' && styles.activeTab]}
          onPress={() => handleTabChange('support')}
        >
          <MaterialCommunityIcons
            name="heart-multiple"
            size={20}
            color={activeTab === 'support' ? theme.colors.primary : theme.colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>
            Support
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'progress' && (
          <View style={styles.tabContent}>
            {/* Family Streak */}
            <FamilyStreak familyId={family.id} />

            {/* Collective Progress */}
            <CollectiveProgress familyId={family.id} />

            {/* Weekly Summary */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="calendar-week"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>This Week Together</Text>
              </View>
              <View style={styles.weekStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>142</Text>
                  <Text style={styles.statLabel}>Tasks Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>5</Text>
                  <Text style={styles.statLabel}>Achievements</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>98%</Text>
                  <Text style={styles.statLabel}>Completion Rate</Text>
                </View>
              </View>
            </View>

            {/* Encouragement Prompt */}
            <EncouragementPrompt />
          </View>
        )}

        {activeTab === 'celebrate' && (
          <View style={styles.tabContent}>
            {/* Celebration Feed */}
            <CelebrationFeed celebrations={celebrations} />

            {/* Recent Achievements */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>Recent Family Achievements</Text>
              </View>
              {Object.values(familyAchievements).filter(a => a.unlockedAt).length > 0 ? (
                Object.values(familyAchievements)
                  .filter(a => a.unlockedAt)
                  .slice(0, 3)
                  .map((achievement, index) => (
                    <View key={index} style={styles.achievementItem}>
                      <MaterialCommunityIcons
                        name="star"
                        size={20}
                        color="#FFD700"
                      />
                      <Text style={styles.achievementText}>
                        {achievement.achievementId} unlocked!
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.emptyStateText}>
                  Keep working together to unlock achievements!
                </Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'support' && (
          <View style={styles.tabContent}>
            {/* Support System */}
            <SupportSystem familyId={family.id} />

            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Support Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickAction}>
                  <MaterialCommunityIcons
                    name="heart"
                    size={32}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.quickActionText}>Send Love</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <MaterialCommunityIcons
                    name="hand-clap"
                    size={32}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.quickActionText}>Applaud</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <MaterialCommunityIcons
                    name="arm-flex"
                    size={32}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.quickActionText}>Motivate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.M,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.XL,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.M,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.S,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.L,
    paddingVertical: theme.spacing.S,
    borderRadius: 24,
    marginTop: theme.spacing.L,
  },
  createButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  header: {
    padding: theme.spacing.M,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.M,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.S,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.inputBackground,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginLeft: 6,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.M,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.M,
    marginBottom: theme.spacing.M,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.M,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.S,
  },
  achievementText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.M,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.M,
  },
  quickAction: {
    alignItems: 'center',
    padding: theme.spacing.S,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

export default FamilyDashboard;