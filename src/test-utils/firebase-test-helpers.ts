/**
 * Firebase Test Helpers for Emulator Testing
 * 
 * This module provides utilities for setting up and tearing down
 * test data in Firebase emulators, ensuring isolated test environments.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  Auth,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator,
  FirebaseStorage 
} from 'firebase/storage';

// Emulator configuration
const EMULATOR_CONFIG = {
  auth: { host: 'localhost', port: 9099 },
  firestore: { host: 'localhost', port: 8080 },
  storage: { host: 'localhost', port: 9199 },
  functions: { host: 'localhost', port: 5001 }
};

// Test app configuration
const TEST_APP_CONFIG = {
  apiKey: 'test-api-key',
  authDomain: 'test-auth-domain',
  projectId: 'typeb-family-app', // Match the emulator project ID
  storageBucket: 'test-storage-bucket',
  messagingSenderId: 'test-sender-id',
  appId: 'test-app-id'
};

interface TestApp {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  projectId: string;
}

let testApp: TestApp | null = null;
let emulatorsConnected = false;

/**
 * Initialize a test app connected to Firebase emulators
 */
export const initializeTestApp = async (projectId?: string): Promise<TestApp> => {
  // Clean up any existing app
  if (testApp) {
    await cleanupTestApp();
  }

  // Create new app with test config
  const config = {
    ...TEST_APP_CONFIG,
    projectId: projectId || TEST_APP_CONFIG.projectId
  };
  
  const app = initializeApp(config, `test-app-${Date.now()}`);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  // Connect to emulators only once
  if (!emulatorsConnected) {
    try {
      // Connect Auth emulator
      connectAuthEmulator(auth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`);
      
      // Connect Firestore emulator
      connectFirestoreEmulator(
        firestore, 
        EMULATOR_CONFIG.firestore.host, 
        EMULATOR_CONFIG.firestore.port
      );
      
      // Connect Storage emulator
      connectStorageEmulator(
        storage, 
        EMULATOR_CONFIG.storage.host, 
        EMULATOR_CONFIG.storage.port
      );

      emulatorsConnected = true;
    } catch (error) {
      console.warn('Emulators may already be connected:', error);
    }
  }

  testApp = { app, auth, firestore, storage, projectId: config.projectId };
  return testApp;
};

/**
 * Clean up test app and disconnect from emulators
 */
export const cleanupTestApp = async (): Promise<void> => {
  if (testApp) {
    // Just clear the reference, don't try to delete the app
    testApp = null;
    // Reset emulator connection flag for next test run
    emulatorsConnected = false;
  }
};

/**
 * Clear all data from Firestore emulator
 */
export const clearFirestoreData = async (): Promise<void> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  // Use the REST API to clear the emulator
  const response = await fetch(
    `http://${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}/emulator/v1/projects/${testApp.projectId}/databases/(default)/documents`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error('Failed to clear Firestore data');
  }
};

/**
 * Clear all data from Auth emulator
 */
export const clearAuthData = async (): Promise<void> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  // Use the REST API to clear the auth emulator
  try {
    const response = await fetch(
      `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}/emulator/v1/projects/${testApp.projectId}/accounts`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      console.warn('Failed to clear Auth data:', response.statusText);
    }
  } catch (error) {
    console.warn('Error clearing Auth data:', error);
  }
};

/**
 * Clear all test data from emulators
 */
export const clearTestData = async (): Promise<void> => {
  await clearFirestoreData();
  await clearAuthData();
};

/**
 * Wait for auth state to be ready
 */
export const waitForAuth = async (timeout: number = 5000): Promise<void> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = testApp!.auth.onAuthStateChanged(() => {
      unsubscribe();
      resolve();
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error('Auth state not ready within timeout'));
    }, timeout);
  });
};

/**
 * Create a test user with email and password
 */
export const createTestUser = async (
  userData: {
    email: string;
    password: string;
    displayName?: string;
    familyId?: string;
    role?: 'parent' | 'child';
  }
): Promise<User> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  // Create user in Auth
  const userCredential = await createUserWithEmailAndPassword(
    testApp.auth,
    userData.email,
    userData.password
  );

  // Update display name if provided
  if (userData.displayName) {
    await updateProfile(userCredential.user, {
      displayName: userData.displayName
    });
  }

  // Create user profile in Firestore
  await setDoc(doc(testApp.firestore, 'users', userCredential.user.uid), {
    id: userCredential.user.uid,
    email: userData.email.toLowerCase(),
    displayName: userData.displayName || 'Test User',
    familyId: userData.familyId || null,
    role: userData.role || 'parent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPremium: false,
    notificationsEnabled: true,
    timezone: 'America/New_York'
  });

  // Create security profile
  await setDoc(doc(testApp.firestore, 'securityProfiles', userCredential.user.uid), {
    userId: userCredential.user.uid,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    loginCount: 0,
    failedLoginAttempts: 0,
    emailVerified: false,
    twoFactorEnabled: false
  });

  return userCredential.user;
};

