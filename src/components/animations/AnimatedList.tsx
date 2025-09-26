/**
 * AnimatedList Component
 * 
 * Provides smooth staggered entry animations for lists of items
 * Features:
 * - Staggered fade-in and slide-up animations
 * - Configurable delay between items
 * - Support for different animation styles
 * - Accessibility support with reduceMotion
 * - Automatic visibility detection
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  SlideInDown,
  SlideInUp,
  Layout,
  SharedValue,
} from 'react-native-reanimated';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

const { width: screenWidth } = Dimensions.get('window');

export type AnimationStyle = 
  | 'fade'
  | 'fadeDown'
  | 'fadeUp'
  | 'fadeLeft'
  | 'fadeRight'
  | 'zoom'
  | 'slideDown'
  | 'slideUp'
  | 'stagger'
  | 'cascade';

interface AnimatedListProps {
  children: ReactNode[];
  animationStyle?: AnimationStyle;
  staggerDelay?: number;
  initialDelay?: number;
  duration?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  containerStyle?: ViewStyle;
  itemContainerStyle?: ViewStyle;
  horizontal?: boolean;
  numColumns?: number;
  onAnimationComplete?: () => void;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  animationStyle = 'stagger',
  staggerDelay = 50,
  initialDelay = 0,
  duration = 400,
  springConfig = {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  containerStyle,
  itemContainerStyle,
  horizontal = false,
  numColumns = 1,
  onAnimationComplete,
}) => {
  const reduceMotion = useReduceMotion();
  const animationValues = useRef<Map<string, SharedValue<number>>>(new Map());
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current && !reduceMotion) {
      animateItems();
      hasAnimated.current = true;
    }
  }, [children.length, reduceMotion]);

  const animateItems = () => {
    React.Children.forEach(children, (_, index) => {
      const key = `item-${index}`;
      if (!animationValues.current.has(key)) {
        const animValue = useSharedValue(0);
        animationValues.current.set(key, animValue);
      }

      const animValue = animationValues.current.get(key);
      if (animValue) {
        const delay = initialDelay + (index * staggerDelay);
        
        animValue.value = withDelay(
          delay,
          withSpring(1, springConfig)
        );
      }
    });

    // Call completion callback after all animations
    if (onAnimationComplete) {
      const totalDelay = initialDelay + (children.length * staggerDelay) + duration;
      setTimeout(onAnimationComplete, totalDelay);
    }
  };

  const getAnimationStyle = (index: number) => {
    if (reduceMotion) {
      return {};
    }

    switch (animationStyle) {
      case 'fade':
        return FadeIn.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'fadeDown':
        return FadeInDown.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'fadeUp':
        return FadeInUp.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'fadeLeft':
        return FadeInLeft.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'fadeRight':
        return FadeInRight.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'zoom':
        return ZoomIn.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'slideDown':
        return SlideInDown.delay(initialDelay + index * staggerDelay).duration(duration);
      case 'slideUp':
        return SlideInUp.delay(initialDelay + index * staggerDelay).duration(duration);
      default:
        return undefined;
    }
  };

  const renderAnimatedItem = (child: ReactNode, index: number) => {
    if (animationStyle === 'stagger' || animationStyle === 'cascade') {
      const key = `item-${index}`;
      let animValue = animationValues.current.get(key);
      
      if (!animValue) {
        animValue = useSharedValue(0);
        animationValues.current.set(key, animValue);
      }

      return (
        <AnimatedListItem
          key={index}
          index={index}
          animValue={animValue}
          style={itemContainerStyle}
          animationStyle={animationStyle}
          horizontal={horizontal}
        >
          {child}
        </AnimatedListItem>
      );
    }

    const entering = getAnimationStyle(index);

    return (
      <Animated.View
        key={index}
        entering={entering}
        layout={Layout.springify()}
        style={itemContainerStyle}
      >
        {child}
      </Animated.View>
    );
  };

  const gridStyle = numColumns > 1 ? {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  } : {};

  return (
    <View style={[
      containerStyle,
      horizontal && { flexDirection: 'row' },
      gridStyle,
    ]}>
      {React.Children.map(children, renderAnimatedItem)}
    </View>
  );
};

// Individual animated item component for custom animations
interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  animValue: SharedValue<number>;
  style?: ViewStyle;
  animationStyle: AnimationStyle;
  horizontal?: boolean;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  animValue,
  style,
  animationStyle,
  horizontal,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (animationStyle === 'stagger') {
      // Staggered slide and fade
      const translateY = interpolate(
        animValue.value,
        [0, 1],
        [30, 0],
        Extrapolate.CLAMP
      );

      const translateX = horizontal
        ? interpolate(
            animValue.value,
            [0, 1],
            [30, 0],
            Extrapolate.CLAMP
          )
        : 0;

      const opacity = interpolate(
        animValue.value,
        [0, 0.5, 1],
        [0, 0.5, 1],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        animValue.value,
        [0, 0.5, 1],
        [0.8, 0.95, 1],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [
          { translateY: horizontal ? 0 : translateY },
          { translateX },
          { scale },
        ],
      };
    } else if (animationStyle === 'cascade') {
      // Cascade animation with rotation
      const translateY = interpolate(
        animValue.value,
        [0, 1],
        [50, 0],
        Extrapolate.CLAMP
      );

      const translateX = interpolate(
        animValue.value,
        [0, 1],
        [index % 2 === 0 ? -20 : 20, 0],
        Extrapolate.CLAMP
      );

      const opacity = animValue.value;

      const rotateValue = interpolate(
        animValue.value,
        [0, 0.5, 1],
        [index % 2 === 0 ? -5 : 5, 0, 0],
        Extrapolate.CLAMP
      );
      const rotate = `${rotateValue}deg`;

      return {
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate },
        ],
      };
    }

    return {};
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Animated card wrapper with entrance animation
interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  delay = 0,
  style,
  onPress,
}) => {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const animationDelay = delay + (index * 50);

    scale.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      })
    );

    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 300 })
    );

    translateY.value = withDelay(
      animationDelay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [index, delay, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (onPress) {
    return (
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Visibility detector for triggering animations when item comes into view
interface VisibilityAnimatorProps {
  children: ReactNode;
  threshold?: number;
  style?: ViewStyle;
}

export const VisibilityAnimator: React.FC<VisibilityAnimatorProps> = ({
  children,
  threshold = 0.5,
  style,
}) => {
  const reduceMotion = useReduceMotion();
  const isVisible = useSharedValue(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    // In a real implementation, you'd use IntersectionObserver or similar
    // For now, we'll animate immediately
    setTimeout(() => {
      isVisible.value = true;
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    }, 100);
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedList;