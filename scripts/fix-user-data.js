/**
 * Script to fix user data inconsistency
 * Converts familyIds array to familyId string
 */

const admin = require('firebase-admin');

// Initialize admin SDK
// You'll need to download your service account key from Firebase Console
// and place it in the project root as 'serviceAccountKey.json'
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixUserData() {
  console.log('Starting user data fix...');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      try {
        let updates = {};
        let needsUpdate = false;
        
        // Check if user has familyIds (array) instead of familyId (string)
        if (userData.familyIds && Array.isArray(userData.familyIds)) {
          console.log(`User ${userId} has familyIds array:`, userData.familyIds);
          
          if (userData.familyIds.length > 0) {
            // Take the first familyId from the array
            updates.familyId = userData.familyIds[0];
            console.log(`  -> Converting to familyId: ${updates.familyId}`);
          }
          
          // Remove the familyIds field
          updates.familyIds = admin.firestore.FieldValue.delete();
          needsUpdate = true;
        }
        
        // Check if familyId exists but family doesn't
        if (userData.familyId) {
          const familyDoc = await db.collection('families').doc(userData.familyId).get();
          if (!familyDoc.exists) {
            console.log(`User ${userId} has invalid familyId: ${userData.familyId}`);
            updates.familyId = admin.firestore.FieldValue.delete();
            updates.role = admin.firestore.FieldValue.delete();
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await db.collection('users').doc(userId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✓ Fixed user ${userId}`);
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`✗ Error fixing user ${userId}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total users: ${usersSnapshot.size}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Terminate the app
    await admin.app().delete();
  }
}

// Run the fix
fixUserData();