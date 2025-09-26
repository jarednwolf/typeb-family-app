import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
  withRepeat,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AchievementUnlockAnimationProps {
  visible: boolean;
  achievementName: string;
  achievementIcon?: string;
  achievementDescription?: string;
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  onComplete?: () => void;
}

const ACHIEVEMENT_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const ACHIEVEMENT_ICONS = {
  bronze: 'medal-outline',
  silver: 'medal',
  gold: 'trophy',
  platinum: 'diamond',
};

export const AchievementUnlockAnimation: React.FC<AchievementUnlockAnimationProps> = ({
  visible,
  achievementName,
  achievementIcon,
  achievementDescription,
  level = 'bronze',
  onComplete,
}) => {
  const { settings } = useAccessibility();
  const reduceMotion = settings.reduceMotion;
  
  // Animation values
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const badgeScale = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const glow = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  
  // Confetti particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
    scale: useSharedValue(0),
  }));

  const startAnimation = useCallback(() => {
    'worklet';
    
    if (reduceMotion) {
      // Simple fade-in for reduced motion
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      
      if (onComplete) {
        runOnJS(HapticFeedback.notification.success)();
        runOnJS(onComplete)();
      }
      return;
    }
    
    // Trigger haptic feedback
    runOnJS(HapticFeedback.notification.success)();
    
    // Main badge entrance animation
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
    
    // Badge scale with bounce
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(0.9, { damping: 10, stiffness: 180 }),
      withSpring(1.05, { damping: 12, stiffness: 160 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    
    // Badge rotation wobble
    rotation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    
    // Inner badge scale animation
    badgeScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      )
    );
    
    // Shimmer effect
    shimmer.value = withDelay(
      400,
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 400 })
      )
    );
    
    // Glow pulse
    glow.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        2,
        false
      )
    );
    
    // Confetti particles animation
    particles.forEach((particle, index) => {
      const delay = index * 50;
      const angle = (index * 30) * Math.PI / 180;
      const distance = 100 + Math.random() * 50;
      
      particle.opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(800, withTiming(0, { duration: 400 }))
        )
      );
      
      particle.x.value = withDelay(
        delay,
        withSpring(Math.cos(angle) * distance, {
          damping: 20,
          stiffness: 100,
        })
      );
      
      particle.y.value = withDelay(
        delay,
        withSequence(
          withSpring(-distance * 0.5, { damping: 15, stiffness: 120 }),
          withTiming(distance * 0.8, { duration: 800 })
        )
      );
      
      particle.rotation.value = withDelay(
        delay,
        withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1200 })
      );
      
      particle.scale.value = withDelay(
        delay,
        withSequence(
          withSpring(1, { damping: 15, stiffness: 200 }),
          withDelay(600, withTiming(0, { duration: 400 }))
        )
      );
    });
    
    // Trigger completion callback after animation
    if (onComplete) {
      setTimeout(() => {
        runOnJS(onComplete)();
      }, 3000);
    }
  }, [reduceMotion, onComplete]);

  const resetAnimation = useCallback(() => {
    'worklet';
    scale.value = 0;
    rotation.value = 0;
    opacity.value = 0;
    translateY.value = 100;
    badgeScale.value = 0;
    shimmer.value = 0;
    glow.value = 0;
    
    particles.forEach((particle) => {
      particle.x.value = 0;
      particle.y.value = 0;
      particle.opacity.value = 0;
      particle.rotation.value = 0;
      particle.scale.value = 0;
    });
  }, []);

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible, startAnimation, resetAnimation]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.2]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-200, 200],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  if (!visible) return null;

  const color = ACHIEVEMENT_COLORS[level];
  const iconName = achievementIcon || ACHIEVEMENT_ICONS[level];

  return (
    <View style={styles.overlay}>
      {/* Particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              backgroundColor: color,
            },
            useAnimatedStyle(() => ({
              opacity: particle.opacity.value,
              transform: [
                { translateX: particle.x.value },
                { translateY: particle.y.value },
                { rotate: `${particle.rotation.value}deg` },
                { scale: particle.scale.value },
              ],
            })),
          ]}
        />
      ))}

      <Animated.View style={[styles.container, containerStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, glowStyle, { backgroundColor: color }]} />
        
        {/* Badge container */}
        <View style={styles.badgeContainer}>
          <Animated.View style={[styles.badge, badgeStyle, { borderColor: color }]}>
            <Ionicons
              name={iconName as any}
              size={60}
              color={color}
            />
            
            {/* Shimmer effect */}
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </Animated.View>
        </View>
        
        {/* Achievement text */}
        <View style={styles.textContainer}>
          <Text style={[styles.unlockText, { color }]}>ACHIEVEMENT UNLOCKED!</Text>
          <Text style={styles.achievementName}>{achievementName}</Text>
          {achievementDescription && (
            <Text style={styles.achievementDescription}>{achievementDescription}</Text>
          )}
        </View>
        
        {/* Level indicator */}
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Text style={styles.levelText}>{level.toUpperCase()}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.XL,
    alignItems: 'center',
    ...theme.elevation[4],
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  badgeContainer: {
    marginBottom: theme.spacing.L,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.M,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: theme.spacing.XS,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XS,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.XS,
  },
  levelBadge: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.XS,
    borderRadius: theme.borderRadius.medium,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
    letterSpacing: 1,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});