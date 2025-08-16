/**
 * AnimatedEmptyState Component - Enhanced empty state with delightful animations
 * 
 * Features:
 * - Floating icon animation
 * - Staggered element entrance
 * - Interactive hover/press effects
 * - Subtle particle effects
 * - Accessibility support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, TextButton } from './Button';
import { useAccessibility, useReduceMotion } from '../../contexts/AccessibilityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedEmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'compact' | 'large';
  showParticles?: boolean;
  animationType?: 'float' | 'bounce' | 'pulse' | 'swing';
}

// Animated Icon Component
const AnimatedIcon: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  size: number;
  color: string;
  animationType: string;
  reduceMotion: boolean;
}> = ({ icon, size, color, animationType, reduceMotion }) => {
  const floatY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = withTiming(1, { duration: 300 });
      return;
    }

    // Entrance animation
    opacity.value = withDelay(
      200,
      withTiming(1, { duration: 600 })
    );

    // Different animation types
    switch (animationType) {
      case 'float':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;
      
      case 'bounce':
        floatY.value = withRepeat(
          withSequence(
            withSpring(-15, { damping: 10, stiffness: 100 }),
            withSpring(0, { damping: 10, stiffness: 100 })
          ),
          -1,
          false
        );
        break;
      
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        );
        break;
      
      case 'swing':
        rotation.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 1500 }),
            withTiming(-5, { duration: 1500 })
          ),
          -1,
          true
        );
        break;
    }
  }, [animationType, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={animatedStyle}>
      <Feather name={icon} size={size} color={color} />
    </Reanimated.View>
  );
};

// Particle Effect Component
const ParticleEffect: React.FC<{ color: string }> = ({ color }) => {
  const particles = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      opacity: useSharedValue(0),
      scale: useSharedValue(0.3),
      delay: i * 200,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle) => {
      particle.opacity.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withDelay(1000, withTiming(0, { duration: 500 }))
        )
      );
      
      particle.x.value = withDelay(
        particle.delay,
        withTiming(
          (Math.random() - 0.5) * 100,
          { duration: 2000 }
        )
      );
      
      particle.y.value = withDelay(
        particle.delay,
        withTiming(
          -50 - Math.random() * 50,
          { duration: 2000 }
        )
      );
      
      particle.scale.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 1500 })
        )
      );
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((particle, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: particle.x.value },
            { translateY: particle.y.value },
            { scale: particle.scale.value },
          ],
          opacity: particle.opacity.value,
        }));

        return (
          <Reanimated.View
            key={index}
            style={[
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: color,
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

// Decorative Wave Background
const WaveBackground: React.FC<{ color: string }> = ({ color }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          transform: [{ translateX }],
          opacity: 0.05,
        },
      ]}
    >
      <Svg width={SCREEN_WIDTH * 2} height="100%" viewBox={`0 0 ${SCREEN_WIDTH * 2} 400`}>
        <Path
          d={`M0,200 Q${SCREEN_WIDTH/2},100 ${SCREEN_WIDTH},200 T${SCREEN_WIDTH * 2},200 L${SCREEN_WIDTH * 2},400 L0,400 Z`}
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
};

export const AnimatedEmptyState: React.FC<AnimatedEmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  showParticles = true,
  animationType = 'float',
}) => {
  const { theme } = useTheme();
  const { announce } = useAccessibility();
  const reduceMotion = useReduceMotion();
  
  // Staggered animations for text elements
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const messageOpacity = useSharedValue(0);
  const messageY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  useEffect(() => {
    if (reduceMotion) {
      // Simple fade in for reduced motion
      titleOpacity.value = withTiming(1, { duration: 300 });
      messageOpacity.value = withTiming(1, { duration: 300 });
      buttonOpacity.value = withTiming(1, { duration: 300 });
      buttonScale.value = 1;
    } else {
      // Staggered entrance animations
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      titleY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));
      
      messageOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      messageY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 100 }));
      
      buttonOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
      buttonScale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 150 }));
    }
    
    // Announce empty state to screen readers
    const announcement = `${title}. ${message || ''}`;
    announce(announcement, { delay: 100 });
  }, [title, message, reduceMotion]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const iconSize = variant === 'large' ? 80 : variant === 'compact' ? 40 : 64;
  
  return (
    <View
      style={[
        getStyles(theme).container,
        variant === 'compact' && getStyles(theme).containerCompact,
        variant === 'large' && getStyles(theme).containerLarge,
      ]}
    >
      {/* Wave Background */}
      {!reduceMotion && variant === 'large' && (
        <WaveBackground color={theme.colors.primary} />
      )}
      
      {/* Particle Effects */}
      {!reduceMotion && showParticles && (
        <ParticleEffect color={theme.colors.primary + '30'} />
      )}
      
      {/* Animated Icon */}
      <View
        style={[
          getStyles(theme).iconContainer,
          variant === 'compact' && getStyles(theme).iconContainerCompact,
        ]}
      >
        <AnimatedIcon
          icon={icon}
          size={iconSize}
          color={theme.colors.textTertiary}
          animationType={animationType}
          reduceMotion={reduceMotion}
        />
      </View>

      {/* Title */}
      <Reanimated.View style={titleAnimatedStyle}>
        <Text
          style={[
            getStyles(theme).title,
            variant === 'compact' && getStyles(theme).titleCompact,
            variant === 'large' && getStyles(theme).titleLarge,
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </Reanimated.View>

      {/* Message */}
      {message && (
        <Reanimated.View style={messageAnimatedStyle}>
          <Text
            style={[
              getStyles(theme).message,
              variant === 'compact' && getStyles(theme).messageCompact,
            ]}
            accessibilityRole="text"
          >
            {message}
          </Text>
        </Reanimated.View>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <Reanimated.View style={[getStyles(theme).actions, buttonAnimatedStyle]}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              size={variant === 'compact' ? 'small' : 'medium'}
              style={getStyles(theme).primaryAction}
              accessibilityHint={`Tap to ${actionLabel.toLowerCase()}`}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <TextButton
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              size={variant === 'compact' ? 'small' : 'medium'}
              accessibilityHint={`Tap to ${secondaryActionLabel.toLowerCase()}`}
            />
          )}
        </Reanimated.View>
      )}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.XL,
    position: 'relative',
    overflow: 'hidden',
  },

  containerCompact: {
    padding: theme.spacing.L,
  },

  containerLarge: {
    padding: theme.spacing.XXL,
  },

  iconContainer: {
    marginBottom: theme.spacing.L,
    zIndex: 1,
  },

  iconContainerCompact: {
    marginBottom: theme.spacing.M,
  },

  title: {
    ...theme.typography.title3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.XS,
    zIndex: 1,
  },

  titleCompact: {
    ...theme.typography.headline,
  },

  titleLarge: {
    ...theme.typography.title1,
  },

  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.L,
    maxWidth: 280,
    lineHeight: 22,
    zIndex: 1,
  },

  messageCompact: {
    ...theme.typography.subheadline,
    marginBottom: theme.spacing.M,
  },

  actions: {
    alignItems: 'center',
    zIndex: 1,
  },

  primaryAction: {
    marginBottom: theme.spacing.S,
    minWidth: 160,
  },
});

export default AnimatedEmptyState;