/**
 * Auth Service Unit Tests
 * 
 * Tests all authentication operations including:
 * - Input validation (email, password, display name)
 * - Password strength requirements
 * - Rate limiting and account lockout
 * - Email verification
 * - Session management
 * - Security features
 */

import {
  validatePassword,
  validateEmail,
  validateDisplayName,
  signUp,
  signIn,
  resetPassword,
  formatAuthError,
  getSessionInfo,
  refreshSession,
  resendVerificationEmail,
  getUserSecurityInfo,
  logOut
} from '../../services/auth';
import { auth, db } from '../../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../services/firebase');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Mock userProfile service
jest.mock('../../services/userProfile', () => ({
  createUserProfile: jest.fn().mockResolvedValue(undefined),
  getUserProfile: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@example.com' }),
  userProfileExists: jest.fn().mockResolvedValue(true)
}));

// Mock realtimeSync service
jest.mock('../../services/realtimeSync', () => {
  return {
    __esModule: true,
    default: {
      cleanup: jest.fn()
    }
  };
});

describe('Auth Service - Unit Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: false,
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString()
    })
  } as unknown as User;

  beforeEach(() => {
    jest.clearAllMocks();
    (auth.currentUser as any) = mockUser;
    
    // Mock runTransaction to execute the callback
    (runTransaction as jest.Mock).mockImplementation((db, callback) => {
      const transaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => false,
          data: () => ({})
        }),
        set: jest.fn(),
        update: jest.fn()
      };
      return callback(transaction);
    });
  });

  describe('validateEmail', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user123@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        '   ',
        'notanemail',
        'user@',
        '@example.com',
        'user @example.com',
        'user@example',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should detect common typos', () => {
      const typoEmails = [
        { email: 'user@gmial.com', suggestion: 'gmail.com' },
        { email: 'user@yahooo.com', suggestion: 'yahoo.com' },
        { email: 'user@hotmial.com', suggestion: 'hotmail.com' }
      ];

      typoEmails.forEach(({ email, suggestion }) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(suggestion);
      });
    });

    test('should reject excessively long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should handle null and undefined', () => {
      expect(validateEmail(null as any).isValid).toBe(false);
      expect(validateEmail(undefined as any).isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should accept valid password with all requirements', () => {
      const result = validatePassword('TestPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Test1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase letter', () => {
      const result = validatePassword('testpass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase letter', () => {
      const result = validatePassword('TESTPASS123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without number', () => {
      const result = validatePassword('TestPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should reject password without special character', () => {
      const result = validatePassword('TestPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('should reject common weak passwords', () => {
      const weakPasswords = ['Password123!', 'Qwerty123!', 'Abc123456!'];
      
      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a stronger password');
      });
    });

    test('should reject excessively long passwords', () => {
      const longPassword = 'A' + 'a'.repeat(127) + '1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too long');
    });

    test('should return all applicable errors for invalid password', () => {
      const result = validatePassword('test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // Missing length, uppercase, number, special char
    });

    test('should handle null and undefined', () => {
      expect(validatePassword(null as any).isValid).toBe(false);
      expect(validatePassword(undefined as any).isValid).toBe(false);
    });
  });

  describe('validateDisplayName', () => {
    test('should accept valid display names', () => {
      const validNames = [
        'John Doe',
        'Mary-Jane',
        "O'Connor",
        'User123',
        'Test User'
      ];

      validNames.forEach(name => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid display names', () => {
      expect(validateDisplayName('').isValid).toBe(false);
      expect(validateDisplayName('A').isValid).toBe(false);
      expect(validateDisplayName('a'.repeat(51)).isValid).toBe(false);
      expect(validateDisplayName('User@123').isValid).toBe(false);
      expect(validateDisplayName('User<script>').isValid).toBe(false);
    });
  });

  describe('signUp', () => {
    beforeEach(() => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
    });

    test('should create user with valid inputs', async () => {
      const signUpData = {
        email: 'newuser@example.com',
        password: 'ValidPass123!',
        displayName: 'New User'
      };

      const result = await signUp(signUpData);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'newuser@example.com',
        'ValidPass123!'
      );
      expect(updateProfile).toHaveBeenCalled();
      expect(sendEmailVerification).toHaveBeenCalled();
      expect(result.user).toBe(mockUser);
    });

    test('should reject invalid email', async () => {
      const signUpData = {
        email: 'invalid-email',
        password: 'ValidPass123!',
        displayName: 'New User'
      };

      await expect(signUp(signUpData)).rejects.toThrow('Please enter a valid email address');
    });

    test('should reject weak password', async () => {
      const signUpData = {
        email: 'newuser@example.com',
        password: 'weak',
        displayName: 'New User'
      };

      await expect(signUp(signUpData)).rejects.toThrow('Password must be at least 8 characters long');
    });

    test('should reject invalid display name', async () => {
      const signUpData = {
        email: 'newuser@example.com',
        password: 'ValidPass123!',
        displayName: 'A'
      };

      await expect(signUp(signUpData)).rejects.toThrow('Display name must be at least 2 characters');
    });

    test('should normalize email to lowercase', async () => {
      const signUpData = {
        email: 'NewUser@Example.COM',
        password: 'ValidPass123!',
        displayName: 'New User'
      };

      await signUp(signUpData);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'newuser@example.com',
        'ValidPass123!'
      );
    });

    test('should create security profile', async () => {
      const signUpData = {
        email: 'newuser@example.com',
        password: 'ValidPass123!',
        displayName: 'New User'
      };

      await signUp(signUpData);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          emailVerified: false,
          loginCount: 0,
          twoFactorEnabled: false
        })
      );
    });
  });

  describe('signIn', () => {
    beforeEach(() => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
    });

    test('should sign in with valid credentials', async () => {
      const signInData = {
        email: 'user@example.com',
        password: 'ValidPass123!'
      };

      const result = await signIn(signInData);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'user@example.com',
        'ValidPass123!'
      );
      expect(result.user).toBe(mockUser);
    });

    test('should reject invalid email', async () => {
      const signInData = {
        email: 'invalid-email',
        password: 'ValidPass123!'
      };

      await expect(signIn(signInData)).rejects.toThrow('Please enter a valid email address');
    });

    test('should update security profile on successful login', async () => {
      // Mock transaction to return existing security profile
      (runTransaction as jest.Mock).mockImplementation((db, callback) => {
        const transaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loginCount: 5 })
          }),
          update: jest.fn()
        };
        return callback(transaction);
      });

      const signInData = {
        email: 'user@example.com',
        password: 'ValidPass123!'
      };

      await signIn(signInData);

      expect(runTransaction).toHaveBeenCalled();
    });

    test('should add delay on failure to prevent timing attacks', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const startTime = Date.now();
      
      await expect(signIn({
        email: 'user@example.com',
        password: 'wrong'
      })).rejects.toThrow();

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should have added at least 500ms delay
      expect(elapsed).toBeGreaterThanOrEqual(500);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
    });

    test('should send reset email for valid email', async () => {
      await resetPassword('user@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth,
        'user@example.com'
      );
    });

    test('should reject invalid email', async () => {
      await expect(resetPassword('invalid-email')).rejects.toThrow('Please enter a valid email address');
    });

    test('should not reveal if user exists', async () => {
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue({
        code: 'auth/user-not-found'
      });

      // Should not throw error for non-existent user
      await expect(resetPassword('nonexistent@example.com')).resolves.toBeUndefined();
    });

    test('should add delay to prevent user enumeration', async () => {
      const startTime = Date.now();
      
      await resetPassword('user@example.com');

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should have added at least 500ms delay
      expect(elapsed).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limit on sign up', async () => {
      // Mock rate limit exceeded
      (runTransaction as jest.Mock).mockRejectedValue(
        new Error('Too many attempts. Account locked for 30 minutes.')
      );

      await expect(signUp({
        email: 'user@example.com',
        password: 'ValidPass123!',
        displayName: 'Test User'
      })).rejects.toThrow('Too many attempts');
    });

    test('should check rate limit on sign in', async () => {
      // Mock rate limit exceeded
      (runTransaction as jest.Mock).mockRejectedValue(
        new Error('Account temporarily locked. Please try again in 15 minutes.')
      );

      await expect(signIn({
        email: 'user@example.com',
        password: 'password'
      })).rejects.toThrow('temporarily locked');
    });

    test('should check rate limit on password reset', async () => {
      // Mock rate limit exceeded
      (runTransaction as jest.Mock).mockRejectedValue(
        new Error('Too many attempts. Account locked for 30 minutes.')
      );

      await expect(resetPassword('user@example.com')).rejects.toThrow('Too many attempts');
    });
  });

  describe('Session Management', () => {
    test('should get session info for authenticated user', async () => {
      const sessionInfo = await getSessionInfo();

      expect(sessionInfo.isActive).toBe(true);
      expect(sessionInfo.lastActivity).toBeInstanceOf(Date);
      expect(sessionInfo.expiresAt).toBeInstanceOf(Date);
    });

    test('should return inactive session for unauthenticated user', async () => {
      (auth.currentUser as any) = null;

      const sessionInfo = await getSessionInfo();

      expect(sessionInfo.isActive).toBe(false);
      expect(sessionInfo.lastActivity).toBeUndefined();
      expect(sessionInfo.expiresAt).toBeUndefined();
    });

    test('should refresh session token', async () => {
      await refreshSession();

      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });

    test('should throw error when refreshing without user', async () => {
      (auth.currentUser as any) = null;

      await expect(refreshSession()).rejects.toThrow('No user is currently signed in');
    });
  });

  describe('Email Verification', () => {
    test('should resend verification email', async () => {
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      await resendVerificationEmail();

      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    test('should check rate limit for resend verification', async () => {
      (runTransaction as jest.Mock).mockRejectedValue(
        new Error('Too many attempts. Account locked for 30 minutes.')
      );

      await expect(resendVerificationEmail()).rejects.toThrow('Too many attempts');
    });

    test('should throw error when no user signed in', async () => {
      (auth.currentUser as any) = null;

      await expect(resendVerificationEmail()).rejects.toThrow('No user is currently signed in');
    });
  });

  describe('Security Info', () => {
    test('should get user security info', async () => {
      const mockSecurityData = {
        createdAt: new Date(),
        lastLogin: new Date(),
        loginCount: 10,
        emailVerified: true
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockSecurityData
      });

      const securityInfo = await getUserSecurityInfo('test-user-123');

      expect(securityInfo).toEqual(mockSecurityData);
    });

    test('should return null for non-existent security profile', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const securityInfo = await getUserSecurityInfo('test-user-123');

      expect(securityInfo).toBeNull();
    });
  });

  describe('logOut', () => {
    test('should sign out user and update last logout time', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await logOut();

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lastLogout: serverTimestamp()
        })
      );
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    test('should handle logout without crashing when update fails', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      // Should not throw
      await expect(logOut()).resolves.toBeUndefined();
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('formatAuthError', () => {
    test('should format Firebase auth errors', () => {
      const errors = [
        { code: 'auth/email-already-in-use', expected: 'This email is already registered' },
        { code: 'auth/user-not-found', expected: 'Invalid email or password' },
        { code: 'auth/wrong-password', expected: 'Invalid email or password' },
        { code: 'auth/too-many-requests', expected: 'Too many failed attempts' },
        { code: 'auth/network-request-failed', expected: 'Network error' }
      ];

      errors.forEach(({ code, expected }) => {
        const formatted = formatAuthError({ code });
        expect(formatted).toContain(expected);
      });
    });

    test('should preserve custom rate limit errors', () => {
      const error = { message: 'Account temporarily locked. Please try again in 15 minutes.' };
      const formatted = formatAuthError(error);
      expect(formatted).toBe(error.message);
    });

    test('should handle unknown errors', () => {
      const error = { code: 'unknown-error', message: 'Something went wrong' };
      const formatted = formatAuthError(error);
      expect(formatted).toBe('Something went wrong');
    });
  });
});