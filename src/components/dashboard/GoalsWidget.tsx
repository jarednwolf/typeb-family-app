/**
 * Goals Widget Component
 * Shows family goals progress on dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ProgressBarAndroid,
  Platform,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { FamilyGoal } from '../../types/community';
import { useSelector } from 'react-redux';
import { selectFamily } from '../../store/slices/familySlice';

interface GoalsWidgetProps {
  onGoalPress?: (goal: FamilyGoal) => void;
  onSeeAll?: () => void;
  maxGoals?: number;
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({
  onGoalPress,
  onSeeAll,
  maxGoals = 2,
}) => {
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const family = useSelector(selectFamily);

  useEffect(() => {
    loadFamilyGoals();
  }, [family]);

  const loadFamilyGoals = async () => {
    if (!family?.id) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual goals service call
      const mockGoals: FamilyGoal[] = [
        {
          id: '1',
          familyId: family.id,
          title: 'Complete 100 Tasks',
          description: 'Family goal to complete 100 tasks this month',
          category: 'tasks',
          targetValue: 100,
          currentValue: 67,
          startDate: new Date(Date.now() - 15 * 86400000), // 15 days ago
          endDate: new Date(Date.now() + 15 * 86400000), // 15 days from now
          status: 'active',
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          participants: ['user1', 'user2', 'user3'],
          rewards: ['Family Pizza Night', 'Movie Marathon'],
          milestones: [
            { value: 25, reached: true, reachedAt: new Date() },
            { value: 50, reached: true, reachedAt: new Date() },
            { value: 75, reached: false },
            { value: 100, reached: false },
          ],
        },
        {
          id: '2',
          familyId: family.id,
          title: 'Read 10 Books',
          description: 'Everyone reads at least 10 books this quarter',
          category: 'education',
          targetValue: 10,
          currentValue: 4,
          startDate: new Date(Date.now() - 30 * 86400000), // 30 days ago
          endDate: new Date(Date.now() + 60 * 86400000), // 60 days from now
          status: 'active',
          createdBy: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
          participants: ['user1', 'user2', 'user3', 'user4'],
          rewards: ['New Book Shopping'],
          milestones: [
            { value: 3, reached: true, reachedAt: new Date() },
            { value: 5, reached: false },
            { value: 8, reached: false },
            { value: 10, reached: false },
          ],
        },
      ];
      
      setGoals(mockGoals.slice(0, maxGoals));
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = (goal: FamilyGoal): number => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getGoalIcon = (category: string): string => {
    const icons: Record<string, string> = {
      tasks: 'check-square',
      education: 'book',
      health: 'heart',
      savings: 'dollar-sign',
      family: 'users',
      other: 'target',
    };
    return icons[category] || 'target';
  };

  const getGoalColor = (progress: number): string => {
    if (progress >= 75) return colors.success;
    if (progress >= 50) return colors.warning;
    if (progress >= 25) return colors.info;
    return colors.gray400;
  };

  const renderProgressBar = (progress: number) => {
    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress / 100}
          color={getGoalColor(progress)}
        />
      );
    }

    return (
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: getGoalColor(progress),
            },
          ]}
        />
      </View>
    );
  };

  const renderGoal = (goal: FamilyGoal) => {
    const progress = getProgressPercentage(goal);
    const daysLeft = Math.ceil(
      (new Date(goal.endDate).getTime() - Date.now()) / 86400000
    );

    return (
      <TouchableOpacity
        key={goal.id}
        style={styles.goalItem}
        onPress={() => onGoalPress?.(goal)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalIcon}>
            <Icon
              name={getGoalIcon(goal.category) as any}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalSubtitle}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'}
            </Text>
          </View>
          <Text style={styles.goalProgress}>
            {goal.currentValue}/{goal.targetValue}
          </Text>
        </View>

        {renderProgressBar(progress)}

        {goal.milestones && (
          <View style={styles.milestonesContainer}>
            {goal.milestones.map((milestone, index) => (
              <View
                key={index}
                style={[
                  styles.milestone,
                  milestone.reached && styles.milestoneReached,
                ]}
              >
                {milestone.reached ? (
                  <Icon name="check" size={10} color={colors.white} />
                ) : (
                  <Text style={styles.milestoneText}>{milestone.value}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {goal.rewards && goal.rewards.length > 0 && (
          <View style={styles.rewardContainer}>
            <Icon name="gift" size={12} color={colors.warning} />
            <Text style={styles.rewardText}>{goal.rewards[0]}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="target" size={18} color={colors.primary} />
          <Text style={styles.title}>Family Goals</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Icon name="target" size={24} color={colors.gray300} />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="target" size={24} color={colors.gray300} />
          <Text style={styles.emptyText}>No active goals</Text>
          <Text style={styles.emptySubtext}>
            Set family goals to work together
          </Text>
        </View>
      ) : (
        <View style={styles.goalsList}>
          {goals.map(renderGoal)}
        </View>
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
  goalsList: {
    // Empty as goals are not in a scroll view
  },
  goalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 14,
  },
  goalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalProgress: {
    ...typography.captionSemibold,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  milestone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneReached: {
    backgroundColor: colors.success,
  },
  milestoneText: {
    ...typography.caption,
    color: colors.gray600,
    fontSize: 10,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rewardText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: 4,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySemibold,
    color: colors.gray700,
    marginTop: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
  },
});

export default GoalsWidget;