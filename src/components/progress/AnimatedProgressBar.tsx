/**
 * Animated Progress Bar Component
 * Shows progress with milestones and celebration animations
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Milestone {
  value: number;
  label?: string;
  icon?: string;
  celebration?: boolean;
}

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  milestones?: Milestone[];
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  variant?: 'default' | 'gradient' | 'striped' | 'pulse' | 'segmented';
  celebrateOnComplete?: boolean;
  onMilestoneReached?: (milestone: Milestone) => void;
  onComplete?: () => void;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  max,
  milestones = [],
  height = 8,
  color = theme.colors.primary,
  backgroundColor = theme.colors.inputBackground,
  showPercentage = false,
  showValue = false,
  label,
  animated = true,
  variant = 'default',
  celebrateOnComplete = true,
  onMilestoneReached,
  onComplete,
}) => {
  const progress = useSharedValue(0);
  const fillScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const celebrationScale = useSharedValue(1);
  
  const percentage = Math.min((value / max) * 100, 100);
  const previousPercentage = React.useRef(0);
  const celebratedMilestones = React.useRef<Set<number>>(new Set());

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(percentage, {
        duration: 800,
      });

      // Check for milestone celebrations
      milestones.forEach(milestone => {
        const milestonePercentage = (milestone.value / max) * 100;
        if (
          percentage >= milestonePercentage &&
          previousPercentage.current < milestonePercentage &&
          !celebratedMilestones.current.has(milestone.value)
        ) {
          celebratedMilestones.current.add(milestone.value);
          
          // Celebrate milestone
          if (milestone.celebration) {
            HapticFeedback.notification.success();
            fillScale.value = withSequence(
              withSpring(1.1, { damping: 10, stiffness: 300 }),
              withSpring(1, { damping: 15, stiffness: 200 })
            );
          }
          
          if (onMilestoneReached) {
            runOnJS(onMilestoneReached)(milestone);
          }
        }
      });

      // Celebrate completion
      if (percentage >= 100 && previousPercentage.current < 100) {
        if (celebrateOnComplete) {
          HapticFeedback.celebration();
          celebrationScale.value = withSequence(
            withSpring(1.2, { damping: 8, stiffness: 200 }),
            withSpring(0.9, { damping: 10, stiffness: 180 }),
            withSpring(1, { damping: 15, stiffness: 150 })
          );
        }
        
        if (onComplete) {
          runOnJS(onComplete)();
        }
      }

      // Pulse effect for pulse variant
      if (variant === 'pulse') {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
      }

      previousPercentage.current = percentage;
    } else {
      progress.value = percentage;
    }
  }, [value, max, animated, variant]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    transform: [{ scaleY: fillScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const renderMilestone = (milestone: Milestone, index: number) => {
    const position = (milestone.value / max) * 100;
    const isReached = percentage >= position;

    return (
      <View
        key={`milestone-${index}`}
        style={[
          styles.milestone,
          {
            left: `${position}%`,
            bottom: height + 4,
          },
        ]}
      >
        <View
          style={[
            styles.milestoneMarker,
            {
              backgroundColor: isReached ? color : backgroundColor,
              borderColor: color,
            },
          ]}
        >
          {milestone.icon && (
            <Ionicons
              name={milestone.icon as any}
              size={10}
              color={isReached ? theme.colors.white : color}
            />
          )}
        </View>
        {milestone.label && (
          <Text
            style={[
              styles.milestoneLabel,
              { color: isReached ? color : theme.colors.textTertiary },
            ]}
          >
            {milestone.label}
          </Text>
        )}
      </View>
    );
  };

  const renderSegmented = () => {
    const segments = 10;
    const segmentWidth = (SCREEN_WIDTH - 32 - (segments - 1) * 2) / segments;
    const filledSegments = Math.floor((percentage / 100) * segments);

    return (
      <View style={styles.segmentedContainer}>
        {Array.from({ length: segments }, (_, i) => (
          <View
            key={`segment-${i}`}
            style={[
              styles.segment,
              {
                width: segmentWidth,
                height,
                backgroundColor: i < filledSegments ? color : backgroundColor,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStriped = () => (
    <View style={[styles.progressFill, { height }]}>
      <Animated.View
        style={[
          styles.stripedFill,
          {
            backgroundColor: color,
            height,
          },
          progressStyle,
        ]}
      >
        <View style={styles.stripes} />
      </Animated.View>
    </View>
  );

  const renderGradient = () => (
    <View style={[styles.progressFill, { height }]}>
      <Animated.View
        style={[
          styles.gradientFill,
          {
            height,
            backgroundColor: color,
          },
          progressStyle,
        ]}
      />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {/* Label and Value */}
      {(label || showValue || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={styles.values}>
            {showValue && (
              <Text style={styles.value}>
                {value}/{max}
              </Text>
            )}
            {showPercentage && (
              <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress Bar Container */}
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        {/* Milestones */}
        {milestones.map(renderMilestone)}

        {/* Progress Bar */}
        {variant === 'segmented' ? (
          renderSegmented()
        ) : (
          <View
            style={[
              styles.progressBar,
              {
                height,
                backgroundColor,
              },
            ]}
          >
            {variant === 'striped' ? (
              renderStriped()
            ) : variant === 'gradient' ? (
              renderGradient()
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: color,
                      height,
                    },
                    progressStyle,
                  ]}
                />
                {variant === 'pulse' && (
                  <Animated.View
                    style={[
                      styles.pulseFill,
                      {
                        backgroundColor: color,
                        height,
                      },
                      progressStyle,
                      pulseStyle,
                    ]}
                  />
                )}
              </>
            )}

            {/* Completion Indicator */}
            {percentage >= 100 && (
              <View style={styles.completionIndicator}>
                <Ionicons
                  name="checkmark-circle"
                  size={height + 8}
                  color={theme.colors.success}
                />
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: theme.spacing.S,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  values: {
    flexDirection: 'row',
    gap: theme.spacing.XS,
  },
  value: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  container: {
    position: 'relative',
    paddingTop: 20, // Space for milestones
  },
  progressBar: {
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  pulseFill: {
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  stripedFill: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  stripes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    // Add striped pattern with diagonal lines
    backgroundColor: 'transparent',
  },
  gradientFill: {
    borderRadius: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  segment: {
    borderRadius: 2,
  },
  milestone: {
    position: 'absolute',
    alignItems: 'center',
  },
  milestoneMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  milestoneLabel: {
    fontSize: 10,
    marginTop: 2,
    position: 'absolute',
    top: 18,
  },
  completionIndicator: {
    position: 'absolute',
    right: -4,
    top: -4,
  },
});

export default AnimatedProgressBar;