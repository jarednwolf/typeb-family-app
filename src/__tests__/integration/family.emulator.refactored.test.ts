/**
 * Family Service Integration Tests with Firebase Emulator (Refactored)
 * Tests the refactored family service with real Firebase emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  connectFirestoreEmulator,
  terminate,
} from 'firebase/firestore';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  createFamily,
  joinFamily,
  getFamily,
  getFamilyMembers,
  updateFamily,
  removeFamilyMember,
  leaveFamily,
  changeMemberRole,
  regenerateInviteCode,
} from '../../services/family.refactored';
import { Family, User } from '../../types/models';

// Test configuration
const TEST_PROJECT_ID = 'typeb-family-test';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

describe('Family Service Integration Tests (Refactored)', () => {
  let app: FirebaseApp;
  let auth: ReturnType<typeof getAuth>;
  let db: ReturnType<typeof getFirestore>;
  let parentUser: FirebaseUser;
  let childUser: FirebaseUser;
  let secondParentUser: FirebaseUser;

  // Helper to create unique test emails
  const createTestEmail = (prefix: string) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}@test.com`;
  };

  // Helper to create test user profile
  const createUserProfile = async (user: FirebaseUser, displayName: string) => {
    const userProfile = {
      email: user.email!,
      displayName,
      familyId: null,
      role: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(doc(db, 'users', user.uid), userProfile);
  };

  beforeAll(async () => {
    // Initialize test app with unique name to avoid conflicts
    const appName = `family-test-app-${Date.now()}`;
    app = initializeApp({
      projectId: TEST_PROJECT_ID,
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com',
    }, appName);

    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators
    connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
    connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  });

  afterAll(async () => {
    // Clean up
    await terminate(db);
    await deleteApp(app);
  });

  beforeEach(async () => {
    // Create test users with unique emails for each test
    const parentEmail = createTestEmail('parent');
    const childEmail = createTestEmail('child');
    const secondParentEmail = createTestEmail('parent2');

    const parentCred = await createUserWithEmailAndPassword(auth, parentEmail, 'password123');
    parentUser = parentCred.user;
    await createUserProfile(parentUser, 'Test Parent');

    const childCred = await createUserWithEmailAndPassword(auth, childEmail, 'password123');
    childUser = childCred.user;
    await createUserProfile(childUser, 'Test Child');

    const secondParentCred = await createUserWithEmailAndPassword(auth, secondParentEmail, 'password123');
    secondParentUser = secondParentCred.user;
    await createUserProfile(secondParentUser, 'Second Parent');

    // Sign out to start fresh
    await signOut(auth);
  });

  describe('createFamily', () => {
    it('should create a new family successfully', async () => {
      const familyName = 'Test Family';
      const family = await createFamily(db, parentUser.uid, familyName);

      expect(family).toBeDefined();
      expect(family.name).toBe(familyName);
      expect(family.createdBy).toBe(parentUser.uid);
      expect(family.memberIds).toContain(parentUser.uid);
      expect(family.parentIds).toContain(parentUser.uid);
      expect(family.inviteCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify in Firestore
      const familyDoc = await getDoc(doc(db, 'families', family.id));
      expect(familyDoc.exists()).toBe(true);

      // Verify user was updated
      const userDoc = await getDoc(doc(db, 'users', parentUser.uid));
      const userData = userDoc.data();
      expect(userData?.familyId).toBe(family.id);
      expect(userData?.role).toBe('parent');
    });

    it('should prevent creating multiple families', async () => {
      // Create first family
      await createFamily(db, parentUser.uid, 'First Family');

      // Try to create second family
      await expect(createFamily(db, parentUser.uid, 'Second Family'))
        .rejects.toThrow('You are already in a family');
    });

    it('should validate family name', async () => {
      // Empty name
      await expect(createFamily(db, parentUser.uid, ''))
        .rejects.toThrow('Family name is required');

      // Too short
      await expect(createFamily(db, parentUser.uid, 'A'))
        .rejects.toThrow('Family name must be at least 2 characters');

      // Too long
      await expect(createFamily(db, parentUser.uid, 'a'.repeat(51)))
        .rejects.toThrow('Family name must not exceed 50 characters');

      // Invalid characters
      await expect(createFamily(db, parentUser.uid, 'Test<script>'))
        .rejects.toThrow('Family name contains invalid characters');
    });

    it('should require authentication', async () => {
      await expect(createFamily(db, '', 'Test Family'))
        .rejects.toThrow('User authentication required');
    });
  });

  describe('joinFamily', () => {
    let family: Family;
    let inviteCode: string;

    beforeEach(async () => {
      // Create a family to join
      family = await createFamily(db, parentUser.uid, 'Join Test Family');
      inviteCode = family.inviteCode;
    });

    it('should join family successfully', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');

      const joinedFamily = await joinFamily(db, childUser.uid, inviteCode);

      expect(joinedFamily.id).toBe(family.id);
      expect(joinedFamily.memberIds).toContain(childUser.uid);
      expect(joinedFamily.childIds).toContain(childUser.uid);

      // Verify family was updated
      const updatedFamily = await getFamily(db, childUser.uid, family.id);
      expect(updatedFamily?.memberIds).toContain(childUser.uid);

      // Verify user was updated
      const userDoc = await getDoc(doc(db, 'users', childUser.uid));
      const userData = userDoc.data();
      expect(userData?.familyId).toBe(family.id);
      expect(userData?.role).toBe('child');
    });

    it('should validate invite code', async () => {
      // Invalid code
      await expect(joinFamily(db, childUser.uid, 'INVALID'))
        .rejects.toThrow('Invalid invite code');

      // Empty code
      await expect(joinFamily(db, childUser.uid, ''))
        .rejects.toThrow('Invite code is required');

      // Wrong format
      await expect(joinFamily(db, childUser.uid, 'abc'))
        .rejects.toThrow('Invalid invite code format');
    });

    it('should handle case-insensitive invite codes', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');

      const joinedFamily = await joinFamily(db, childUser.uid, inviteCode.toLowerCase());
      expect(joinedFamily.id).toBe(family.id);
    });

    it('should respect family capacity limits', async () => {
      // Update family to have max 1 member
      await updateFamily(db, parentUser.uid, family.id, { maxMembers: 1 });

      // Try to join
      await expect(joinFamily(db, childUser.uid, inviteCode))
        .rejects.toThrow('Family is at maximum capacity');
    });

    it('should prevent joining multiple families', async () => {
      // Create second family
      const secondFamily = await createFamily(db, secondParentUser.uid, 'Second Family');

      // Try to join first family
      await expect(joinFamily(db, secondParentUser.uid, inviteCode))
        .rejects.toThrow('You are already in a family');
    });
  });

  describe('Family Member Management', () => {
    let family: Family;

    beforeEach(async () => {
      // Create family with members
      family = await createFamily(db, parentUser.uid, 'Member Test Family');

      // Add child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');
      await joinFamily(db, childUser.uid, family.inviteCode);

      // Add second parent
      await signInWithEmailAndPassword(auth, secondParentUser.email!, 'password123');
      await joinFamily(db, secondParentUser.uid, family.inviteCode, 'parent');
    });

    it('should remove family member', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(auth, parentUser.email!, 'password123');

      await removeFamilyMember(db, parentUser.uid, family.id, childUser.uid);

      // Verify family was updated
      const updatedFamily = await getFamily(db, parentUser.uid, family.id);
      expect(updatedFamily?.memberIds).not.toContain(childUser.uid);
      expect(updatedFamily?.childIds).not.toContain(childUser.uid);
    });

    it('should change member role', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(auth, parentUser.email!, 'password123');

      await changeMemberRole(db, parentUser.uid, family.id, childUser.uid, 'parent');

      // Verify role was changed
      const updatedFamily = await getFamily(db, parentUser.uid, family.id);
      expect(updatedFamily?.parentIds).toContain(childUser.uid);
      expect(updatedFamily?.childIds).not.toContain(childUser.uid);
    });

    it('should prevent removing self', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(auth, parentUser.email!, 'password123');

      await expect(removeFamilyMember(db, parentUser.uid, family.id, parentUser.uid))
        .rejects.toThrow('Cannot remove yourself');
    });

    it('should prevent demoting last parent', async () => {
      // Remove second parent first
      await removeFamilyMember(db, parentUser.uid, family.id, secondParentUser.uid);

      // Try to demote last parent
      await expect(changeMemberRole(db, parentUser.uid, family.id, parentUser.uid, 'child'))
        .rejects.toThrow('Cannot demote the last parent');
    });

    it('should require parent permission for admin actions', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');

      // Try to remove member
      await expect(removeFamilyMember(db, childUser.uid, family.id, parentUser.uid))
        .rejects.toThrow('Only parents can perform administrative actions');

      // Try to change role
      await expect(changeMemberRole(db, childUser.uid, family.id, parentUser.uid, 'child'))
        .rejects.toThrow('Only parents can perform administrative actions');

      // Try to update family
      await expect(updateFamily(db, childUser.uid, family.id, { name: 'New Name' }))
        .rejects.toThrow('Only parents can update family settings');
    });
  });

  describe('leaveFamily', () => {
    let family: Family;

    beforeEach(async () => {
      // Create family with members
      family = await createFamily(db, parentUser.uid, 'Leave Test Family');

      // Add child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');
      await joinFamily(db, childUser.uid, family.inviteCode);
    });

    it('should allow member to leave family', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');

      await leaveFamily(db, childUser.uid);

      // Verify user was removed from family
      const userDoc = await getDoc(doc(db, 'users', childUser.uid));
      const userData = userDoc.data();
      expect(userData?.familyId).toBeNull();
      expect(userData?.role).toBeNull();

      // Verify family was updated
      const updatedFamily = await getFamily(db, parentUser.uid, family.id);
      expect(updatedFamily?.memberIds).not.toContain(childUser.uid);
    });

    it('should prevent last parent from leaving with members', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(auth, parentUser.email!, 'password123');

      await expect(leaveFamily(db, parentUser.uid))
        .rejects.toThrow('Cannot leave family as the last parent');
    });

    it('should allow last member to leave', async () => {
      // Child leaves first
      await leaveFamily(db, childUser.uid);

      // Parent can now leave
      await signInWithEmailAndPassword(auth, parentUser.email!, 'password123');
      await leaveFamily(db, parentUser.uid);

      // Verify family still exists but is empty
      const familyDoc = await getDoc(doc(db, 'families', family.id));
      expect(familyDoc.exists()).toBe(true);
      const familyData = familyDoc.data() as Family;
      expect(familyData.memberIds).toHaveLength(0);
    });
  });

  describe('Family Access Control', () => {
    it('should prevent non-members from viewing family', async () => {
      // Create private family
      const privateFamily = await createFamily(db, parentUser.uid, 'Private Family');

      // Try to access as non-member
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');

      await expect(getFamily(db, childUser.uid, privateFamily.id))
        .rejects.toThrow('You are not authorized to view this family');
    });

    it('should allow members to view family', async () => {
      // Create family
      const sharedFamily = await createFamily(db, parentUser.uid, 'Shared Family');

      // Join as child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');
      await joinFamily(db, childUser.uid, sharedFamily.inviteCode);

      // Should be able to view
      const familyData = await getFamily(db, childUser.uid, sharedFamily.id);
      expect(familyData).toBeDefined();
      expect(familyData?.id).toBe(sharedFamily.id);
    });

    it('should get family members', async () => {
      // Create family with members
      const family = await createFamily(db, parentUser.uid, 'Members Test Family');

      // Add child
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');
      await joinFamily(db, childUser.uid, family.inviteCode);

      // Get members
      const members = await getFamilyMembers(db, childUser.uid, family.id);
      expect(members).toHaveLength(2);
      expect(members.map(m => m.id)).toContain(parentUser.uid);
      expect(members.map(m => m.id)).toContain(childUser.uid);
    });
  });

  describe('Invite Code Management', () => {
    it('should regenerate invite code', async () => {
      const family = await createFamily(db, parentUser.uid, 'Regenerate Test Family');
      const originalCode = family.inviteCode;

      // Regenerate code
      const newCode = await regenerateInviteCode(db, parentUser.uid, family.id);

      expect(newCode).not.toBe(originalCode);
      expect(newCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify old code no longer works
      await signInWithEmailAndPassword(auth, childUser.email!, 'password123');
      await expect(joinFamily(db, childUser.uid, originalCode))
        .rejects.toThrow('Invalid invite code');

      // Verify new code works
      const joinedFamily = await joinFamily(db, childUser.uid, newCode);
      expect(joinedFamily.id).toBe(family.id);
    });
  });
});