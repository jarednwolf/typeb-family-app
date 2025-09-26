/**
 * AnimatedProgressBar Component - Smooth, animated progress indicators
 * 
 * Features:
 * - Multiple animation styles
 * - Customizable colors and sizes
 * - Milestone indicators
 * - Value labels
 * - Accessibility support
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  interpolateColor,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  variant?: 'default' | 'gradient' | 'striped' | 'pulse' | 'segmented';
  animated?: boolean;
  duration?: number;
  milestones?: number[]; // Array of milestone percentages
  onComplete?: () => void;
  onMilestone?: (milestone: number) => void;
  style?: ViewStyle;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.separator,
  variant = 'default',
  animated = true,
  duration = 1000,
  milestones = [],
  onComplete,
  onMilestone,
  style,
}) => {
  const reduceMotion = useReduceMotion();
  const progressValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const stripeOffset = useSharedValue(0);
  const previousMilestones = useRef<Set<number>>(new Set());

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  useEffect(() => {
    if (!animated || reduceMotion) {
      progressValue.value = clampedProgress;
    } else {
      progressValue.value = withTiming(clampedProgress, {
        duration,
      }, (finished) => {
        if (finished && clampedProgress === 100 && onComplete) {
          runOnJS(onComplete)();
          runOnJS(HapticFeedback.notification.success)();
        }
      });

      // Check for milestones
      milestones.forEach(milestone => {
        if (clampedProgress >= milestone && !previousMilestones.current.has(milestone)) {
          previousMilestones.current.add(milestone);
          if (onMilestone) {
            runOnJS(onMilestone)(milestone);
            runOnJS(HapticFeedback.impact.light)();
          }
        }
      });

      // Pulse animation for active progress
      if (variant === 'pulse' && clampedProgress > 0 && clampedProgress < 100) {
        pulseValue.value = withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        );
      }

      // Striped animation
      if (variant === 'striped') {
        stripeOffset.value = withTiming(20, {
          duration: 1000,
        });
      }
    }
  }, [clampedProgress, animated, reduceMotion, duration, variant]);

  // Base progress bar animation
  const progressBarStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progressValue.value,
      [0, 100],
      [0, 100],
      Extrapolate.CLAMP
    );

    return {
      width: `${width}%`,
      transform: variant === 'pulse' ? [{ scale: pulseValue.value }] : [],
    };
  });

  // Color interpolation for gradient effect
  const gradientStyle = useAnimatedStyle(() => {
    if (variant !== 'gradient') return {};

    const bgColor = interpolateColor(
      progressValue.value,
      [0, 50, 100],
      [colors.error, colors.warning, colors.success]
    );

    return {
      backgroundColor: bgColor,
    };
  });

  // Striped pattern animation
  const stripedStyle = useAnimatedStyle(() => {
    if (variant !== 'striped') return {};

    return {
      transform: [{ translateX: stripeOffset.value }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <AnimatedPercentageLabel progress={progressValue} />
          )}
        </View>
      )}
      
      <View
        style={[
          styles.progressBackground,
          { height, backgroundColor },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: clampedProgress,
        }}
      >
        {/* Milestone indicators */}
        {milestones.map((milestone) => (
          <MilestoneIndicator
            key={milestone}
            milestone={milestone}
            reached={clampedProgress >= milestone}
            height={height}
          />
        ))}

        {/* Progress fill */}
        {variant === 'segmented' ? (
          <SegmentedProgress
            progress={progressValue}
            color={color}
            height={height}
          />
        ) : (
          <Animated.View
            style={[
              styles.progressFill,
              progressBarStyle,
              variant === 'gradient' ? gradientStyle : { backgroundColor: color },
              { height },
            ]}
          >
            {variant === 'striped' && (
              <Animated.View style={[styles.stripes, stripedStyle]} />
            )}
          </Animated.View>
        )}

        {/* Glow effect for active progress */}
        {variant === 'pulse' && clampedProgress > 0 && clampedProgress < 100 && (
          <Animated.View
            style={[
              styles.progressGlow,
              progressBarStyle,
              { height, backgroundColor: color + '30' },
            ]}
          />
        )}
      </View>
    </View>
  );
};

