// Firebase configuration for E2E testing with emulators
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Extend Window interface for emulator flag
declare global {
  interface Window {
    __FIREBASE_EMULATORS_CONNECTED__?: boolean;
  }
}

// Use the same config but connect to emulators
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "typeb-family-app",
  storageBucket: "typeb-family-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators if not already connected
if (typeof window !== 'undefined' && !(window as any).__FIREBASE_EMULATORS_CONNECTED__) {
  // Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);
  
  // Functions emulator
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  // Mark as connected to prevent reconnection attempts
  (window as any).__FIREBASE_EMULATORS_CONNECTED__ = true;
  
  console.log('🔧 Connected to Firebase emulators for E2E testing');
}

export { auth, db, storage, functions };
export default app;