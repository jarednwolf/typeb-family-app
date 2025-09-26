/**
 * Family management service
 * Handles all family-related operations with Firestore
 * 
 * SECURITY IMPLEMENTATION:
 * - Authorization checks for all operations
 * - Input validation for all user inputs
 * - Transaction support for data consistency
 * - Permission-based access control
 * - Proper error handling and recovery
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
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Family, User, TaskCategory, DEFAULT_TASK_CATEGORIES } from '../types/models';
import { handleOrphanedTasks } from './taskCleanup';

// Collection references
const familiesCollection = collection(db, 'families');
const usersCollection = collection(db, 'users');
const invitesCollection = collection(db, 'invites');

// Input validation constants
const FAMILY_NAME_MIN_LENGTH = 2;
const FAMILY_NAME_MAX_LENGTH = 50;
const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

/**
 * Validate family permissions
 */
const validateFamilyPermission = async (
  userId: string,
  familyId: string,
  action: 'view' | 'update' | 'admin' | 'leave'
): Promise<{ family: Family; user: User }> => {
  if (!userId) {
    throw new Error('User authentication required');
  }

  if (!familyId) {
    throw new Error('Family ID is required');
  }

  // Get user and family data
  const [familyDoc, userDoc] = await Promise.all([
    getDoc(doc(familiesCollection, familyId)),
    getDoc(doc(usersCollection, userId))
  ]);

  if (!familyDoc.exists()) {
    throw new Error('Family not found');
  }

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const user = { id: userDoc.id, ...userDoc.data() } as User;
  const family = { id: familyDoc.id, ...familyDoc.data() } as Family;

  // Check if user is member of family
  if (!family.memberIds.includes(userId)) {
    throw new Error('You are not a member of this family');
  }

  // Check specific permissions
  switch (action) {
    case 'view':
      // All members can view
      break;
    case 'update':
      // Only parents can update
      if (!family.parentIds.includes(userId)) {
        throw new Error('Only parents can update family settings');
      }
      break;
    case 'admin':
      // Only parents can perform admin actions
      if (!family.parentIds.includes(userId)) {
        throw new Error('Only parents can perform administrative actions');
      }
      break;
    case 'leave':
      // Check if last parent
      if (family.parentIds.includes(userId) && 
          family.parentIds.length === 1 && 
          family.memberIds.length > 1) {
        throw new Error('Cannot leave family as the last parent while other members exist');
      }
      break;
  }

  return { family, user };
};

/**
 * Validate family input
 */
const validateFamilyInput = (input: {
  name?: string;
  inviteCode?: string;
  role?: 'parent' | 'child';
  maxMembers?: number;
  taskCategories?: TaskCategory[];
}): void => {
  // Validate family name
  if (input.name !== undefined) {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Family name is required');
    }
    if (input.name.trim().length < FAMILY_NAME_MIN_LENGTH) {
      throw new Error(`Family name must be at least ${FAMILY_NAME_MIN_LENGTH} characters`);
    }
    if (input.name.length > FAMILY_NAME_MAX_LENGTH) {
      throw new Error(`Family name must not exceed ${FAMILY_NAME_MAX_LENGTH} characters`);
    }
    // Check for inappropriate content
    if (/[<>\"\'&]/.test(input.name)) {
      throw new Error('Family name contains invalid characters');
    }
  }

  // Validate invite code
  if (input.inviteCode !== undefined) {
    if (!input.inviteCode || input.inviteCode.trim().length === 0) {
      throw new Error('Invite code is required');
    }
    if (!INVITE_CODE_PATTERN.test(input.inviteCode.toUpperCase())) {
      throw new Error('Invalid invite code format');
    }
  }

  // Validate role
  if (input.role !== undefined) {
    if (!['parent', 'child'].includes(input.role)) {
      throw new Error('Invalid role. Must be "parent" or "child"');
    }
  }

  // Validate max members
  if (input.maxMembers !== undefined) {
    if (input.maxMembers < 2 || input.maxMembers > 20) {
      throw new Error('Maximum members must be between 2 and 20');
    }
  }

  // Validate task categories
  if (input.taskCategories !== undefined) {
    if (!Array.isArray(input.taskCategories)) {
      throw new Error('Task categories must be an array');
    }
    if (input.taskCategories.length > 20) {
      throw new Error('Cannot have more than 20 task categories');
    }
    for (const category of input.taskCategories) {
      if (!category || typeof category !== 'object') {
        throw new Error('Invalid task category format');
      }
      if (!category.id || !category.name || !category.color || typeof category.order !== 'number') {
        throw new Error('Task category must have id, name, color, and order');
      }
      if (category.name.trim().length === 0) {
        throw new Error('Task category name cannot be empty');
      }
      if (category.name.length > 30) {
        throw new Error('Task category name too long');
      }
      if (!/^#[0-9A-F]{6}$/i.test(category.color)) {
        throw new Error('Task category color must be a valid hex color');
      }
    }
  }
};

