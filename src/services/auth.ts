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
} from 'firebase/auth';
import { auth } from './firebase';
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

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sign up new user
export const signUp = async ({ email, password, displayName }: SignUpData): Promise<UserCredential> => {
  try {
    console.log('[AUTH DEBUG] Starting sign up process for:', email);
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('. '));
    }
    
    console.log('[AUTH DEBUG] Password validation passed');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    console.log('[AUTH DEBUG] Firebase Auth account created successfully. UID:', user.uid);
    
    // Update display name
    await updateProfile(user, { displayName });
    console.log('[AUTH DEBUG] Display name updated');
    
    // Send email verification
    await sendEmailVerification(user);
    console.log('[AUTH DEBUG] Verification email sent');
    
    // Create user profile in Firestore using the userProfile service
    console.log('[AUTH DEBUG] Creating user profile in Firestore...');
    await createUserProfile(user.uid, user.email!, displayName);
    console.log('[AUTH DEBUG] User profile successfully created');
    
    return userCredential;
  } catch (error: any) {
    console.error('[AUTH DEBUG] Sign up error details:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    throw error;
  }
};

// Sign in existing user
export const signIn = async ({ email, password }: SignInData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user profile exists in Firestore
    const profileExists = await userProfileExists(userCredential.user.uid);
    
    if (!profileExists) {
      // Create profile if it doesn't exist (for users created before this system)
      await createUserProfile(
        userCredential.user.uid,
        userCredential.user.email!,
        userCredential.user.displayName || 'User'
      );
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out current user
export const logOut = async (): Promise<void> => {
  try {
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
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Get current user profile from Firestore
export const getUserProfile = async (uid: string) => {
  try {
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
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('No user is currently signed in');
    }
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    throw error;
  }
};

// Format Firebase auth errors for user display
export const formatAuthError = (error: any): string => {
  const errorCode = error.code || '';
  
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
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
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