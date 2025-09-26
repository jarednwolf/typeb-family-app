/**
 * Streak Counter Component
 * Displays current streak with motivational messaging
 * Focus: Personal progress and consistency, not competition
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentDailyStreak,
  selectBestDailyStreak,
  selectStreaks,
  useStreakFreeze as useStreakFreezeAction,
} from '../../store/slices/gamificationSlice';
import { StreakData } from '../../types/achievements';
import { achievementService } from '../../services/achievementService';
import { useHaptics } from '../../utils/haptics';
import { theme } from '../../constants/theme';

interface StreakCounterProps {
  compact?: boolean;
  onPress?: () => void;
  showFreeze?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  compact = false,
  onPress,
  showFreeze = true,
}) => {
  const dispatch = useDispatch();
  const haptics = useHaptics();
  const currentStreak = useSelector(selectCurrentDailyStreak);
  const bestStreak = useSelector(selectBestDailyStreak);
  const streaks = useSelector(selectStreaks);
  const dailyStreak = streaks['daily'] as StreakData | undefined;
  
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fireAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Pulse animation for streak number
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fire animation for active streaks
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fireAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStreak]);

  const handleUseFreeze = async () => {
    if (!dailyStreak || dailyStreak.freezesAvailable <= 0) {
      Alert.alert(
        'No Freezes Available',
        'You\'ve used all your streak freezes. Keep completing tasks to maintain your streak!',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Use Streak Freeze?',
      `You have ${dailyStreak.freezesAvailable} freeze${dailyStreak.freezesAvailable > 1 ? 's' : ''} available. Use one to protect your streak for today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Freeze',
          style: 'default',
          onPress: async () => {
            const success = await achievementService.useStreakFreeze('daily');
            if (success) {
              dispatch(useStreakFreezeAction('daily'));
              haptics.notification.success();
              
              // Shake animation for freeze use
              Animated.sequence([
                Animated.timing(shakeAnim, {
                  toValue: 10,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                  toValue: -10,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                  toValue: 0,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();
            }
          },
        },
      ]
    );
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Start your streak today!';
    } else if (currentStreak === 1) {
      return 'Great start! Keep going!';
    } else if (currentStreak < 7) {
      return `${currentStreak} days strong!`;
    } else if (currentStreak < 30) {
      return `Amazing consistency!`;
    } else if (currentStreak < 100) {
      return `You're unstoppable!`;
    } else {
      return `Legendary dedication!`;
    }
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return '#9CA3AF';
    if (currentStreak < 7) return '#FCA311';
    if (currentStreak < 30) return '#FB923C';
    if (currentStreak < 100) return '#DC2626';
    return '#7C3AED';
  };

  const getStreakSecondaryColor = () => {
    if (currentStreak === 0) return '#6B7280';
    if (currentStreak < 7) return '#F59E0B';
    if (currentStreak < 30) return '#EA580C';
    if (currentStreak < 100) return '#B91C1C';
    return '#6D28D9';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: getStreakColor() }
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactGradient}>
          <MaterialCommunityIcons name="fire" size={20} color="white" />
          <Text style={styles.compactText}>{currentStreak}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.gradient,
          { backgroundColor: getStreakColor() }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Daily Streak</Text>
          {showFreeze && dailyStreak && dailyStreak.freezesAvailable > 0 && (
            <TouchableOpacity
              style={styles.freezeButton}
              onPress={handleUseFreeze}
            >
              <Animated.View
                style={[
                  styles.freezeIconContainer,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                <MaterialCommunityIcons name="snowflake" size={20} color="white" />
                <Text style={styles.freezeCount}>
                  {dailyStreak.freezesAvailable}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.streakDisplay}>
          <Animated.View
            style={[
              styles.fireContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  { translateY: fireAnim },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="fire"
              size={60}
              color="white"
              style={styles.fireIcon}
            />
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.streakNumber,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {currentStreak}
          </Animated.Text>
          
          <Text style={styles.daysLabel}>
            {currentStreak === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        <Text style={styles.message}>{getStreakMessage()}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="trophy" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{bestStreak}</Text>
          </View>
          
          {dailyStreak && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statLabel}>Started</Text>
              <Text style={styles.statValue}>
                {new Date(dailyStreak.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {currentStreak > 0 && currentStreak % 7 === 0 && (
          <View style={styles.milestoneContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.milestoneText}>
              Week {Math.floor(currentStreak / 7)} Complete!
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  freezeButton: {
    padding: 4,
  },
  freezeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freezeCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  streakDisplay: {
    alignItems: 'center',
    marginVertical: 20,
  },
  fireContainer: {
    position: 'absolute',
    top: -10,
    zIndex: 1,
  },
  fireIcon: {
    opacity: 0.9,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  daysLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: -8,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  milestoneText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  compactContainer: {
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  compactText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});