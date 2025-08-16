/**
 * Hook for managing streak interactions
 * Handles streak updates, freezes, and recovery
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectStreaks,
  selectCurrentDailyStreak,
  updateStreak,
  incrementStreak,
  breakStreak,
  useStreakFreeze,
} from '../store/slices/gamificationSlice';
import { achievementService } from '../services/achievementService';
import { StreakData } from '../types/achievements';
import { useHaptics } from '../utils/haptics';

interface UseStreakManagerReturn {
  currentStreak: number;
  streaks: Record<string, StreakData>;
  checkAndUpdateStreak: () => Promise<void>;
  handleStreakFreeze: (streakType: string) => Promise<boolean>;
  isStreakAtRisk: () => boolean;
  getStreakStatus: () => 'active' | 'at-risk' | 'broken';
  getDaysUntilBreak: () => number;
}

export const useStreakManager = (): UseStreakManagerReturn => {
  const dispatch = useDispatch();
  const haptics = useHaptics();
  const currentStreak = useSelector(selectCurrentDailyStreak);
  const streaks = useSelector(selectStreaks);

  /**
   * Check and update streak status
   */
  const checkAndUpdateStreak = useCallback(async () => {
    const dailyStreak = streaks['daily'];
    if (!dailyStreak) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(dailyStreak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Already updated today
      return;
    } else if (daysDiff === 1) {
      // Continue streak
      dispatch(incrementStreak('daily'));
      haptics.notification.success();
    } else if (daysDiff === 2 && dailyStreak.freezesAvailable > 0) {
      // Streak at risk, can use freeze
      // Don't automatically use freeze, let user decide
    } else {
      // Streak broken
      dispatch(breakStreak('daily'));
      haptics.notification.warning();
    }
  }, [streaks, dispatch, haptics]);

  /**
   * Handle streak freeze usage
   */
  const handleStreakFreeze = useCallback(async (streakType: string): Promise<boolean> => {
    const streak = streaks[streakType];
    if (!streak || streak.freezesAvailable <= 0) {
      return false;
    }

    const success = await achievementService.useStreakFreeze(streakType);
    if (success) {
      dispatch(useStreakFreeze(streakType));
      haptics.notification.success();
      return true;
    }
    
    return false;
  }, [streaks, dispatch, haptics]);

  /**
   * Check if streak is at risk of breaking
   */
  const isStreakAtRisk = useCallback((): boolean => {
    const dailyStreak = streaks['daily'];
    if (!dailyStreak) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(dailyStreak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    // At risk if it's been more than a day but can still be saved
    return daysDiff >= 1 && daysDiff <= 2;
  }, [streaks]);

  /**
   * Get current streak status
   */
  const getStreakStatus = useCallback((): 'active' | 'at-risk' | 'broken' => {
    const dailyStreak = streaks['daily'];
    if (!dailyStreak) return 'broken';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(dailyStreak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'active';
    if (daysDiff === 1) return 'at-risk';
    if (daysDiff === 2 && dailyStreak.freezesAvailable > 0) return 'at-risk';
    return 'broken';
  }, [streaks]);

  /**
   * Get days until streak breaks
   */
  const getDaysUntilBreak = useCallback((): number => {
    const dailyStreak = streaks['daily'];
    if (!dailyStreak) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(dailyStreak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 2; // Can miss tomorrow
    if (daysDiff === 1) return 1; // Must complete today
    if (daysDiff === 2 && dailyStreak.freezesAvailable > 0) return 1; // Can use freeze
    return 0; // Already broken
  }, [streaks]);

  // Check streak status on mount and when streaks change
  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  return {
    currentStreak,
    streaks,
    checkAndUpdateStreak,
    handleStreakFreeze,
    isStreakAtRisk,
    getStreakStatus,
    getDaysUntilBreak,
  };
};