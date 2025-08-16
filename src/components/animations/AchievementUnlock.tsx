/**
 * AchievementUnlock Component
 * 
 * Displays celebratory animations when users unlock achievements
 * Features:
 * - Multiple achievement types (badge, star, trophy, milestone)
 * - Particle effects and sparkles
 * - Sound and haptic feedback
 * - Customizable colors and styles
 * - Accessibility support
 */

import React, { useEffect, useRef } from 'react';
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
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type AchievementType = 'badge' | 'star' | 'trophy' | 'milestone' | 'streak';

interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  points?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementUnlockProps {
  achievement: Achievement;
  visible: boolean;
  onDismiss: () => void;
  autoHideDuration?: number;
  enableHaptics?: boolean;
  enableSound?: boolean;
}

// Particle component for confetti effects
const Particle: React.FC<{
  delay: number;
  startX: number;
  startY: number;
  color: string;
  index: number;
}> = ({ delay, startX, startY, color, index }) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Random end position
    const endX = startX + (Math.random() - 0.5) * 300;
    const endY = startY - Math.random() * 200 - 100;
    const duration = 1500 + Math.random() * 500;

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(duration - 400, withTiming(0, { duration: 200 }))
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }),
        withDelay(duration - 400, withTiming(0, { duration: 200 }))
      )
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(endY, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration,
        easing: Easing.linear,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 8 + Math.random() * 4,
    height: 8 + Math.random() * 4,
    backgroundColor: color,
    borderRadius: Math.random() > 0.5 ? 4 : 0,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return <Animated.View style={animatedStyle} />;
};

// Sparkle animation component
const Sparkle: React.FC<{
  x: number;
  y: number;
  delay: number;
  size?: number;
}> = ({ x, y, delay, size = 20 }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 10, stiffness: 200 }),
        withDelay(300, withTiming(0, { duration: 200 }))
      )
    );

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(300, withTiming(0, { duration: 200 }))
      )
    );

    rotate.value = withDelay(
      delay,
      withTiming(180, { duration: 700 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x - size / 2,
    top: y - size / 2,
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name="star" size={size} color={theme.colors.warning} />
    </Animated.View>
  );
};

export const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  achievement,
  visible,
  onDismiss,
  autoHideDuration = 4000,
  enableHaptics = true,
  enableSound = true,
}) => {
  const reduceMotion = useReduceMotion();
  const dismissTimer = useRef<NodeJS.Timeout>();
  
  // Animation values
  const containerScale = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const raysRotate = useSharedValue(0);

  // Get colors based on achievement type and rarity
  const getColors = () => {
    const rarityColors = {
      common: [theme.colors.primary, theme.colors.info],
      rare: [theme.colors.info, theme.colors.success],
      epic: [theme.colors.warning, theme.colors.premium],
      legendary: ['#FFD700', '#FFA500'],
    };

    return rarityColors[achievement.rarity || 'common'];
  };

  const getIcon = () => {
    const typeIcons = {
      badge: 'award',
      star: 'star',
      trophy: 'trophy',
      milestone: 'flag',
      streak: 'zap',
    };

    return achievement.icon || typeIcons[achievement.type] || 'award';
  };

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (enableHaptics) {
        HapticFeedback.impact.heavy();
      }

      // Start animations
      if (reduceMotion) {
        containerScale.value = 1;
        badgeScale.value = 1;
        titleOpacity.value = 1;
        descriptionOpacity.value = 1;
        glowOpacity.value = 0.3;
      } else {
        // Container zoom in
        containerScale.value = withSpring(1, {
          damping: 12,
          stiffness: 200,
        });

        // Badge animation sequence
        badgeScale.value = withSequence(
          withDelay(200, withSpring(1.2, { damping: 8, stiffness: 200 })),
          withSpring(1, { damping: 12, stiffness: 150 })
        );

        // Badge rotation for legendary achievements
        if (achievement.rarity === 'legendary') {
          badgeRotate.value = withRepeat(
            withTiming(360, { duration: 3000, easing: Easing.linear }),
            -1
          );
        }

        // Glow effect
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1000 }),
            withTiming(0.2, { duration: 1000 })
          ),
          -1,
          true
        );

        // Rays rotation
        raysRotate.value = withRepeat(
          withTiming(360, { duration: 10000, easing: Easing.linear }),
          -1
        );

        // Text animations
        titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
        descriptionOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
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
      cancelAnimation(badgeRotate);
      cancelAnimation(glowOpacity);
      cancelAnimation(raysRotate);
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

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const raysAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotate.value}deg` }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  const colors = getColors();
  const icon = getIcon();

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 30,
    startX: 0,
    startY: 0,
    color: i % 2 === 0 ? colors[0] : colors[1],
  }));

  // Generate sparkles
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: Math.cos((i * Math.PI * 2) / 6) * 80,
    y: Math.sin((i * Math.PI * 2) / 6) * 80,
    delay: 300 + i * 50,
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
          {/* Background glow */}
          <Animated.View style={[styles.glow, glowAnimatedStyle]}>
            <View style={[styles.glowGradient, { backgroundColor: colors[0] }]} />
          </Animated.View>

          {/* Rotating rays */}
          {achievement.rarity === 'legendary' && (
            <Animated.View style={[styles.rays, raysAnimatedStyle]}>
              {Array.from({ length: 8 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.ray,
                    {
                      transform: [{ rotate: `${i * 45}deg` }],
                    },
                  ]}
                />
              ))}
            </Animated.View>
          )}

          {/* Badge/Icon */}
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <View style={[styles.badgeGradient, { backgroundColor: colors[0] }]}>
              <Feather name={icon as any} size={48} color={theme.colors.white} />
            </View>

            {/* Particles */}
            {!reduceMotion && particles.map((particle) => (
              <Particle
                key={particle.id}
                delay={particle.delay}
                startX={particle.startX}
                startY={particle.startY}
                color={particle.color}
                index={particle.id}
              />
            ))}

            {/* Sparkles */}
            {!reduceMotion && sparkles.map((sparkle) => (
              <Sparkle
                key={sparkle.id}
                x={sparkle.x}
                y={sparkle.y}
                delay={sparkle.delay}
              />
            ))}
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            {achievement.title}
          </Animated.Text>

          {/* Description */}
          <Animated.Text style={[styles.description, descriptionAnimatedStyle]}>
            {achievement.description}
          </Animated.Text>

          {/* Points */}
          {achievement.points && (
            <Animated.View style={[styles.pointsContainer, descriptionAnimatedStyle]}>
              <View style={[styles.pointsBadge, { backgroundColor: colors[0] }]}>
                <Text style={styles.pointsText}>+{achievement.points} XP</Text>
              </View>
            </Animated.View>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    minWidth: 300,
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
    opacity: 0.2,
  },
  rays: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  badge: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation[8],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 16,
    maxWidth: 250,
  },
  pointsContainer: {
    marginTop: 8,
  },
  pointsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});

export default AchievementUnlock;