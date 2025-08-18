import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { AuthAdapter } from '@typeb/core';
import { User } from '@typeb/types';

class FirebaseAuthAdapter implements AuthAdapter {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data() as User;
      
      if (!userData) {
        throw new Error('User profile not found');
      }
      
      return userData;
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user profile in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email,
        displayName,
        role: 'child', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationsEnabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isPremium: false,
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      return newUser;
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async verifyIdToken(token: string): Promise<any> {
    // This is typically done server-side with Firebase Admin SDK
    // For client-side, we can verify the current user's token
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      const idToken = await currentUser.getIdToken();
      if (idToken !== token) {
        throw new Error('Invalid token');
      }
      return {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Token verification failed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data() as User;
          callback(userData);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
    
    return unsubscribe;
  }
}

export const authAdapter = new FirebaseAuthAdapter();