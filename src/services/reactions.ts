import { db } from './firebase';
import { ReactionType } from '../components/engagement/ParentReaction';
import { deleteField, DocumentSnapshot, doc, setDoc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';

export interface ParentReaction {
  userId: string;
  userName: string;
  reactionType: ReactionType;
  timestamp: number;
}

/**
 * Add or update a parent reaction on a task
 * @param taskId The ID of the task to react to
 * @param userId The ID of the parent adding the reaction
 * @param userName The name of the parent
 * @param reactionType The type of reaction
 * @returns Promise that resolves when the reaction is added
 */
export const addParentReaction = async (
  taskId: string,
  userId: string,
  userName: string,
  reactionType: ReactionType
): Promise<void> => {
  try {
    const reaction: ParentReaction = {
      userId,
      userName,
      reactionType,
      timestamp: Date.now(),
    };

    // Use set with merge to update or create the reaction
    await setDoc(
      doc(db, 'tasks', taskId),
      {
        parentReactions: {
          [userId]: reaction,
        },
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error adding parent reaction:', error);
    throw error;
  }
};

/**
 * Remove a parent reaction from a task
 * @param taskId The ID of the task to remove reaction from
 * @param userId The ID of the parent removing their reaction
 * @returns Promise that resolves when the reaction is removed
 */
export const removeParentReaction = async (
  taskId: string,
  userId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      [`parentReactions.${userId}`]: deleteField(),
    });
  } catch (error) {
    console.error('Error removing parent reaction:', error);
    throw error;
  }
};

/**
 * Get all parent reactions for a task
 * @param taskId The ID of the task
 * @returns Promise that resolves with the parent reactions map
 */
export const getParentReactions = async (
  taskId: string
): Promise<Record<string, ParentReaction> | null> => {
  try {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));

    const taskData = taskDoc.data();
    return taskData?.parentReactions || null;
  } catch (error) {
    console.error('Error fetching parent reactions:', error);
    return null;
  }
};

/**
 * Listen to parent reactions for a task in real-time
 * @param taskId The ID of the task
 * @param onUpdate Callback function when reactions change
 * @returns Unsubscribe function
 */
export const subscribeToParentReactions = (
  taskId: string,
  onUpdate: (reactions: Record<string, ParentReaction> | null) => void
): (() => void) => {
  return onSnapshot(
    doc(db, 'tasks', taskId),
    (docSnapshot: DocumentSnapshot) => {
      const taskData = docSnapshot.data();
      onUpdate(taskData?.parentReactions || null);
    },
    (error: Error) => {
      console.error('Error listening to parent reactions:', error);
      onUpdate(null);
    }
  );
};

/**
 * Check if a user has reacted to a task
 * @param taskId The ID of the task
 * @param userId The ID of the user to check
 * @returns Promise that resolves with the reaction type or null
 */
export const getUserReaction = async (
  taskId: string,
  userId: string
): Promise<ReactionType | null> => {
  try {
    const reactions = await getParentReactions(taskId);
    return reactions?.[userId]?.reactionType || null;
  } catch (error) {
    console.error('Error checking user reaction:', error);
    return null;
  }
};

/**
 * Get reaction counts for a task
 * @param taskId The ID of the task
 * @returns Promise that resolves with counts by reaction type
 */
export const getReactionCounts = async (
  taskId: string
): Promise<Record<ReactionType, number>> => {
  try {
    const reactions = await getParentReactions(taskId);
    const counts: Record<ReactionType, number> = {
      STAR: 0,
      FIRE: 0,
      CLAP: 0,
      HEART: 0,
      THUMBS_UP: 0,
    };

    if (reactions) {
      Object.values(reactions).forEach((reaction) => {
        counts[reaction.reactionType]++;
      });
    }

    return counts;
  } catch (error) {
    console.error('Error getting reaction counts:', error);
    return {
      STAR: 0,
      FIRE: 0,
      CLAP: 0,
      HEART: 0,
      THUMBS_UP: 0,
    };
  }
};