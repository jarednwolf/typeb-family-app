import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if running in E2E test mode
// For E2E tests, we'll use a simple approach: check if we're in dev mode and if localhost:9099 is accessible
const isE2ETest = __DEV__ && (
  // Check if we're in development mode and potentially running E2E tests
  typeof global !== 'undefined' &&
  (global as any).__E2E_TEST__ === true
);

// Firebase configuration - Use emulators for dev when enabled, otherwise read from env
const firebaseConfig = __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true'
  ? {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: 'localhost',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }
  : {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

console.log('🔥 Firebase Mode:', __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true' ? 'Development/E2E (using emulators)' : 'Staging/Production');

// Initialize Firebase only if it hasn't been initialized
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
// Note: Firebase Auth will use AsyncStorage automatically in React Native
// The warning is informational - auth state will persist between sessions
const auth = getAuth(app);

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators if explicitly enabled
if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true' && typeof global !== 'undefined') {
  // Track if emulators are already connected
  const globalAny = global as any;
  if (!globalAny.__FIREBASE_EMULATORS_CONNECTED__) {
    try {
      // Connect to Auth emulator
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      
      // Connect to Storage emulator
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      
      // Connect to Functions emulator (if needed)
      // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      
      globalAny.__FIREBASE_EMULATORS_CONNECTED__ = true;
      console.log('🔧 Connected to Firebase emulators');
    } catch (error) {
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }
}

// Custom persistence handler for React Native
export const setPersistence = async () => {
  // This will be implemented when we set up proper auth persistence
  // For now, Firebase Auth will handle session persistence automatically
  return Promise.resolve();
};

// Export initialized services
export { app, auth, db, storage, functions };

// Export types for use in the app
export type { User } from 'firebase/auth';
export type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';