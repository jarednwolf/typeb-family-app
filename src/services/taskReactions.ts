import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Reaction, ReactionEmoji, TaskReaction } from '../types/reactions';
import { getCurrentUser } from './auth';

/**
 * Add a reaction to a task
 */
export const addReaction = async (
  taskId: string,
  emoji: ReactionEmoji,
  familyId: string
): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) throw new Error('User profile not found');

  const reaction: Omit<Reaction, 'timestamp'> & { timestamp: Timestamp } = {
    emoji,
    userId: user.uid,
    userName: userProfile.displayName || 'Anonymous',
    timestamp: Timestamp.now(),
  };

  // Add to task reactions subcollection
  await addDoc(
    collection(db, 'families', familyId, 'tasks', taskId, 'reactions'),
    reaction
  );

  // Also add to a global reactions collection for easier querying
  await addDoc(collection(db, 'taskReactions'), {
    taskId,
    familyId,
    ...reaction,
  });
};

/**
 * Remove a user's reaction from a task
 */
export const removeReaction = async (
  taskId: string,
  emoji: ReactionEmoji,
  familyId: string
): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Find and delete the reaction
  const reactionsRef = collection(db, 'families', familyId, 'tasks', taskId, 'reactions');
  const q = query(
    reactionsRef,
    where('userId', '==', user.uid),
    where('emoji', '==', emoji)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Also remove from global collection
  const globalQuery = query(
    collection(db, 'taskReactions'),
    where('taskId', '==', taskId),
    where('userId', '==', user.uid),
    where('emoji', '==', emoji)
  );

  const globalSnapshot = await getDocs(globalQuery);
  globalSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

/**
 * Get all reactions for a task
 */
export const getTaskReactions = async (
  taskId: string,
  familyId: string
): Promise<Reaction[]> => {
  const reactionsRef = collection(db, 'families', familyId, 'tasks', taskId, 'reactions');
  const q = query(reactionsRef, orderBy('timestamp', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  } as Reaction));
};

/**
 * Subscribe to reactions for a task
 */
export const subscribeToTaskReactions = (
  taskId: string,
  familyId: string,
  callback: (reactions: Reaction[]) => void
): (() => void) => {
  const reactionsRef = collection(db, 'families', familyId, 'tasks', taskId, 'reactions');
  const q = query(reactionsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const reactions = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    } as Reaction));
    callback(reactions);
  });
};

/**
 * Get reactions for multiple tasks
 */
export const getMultipleTaskReactions = async (
  taskIds: string[],
  familyId: string
): Promise<Record<string, Reaction[]>> => {
  const reactionsMap: Record<string, Reaction[]> = {};

  // Initialize empty arrays
  taskIds.forEach(id => {
    reactionsMap[id] = [];
  });

  if (taskIds.length === 0) return reactionsMap;

  // Query global reactions collection
  const q = query(
    collection(db, 'taskReactions'),
    where('familyId', '==', familyId),
    where('taskId', 'in', taskIds)
  );

  const snapshot = await getDocs(q);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const reaction: Reaction = {
      emoji: data.emoji,
      userId: data.userId,
      userName: data.userName,
      timestamp: data.timestamp.toDate(),
    };
    
    if (reactionsMap[data.taskId]) {
      reactionsMap[data.taskId].push(reaction);
    }
  });

  return reactionsMap;
};

/**
 * Check if user has reacted to a task
 */
export const hasUserReacted = async (
  taskId: string,
  familyId: string,
  emoji?: ReactionEmoji
): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;

  const reactionsRef = collection(db, 'families', familyId, 'tasks', taskId, 'reactions');
  let q = query(reactionsRef, where('userId', '==', user.uid));
  
  if (emoji) {
    q = query(q, where('emoji', '==', emoji));
  }

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Get recent reactions for a family (for activity feed)
 */
export const getRecentFamilyReactions = async (
  familyId: string,
  limit: number = 20
): Promise<Array<Reaction & { taskId: string; taskTitle?: string }>> => {
  const q = query(
    collection(db, 'taskReactions'),
    where('familyId', '==', familyId),
    orderBy('timestamp', 'desc'),
    limit(limit)
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      emoji: data.emoji,
      userId: data.userId,
      userName: data.userName,
      timestamp: data.timestamp.toDate(),
      taskId: data.taskId,
      taskTitle: data.taskTitle,
    };
  });
};

// Helper function to get user profile
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { User } from '../types/models';

async function getUserProfile(userId: string): Promise<User | null> {
  const userDoc = await getDoc(firestoreDoc(db, 'users', userId));
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return {
    ...data,
    id: userDoc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    subscriptionEndDate: data.subscriptionEndDate?.toDate(),
  } as User;
}