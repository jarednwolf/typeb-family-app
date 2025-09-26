import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

jest.setTimeout(30000);

// Ensure React Native dev flag so firebase.ts enables emulator mode
(global as any).__DEV__ = true;

// Ensure emulator mode for app services loaded in tests
process.env.EXPO_PUBLIC_USE_EMULATOR = 'true';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'typeb-family-test';
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'AIzaSyD-LOCAL-TEST_KEY';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'fake-app-id';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'typeb-family-test.appspot.com';

// Polyfill performance APIs used by undici in Node 24
const g: any = globalThis as any;
g.performance = g.performance || {};
g.performance.markResourceTiming = g.performance.markResourceTiming || (() => {});
g.performance.clearResourceTimings = g.performance.clearResourceTimings || (() => {});

// Inline mocks for native/Expo modules used in integration tests
jest.mock('expo-notifications', () => ({
  getDevicePushTokenAsync: async () => ({ data: 'token' }),
  scheduleNotificationAsync: async () => ({}),
  default: {
    getDevicePushTokenAsync: async () => ({ data: 'token' }),
    scheduleNotificationAsync: async () => ({}),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        Object.keys(store).forEach(k => delete store[k]);
      }),
    },
  };
});

// Initialize once with test project
if (!getApps().length) {
  initializeApp({
    projectId: 'typeb-family-test',
    apiKey: 'fake-api-key',
    appId: 'fake-app-id',
  });
}

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Respect emulator hosts if provided by firebase emulators:exec
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const firestoreHost = (process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080').split(':');
const storageHost = (process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199').split(':');

connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
connectFirestoreEmulator(db, firestoreHost[0], Number(firestoreHost[1]));
connectStorageEmulator(storage, storageHost[0], Number(storageHost[1]));


