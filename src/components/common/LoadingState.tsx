/**
 * LoadingState Component - Premium loading indicators
 * 
 * Features:
 * - Multiple loading variants
 * - Skeleton screens
 * - Subtle animations
 * - Loading messages
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots' | 'overlay';
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  variant = 'spinner',
  size = 'medium',
}) => {
  if (variant === 'skeleton') {
    return <SkeletonLoader />;
  }

  if (variant === 'dots') {
    return <DotsLoader message={message} />;
  }

  if (variant === 'overlay') {
    return <OverlayLoader message={message} />;
  }

  const sizeMap = {
    small: 'small' as const,
    medium: 'large' as const,
    large: 'large' as const,
  };

  const indicatorSize = sizeMap[size];

  return (
    <View style={styles.container}>
      <ActivityIndicator size={indicatorSize} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// Skeleton Loader for content placeholders
const SkeletonLoader: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      {/* Task Card Skeleton */}
      <Animated.View style={[styles.skeletonCard, { opacity }]}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.skeletonCard, { opacity }]}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.skeletonCard, { opacity }]}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Dots Loader
const DotsLoader: React.FC<{ message?: string }> = ({ message }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsContainer}>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dotStyle(dot1)]} />
        <Animated.View style={[styles.dot, dotStyle(dot2)]} />
        <Animated.View style={[styles.dot, dotStyle(dot3)]} />
      </View>
      {message && <Text style={styles.dotsMessage}>{message}</Text>}
    </View>
  );
};

// Full Screen Overlay Loader
const OverlayLoader: React.FC<{ message?: string }> = ({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.white} />
        {message && <Text style={styles.overlayMessage}>{message}</Text>}
      </View>
    </Animated.View>
  );
};

// Inline Loading Component
export const InlineLoader: React.FC<{ text?: string }> = ({ text = 'Loading' }) => {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.inlineText}>{text}</Text>
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
  
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.M,
    textAlign: 'center',
  },
  
  // Skeleton styles
  skeletonContainer: {
    padding: spacing.M,
  },
  
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    marginBottom: spacing.S,
  },
  
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.separator,
    marginRight: spacing.S,
  },
  
  skeletonContent: {
    flex: 1,
  },
  
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.separator,
    borderRadius: borderRadius.small,
    marginBottom: spacing.XS,
    width: '70%',
  },
  
  skeletonSubtitle: {
    height: 12,
    backgroundColor: colors.separator,
    borderRadius: borderRadius.small,
    width: '50%',
  },
  
  // Dots loader styles
  dotsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.L,
  },
  
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.XXS,
  },
  
  dotsMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.L,
    textAlign: 'center',
  },
  
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  overlayContent: {
    alignItems: 'center',
  },
  
  overlayMessage: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.M,
    textAlign: 'center',
  },
  
  // Inline loader styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.S,
  },
  
  inlineText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.XS,
  },
});

export default LoadingState;