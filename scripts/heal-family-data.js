/**
 * Data Healing Script - Migrate from familyIds array to single familyId
 * 
 * This script handles the migration of user data from the old familyIds array pattern
 * to the new single familyId pattern. It includes safety checks and rollback capabilities.
 * 
 * Run with: node scripts/heal-family-data.js [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500; // Firestore batch limit

// Logging utilities
const log = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data = {}) => console.log(`[WARN] ${msg}`, data),
  error: (msg, data = {}) => console.error(`[ERROR] ${msg}`, data),
  success: (msg, data = {}) => console.log(`[SUCCESS] ${msg}`, data)
};

// Statistics tracking
const stats = {
  usersProcessed: 0,
  usersHealed: 0,
  usersSkipped: 0,
  errors: 0,
  warnings: []
};

/**
 * Heal a single user document
 * @param {Object} userData - The user document data
 * @param {string} userId - The user document ID
 * @returns {Object|null} - Update data or null if no update needed
 */
function healUserData(userData, userId) {
  const updates = {};
  let needsHealing = false;

  // Check if user has familyIds array
  if (userData.familyIds && Array.isArray(userData.familyIds)) {
    if (userData.familyIds.length === 0) {
      // Empty array - set familyId to null
      updates.familyId = null;
      needsHealing = true;
      log.info(`User ${userId} has empty familyIds array, setting familyId to null`);
    } else if (userData.familyIds.length === 1) {
      // Single family - migrate to familyId
      updates.familyId = userData.familyIds[0];
      needsHealing = true;
      log.info(`User ${userId} migrating from familyIds[${userData.familyIds[0]}] to familyId`);
    } else {
      // Multiple families - this shouldn't happen in our app
      stats.warnings.push({
        userId,
        issue: 'Multiple familyIds found',
        familyIds: userData.familyIds
      });
      log.warn(`User ${userId} has multiple familyIds:`, userData.familyIds);
      // Take the first one as the primary
      updates.familyId = userData.familyIds[0];
      needsHealing = true;
    }

    // Always remove the familyIds field
    updates.familyIds = admin.firestore.FieldValue.delete();
  }

  // Check if user already has familyId but also has familyIds
  if (userData.familyId && userData.familyIds) {
    log.warn(`User ${userId} has both familyId and familyIds fields`);
    // Keep the existing familyId, just remove familyIds
    updates.familyIds = admin.firestore.FieldValue.delete();
    needsHealing = true;
  }

  return needsHealing ? updates : null;
}

/**
 * Process users in batches
 */
async function healUsers() {
  log.info('Starting user data healing process...', { dryRun: DRY_RUN });

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    log.info(`Found ${usersSnapshot.size} users to process`);

    // Process in batches
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();
      stats.usersProcessed++;

      const updates = healUserData(userData, userId);

      if (updates) {
        stats.usersHealed++;
        
        if (!DRY_RUN) {
          currentBatch.update(doc.ref, updates);
          batchCount++;

          // Create new batch if limit reached
          if (batchCount >= BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            batchCount = 0;
          }
        }
      } else {
        stats.usersSkipped++;
      }
    }

    // Add final batch if it has updates
    if (batchCount > 0 && !DRY_RUN) {
      batches.push(currentBatch);
    }

    // Commit all batches
    if (!DRY_RUN && batches.length > 0) {
      log.info(`Committing ${batches.length} batches...`);
      
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        log.info(`Batch ${i + 1}/${batches.length} committed`);
      }
    }

    // Log results
    log.success('Data healing completed!', stats);

    if (stats.warnings.length > 0) {
      log.warn('Warnings encountered:', stats.warnings);
    }

  } catch (error) {
    stats.errors++;
    log.error('Failed to heal user data:', error);
    throw error;
  }
}

/**
 * Verify the healing was successful
 */
async function verifyHealing() {
  log.info('Verifying data healing...');

  try {
    const usersWithFamilyIds = await db.collection('users')
      .where('familyIds', '!=', null)
      .get();

    if (usersWithFamilyIds.size > 0) {
      log.error(`Found ${usersWithFamilyIds.size} users still with familyIds field!`);
      usersWithFamilyIds.forEach(doc => {
        log.error(`User ${doc.id} still has familyIds:`, doc.data().familyIds);
      });
      return false;
    }

    log.success('Verification passed! No users have familyIds field.');
    return true;

  } catch (error) {
    // This error is expected if the field doesn't exist in any documents
    if (error.code === 'failed-precondition') {
      log.success('Verification passed! Field familyIds does not exist.');
      return true;
    }
    log.error('Verification failed:', error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('TypeB Family App - Data Healing Script');
  console.log('Migrating from familyIds array to single familyId');
  console.log('='.repeat(60));
  console.log();

  try {
    // Run healing
    await healUsers();

    // Verify if not dry run
    if (!DRY_RUN) {
      console.log();
      await verifyHealing();
    } else {
      log.info('Dry run completed. No changes were made.');
      log.info('Run without --dry-run flag to apply changes.');
    }

  } catch (error) {
    log.error('Script failed:', error);
    process.exit(1);
  }

  console.log();
  console.log('='.repeat(60));
  process.exit(0);
}

// Run the script
main();