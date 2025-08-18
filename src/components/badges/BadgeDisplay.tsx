/**
 * Badge Display Component
 * Shows individual achievement badge with progress
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Achievement, AchievementLevel } from '../../types/achievements';
import { useHaptics } from '../../utils/haptics';
import { ReactionDisplay } from '../reactions';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface BadgeDisplayProps {
  achievement: Achievement & {
    progress: number;
    unlocked: boolean;
    celebrated?: boolean;
    progressPercentage: number;
    reactions?: Record<string, any>;
  };
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showName?: boolean;
  animated?: boolean;
  showReactions?: boolean;
}

const BADGE_COLORS: Record<AchievementLevel, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const BADGE_SIZES = {
  small: {
    container: 60,
    icon: 24,
    border: 2,
    fontSize: 10,
  },
  medium: {
    container: 80,
    icon: 32,
    border: 3,
    fontSize: 12,
  },
  large: {
    container: 100,
    icon: 40,
    border: 4,
    fontSize: 14,
  },
};

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  achievement,
  onPress,
  size = 'medium',
  showProgress = true,
  showName = true,
  animated = true,
  showReactions = false,
}) => {
  const haptics = useHaptics();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const shine = useSharedValue(0);

  const sizeConfig = BADGE_SIZES[size];
  const badgeColor = achievement.unlocked
    ? BADGE_COLORS[achievement.level]
    : theme.colors.separator;

  useEffect(() => {
    if (animated) {
      // Entrance animation
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
      });

      if (achievement.unlocked) {
        // Unlocked badge animations
        rotation.value = withSequence(
          withTiming(5, { duration: 100 }),
          withTiming(-5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );

        // Shine effect for unlocked badges
        shine.value = withRepeat(
          withTiming(1, { duration: 2000 }),
          -1,
          false
        );
      }

      // Progress bar animation
      progressWidth.value = withTiming(achievement.progressPercentage, {
        duration: 800,
      });
    } else {
      scale.value = 1;
      progressWidth.value = achievement.progressPercentage;
    }
  }, [achievement.unlocked, achievement.progressPercentage, animated]);

  const handlePress = () => {
    if (onPress) {
      haptics.selection();
      
      // Bounce animation on press
      scale.value = withSequence(
        withSpring(0.9, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      
      onPress();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shine.value,
      [0, 0.5, 1],
      [0, 0.3, 0],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        translateX: interpolate(
          shine.value,
          [0, 1],
          [-sizeConfig.container, sizeConfig.container],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handlePress} disabled={!onPress}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Badge Circle */}
          <View
            style={[
              styles.badge,
              {
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
                borderWidth: sizeConfig.border,
                borderColor: badgeColor,
                backgroundColor: achievement.unlocked
                  ? `${badgeColor}20`
                  : theme.colors.inputBackground,
              },
            ]}
          >
            {/* Icon */}
            <Ionicons
              name={achievement.icon as any}
              size={sizeConfig.icon}
              color={achievement.unlocked ? badgeColor : theme.colors.textTertiary}
            />

            {/* Level indicator for unlocked badges */}
            {achievement.unlocked && (
              <View
                style={[
                  styles.levelIndicator,
                  {
                    backgroundColor: badgeColor,
                    bottom: -sizeConfig.border,
                  },
                ]}
              >
                <Ionicons
                  name="star"
                  size={sizeConfig.icon * 0.4}
                  color={theme.colors.white}
                />
              </View>
            )}

            {/* Lock overlay for locked badges */}
            {!achievement.unlocked && (
              <View style={styles.lockOverlay}>
                <Ionicons
                  name="lock-closed"
                  size={sizeConfig.icon * 0.5}
                  color={theme.colors.textTertiary}
                />
              </View>
            )}

            {/* Shine effect for unlocked badges */}
            {achievement.unlocked && animated && (
              <Animated.View
                style={[
                  styles.shine,
                  shineStyle,
                  {
                    width: sizeConfig.container * 0.3,
                    height: sizeConfig.container * 1.5,
                  },
                ]}
              />
            )}
          </View>

          {/* Progress Ring */}
          {showProgress && !achievement.unlocked && (
            <View
              style={[
                styles.progressRing,
                {
                  width: sizeConfig.container + 8,
                  height: sizeConfig.container + 8,
                  borderRadius: (sizeConfig.container + 8) / 2,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  progressStyle,
                  {
                    backgroundColor: theme.colors.info,
                    height: 2,
                  },
                ]}
              />
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Name and Progress Text */}
      {showName && (
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.name,
              {
                fontSize: sizeConfig.fontSize,
                color: achievement.unlocked
                  ? theme.colors.textPrimary
                  : theme.colors.textTertiary,
              },
            ]}
            numberOfLines={2}
          >
            {achievement.name}
          </Text>
          
          {showProgress && !achievement.unlocked && (
            <Text
              style={[
                styles.progress,
                { fontSize: sizeConfig.fontSize * 0.8 },
              ]}
            >
              {achievement.progress}/{achievement.requirement.value}
            </Text>
          )}
        </View>
      )}
      
      {/* Reactions for unlocked achievements - Week 4 Social Features */}
      {showReactions && achievement.unlocked && userProfile && (
        <View style={styles.reactionsContainer}>
          <ReactionDisplay
            contentType="achievement"
            contentId={achievement.id}
            reactions={achievement.reactions}
            compact={size === 'small'}
            showUserList={false}
            allowReaction={true}
            maxReactionsShown={3}
            onReactionAdded={(reaction) => {
              haptics.selection();
              // Celebrate the reaction with a small animation
              scale.value = withSequence(
                withSpring(1.1, { damping: 10 }),
                withSpring(1, { damping: 15 })
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  levelIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 2,
  },
  progressRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.separator,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    borderRadius: 1,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '45deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.XS,
    width: 100,
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  progress: {
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  reactionsContainer: {
    marginTop: theme.spacing.XS,
    alignItems: 'center',
  },
});

export default BadgeDisplay;