/**
 * Badge Unlock Modal Component
 * Celebrates achievement unlocks with animations
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
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
} from 'react-native-reanimated';
// Note: Using semi-transparent background instead of BlurView for compatibility
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Achievement, AchievementLevel } from '../../types/achievements';
import { BadgeDisplay } from './BadgeDisplay';
import { HapticFeedback } from '../../utils/haptics';
import { useDispatch } from 'react-redux';
import { markAchievementCelebrated } from '../../store/slices/gamificationSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BadgeUnlockModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
  onShare?: () => void;
}

const LEVEL_COLORS: Record<AchievementLevel, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  achievement,
  visible,
  onClose,
  onShare,
}) => {
  const dispatch = useDispatch();
  
  // Animation values
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiProgress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  
  // Confetti particles (simplified for performance)
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
  }));

  useEffect(() => {
    if (visible && achievement) {
      // Trigger haptic celebration
      HapticFeedback.celebration();
      
      // Reset values
      scale.value = 0;
      rotation.value = 0;
      opacity.value = 0;
      confettiProgress.value = 0;
      textOpacity.value = 0;
      buttonScale.value = 0;
      
      // Start animations
      opacity.value = withTiming(1, { duration: 300 });
      
      // Badge entrance
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(0.9, { damping: 10, stiffness: 180 }),
        withSpring(1.05, { damping: 12, stiffness: 160 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      
      // Badge rotation
      rotation.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      
      // Text fade in
      textOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
      
      // Button scale in
      buttonScale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 200 }));
      
      // Confetti animation
      particles.forEach((particle, index) => {
        const delay = index * 30;
        const angle = (index * 18) * Math.PI / 180;
        const distance = 150 + Math.random() * 100;
        
        particle.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(1000, withTiming(0, { duration: 500 }))
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
            withSpring(-distance * 0.7, { damping: 15, stiffness: 120 }),
            withTiming(SCREEN_HEIGHT, { duration: 1000 })
          )
        );
        
        particle.rotation.value = withDelay(
          delay,
          withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1500 })
        );
      });
      
      // Mark as celebrated after animation
      setTimeout(() => {
        if (achievement.id) {
          dispatch(markAchievementCelebrated(achievement.id));
        }
      }, 2000);
    } else {
      // Hide animations
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0, { duration: 300 });
    }
  }, [visible, achievement]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (!achievement) return null;

  const levelColor = LEVEL_COLORS[achievement.level];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={styles.backdrop} />
        
        {/* Confetti Particles */}
        {particles.map((particle, index) => (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                backgroundColor: levelColor,
              },
              useAnimatedStyle(() => ({
                opacity: particle.opacity.value,
                transform: [
                  { translateX: particle.x.value },
                  { translateY: particle.y.value },
                  { rotate: `${particle.rotation.value}deg` },
                ],
              })),
            ]}
          />
        ))}
        
        <Animated.View style={[styles.modalContent, modalContentStyle]}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </Pressable>
          
          {/* Title */}
          <Animated.Text style={[styles.title, { color: levelColor }]}>
            ACHIEVEMENT UNLOCKED!
          </Animated.Text>
          
          {/* Badge */}
          <View style={styles.badgeContainer}>
            <BadgeDisplay
              achievement={{
                ...achievement,
                progress: achievement.requirement.value,
                unlocked: true,
                celebrated: false,
                progressPercentage: 100,
              }}
              size="large"
              showProgress={false}
              showName={false}
              animated={true}
            />
          </View>
          
          {/* Achievement Info */}
          <Animated.View style={[styles.infoContainer, textStyle]}>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            
            {achievement.encouragementMessage && (
              <View style={[styles.messageBox, { backgroundColor: `${levelColor}15` }]}>
                <Text style={[styles.encouragementMessage, { color: levelColor }]}>
                  {achievement.encouragementMessage}
                </Text>
              </View>
            )}
          </Animated.View>
          
          {/* Action Buttons */}
          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            {onShare && (
              <Pressable
                style={[styles.button, styles.shareButton, { backgroundColor: levelColor }]}
                onPress={onShare}
              >
                <Ionicons name="share-social" size={20} color={theme.colors.white} />
                <Text style={styles.shareButtonText}>Share</Text>
              </Pressable>
            )}
            
            <Pressable
              style={[styles.button, styles.continueButton]}
              onPress={onClose}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.L,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.M,
    right: theme.spacing.M,
    zIndex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: theme.spacing.L,
  },
  badgeContainer: {
    marginVertical: theme.spacing.L,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.L,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XS,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.M,
  },
  messageBox: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.S,
  },
  encouragementMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.S,
  },
  button: {
    paddingHorizontal: theme.spacing.L,
    paddingVertical: theme.spacing.S,
    borderRadius: theme.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.XS,
  },
  shareButton: {
    flex: 1,
  },
  shareButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
  },
  continueButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});

export default BadgeUnlockModal;