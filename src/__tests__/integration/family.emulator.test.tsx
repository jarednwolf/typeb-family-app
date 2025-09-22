/**
 * Family Service Integration Tests with Firebase Emulators
 * 
 * Tests family management operations against real Firebase services:
 * - Family creation and invite code generation
 * - Member joining and role management
 * - Security rules enforcement
 * - Transaction safety
 */

import { 
  initializeTestApp, 
  clearTestData,
  createTestUser
} from '../../test-utils/firebase-test-helpers';
import { 
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc
} from 'firebase/firestore';
import {
  createFamily,
  joinFamily,
  removeFamilyMember,
  changeMemberRole,
  regenerateInviteCode,
  getFamily,
  getFamilyMembers,
  leaveFamily,
  updateFamily
} from '../../services/family';

describe('Family Service Emulator Integration Tests', () => {
  let testApp: any;
  let parentUser: User;
  let childUser: User;
  let secondParentUser: User;

  beforeAll(async () => {
    testApp = await initializeTestApp();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create test users with unique timestamps
    const timestamp = Date.now();
    
    parentUser = await createTestUser({
      email: `parent-${timestamp}@example.com`,
      password: 'Parent123!',
      displayName: 'Test Parent',
      role: 'parent'
    });
    
    childUser = await createTestUser({
      email: `child-${timestamp + 1}@example.com`,
      password: 'Child123!',
      displayName: 'Test Child',
      role: 'child'
    });
    
    secondParentUser = await createTestUser({
      email: `parent2-${timestamp + 2}@example.com`,
      password: 'Parent123!',
      displayName: 'Second Parent',
      role: 'parent'
    });
    
    // Sign out to start fresh
    await signOut(testApp.auth);
  });

  afterEach(async () => {
    if (testApp.auth.currentUser) {
      await signOut(testApp.auth);
    }
  });

  describe('Family Creation', () => {
    test('should create a family with proper structure', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      const familyName = 'Test Family';
      
      // Use the actual createFamily service function
      const family = await createFamily(parentUser.uid, familyName);
      
      // Verify family was created
      expect(family).toBeDefined();
      expect(family.name).toBe(familyName);
      expect(family.memberIds).toContain(parentUser.uid);
      expect(family.parentIds).toContain(parentUser.uid);
      expect(family.childIds).toEqual([]);
      expect(family.createdBy).toBe(parentUser.uid);
      expect(family.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(family.maxMembers).toBe(4);
      expect(family.isPremium).toBe(false);
      
      // Verify user was updated
      const userDoc = await getDoc(doc(testApp.firestore, 'users', parentUser.uid));
      expect(userDoc.data()?.familyId).toBe(family.id);
    });

    test('should prevent creating family if already in one', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      // First create a family
      await createFamily(parentUser.uid, 'First Family');
      
      // Try to create another family
      await expect(createFamily(parentUser.uid, 'Second Family'))
        .rejects.toThrow('You are already in a family');
    });

    test('should validate family name', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      // Test empty name
      await expect(createFamily(parentUser.uid, ''))
        .rejects.toThrow('Family name is required');
      
      // Test short name
      await expect(createFamily(parentUser.uid, 'A'))
        .rejects.toThrow('Family name must be at least 2 characters');
      
      // Test long name
      await expect(createFamily(parentUser.uid, 'a'.repeat(51)))
        .rejects.toThrow('Family name must not exceed 50 characters');
      
      // Test invalid characters
      await expect(createFamily(parentUser.uid, 'Test<script>'))
        .rejects.toThrow('Family name contains invalid characters');
    });

    test('should require authentication', async () => {
      // Try without signing in
      await expect(createFamily(parentUser.uid, 'Test Family'))
        .rejects.toThrow('User authentication required');
    });
  });

  describe('Joining Family', () => {
    let family: any;
    let inviteCode: string;

    beforeEach(async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      family = await createFamily(parentUser.uid, 'Join Test Family');
      inviteCode = family.inviteCode;
      
      await signOut(testApp.auth);
    });

    test('should allow joining family with valid invite code', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Join family using service function
      const joinedFamily = await joinFamily(childUser.uid, inviteCode);
      
      expect(joinedFamily).toBeDefined();
      expect(joinedFamily.id).toBe(family.id);
      
      // Verify child was added
      const updatedFamily = await getFamily(family.id);
      expect(updatedFamily).not.toBeNull();
      expect(updatedFamily!.memberIds).toContain(childUser.uid);
      expect(updatedFamily!.childIds).toContain(childUser.uid);
      
      // Verify user was updated
      const userDoc = await getDoc(doc(testApp.firestore, 'users', childUser.uid));
      expect(userDoc.data()?.familyId).toBe(family.id);
    });

    test('should reject invalid invite codes', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Try with invalid code
      await expect(joinFamily(childUser.uid, 'INVALID'))
        .rejects.toThrow('Invalid invite code');
    });

    test('should validate invite code format', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Test empty code
      await expect(joinFamily(childUser.uid, ''))
        .rejects.toThrow('Invite code is required');
      
      // Test invalid format
      await expect(joinFamily(childUser.uid, 'abc'))
        .rejects.toThrow('Invalid invite code format');
    });

    test('should handle case-insensitive invite codes', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Join with lowercase version of code
      const joinedFamily = await joinFamily(childUser.uid, inviteCode.toLowerCase());
      
      expect(joinedFamily.id).toBe(family.id);
    });

    test('should enforce family capacity limits', async () => {
      // Sign in as parent to update family capacity
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      // Set max members to 1 (just the parent)
      await updateFamily(family.id, { maxMembers: 1 });
      
      await signOut(testApp.auth);
      
      // Try to join as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      await expect(joinFamily(childUser.uid, inviteCode))
        .rejects.toThrow('Family is at maximum capacity');
    });

    test('should prevent joining if already in a family', async () => {
      // Create another family as second parent
      await signInWithEmailAndPassword(testApp.auth, secondParentUser.email!, 'Parent123!');
      const secondFamily = await createFamily(secondParentUser.uid, 'Second Family');
      
      // Try to join first family while already in second
      await expect(joinFamily(secondParentUser.uid, inviteCode))
        .rejects.toThrow('You are already in a family');
    });
  });

  describe('Member Management', () => {
    let family: any;

    beforeEach(async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      family = await createFamily(parentUser.uid, 'Member Test Family');
      
      await signOut(testApp.auth);
      
      // Join as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      await joinFamily(childUser.uid, family.inviteCode);
      
      await signOut(testApp.auth);
      
      // Join as second parent
      await signInWithEmailAndPassword(testApp.auth, secondParentUser.email!, 'Parent123!');
      await joinFamily(secondParentUser.uid, family.inviteCode, 'parent');
      
      await signOut(testApp.auth);
      
      // Sign back in as first parent for management operations
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
    });

    test('should allow parent to remove child member', async () => {
      // Remove child from family
      await removeFamilyMember(family.id, childUser.uid);
      
      // Verify removal
      const updatedFamily = await getFamily(family.id);
      expect(updatedFamily).not.toBeNull();
      expect(updatedFamily!.memberIds).not.toContain(childUser.uid);
      expect(updatedFamily!.childIds).not.toContain(childUser.uid);
    });

    test('should allow parent to change member roles', async () => {
      // Promote child to parent
      await changeMemberRole(family.id, childUser.uid, 'parent');
      
      // Verify role change
      const updatedFamily = await getFamily(family.id);
      expect(updatedFamily).not.toBeNull();
      expect(updatedFamily!.parentIds).toContain(childUser.uid);
      expect(updatedFamily!.childIds).not.toContain(childUser.uid);
    });

    test('should prevent removing yourself', async () => {
      // Try to remove self
      await expect(removeFamilyMember(family.id, parentUser.uid))
        .rejects.toThrow('Cannot remove yourself. Use leave family instead.');
    });

    test('should prevent demoting last parent', async () => {
      // Remove second parent first
      await removeFamilyMember(family.id, secondParentUser.uid);
      
      // Try to demote self (last parent)
      await expect(changeMemberRole(family.id, parentUser.uid, 'child'))
        .rejects.toThrow('Cannot demote the last parent');
    });
    
    test('should prevent child from performing admin actions', async () => {
      // Sign out parent and sign in as child
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Try to remove parent as child
      await expect(removeFamilyMember(family.id, parentUser.uid))
        .rejects.toThrow('Only parents can perform administrative actions');
      
      // Try to change roles as child
      await expect(changeMemberRole(family.id, parentUser.uid, 'child'))
        .rejects.toThrow('Only parents can perform administrative actions');
      
      // Try to update family as child
      await expect(updateFamily(family.id, { name: 'New Name' }))
        .rejects.toThrow('Only parents can update family settings');
    });
  });

  describe('Leave Family', () => {
    let family: any;

    beforeEach(async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      family = await createFamily(parentUser.uid, 'Leave Test Family');
      
      await signOut(testApp.auth);
      
      // Join as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      await joinFamily(childUser.uid, family.inviteCode);
      
      await signOut(testApp.auth);
    });

    test('should allow child to leave family', async () => {
      // Sign in as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // Leave family
      await leaveFamily(childUser.uid);
      
      // Verify user left
      const userDoc = await getDoc(doc(testApp.firestore, 'users', childUser.uid));
      expect(userDoc.data()?.familyId).toBeNull();
      
      // Sign in as parent to check family
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      const updatedFamily = await getFamily(family.id);
      expect(updatedFamily).not.toBeNull();
      expect(updatedFamily!.memberIds).not.toContain(childUser.uid);
    });

    test('should prevent last parent from leaving with other members', async () => {
      // Sign in as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      
      // Try to leave as last parent
      await expect(leaveFamily(parentUser.uid))
        .rejects.toThrow('Cannot leave family as the last parent while other members exist');
    });

    test('should allow last member to leave (delete family)', async () => {
      // First, child leaves
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      await leaveFamily(childUser.uid);
      
      await signOut(testApp.auth);
      
      // Then parent leaves (last member)
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      await leaveFamily(parentUser.uid);
      
      // Verify user left
      const userDoc = await getDoc(doc(testApp.firestore, 'users', parentUser.uid));
      expect(userDoc.data()?.familyId).toBeNull();
    });
  });

  describe('Security Rules', () => {
    test('should prevent non-members from reading family data', async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const privateFamily = await createFamily(parentUser.uid, 'Private Family');
      
      await signOut(testApp.auth);
      
      // Try to read as non-member
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // This should fail due to security rules
      await expect(getFamily(privateFamily.id))
        .rejects.toThrow('You are not authorized to view this family');
    });

    test('should allow members to read their family data', async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const sharedFamily = await createFamily(parentUser.uid, 'Shared Family');
      
      await signOut(testApp.auth);
      
      // Join as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      await joinFamily(childUser.uid, sharedFamily.inviteCode);
      
      // Should be able to read family data
      const familyData = await getFamily(sharedFamily.id);
      expect(familyData).not.toBeNull();
      expect(familyData!.name).toBe('Shared Family');
      expect(familyData!.memberIds).toContain(childUser.uid);
    });

    test('should allow reading family members list', async () => {
      // Create a family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const family = await createFamily(parentUser.uid, 'Members Test Family');
      
      await signOut(testApp.auth);
      
      // Join as child
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      await joinFamily(childUser.uid, family.inviteCode);
      
      // Get family members
      const members = await getFamilyMembers(family.id);
      expect(members).toHaveLength(2);
      expect(members.some(m => m.id === parentUser.uid)).toBe(true);
      expect(members.some(m => m.id === childUser.uid)).toBe(true);
    });
  });
  
  describe('Additional Features', () => {
    test('should regenerate invite code', async () => {
      // Create family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const family = await createFamily(parentUser.uid, 'Regenerate Test Family');
      const originalCode = family.inviteCode;
      
      // Regenerate code
      const newCode = await regenerateInviteCode(family.id);
      
      expect(newCode).not.toBe(originalCode);
      expect(newCode).toMatch(/^[A-Z0-9]{6}$/);
      
      // Verify old code no longer works
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      await expect(joinFamily(childUser.uid, originalCode))
        .rejects.toThrow('Invalid invite code');
      
      // Verify new code works
      const joinedFamily = await joinFamily(childUser.uid, newCode);
      expect(joinedFamily.id).toBe(family.id);
    });

    test('should update family settings', async () => {
      // Create family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const family = await createFamily(parentUser.uid, 'Update Test Family');
      
      // Update family name and settings
      await updateFamily(family.id, {
        name: 'Updated Family Name',
        maxMembers: 6
      });
      
      // Verify updates
      const updatedFamily = await getFamily(family.id);
      expect(updatedFamily).not.toBeNull();
      expect(updatedFamily!.name).toBe('Updated Family Name');
      expect(updatedFamily!.maxMembers).toBe(6);
    });

    test('should handle premium family features', async () => {
      // Create premium family as parent
      await signInWithEmailAndPassword(testApp.auth, parentUser.email!, 'Parent123!');
      const family = await createFamily(parentUser.uid, 'Premium Family', true);
      
      expect(family.isPremium).toBe(true);
      expect(family.maxMembers).toBe(10); // Premium limit
    });
  });
});