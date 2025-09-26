/**
 * Collective Progress Component
 * Shows family's combined progress
 * Focus: Celebration of collective achievements, not individual comparison
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedProgressBar } from '../progress/AnimatedProgressBar';
import { theme } from '../../constants/theme';
import { useHaptics } from '../../utils/haptics';

interface CollectiveProgressProps {
  familyId: string;
  onPress?: () => void;
}

const CollectiveProgress: React.FC<CollectiveProgressProps> = ({
  familyId,
  onPress,
}) => {
  const haptics = useHaptics();

  // Mock data - in production, this would come from Redux/Firebase
  const progressData = useMemo(() => ({
    totalTasks: 500,
    completedTasks: 342,
    weeklyGoal: 100,
    weeklyCompleted: 78,
    monthlyGoal: 400,
    monthlyCompleted: 342,
  }), [familyId]);

  const handlePress = () => {
    haptics.selection();
    onPress?.();
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="account-group"
          size={24}
          color={theme.colors.primary}
        />
        <Text style={styles.title}>Our Collective Progress</Text>
      </View>

      {/* Overall Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>All-Time Progress</Text>
          <Text style={styles.progressPercentage}>
            {getProgressPercentage(progressData.completedTasks, progressData.totalTasks)}%
          </Text>
        </View>
        <AnimatedProgressBar
          value={progressData.completedTasks}
          max={progressData.totalTasks}
          height={12}
          color={theme.colors.primary}
          milestones={[
            { value: 125, label: '25%', celebration: true },
            { value: 250, label: '50%', celebration: true },
            { value: 375, label: '75%', celebration: true },
            { value: 500, label: '100%', celebration: true }
          ]}
          showPercentage={true}
        />
        <Text style={styles.progressText}>
          {progressData.completedTasks} of {progressData.totalTasks} tasks completed together
        </Text>
      </View>

      {/* Weekly Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>This Week</Text>
          <Text style={styles.progressPercentage}>
            {getProgressPercentage(progressData.weeklyCompleted, progressData.weeklyGoal)}%
          </Text>
        </View>
        <AnimatedProgressBar
          value={progressData.weeklyCompleted}
          max={progressData.weeklyGoal}
          height={8}
          color={theme.colors.success}
        />
        <Text style={styles.progressText}>
          {progressData.weeklyCompleted} of {progressData.weeklyGoal} weekly goal
        </Text>
      </View>

      {/* Monthly Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>This Month</Text>
          <Text style={styles.progressPercentage}>
            {getProgressPercentage(progressData.monthlyCompleted, progressData.monthlyGoal)}%
          </Text>
        </View>
        <AnimatedProgressBar
          value={progressData.monthlyCompleted}
          max={progressData.monthlyGoal}
          height={8}
          color={theme.colors.info}
        />
        <Text style={styles.progressText}>
          {progressData.monthlyCompleted} of {progressData.monthlyGoal} monthly goal
        </Text>
      </View>

      {/* Motivational Message */}
      <View style={styles.messageContainer}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={16}
          color={theme.colors.warning}
        />
        <Text style={styles.message}>
          Every task completed brings us closer to our goals!
        </Text>
      </View>

      {/* Celebration Threshold */}
      {progressData.completedTasks % 50 === 0 && progressData.completedTasks > 0 && (
        <View style={styles.celebrationBanner}>
          <MaterialCommunityIcons
            name="party-popper"
            size={20}
            color={theme.colors.white}
          />
          <Text style={styles.celebrationText}>
            Milestone reached! {progressData.completedTasks} tasks completed!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.M,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
  },
  progressSection: {
    marginBottom: theme.spacing.M,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.XXS,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    padding: theme.spacing.S,
    marginTop: theme.spacing.S,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.XS,
    fontStyle: 'italic',
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    padding: theme.spacing.S,
    marginTop: theme.spacing.S,
  },
  celebrationText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.white,
    marginLeft: theme.spacing.XS,
    fontWeight: '600',
  },
});

export default CollectiveProgress;