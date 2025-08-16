/**
 * StreakMilestone Component
 * 
 * Celebrates streak milestones with animated counters and effects
 * Features:
 * - Animated number counter
 * - Fire effects for hot streaks
 * - Calendar visualization
 * - Milestone badges
 * - Progress to next milestone
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
  cancelAnimation,
  Easing,
  useDerivedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedText = Animated.createAnimatedComponent(Text);

interface StreakMilestoneProps {
  visible: boolean;
  streak: number;
  milestone: number;
  nextMilestone?: number;
  userName?: string;
  onDismiss: () => void;
  autoHideDuration?: number;
  enableHaptics?: boolean;
}

// Milestone configurations
const MILESTONES = {
  3: { 
    title: 'Getting Started!', 
    color: theme.colors.info,
    icon: 'sunrise',
    message: 'Great beginning! Keep it up!'
  },
  7: { 
    title: 'Week Warrior!', 
    color: theme.colors.success,
    icon: 'award',
    message: 'One full week! You\'re on fire!'
  },
  14: { 
    title: 'Fortnight Fighter!', 
    color: theme.colors.premium,
    icon: 'shield',
    message: 'Two weeks strong! Incredible!'
  },
  30: { 
    title: 'Monthly Master!', 
    color: theme.colors.warning,
    icon: 'star',
    message: 'A full month! You\'re unstoppable!'
  },
  60: { 
    title: 'Habit Hero!', 
    color: '#FF6B6B',
    icon: 'zap',
    message: 'Two months! You\'ve built a habit!'
  },
  90: { 
    title: 'Quarter Champion!', 
    color: '#4ECDC4',
    icon: 'trophy',
    message: 'Three months! You\'re a champion!'
  },
  180: { 
    title: 'Half-Year Hero!', 
    color: '#95E77E',
    icon: 'crown',
    message: 'Six months! Legendary dedication!'
  },
  365: { 
    title: 'Year Legend!', 
    color: '#FFD700',
    icon: 'crown',
    message: 'One full year! You\'re a legend!'
  },
};

// Animated counter component
const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  textStyle?: any;
}> = ({ value, duration = 1500, textStyle }) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    }, () => {
      runOnJS(setDisplayValue)(value);
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const currentValue = Math.round(animatedValue.value);
    runOnJS(setDisplayValue)(currentValue);
    return {};
  });

  return (
    <Animated.View animatedProps={animatedProps}>
      <Text style={textStyle}>{displayValue}</Text>
    </Animated.View>
  );
};

// Fire animation for hot streaks
const FireAnimation: React.FC<{ size?: number }> = ({ size = 60 }) => {
  const flame1 = useSharedValue(0);
  const flame2 = useSharedValue(0);
  const flame3 = useSharedValue(0);

  useEffect(() => {
    flame1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.7, { duration: 400 })
      ),
      -1,
      true
    );

    flame2.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 500 })),
        withTiming(0.6, { duration: 500 })
      ),
      -1,
      true
    );

    flame3.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(1, { duration: 700 })),
        withTiming(0.8, { duration: 300 })
      ),
      -1,
      true
    );
  }, []);

  const flame1Style = useAnimatedStyle(() => ({
    opacity: flame1.value,
    transform: [
      { scale: interpolate(flame1.value, [0.6, 1], [0.9, 1.1]) },
      { translateY: interpolate(flame1.value, [0.6, 1], [5, -5]) },
    ],
  }));

  const flame2Style = useAnimatedStyle(() => ({
    opacity: flame2.value * 0.8,
    transform: [
      { scale: interpolate(flame2.value, [0.6, 1], [0.8, 1]) },
      { translateY: interpolate(flame2.value, [0.6, 1], [3, -8]) },
      { translateX: -10 },
    ],
  }));

  const flame3Style = useAnimatedStyle(() => ({
    opacity: flame3.value * 0.6,
    transform: [
      { scale: interpolate(flame3.value, [0.6, 1], [0.85, 1.05]) },
      { translateY: interpolate(flame3.value, [0.6, 1], [4, -6]) },
      { translateX: 10 },
    ],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute' }, flame3Style]}>
        <Text style={{ fontSize: size * 0.8 }}>🔥</Text>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, flame2Style]}>
        <Text style={{ fontSize: size * 0.9 }}>🔥</Text>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, flame1Style]}>
        <Text style={{ fontSize: size }}>🔥</Text>
      </Animated.View>
    </View>
  );
};

// Progress bar to next milestone
const ProgressBar: React.FC<{
  current: number;
  next: number;
  color: string;
}> = ({ current, next, color }) => {
  const progress = useSharedValue(0);
  const targetProgress = ((current % next) / next) * 100;

  useEffect(() => {
    progress.value = withDelay(
      800,
      withSpring(targetProgress, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [current, next]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <Animated.View 
          style={[
            styles.progressFill,
            { backgroundColor: color },
            animatedStyle
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {current} / {next} days to next milestone
      </Text>
    </View>
  );
};

export const StreakMilestone: React.FC<StreakMilestoneProps> = ({
  visible,
  streak,
  milestone,
  nextMilestone,
  userName = 'Champion',
  onDismiss,
  autoHideDuration = 5000,
  enableHaptics = true,
}) => {
  const reduceMotion = useReduceMotion();
  const dismissTimer = useRef<NodeJS.Timeout>();
  
  // Animation values
  const containerScale = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const progressOpacity = useSharedValue(0);
  const bounceValue = useSharedValue(0);

  const milestoneConfig = MILESTONES[milestone as keyof typeof MILESTONES] || {
    title: `${milestone} Day Streak!`,
    color: theme.colors.primary,
    icon: 'award',
    message: 'Keep up the great work!'
  };

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (enableHaptics) {
        HapticFeedback.celebration();
      }

      // Start animations
      if (reduceMotion) {
        containerScale.value = 1;
        badgeScale.value = 1;
        titleOpacity.value = 1;
        messageOpacity.value = 1;
        progressOpacity.value = 1;
      } else {
        // Container zoom in
        containerScale.value = withSpring(1, {
          damping: 12,
          stiffness: 200,
        });

        // Badge bounce animation
        badgeScale.value = withSequence(
          withDelay(200, withSpring(1.2, { damping: 8, stiffness: 200 })),
          withSpring(1, { damping: 12, stiffness: 150 })
        );

        // Continuous bounce for badge
        bounceValue.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          true
        );

        // Text animations
        titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
        messageOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
        progressOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
      }

      // Auto dismiss
      if (autoHideDuration > 0) {
        dismissTimer.current = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);
      }
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
      cancelAnimation(containerScale);
      cancelAnimation(badgeScale);
      cancelAnimation(bounceValue);
    };
  }, [visible, reduceMotion]);

  const handleDismiss = () => {
    containerScale.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      bounceValue.value,
      [0, 1],
      [0, -10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: badgeScale.value },
        { translateY },
      ],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Pressable style={styles.container} onPress={handleDismiss}>
        <View style={[StyleSheet.absoluteFillObject, styles.backdrop]} />
        
        <Animated.View style={[styles.content, containerAnimatedStyle]}>
          {/* Fire animation for hot streaks */}
          {streak >= 7 && (
            <View style={styles.fireContainer}>
              <FireAnimation size={80} />
            </View>
          )}

          {/* Streak number */}
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <View style={[styles.badgeCircle, { backgroundColor: milestoneConfig.color }]}>
              <AnimatedCounter 
                value={streak} 
                textStyle={styles.streakNumber}
              />
              <Text style={styles.daysText}>DAYS</Text>
            </View>
          </Animated.View>

          {/* Milestone icon */}
          <View style={styles.iconContainer}>
            <Feather 
              name={milestoneConfig.icon as any} 
              size={32} 
              color={milestoneConfig.color}
            />
          </View>

          {/* Title */}
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            {milestoneConfig.title}
          </Animated.Text>

          {/* Personalized message */}
          <Animated.Text style={[styles.message, messageAnimatedStyle]}>
            {userName}, {milestoneConfig.message}
          </Animated.Text>

          {/* Progress to next milestone */}
          {nextMilestone && (
            <Animated.View style={[styles.progressWrapper, progressAnimatedStyle]}>
              <ProgressBar 
                current={streak}
                next={nextMilestone}
                color={milestoneConfig.color}
              />
            </Animated.View>
          )}

          {/* Continue button */}
          <Animated.View style={messageAnimatedStyle}>
            <Pressable 
              style={[styles.continueButton, { backgroundColor: milestoneConfig.color }]}
              onPress={handleDismiss}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    minWidth: 320,
    maxWidth: screenWidth * 0.9,
    ...theme.elevation[8],
  },
  fireContainer: {
    position: 'absolute',
    top: -40,
    zIndex: 1,
  },
  badge: {
    marginTop: 20,
    marginBottom: 20,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation[4],
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: -5,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
  continueButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    ...theme.elevation[2],
  },
  continueText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StreakMilestone;