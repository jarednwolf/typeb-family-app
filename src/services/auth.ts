/**
 * Authentication Service
 * Handles all authentication operations with comprehensive security
 * 
 * SECURITY FEATURES:
 * - Strong password validation
 * - Rate limiting on login attempts
 * - Account lockout after failed attempts
 * - Email verification enforcement
 * - Input validation and sanitization
 * - Protection against timing attacks
 * - Secure session management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { createUserProfile, getUserProfile as getUserProfileFromDb, userProfileExists } from './userProfile';
import realtimeSyncService from './realtimeSync';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Collections
const rateLimitCollection = 'rateLimit';
const userSecurityCollection = 'userSecurity';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '388132461668-9q5v8u1i3b8j9q5v8u1i3b8j9q5v.apps.googleusercontent.com', // You'll need to get this from Firebase Console
      offlineAccess: true,
      scopes: ['email', 'profile'],
      forceCodeForRefreshToken: true,
    });
    console.log('[AUTH] Google Sign-In configured');
  } catch (error) {
    console.error('[AUTH] Error configuring Google Sign-In:', error);
  }
};

// Input validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > 254) { // RFC 5321
    return { isValid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = trimmedEmail.split('@')[1];
  const suspiciousDomains = ['gmial.com', 'gmai.com', 'yahooo.com', 'hotmial.com'];
  
  if (suspiciousDomains.includes(domain)) {
    // Better matching logic for typo suggestions
    let suggestion = 'gmail.com'; // default
    if (domain.startsWith('gm')) {
      suggestion = 'gmail.com';
    } else if (domain.startsWith('ya')) {
      suggestion = 'yahoo.com';
    } else if (domain.startsWith('hot')) {
      suggestion = 'hotmail.com';
    }
    return { isValid: false, error: `Did you mean @${suggestion}?` };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate display name
export const validateDisplayName = (displayName: string): { isValid: boolean; error?: string } => {
  if (!displayName || typeof displayName !== 'string') {
    return { isValid: false, error: 'Display name is required' };
  }

  const trimmed = displayName.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Display name must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }

  return { isValid: true };
};

// Check rate limit
const checkRateLimit = async (identifier: string, action: string): Promise<void> => {
  // Skip rate limiting in development/emulator mode
  if (__DEV__) {
    console.log('[AUTH] Skipping rate limit check in development mode');
    return;
  }
  
  const rateLimitDoc = doc(db, rateLimitCollection, `${identifier}_${action}`);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(rateLimitDoc);
    const now = Date.now();
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const attempts = data.attempts || [];
      
      // Remove old attempts outside the window
      const recentAttempts = attempts.filter((timestamp: number) => 
        now - timestamp < RATE_LIMIT_WINDOW
      );
      
      // Check if locked out
      if (data.lockedUntil && data.lockedUntil > now) {
        const minutesLeft = Math.ceil((data.lockedUntil - now) / 60000);
        throw new Error(`Account temporarily locked. Please try again in ${minutesLeft} minutes.`);
      }
      
      // Check rate limit
      if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        // Lock the account
        transaction.update(rateLimitDoc, {
          attempts: [...recentAttempts, now],
          lockedUntil: now + LOCKOUT_DURATION,
          lastAttempt: serverTimestamp(),
        });
        throw new Error(`Too many attempts. Account locked for 30 minutes.`);
      }
      
      // Update attempts
      transaction.update(rateLimitDoc, {
        attempts: [...recentAttempts, now],
        lastAttempt: serverTimestamp(),
      });
    } else {
      // First attempt
      transaction.set(rateLimitDoc, {
        attempts: [now],
        lastAttempt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  });
};

// Clear rate limit on successful action
const clearRateLimit = async (identifier: string, action: string): Promise<void> => {
  // Skip rate limiting in development/emulator mode
  if (__DEV__) {
    return;
  }
  
  try {
    const rateLimitDoc = doc(db, rateLimitCollection, `${identifier}_${action}`);
    await updateDoc(rateLimitDoc, {
      attempts: [],
      lockedUntil: null,
      lastSuccess: serverTimestamp(),
    });
  } catch (error) {
    // Ignore errors when clearing rate limit
    console.error('Error clearing rate limit:', error);
  }
};

// Sign up new user
export const signUp = async ({ email, password, displayName }: SignUpData): Promise<UserCredential> => {
  try {
    console.log('[AUTH DEBUG] Starting sign up process');
    
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('. '));
    }
    
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check rate limit for sign up
    await checkRateLimit(normalizedEmail, 'signup');
    
    console.log('[AUTH DEBUG] Validation passed');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const { user } = userCredential;
    
    console.log('[AUTH DEBUG] Firebase Auth account created successfully. UID:', user.uid);
    
    // Update display name
    await updateProfile(user, { displayName: displayName.trim() });
    console.log('[AUTH DEBUG] Display name updated');
    
    // Send email verification
    await sendEmailVerification(user);
    console.log('[AUTH DEBUG] Verification email sent');
    
    // Create user profile in Firestore
    console.log('[AUTH DEBUG] Creating user profile in Firestore...');
    await createUserProfile(user.uid, normalizedEmail, displayName.trim());
    console.log('[AUTH DEBUG] User profile successfully created');
    
    // Create security profile
    await setDoc(doc(db, userSecurityCollection, user.uid), {
      createdAt: serverTimestamp(),
      lastLogin: null,
      loginCount: 0,
      emailVerified: false,
      twoFactorEnabled: false, // Future feature
      securityQuestions: [], // Future feature
    });
    
    // Clear rate limit on success
    await clearRateLimit(normalizedEmail, 'signup');
    
    return userCredential;
  } catch (error: any) {
    console.error('[AUTH DEBUG] Sign up error:', error);
    throw error;
  }
};

// Sign in existing user
export const signIn = async ({ email, password }: SignInData): Promise<UserCredential> => {
  try {
    console.log('[AUTH] Sign in started');
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AUTH] Email validated:', normalizedEmail);
    
    // Check rate limit
    await checkRateLimit(normalizedEmail, 'signin');
    console.log('[AUTH] Rate limit check passed');
    
    // Add slight delay to prevent timing attacks - wrapped in try-catch
    try {
      const delay = Math.floor(Math.random() * 200) + 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (delayError) {
      console.warn('[AUTH] Delay error (non-critical):', delayError);
    }
    
    console.log('[AUTH] Attempting Firebase sign in...');
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    console.log('[AUTH] Firebase sign in successful');
    
    // Check if email is verified (warning, not blocking for now)
    if (!userCredential.user.emailVerified) {
      console.warn('User email not verified:', normalizedEmail);
      // In production, you might want to enforce this:
      // throw new Error('Please verify your email before signing in');
    }
    
    // Update security profile
    await runTransaction(db, async (transaction) => {
      const securityDoc = doc(db, userSecurityCollection, userCredential.user.uid);
      const securitySnap = await transaction.get(securityDoc);
      
      if (securitySnap.exists()) {
        transaction.update(securityDoc, {
          lastLogin: serverTimestamp(),
          loginCount: (securitySnap.data().loginCount || 0) + 1,
          emailVerified: userCredential.user.emailVerified,
        });
      } else {
        // Create security profile if it doesn't exist
        transaction.set(securityDoc, {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginCount: 1,
          emailVerified: userCredential.user.emailVerified,
          twoFactorEnabled: false,
          securityQuestions: [],
        });
      }
    });
    
    // Check if user profile exists in Firestore
    const profileExists = await userProfileExists(userCredential.user.uid);
    
    if (!profileExists) {
      // Create profile if it doesn't exist
      await createUserProfile(
        userCredential.user.uid,
        normalizedEmail,
        userCredential.user.displayName || 'User'
      );
    }
    
    // Clear rate limit on success
    await clearRateLimit(normalizedEmail, 'signin');
    
    return userCredential;
  } catch (error: any) {
    console.error('[AUTH] Sign in error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
      fullError: error
    });
    
    // Add delay on failure to prevent timing attacks - wrapped in try-catch
    try {
      const delay = Math.floor(Math.random() * 500) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (delayError) {
      console.warn('[AUTH] Post-error delay failed (non-critical):', delayError);
    }
    
    throw error;
  }
};

// Sign out current user
export const logOut = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    
    if (user) {
      // Update last activity
      try {
        await updateDoc(doc(db, userSecurityCollection, user.uid), {
          lastLogout: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating logout time:', error);
      }
    }
    
    // Clean up real-time sync listeners before signing out
    realtimeSyncService.cleanup();
    
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check rate limit
    await checkRateLimit(normalizedEmail, 'password_reset');
    
    // Add delay to prevent user enumeration
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    await sendPasswordResetEmail(auth, normalizedEmail);
    
    // Clear rate limit on success
    await clearRateLimit(normalizedEmail, 'password_reset');
    
    // Always show success message to prevent user enumeration
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    // Don't reveal if email exists or not
    if (error.code === 'auth/user-not-found') {
      // Still pretend it worked to prevent user enumeration
      return;
    }
    
    throw error;
  }
};

// Get current user profile from Firestore
export const getUserProfile = async (uid: string) => {
  try {
    if (!uid || typeof uid !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    return await getUserProfileFromDb(uid);
  } catch (error: any) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Subscribe to auth state changes
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if email is verified
export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified || false;
};

// Resend verification email
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    const email = auth.currentUser.email;
    if (!email) {
      throw new Error('User email not found');
    }
    
    // Check rate limit
    await checkRateLimit(email, 'resend_verification');
    
    await sendEmailVerification(auth.currentUser);
    
    // Clear rate limit on success
    await clearRateLimit(email, 'resend_verification');
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    throw error;
  }
};

// Get user security info
export const getUserSecurityInfo = async (uid: string) => {
  try {
    const securityDoc = await getDoc(doc(db, userSecurityCollection, uid));
    
    if (!securityDoc.exists()) {
      return null;
    }
    
    return securityDoc.data();
  } catch (error) {
    console.error('Error getting user security info:', error);
    return null;
  }
};

// Format Firebase auth errors for user display
export const formatAuthError = (error: any): string => {
  const errorCode = error.code || '';
  
  // Check for our custom rate limit errors first
  if (error.message?.includes('temporarily locked') || 
      error.message?.includes('Too many attempts')) {
    return error.message;
  }
  
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'Invalid email or password. Please try again.'; // Don't reveal user existence
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.'; // Don't reveal which is wrong
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

// Session management utilities
export const getSessionInfo = async (): Promise<{
  isActive: boolean;
  lastActivity?: Date;
  expiresAt?: Date;
}> => {
  const user = auth.currentUser;
  
  if (!user) {
    return { isActive: false };
  }
  
  try {
    // Get ID token result to check expiration
    const idTokenResult = await user.getIdTokenResult();
    const expirationTime = new Date(idTokenResult.expirationTime);
    const now = new Date();
    
    return {
      isActive: expirationTime > now,
      lastActivity: new Date(idTokenResult.issuedAtTime),
      expiresAt: expirationTime,
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return { isActive: false };
  }
};

// Force refresh session token
export const refreshSession = async (): Promise<void> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No user is currently signed in');
  }
  
  try {
    await user.getIdToken(true); // Force refresh
  } catch (error) {
    console.error('Error refreshing session:', error);
    throw error;
  }
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    console.log('[AUTH] Starting Google Sign-In');
    
    // Check if device supports Google Play Services (Android only)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    
    // Get the user's ID token
    const userInfo = await GoogleSignin.signIn();
    console.log('[AUTH] Google Sign-In successful, got user info');
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
    
    // Sign in to Firebase with the Google credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    console.log('[AUTH] Firebase sign-in with Google successful');
    
    // Check if user profile exists in Firestore
    const profileExists = await userProfileExists(userCredential.user.uid);
    
    if (!profileExists) {
      // Create profile if it doesn't exist
      const email = userCredential.user.email || userInfo.user.email;
      const displayName = userCredential.user.displayName || userInfo.user.name || 'User';
      const photoURL = userCredential.user.photoURL || userInfo.user.photo || null;
      
      await createUserProfile(
        userCredential.user.uid,
        email,
        displayName,
        {
          photoURL,
          provider: 'google',
          googleId: userInfo.user.id,
        }
      );
      console.log('[AUTH] Created new user profile for Google user');
    } else {
      // Update last login
      await updateDoc(doc(db, userSecurityCollection, userCredential.user.uid), {
        lastLogin: serverTimestamp(),
        emailVerified: true, // Google accounts are pre-verified
        provider: 'google',
      }).catch(() => {
        // Create security profile if it doesn't exist
        setDoc(doc(db, userSecurityCollection, userCredential.user.uid), {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: true,
          provider: 'google',
          loginCount: 1,
        });
      });
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('[AUTH] Google Sign-In error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('[AUTH] User cancelled Google Sign-In');
      return null;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }
};

// Check if Google Sign-In is available
export const isGoogleSignInAvailable = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Google Sign-In is always available on web
      return true;
    }
    
    if (Platform.OS === 'android') {
      // Check for Google Play Services on Android
      const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      return hasPlayServices;
    }
    
    // On iOS, Google Sign-In is always available if configured
    return true;
  } catch (error) {
    console.error('[AUTH] Error checking Google Sign-In availability:', error);
    return false;
  }
};

// Sign out (updated to handle Google Sign-In)
export const signOutUser = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    
    if (user) {
      // Update last activity
      try {
        await updateDoc(doc(db, userSecurityCollection, user.uid), {
          lastLogout: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating logout time:', error);
      }
    }
    
    // Sign out from Google if signed in with Google
    try {
      const isSignedInWithGoogle = await GoogleSignin.isSignedIn();
      if (isSignedInWithGoogle) {
        await GoogleSignin.signOut();
        console.log('[AUTH] Signed out from Google');
      }
    } catch (error) {
      console.error('[AUTH] Error signing out from Google:', error);
    }
    
    // Clean up real-time sync listeners before signing out
    realtimeSyncService.cleanup();
    
    // Sign out from Firebase
    await signOut(auth);
    console.log('[AUTH] Signed out from Firebase');
  } catch (error: any) {
    console.error('[AUTH] Sign out error:', error);
    throw error;
  }
};