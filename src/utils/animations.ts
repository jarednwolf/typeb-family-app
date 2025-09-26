/**
 * Animation Utilities
 *
 * Provides reusable animation patterns that respect accessibility settings
 * and ensure smooth performance across all devices
 */

import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  AnimatedStyleProp
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';
import { useEffect } from 'react';
import { useReduceMotion } from '../contexts/AccessibilityContext';
import { animations } from '../constants/theme';

/**
 * Animation configuration that respects accessibility settings
 */
export const useAnimationConfig = () => {
  const reduceMotion = useReduceMotion();
  
  return {
    duration: reduceMotion ? 0 : animations.normal,
    fastDuration: reduceMotion ? 0 : animations.fast,
    slowDuration: reduceMotion ? 0 : animations.slow,
    springConfig: reduceMotion 
      ? { damping: 1000, stiffness: 1000 } // Instant transition
      : { damping: 15, stiffness: 150 },
    enabled: !reduceMotion,
  };
};

/**
 * Press animation hook for interactive elements
 */
export const usePressAnimation = (scale = 0.95) => {
  const reduceMotion = useReduceMotion();
  const animatedScale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));
  
  const handlePressIn = () => {
    if (reduceMotion) {
      animatedScale.value = 1; // No animation
    } else {
      animatedScale.value = withSpring(scale, {
        damping: 15,
        stiffness: 400,
      });
    }
  };
  
  const handlePressOut = () => {
    if (reduceMotion) {
      animatedScale.value = 1;
    } else {
      animatedScale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    }
  };
  
  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
};

/**
 * Fade animation hook
 */
export const useFadeAnimation = (
  initialOpacity = 0,
  targetOpacity = 1,
  duration?: number
) => {
  const config = useAnimationConfig();
  const opacity = useSharedValue(initialOpacity);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const fadeIn = () => {
    opacity.value = withTiming(targetOpacity, {
      duration: duration || config.duration,
      easing: Easing.out(Easing.ease),
    });
  };
  
  const fadeOut = () => {
    opacity.value = withTiming(initialOpacity, {
      duration: duration || config.duration,
      easing: Easing.in(Easing.ease),
    });
  };
  
  return {
    animatedStyle,
    fadeIn,
    fadeOut,
    opacity,
  };
};

/**
 * Slide animation hook
 */
export const useSlideAnimation = (
  from: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  distance = 100
) => {
  const config = useAnimationConfig();
  const translateValue = useSharedValue(distance);
  
  const animatedStyle = useAnimatedStyle(() => {
    switch (from) {
      case 'left':
        return { transform: [{ translateX: -translateValue.value }] };
      case 'right':
        return { transform: [{ translateX: translateValue.value }] };
      case 'top':
        return { transform: [{ translateY: -translateValue.value }] };
      case 'bottom':
      default:
        return { transform: [{ translateY: translateValue.value }] };
    }
  });
  
  const slideIn = () => {
    translateValue.value = withSpring(0, config.springConfig);
  };
  
  const slideOut = () => {
    translateValue.value = withTiming(distance, {
      duration: config.duration,
      easing: Easing.in(Easing.ease),
    });
  };
  
  return {
    animatedStyle,
    slideIn,
    slideOut,
    translateValue,
  };
};

/**
 * Bounce animation for celebrations
 */
export const useBounceAnimation = () => {
  const config = useAnimationConfig();
  const scale = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const bounce = () => {
    if (!config.enabled) {
      scale.value = 1;
      return;
    }
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1, {
        damping: 8,
        stiffness: 200,
      })
    );
  };
  
  return {
    animatedStyle,
    bounce,
    scale,
  };
};

/**
 * Shake animation for errors
 */
export const useShakeAnimation = () => {
  const config = useAnimationConfig();
  const translateX = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  const shake = () => {
    if (!config.enabled) return;
    
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };
  
  return {
    animatedStyle,
    shake,
  };
};

/**
 * Pulse animation for loading states
 */
export const usePulseAnimation = (
  minScale = 0.95,
  maxScale = 1.05,
  duration = 1000
) => {
  const config = useAnimationConfig();
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (!config.enabled) return;
    
    scale.value = withSequence(
      withTiming(maxScale, { duration: duration / 2 }),
      withTiming(minScale, { duration: duration / 2 })
    );
    
    const interval = setInterval(() => {
      scale.value = withSequence(
        withTiming(maxScale, { duration: duration / 2 }),
        withTiming(minScale, { duration: duration / 2 })
      );
    }, duration);
    
    return () => clearInterval(interval);
  }, [config.enabled]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return {
    animatedStyle,
    scale,
  };
};

/**
 * Stagger animation for lists
 */
export const useStaggerAnimation = (
  index: number,
  totalItems: number,
  baseDelay = 50
) => {
  const config = useAnimationConfig();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    if (!config.enabled) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    
    const delay = index * baseDelay;
    
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: config.duration,
        easing: Easing.out(Easing.ease),
      })
    );
    
    translateY.value = withDelay(
      delay,
      withSpring(0, config.springConfig)
    );
  }, [index, config.enabled]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return {
    animatedStyle,
    opacity,
    translateY,
  };
};

/**
 * Rotation animation
 */
export const useRotationAnimation = (degrees = 360) => {
  const config = useAnimationConfig();
  const rotation = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const rotate = (duration?: number) => {
    rotation.value = withTiming(degrees, {
      duration: duration || config.duration,
      easing: Easing.inOut(Easing.ease),
    });
  };
  
  const reset = () => {
    rotation.value = withTiming(0, {
      duration: config.fastDuration,
    });
  };
  
  return {
    animatedStyle,
    rotate,
    reset,
    rotation,
  };
};

/**
 * Helper to run haptic feedback with animation
 */
export const withHaptic = (
  animation: () => void,
  hapticFeedback: () => void
) => {
  'worklet';
  runOnJS(hapticFeedback)();
  animation();
};

export default {
  useAnimationConfig,
  usePressAnimation,
  useFadeAnimation,
  useSlideAnimation,
  useBounceAnimation,
  useShakeAnimation,
  usePulseAnimation,
  useStaggerAnimation,
  useRotationAnimation,
  withHaptic,
};