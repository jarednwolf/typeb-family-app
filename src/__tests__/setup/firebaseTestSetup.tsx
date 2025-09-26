/**
 * Firebase test setup for integration tests
 * Provides proper emulator configuration
 */

import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

// Test configuration
export const TEST_CONFIG = {
  projectId: 'typeb-family-test',
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  storageBucket: 'test-bucket',
  
  // Emulator settings
  authEmulatorUrl: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'http://localhost:9099',
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || 'localhost',
  firestoreEmulatorPort: parseInt(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8080'),
  storageEmulatorHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[0] || 'localhost',
  storageEmulatorPort: parseInt(process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[1] || '9199'),
};

// Track emulator connections to avoid duplicate connections
let emulatorsConnected = false;

export interface FirebaseTestInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

/**
 * Initialize Firebase app for testing with emulator support
 */
export function initializeTestApp(appName?: string): FirebaseTestInstances {
  // Clean up existing apps
  const existingApps = getApps();
  existingApps.forEach(app => {
    if (app.name === appName || (!appName && app.name === '[DEFAULT]')) {
      deleteApp(app);
    }
  });

  // Initialize new app
  const app = initializeApp(TEST_CONFIG, appName);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Connect to emulators if not already connected
  if (!emulatorsConnected && process.env.USE_FIREBASE_EMULATOR !== 'false') {
    try {
      // Connect Auth emulator
      connectAuthEmulator(auth, TEST_CONFIG.authEmulatorUrl, { disableWarnings: true });
      
      // Connect Firestore emulator
      connectFirestoreEmulator(db, TEST_CONFIG.firestoreEmulatorHost, TEST_CONFIG.firestoreEmulatorPort);
      
      // Connect Storage emulator
      connectStorageEmulator(storage, TEST_CONFIG.storageEmulatorHost, TEST_CONFIG.storageEmulatorPort);
      
      emulatorsConnected = true;
    } catch (error) {
      // Emulators might not be running for unit tests
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }

  return { app, auth, db, storage };
}

/**
 * Clean up test app
 */
export async function cleanupTestApp(app: FirebaseApp): Promise<void> {
  try {
    await deleteApp(app);
  } catch (error) {
    console.error('Error cleaning up test app:', error);
  }
}

/**
 * Wait for emulators to be ready
 */
export async function waitForEmulators(maxAttempts = 60, delayMs = 500): Promise<void> {
  if (process.env.USE_FIREBASE_EMULATOR === 'false') {
    return;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const http = await import('http');
      await new Promise((resolve, reject) => {
        const req = http.request({ method: 'GET', host: TEST_CONFIG.firestoreEmulatorHost, port: TEST_CONFIG.firestoreEmulatorPort, path: '/' }, (res) => {
          // Any response means emulator is up
          resolve(null);
        });
        req.on('error', reject);
        req.end();
      });
      console.log('Firebase emulators are ready');
      return;
    } catch (error) {
      // Emulator not ready yet
    }
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  // Do not fail the entire suite; proceed and let tests report more specific errors
  console.warn('Proceeding without explicit emulator readiness confirmation');
}

/**
 * Clear all data in Firestore emulator
 */
export async function clearFirestoreData(projectId: string = TEST_CONFIG.projectId): Promise<void> {
  if (process.env.USE_FIREBASE_EMULATOR === 'false') {
    return;
  }

  try {
    const http = await import('http');
    await new Promise((resolve, reject) => {
      const req = http.request({
        method: 'DELETE',
        host: TEST_CONFIG.firestoreEmulatorHost,
        port: TEST_CONFIG.firestoreEmulatorPort,
        path: `/emulator/v1/projects/${projectId}/databases/(default)/documents`,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(null);
        } else {
          reject(new Error('Failed to clear Firestore'));
        }
      });
      req.on('error', reject);
      req.end();
    });
  } catch (error) {
    console.error('Error clearing Firestore data:', error);
  }
}

/**
 * Clear all users in Auth emulator
 */
export async function clearAuthData(projectId: string = TEST_CONFIG.projectId): Promise<void> {
  if (process.env.USE_FIREBASE_EMULATOR === 'false') {
    return;
  }

  try {
    const url = new URL(TEST_CONFIG.authEmulatorUrl);
    const http = await import('http');
    await new Promise((resolve, reject) => {
      const req = http.request({
        method: 'DELETE',
        host: url.hostname,
        port: Number(url.port),
        path: `/emulator/v1/projects/${projectId}/accounts`,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(null);
        } else {
          reject(new Error('Failed to clear Auth'));
        }
      });
      req.on('error', reject);
      req.end();
    });
  } catch (error) {
    console.error('Error clearing Auth data:', error);
  }
}

/**
 * Clear all emulator data
 */
export async function clearAllEmulatorData(projectId: string = TEST_CONFIG.projectId): Promise<void> {
  await Promise.all([
    clearFirestoreData(projectId),
    clearAuthData(projectId),
  ]);
}

// Export for backwards compatibility
export const connectEmulators = (auth: Auth, db: Firestore, storage?: FirebaseStorage) => {
  if (!emulatorsConnected && process.env.USE_FIREBASE_EMULATOR !== 'false') {
    try {
      connectAuthEmulator(auth, TEST_CONFIG.authEmulatorUrl, { disableWarnings: true });
      connectFirestoreEmulator(db, TEST_CONFIG.firestoreEmulatorHost, TEST_CONFIG.firestoreEmulatorPort);
      if (storage) {
        connectStorageEmulator(storage, TEST_CONFIG.storageEmulatorHost, TEST_CONFIG.storageEmulatorPort);
      }
      emulatorsConnected = true;
    } catch (error) {
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }
};

// Reset emulator connection flag for each test file
beforeAll(() => {
  emulatorsConnected = false;
});