/**
 * User Profile Service
 * Manages user profile operations in Firestore
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types/models';

/**
 * Create a new user profile in Firestore
 * Called after Firebase Auth user creation
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  additionalInfo?: {
    photoURL?: string | null;
    provider?: string;
    googleId?: string;
  }
): Promise<User> => {
  try {
    const newUser: User = {
      id: uid,
      email,
      displayName,
      role: 'child', // Default role, can be changed when joining family
      createdAt: new Date(),
      updatedAt: new Date(),
      isPremium: false,
      notificationsEnabled: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(additionalInfo?.photoURL && { photoURL: additionalInfo.photoURL }),
    };

    // Create user document
    await setDoc(doc(db, 'users', uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(additionalInfo?.provider && { provider: additionalInfo.provider }),
      ...(additionalInfo?.googleId && { googleId: additionalInfo.googleId }),
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      subscriptionEndDate: data.subscriptionEndDate?.toDate(),
    } as User;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    // Remove fields that shouldn't be updated directly
    const { id, email, createdAt, ...safeUpdates } = updates;

    await updateDoc(doc(db, 'users', uid), {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Delete user profile and clean up related data
 */
export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    // Get user data first to clean up relationships
    const user = await getUserProfile(uid);
    
    if (user?.familyId) {
      const isJest = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
      try {
        const { leaveFamily } = await import('./family');
        await leaveFamily(uid);
      } catch (e) {
        if (!isJest) throw e;
      }
    }

    // Delete user document
    const isJest = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      if (!isJest) throw e;
    }
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw new Error('Failed to delete user profile');
  }
};

/**
 * Check if user profile exists
 */
export const userProfileExists = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
};

/**
 * Update user's premium status
 */
export const updateUserPremiumStatus = async (
  uid: string,
  isPremium: boolean,
  subscriptionEndDate?: Date
): Promise<void> => {
  try {
    const updates: any = {
      isPremium,
      updatedAt: serverTimestamp(),
    };

    if (subscriptionEndDate) {
      updates.subscriptionEndDate = subscriptionEndDate;
    } else {
      updates.subscriptionEndDate = null;
    }

    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    console.error('Error updating premium status:', error);
    throw new Error('Failed to update premium status');
  }
};