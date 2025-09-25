/**
 * Navigation Animation Configurations
 * 
 * Custom screen transition animations for React Navigation
 * Features:
 * - Multiple transition styles (slide, fade, modal, flip)
 * - Accessibility support (respects reduceMotion)
 * - Platform-specific optimizations
 * - Smooth, performant transitions
 */

import {
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  TransitionPreset,
} from '@react-navigation/stack';
import { Animated } from 'react-native';

// Animation durations
const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

/**
 * Slide from Right (iOS-style)
 * Standard push/pop animation
 */
export const slideFromRight: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0
  );

  return {
    cardStyle: {
      transform: [
        {
          translateX: Animated.multiply(
            progress.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [screen.width, 0, screen.width * -0.3],
              extrapolate: 'clamp',
            }),
            inverted
          ),
        },
      ],
      shadowColor: '#000',
      shadowOffset: {
        width: -1,
        height: 0,
      },
      shadowOpacity: progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, 0.3, 0.3],
        extrapolate: 'clamp',
      }),
      shadowRadius: 5,
    },
    overlayStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 1, 1.99, 2],
        outputRange: [0, 0.3, 0.3, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Slide from Bottom (Modal-style)
 * Used for modal presentations
 */
export const slideFromBottom: StackCardStyleInterpolator = ({
  current,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.height, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Fade transition
 * Simple opacity animation
 */
export const fadeIn: StackCardStyleInterpolator = ({
  current,
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Scale and fade transition
 * Zooms in while fading
 */
export const scaleFromCenter: StackCardStyleInterpolator = ({
  current,
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Flip transition
 * 3D flip effect
 */
export const flipCard: StackCardStyleInterpolator = ({
  current,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [screen.width, screen.width / 2, 0],
    extrapolate: 'clamp',
  });

  const rotateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg'],
    extrapolate: 'clamp',
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return {
    cardStyle: {
      transform: [
        { translateX },
        { perspective: 1000 },
        { rotateY },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Custom transition presets
 */
export const customTransitionPresets = {
  /**
   * iOS-style horizontal slide
   */
  SlideFromRightIOS: {
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
    },
    cardStyleInterpolator: slideFromRight,
    headerStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      leftButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      rightButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      titleStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      backgroundStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
    }),
  } as unknown as TransitionPreset,

  /**
   * Modal slide from bottom
   */
  ModalSlideFromBottom: {
    gestureDirection: 'vertical',
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 600,
          mass: 2,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: ANIMATION_DURATION.normal,
        },
      },
    },
    cardStyleInterpolator: slideFromBottom,
    headerStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      leftButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      rightButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      titleStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      backgroundStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
    }),
  } as unknown as TransitionPreset,

  /**
   * Fade transition
   */
  FadeIn: {
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: ANIMATION_DURATION.normal,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: ANIMATION_DURATION.fast,
        },
      },
    },
    cardStyleInterpolator: fadeIn,
    headerStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      leftButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      rightButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      titleStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      backgroundStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
    }),
  } as unknown as TransitionPreset,

  /**
   * Scale from center
   */
  ScaleFromCenter: {
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 800,
          damping: 400,
          mass: 2,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: ANIMATION_DURATION.fast,
        },
      },
    },
    cardStyleInterpolator: scaleFromCenter,
    headerStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      leftButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      rightButtonStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      titleStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
      backgroundStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      },
    }),
  } as unknown as TransitionPreset,
};

/**
 * Get animation config based on reduce motion preference
 */
export const getNavigationAnimationConfig = (reduceMotion: boolean) => {
  if (reduceMotion) {
    // Simple fade for reduced motion
    return customTransitionPresets.FadeIn;
  }

  // Default to slide animation
  return customTransitionPresets.SlideFromRightIOS;
};

/**
 * Get modal animation config
 */
export const getModalAnimationConfig = (reduceMotion: boolean) => {
  if (reduceMotion) {
    // Simple fade for reduced motion
    return customTransitionPresets.FadeIn;
  }

  // Modal slide from bottom
  return customTransitionPresets.ModalSlideFromBottom;
};