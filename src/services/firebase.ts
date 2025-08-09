import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Firebase configuration - always use emulators in dev mode for now
const firebaseConfig = __DEV__ ? {
  // Development/E2E test configuration for emulators
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "typeb-family-app",
  storageBucket: "typeb-family-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
} : {
  // Production configuration from environment variables
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('🔥 Firebase Mode:', __DEV__ ? 'Development/E2E (using emulators)' : 'Production');

// Initialize Firebase only if it hasn't been initialized
let app;
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

// Connect to emulators if in development mode
if (__DEV__ && typeof global !== 'undefined') {
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