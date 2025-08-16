/**
 * Achievement Service
 * Handles achievement tracking, unlocking, and celebration
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  FirestoreError,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentChange,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Achievement,
  UserAchievement,
  FamilyAchievement,
  StreakData,
  Celebration,
  ACHIEVEMENTS_CATALOG,
  getAchievementById,
  isAchievementUnlocked,
} from '../types/achievements';
import { HapticFeedback } from '../utils/haptics';

class AchievementService {
  private userId: string | null = null;
  private familyId: string | null = null;
  private userAchievements: Map<string, UserAchievement> = new Map();
  private familyAchievements: Map<string, FamilyAchievement> = new Map();
  private streakData: Map<string, StreakData> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.initializeUser();
  }

  private async initializeUser() {
    const user = auth.currentUser;
    if (user) {
      this.userId = user.uid;
      await this.loadUserData();
    }

    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.userId = user.uid;
        await this.loadUserData();
      } else {
        this.userId = null;
        this.clearData();
      }
    });
  }

  private async loadUserData() {
    if (!this.userId) return;

    try {
      // Load user's family
      const userDoc = await getDoc(doc(db, 'users', this.userId));
      
      if (userDoc.exists()) {
        this.familyId = userDoc.data()?.familyId || null;
      }

      // Load user achievements
      const achievementsQuery = query(
        collection(db, 'achievements_progress'),
        where('userId', '==', this.userId)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);

      achievementsSnapshot.forEach((doc: DocumentSnapshot) => {
        const data = doc.data() as UserAchievement;
        this.userAchievements.set(data.achievementId, data);
      });

      // Load family achievements if in a family
      if (this.familyId) {
        const familyAchievementsQuery = query(
          collection(db, 'family_achievements'),
          where('familyId', '==', this.familyId)
        );
        const familyAchievementsSnapshot = await getDocs(familyAchievementsQuery);

        familyAchievementsSnapshot.forEach((doc: DocumentSnapshot) => {
          const data = doc.data() as FamilyAchievement;
          this.familyAchievements.set(data.achievementId, data);
        });
      }

      // Load streak data
      const streaksQuery = query(
        collection(db, 'streaks'),
        where('userId', '==', this.userId)
      );
      const streaksSnapshot = await getDocs(streaksQuery);

      streaksSnapshot.forEach((doc: DocumentSnapshot) => {
        const data = doc.data() as StreakData;
        this.streakData.set(data.streakType, data);
      });

      // Set up real-time listeners
      this.setupRealtimeListeners();
    } catch (error) {
      console.error('Error loading achievement data:', error);
    }
  }

  private setupRealtimeListeners() {
    if (!this.userId) return;

    // Listen for user achievement updates
    const userAchievementQuery = query(
      collection(db, 'achievements_progress'),
      where('userId', '==', this.userId)
    );
    
    const userAchievementListener = onSnapshot(
      userAchievementQuery,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change: DocumentChange) => {
          const data = change.doc.data() as UserAchievement;
          if (change.type === 'added' || change.type === 'modified') {
            this.userAchievements.set(data.achievementId, data);
            this.notifyListeners();
          }
        });
      }
    );

    this.listeners.push(userAchievementListener);

    // Listen for family achievement updates
    if (this.familyId) {
      const familyAchievementQuery = query(
        collection(db, 'family_achievements'),
        where('familyId', '==', this.familyId)
      );
      
      const familyAchievementListener = onSnapshot(
        familyAchievementQuery,
        (snapshot: QuerySnapshot) => {
          snapshot.docChanges().forEach((change: DocumentChange) => {
            const data = change.doc.data() as FamilyAchievement;
            if (change.type === 'added' || change.type === 'modified') {
              this.familyAchievements.set(data.achievementId, data);
              this.notifyListeners();
            }
          });
        }
      );

      this.listeners.push(familyAchievementListener);
    }
  }

  private clearData() {
    this.userAchievements.clear();
    this.familyAchievements.clear();
    this.streakData.clear();
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }

  private notifyListeners() {
    // This would trigger UI updates
    // In a real app, this might dispatch Redux actions or update context
  }

  /**
   * Check and update achievement progress after task completion
   */
  async checkAchievementsAfterTask(taskData: any): Promise<Achievement[]> {
    if (!this.userId) return [];

    const unlockedAchievements: Achievement[] = [];

    try {
      // Check milestone achievements
      const totalTasks = await this.getUserTotalTasks();
      const milestoneAchievements = ACHIEVEMENTS_CATALOG.filter(
        a => a.category === 'milestone' && a.requirement.type === 'count'
      );

      for (const achievement of milestoneAchievements) {
        await this.updateAchievementProgress(
          achievement,
          totalTasks,
          unlockedAchievements
        );
      }

      // Check time-based achievements
      const taskHour = new Date(taskData.completedAt).getHours();
      if (taskHour < 7) {
        const earlyBird = getAchievementById('early_bird');
        if (earlyBird) {
          await this.updateAchievementProgress(earlyBird, 1, unlockedAchievements);
        }
      } else if (taskHour >= 22) {
        const nightOwl = getAchievementById('night_owl');
        if (nightOwl) {
          await this.updateAchievementProgress(nightOwl, 1, unlockedAchievements);
        }
      }

      // Check streak achievements
      await this.updateStreaks();
      const currentStreak = this.streakData.get('daily')?.current || 0;
      const streakAchievements = ACHIEVEMENTS_CATALOG.filter(
        a => a.category === 'streak' && a.requirement.type === 'streak'
      );

      for (const achievement of streakAchievements) {
        await this.updateAchievementProgress(
          achievement,
          currentStreak,
          unlockedAchievements
        );
      }

      // Check family achievements if applicable
      if (this.familyId) {
        await this.checkFamilyAchievements(unlockedAchievements);
      }

      // Create celebrations for unlocked achievements
      for (const achievement of unlockedAchievements) {
        await this.createCelebration(achievement);
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private async updateAchievementProgress(
    achievement: Achievement,
    currentValue: number,
    unlockedList: Achievement[]
  ) {
    if (!this.userId) return;

    const existingProgress = this.userAchievements.get(achievement.id);
    const wasUnlocked = existingProgress?.unlockedAt != null;
    const isNowUnlocked = isAchievementUnlocked(achievement, currentValue);

    if (!wasUnlocked && isNowUnlocked) {
      // New achievement unlocked!
      unlockedList.push(achievement);
      HapticFeedback.celebration();

      const userAchievement: UserAchievement = {
        achievementId: achievement.id,
        userId: this.userId,
        progress: currentValue,
        maxProgress: achievement.requirement.value,
        unlockedAt: new Date(),
        celebrated: false,
        notified: false,
      };

      await setDoc(
        doc(db, 'achievements_progress', `${this.userId}_${achievement.id}`),
        userAchievement
      );

      this.userAchievements.set(achievement.id, userAchievement);
    } else if (!wasUnlocked) {
      // Update progress
      const userAchievement: UserAchievement = {
        achievementId: achievement.id,
        userId: this.userId,
        progress: currentValue,
        maxProgress: achievement.requirement.value,
        celebrated: false,
        notified: false,
      };

      await setDoc(
        doc(db, 'achievements_progress', `${this.userId}_${achievement.id}`),
        userAchievement,
        { merge: true }
      );

      this.userAchievements.set(achievement.id, userAchievement);
    }
  }

  private async getUserTotalTasks(): Promise<number> {
    if (!this.userId) return 0;

    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', this.userId),
        where('status', '==', 'completed')
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      return tasksSnapshot.size;
    } catch (error) {
      console.error('Error getting total tasks:', error);
      return 0;
    }
  }

  private async updateStreaks() {
    if (!this.userId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyStreak = this.streakData.get('daily') || {
      userId: this.userId,
      streakType: 'daily',
      current: 0,
      best: 0,
      startDate: today,
      lastActiveDate: today,
      freezesAvailable: 2,
      freezesUsed: 0,
    };

    const lastActive = new Date(dailyStreak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      dailyStreak.current += 1;
      dailyStreak.best = Math.max(dailyStreak.best, dailyStreak.current);
      dailyStreak.lastActiveDate = today;
    } else if (daysDiff === 2 && dailyStreak.freezesAvailable > 0) {
      // Can use freeze
      dailyStreak.freezesAvailable -= 1;
      dailyStreak.freezesUsed += 1;
      dailyStreak.lastActiveDate = today;
    } else {
      // Streak broken
      dailyStreak.current = 1;
      dailyStreak.startDate = today;
      dailyStreak.lastActiveDate = today;
    }

    await setDoc(
      doc(db, 'streaks', `${this.userId}_daily`),
      dailyStreak
    );

    this.streakData.set('daily', dailyStreak);
  }

  private async checkFamilyAchievements(unlockedList: Achievement[]) {
    if (!this.familyId) return;

    try {
      // Check if all family members completed tasks today
      const familyMembersQuery = query(
        collection(db, 'users'),
        where('familyId', '==', this.familyId)
      );
      const familyMembersSnapshot = await getDocs(familyMembersQuery);

      const memberIds = familyMembersSnapshot.docs.map((doc: DocumentSnapshot) => doc.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let allCompleted = true;
      for (const memberId of memberIds) {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', memberId),
          where('dueDate', '>=', today),
          where('dueDate', '<', tomorrow),
          where('status', '==', 'completed')
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        if (tasksSnapshot.empty) {
          allCompleted = false;
          break;
        }
      }

      if (allCompleted) {
        const familyFirstDay = getAchievementById('family_first_day');
        if (familyFirstDay && !this.familyAchievements.get('family_first_day')?.unlockedAt) {
          unlockedList.push(familyFirstDay);

          const familyAchievement: FamilyAchievement = {
            achievementId: 'family_first_day',
            familyId: this.familyId,
            contributors: memberIds,
            progress: 1,
            maxProgress: 1,
            unlockedAt: new Date(),
            celebrated: false,
          };

          await setDoc(
            doc(db, 'family_achievements', `${this.familyId}_family_first_day`),
            familyAchievement
          );

          this.familyAchievements.set('family_first_day', familyAchievement);
        }
      }
    } catch (error) {
      console.error('Error checking family achievements:', error);
    }
  }

  private async createCelebration(achievement: Achievement) {
    if (!this.userId) return;

    const celebration: Celebration = {
      id: `${Date.now()}_${achievement.id}`,
      type: achievement.familyAchievement ? 'family' : 'achievement',
      userId: achievement.familyAchievement ? undefined : this.userId,
      familyId: achievement.familyAchievement ? this.familyId! : undefined,
      title: `${achievement.name} Unlocked!`,
      message: achievement.encouragementMessage || `You've earned the ${achievement.name} achievement!`,
      icon: achievement.icon,
      timestamp: new Date(),
      seen: false,
    };

    await setDoc(
      doc(collection(db, 'celebrations')),
      celebration
    );
  }

  /**
   * Get all achievements with progress for display
   */
  async getAllAchievementsWithProgress(): Promise<(Achievement & { progress: number; unlocked: boolean })[]> {
    const achievementsWithProgress = await Promise.all(
      ACHIEVEMENTS_CATALOG.map(async (achievement) => {
        const userProgress = this.userAchievements.get(achievement.id);
        const familyProgress = this.familyAchievements.get(achievement.id);
        
        const progress = achievement.familyAchievement
          ? familyProgress?.progress || 0
          : userProgress?.progress || 0;
        
        const unlocked = achievement.familyAchievement
          ? familyProgress?.unlockedAt != null
          : userProgress?.unlockedAt != null;

        return {
          ...achievement,
          progress,
          unlocked,
        };
      })
    );

    return achievementsWithProgress;
  }

  /**
   * Get current streak data
   */
  getCurrentStreaks(): Map<string, StreakData> {
    return this.streakData;
  }

  /**
   * Send encouragement to family member
   */
  async sendEncouragement(targetUserId: string, message: string) {
    if (!this.userId) return;

    try {
      await setDoc(
        doc(collection(db, 'encouragements')),
        {
          fromUserId: this.userId,
          toUserId: targetUserId,
          message,
          timestamp: serverTimestamp(),
          read: false,
        }
      );

      // Check encourager achievement
      const encouragementsQuery = query(
        collection(db, 'encouragements'),
        where('fromUserId', '==', this.userId)
      );
      const encouragementsCount = await getDocs(encouragementsQuery)
        .then((snapshot: QuerySnapshot) => snapshot.size);

      const encouragerAchievement = getAchievementById('encourager');
      if (encouragerAchievement) {
        await this.updateAchievementProgress(encouragerAchievement, encouragementsCount, []);
      }
    } catch (error) {
      console.error('Error sending encouragement:', error);
    }
  }

  /**
   * Mark achievement as celebrated
   */
  async markAchievementCelebrated(achievementId: string) {
    if (!this.userId) return;

    try {
      await updateDoc(
        doc(db, 'achievements_progress', `${this.userId}_${achievementId}`),
        { celebrated: true }
      );

      const achievement = this.userAchievements.get(achievementId);
      if (achievement) {
        achievement.celebrated = true;
        this.userAchievements.set(achievementId, achievement);
      }
    } catch (error) {
      console.error('Error marking achievement celebrated:', error);
    }
  }

  /**
   * Use a streak freeze
   */
  async useStreakFreeze(streakType: string = 'daily'): Promise<boolean> {
    if (!this.userId) return false;

    const streak = this.streakData.get(streakType);
    if (!streak || streak.freezesAvailable <= 0) {
      return false;
    }

    try {
      streak.freezesAvailable -= 1;
      streak.freezesUsed += 1;
      
      await updateDoc(
        doc(db, 'streaks', `${this.userId}_${streakType}`),
        {
          freezesAvailable: streak.freezesAvailable,
          freezesUsed: streak.freezesUsed,
        }
      );

      this.streakData.set(streakType, streak);
      return true;
    } catch (error) {
      console.error('Error using streak freeze:', error);
      return false;
    }
  }

  /**
   * Clean up listeners when service is destroyed
   */
  destroy() {
    this.clearData();
  }
}

// Singleton instance
export const achievementService = new AchievementService();