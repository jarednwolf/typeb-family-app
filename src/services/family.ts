/**
 * Family management service
 * Handles all family-related operations with Firestore
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Family, User, FamilyInvite, DEFAULT_TASK_CATEGORIES } from '../types/models';

// Collection references
const familiesCollection = collection(db, 'families');
const usersCollection = collection(db, 'users');
const invitesCollection = collection(db, 'invites');

/**
 * Generate a unique 6-character invite code
 */
const generateInviteCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    // Generate random 6-character code
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const q = query(familiesCollection, where('inviteCode', '==', code));
    const snapshot = await getDocs(q);
    isUnique = snapshot.empty;
  }

  return code;
};

/**
 * Create a new family
 */
export const createFamily = async (
  userId: string,
  familyName: string,
  isPremium: boolean = false
): Promise<Family> => {
  try {
    const inviteCode = await generateInviteCode();
    const familyId = doc(familiesCollection).id;

    const newFamily: Family = {
      id: familyId,
      name: familyName,
      inviteCode,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberIds: [userId],
      parentIds: [userId], // Creator is automatically a parent
      childIds: [],
      maxMembers: isPremium ? 10 : 4,
      isPremium,
      taskCategories: DEFAULT_TASK_CATEGORIES,
    };

    // Create family document
    await setDoc(doc(familiesCollection, familyId), {
      ...newFamily,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user's familyId
    await updateDoc(doc(usersCollection, userId), {
      familyId,
      role: 'parent',
      updatedAt: serverTimestamp(),
    });

    return newFamily;
  } catch (error) {
    console.error('Error creating family:', error);
    throw new Error('Failed to create family');
  }
};

/**
 * Join an existing family using invite code
 */
export const joinFamily = async (
  userId: string,
  inviteCode: string,
  role: 'parent' | 'child' = 'child'
): Promise<Family> => {
  try {
    // Find family with invite code
    const q = query(familiesCollection, where('inviteCode', '==', inviteCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Invalid invite code');
    }

    const familyDoc = snapshot.docs[0];
    const family = { id: familyDoc.id, ...familyDoc.data() } as Family;

    // Check if family is at max capacity
    if (family.memberIds.length >= family.maxMembers) {
      throw new Error('Family is at maximum capacity');
    }

    // Check if user is already in a family
    const userDoc = await getDoc(doc(usersCollection, userId));
    const userData = userDoc.data();
    if (userData?.familyId) {
      throw new Error('You are already in a family');
    }

    // Add user to family
    const roleArray = role === 'parent' ? 'parentIds' : 'childIds';
    await updateDoc(doc(familiesCollection, family.id), {
      memberIds: arrayUnion(userId),
      [roleArray]: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Update user's familyId and role
    await updateDoc(doc(usersCollection, userId), {
      familyId: family.id,
      role,
      updatedAt: serverTimestamp(),
    });

    // Return updated family
    return {
      ...family,
      memberIds: [...family.memberIds, userId],
      [roleArray]: [...family[roleArray], userId],
    };
  } catch (error: any) {
    console.error('Error joining family:', error);
    throw new Error(error.message || 'Failed to join family');
  }
};

/**
 * Get family by ID
 */
export const getFamily = async (familyId: string): Promise<Family | null> => {
  try {
    const familyDoc = await getDoc(doc(familiesCollection, familyId));
    
    if (!familyDoc.exists()) {
      return null;
    }

    return { id: familyDoc.id, ...familyDoc.data() } as Family;
  } catch (error) {
    console.error('Error getting family:', error);
    throw new Error('Failed to get family');
  }
};

/**
 * Get family members
 */
export const getFamilyMembers = async (familyId: string): Promise<User[]> => {
  try {
    const family = await getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const members: User[] = [];
    
    // Fetch all member documents
    for (const memberId of family.memberIds) {
      const userDoc = await getDoc(doc(usersCollection, memberId));
      if (userDoc.exists()) {
        members.push({ id: userDoc.id, ...userDoc.data() } as User);
      }
    }

    return members;
  } catch (error) {
    console.error('Error getting family members:', error);
    throw new Error('Failed to get family members');
  }
};

/**
 * Update family settings
 */
export const updateFamily = async (
  familyId: string,
  updates: Partial<Family>
): Promise<void> => {
  try {
    await updateDoc(doc(familiesCollection, familyId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating family:', error);
    throw new Error('Failed to update family');
  }
};

/**
 * Remove member from family
 */
export const removeFamilyMember = async (
  familyId: string,
  userId: string
): Promise<void> => {
  try {
    const family = await getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Determine user's role
    const role = family.parentIds.includes(userId) ? 'parent' : 'child';
    const roleArray = role === 'parent' ? 'parentIds' : 'childIds';

    // Remove user from family
    await updateDoc(doc(familiesCollection, familyId), {
      memberIds: arrayRemove(userId),
      [roleArray]: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Clear user's familyId
    await updateDoc(doc(usersCollection, userId), {
      familyId: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing family member:', error);
    throw new Error('Failed to remove family member');
  }
};

/**
 * Leave family (remove self)
 */
export const leaveFamily = async (userId: string): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    const userData = userDoc.data();
    
    if (!userData?.familyId) {
      throw new Error('You are not in a family');
    }

    await removeFamilyMember(userData.familyId, userId);
  } catch (error: any) {
    console.error('Error leaving family:', error);
    throw new Error(error.message || 'Failed to leave family');
  }
};

/**
 * Change member role
 */
export const changeMemberRole = async (
  familyId: string,
  userId: string,
  newRole: 'parent' | 'child'
): Promise<void> => {
  try {
    const family = await getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const currentRole = family.parentIds.includes(userId) ? 'parent' : 'child';
    if (currentRole === newRole) {
      return; // No change needed
    }

    const oldRoleArray = currentRole === 'parent' ? 'parentIds' : 'childIds';
    const newRoleArray = newRole === 'parent' ? 'parentIds' : 'childIds';

    // Update family document
    await updateDoc(doc(familiesCollection, familyId), {
      [oldRoleArray]: arrayRemove(userId),
      [newRoleArray]: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Update user document
    await updateDoc(doc(usersCollection, userId), {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error changing member role:', error);
    throw new Error('Failed to change member role');
  }
};

/**
 * Subscribe to family updates
 */
export const subscribeToFamily = (
  familyId: string,
  callback: (family: Family | null) => void
): Unsubscribe => {
  return onSnapshot(
    doc(familiesCollection, familyId),
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Family);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to family:', error);
      callback(null);
    }
  );
};

/**
 * Subscribe to family members updates
 */
export const subscribeToFamilyMembers = (
  memberIds: string[],
  callback: (members: User[]) => void
): Unsubscribe => {
  if (memberIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Create a query for all member documents
  const q = query(usersCollection, where('__name__', 'in', memberIds));

  return onSnapshot(
    q,
    (snapshot) => {
      const members: User[] = [];
      snapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as User);
      });
      callback(members);
    },
    (error) => {
      console.error('Error subscribing to family members:', error);
      callback([]);
    }
  );
};

/**
 * Generate a new invite code for the family
 */
export const regenerateInviteCode = async (familyId: string): Promise<string> => {
  try {
    const newCode = await generateInviteCode();
    
    await updateDoc(doc(familiesCollection, familyId), {
      inviteCode: newCode,
      updatedAt: serverTimestamp(),
    });

    return newCode;
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    throw new Error('Failed to regenerate invite code');
  }
};

/**
 * Check if user can perform admin actions
 */
export const canPerformAdminAction = async (
  userId: string,
  familyId: string
): Promise<boolean> => {
  try {
    const family = await getFamily(familyId);
    if (!family) {
      return false;
    }

    // Only parents can perform admin actions
    return family.parentIds.includes(userId);
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return false;
  }
};