/**
 * Generate a unique 6-character invite code
 */
const generateInviteCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: INVITE_CODE_LENGTH }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
};

/**
 * Create a new family
 */
export const createFamily = async (
  userId: string,
  familyName: string,
  isPremium: boolean = false,
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;
    memberLabel: string;
    adminPlural?: string;
    memberPlural?: string;
  }
): Promise<Family> => {
  // Validate authentication
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('User authentication required');
  }

  // Validate input
  validateFamilyInput({ name: familyName });

  try {
    return await runTransaction(db, async (transaction) => {
      // Generate unique invite code, retry up to 5 times
      let inviteCode = '';
      for (let i = 0; i < 5; i++) {
        const candidate = await generateInviteCode();
        const snapshot = await getDocs(query(familiesCollection, where('inviteCode', '==', candidate)));
        if (snapshot.empty) {
          inviteCode = candidate;
          break;
        }
      }
      if (!inviteCode) {
        throw new Error('Failed to create family');
      }
      // Check if user exists and is not already in a family
      const userDoc = await transaction.get(doc(usersCollection, userId));
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      const userData = userDoc.data();
      if (userData.familyId) {
        // Check if the family actually exists
        const existingFamilyDoc = await transaction.get(doc(familiesCollection, userData.familyId));
        if (existingFamilyDoc.exists()) {
          throw new Error('You are already in a family. Leave your current family first.');
        } else {
          // Family doesn't exist, clear the invalid familyId
          transaction.update(doc(usersCollection, userId), {
            familyId: null,
            role: null,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Use the pre-generated invite code
      const familyId = doc(familiesCollection).id;

      const newFamily: Omit<Family, 'id'> = {
        name: familyName.trim(),
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
        ...(roleConfig && { roleConfig }), // Add roleConfig if provided
      };

      // Create family document
      const familyRef = doc(familiesCollection, familyId);
      transaction.set(familyRef, {
        ...newFamily,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update user's familyId and role
      transaction.update(doc(usersCollection, userId), {
        familyId,
        role: 'parent',
        updatedAt: serverTimestamp(),
      });

      return { id: familyId, ...newFamily };
    });
  } catch (error: any) {
    console.error('Error creating family:', error);
    if (error?.message?.includes('User profile not found') || error?.message?.includes('You are already in a family')) {
      throw error;
    }
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
  // Validate authentication
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('User authentication required');
  }

  // Validate input
  validateFamilyInput({ inviteCode, role });

  try {
    return await runTransaction(db, async (transaction) => {
      // Check if user exists and is not already in a family
      const userDoc = await transaction.get(doc(usersCollection, userId));
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      const userData = userDoc.data();
      if (userData.familyId) {
        const existingFamilyDoc = await transaction.get(doc(familiesCollection, userData.familyId));
        if (existingFamilyDoc.exists()) {
          // Mirror original behavior: treat as already member of some family
          throw new Error('You are already in a family');
        } else {
          transaction.update(doc(usersCollection, userId), {
            familyId: null,
            role: null,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Find family with invite code
      const q = query(familiesCollection, where('inviteCode', '==', inviteCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('Invalid invite code. Please check and try again.');
      }
      const familyDoc = snapshot.docs[0];
      const family = { id: familyDoc.id, ...familyDoc.data() } as Family;

      // Use the pre-found family data

      // Check if family is at max capacity
      if (family.memberIds.length >= family.maxMembers) {
        throw new Error(`Family is at maximum capacity (${family.maxMembers} members)`);
      }

      // Add user to family
      const roleArray = role === 'parent' ? 'parentIds' : 'childIds';
      transaction.update(doc(familiesCollection, family.id), {
        memberIds: arrayUnion(userId),
        [roleArray]: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });

      // Update user's familyId and role
      transaction.update(doc(usersCollection, userId), {
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
    });
  } catch (error: any) {
    console.error('Error joining family:', error);
    throw new Error(error.message || 'Failed to join family');
  }
};

/**
 * Get family by ID
 */
export const getFamily = async (familyId: string): Promise<Family | null> => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  try {
    const familyDoc = await getDoc(doc(familiesCollection, familyId));
    
    if (!familyDoc.exists()) {
      return null;
    }

    const family = { id: familyDoc.id, ...familyDoc.data() } as Family;

    // Verify user is member of family
    if (!family.memberIds.includes(currentUser.uid)) {
      throw new Error('You are not authorized to view this family');
    }

    return family;
  } catch (error: any) {
    console.error('Error getting family:', error);
    throw new Error(error.message || 'Failed to get family');
  }
};

/**
 * Get family members
 */
export const getFamilyMembers = async (familyId: string): Promise<User[]> => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  try {
    // Validate permission to view family
    const { family } = await validateFamilyPermission(currentUser.uid, familyId, 'view');

    const members: User[] = [];
    
    // Fetch all member documents using Promise.all for better performance and no transaction permission issues
    const memberPromises = family.memberIds.map(memberId =>
      getDoc(doc(usersCollection, memberId))
    );
    
    const memberDocs = await Promise.all(memberPromises);
    
    for (const userDoc of memberDocs) {
      if (userDoc.exists()) {
        members.push({ id: userDoc.id, ...userDoc.data() } as User);
      }
    }

    return members;
  } catch (error: any) {
    console.error('Error getting family members:', error);
    throw new Error(error.message || 'Failed to get family members');
  }
};

/**
 * Update family settings
 */
export const updateFamily = async (
  familyId: string,
  updates: Partial<Pick<Family, 'name' | 'maxMembers' | 'taskCategories'>>
): Promise<void> => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  // Validate input
  validateFamilyInput(updates);

  // Validate permission BEFORE transaction
  const { family } = await validateFamilyPermission(currentUser.uid, familyId, 'update');

  // Additional validation for maxMembers
  if (updates.maxMembers !== undefined) {
    if (updates.maxMembers < family.memberIds.length) {
      throw new Error(`Cannot set max members to ${updates.maxMembers}. Family currently has ${family.memberIds.length} members.`);
    }
    if (!family.isPremium && updates.maxMembers > 1) {
      throw new Error('Premium subscription required for more than 1 member');
    }
  }

  try {
    await runTransaction(db, async (transaction) => {
      // Update family
      transaction.update(doc(familiesCollection, familyId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error updating family:', error);
    throw new Error(error.message || 'Failed to update family');
  }
};

/**
 * Remove member from family
 */
export const removeFamilyMember = async (
  familyId: string,
  targetUserId: string
): Promise<void> => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  if (!targetUserId) {
    throw new Error('Target user ID is required');
  }

  // Validate admin permission BEFORE transaction
  const { family } = await validateFamilyPermission(currentUser.uid, familyId, 'admin');

  // Check if target user is a member
  if (!family.memberIds.includes(targetUserId)) {
    throw new Error('User is not a member of this family');
  }

  const isSelf = currentUser.uid === targetUserId;
  const isLastParent = family.parentIds.includes(targetUserId) &&
    family.parentIds.length === 1 &&
    family.memberIds.length > 1;

  if (isSelf && isLastParent) {
    throw new Error('Cannot remove yourself. Use leave family instead. Cannot remove the last parent while other members exist');
  }
  if (isLastParent) {
    throw new Error('Cannot remove the last parent while other members exist');
  }
  if (isSelf) {
    throw new Error('Cannot remove yourself. Use leave family instead.');
  }

  // Determine user's role
  const role = family.parentIds.includes(targetUserId) ? 'parent' : 'child';
  const roleArray = role === 'parent' ? 'parentIds' : 'childIds';

  // Handle orphaned tasks BEFORE transaction
  await handleOrphanedTasks(familyId, targetUserId, family.createdBy);

  try {
    await runTransaction(db, async (transaction) => {
      // Remove user from family
      transaction.update(doc(familiesCollection, familyId), {
        memberIds: arrayRemove(targetUserId),
        [roleArray]: arrayRemove(targetUserId),
        updatedAt: serverTimestamp(),
      });

      // Clear user's familyId
      transaction.update(doc(usersCollection, targetUserId), {
        familyId: null,
        role: null,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error removing family member:', error);
    throw new Error(error.message || 'Failed to remove family member');
  }
};

/**
 * Leave family (remove self)
 */
export const leaveFamily = async (userId: string): Promise<void> => {
  // Validate authentication
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('User authentication required');
  }

  // Get user data BEFORE transaction
  const userDoc = await getDoc(doc(usersCollection, userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  if (!userData.familyId) {
    throw new Error('You are not in a family');
  }

  // Validate permission to leave BEFORE transaction
  const { family } = await validateFamilyPermission(userId, userData.familyId, 'leave');

  // Determine user's role
  const role = family.parentIds.includes(userId) ? 'parent' : 'child';
  const roleArray = role === 'parent' ? 'parentIds' : 'childIds';

  // Handle orphaned tasks BEFORE transaction
  await handleOrphanedTasks(userData.familyId, userId, family.createdBy);

  try {
    await runTransaction(db, async (transaction) => {
      // Remove user from family
      transaction.update(doc(familiesCollection, userData.familyId), {
        memberIds: arrayRemove(userId),
        [roleArray]: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });

      // Clear user's familyId
      transaction.update(doc(usersCollection, userId), {
        familyId: null,
        role: null,
        updatedAt: serverTimestamp(),
      });
    });
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
  targetUserId: string,
  newRole: 'parent' | 'child'
): Promise<void> => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  // Validate input
  validateFamilyInput({ role: newRole });

  if (!targetUserId) {
    throw new Error('Target user ID is required');
  }

  // Validate admin permission BEFORE transaction
  const { family } = await validateFamilyPermission(currentUser.uid, familyId, 'admin');

  // Check if target user is a member
  if (!family.memberIds.includes(targetUserId)) {
    throw new Error('User is not a member of this family');
  }

  // Get current role
  const currentRole = family.parentIds.includes(targetUserId) ? 'parent' : 'child';
  
  if (currentRole === newRole) {
    return; // No change needed
  }

  // Prevent demoting the last parent
  if (currentRole === 'parent' &&
      newRole === 'child' &&
      family.parentIds.length === 1) {
    throw new Error('Cannot demote the last parent');
  }

  const oldRoleArray = currentRole === 'parent' ? 'parentIds' : 'childIds';
  const newRoleArray = newRole === 'parent' ? 'parentIds' : 'childIds';

  try {
    await runTransaction(db, async (transaction) => {
      // Update family document
      transaction.update(doc(familiesCollection, familyId), {
        [oldRoleArray]: arrayRemove(targetUserId),
        [newRoleArray]: arrayUnion(targetUserId),
        updatedAt: serverTimestamp(),
      });

      // Update user document
      transaction.update(doc(usersCollection, targetUserId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error changing member role:', error);
    throw new Error(error.message || 'Failed to change member role');
  }
};

/**
 * Subscribe to family updates
 */
export const subscribeToFamily = (
  familyId: string,
  callback: (family: Family | null) => void
): Unsubscribe => {
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('User authentication required for family subscription');
    callback(null);
    return () => {};
  }

  return onSnapshot(
    doc(familiesCollection, familyId),
    async (doc) => {
      if (doc.exists()) {
        const family = { id: doc.id, ...doc.data() } as Family;
        
        // Verify user is still a member
        if (!family.memberIds.includes(currentUser.uid)) {
          console.error('User is not a member of this family');
          callback(null);
          return;
        }
        
        callback(family);
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
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('User authentication required for members subscription');
    callback([]);
    return () => {};
  }

  if (memberIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore 'in' query has a limit of 10 items
  if (memberIds.length > 10) {
    console.warn('Too many member IDs for single query. Only first 10 will be monitored.');
    memberIds = memberIds.slice(0, 10);
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
  // Validate authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User authentication required');
  }

  // Validate admin permission BEFORE transaction
  await validateFamilyPermission(currentUser.uid, familyId, 'admin');

  // Generate new unique code BEFORE transaction
  const newCode = await generateInviteCode();

  try {
    await runTransaction(db, async (transaction) => {
      // Update family with new code
      transaction.update(doc(familiesCollection, familyId), {
        inviteCode: newCode,
        updatedAt: serverTimestamp(),
      });
    });

    return newCode;
  } catch (error: any) {
    console.error('Error regenerating invite code:', error);
    throw new Error(error.message || 'Failed to regenerate invite code');
  }
};

/**
 * Check if user can perform admin actions
 */
export const canPerformAdminAction = async (
  userId: string,
  familyId: string
): Promise<boolean> => {
  // Validate authentication
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return false;
  }

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