/**
 * Create a test family with initial data
 */
export const createTestFamily = async (
  familyData?: Partial<{
    name: string;
    createdBy: string;
    memberIds: string[];
  }>
): Promise<string> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  const familyId = `test-family-${Date.now()}`;
  const defaultData = {
    id: familyId,
    name: familyData?.name || 'Test Family',
    inviteCode: 'TEST01',
    createdBy: familyData?.createdBy || 'test-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberIds: familyData?.memberIds || [],
    parentIds: [],
    childIds: [],
    maxMembers: 4,
    isPremium: false,
    taskCategories: [
      { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
      { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
      { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
      { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
      { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
    ]
  };

  await setDoc(doc(testApp.firestore, 'families', familyId), {
    ...defaultData,
    ...familyData
  });

  return familyId;
};

/**
 * Create a test task
 */
export const createTestTask = async (
  taskData?: Partial<{
    title: string;
    familyId: string;
    assignedTo: string;
    assignedBy: string;
    dueDate: string;
  }>
): Promise<string> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  const taskId = `test-task-${Date.now()}`;
  const defaultData = {
    id: taskId,
    familyId: taskData?.familyId || 'test-family-id',
    title: taskData?.title || 'Test Task',
    description: '',
    category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
    assignedTo: taskData?.assignedTo || 'test-user-id',
    assignedBy: taskData?.assignedBy || 'test-parent-id',
    createdBy: taskData?.assignedBy || 'test-parent-id',
    status: 'pending' as const,
    requiresPhoto: false,
    dueDate: taskData?.dueDate || new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    isRecurring: false,
    reminderEnabled: true,
    reminderTime: '09:00',
    escalationLevel: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priority: 'medium' as const,
    points: 10
  };

  await setDoc(doc(testApp.firestore, 'tasks', taskId), {
    ...defaultData,
    ...taskData
  });

  return taskId;
};

/**
 * Seed test data for a complete family scenario
 */
export const seedTestFamily = async (): Promise<{
  family: string;
  parent: User;
  child: User;
  tasks: string[];
}> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  // Create parent user
  const parent = await createTestUser({
    email: 'parent@test.com',
    password: 'Parent123!',
    displayName: 'Test Parent',
    role: 'parent'
  });

  // Create child user
  const child = await createTestUser({
    email: 'child@test.com',
    password: 'Child123!',
    displayName: 'Test Child',
    role: 'child'
  });

  // Create family
  const familyId = await createTestFamily({
    name: 'Test Family',
    createdBy: parent.uid,
    memberIds: [parent.uid, child.uid]
  });

  // Update users with family ID
  await setDoc(doc(testApp.firestore, 'users', parent.uid), {
    familyId
  }, { merge: true });

  await setDoc(doc(testApp.firestore, 'users', child.uid), {
    familyId
  }, { merge: true });

  // Update family with parent/child IDs
  await setDoc(doc(testApp.firestore, 'families', familyId), {
    parentIds: [parent.uid],
    childIds: [child.uid]
  }, { merge: true });

  // Create some tasks
  const tasks = await Promise.all([
    createTestTask({
      title: 'Clean your room',
      familyId,
      assignedTo: child.uid,
      assignedBy: parent.uid
    }),
    createTestTask({
      title: 'Do homework',
      familyId,
      assignedTo: child.uid,
      assignedBy: parent.uid,
      dueDate: new Date().toISOString() // Due today
    }),
    createTestTask({
      title: 'Take out trash',
      familyId,
      assignedTo: parent.uid,
      assignedBy: parent.uid
    })
  ]);

  return {
    family: familyId,
    parent,
    child,
    tasks
  };
};

/**
 * Sign in as a test user
 */
export const signInTestUser = async (
  email: string = 'test@example.com',
  password: string = 'Test123!'
): Promise<User> => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }

  const userCredential = await signInWithEmailAndPassword(
    testApp.auth,
    email,
    password
  );

  return userCredential.user;
};

/**
 * Get the current test app instance
 */
export const getTestApp = (): TestApp => {
  if (!testApp) {
    throw new Error('Test app not initialized');
  }
  return testApp;
};

/**
 * Wait for emulators to be ready
 */
export const waitForEmulators = async (maxAttempts = 30): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try to connect to Firestore emulator
      const response = await fetch(
        `http://${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}/`
      );
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Emulator not ready yet
    }
    
    // Wait 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Emulators did not start within timeout period');
};

// Export emulator config for use in other files
export { EMULATOR_CONFIG };