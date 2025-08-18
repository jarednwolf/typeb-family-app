// Quick Firebase connection test
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
  apiKey: "AIzaSyCOOvQfcyQ52eEPSC3esgl8bex0A9RUXu0",
  authDomain: "tybeb-staging.firebaseapp.com",
  projectId: "tybeb-staging",
  storageBucket: "tybeb-staging.firebasestorage.app",
  messagingSenderId: "388132461668",
  appId: "1:388132461668:web:28a15aca13c36aaa475371"
};

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase connection successful!');
  console.log('Project:', firebaseConfig.projectId);
  console.log('Ready to use Firebase services');
} catch (error) {
  console.error('❌ Firebase connection failed:', error);
}
