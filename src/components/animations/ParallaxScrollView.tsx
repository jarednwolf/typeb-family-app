/**
 * ParallaxScrollView Component
 * 
 * Animated scroll view with parallax effects for headers and content
 * Features:
 * - Header parallax with scale and fade
 * - Content cards animate in as they appear
 * - Smooth momentum scrolling
 * - Accessibility support
 */

import React, { useRef, ReactNode, useMemo } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  View,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ParallaxScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
  children: ReactNode;
  headerComponent?: ReactNode;
  headerHeight?: number;
  parallaxHeaderHeight?: number;
  fadeOutHeader?: boolean;
  scaleHeader?: boolean;
  stickyHeaderHeight?: number;
  onScroll?: (scrollY: number) => void;
  animatedCards?: boolean;
  cardAnimationDelay?: number;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerComponent,
  headerHeight = 200,
  parallaxHeaderHeight = 250,
  fadeOutHeader = true,
  scaleHeader = true,
  stickyHeaderHeight = 0,
  onScroll,
  animatedCards = true,
  cardAnimationDelay = 50,
  contentContainerStyle,
  ...scrollViewProps
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const scrollY = useSharedValue(0);
  const cardEnterAnimations = useRef<Map<string, Animated.SharedValue<number>>>(new Map());

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (onScroll) {
        runOnJS(onScroll)(event.contentOffset.y);
      }
    },
  });

  // Header parallax animations
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const translateY = interpolate(
      scrollY.value,
      [-parallaxHeaderHeight, 0, parallaxHeaderHeight],
      [parallaxHeaderHeight * 0.5, 0, -parallaxHeaderHeight * 0.3],
      Extrapolate.CLAMP
    );

    const scale = scaleHeader
      ? interpolate(
          scrollY.value,
          [-parallaxHeaderHeight, 0],
          [1.5, 1],
          Extrapolate.CLAMP
        )
      : 1;

    const opacity = fadeOutHeader
      ? interpolate(
          scrollY.value,
          [0, parallaxHeaderHeight * 0.7, parallaxHeaderHeight],
          [1, 0.5, 0],
          Extrapolate.CLAMP
        )
      : 1;

    return {
      transform: [
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  // Sticky header animations
  const stickyHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion || !stickyHeaderHeight) {
      return {};
    }

    const translateY = interpolate(
      scrollY.value,
      [0, parallaxHeaderHeight - stickyHeaderHeight],
      [parallaxHeaderHeight, 0],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [parallaxHeaderHeight - stickyHeaderHeight - 20, parallaxHeaderHeight - stickyHeaderHeight],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Wrap children with animated entrance if enabled
  const animatedChildren = useMemo(() => {
    if (!animatedCards || reduceMotion) {
      return children;
    }

    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      const key = `card-${index}`;
      
      // Create or get animation value for this card
      if (!cardEnterAnimations.current.has(key)) {
        const animValue = useSharedValue(0);
        cardEnterAnimations.current.set(key, animValue);
        
        // Animate in with delay
        setTimeout(() => {
          animValue.value = withTiming(1, { duration: 400 });
        }, index * cardAnimationDelay);
      }
      
      const animValue = cardEnterAnimations.current.get(key);
      
      return (
        <AnimatedCard
          key={key}
          animValue={animValue}
          scrollY={scrollY}
          index={index}
        >
          {child}
        </AnimatedCard>
      );
    });
  }, [children, animatedCards, reduceMotion, cardAnimationDelay]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Parallax Header */}
      {headerComponent && (
        <Animated.View
          style={[
            styles.parallaxHeader,
            {
              height: parallaxHeaderHeight,
            },
            headerAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          {headerComponent}
        </Animated.View>
      )}

      {/* Sticky Header (optional) */}
      {stickyHeaderHeight > 0 && (
        <Animated.View
          style={[
            styles.stickyHeader,
            {
              height: stickyHeaderHeight,
            },
            stickyHeaderAnimatedStyle,
          ]}
        >
          {/* Add sticky header content here if needed */}
        </Animated.View>
      )}

      {/* Scrollable Content */}
      <AnimatedScrollView
        {...scrollViewProps}
        contentContainerStyle={[
          {
            paddingTop: headerComponent ? parallaxHeaderHeight : 0,
          },
          contentContainerStyle,
        ]}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        showsVerticalScrollIndicator={false}
      >
        {animatedChildren}
      </AnimatedScrollView>
    </View>
  );
};

// Individual animated card component
interface AnimatedCardProps {
  children: ReactNode;
  animValue?: Animated.SharedValue<number>;
  scrollY: Animated.SharedValue<number>;
  index: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  animValue,
  scrollY,
  index,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (!animValue) return {};

    // Entrance animation
    const translateY = interpolate(
      animValue.value,
      [0, 1],
      [30, 0],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      animValue.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    // Parallax effect while scrolling (subtle)
    const scrollParallax = interpolate(
      scrollY.value,
      [-screenHeight, 0, screenHeight],
      [index * 5, 0, -index * 5],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY: translateY + scrollParallax },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// Fade-in view for sections
export const FadeInSection: React.FC<{
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
}> = ({ children, delay = 0, style }) => {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [reduceMotion, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Parallax image component
export const ParallaxImage: React.FC<{
  source: any;
  height: number;
  scrollY: Animated.SharedValue<number>;
  style?: ViewStyle;
}> = ({ source, height, scrollY, style }) => {
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const translateY = interpolate(
      scrollY.value,
      [-height, 0, height],
      [height * 0.5, 0, -height * 0.5],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-height, 0],
      [2, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.Image
      source={source}
      style={[
        {
          width: '100%',
          height,
        },
        animatedStyle,
        style as any,
      ]}
      resizeMode="cover"
    />
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  parallaxHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
});

export default ParallaxScrollView;