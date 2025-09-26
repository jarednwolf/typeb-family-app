/**
 * CelebrationOverlay Component
 * Full-screen celebration animations with confetti and particle effects
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { Achievement } from '../../types/achievements';
import CelebrationAnimation from './CelebrationAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  achievement: Achievement;
  memberName: string;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  achievement,
  memberName,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after delay
      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowConfetti(false);
      onDismiss();
    });
  };

  const getLevelColor = () => {
    const levelColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return levelColors[achievement.level] || colors.primary;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Confetti Animation */}
        {showConfetti && <CelebrationAnimation type="confetti" />}

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Achievement Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getLevelColor() }]}>
            <Icon name={achievement.icon as any} size={48} color={colors.white} />
          </View>

          {/* Level Badge */}
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
            <Text style={styles.levelText}>{achievement.level.toUpperCase()}</Text>
          </View>

          {/* Achievement Name */}
          <Text style={styles.achievementName}>{achievement.name}</Text>

          {/* Member Name */}
          <Text style={styles.memberName}>{memberName}</Text>

          {/* Achievement Description */}
          <Text style={styles.description}>{achievement.description}</Text>

          {/* Encouragement Message */}
          {achievement.encouragementMessage && (
            <View style={styles.encouragementContainer}>
              <Icon name="heart" size={20} color={colors.success} />
              <Text style={styles.encouragementText}>
                {achievement.encouragementMessage}
              </Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 10,
  },
  achievementName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  memberName: {
    ...typography.bodySemibold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  encouragementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  encouragementText: {
    ...typography.body,
    color: colors.success,
    marginLeft: spacing.xs,
    flex: 1,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  continueButtonText: {
    ...typography.bodySemibold,
    color: colors.white,
  },
});

export default CelebrationOverlay;