// Animated percentage label
const AnimatedPercentageLabel: React.FC<{ progress: Animated.SharedValue<number> }> = ({ progress }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(progress.value));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.percentage}>{displayValue}%</Text>
  );
};

// Milestone indicator
const MilestoneIndicator: React.FC<{
  milestone: number;
  reached: boolean;
  height: number;
}> = ({ milestone, reached, height }) => {
  const scale = useSharedValue(reached ? 0 : 1);
  const opacity = useSharedValue(reached ? 0 : 0.3);

  useEffect(() => {
    if (reached) {
      scale.value = withSpring(1.2, {
        damping: 10,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [reached]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.milestone,
        animatedStyle,
        {
          left: `${milestone}%`,
          height: height + 4,
          backgroundColor: reached ? colors.success : colors.textTertiary,
        },
      ]}
    />
  );
};

// Segmented progress variant
const SegmentedProgress: React.FC<{
  progress: Animated.SharedValue<number>;
  color: string;
  height: number;
}> = ({ progress, color, height }) => {
  const segments = 10;
  
  return (
    <View style={styles.segmentedContainer}>
      {Array.from({ length: segments }).map((_, index) => {
        const segmentProgress = useSharedValue(0);
        
        useEffect(() => {
          const segmentThreshold = ((index + 1) / segments) * 100;
          segmentProgress.value = withDelay(
            index * 50,
            withTiming(progress.value >= segmentThreshold ? 1 : 0, {
              duration: 300,
            })
          );
        }, []);

        const animatedStyle = useAnimatedStyle(() => ({
          opacity: segmentProgress.value,
          transform: [{ scale: segmentProgress.value }],
        }));

        return (
          <Animated.View
            key={index}
            style={[
              styles.segment,
              animatedStyle,
              {
                width: `${100 / segments}%`,
                height,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Circular progress bar variant (simplified without SVG)
export const CircularProgressBar: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
}> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = colors.primary,
  showPercentage = true,
}) => {
  const reduceMotion = useReduceMotion();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  
  useEffect(() => {
    if (reduceMotion) {
      scale.value = progress / 100;
    } else {
      scale.value = withSpring(progress / 100, {
        damping: 15,
        stiffness: 100,
      });
      
      if (progress > 0 && progress < 100) {
        rotation.value = withTiming(360, { duration: 2000 });
      }
    }
  }, [progress, reduceMotion]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.circularRing,
          {
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: colors.separator,
            borderRadius: size / 2,
          },
        ]}
      />
      
      {/* Progress ring (simplified) */}
      <Animated.View
        style={[
          styles.circularRing,
          {
            position: 'absolute',
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRadius: size / 2,
          },
          animatedRingStyle,
        ]}
      />
      
      {showPercentage && (
        <View style={styles.circularPercentage}>
          <Text style={styles.circularPercentageText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.XS,
  },
  
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  
  percentage: {
    ...typography.caption1,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  progressBackground: {
    width: '100%',
    backgroundColor: colors.separator,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    position: 'relative',
  },
  
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: borderRadius.round,
  },
  
  progressGlow: {
    position: 'absolute',
    left: 0,
    top: -2,
    bottom: -2,
    borderRadius: borderRadius.round,
    opacity: 0.5,
  },
  
  stripes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  milestone: {
    position: 'absolute',
    width: 2,
    top: -2,
    zIndex: 1,
  },
  
  segmentedContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  
  segment: {
    borderRadius: borderRadius.small,
  },
  
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  circularRing: {
    position: 'absolute',
  },
  
  circularPercentage: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  circularPercentageText: {
    ...typography.headline,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default AnimatedProgressBar;