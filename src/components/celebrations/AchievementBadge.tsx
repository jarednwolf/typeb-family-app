/**
 * AchievementBadge Component
 * Badge displays for achievements
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { Achievement, AchievementLevel } from '../../types/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  locked?: boolean;
  progress?: number;
  onPress?: () => void;
  animate?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showLabel = false,
  locked = false,
  progress = 0,
  onPress,
  animate = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const sizes = {
    small: 48,
    medium: 64,
    large: 96,
  };

  const iconSizes = {
    small: 20,
    medium: 28,
    large: 40,
  };

  const badgeSize = sizes[size];
  const iconSize = iconSizes[size];

  const getLevelColors = (level: AchievementLevel) => {
    const levelColors = {
      bronze: {
        primary: '#CD7F32',
        secondary: '#A0522D',
        glow: '#FFB366',
      },
      silver: {
        primary: '#C0C0C0',
        secondary: '#808080',
        glow: '#E8E8E8',
      },
      gold: {
        primary: '#FFD700',
        secondary: '#DAA520',
        glow: '#FFF4B3',
      },
      platinum: {
        primary: '#E5E4E2',
        secondary: '#A8A8A8',
        glow: '#F5F5F5',
      },
      diamond: {
        primary: '#B9F2FF',
        secondary: '#4FC3F7',
        glow: '#E1F5FE',
      },
    };
    return levelColors[level];
  };

  useEffect(() => {
    if (animate && !locked) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, locked]);

  const levelColors = getLevelColors(achievement.level);
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderBadgeContent = () => {
    if (locked) {
      return (
        <View
          style={[
            styles.badge,
            styles.badgeLocked,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Icon name="lock" size={iconSize} color={colors.gray400} />
          {progress > 0 && (
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressRingFill,
                  {
                    width: badgeSize - 8,
                    height: badgeSize - 8,
                    borderRadius: (badgeSize - 8) / 2,
                    borderWidth: 3,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                  },
                ]}
              />
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: levelColors.primary,
            borderColor: levelColors.secondary,
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <Icon
          name={achievement.icon as any}
          size={iconSize}
          color={colors.white}
        />
        
        {/* Level indicator */}
        <View
          style={[
            styles.levelIndicator,
            {
              backgroundColor: levelColors.secondary,
            },
          ]}
        >
          <Text style={styles.levelText}>
            {achievement.level.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Glow effect */}
        {animate && (
          <Animated.View
            style={[
              styles.glow,
              {
                width: badgeSize + 20,
                height: badgeSize + 20,
                borderRadius: (badgeSize + 20) / 2,
                backgroundColor: levelColors.glow,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          />
        )}
      </Animated.View>
    );
  };

  const badgeContent = (
    <View style={styles.container}>
      {renderBadgeContent()}
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              locked && styles.labelLocked,
            ]}
            numberOfLines={2}
          >
            {achievement.name}
          </Text>
          {!locked && achievement.category === 'family' && (
            <View style={styles.familyIndicator}>
              <Icon name="users" size={12} color={colors.primary} />
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={locked}
      >
        {badgeContent}
      </TouchableOpacity>
    );
  }

  return badgeContent;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: spacing.xs,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  badgeLocked: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300,
  },
  levelIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  levelText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 10,
  },
  glow: {
    position: 'absolute',
    zIndex: -1,
  },
  progressRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingFill: {
    position: 'absolute',
  },
  progressText: {
    ...typography.captionSemibold,
    color: colors.primary,
    fontSize: 10,
  },
  labelContainer: {
    marginTop: spacing.xs,
    alignItems: 'center',
    maxWidth: 80,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
  labelLocked: {
    color: colors.gray500,
  },
  familyIndicator: {
    marginTop: 4,
  },
});

export default AchievementBadge;