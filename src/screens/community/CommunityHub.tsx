/**
 * Community Hub Screen
 * 
 * Central hub for all family community features
 * Promotes family unity and collaboration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { communityService } from '../../services/community';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen: string;
  badge?: number;
}

interface ActivityItem {
  id: string;
  type: 'announcement' | 'event' | 'goal' | 'planning';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
  data: any;
}

export const CommunityHub: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { currentFamily } = useSelector((state: RootState) => state.family);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<any>({});
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    loadData();
  }, [currentFamily]);

  const loadData = async () => {
    if (!currentFamily) return;
    
    setLoading(true);
    try {
      // Load activity feed
      const feed = await communityService.getActivityFeed(currentFamily.id, 10);
      setActivities(feed);

      // Load upcoming items
      const upcoming = await communityService.getUpcomingItems(currentFamily.id);
      setUpcomingItems(upcoming);

      // Set up quick actions with badges
      setQuickActions([
        {
          id: 'announcements',
          title: 'Announcements',
          icon: 'megaphone',
          color: '#2196F3',
          screen: 'Announcements',
          badge: upcoming.unreadAnnouncements
        },
        {
          id: 'calendar',
          title: 'Calendar',
          icon: 'calendar',
          color: '#9C27B0',
          screen: 'FamilyCalendar',
          badge: upcoming.nextEvent ? 1 : 0
        },
        {
          id: 'goals',
          title: 'Goals',
          icon: 'trophy',
          color: '#4CAF50',
          screen: 'FamilyGoals',
          badge: upcoming.activeGoal ? 1 : 0
        },
        {
          id: 'planning',
          title: 'Planning',
          icon: 'clipboard',
          color: '#FF9800',
          screen: 'PlanningSession',
          badge: upcoming.activeSession ? 1 : 0
        }
      ]);
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToScreen = (screen: string, params?: any) => {
    (navigation as any).navigate(screen, params);
  };

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickAction, { backgroundColor: action.color + '20' }]}
      onPress={() => navigateToScreen(action.screen)}
      testID={`community-action-${action.id}`}
    >
      <View style={styles.quickActionContent}>
        <Ionicons name={action.icon as any} size={32} color={action.color} />
        {action.badge && action.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: action.color }]}>
            <Text style={styles.badgeText}>{action.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.quickActionText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  const renderActivityItem = (item: ActivityItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.activityItem, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
      onPress={() => {
        // Navigate to appropriate screen based on type
        switch (item.type) {
          case 'announcement':
            navigateToScreen('AnnouncementDetail', { announcement: item.data });
            break;
          case 'event':
            navigateToScreen('EventDetail', { event: item.data });
            break;
          case 'goal':
            navigateToScreen('GoalDetail', { goal: item.data });
            break;
          case 'planning':
            navigateToScreen('PlanningDetail', { session: item.data });
            break;
        }
      }}
    >
      <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={{ fontSize: 24 }}>{item.icon}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
          {item.title}
        </Text>
        <Text style={[styles.activityDescription, { color: isDarkMode ? '#FFFFFF80' : '#00000080' }]}> 
          {item.description}
        </Text>
        <Text style={[styles.activityTime, { color: isDarkMode ? '#FFFFFF60' : '#00000060' }]}> 
          {format(item.timestamp, 'MMM d, h:mm a')}
        </Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={isDarkMode ? '#FFFFFF40' : '#00000040'}
      />
    </TouchableOpacity>
  );

  const renderUpcomingSection = () => {
    if (!upcomingItems.nextEvent && !upcomingItems.activeGoal && !upcomingItems.activeSession) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
          📌 Coming Up
        </Text>
        
        {upcomingItems.nextEvent && (
          <TouchableOpacity
            style={[styles.upcomingCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigateToScreen('EventDetail', { event: upcomingItems.nextEvent })}
          >
            <Text style={[styles.upcomingLabel, { color: theme.colors.primary }]}>
              Next Event
            </Text>
            <Text style={[styles.upcomingTitle, { color: theme.colors.textPrimary }]}> 
              {upcomingItems.nextEvent.title}
            </Text>
            <Text style={[styles.upcomingTime, { color: theme.colors.textSecondary }]}> 
              {format(upcomingItems.nextEvent.startDate, 'MMM d, h:mm a')}
            </Text>
          </TouchableOpacity>
        )}

        {upcomingItems.activeGoal && (
          <TouchableOpacity
            style={[styles.upcomingCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigateToScreen('GoalDetail', { goal: upcomingItems.activeGoal })}
          >
            <Text style={[styles.upcomingLabel, { color: '#4CAF50' }]}>
              Active Goal
            </Text>
            <Text style={[styles.upcomingTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
              {upcomingItems.activeGoal.title}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${upcomingItems.activeGoal.progress}%`,
                    backgroundColor: '#4CAF50'
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: isDarkMode ? '#FFFFFF80' : '#00000080' }]}> 
              {upcomingItems.activeGoal.progress}% Complete
            </Text>
          </TouchableOpacity>
        )}

        {upcomingItems.activeSession && (
          <TouchableOpacity
            style={[styles.upcomingCard, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={() => navigateToScreen('PlanningDetail', { session: upcomingItems.activeSession })}
          >
            <Text style={[styles.upcomingLabel, { color: '#FF9800' }]}>
              Active Planning
            </Text>
            <Text style={[styles.upcomingTitle, { color: theme.colors.textPrimary }]}> 
              {upcomingItems.activeSession.title}
            </Text>
            <Text style={[styles.upcomingTime, { color: isDarkMode ? '#FFFFFF80' : '#00000080' }]}> 
              {upcomingItems.activeSession.votingDeadline 
                ? `Voting ends ${format(upcomingItems.activeSession.votingDeadline, 'MMM d')}`
                : 'Open for suggestions'
              }
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
          🏡 Community Hub
        </Text>
        <TouchableOpacity
          onPress={() => navigateToScreen('CommunitySettings')}
          testID="community-settings-button"
        >
          <Ionicons name="settings-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Upcoming Section */}
        {renderUpcomingSection()}

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}> 
            📊 Recent Activity
          </Text>
          {activities.length > 0 ? (
            activities.map(renderActivityItem)
          ) : (
            <View style={[styles.emptyState, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}> 
              <Text style={[styles.emptyStateText, { color: isDarkMode ? '#FFFFFF60' : '#00000060' }]}> 
                No recent activity
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#FFFFFF40' : '#00000040' }]}> 
                Start by creating an announcement or planning session
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  quickAction: {
    width: '45%',
    marginHorizontal: '2.5%',
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickActionContent: {
    position: 'relative',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upcomingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  upcomingLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  upcomingTime: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});