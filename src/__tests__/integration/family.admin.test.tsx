/**
 * Family Service Integration Tests with Firebase Admin SDK
 * Uses Admin SDK to bypass security rules and test actual service logic
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initializeApp, cert, deleteApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth as getClientAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp as initializeClientApp } from 'firebase/app';
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
import { waitForEmulators } from '../setup/firebaseTestSetup';

// Test configuration
const TEST_PROJECT_ID = 'typeb-family-test';

describe('Family Service Integration Tests (Admin SDK)', () => {
  let adminApp: AdminApp;
  let adminDb: AdminFirestore;
  let adminAuth: AdminAuth;
  let db: any; // Client Firestore instance against same project
  
  let parentUserId: string;
  let childUserId: string;
  let secondParentUserId: string;
  let clientAuth: ReturnType<typeof getClientAuth>;
  let parentEmail: string;
  let childEmail: string;
  let secondParentEmail: string;

  // Helper to create unique test emails
  const createTestEmail = (prefix: string) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}@test.com`;
  };

  // Helper to create test user
  const createTestUser = async (email: string, displayName: string, role: 'parent' | 'child' = 'parent') => {
    // Create auth user
    const userRecord = await adminAuth.createUser({
      email,
      password: 'password123',
      displayName,
    });

    // Create user profile in Firestore
    const userProfile = {
      email,
      displayName,
      familyId: null,
      role: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPremium: false,
      notificationsEnabled: true,
      timezone: 'America/New_York',
    };
    
    await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
    
    return userRecord.uid;
  };

  beforeAll(async () => {
    await waitForEmulators();
    // Initialize admin app with emulator settings
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    
    adminApp = initializeApp({
      projectId: TEST_PROJECT_ID,
    }, 'admin-test-app');

    adminAuth = getAdminAuth(adminApp);
    adminDb = getAdminFirestore(adminApp);

    // Create client app bound to same project for service functions (modular SDK)
    const clientApp = initializeClientApp({ projectId: TEST_PROJECT_ID, apiKey: 'AIzaSyD-LOCAL-TEST_KEY', appId: 'fake-app-id' }, 'client-admin-tests');
    db = getFirestore(clientApp);
    // Ensure client Firestore uses emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    clientAuth = getClientAuth(clientApp);
    connectAuthEmulator(clientAuth, 'http://localhost:9099', { disableWarnings: true });
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  afterAll(async () => {
    await deleteApp(adminApp);
  });

  beforeEach(async () => {
    // Clear all data
    const collections = ['users', 'families', 'tasks'];
    for (const collectionName of collections) {
      const snapshot = await adminDb.collection(collectionName).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Clear all auth users
    const listUsersResult = await adminAuth.listUsers();
    const deletePromises = listUsersResult.users.map(user => adminAuth.deleteUser(user.uid));
    await Promise.all(deletePromises);

    // Create test users
    parentEmail = createTestEmail('parent');
    childEmail = createTestEmail('child');
    secondParentEmail = createTestEmail('parent2');
    parentUserId = await createTestUser(parentEmail, 'Test Parent', 'parent');
    childUserId = await createTestUser(childEmail, 'Test Child', 'child');
    secondParentUserId = await createTestUser(secondParentEmail, 'Second Parent', 'parent');
    // Default to parent signed-in for tests; individual tests will switch as needed
    await signInWithEmailAndPassword(clientAuth, parentEmail, 'password123');
  });

  describe('createFamily', () => {
    it('should create a new family successfully', async () => {
      const familyName = 'Test Family';
      const family = await createFamily(db, parentUserId, familyName);

      expect(family).toBeDefined();
      expect(family.name).toBe(familyName);
      expect(family.createdBy).toBe(parentUserId);
      expect(family.memberIds).toContain(parentUserId);
      expect(family.parentIds).toContain(parentUserId);
      expect(family.inviteCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify in Firestore
      const familyDoc = await adminDb.collection('families').doc(family.id).get();
      expect(familyDoc.exists).toBe(true);

      // Verify user was updated
      const userDoc = await adminDb.collection('users').doc(parentUserId).get();
      const userData = userDoc.data();
      expect(userData?.familyId).toBe(family.id);
      expect(userData?.role).toBe('parent');
    });

    it('should prevent creating multiple families', async () => {
      // Create first family
      await createFamily(db, parentUserId, 'First Family');

      // Try to create second family
      await expect(createFamily(db, parentUserId, 'Second Family'))
        .rejects.toThrow('You are already in a family');
    });

    it('should validate family name', async () => {
      // Empty name
      await expect(createFamily(db, parentUserId, ''))
        .rejects.toThrow('Family name is required');

      // Too short
      await expect(createFamily(db, parentUserId, 'A'))
        .rejects.toThrow('Family name must be at least 2 characters');

      // Too long
      await expect(createFamily(db, parentUserId, 'a'.repeat(51)))
        .rejects.toThrow('Family name must not exceed 50 characters');

      // Invalid characters
      await expect(createFamily(db, parentUserId, 'Test<script>'))
        .rejects.toThrow('Family name contains invalid characters');
    });

    it('should require authentication', async () => {
      await expect(createFamily(db, '', 'Test Family'))
        .rejects.toThrow('User authentication required');
    });
  });

  describe('joinFamily', () => {
    it('should join family successfully', async () => {
      // Create a family to join (ensure parent signed in)
      await signInWithEmailAndPassword(clientAuth, parentEmail, 'password123');
      const family = await createFamily(db, parentUserId, 'Join Test Family');
      const inviteCode = family.inviteCode;

      // Switch to child for join
      await signOut(clientAuth);
      await signInWithEmailAndPassword(clientAuth, childEmail, 'password123');
      const joinedFamily = await joinFamily(db, childUserId, inviteCode);

      expect(joinedFamily.id).toBe(family.id);
      expect(joinedFamily.memberIds).toContain(childUserId);
      expect(joinedFamily.childIds).toContain(childUserId);

      // Verify family was updated
      const updatedFamily = await getFamily(db, childUserId, family.id);
      expect(updatedFamily?.memberIds).toContain(childUserId);

      // Verify user was updated
      const userDoc = await adminDb.collection('users').doc(childUserId).get();
      const userData = userDoc.data();
      expect(userData?.familyId).toBe(family.id);
      expect(userData?.role).toBe('child');
    });

    it('should validate invite code', async () => {
      // Invalid code
      await expect(joinFamily(db, childUserId, 'INVALID'))
        .rejects.toThrow('Invalid invite code');

      // Empty code
      await expect(joinFamily(db, childUserId, ''))
        .rejects.toThrow('Invite code is required');

      // Wrong format
      await expect(joinFamily(db, childUserId, 'abc'))
        .rejects.toThrow('Invalid invite code format');
    });

    it('should handle case-insensitive invite codes', async () => {
      // Create a family
      await signInWithEmailAndPassword(clientAuth, parentEmail, 'password123');
      const family = await createFamily(db, parentUserId, 'Case Test Family');
      const inviteCode = family.inviteCode;
      await signOut(clientAuth);
      await signInWithEmailAndPassword(clientAuth, childEmail, 'password123');
      const joinedFamily = await joinFamily(db, childUserId, inviteCode.toLowerCase());
      expect(joinedFamily.id).toBe(family.id);
    });

    it('should respect family capacity limits', async () => {
      // Create a family
      await signInWithEmailAndPassword(clientAuth, parentEmail, 'password123');
      const family = await createFamily(db, parentUserId, 'Capacity Test Family');
      const inviteCode = family.inviteCode;

      // Update family to have max 1 member
      await updateFamily(db, parentUserId, family.id, { maxMembers: 1 });

      // Try to join as child
      await signOut(clientAuth);
      await signInWithEmailAndPassword(clientAuth, childEmail, 'password123');
      await expect(joinFamily(db, childUserId, inviteCode))
        .rejects.toThrow('Family is at maximum capacity');
    });

    it('should prevent joining multiple families', async () => {
      // Create first family
      await signInWithEmailAndPassword(clientAuth, parentEmail, 'password123');
      const family1 = await createFamily(db, parentUserId, 'First Family');
      
      // Create second family
      await signOut(clientAuth);
      await signInWithEmailAndPassword(clientAuth, secondParentEmail, 'password123');
      const family2 = await createFamily(db, secondParentUserId, 'Second Family');

      // Try to join first family when already in second
      await expect(joinFamily(db, secondParentUserId, family1.inviteCode))
        .rejects.toThrow('You are already in a family');
    });
  });

  describe('Family Member Management', () => {
    it('should remove family member', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Member Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      await removeFamilyMember(db, parentUserId, family.id, childUserId);

      // Verify family was updated
      const updatedFamily = await getFamily(db, parentUserId, family.id);
      expect(updatedFamily?.memberIds).not.toContain(childUserId);
      expect(updatedFamily?.childIds).not.toContain(childUserId);
    });

    it('should change member role', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Role Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      await changeMemberRole(db, parentUserId, family.id, childUserId, 'parent');

      // Verify role was changed
      const updatedFamily = await getFamily(db, parentUserId, family.id);
      expect(updatedFamily?.parentIds).toContain(childUserId);
      expect(updatedFamily?.childIds).not.toContain(childUserId);
    });

    it('should prevent removing self', async () => {
      // Create family
      const family = await createFamily(db, parentUserId, 'Self Remove Test Family');

      await expect(removeFamilyMember(db, parentUserId, family.id, parentUserId))
        .rejects.toThrow('Cannot remove yourself');
    });

    it('should prevent demoting last parent', async () => {
      // Create family
      const family = await createFamily(db, parentUserId, 'Demote Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      // Add second parent
      await joinFamily(db, secondParentUserId, family.inviteCode, 'parent');

      // Remove second parent first
      await removeFamilyMember(db, parentUserId, family.id, secondParentUserId);

      // Try to demote last parent
      await expect(changeMemberRole(db, parentUserId, family.id, parentUserId, 'child'))
        .rejects.toThrow('Cannot demote the last parent');
    });

    it('should require parent permission for admin actions', async () => {
      // Create family
      const family = await createFamily(db, parentUserId, 'Permission Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      // Try to remove member as child
      await expect(removeFamilyMember(db, childUserId, family.id, parentUserId))
        .rejects.toThrow('Only parents can perform administrative actions');

      // Try to change role as child
      await expect(changeMemberRole(db, childUserId, family.id, parentUserId, 'child'))
        .rejects.toThrow('Only parents can perform administrative actions');

      // Try to update family as child
      await expect(updateFamily(db, childUserId, family.id, { name: 'New Name' }))
        .rejects.toThrow('Only parents can update family settings');
    });
  });

  describe('leaveFamily', () => {
    it('should allow member to leave family', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Leave Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      await leaveFamily(db, childUserId);

      // Verify user was removed from family
      const userDoc = await adminDb.collection('users').doc(childUserId).get();
      const userData = userDoc.data();
      expect(userData?.familyId).toBeNull();
      expect(userData?.role).toBeNull();

      // Verify family was updated
      const updatedFamily = await getFamily(db, parentUserId, family.id);
      expect(updatedFamily?.memberIds).not.toContain(childUserId);
    });

    it('should prevent last parent from leaving with members', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Last Parent Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      await expect(leaveFamily(db, parentUserId))
        .rejects.toThrow('Cannot leave family as the last parent');
    });

    it('should allow last member to leave', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Last Member Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      // Child leaves first
      await leaveFamily(db, childUserId);

      // Parent can now leave
      await leaveFamily(db, parentUserId);

      // Verify family still exists but is empty
      const familyDoc = await adminDb.collection('families').doc(family.id).get();
      expect(familyDoc.exists).toBe(true);
      const familyData = familyDoc.data() as Family;
      expect(familyData.memberIds).toHaveLength(0);
    });
  });

  describe('Family Access Control', () => {
    it('should prevent non-members from viewing family', async () => {
      // Create private family
      const privateFamily = await createFamily(db, parentUserId, 'Private Family');

      // Try to access as non-member
      await expect(getFamily(db, childUserId, privateFamily.id))
        .rejects.toThrow('You are not authorized to view this family');
    });

    it('should allow members to view family', async () => {
      // Create family
      const sharedFamily = await createFamily(db, parentUserId, 'Shared Family');

      // Join as child
      await joinFamily(db, childUserId, sharedFamily.inviteCode);

      // Should be able to view
      const familyData = await getFamily(db, childUserId, sharedFamily.id);
      expect(familyData).toBeDefined();
      expect(familyData?.id).toBe(sharedFamily.id);
    });

    it('should get family members', async () => {
      // Create family with members
      const family = await createFamily(db, parentUserId, 'Members Test Family');

      // Add child
      await joinFamily(db, childUserId, family.inviteCode);

      // Get members
      const members = await getFamilyMembers(db, childUserId, family.id);
      expect(members).toHaveLength(2);
      expect(members.map(m => m.id)).toContain(parentUserId);
      expect(members.map(m => m.id)).toContain(childUserId);
    });
  });

  describe('Invite Code Management', () => {
    it('should regenerate invite code', async () => {
      const family = await createFamily(db, parentUserId, 'Regenerate Test Family');
      const originalCode = family.inviteCode;

      // Regenerate code
      const newCode = await regenerateInviteCode(db, parentUserId, family.id);

      expect(newCode).not.toBe(originalCode);
      expect(newCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify old code no longer works
      await expect(joinFamily(db, childUserId, originalCode))
        .rejects.toThrow('Invalid invite code');

      // Verify new code works
      const joinedFamily = await joinFamily(db, childUserId, newCode);
      expect(joinedFamily.id).toBe(family.id);
    });
  });
});