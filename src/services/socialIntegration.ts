/**
 * Social Integration Service
 * Unified management of social features across the app
 */

import { firestore } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { User, Task, Family } from '../types/models';
// Temporarily define these types here if they don't exist in the imported modules
interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  timestamp: Date;
}
import { ParentReaction } from './reactions';
import * as notificationService from './smartNotifications';
import * as analyticsService from './analytics';

// Collections
const ACTIVITIES_COLLECTION = 'social_activities';
const REACTIONS_COLLECTION = 'reactions';
const COMMENTS_COLLECTION = 'comments';
const MENTIONS_COLLECTION = 'mentions';
const ENGAGEMENT_COLLECTION = 'engagement_metrics';

// Activity Types
export type ActivityType = 
  | 'task_completed'
  | 'task_commented'
  | 'task_reacted'
  | 'achievement_unlocked'
  | 'celebration_created'
  | 'goal_reached'
  | 'announcement_posted'
  | 'event_created'
  | 'chat_message'
  | 'member_joined'
  | 'milestone_reached';

// Reaction Types (unified across features)
export type ReactionType = 
  | 'like'
  | 'love'
  | 'celebrate'
  | 'support'
  | 'applause'
  | 'fire'
  | 'star'
  | 'trophy';

// Social Activity
export interface SocialActivity {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string;
  targetType?: 'task' | 'achievement' | 'announcement' | 'event' | 'goal' | 'chat';
  targetTitle?: string;
  familyId: string;
  content?: string;
  metadata?: Record<string, any>;
  reactions?: Record<string, Reaction>;
  commentCount?: number;
  timestamp: Date;
  isPublic: boolean;
}

// Unified Reaction
export interface Reaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ReactionType;
  targetId: string;
  targetType: string;
  timestamp: Date;
}

// Unified Comment
export interface UnifiedComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: string;
  targetType: string;
  content: string;
  mentions?: string[];
  reactions?: Record<string, Reaction>;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

// Mention
export interface Mention {
  id: string;
  mentionedUserId: string;
  mentionedBy: string;
  context: string;
  contextType: 'comment' | 'chat' | 'announcement';
  contextId: string;
  timestamp: Date;
  seen: boolean;
}

// Engagement Metrics
export interface EngagementMetrics {
  userId: string;
  familyId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  totalActivities: number;
  totalReactions: number;
  totalComments: number;
  totalMentions: number;
  reactionsReceived: number;
  commentsReceived: number;
  mentionsReceived: number;
  topReactionTypes: Record<ReactionType, number>;
  engagementScore: number;
  lastActive: Date;
}

/**
 * Create a social activity
 */
export const createActivity = async (
  activity: Omit<SocialActivity, 'id' | 'timestamp'>
): Promise<string> => {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    const docRef = await addDoc(activitiesRef, {
      ...activity,
      timestamp: serverTimestamp(),
    });

    // Notify relevant users
    await notifyActivityFollowers(activity);

    // Track analytics
    // TODO: Implement analytics tracking
    /* await analyticsService.trackEvent('social_activity_created', {
      activityType: activity.type,
      actorId: activity.actorId,
      familyId: activity.familyId,
    }); */

    return docRef.id;
  } catch (error) {
    console.error('Error creating social activity:', error);
    throw error;
  }
};

/**
 * Add a reaction to content
 */
