/**
 * Gamification Redux Slice
 * Manages achievement, streak, and celebration state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  Achievement,
  UserAchievement,
  FamilyAchievement,
  StreakData,
  Celebration,
  ACHIEVEMENTS_CATALOG,
} from '../../types/achievements';

interface GamificationState {
  // User achievements with progress
  userAchievements: {
    [achievementId: string]: UserAchievement;
  };
  
  // Family achievements
  familyAchievements: {
    [achievementId: string]: FamilyAchievement;
  };
  
  // Streak data
  streaks: {
    [streakType: string]: StreakData;
  };
  
  // Recent celebrations (for the celebration feed)
  celebrations: Celebration[];
  
  // Current achievement being celebrated (for modal display)
  currentCelebration: Achievement | null;
  
  // Settings
  soundEnabled: boolean;
  hapticEnabled: boolean;
  animationsEnabled: boolean;
  
  // Stats
  totalTasksCompleted: number;
  totalAchievementsUnlocked: number;
  currentDailyStreak: number;
  bestDailyStreak: number;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const initialState: GamificationState = {
  userAchievements: {},
  familyAchievements: {},
  streaks: {},
  celebrations: [],
  currentCelebration: null,
  soundEnabled: true,
  hapticEnabled: true,
  animationsEnabled: true,
  totalTasksCompleted: 0,
  totalAchievementsUnlocked: 0,
  currentDailyStreak: 0,
  bestDailyStreak: 0,
  isLoading: false,
  error: null,
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    // Set user achievements
    setUserAchievements: (state, action: PayloadAction<UserAchievement[]>) => {
      state.userAchievements = {};
      action.payload.forEach(achievement => {
        state.userAchievements[achievement.achievementId] = achievement;
      });
      
      // Update total unlocked count
      state.totalAchievementsUnlocked = action.payload.filter(
        a => a.unlockedAt != null
      ).length;
    },
    
    // Update single achievement progress
    updateAchievementProgress: (
      state,
      action: PayloadAction<{
        achievementId: string;
        progress: number;
        unlocked?: boolean;
      }>
    ) => {
      const { achievementId, progress, unlocked } = action.payload;
      
      if (!state.userAchievements[achievementId]) {
        state.userAchievements[achievementId] = {
          achievementId,
          userId: '', // Will be set by service
          progress,
          maxProgress: 0, // Will be set by service
          celebrated: false,
          notified: false,
        };
      }
      
      state.userAchievements[achievementId].progress = progress;
      
      if (unlocked) {
        state.userAchievements[achievementId].unlockedAt = new Date();
        state.totalAchievementsUnlocked += 1;
      }
    },
    
    // Unlock achievement
    unlockAchievement: (state, action: PayloadAction<string>) => {
      const achievementId = action.payload;
      
      if (state.userAchievements[achievementId]) {
        state.userAchievements[achievementId].unlockedAt = new Date();
        state.userAchievements[achievementId].celebrated = false;
        state.userAchievements[achievementId].notified = false;
        state.totalAchievementsUnlocked += 1;
      }
      
      // Find and set current celebration
      const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
      if (achievement) {
        state.currentCelebration = achievement;
      }
    },
    
    // Mark achievement as celebrated
    markAchievementCelebrated: (state, action: PayloadAction<string>) => {
      const achievementId = action.payload;
      
      if (state.userAchievements[achievementId]) {
        state.userAchievements[achievementId].celebrated = true;
      }
      
      // Clear current celebration if it matches
      if (state.currentCelebration?.id === achievementId) {
        state.currentCelebration = null;
      }
    },
    
    // Set family achievements
    setFamilyAchievements: (state, action: PayloadAction<FamilyAchievement[]>) => {
      state.familyAchievements = {};
      action.payload.forEach(achievement => {
        state.familyAchievements[achievement.achievementId] = achievement;
      });
    },
    
    // Update streak data
    updateStreak: (state, action: PayloadAction<StreakData>) => {
      const streak = action.payload;
      state.streaks[streak.streakType] = streak;
      
      // Update stats if daily streak
      if (streak.streakType === 'daily') {
        state.currentDailyStreak = streak.current;
        state.bestDailyStreak = streak.best;
      }
    },
    
    // Set all streaks
    setStreaks: (state, action: PayloadAction<StreakData[]>) => {
      state.streaks = {};
      action.payload.forEach(streak => {
        state.streaks[streak.streakType] = streak;
        
        if (streak.streakType === 'daily') {
          state.currentDailyStreak = streak.current;
          state.bestDailyStreak = streak.best;
        }
      });
    },
    
    // Increment streak
    incrementStreak: (state, action: PayloadAction<string>) => {
      const streakType = action.payload;
      
      if (state.streaks[streakType]) {
        state.streaks[streakType].current += 1;
        state.streaks[streakType].best = Math.max(
          state.streaks[streakType].best,
          state.streaks[streakType].current
        );
        state.streaks[streakType].lastActiveDate = new Date();
        
        if (streakType === 'daily') {
          state.currentDailyStreak = state.streaks[streakType].current;
          state.bestDailyStreak = state.streaks[streakType].best;
        }
      }
    },
    
    // Break streak
    breakStreak: (state, action: PayloadAction<string>) => {
      const streakType = action.payload;
      
      if (state.streaks[streakType]) {
        state.streaks[streakType].current = 0;
        state.streaks[streakType].startDate = new Date();
        
        if (streakType === 'daily') {
          state.currentDailyStreak = 0;
        }
      }
    },
    
    // Use streak freeze
    useStreakFreeze: (state, action: PayloadAction<string>) => {
      const streakType = action.payload;
      
      if (state.streaks[streakType] && 
          state.streaks[streakType].freezesAvailable > 0) {
        state.streaks[streakType].freezesAvailable -= 1;
        state.streaks[streakType].freezesUsed += 1;
      }
    },
    
    // Add celebration
    addCelebration: (state, action: PayloadAction<Celebration>) => {
      state.celebrations.unshift(action.payload);
      
      // Keep only last 50 celebrations
      if (state.celebrations.length > 50) {
        state.celebrations = state.celebrations.slice(0, 50);
      }
    },
    
    // Mark celebration as seen
    markCelebrationSeen: (state, action: PayloadAction<string>) => {
      const celebration = state.celebrations.find(c => c.id === action.payload);
      if (celebration) {
        celebration.seen = true;
      }
    },
    
    // Clear current celebration
    clearCurrentCelebration: (state) => {
      state.currentCelebration = null;
    },
    
    // Update stats
    updateStats: (
      state,
      action: PayloadAction<{
        totalTasksCompleted?: number;
      }>
    ) => {
      const { totalTasksCompleted } = action.payload;
      
      if (totalTasksCompleted !== undefined) {
        state.totalTasksCompleted = totalTasksCompleted;
      }
    },
    
    // Toggle settings
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    
    toggleHaptic: (state) => {
      state.hapticEnabled = !state.hapticEnabled;
    },
    
    toggleAnimations: (state) => {
      state.animationsEnabled = !state.animationsEnabled;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset state
    resetGamification: () => initialState,
  },
});

// Export actions
export const {
  setUserAchievements,
  updateAchievementProgress,
  unlockAchievement,
  markAchievementCelebrated,
  setFamilyAchievements,
  updateStreak,
  setStreaks,
  incrementStreak,
  breakStreak,
  useStreakFreeze,
  addCelebration,
  markCelebrationSeen,
  clearCurrentCelebration,
  updateStats,
  toggleSound,
  toggleHaptic,
  toggleAnimations,
  setLoading,
  setError,
  resetGamification,
} = gamificationSlice.actions;

// Selectors
export const selectUserAchievements = (state: RootState) => 
  state.gamification.userAchievements;

export const selectFamilyAchievements = (state: RootState) => 
  state.gamification.familyAchievements;

export const selectStreaks = (state: RootState) => 
  state.gamification.streaks;

export const selectCurrentDailyStreak = (state: RootState) => 
  state.gamification.currentDailyStreak;

export const selectBestDailyStreak = (state: RootState) => 
  state.gamification.bestDailyStreak;

export const selectCelebrations = (state: RootState) => 
  state.gamification.celebrations;

export const selectCurrentCelebration = (state: RootState) => 
  state.gamification.currentCelebration;

export const selectUnseenCelebrations = (state: RootState) => 
  state.gamification.celebrations.filter(c => !c.seen);

export const selectTotalAchievementsUnlocked = (state: RootState) => 
  state.gamification.totalAchievementsUnlocked;

export const selectTotalTasksCompleted = (state: RootState) => 
  state.gamification.totalTasksCompleted;

export const selectGamificationSettings = (state: RootState) => ({
  soundEnabled: state.gamification.soundEnabled,
  hapticEnabled: state.gamification.hapticEnabled,
  animationsEnabled: state.gamification.animationsEnabled,
});

export const selectIsGamificationLoading = (state: RootState) => 
  state.gamification.isLoading;

export const selectGamificationError = (state: RootState) => 
  state.gamification.error;

// Helper selector to get achievement with progress
export const selectAchievementsWithProgress = (state: RootState) => {
  const userAchievements = state.gamification.userAchievements;
  
  return ACHIEVEMENTS_CATALOG.map(achievement => {
    const userProgress = userAchievements[achievement.id];
    
    return {
      ...achievement,
      progress: userProgress?.progress || 0,
      maxProgress: achievement.requirement.value,
      unlocked: userProgress?.unlockedAt != null,
      celebrated: userProgress?.celebrated || false,
      progressPercentage: Math.min(
        ((userProgress?.progress || 0) / achievement.requirement.value) * 100,
        100
      ),
    };
  });
};

// Helper selector to get unlocked achievements only
export const selectUnlockedAchievements = (state: RootState) => {
  const userAchievements = state.gamification.userAchievements;
  
  return ACHIEVEMENTS_CATALOG.filter(achievement => {
    const userProgress = userAchievements[achievement.id];
    return userProgress?.unlockedAt != null;
  });
};

// Helper selector to get achievements close to unlocking (>80% progress)
export const selectAchievementsNearUnlock = (state: RootState) => {
  const userAchievements = state.gamification.userAchievements;
  
  return ACHIEVEMENTS_CATALOG.filter(achievement => {
    const userProgress = userAchievements[achievement.id];
    if (!userProgress || userProgress.unlockedAt) return false;
    
    const progressPercentage = (userProgress.progress / achievement.requirement.value) * 100;
    return progressPercentage >= 80;
  });
};

export default gamificationSlice.reducer;