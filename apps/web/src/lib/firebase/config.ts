import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const isBrowser = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCOOvQfcyQ52eEPSC3esgl8bex0A9RUXu0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tybeb-staging.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tybeb-staging',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tybeb-staging.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '388132461668',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:388132461668:web:28a15aca13c36aaa475371',
};

// Avoid initializing Firebase during Next.js server-side prerender
let app: any = null;
if (isBrowser) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

// Export service singletons when in the browser; provide no-op stubs on server
export const auth = isBrowser ? getAuth(app) : ({} as any);
export const db = isBrowser ? getFirestore(app) : ({} as any);
export const storage = isBrowser ? getStorage(app) : ({} as any);

export default app as any;