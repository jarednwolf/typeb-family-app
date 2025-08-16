import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';

interface StreakDisplayProps {
  streak: number;
  previousStreak?: number;
  lastActiveDate?: Date;
  style?: ViewStyle;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  previousStreak = 0,
  lastActiveDate,
  style,
}) => {
  const { theme, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(previousStreak)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayStreak, setDisplayStreak] = useState(streak);
  
  // Check if streak was recently broken (within last 2 days)
  const wasRecentlyBroken = () => {
    if (!lastActiveDate || streak > 0) return false;
    
    const now = new Date();
    const daysSinceActive = Math.floor(
      (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceActive <= 2 && previousStreak > 0;
  };
  
  const isStreakActive = streak > 0;
  const showRecoveryMessage = wasRecentlyBroken();
  
  useEffect(() => {
    // Animate streak number change
    animatedValue.addListener(({ value }) => {
      setDisplayStreak(Math.round(value));
    });
    
    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue: streak,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
          friction: 3,
          tension: 180,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
          tension: 180,
        }),
      ]),
    ]).start();
    
    return () => {
      animatedValue.removeAllListeners();
    };
  }, [streak]);
  
  const getStreakColor = () => {
    if (streak >= 30) return theme.colors.success;
    if (streak >= 14) return '#FFB800'; // Gold
    if (streak >= 7) return theme.colors.warning;
    if (streak >= 3) return theme.colors.info;
    return theme.colors.textSecondary;
  };
  
  const getFlameText = () => {
    if (streak >= 30) return '[FIRE FIRE FIRE]';
    if (streak >= 14) return '[FIRE FIRE]';
    if (streak >= 7) return '[FIRE]';
    if (streak >= 3) return '[FLAME]';
    return '';
  };
  
  const streakColor = getStreakColor();
  const flameText = getFlameText();
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.streakBadge,
          {
            backgroundColor: isDarkMode 
              ? streakColor + '20' 
              : streakColor + '15',
            borderColor: streakColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.streakContent}>
          <Text style={[styles.streakNumber, { color: streakColor }]}>
            {displayStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
            Day{displayStreak !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {isStreakActive && flameText && (
          <Text style={[styles.flameText, { color: streakColor }]}>
            {flameText}
          </Text>
        )}
      </Animated.View>
      
      {showRecoveryMessage && (
        <View style={styles.recoveryMessage}>
          <Text style={[styles.recoveryText, { color: theme.colors.textTertiary }]}>
            You had a {previousStreak} day streak!
          </Text>
          <Text style={[styles.motivationText, { color: theme.colors.primary }]}>
            Start a new one today!
          </Text>
        </View>
      )}
      
      {!isStreakActive && !showRecoveryMessage && (
        <Text style={[styles.inactiveText, { color: theme.colors.textTertiary }]}>
          Complete tasks daily to build your streak!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  streakBadge: {
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    borderRadius: borderRadius.large,
    borderWidth: 2,
    minWidth: 120,
    alignItems: 'center',
  },
  streakContent: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
  flameText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.XS,
    letterSpacing: 1,
  },
  recoveryMessage: {
    marginTop: spacing.M,
    alignItems: 'center',
  },
  recoveryText: {
    fontSize: 14,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.XXS,
  },
  inactiveText: {
    fontSize: 14,
    marginTop: spacing.M,
    textAlign: 'center',
  },
});

export default StreakDisplay;