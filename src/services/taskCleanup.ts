/**
 * Task cleanup utilities
 * Handles orphaned tasks and other cleanup operations
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Handle orphaned tasks when a user is removed from family
 * This is in a separate file to avoid circular dependencies
 */
export const handleOrphanedTasks = async (
  familyId: string,
  removedUserId: string,
  familyCreatorId: string
): Promise<void> => {
  try {
    const tasksCollection = collection(db, 'tasks');
    
    // Find all tasks assigned to the removed user
    const q = query(
      tasksCollection,
      where('familyId', '==', familyId),
      where('assignedTo', '==', removedUserId),
      where('status', '!=', 'completed')
    );
    
    const snapshot = await getDocs(q);
    
    // Reassign incomplete tasks to family creator
    const updatePromises = snapshot.docs.map(taskDoc =>
      updateDoc(doc(tasksCollection, taskDoc.id), {
        assignedTo: familyCreatorId,
        updatedAt: serverTimestamp(),
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Reassigned ${snapshot.size} tasks from ${removedUserId} to ${familyCreatorId}`);
  } catch (error) {
    console.error('Error handling orphaned tasks:', error);
    // Don't throw - this is a cleanup operation that shouldn't block member removal
  }
};