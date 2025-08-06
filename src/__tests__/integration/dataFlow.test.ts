/**
 * Integration tests for Phase 2 data flow
 * Validates that all services work together correctly
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { createUserProfile, getUserProfile, deleteUserProfile } from '../../services/userProfile';
import { createFamily, joinFamily, getFamily, removeFamilyMember } from '../../services/family';
import { createTask, getFamilyTasks, completeTask, updateTask } from '../../services/tasks';
import { CreateTaskInput } from '../../types/models';

// Test helpers
const generateTestEmail = () => `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!@#';

// Clean up function
const cleanupTestUser = async (user: FirebaseUser) => {
  try {
    await deleteUserProfile(user.uid);
    await user.delete();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

describe('Phase 2 Data Flow Integration Tests', () => {
  let testUserA: FirebaseUser | null = null;
  let testUserB: FirebaseUser | null = null;

  afterEach(async () => {
    // Clean up test users
    if (testUserA) {
      await cleanupTestUser(testUserA);
      testUserA = null;
    }
    if (testUserB) {
      await cleanupTestUser(testUserB);
      testUserB = null;
    }
    await signOut(auth);
  });

  describe('User Profile Creation', () => {
    test('should create user profile when user signs up', async () => {
      // Create auth user
      const email = generateTestEmail();
      const userCred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      testUserA = userCred.user;

      // Create user profile
      await createUserProfile(testUserA.uid, email, 'Test User');

      // Verify profile exists
      const profile = await getUserProfile(testUserA.uid);
      expect(profile).toBeTruthy();
      expect(profile?.email).toBe(email);
      expect(profile?.displayName).toBe('Test User');
      expect(profile?.role).toBe('child'); // Default role
    });
  });

  describe('Family Management', () => {
    test('should create family and handle member operations', async () => {
      // Create two users
      const emailA = generateTestEmail();
      const emailB = generateTestEmail();
      
      const userCredA = await createUserWithEmailAndPassword(auth, emailA, TEST_PASSWORD);
      testUserA = userCredA.user;
      await createUserProfile(testUserA.uid, emailA, 'User A');

      const userCredB = await createUserWithEmailAndPassword(auth, emailB, TEST_PASSWORD);
      testUserB = userCredB.user;
      await createUserProfile(testUserB.uid, emailB, 'User B');

      // User A creates family
      const family = await createFamily(testUserA.uid, 'Test Family');
      expect(family.name).toBe('Test Family');
      expect(family.inviteCode).toHaveLength(6);
      expect(family.memberIds).toContain(testUserA.uid);
      expect(family.parentIds).toContain(testUserA.uid);

      // User B joins family
      const updatedFamily = await joinFamily(testUserB.uid, family.inviteCode);
      expect(updatedFamily.memberIds).toContain(testUserB.uid);
      expect(updatedFamily.childIds).toContain(testUserB.uid);

      // Verify both users have familyId set
      const profileA = await getUserProfile(testUserA.uid);
      const profileB = await getUserProfile(testUserB.uid);
      expect(profileA?.familyId).toBe(family.id);
      expect(profileB?.familyId).toBe(family.id);
    });

    test('should prevent assigning tasks to non-family members', async () => {
      // Create user and family
      const email = generateTestEmail();
      const userCred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      testUserA = userCred.user;
      await createUserProfile(testUserA.uid, email, 'User A');

      const family = await createFamily(testUserA.uid, 'Test Family');

      // Try to create task assigned to non-existent user
      const taskInput: CreateTaskInput = {
        title: 'Test Task',
        categoryId: '1', // Chores
        assignedTo: 'non-existent-user-id',
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium',
      };

      await expect(
        createTask(family.id, testUserA.uid, taskInput)
      ).rejects.toThrow('Cannot assign task to non-family member');
    });
  });

  describe('Task Operations', () => {
    test('should create task with proper category resolution', async () => {
      // Setup user and family
      const email = generateTestEmail();
      const userCred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      testUserA = userCred.user;
      await createUserProfile(testUserA.uid, email, 'User A');

      const family = await createFamily(testUserA.uid, 'Test Family');

      // Create task
      const taskInput: CreateTaskInput = {
        title: 'Clean Room',
        description: 'Clean the bedroom',
        categoryId: '1', // Chores
        assignedTo: testUserA.uid,
        isRecurring: false,
        requiresPhoto: true,
        reminderEnabled: true,
        reminderTime: '09:00',
        priority: 'high',
        points: 10,
      };

      const task = await createTask(family.id, testUserA.uid, taskInput);

      // Verify task has full category object
      expect(task.category).toBeTruthy();
      expect(task.category.name).toBe('Chores');
      expect(task.category.color).toBe('#10B981');
      expect(task.category.icon).toBe('home');
    });

    test('should handle task completion and validation', async () => {
      // Setup
      const email = generateTestEmail();
      const userCred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      testUserA = userCred.user;
      await createUserProfile(testUserA.uid, email, 'User A');

      const family = await createFamily(testUserA.uid, 'Test Family');

      // Create task
      const taskInput: CreateTaskInput = {
        title: 'Test Task',
        categoryId: '1',
        assignedTo: testUserA.uid,
        isRecurring: false,
        requiresPhoto: true,
        reminderEnabled: false,
        priority: 'medium',
      };

      const task = await createTask(family.id, testUserA.uid, taskInput);

      // Complete task with photo
      await completeTask(task.id, testUserA.uid, 'https://example.com/photo.jpg');

      // Fetch updated task
      const tasks = await getFamilyTasks(family.id);
      const completedTask = tasks.find(t => t.id === task.id);

      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.photoUrl).toBe('https://example.com/photo.jpg');
      expect(completedTask?.validationStatus).toBe('pending');
    });
  });

  describe('Orphaned Task Handling', () => {
    test('should reassign tasks when member is removed', async () => {
      // Create two users
      const emailA = generateTestEmail();
      const emailB = generateTestEmail();
      
      const userCredA = await createUserWithEmailAndPassword(auth, emailA, TEST_PASSWORD);
      testUserA = userCredA.user;
      await createUserProfile(testUserA.uid, emailA, 'User A');

      const userCredB = await createUserWithEmailAndPassword(auth, emailB, TEST_PASSWORD);
      testUserB = userCredB.user;
      await createUserProfile(testUserB.uid, emailB, 'User B');

      // User A creates family, User B joins
      const family = await createFamily(testUserA.uid, 'Test Family');
      await joinFamily(testUserB.uid, family.inviteCode);

      // Create task assigned to User B
      const taskInput: CreateTaskInput = {
        title: 'Task for User B',
        categoryId: '1',
        assignedTo: testUserB.uid,
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium',
      };

      const task = await createTask(family.id, testUserA.uid, taskInput);
      expect(task.assignedTo).toBe(testUserB.uid);

      // Remove User B from family
      await removeFamilyMember(family.id, testUserB.uid);

      // Check that task is reassigned to User A (family creator)
      const tasks = await getFamilyTasks(family.id);
      const reassignedTask = tasks.find(t => t.id === task.id);
      
      expect(reassignedTask?.assignedTo).toBe(testUserA.uid);
    });
  });

  describe('Real-time Sync Cleanup', () => {
    test('should clean up listeners on logout', async () => {
      // This test would require mocking the realtimeSync service
      // For now, we just verify the logout doesn't throw
      const email = generateTestEmail();
      const userCred = await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      testUserA = userCred.user;

      await signOut(auth);
      expect(auth.currentUser).toBeNull();
    });
  });
});

// Export test utilities for use in other test files
export const testHelpers = {
  generateTestEmail,
  TEST_PASSWORD,
  cleanupTestUser,
};