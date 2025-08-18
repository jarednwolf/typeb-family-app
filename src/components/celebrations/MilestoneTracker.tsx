/**
 * MilestoneTracker Component
 * Visual progress tracking for milestones
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Milestone {
  id: string;
  title: string;
  description: string;
  value: number;
  icon: string;
  completed: boolean;
  completedDate?: Date;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  currentValue: number;
  maxValue: number;
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  vertical?: boolean;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  milestones,
  currentValue,
  maxValue,
  title,
  subtitle,
  showLabels = true,
  vertical = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    milestones.map(() => new Animated.Value(1))
  ).current;

  const progressPercentage = Math.min((currentValue / maxValue) * 100, 100);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Animate completed milestones
    milestones.forEach((milestone, index) => {
      if (milestone.completed) {
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.spring(scaleAnims[index], {
            toValue: 1.2,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [currentValue, maxValue, milestones]);

  const renderMilestone = (milestone: Milestone, index: number) => {
    const position = (milestone.value / maxValue) * 100;
    const isActive = currentValue >= milestone.value;
    const isPending = currentValue < milestone.value;

    return (
      <Animated.View
        key={milestone.id}
        style={[
          vertical ? styles.verticalMilestone : styles.horizontalMilestone,
          vertical
            ? { top: `${position}%` }
            : { left: `${position}%` },
          {
            transform: [{ scale: scaleAnims[index] }],
          },
        ]}
      >
        <View
          style={[
            styles.milestoneIcon,
            isActive && styles.milestoneIconActive,
            isPending && styles.milestoneIconPending,
          ]}
        >
          {isActive ? (
            <Icon name="check" size={16} color={colors.white} />
          ) : (
            <Icon 
              name={milestone.icon as any} 
              size={16} 
              color={isPending ? colors.gray400 : colors.white} 
            />
          )}
        </View>
        
        {showLabels && (
          <View style={styles.milestoneLabel}>
            <Text style={[
              styles.milestoneLabelText,
              !isActive && styles.milestoneLabelTextInactive
            ]}>
              {milestone.title}
            </Text>
            <Text style={styles.milestoneValue}>
              {milestone.value}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  if (vertical) {
    return (
      <View style={styles.verticalContainer}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        
        <View style={styles.verticalTrack}>
          <View style={styles.verticalProgressBar} />
          <Animated.View
            style={[
              styles.verticalProgressFill,
              {
                height: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          {milestones.map((milestone, index) => 
            renderMilestone(milestone, index)
          )}
        </View>

        <View style={styles.stats}>
          <Text style={styles.currentValue}>{currentValue}</Text>
          <Text style={styles.maxValue}>/ {maxValue}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          {milestones.map((milestone, index) => 
            renderMilestone(milestone, index)
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.currentValue}>{currentValue}</Text>
        <Text style={styles.maxValue}>/ {maxValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  verticalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    height: 400,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressContainer: {
    position: 'relative',
    height: 60,
    marginBottom: spacing.md,
  },
  progressBar: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  verticalTrack: {
    flex: 1,
    position: 'relative',
    marginHorizontal: spacing.xl,
  },
  verticalProgressBar: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    transform: [{ translateX: -4 }],
  },
  verticalProgressFill: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    transform: [{ translateX: -4 }],
  },
  horizontalMilestone: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -16 }],
  },
  verticalMilestone: {
    position: 'absolute',
    left: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    zIndex: 2,
  },
  milestoneIconActive: {
    backgroundColor: colors.success,
  },
  milestoneIconPending: {
    backgroundColor: colors.gray200,
  },
  milestoneLabel: {
    position: 'absolute',
    top: 40,
    minWidth: 60,
    alignItems: 'center',
  },
  milestoneLabelText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
  milestoneLabelTextInactive: {
    color: colors.gray400,
  },
  milestoneValue: {
    ...typography.captionSemibold,
    color: colors.primary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currentValue: {
    ...typography.h2,
    color: colors.primary,
  },
  maxValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});

export default MilestoneTracker;