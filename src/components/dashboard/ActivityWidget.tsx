/**
 * Activity Widget Component
 * Shows recent social activity in the family
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { SocialActivity, ActivityType } from '../../services/socialIntegration';
import * as socialService from '../../services/socialIntegration';
import { useSelector } from 'react-redux';
import { selectFamily } from '../../store/slices/familySlice';

interface ActivityWidgetProps {
  onSeeAll?: () => void;
  maxItems?: number;
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  onSeeAll,
  maxItems = 5,
}) => {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const family = useSelector(selectFamily);

  useEffect(() => {
    loadActivities();
  }, [family]);

  const loadActivities = async () => {
    if (!family?.id) return;
    
    try {
      setIsLoading(true);
      const activityFeed = await socialService.getActivityFeed(family.id, maxItems);
      setActivities(activityFeed);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
      task_completed: 'check-circle',
      task_commented: 'message-circle',
      task_reacted: 'heart',
      achievement_unlocked: 'award',
      celebration_created: 'gift',
      goal_reached: 'target',
      announcement_posted: 'radio',
      event_created: 'calendar',
      chat_message: 'message-square',
      member_joined: 'user-plus',
      milestone_reached: 'flag',
    };
    return icons[type] || 'activity';
  };

  const getActivityColor = (type: ActivityType): string => {
    if (type.includes('completed') || type.includes('reached')) return colors.success;
    if (type.includes('achievement') || type.includes('celebration')) return colors.warning;
    if (type.includes('commented') || type.includes('message')) return colors.info;
    return colors.primary;
  };

  const renderActivity = (activity: SocialActivity) => {
    const timeAgo = format(activity.timestamp, 'HH:mm');
    const icon = getActivityIcon(activity.type);
    const color = getActivityColor(activity.type);

    return (
      <TouchableOpacity key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon as any} size={16} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText} numberOfLines={2}>
            <Text style={styles.activityActor}>{activity.actorName}</Text>
            {' '}
            {activity.content || activity.targetTitle || 'had an activity'}
          </Text>
          <Text style={styles.activityTime}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="activity" size={18} color={colors.primary} />
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={24} color={colors.gray300} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.activityList}
          showsVerticalScrollIndicator={false}
        >
          {activities.map(renderActivity)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
  },
  activityList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  activityActor: {
    ...typography.captionSemibold,
    color: colors.text,
  },
  activityTime: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: 2,
    fontSize: 11,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
});

export default ActivityWidget;