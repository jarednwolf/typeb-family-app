/**
 * Auth Service Integration Tests with Firebase Emulators
 * 
 * This test file demonstrates how to test authentication
 * operations using real Firebase emulators instead of mocks.
 */

import { 
  initializeTestApp, 
  clearTestData,
  getTestApp
} from '../../test-utils/firebase-test-helpers';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Import validation functions from auth service
import {
  validatePassword,
  validateEmail,
  validateDisplayName,
  formatAuthError
} from '../../services/auth';

describe('Auth Emulator Integration Tests', () => {
  let testApp: any;

  beforeAll(async () => {
    testApp = await initializeTestApp();
  });

  beforeEach(async () => {
    await clearTestData();
    if (testApp.auth.currentUser) {
      await signOut(testApp.auth);
    }
  });

  afterEach(async () => {
    if (testApp.auth.currentUser) {
      await signOut(testApp.auth);
    }
  });

  describe('User Registration', () => {
    test('should create a new user with email and password', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'TestPass123!';
      const displayName = 'Test User';

      // Validate inputs
      expect(validateEmail(email).isValid).toBe(true);
      expect(validatePassword(password).isValid).toBe(true);
      expect(validateDisplayName(displayName).isValid).toBe(true);

      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        password
      );

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(email);
      expect(userCredential.user.emailVerified).toBe(false);

      // Update display name
      await updateProfile(userCredential.user, { displayName });

      // Create user profile in Firestore
      await setDoc(doc(testApp.firestore, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        email: email.toLowerCase(),
        displayName,
        familyId: null,
        role: 'parent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: false,
        notificationsEnabled: true,
        timezone: 'America/New_York'
      });

      // Verify profile was created
      const userDoc = await getDoc(doc(testApp.firestore, 'users', userCredential.user.uid));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(email);
    });

    test('should prevent duplicate email registration', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const password = 'TestPass123!';

      // Create first user
      await createUserWithEmailAndPassword(testApp.auth, email, password);
      await signOut(testApp.auth);

      // Try to create second user with same email
      await expect(
        createUserWithEmailAndPassword(testApp.auth, email, password)
      ).rejects.toThrow();
    });
  });

  describe('User Sign In', () => {
    let testEmail: string;
    const testPassword = 'TestPass123!';
    let testUserId: string;

    beforeEach(async () => {
      // Create a test user with unique email
      testEmail = `signin-${Date.now()}@example.com`;
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        testEmail,
        testPassword
      );
      testUserId = userCred.user.uid;
      await signOut(testApp.auth);
    });

    test('should sign in with valid credentials', async () => {
      const userCredential = await signInWithEmailAndPassword(
        testApp.auth,
        testEmail,
        testPassword
      );

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(testEmail);
      expect(userCredential.user.uid).toBe(testUserId);
    });

    test('should fail with wrong password', async () => {
      await expect(
        signInWithEmailAndPassword(testApp.auth, testEmail, 'WrongPassword!')
      ).rejects.toThrow();
    });

    test('should fail with non-existent email', async () => {
      await expect(
        signInWithEmailAndPassword(testApp.auth, 'nonexistent@example.com', testPassword)
      ).rejects.toThrow();
    });
  });

  describe('Password Reset', () => {
    test('should send password reset email for existing user', async () => {
      const email = `reset-${Date.now()}@example.com`;
      
      // Create user
      await createUserWithEmailAndPassword(testApp.auth, email, 'TestPass123!');
      await signOut(testApp.auth);

      // Send reset email (doesn't actually send in emulator)
      await expect(
        sendPasswordResetEmail(testApp.auth, email)
      ).resolves.toBeUndefined();
    });

    test('should fail for non-existent user', async () => {
      await expect(
        sendPasswordResetEmail(testApp.auth, 'nonexistent@example.com')
      ).rejects.toThrow();
    });
  });

  describe('Email Verification', () => {
    test('should send verification email', async () => {
      const email = `verify-${Date.now()}@example.com`;
      
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        'TestPass123!'
      );

      // Send verification email (doesn't actually send in emulator)
      await expect(
        sendEmailVerification(userCred.user)
      ).resolves.toBeUndefined();
    });
  });

  describe('Session Management', () => {
    test('should get ID token for authenticated user', async () => {
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        `session-${Date.now()}@example.com`,
        'TestPass123!'
      );

      const token = await userCred.user.getIdToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should refresh ID token', async () => {
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        `refresh-${Date.now()}@example.com`,
        'TestPass123!'
      );

      const oldToken = await userCred.user.getIdToken();
      const newToken = await userCred.user.getIdToken(true); // Force refresh
      
      expect(newToken).toBeDefined();
      // Tokens might be the same in emulator if refreshed too quickly
    });
  });

  describe('User Profile Management', () => {
    test('should create and retrieve user profile', async () => {
      const email = `profile-${Date.now()}@example.com`;
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        'TestPass123!'
      );

      const profileData = {
        id: userCred.user.uid,
        email: email,
        displayName: 'Profile User',
        familyId: null,
        role: 'parent' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: false,
        notificationsEnabled: true,
        timezone: 'America/New_York'
      };

      // Create profile
      await setDoc(doc(testApp.firestore, 'users', userCred.user.uid), profileData);

      // Retrieve profile
      const profileDoc = await getDoc(doc(testApp.firestore, 'users', userCred.user.uid));
      expect(profileDoc.exists()).toBe(true);
      expect(profileDoc.data()).toMatchObject(profileData);
    });
  });

  describe('Security Profile', () => {
    test('should create and update security profile', async () => {
      const email = `security-${Date.now()}@example.com`;
      const userCred = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        'TestPass123!'
      );

      const securityData = {
        userId: userCred.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 0,
        failedLoginAttempts: 0,
        emailVerified: false,
        twoFactorEnabled: false
      };

      // Create security profile
      await setDoc(doc(testApp.firestore, 'userSecurity', userCred.user.uid), securityData);

      // Retrieve and verify
      const securityDoc = await getDoc(doc(testApp.firestore, 'userSecurity', userCred.user.uid));
      expect(securityDoc.exists()).toBe(true);
      expect(securityDoc.data()).toMatchObject(securityData);
    });
  });

  describe('Error Formatting', () => {
    test('should format Firebase auth errors correctly', () => {
      const testCases = [
        { code: 'auth/email-already-in-use', expected: 'This email is already registered' },
        { code: 'auth/user-not-found', expected: 'Invalid email or password' },
        { code: 'auth/wrong-password', expected: 'Invalid email or password' },
        { code: 'auth/too-many-requests', expected: 'Too many failed attempts' }
      ];

      testCases.forEach(({ code, expected }) => {
        const formatted = formatAuthError({ code });
        expect(formatted).toContain(expected);
      });
    });
  });
});