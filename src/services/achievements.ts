/**
 * Achievements Service
 * Provides comprehensive achievement data management for the Achievement Wall
 */

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Achievement, 
  UserAchievement, 
  FamilyAchievement, 
  Celebration,
  ACHIEVEMENTS_CATALOG,
} from '../types/achievements';
import { 
  getUserAchievements, 
  getFamilyAchievements, 
  getCelebrations,
  markCelebrationSeen,
  getAchievementProgress,
} from './celebrations';
import { getFamily } from './family';
import { getCurrentUser } from './auth';

const USERS_COLLECTION = 'users';

export interface AchievementItem {
  id: string;
  type: 'user' | 'family';
  achievement: Achievement;
  userAchievement?: UserAchievement;
  familyAchievement?: FamilyAchievement;
  celebration?: Celebration;
  timestamp: Date;
  memberName?: string;
  memberAvatar?: string;
}

/**
 * Get all achievements for the achievement wall
 */
export const getAchievementWallData = async (
  familyId: string,
  filters?: {
    memberId?: string;
    category?: string;
    dateRange?: { start: Date; end: Date };
  }
): Promise<AchievementItem[]> => {
  try {
    // Get family data to access all members
    const family = await getFamily(familyId);
    if (!family) throw new Error('Family not found');

    const achievementItems: AchievementItem[] = [];

    // Get achievements for all family members
    const memberAchievements = await Promise.all(
      family.memberIds.map(async (memberId) => {
        // Get user data
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, memberId));
        
        const userData = userDoc.exists() ? userDoc.data() : null;
        const memberName = userData?.displayName || 'Unknown';
        const memberAvatar = userData?.avatarUrl;

        // Get user achievements
        const userAchievements = await getUserAchievements(memberId);
        
        // Convert to achievement items
        return userAchievements
          .filter(ua => ua.unlockedAt) // Only show unlocked achievements
          .map(ua => {
            const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === ua.achievementId);
            if (!achievement) return null;

            return {
              id: `user_${memberId}_${ua.achievementId}`,
              type: 'user' as const,
              achievement,
              userAchievement: ua,
              timestamp: ua.unlockedAt!,
              memberName,
              memberAvatar,
            };
          })
          .filter(Boolean) as AchievementItem[];
      })
    );

    // Flatten member achievements
    achievementItems.push(...memberAchievements.flat());

    // Get family achievements
    const familyAchievements = await getFamilyAchievements(familyId);
    
    // Convert family achievements to items
    const familyAchievementItems = familyAchievements
      .filter(fa => fa.unlockedAt) // Only show unlocked achievements
      .map(fa => {
        const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === fa.achievementId);
        if (!achievement) return null;

        return {
          id: `family_${familyId}_${fa.achievementId}`,
          type: 'family' as const,
          achievement,
          familyAchievement: fa,
          timestamp: fa.unlockedAt!,
        };
      })
      .filter(Boolean) as AchievementItem[];

    achievementItems.push(...familyAchievementItems);

    // Get recent celebrations
    const celebrations = await getCelebrations(undefined, familyId, 100);
    
    // Map celebrations to achievements
    const celebrationMap = new Map<string, Celebration>();
    celebrations.forEach(celebration => {
      if (celebration.type === 'achievement') {
        // Extract achievement ID from celebration metadata
        const achievementId = (celebration as any).achievementId || (celebration as any).metadata?.achievementId;
        if (achievementId) {
          const key = celebration.userId
            ? `user_${celebration.userId}_${achievementId}`
            : `family_${familyId}_${achievementId}`;
          celebrationMap.set(key, celebration);
        }
      }
    });

    // Add celebrations to achievement items
    achievementItems.forEach(item => {
      const celebration = celebrationMap.get(item.id);
      if (celebration) {
        item.celebration = celebration;
      }
    });

    // Apply filters
    let filteredItems = [...achievementItems];

    if (filters?.memberId && filters.memberId !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.type === 'user' && item.userAchievement?.userId === filters.memberId
      );
    }

    if (filters?.category && filters.category !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.achievement.category === filters.category
      );
    }

    if (filters?.dateRange) {
      filteredItems = filteredItems.filter(item =>
        item.timestamp >= filters.dateRange!.start &&
        item.timestamp <= filters.dateRange!.end
      );
    }

    // Sort by timestamp (newest first)
    filteredItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filteredItems;
  } catch (error) {
    console.error('Error getting achievement wall data:', error);
    throw error;
  }
};

/**
 * Get achievement statistics for a family
 */
export const getAchievementStats = async (familyId: string): Promise<{
  total: number;
  personal: number;
  family: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
}> => {
  try {
    const achievements = await getAchievementWallData(familyId);
    
    const stats = {
      total: achievements.length,
      personal: achievements.filter(a => a.type === 'user').length,
      family: achievements.filter(a => a.type === 'family').length,
      byCategory: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
    };

    // Count by category
    achievements.forEach(item => {
      const category = item.achievement.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      const level = item.achievement.level;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    throw error;
  }
};

/**
 * Get in-progress achievements for a user
 */
export const getInProgressAchievements = async (
  userId: string
): Promise<Array<Achievement & { progress: number; maxProgress: number }>> => {
  try {
    const userAchievements = await getUserAchievements(userId);
    const unlockedIds = new Set(
      userAchievements
        .filter(ua => ua.unlockedAt)
        .map(ua => ua.achievementId)
    );

    // Get achievements that haven't been unlocked yet
    const inProgressAchievements = await Promise.all(
      ACHIEVEMENTS_CATALOG
        .filter(achievement => !unlockedIds.has(achievement.id))
        .map(async (achievement) => {
          const { progress, maxProgress } = await getAchievementProgress(
            userId,
            achievement.id
          );

          return {
            ...achievement,
            progress,
            maxProgress,
          };
        })
    );

    // Filter to only show achievements with some progress
    return inProgressAchievements.filter(a => a.progress > 0);
  } catch (error) {
    console.error('Error getting in-progress achievements:', error);
    return [];
  }
};

/**
 * Subscribe to achievement updates
 */
export const subscribeToAchievements = (
  familyId: string,
  callback: (achievements: AchievementItem[]) => void
): (() => void) => {
  // Subscribe to user achievements collection
  const userUnsubscribes: (() => void)[] = [];
  
  getFamily(familyId).then(family => {
    if (!family) return;

    family.memberIds.forEach(memberId => {
      const unsubscribe = onSnapshot(
        doc(db, 'achievements', memberId),
        () => {
          // Refetch all achievements when any update occurs
          getAchievementWallData(familyId).then(callback);
        },
        (error: any) => console.error('Error in achievement subscription:', error)
      );
      
      userUnsubscribes.push(unsubscribe);
    });
  });

  // Subscribe to family achievements
  const familyUnsubscribe = onSnapshot(
    doc(db, 'achievements', `family_${familyId}`),
    () => {
      getAchievementWallData(familyId).then(callback);
    },
    (error: any) => console.error('Error in family achievement subscription:', error)
  );

  // Subscribe to celebrations
  const celebrationsQuery = query(
    collection(db, 'celebrations'),
    where('familyId', '==', familyId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  const celebrationsUnsubscribe = onSnapshot(
    celebrationsQuery,
    () => {
      getAchievementWallData(familyId).then(callback);
    },
    (error: any) => console.error('Error in celebrations subscription:', error)
  );

  // Return unsubscribe function
  return () => {
    userUnsubscribes.forEach(unsub => unsub());
    familyUnsubscribe();
    celebrationsUnsubscribe();
  };
};

/**
 * Mark a celebration as seen
 */
export { markCelebrationSeen };