export const addReaction = async (
  userId: string,
  userName: string,
  targetId: string,
  targetType: string,
  reactionType: ReactionType,
  userAvatar?: string
): Promise<void> => {
  try {
    const reaction: Reaction = {
      id: `${userId}_${targetId}_${reactionType}`,
      userId,
      userName,
      userAvatar,
      type: reactionType,
      targetId,
      targetType,
      timestamp: new Date(),
    };

    // Store reaction
    const reactionRef = doc(firestore, REACTIONS_COLLECTION, reaction.id);
    await setDoc(reactionRef, reaction);

    // Update reaction count on target
    await updateTargetReactions(targetId, targetType, reaction);

    // Create activity
    await createActivity({
      type: `${targetType}_reacted` as ActivityType,
      actorId: userId,
      actorName: userName,
      actorAvatar: userAvatar,
      targetId,
      targetType: targetType as any,
      familyId: '', // Need to get from context
      isPublic: true,
    });

    // Update engagement metrics
    await updateEngagementMetrics(userId, 'reaction_sent');
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

/**
 * Remove a reaction
 */
export const removeReaction = async (
  userId: string,
  targetId: string,
  reactionType: ReactionType
): Promise<void> => {
  try {
    const reactionId = `${userId}_${targetId}_${reactionType}`;
    
    const reactionRef = doc(firestore, REACTIONS_COLLECTION, reactionId);
    await deleteDoc(reactionRef);

    // Update engagement metrics
    await updateEngagementMetrics(userId, 'reaction_removed');
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

/**
 * Add a comment to content
 */
export const addComment = async (
  comment: Omit<UnifiedComment, 'id' | 'timestamp'>
): Promise<string> => {
  try {
    const commentsRef = collection(firestore, COMMENTS_COLLECTION);
    const docRef = await addDoc(commentsRef, {
      ...comment,
      timestamp: serverTimestamp(),
    });

    // Process mentions
    if (comment.mentions && comment.mentions.length > 0) {
      await processMentions(comment.userId, comment.mentions, 'comment', docRef.id);
    }

    // Create activity
    await createActivity({
      type: `${comment.targetType}_commented` as ActivityType,
      actorId: comment.userId,
      actorName: comment.userName,
      actorAvatar: comment.userAvatar,
      targetId: comment.targetId,
      targetType: comment.targetType as any,
      content: comment.content,
      familyId: '', // Need to get from context
      isPublic: true,
    });

    // Update engagement metrics
    await updateEngagementMetrics(comment.userId, 'comment_sent');

    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Process mentions in content
 */
const processMentions = async (
  mentionedBy: string,
  mentionedUserIds: string[],
  contextType: 'comment' | 'chat' | 'announcement',
  contextId: string
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);

    for (const mentionedUserId of mentionedUserIds) {
      const mention: Mention = {
        id: `${contextId}_${mentionedUserId}`,
        mentionedUserId,
        mentionedBy,
        context: contextId,
        contextType,
        contextId,
        timestamp: new Date(),
        seen: false,
      };

      const docRef = doc(firestore, MENTIONS_COLLECTION, mention.id);
      batch.set(docRef, mention);

      // Send notification
      // TODO: Implement notification sending
      /* await notificationService.sendNotification(
        mentionedUserId,
        {
          title: 'You were mentioned',
          body: `You were mentioned in a ${contextType}`,
          data: {
            type: 'mention',
            contextType,
            contextId,
          },
        }
      ); */
    }

    await batch.commit();
  } catch (error) {
    console.error('Error processing mentions:', error);
  }
};

/**
 * Get social activity feed
 */
export const getActivityFeed = async (
  familyId: string,
  limitCount: number = 50,
  startAfterDate?: Date
): Promise<SocialActivity[]> => {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    let q = query(
      activitiesRef,
      where('familyId', '==', familyId),
      where('isPublic', '==', true),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (startAfter) {
      q = query(q, startAfter(startAfterDate));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as SocialActivity));
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return [];
  }
};

/**
 * Get reactions for content
 */
export const getReactions = async (
  targetId: string,
  targetType: string
): Promise<Reaction[]> => {
  try {
    const reactionsRef = collection(firestore, REACTIONS_COLLECTION);
    const q = query(
      reactionsRef,
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as Reaction);
  } catch (error) {
    console.error('Error getting reactions:', error);
    return [];
  }
};

/**
 * Get comments for content
 */
export const getComments = async (
  targetId: string,
  targetType: string,
  limitCount: number = 50
): Promise<UnifiedComment[]> => {
  try {
    const commentsRef = collection(firestore, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as UnifiedComment));
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

/**
 * Get user mentions
 */
export const getUserMentions = async (
  userId: string,
  unreadOnly: boolean = false
): Promise<Mention[]> => {
  try {
    const mentionsRef = collection(firestore, MENTIONS_COLLECTION);
    let q = query(
      mentionsRef,
      where('mentionedUserId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    if (unreadOnly) {
      q = query(q, where('seen', '==', false));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as Mention);
  } catch (error) {
    console.error('Error getting user mentions:', error);
    return [];
  }
};

/**
 * Mark mention as seen
 */
export const markMentionSeen = async (mentionId: string): Promise<void> => {
  try {
    const mentionRef = doc(firestore, MENTIONS_COLLECTION, mentionId);
    await updateDoc(mentionRef, {
      seen: true,
      seenAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking mention as seen:', error);
  }
};

/**
 * Get engagement metrics for a user
 */
export const getEngagementMetrics = async (
  userId: string,
  familyId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'
): Promise<EngagementMetrics> => {
  try {
    const metricsRef = doc(firestore, ENGAGEMENT_COLLECTION, `${userId}_${familyId}_${period}`);
    const docSnap = await getDoc(metricsRef);

    if (!docSnap.exists()) {
      return createDefaultMetrics(userId, familyId, period);
    }

    return docSnap.data() as EngagementMetrics;
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    return createDefaultMetrics(userId, familyId, period);
  }
};

/**
 * Update engagement metrics
 */
const updateEngagementMetrics = async (
  userId: string,
  action: 'reaction_sent' | 'reaction_removed' | 'comment_sent' | 'mention_sent'
): Promise<void> => {
  try {
    // Get user's family
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const familyId = userDoc.data()?.familyId;
    if (!familyId) return;

    const metricsRef = doc(firestore, ENGAGEMENT_COLLECTION, `${userId}_${familyId}_weekly`);

    const incrementValue = action.includes('removed') ? -1 : 1;
    const field = action.includes('reaction') ? 'totalReactions' : 
                  action.includes('comment') ? 'totalComments' : 'totalMentions';

    await updateDoc(metricsRef, {
      [field]: increment(incrementValue),
      totalActivities: increment(incrementValue),
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating engagement metrics:', error);
  }
};

/**
 * Update target with reaction counts
 */
const updateTargetReactions = async (
  targetId: string,
  targetType: string,
  reaction: Reaction
): Promise<void> => {
  try {
    let collection = '';
    switch (targetType) {
      case 'task':
        collection = 'tasks';
        break;
      case 'announcement':
        collection = 'announcements';
        break;
      case 'event':
        collection = 'events';
        break;
      default:
        return;
    }

    const targetRef = doc(firestore, collection, targetId);
    await updateDoc(targetRef, {
      [`reactions.${reaction.userId}`]: {
        type: reaction.type,
        timestamp: reaction.timestamp,
      },
    });
  } catch (error) {
    console.error('Error updating target reactions:', error);
  }
};

/**
 * Notify activity followers
 */
const notifyActivityFollowers = async (
  activity: Omit<SocialActivity, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    // Get family members
    const familyRef = doc(firestore, 'families', activity.familyId);
    const familyDoc = await getDoc(familyRef);

    const memberIds = familyDoc.data()?.memberIds || [];
    
    // Notify all members except the actor
    const recipientIds = memberIds.filter((id: string) => id !== activity.actorId);

    for (const recipientId of recipientIds) {
      // TODO: Implement notification sending
      /* await notificationService.sendNotification(
        recipientId,
        {
          title: getActivityNotificationTitle(activity.type),
          body: `${activity.actorName} ${getActivityVerb(activity.type)} ${activity.targetTitle || ''}`,
          data: {
            type: 'social_activity',
            activityType: activity.type,
            targetId: activity.targetId,
            targetType: activity.targetType,
          },
        }
      ); */
    }
  } catch (error) {
    console.error('Error notifying activity followers:', error);
  }
};

/**
 * Helper functions
 */
const createDefaultMetrics = (
  userId: string,
  familyId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
): EngagementMetrics => ({
  userId,
  familyId,
  period,
  totalActivities: 0,
  totalReactions: 0,
  totalComments: 0,
  totalMentions: 0,
  reactionsReceived: 0,
  commentsReceived: 0,
  mentionsReceived: 0,
  topReactionTypes: {} as Record<ReactionType, number>,
  engagementScore: 0,
  lastActive: new Date(),
});

const getActivityNotificationTitle = (type: ActivityType): string => {
  const titles: Record<ActivityType, string> = {
    task_completed: '✅ Task Completed',
    task_commented: '💬 New Comment',
    task_reacted: '👍 New Reaction',
    achievement_unlocked: '🏆 Achievement Unlocked',
    celebration_created: '🎉 New Celebration',
    goal_reached: '🎯 Goal Reached',
    announcement_posted: '📢 New Announcement',
    event_created: '📅 New Event',
    chat_message: '💬 New Message',
    member_joined: '👥 New Member',
    milestone_reached: '🎯 Milestone Reached',
  };
  return titles[type] || 'New Activity';
};

const getActivityVerb = (type: ActivityType): string => {
  const verbs: Record<ActivityType, string> = {
    task_completed: 'completed',
    task_commented: 'commented on',
    task_reacted: 'reacted to',
    achievement_unlocked: 'unlocked',
    celebration_created: 'created a celebration for',
    goal_reached: 'reached',
    announcement_posted: 'posted',
    event_created: 'created',
    chat_message: 'sent a message about',
    member_joined: 'joined',
    milestone_reached: 'reached',
  };
  return verbs[type] || 'interacted with';
};

// Export aggregation functions
export const aggregateReactions = async (familyId: string): Promise<Record<string, number>> => {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    const q = query(
      activitiesRef,
      where('familyId', '==', familyId),
      where('type', 'in', ['task_reacted', 'achievement_reacted', 'announcement_reacted'])
    );
    const snapshot = await getDocs(q);

    const reactionCounts: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const reactionType = data.metadata?.reactionType;
      if (reactionType) {
        reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) + 1;
      }
    });

    return reactionCounts;
  } catch (error) {
    console.error('Error aggregating reactions:', error);
    return {};
  }
};

export const getTopEngagers = async (
  familyId: string,
  limitCount: number = 5
): Promise<{ userId: string; score: number }[]> => {
  try {
    const engagementRef = collection(firestore, ENGAGEMENT_COLLECTION);
    const q = query(
      engagementRef,
      where('familyId', '==', familyId),
      where('period', '==', 'weekly'),
      orderBy('engagementScore', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      userId: doc.data().userId,
      score: doc.data().engagementScore,
    }));
  } catch (error) {
    console.error('Error getting top engagers:', error);
    return [];
  }
};