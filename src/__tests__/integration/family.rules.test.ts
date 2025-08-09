/**
 * Family Security Rules Integration Tests
 * 
 * Tests Firestore security rules for family operations
 * using Firebase emulators
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
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

describe('Family Security Rules Tests', () => {
  let testApp: any;
  let testUser: User;

  beforeAll(async () => {
    testApp = await initializeTestApp();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create a test user
    testUser = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!',
      displayName: 'Test User',
      role: 'parent'
    });
    
    // Sign in as the test user
    await signInWithEmailAndPassword(testApp.auth, testUser.email!, 'Test123!');
  });

  afterEach(async () => {
    if (testApp.auth.currentUser) {
      await signOut(testApp.auth);
    }
  });

  describe('Family Creation Rules', () => {
    test('should allow authenticated user to create family with matching createdBy', async () => {
      const familyId = `family-${Date.now()}`;
      
      // This should succeed
      await setDoc(doc(testApp.firestore, 'families', familyId), {
        id: familyId,
        name: 'Test Family',
        inviteCode: 'TEST01',
        createdBy: testUser.uid, // Matches authenticated user
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds: [testUser.uid],
        parentIds: [testUser.uid],
        childIds: [],
        maxMembers: 4,
        isPremium: false,
        taskCategories: []
      });
      
      // Verify it was created
      const familyDoc = await getDoc(doc(testApp.firestore, 'families', familyId));
      expect(familyDoc.exists()).toBe(true);
    });

    test('should reject family creation with mismatched createdBy', async () => {
      const familyId = `family-${Date.now()}`;
      
      // This should fail
      await expect(
        setDoc(doc(testApp.firestore, 'families', familyId), {
          id: familyId,
          name: 'Test Family',
          inviteCode: 'TEST01',
          createdBy: 'different-user-id', // Does not match authenticated user
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          memberIds: [testUser.uid],
          parentIds: [testUser.uid],
          childIds: [],
          maxMembers: 4,
          isPremium: false,
          taskCategories: []
        })
      ).rejects.toThrow();
    });

    test('should reject unauthenticated family creation', async () => {
      // Sign out
      await signOut(testApp.auth);
      
      const familyId = `family-${Date.now()}`;
      
      // This should fail
      await expect(
        setDoc(doc(testApp.firestore, 'families', familyId), {
          id: familyId,
          name: 'Test Family',
          inviteCode: 'TEST01',
          createdBy: 'any-user-id',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          memberIds: [],
          parentIds: [],
          childIds: [],
          maxMembers: 4,
          isPremium: false,
          taskCategories: []
        })
      ).rejects.toThrow();
    });
  });

  describe('Family Update Rules', () => {
    let familyId: string;

    beforeEach(async () => {
      // Create a family first
      familyId = `family-${Date.now()}`;
      
      await setDoc(doc(testApp.firestore, 'families', familyId), {
        id: familyId,
        name: 'Test Family',
        inviteCode: 'TEST01',
        createdBy: testUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds: [testUser.uid],
        parentIds: [testUser.uid],
        childIds: [],
        maxMembers: 4,
        isPremium: false,
        taskCategories: []
      });
    });

    test('should allow parent to update family', async () => {
      // This should succeed
      await updateDoc(doc(testApp.firestore, 'families', familyId), {
        name: 'Updated Family Name',
        updatedAt: serverTimestamp()
      });
      
      // Verify update
      const familyDoc = await getDoc(doc(testApp.firestore, 'families', familyId));
      expect(familyDoc.data()?.name).toBe('Updated Family Name');
    });

    test('should reject update from non-parent member', async () => {
      // Create a child user
      const childUser = await createTestUser({
        email: `child-${Date.now()}@example.com`,
        password: 'Child123!',
        displayName: 'Test Child',
        role: 'child',
        familyId: familyId
      });
      
      // Update family to include child
      await updateDoc(doc(testApp.firestore, 'families', familyId), {
        memberIds: [testUser.uid, childUser.uid],
        childIds: [childUser.uid]
      });
      
      // Sign out parent and sign in as child
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, childUser.email!, 'Child123!');
      
      // This should fail
      await expect(
        updateDoc(doc(testApp.firestore, 'families', familyId), {
          name: 'Child Updated Name',
          updatedAt: serverTimestamp()
        })
      ).rejects.toThrow();
    });

    test('should reject update from non-member', async () => {
      // Create another user not in family
      const otherUser = await createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'Other123!',
        displayName: 'Other User',
        role: 'parent'
      });
      
      // Sign out and sign in as other user
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, otherUser.email!, 'Other123!');
      
      // This should fail
      await expect(
        updateDoc(doc(testApp.firestore, 'families', familyId), {
          name: 'Hacked Name',
          updatedAt: serverTimestamp()
        })
      ).rejects.toThrow();
    });
  });

  describe('Family Read Rules', () => {
    let familyId: string;

    beforeEach(async () => {
      // Create a family
      familyId = `family-${Date.now()}`;
      
      await setDoc(doc(testApp.firestore, 'families', familyId), {
        id: familyId,
        name: 'Private Family',
        inviteCode: 'TEST01',
        createdBy: testUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds: [testUser.uid],
        parentIds: [testUser.uid],
        childIds: [],
        maxMembers: 4,
        isPremium: false,
        taskCategories: []
      });
    });

    test('should allow member to read family', async () => {
      // This should succeed
      const familyDoc = await getDoc(doc(testApp.firestore, 'families', familyId));
      expect(familyDoc.exists()).toBe(true);
      expect(familyDoc.data()?.name).toBe('Private Family');
    });

    test('should reject read from non-member', async () => {
      // Create another user not in family
      const otherUser = await createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'Other123!',
        displayName: 'Other User',
        role: 'parent'
      });
      
      // Sign out and sign in as other user
      await signOut(testApp.auth);
      await signInWithEmailAndPassword(testApp.auth, otherUser.email!, 'Other123!');
      
      // This should fail
      await expect(
        getDoc(doc(testApp.firestore, 'families', familyId))
      ).rejects.toThrow();
    });

    test('should reject read when not authenticated', async () => {
      // Sign out
      await signOut(testApp.auth);
      
      // This should fail
      await expect(
        getDoc(doc(testApp.firestore, 'families', familyId))
      ).rejects.toThrow();
    });
  });

  describe('User Document Rules', () => {
    test('should allow user to read own profile', async () => {
      const userDoc = await getDoc(doc(testApp.firestore, 'users', testUser.uid));
      expect(userDoc.exists()).toBe(true);
    });

    test('should allow user to update own profile', async () => {
      await updateDoc(doc(testApp.firestore, 'users', testUser.uid), {
        displayName: 'Updated Name',
        updatedAt: serverTimestamp()
      });
      
      const userDoc = await getDoc(doc(testApp.firestore, 'users', testUser.uid));
      expect(userDoc.data()?.displayName).toBe('Updated Name');
    });

    test('should reject reading other user profile without same family', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'Other123!',
        displayName: 'Other User',
        role: 'parent'
      });
      
      // Try to read other user's profile
      await expect(
        getDoc(doc(testApp.firestore, 'users', otherUser.uid))
      ).rejects.toThrow();
    });

    test('should allow reading family member profile', async () => {
      // Create a family
      const familyId = `family-${Date.now()}`;
      await setDoc(doc(testApp.firestore, 'families', familyId), {
        id: familyId,
        name: 'Shared Family',
        inviteCode: 'TEST01',
        createdBy: testUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds: [testUser.uid],
        parentIds: [testUser.uid],
        childIds: [],
        maxMembers: 4,
        isPremium: false,
        taskCategories: []
      });
      
      // Update user with family ID
      await updateDoc(doc(testApp.firestore, 'users', testUser.uid), {
        familyId: familyId
      });
      
      // Create another user in same family
      const familyMember = await createTestUser({
        email: `member-${Date.now()}@example.com`,
        password: 'Member123!',
        displayName: 'Family Member',
        role: 'child',
        familyId: familyId
      });
      
      // Update family to include new member
      await updateDoc(doc(testApp.firestore, 'families', familyId), {
        memberIds: [testUser.uid, familyMember.uid],
        childIds: [familyMember.uid]
      });
      
      // Should be able to read family member's profile
      const memberDoc = await getDoc(doc(testApp.firestore, 'users', familyMember.uid));
      expect(memberDoc.exists()).toBe(true);
    });
  });
});