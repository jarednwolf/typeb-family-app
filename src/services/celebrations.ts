/**
 * Celebrations Service
 * Manages achievements, celebrations, and their integration with other systems
 */

import firestore from '@react-native-firebase/firestore';
import { 
  Achievement, 
  UserAchievement, 
  FamilyAchievement, 
  Celebration,
  ACHIEVEMENTS_CATALOG,
  AchievementCategory,
  StreakData,
} from '../types/achievements';
import { Task } from '../types/models';
import * as notificationService from './smartNotifications';
import * as analyticsService from './analytics';

const USERS_COLLECTION = 'users';
const FAMILIES_COLLECTION = 'families';
const ACHIEVEMENTS_COLLECTION = 'achievements';
const CELEBRATIONS_COLLECTION = 'celebrations';
const STREAKS_COLLECTION = 'streaks';

/**
 * Check and unlock achievements when a task is completed
 */
export const checkAchievementsOnTaskComplete = async (
  userId: string,
  familyId: string,
  task: Task
): Promise<Achievement[]> => {
  const unlockedAchievements: Achievement[] = [];

  try {
    // Get user's current achievements
    const userAchievementsDoc = await firestore()
      .collection(ACHIEVEMENTS_COLLECTION)
      .doc(userId)
      .get();

    const userAchievements = userAchievementsDoc.data()?.achievements || {};

    // Get user's task completion count
    const tasksSnapshot = await firestore()
      .collection('tasks')
      .where('assignedTo', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const completedTaskCount = tasksSnapshot.size;

    // Check milestone achievements
    for (const achievement of ACHIEVEMENTS_CATALOG) {
      if (achievement.category === 'milestone' && 
          achievement.requirement.type === 'count' &&
          achievement.requirement.unit === 'tasks') {
        
        const achievementKey = achievement.id;
        const currentAchievement = userAchievements[achievementKey];
        
        if (!currentAchievement?.unlockedAt && 
            completedTaskCount >= achievement.requirement.value) {
          // Unlock achievement
          await unlockAchievement(userId, achievement);
          unlockedAchievements.push(achievement);
        }
      }
    }

    // Check streak achievements
    const streakData = await updateStreak(userId, 'daily');
    if (streakData) {
      for (const achievement of ACHIEVEMENTS_CATALOG) {
        if (achievement.category === 'streak' && 
            achievement.requirement.type === 'streak') {
          
          const achievementKey = achievement.id;
          const currentAchievement = userAchievements[achievementKey];
          
          if (!currentAchievement?.unlockedAt && 
              streakData.current >= achievement.requirement.value) {
            // Unlock achievement
            await unlockAchievement(userId, achievement);
            unlockedAchievements.push(achievement);
          }
        }
      }
    }

    // Check special achievements (e.g., time-based)
    const completionHour = new Date().getHours();
    
    // Early bird achievement
    if (completionHour < 7) {
      const earlyBirdAchievement = ACHIEVEMENTS_CATALOG.find(a => a.id === 'early_bird');
      if (earlyBirdAchievement && !userAchievements.early_bird?.unlockedAt) {
        await unlockAchievement(userId, earlyBirdAchievement);
        unlockedAchievements.push(earlyBirdAchievement);
      }
    }
    
    // Night owl achievement
    if (completionHour >= 22) {
      const nightOwlAchievement = ACHIEVEMENTS_CATALOG.find(a => a.id === 'night_owl');
      if (nightOwlAchievement && !userAchievements.night_owl?.unlockedAt) {
        await unlockAchievement(userId, nightOwlAchievement);
        unlockedAchievements.push(nightOwlAchievement);
      }
    }

    // Check family achievements
    if (familyId) {
      const familyAchievements = await checkFamilyAchievements(familyId, userId);
      unlockedAchievements.push(...familyAchievements);
    }

    // Create celebrations for unlocked achievements
    for (const achievement of unlockedAchievements) {
      await createCelebration({
        type: 'achievement',
        userId,
        familyId,
        title: `Achievement Unlocked: ${achievement.name}`,
        message: achievement.encouragementMessage || achievement.description,
        icon: achievement.icon,
        timestamp: new Date(),
        seen: false,
      });

      // Send notification
      await notificationService.sendSmartNotification(
        userId,
        'achievement_unlocked',
        {
          title: '🎉 Achievement Unlocked!',
          body: `You've earned "${achievement.name}"! ${achievement.encouragementMessage || ''}`,
          data: {
            achievementId: achievement.id,
            type: 'achievement',
          },
        }
      );

      // Track analytics
      await analyticsService.trackEvent('achievement_unlocked', {
        achievementId: achievement.id,
        achievementName: achievement.name,
        achievementLevel: achievement.level,
        achievementCategory: achievement.category,
        userId,
        familyId,
      });
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

/**
 * Unlock an achievement for a user
 */
const unlockAchievement = async (
  userId: string,
  achievement: Achievement
): Promise<void> => {
  const userAchievement: UserAchievement = {
    achievementId: achievement.id,
    userId,
    progress: achievement.requirement.value,
    maxProgress: achievement.requirement.value,
    unlockedAt: new Date(),
    celebrated: false,
    notified: false,
  };

  await firestore()
    .collection(ACHIEVEMENTS_COLLECTION)
    .doc(userId)
    .set(
      {
        achievements: {
          [achievement.id]: userAchievement,
        },
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
};

/**
 * Check family achievements
 */
const checkFamilyAchievements = async (
  familyId: string,
  contributorId: string
): Promise<Achievement[]> => {
  const unlockedAchievements: Achievement[] = [];

  try {
    // Get family members
    const familyDoc = await firestore()
      .collection(FAMILIES_COLLECTION)
      .doc(familyId)
      .get();

    const memberIds = familyDoc.data()?.memberIds || [];

    // Check if all members completed tasks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allMembersCompletedToday = await Promise.all(
      memberIds.map(async (memberId: string) => {
        const snapshot = await firestore()
          .collection('tasks')
          .where('assignedTo', '==', memberId)
          .where('status', '==', 'completed')
          .where('completedAt', '>=', today)
          .limit(1)
          .get();
        return !snapshot.empty;
      })
    );

    if (allMembersCompletedToday.every(completed => completed)) {
      // Check family achievements
      const familyAchievementsDoc = await firestore()
        .collection(ACHIEVEMENTS_COLLECTION)
        .doc(`family_${familyId}`)
        .get();

      const familyAchievements = familyAchievementsDoc.data()?.achievements || {};

      // Family first day achievement
      const familyFirstDay = ACHIEVEMENTS_CATALOG.find(a => a.id === 'family_first_day');
      if (familyFirstDay && !familyAchievements.family_first_day?.unlockedAt) {
        await unlockFamilyAchievement(familyId, memberIds, familyFirstDay);
        unlockedAchievements.push(familyFirstDay);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error checking family achievements:', error);
    return [];
  }
};

/**
 * Unlock a family achievement
 */
const unlockFamilyAchievement = async (
  familyId: string,
  contributors: string[],
  achievement: Achievement
): Promise<void> => {
  const familyAchievement: FamilyAchievement = {
    achievementId: achievement.id,
    familyId,
    contributors,
    progress: achievement.requirement.value,
    maxProgress: achievement.requirement.value,
    unlockedAt: new Date(),
    celebrated: false,
  };

  await firestore()
    .collection(ACHIEVEMENTS_COLLECTION)
    .doc(`family_${familyId}`)
    .set(
      {
        achievements: {
          [achievement.id]: familyAchievement,
        },
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
};

/**
 * Update user's streak
 */
const updateStreak = async (
  userId: string,
  streakType: 'daily' | 'weekly' | 'category' | 'time'
): Promise<StreakData | null> => {
  try {
    const streakDoc = await firestore()
      .collection(STREAKS_COLLECTION)
      .doc(`${userId}_${streakType}`)
      .get();

    const existingStreak = streakDoc.data() as StreakData | undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 1;
    let bestStreak = 1;

    if (existingStreak) {
      const lastActive = existingStreak.lastActiveDate.toDate();
      lastActive.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Already updated today
        return existingStreak;
      } else if (daysDiff === 1) {
        // Continue streak
        currentStreak = existingStreak.current + 1;
        bestStreak = Math.max(currentStreak, existingStreak.best);
      } else {
        // Streak broken
        currentStreak = 1;
        bestStreak = existingStreak.best;
      }
    }

    const updatedStreak: StreakData = {
      userId,
      streakType,
      current: currentStreak,
      best: bestStreak,
      startDate: existingStreak?.startDate || today,
      lastActiveDate: today,
      freezesAvailable: existingStreak?.freezesAvailable || 3,
      freezesUsed: existingStreak?.freezesUsed || 0,
    };

    await firestore()
      .collection(STREAKS_COLLECTION)
      .doc(`${userId}_${streakType}`)
      .set(updatedStreak);

    return updatedStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
};

/**
 * Create a celebration
 */
export const createCelebration = async (celebration: Omit<Celebration, 'id'>): Promise<string> => {
  try {
    const docRef = await firestore()
      .collection(CELEBRATIONS_COLLECTION)
      .add({
        ...celebration,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    return docRef.id;
  } catch (error) {
    console.error('Error creating celebration:', error);
    throw error;
  }
};

/**
 * Get user's achievements
 */
export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  try {
    const doc = await firestore()
      .collection(ACHIEVEMENTS_COLLECTION)
      .doc(userId)
      .get();

    const achievements = doc.data()?.achievements || {};
    return Object.values(achievements);
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
};

/**
 * Get family's achievements
 */
export const getFamilyAchievements = async (familyId: string): Promise<FamilyAchievement[]> => {
  try {
    const doc = await firestore()
      .collection(ACHIEVEMENTS_COLLECTION)
      .doc(`family_${familyId}`)
      .get();

    const achievements = doc.data()?.achievements || {};
    return Object.values(achievements);
  } catch (error) {
    console.error('Error getting family achievements:', error);
    return [];
  }
};

/**
 * Get celebrations for a user or family
 */
export const getCelebrations = async (
  userId?: string,
  familyId?: string,
  limit: number = 50
): Promise<Celebration[]> => {
  try {
    let query = firestore().collection(CELEBRATIONS_COLLECTION);

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (familyId) {
      query = query.where('familyId', '==', familyId);
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Celebration));
  } catch (error) {
    console.error('Error getting celebrations:', error);
    return [];
  }
};

/**
 * Mark celebration as seen
 */
export const markCelebrationSeen = async (celebrationId: string): Promise<void> => {
  try {
    await firestore()
      .collection(CELEBRATIONS_COLLECTION)
      .doc(celebrationId)
      .update({
        seen: true,
        seenAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error marking celebration as seen:', error);
  }
};

/**
 * Get achievement progress
 */
export const getAchievementProgress = async (
  userId: string,
  achievementId: string
): Promise<{ progress: number; maxProgress: number }> => {
  try {
    const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
    if (!achievement) {
      return { progress: 0, maxProgress: 0 };
    }

    // Get current progress based on achievement type
    let currentProgress = 0;
    const maxProgress = achievement.requirement.value;

    if (achievement.requirement.type === 'count' && achievement.requirement.unit === 'tasks') {
      const snapshot = await firestore()
        .collection('tasks')
        .where('assignedTo', '==', userId)
        .where('status', '==', 'completed')
        .get();
      currentProgress = snapshot.size;
    } else if (achievement.requirement.type === 'streak') {
      const streakDoc = await firestore()
        .collection(STREAKS_COLLECTION)
        .doc(`${userId}_daily`)
        .get();
      currentProgress = streakDoc.data()?.current || 0;
    }

    return {
      progress: Math.min(currentProgress, maxProgress),
      maxProgress,
    };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return { progress: 0, maxProgress: 0 };
  }
};