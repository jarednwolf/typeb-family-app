/**
 * Goals Service
 * 
 * Manages family goals, milestones, and achievements
 * Encourages collaboration and celebrates family successes together
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  FamilyGoal,
  GoalCategory,
  GoalStatus,
  GoalMilestone,
  GoalParticipant,
  GoalReward,
  GoalAttachment,
  Celebration
} from '../types/community';
import { analyticsService } from './analytics';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

const GOALS_COLLECTION = 'familyGoals';
const MAX_MILESTONES = 20;
const MAX_PARTICIPANTS = 10;
const MAX_ATTACHMENTS = 10;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CELEBRATION_LENGTH = 500;

// Goal category icons and colors
const GOAL_CATEGORY_CONFIG: { [key in GoalCategory]: { icon: string; color: string } } = {
  [GoalCategory.HEALTH]: { icon: '💪', color: '#4CAF50' },
  [GoalCategory.EDUCATION]: { icon: '📚', color: '#2196F3' },
  [GoalCategory.FINANCIAL]: { icon: '💰', color: '#FFC107' },
  [GoalCategory.TRAVEL]: { icon: '✈️', color: '#9C27B0' },
  [GoalCategory.HOME]: { icon: '🏠', color: '#795548' },
  [GoalCategory.RELATIONSHIP]: { icon: '❤️', color: '#E91E63' },
  [GoalCategory.HOBBY]: { icon: '🎨', color: '#FF5722' },
  [GoalCategory.CHARITY]: { icon: '🤝', color: '#00BCD4' },
  [GoalCategory.CAREER]: { icon: '💼', color: '#607D8B' },
  [GoalCategory.SPIRITUAL]: { icon: '🙏', color: '#673AB7' },
  [GoalCategory.OTHER]: { icon: '🎯', color: '#9E9E9E' }
};

export class GoalsService {
  private static instance: GoalsService;

  private constructor() {}

  static getInstance(): GoalsService {
    if (!GoalsService.instance) {
      GoalsService.instance = new GoalsService();
    }
    return GoalsService.instance;
  }

  /**
   * Create a new family goal
   */
  async createGoal(
    familyId: string,
    data: {
      title: string;
      description: string;
      category: GoalCategory;
      targetDate?: Date;
      milestones?: Omit<GoalMilestone, 'id' | 'completedDate' | 'completedBy' | 'isCompleted'>[];
      participants?: string[]; // User IDs
      rewards?: GoalReward[];
      attachments?: GoalAttachment[];
      isShared?: boolean;
      tags?: string[];
    }
  ): Promise<FamilyGoal> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate input
      if (data.title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title exceeds ${MAX_TITLE_LENGTH} characters`);
      }
      if (data.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
      }
      if (data.milestones && data.milestones.length > MAX_MILESTONES) {
        throw new Error(`Maximum ${MAX_MILESTONES} milestones allowed`);
      }
      if (data.participants && data.participants.length > MAX_PARTICIPANTS) {
        throw new Error(`Maximum ${MAX_PARTICIPANTS} participants allowed`);
      }
      if (data.attachments && data.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      }

      // Get creator details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      // Prepare participants list
      const participants: GoalParticipant[] = [];
      
      // Add creator as owner
      participants.push({
        userId: currentUser.uid,
        name: userData?.displayName || 'Family Member',
        avatar: userData?.avatar,
        role: 'owner',
        contribution: 'Goal creator',
        joinedAt: new Date()
      });

      // Add other participants
      if (data.participants) {
        for (const userId of data.participants) {
          if (userId === currentUser.uid) continue; // Skip creator
          
          const participantDoc = await getDoc(doc(db, 'users', userId));
          const participantData = participantDoc.data();
          
          participants.push({
            userId,
            name: participantData?.displayName || 'Family Member',
            avatar: participantData?.avatar,
            role: 'contributor',
            joinedAt: new Date()
          });
        }
      }

      // Prepare milestones with IDs and default values
      const milestones: GoalMilestone[] = (data.milestones || []).map((m, index) => ({
        id: `${Date.now()}_${index}`,
        title: m.title,
        description: m.description,
        targetDate: m.targetDate,
        completedDate: undefined,
        completedBy: undefined,
        progress: m.progress || 0,
        isCompleted: false,
        order: m.order || index,
        tasks: m.tasks || []
      }));

      // Create goal
      const goal: Omit<FamilyGoal, 'id'> = {
        familyId,
        creatorId: currentUser.uid,
        creatorName: userData?.displayName || 'Family Member',
        title: data.title,
        description: data.description,
        category: data.category,
        targetDate: data.targetDate,
        milestones,
        participants,
        progress: 0,
        status: GoalStatus.PLANNING,
        rewards: data.rewards || [],
        attachments: data.attachments || [],
        isShared: data.isShared !== false, // Default to true
        tags: data.tags || [],
        celebrations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, GOALS_COLLECTION), goal);
      const createdGoal = {
        id: docRef.id,
        ...goal
      };

      // Log analytics
      await analyticsService.track('goal_created' as any, {
        category: data.category,
        hasMilestones: milestones.length > 0,
        participantCount: participants.length,
        hasTargetDate: !!data.targetDate
      });

      return createdGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Get goals for a family
   */
  async getGoals(
    familyId: string,
    options?: {
      category?: GoalCategory;
      status?: GoalStatus;
      participantId?: string;
      sharedOnly?: boolean;
      limit?: number;
    }
  ): Promise<FamilyGoal[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let constraints: any[] = [
        where('familyId', '==', familyId)
      ];

      // Apply filters
      if (options?.category) {
        constraints.push(where('category', '==', options.category));
      }
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      if (options?.sharedOnly) {
        constraints.push(where('isShared', '==', true));
      }

      // Order by status (active first), then by date
      constraints.push(orderBy('status'));
      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, GOALS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      let goals = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as FamilyGoal[];

      // Filter by participant if specified
      if (options?.participantId) {
        goals = goals.filter(g => 
          g.participants.some(p => p.userId === options.participantId)
        );
      }

      // Filter out goals not shared with current user (unless they're a participant)
      goals = goals.filter(g => 
        g.isShared || 
        g.participants.some(p => p.userId === currentUser.uid)
      );

      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateProgress(goalId: string, progress: number): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate progress
      if (progress < 0 || progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }

      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;
      
      // Check if user is a participant
      const isParticipant = goal.participants.some(p => p.userId === currentUser.uid);
      if (!isParticipant) {
        throw new Error('Only participants can update goal progress');
      }

      // Update status if needed
      let newStatus = goal.status;
      if (progress === 0 && goal.status !== GoalStatus.PLANNING) {
        newStatus = GoalStatus.PLANNING;
      } else if (progress > 0 && progress < 100 && goal.status !== GoalStatus.IN_PROGRESS) {
        newStatus = GoalStatus.IN_PROGRESS;
      } else if (progress === 100 && goal.status !== GoalStatus.COMPLETED) {
        newStatus = GoalStatus.COMPLETED;
      }

      const updates: any = {
        progress,
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      // If completed, set completion date
      if (progress === 100 && !goal.completedAt) {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, GOALS_COLLECTION, goalId), updates);

      // Celebrate if goal is completed
      if (progress === 100 && goal.status !== GoalStatus.COMPLETED) {
        await this.celebrateGoalCompletion(goalId);
      }

      await analyticsService.track('goal_progress_updated' as any, {
        goalId,
        progress,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(
    goalId: string,
    milestoneId: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;
      
      // Check if user is a participant
      const isParticipant = goal.participants.some(p => p.userId === currentUser.uid);
      if (!isParticipant) {
        throw new Error('Only participants can complete milestones');
      }

      // Find and update milestone
      const milestoneIndex = goal.milestones.findIndex(m => m.id === milestoneId);
      if (milestoneIndex === -1) {
        throw new Error('Milestone not found');
      }

      goal.milestones[milestoneIndex].isCompleted = true;
      goal.milestones[milestoneIndex].completedDate = new Date();
      goal.milestones[milestoneIndex].completedBy = currentUser.uid;
      goal.milestones[milestoneIndex].progress = 100;

      // Calculate overall progress based on completed milestones
      const completedCount = goal.milestones.filter(m => m.isCompleted).length;
      const totalCount = goal.milestones.length;
      const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      await updateDoc(doc(db, GOALS_COLLECTION, goalId), {
        milestones: goal.milestones,
        progress: overallProgress,
        updatedAt: serverTimestamp()
      });

      // Notify participants
      await this.notifyMilestoneCompletion(goal, milestoneId);

      await analyticsService.track('milestone_completed' as any, {
        goalId,
        milestoneId,
        overallProgress
      });
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  /**
   * Add participant to goal
   */
  async addParticipant(
    goalId: string,
    userId: string,
    role: 'contributor' | 'supporter' = 'contributor',
    contribution?: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;
      
      // Check if user is owner or admin
      const isOwner = goal.creatorId === currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'parent';
      
      if (!isOwner && !isAdmin) {
        throw new Error('Only goal owner or family admin can add participants');
      }

      // Check if user is already a participant
      if (goal.participants.some(p => p.userId === userId)) {
        throw new Error('User is already a participant');
      }

      // Check max participants
      if (goal.participants.length >= MAX_PARTICIPANTS) {
        throw new Error(`Maximum ${MAX_PARTICIPANTS} participants allowed`);
      }

      // Get new participant details
      const participantDoc = await getDoc(doc(db, 'users', userId));
      const participantData = participantDoc.data();

      goal.participants.push({
        userId,
        name: participantData?.displayName || 'Family Member',
        avatar: participantData?.avatar,
        role,
        contribution,
        joinedAt: new Date()
      });

      await updateDoc(doc(db, GOALS_COLLECTION, goalId), {
        participants: goal.participants,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('goal_participant_added' as any, {
        goalId,
        participantId: userId,
        role
      });
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Add celebration message
   */
  async addCelebration(
    goalId: string,
    message: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate message
      if (message.length > MAX_CELEBRATION_LENGTH) {
        throw new Error(`Celebration message exceeds ${MAX_CELEBRATION_LENGTH} characters`);
      }

      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;

      // Get user details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const celebration: Celebration = {
        id: `${Date.now()}_${currentUser.uid}`,
        message,
        authorId: currentUser.uid,
        authorName: userData?.displayName || 'Family Member',
        reactions: {},
        createdAt: new Date()
      };

      goal.celebrations = goal.celebrations || [];
      goal.celebrations.push(celebration);

      await updateDoc(doc(db, GOALS_COLLECTION, goalId), {
        celebrations: goal.celebrations,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('goal_celebration_added' as any, {
        goalId
      });
    } catch (error) {
      console.error('Error adding celebration:', error);
      throw error;
    }
  }

  /**
   * Update goal
   */
  async updateGoal(
    goalId: string,
    updates: Partial<{
      title: string;
      description: string;
      category: GoalCategory;
      targetDate: Date;
      status: GoalStatus;
      isShared: boolean;
      tags: string[];
    }>
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check permissions
      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;
      if (goal.creatorId !== currentUser.uid) {
        throw new Error('Only the goal creator can update the goal');
      }

      // Validate updates
      if (updates.title && updates.title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title exceeds ${MAX_TITLE_LENGTH} characters`);
      }
      if (updates.description && updates.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
      }

      await updateDoc(doc(db, GOALS_COLLECTION, goalId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('goal_updated' as any, {
        goalId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check permissions
      const goalDoc = await getDoc(doc(db, GOALS_COLLECTION, goalId));
      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as FamilyGoal;
      
      // Check if user is creator or admin
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isCreator = goal.creatorId === currentUser.uid;
      const isAdmin = userData?.role === 'parent';

      if (!isCreator && !isAdmin) {
        throw new Error('Insufficient permissions to delete goal');
      }

      await deleteDoc(doc(db, GOALS_COLLECTION, goalId));

      await analyticsService.track('goal_deleted' as any, { goalId });
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  /**
   * Get goal statistics
   */
  async getGoalStats(familyId: string): Promise<{
    total: number;
    byStatus: { [key in GoalStatus]?: number };
    byCategory: { [key in GoalCategory]?: number };
    averageProgress: number;
    completionRate: number;
    activeParticipants: Set<string>;
  }> {
    try {
      const goals = await this.getGoals(familyId);
      
      const stats = {
        total: goals.length,
        byStatus: {} as { [key in GoalStatus]?: number },
        byCategory: {} as { [key in GoalCategory]?: number },
        averageProgress: 0,
        completionRate: 0,
        activeParticipants: new Set<string>()
      };

      let totalProgress = 0;
      let completedCount = 0;

      for (const goal of goals) {
        // Count by status
        stats.byStatus[goal.status] = (stats.byStatus[goal.status] || 0) + 1;
        
        // Count by category
        stats.byCategory[goal.category] = (stats.byCategory[goal.category] || 0) + 1;
        
        // Sum progress
        totalProgress += goal.progress;
        
        // Count completed
        if (goal.status === GoalStatus.COMPLETED) {
          completedCount++;
        }
        
        // Collect active participants
        goal.participants.forEach(p => {
          stats.activeParticipants.add(p.userId);
        });
      }

      if (goals.length > 0) {
        stats.averageProgress = Math.round(totalProgress / goals.length);
        stats.completionRate = Math.round((completedCount / goals.length) * 100);
      }

      return stats;
    } catch (error) {
      console.error('Error getting goal stats:', error);
      throw error;
    }
  }

  /**
   * Subscribe to goal updates
   */
  subscribeToGoals(
    familyId: string,
    callback: (goals: FamilyGoal[]) => void
  ): () => void {
    const q = query(
      collection(db, GOALS_COLLECTION),
      where('familyId', '==', familyId),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const goals = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as FamilyGoal[];
        
        callback(goals);
      },
      (error) => {
        console.error('Error subscribing to goals:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Private helper methods
   */
  
  private async celebrateGoalCompletion(goalId: string): Promise<void> {
    try {
      // Add automatic celebration message
      await this.addCelebration(
        goalId,
        '🎉 Congratulations! We achieved our goal together! 🎊'
      );

      // Could trigger additional celebrations like:
      // - Send notifications to all participants
      // - Award bonus points
      // - Create announcement
      // - etc.
    } catch (error) {
      console.error('Error celebrating goal completion:', error);
    }
  }

  private async notifyMilestoneCompletion(
    goal: FamilyGoal,
    milestoneId: string
  ): Promise<void> {
    try {
      const milestone = goal.milestones.find(m => m.id === milestoneId);
      if (!milestone) return;

      // Notify all participants
      const notifications = goal.participants.map(async (participant) => {
        if (participant.userId === auth.currentUser?.uid) return;
        
        // Send notification
        console.log(`Notification to ${participant.userId}:`, {
          title: '🎯 Milestone Completed!',
          body: `"${milestone.title}" has been completed for "${goal.title}"`
        });
      });

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notifying milestone completion:', error);
    }
  }
}

export const goalsService = GoalsService.getInstance();