import { db } from './firebase';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { MilestoneType } from '../components/engagement/MilestoneCelebration';

export interface MilestoneAchievement {
  type: MilestoneType;
  achievedAt: number;
  percentage: number;
  date: string; // YYYY-MM-DD format
}

/**
 * Check if a user has achieved a specific milestone on a given date
 * @param userId The ID of the user
 * @param date The date to check (YYYY-MM-DD format)
 * @param milestone The milestone type to check
 * @returns Promise that resolves with whether the milestone was achieved
 */
export const hasMilestoneBeenAchieved = async (
  userId: string,
  date: string,
  milestone: MilestoneType
): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.milestones) {
      return false;
    }
    
    const achievements: MilestoneAchievement[] = userData.milestones;
    return achievements.some(
      (achievement) => 
        achievement.date === date && 
        achievement.type === milestone
    );
  } catch (error) {
    console.error('Error checking milestone achievement:', error);
    return false;
  }
};

/**
 * Record a milestone achievement for a user
 * @param userId The ID of the user
 * @param milestone The milestone type achieved
 * @param percentage The completion percentage
 * @returns Promise that resolves when the milestone is recorded
 */
export const recordMilestoneAchievement = async (
  userId: string,
  milestone: MilestoneType,
  percentage: number
): Promise<void> => {
  try {
    const achievement: MilestoneAchievement = {
      type: milestone,
      achievedAt: Date.now(),
      percentage,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };
    
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document with milestone
      await setDoc(userRef, {
        milestones: [achievement],
      }, { merge: true });
    } else {
      // Update existing user document
      await updateDoc(userRef, {
        milestones: arrayUnion(achievement),
      });
    }
  } catch (error) {
    console.error('Error recording milestone achievement:', error);
    throw error;
  }
};

/**
 * Get all milestone achievements for a user
 * @param userId The ID of the user
 * @returns Promise that resolves with the user's milestone achievements
 */
export const getUserMilestones = async (
  userId: string
): Promise<MilestoneAchievement[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    return userData?.milestones || [];
  } catch (error) {
    console.error('Error fetching user milestones:', error);
    return [];
  }
};

/**
 * Get milestone achievements for a specific date
 * @param userId The ID of the user
 * @param date The date to check (YYYY-MM-DD format)
 * @returns Promise that resolves with milestones achieved on that date
 */
export const getMilestonesForDate = async (
  userId: string,
  date: string
): Promise<MilestoneAchievement[]> => {
  try {
    const allMilestones = await getUserMilestones(userId);
    return allMilestones.filter((milestone) => milestone.date === date);
  } catch (error) {
    console.error('Error fetching milestones for date:', error);
    return [];
  }
};

/**
 * Check and record milestone achievement based on completion percentage
 * @param userId The ID of the user
 * @param completionPercentage The current completion percentage
 * @returns Promise that resolves with the milestone type if achieved, null otherwise
 */
export const checkAndRecordMilestone = async (
  userId: string,
  completionPercentage: number
): Promise<MilestoneType | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let milestoneType: MilestoneType | null = null;
    
    // Determine which milestone was achieved
    if (completionPercentage >= 100 && !(await hasMilestoneBeenAchieved(userId, today, 'diamond'))) {
      milestoneType = 'diamond';
    } else if (completionPercentage >= 75 && completionPercentage < 100 && !(await hasMilestoneBeenAchieved(userId, today, 'gold'))) {
      milestoneType = 'gold';
    } else if (completionPercentage >= 50 && completionPercentage < 75 && !(await hasMilestoneBeenAchieved(userId, today, 'silver'))) {
      milestoneType = 'silver';
    } else if (completionPercentage >= 25 && completionPercentage < 50 && !(await hasMilestoneBeenAchieved(userId, today, 'bronze'))) {
      milestoneType = 'bronze';
    }
    
    // Record the achievement if a new milestone was reached
    if (milestoneType) {
      await recordMilestoneAchievement(userId, milestoneType, completionPercentage);
    }
    
    return milestoneType;
  } catch (error) {
    console.error('Error checking and recording milestone:', error);
    return null;
  }
};

/**
 * Get milestone statistics for a user
 * @param userId The ID of the user
 * @returns Promise that resolves with milestone statistics
 */
export const getMilestoneStats = async (
  userId: string
): Promise<{
  totalMilestones: number;
  bronzeCount: number;
  silverCount: number;
  goldCount: number;
  diamondCount: number;
  lastMilestone: MilestoneAchievement | null;
}> => {
  try {
    const milestones = await getUserMilestones(userId);
    
    const stats = {
      totalMilestones: milestones.length,
      bronzeCount: milestones.filter((m) => m.type === 'bronze').length,
      silverCount: milestones.filter((m) => m.type === 'silver').length,
      goldCount: milestones.filter((m) => m.type === 'gold').length,
      diamondCount: milestones.filter((m) => m.type === 'diamond').length,
      lastMilestone: milestones.length > 0 
        ? milestones.sort((a, b) => b.achievedAt - a.achievedAt)[0]
        : null,
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting milestone stats:', error);
    return {
      totalMilestones: 0,
      bronzeCount: 0,
      silverCount: 0,
      goldCount: 0,
      diamondCount: 0,
      lastMilestone: null,
    };
  }
};