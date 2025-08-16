import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all cloud functions
export { approveTaskAndAwardPoints, redeemReward } from './tasks';
export { generateThumbnail } from './storage';