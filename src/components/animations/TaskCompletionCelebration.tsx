/**
 * TaskCompletionCelebration Component
 * 
 * Enhanced celebration animation for task completion using Reanimated 2
 * Features:
 * - Confetti particle effects
 * - Scale and bounce animations
 * - Accessibility support (respects reduceMotion)
 * - Haptic feedback
 * - Sound effects (optional)
 * - Multiple celebration styles
 */

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
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { getRandomEncouragement } from '../../services/encouragementMessages';
import { HapticFeedback } from '../../utils/haptics';

interface TaskCompletionCelebrationProps {
  onAnimationEnd?: () => void;
  style?: 'minimal' | 'standard' | 'grand';
  message?: string;
  showConfetti?: boolean;
  playSound?: boolean;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#FF6B6B', '#4ECDC4'];
const PARTICLE_COUNT = 12;

const TaskCompletionCelebration: React.FC<TaskCompletionCelebrationProps> = ({
  onAnimationEnd,
  style = 'standard',
  message,
  showConfetti = true,
  playSound = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const checkRotation = useSharedValue(0);
  const messageY = useSharedValue(20);
  const messageOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const starburstScale = useSharedValue(0);
  const starburstOpacity = useSharedValue(0);
  const starburstRotation = useSharedValue(0);
  
  // Confetti particles
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
    scale: useSharedValue(1),
  }));

  const encouragementMessage = message || getRandomEncouragement();

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      HapticFeedback.impact.medium();
    } else {
      HapticFeedback.notification.success();
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    onAnimationEnd?.();
  }, [onAnimationEnd]);

  useEffect(() => {
    'worklet';
    
    // Trigger haptic feedback
    runOnJS(triggerHaptic)();
    
    if (reduceMotion) {
      // Simple, reduced motion animation
      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 300 });
      messageOpacity.value = withSequence(
        withDelay(300, withTiming(1, { duration: 200 })),
        withDelay(1000, withTiming(0, { duration: 200 }))
      );
      
      setTimeout(() => {
        runOnJS(handleAnimationComplete)();
      }, 1800);
      return;
    }
    
    // Full animations based on style
    switch (style) {
      case 'minimal':
        // Simple check mark fade in
        checkOpacity.value = withSpring(1);
        checkScale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        });
        messageOpacity.value = withSequence(
          withDelay(200, withTiming(1, { duration: 300 })),
          withDelay(800, withTiming(0, { duration: 300 }))
        );
        messageY.value = withTiming(-20, { duration: 800 });
        
        setTimeout(() => {
          runOnJS(handleAnimationComplete)();
        }, 1600);
        break;
        
      case 'grand':
        // Everything animated with extra effects
        // Ring effect
        ringScale.value = withTiming(2, { 
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
        ringOpacity.value = withSequence(
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
        
        // Starburst
        starburstScale.value = withTiming(1.5, { duration: 800 });
        starburstOpacity.value = withSequence(
          withTiming(0.8, { duration: 200 }),
          withDelay(200, withTiming(0, { duration: 400 }))
        );
        starburstRotation.value = withTiming(45, { duration: 800 });
        
        // Fall through to standard animations
        
      case 'standard':
      default:
        // Check mark with bounce
        checkOpacity.value = withTiming(1, { duration: 200 });
        checkScale.value = withSequence(
          withSpring(1.3, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 180 })
        );
        checkRotation.value = withSequence(
          withSpring(-10, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        
        // Message animation
        messageOpacity.value = withSequence(
          withDelay(300, withTiming(1, { duration: 300 })),
          withDelay(1000, withTiming(0, { duration: 300 }))
        );
        messageY.value = withTiming(-40, { 
          duration: 1200,
          easing: Easing.out(Easing.quad),
        });
        
        // Confetti particles
        if (showConfetti && (style === 'standard' || style === 'grand')) {
          particles.forEach((particle, index) => {
            const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance - 50;
            
            particle.opacity.value = withSequence(
              withDelay(index * 30, withTiming(1, { duration: 200 })),
              withDelay(600, withTiming(0, { duration: 400 }))
            );
            
            particle.translateX.value = withDelay(
              index * 30,
              withSpring(targetX, {
                damping: 8,
                stiffness: 100,
                velocity: Math.random() * 200,
              })
            );
            
            particle.translateY.value = withDelay(
              index * 30,
              withTiming(targetY, {
                duration: 1000,
                easing: Easing.out(Easing.quad),
              })
            );
            
            particle.rotation.value = withDelay(
              index * 30,
              withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
                duration: 1000,
              })
            );
            
            particle.scale.value = withDelay(
              index * 30,
              withTiming(0.5, { duration: 1000 })
            );
          });
        }
        
        setTimeout(() => {
          runOnJS(handleAnimationComplete)();
        }, 2000);
        break;
    }
  }, [style, reduceMotion]);

  // Animated styles
  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotation.value}deg` },
    ],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageY.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const starburstAnimatedStyle = useAnimatedStyle(() => ({
    opacity: starburstOpacity.value,
    transform: [
      { scale: starburstScale.value },
      { rotate: `${starburstRotation.value}deg` },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Ring effect for grand style */}
      {style === 'grand' && (
        <Animated.View
          style={[
            styles.ring,
            ringAnimatedStyle,
            { borderColor: theme.colors.success },
          ]}
        />
      )}
      
      {/* Starburst for grand style */}
      {style === 'grand' && (
        <Animated.View style={[styles.starburst, starburstAnimatedStyle]}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.starRay,
                {
                  backgroundColor: theme.colors.warning,
                  transform: [{ rotate: `${i * 45}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
      
      {/* Confetti particles */}
      {showConfetti && (style === 'standard' || style === 'grand') && !reduceMotion && (
        <>
          {particles.map((particle, index) => {
            const particleStyle = useAnimatedStyle(() => ({
              opacity: particle.opacity.value,
              transform: [
                { translateX: particle.translateX.value },
                { translateY: particle.translateY.value },
                { rotate: `${particle.rotation.value}deg` },
                { scale: particle.scale.value },
              ],
            }));
            
            return (
              <Animated.View
                key={particle.id}
                style={[
                  styles.confettiParticle,
                  particleStyle,
                  { backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] },
                ]}
              />
            );
          })}
        </>
      )}
      
      {/* Success checkmark */}
      <Animated.View style={[styles.checkContainer, checkAnimatedStyle]}>
        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: theme.colors.success,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            },
          ]}
        >
          <Feather name="check" size={style === 'grand' ? 40 : 32} color="#FFFFFF" />
        </View>
      </Animated.View>
      
      {/* Encouragement message */}
      <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
        <Text
          style={[
            styles.messageText,
            { 
              color: theme.colors.success,
              fontSize: style === 'grand' ? 24 : 20,
            },
          ]}
        >
          {encouragementMessage}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  starburst: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starRay: {
    position: 'absolute',
    width: 4,
    height: 60,
    borderRadius: 2,
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  checkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    position: 'absolute',
    top: '35%',
    paddingHorizontal: 40,
  },
  messageText: {
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default TaskCompletionCelebration;