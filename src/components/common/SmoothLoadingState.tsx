/**
 * SmoothLoadingState Component - Enhanced loading transitions
 * 
 * Features:
 * - Smooth fade-in/fade-out transitions
 * - Progressive loading states
 * - Skeleton screens with wave animation
 * - Content morphing
 * - Accessibility support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, elevation } from '../../constants/theme';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SmoothLoadingStateProps {
  isLoading: boolean;
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots' | 'progress' | 'shimmer';
  size?: 'small' | 'medium' | 'large';
  duration?: number;
  onLoadingComplete?: () => void;
}

export const SmoothLoadingState: React.FC<SmoothLoadingStateProps> = ({
  isLoading,
  message,
  variant = 'shimmer',
  size = 'medium',
  duration = 300,
  onLoadingComplete,
}) => {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(isLoading ? 0 : 1);
  const scale = useSharedValue(isLoading ? 0.95 : 1);

  useEffect(() => {
    if (isLoading) {
      opacity.value = withTiming(1, { duration: reduceMotion ? 0 : duration });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      opacity.value = withTiming(0, { duration: reduceMotion ? 0 : duration }, () => {
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      });
      scale.value = withTiming(0.95, { duration: reduceMotion ? 0 : duration });
    }
  }, [isLoading, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!isLoading && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {variant === 'shimmer' && <ShimmerLoader size={size} />}
      {variant === 'skeleton' && <EnhancedSkeletonLoader />}
      {variant === 'dots' && <FluidDotsLoader message={message} />}
      {variant === 'progress' && <ProgressLoader message={message} />}
      {variant === 'spinner' && <ModernSpinner message={message} size={size} />}
    </Animated.View>
  );
};

// Enhanced Skeleton with Wave Animation
const EnhancedSkeletonLoader: React.FC = () => {
  const wave = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!reduceMotion) {
      wave.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      wave.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          entering={FadeIn.delay(index * 100).duration(400)}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCircle}>
              {!reduceMotion && (
                <Animated.View style={[styles.shimmerWave, animatedStyle]}>
                  <View style={[styles.gradient, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </Animated.View>
              )}
            </View>
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTitle}>
                {!reduceMotion && (
                  <Animated.View style={[styles.shimmerWave, animatedStyle]}>
                    <View style={[styles.gradient, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                  </Animated.View>
                )}
              </View>
              <View style={styles.skeletonSubtitle}>
                {!reduceMotion && (
                  <Animated.View style={[styles.shimmerWave, animatedStyle]}>
                    <View style={[styles.gradient, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                  </Animated.View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Shimmer Effect Loader
const ShimmerLoader: React.FC<{ size: string }> = ({ size }) => {
  const shimmer = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!reduceMotion) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const height = size === 'small' ? 100 : size === 'large' ? 300 : 200;

  return (
    <Animated.View style={[styles.shimmerContainer, { height }, animatedStyle]}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.skeleton }]} />
    </Animated.View>
  );
};

// Fluid Dots Loader
const FluidDotsLoader: React.FC<{ message?: string }> = ({ message }) => {
  const dots = [0, 1, 2].map(() => ({
    scale: useSharedValue(1),
    translateY: useSharedValue(0),
  }));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!reduceMotion) {
      dots.forEach((dot, index) => {
        dot.scale.value = withDelay(
          index * 150,
          withRepeat(
            withSequence(
              withSpring(1.3, { damping: 10, stiffness: 100 }),
              withSpring(1, { damping: 10, stiffness: 100 })
            ),
            -1,
            false
          )
        );

        dot.translateY.value = withDelay(
          index * 150,
          withRepeat(
            withSequence(
              withSpring(-15, { damping: 10, stiffness: 100 }),
              withSpring(0, { damping: 10, stiffness: 100 })
            ),
            -1,
            false
          )
        );
      });
    }
  }, [reduceMotion]);

  return (
    <View style={styles.dotsContainer}>
      <View style={styles.dots}>
        {dots.map((dot, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [
              { scale: dot.scale.value },
              { translateY: dot.translateY.value },
            ],
          }));

          return (
            <Animated.View
              key={index}
              style={[styles.dot, animatedStyle]}
              entering={FadeIn.delay(index * 100).springify()}
            />
          );
        })}
      </View>
      {message && (
        <Animated.Text
          entering={FadeIn.delay(300).duration(400)}
          style={styles.dotsMessage}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

// Progress Bar Loader
const ProgressLoader: React.FC<{ message?: string }> = ({ message }) => {
  const progress = useSharedValue(0);
  const [percentage, setPercentage] = useState(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!reduceMotion) {
      // Simulate progress
      progress.value = withTiming(1, { duration: 3000 });
      
      // Update percentage display
      const interval = setInterval(() => {
        setPercentage(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

      return () => clearInterval(interval);
    } else {
      progress.value = 0.5;
      setPercentage(50);
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      {message && (
        <Text style={styles.progressMessage}>{message}</Text>
      )}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, animatedStyle, { backgroundColor: colors.primary }]} />
      </View>
      <Text style={styles.progressPercentage}>{percentage}%</Text>
    </View>
  );
};

// Modern Spinner
const ModernSpinner: React.FC<{ message?: string; size: string }> = ({ message, size }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!reduceMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.8, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const spinnerSize = size === 'small' ? 30 : size === 'large' ? 60 : 40;

  return (
    <View style={styles.spinnerContainer}>
      <Animated.View style={[animatedStyle, { width: spinnerSize, height: spinnerSize }]}>
        <View style={[styles.spinner, { width: spinnerSize, height: spinnerSize }]}>
          <View style={[styles.spinnerDot, styles.spinnerDot1]} />
          <View style={[styles.spinnerDot, styles.spinnerDot2]} />
          <View style={[styles.spinnerDot, styles.spinnerDot3]} />
          <View style={[styles.spinnerDot, styles.spinnerDot4]} />
        </View>
      </Animated.View>
      {message && (
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.spinnerMessage}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.L,
  },

  // Skeleton styles
  skeletonContainer: {
    width: '100%',
    padding: spacing.M,
  },

  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    marginBottom: spacing.S,
    ...elevation[2],
    overflow: 'hidden',
  },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.skeleton,
    marginRight: spacing.S,
    overflow: 'hidden',
  },

  skeletonContent: {
    flex: 1,
  },

  skeletonTitle: {
    height: 16,
    backgroundColor: colors.skeleton,
    borderRadius: borderRadius.small,
    marginBottom: spacing.XS,
    width: '70%',
    overflow: 'hidden',
  },

  skeletonSubtitle: {
    height: 12,
    backgroundColor: colors.skeleton,
    borderRadius: borderRadius.small,
    width: '50%',
    overflow: 'hidden',
  },

  shimmerWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },

  gradient: {
    flex: 1,
  },

  // Shimmer styles
  shimmerContainer: {
    width: '100%',
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    ...elevation[2],
  },

  // Dots styles
  dotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.L,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.XS,
  },

  dotsMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.L,
    textAlign: 'center',
  },

  // Progress styles
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.L,
  },

  progressMessage: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.M,
    textAlign: 'center',
  },

  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.separator,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  progressPercentage: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: spacing.XS,
  },

  // Spinner styles
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.L,
  },

  spinner: {
    position: 'relative',
  },

  spinnerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  spinnerDot1: {
    top: 0,
    left: '50%',
    marginLeft: -4,
  },

  spinnerDot2: {
    right: 0,
    top: '50%',
    marginTop: -4,
  },

  spinnerDot3: {
    bottom: 0,
    left: '50%',
    marginLeft: -4,
  },

  spinnerDot4: {
    left: 0,
    top: '50%',
    marginTop: -4,
  },

  spinnerMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.L,
    textAlign: 'center',
  },
});

export default SmoothLoadingState;