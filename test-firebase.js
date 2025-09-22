// Quick Firebase connection test
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase connection successful!');
  console.log('Project:', firebaseConfig.projectId);
  console.log('Ready to use Firebase services');
} catch (error) {
  console.error('❌ Firebase connection failed:', error);
}
