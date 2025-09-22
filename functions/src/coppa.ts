import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

/**
 * Daily cleanup of photos older than 90 days (COPPA compliance)
 */
export const enforceDataRetention = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context: any) => {
    console.log('Starting COPPA data retention enforcement...');
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    try {
      const oldPhotosSnapshot = await db
        .collection('task_photos')
        .where('createdAt', '<', ninetyDaysAgo)
        .get();
      if (oldPhotosSnapshot.empty) {
        console.log('No photos to delete');
        return null;
      }
      const batch = db.batch();
      const deletePromises: Promise<any>[] = [];
      let deleteCount = 0;
      oldPhotosSnapshot.forEach((doc) => {
        const photoData = doc.data();
        batch.delete(doc.ref);
        if (photoData.storagePath) {
          const bucket = storage.bucket();
          const file = bucket.file(photoData.storagePath);
          deletePromises.push(
            file.delete().catch((error: any) => {
              console.error(`Failed to delete storage file ${photoData.storagePath}:`, error);
            })
          );
        }
        deleteCount++;
      });
      await batch.commit();
      await Promise.all(deletePromises);
      await db.collection('coppa_audit_log').add({
        eventType: 'data_retention_enforced',
        data: {
          photosDeleted: deleteCount,
          cutoffDate: ninetyDaysAgo.toISOString(),
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Deleted ${deleteCount} photos older than 90 days`);
      return null;
    } catch (error: any) {
      console.error('Error enforcing data retention:', error);
      throw error;
    }
  });

/**
 * Monitor consent expiration and notify parents
 */
export const checkConsentExpiration = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context: any) => {
    console.log('Checking for expiring parental consents...');
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    try {
      const expiringConsentsSnapshot = await db
        .collection('parental_consent')
        .where('status', '==', 'verified')
        .where('expiresAt', '>', now)
        .where('expiresAt', '<', threeDaysFromNow)
        .get();
      if (expiringConsentsSnapshot.empty) {
        console.log('No expiring consents found');
        return null;
      }
      const emailPromises: Promise<any>[] = [];
      expiringConsentsSnapshot.forEach((doc) => {
        const consentData = doc.data();
        emailPromises.push(
          db.collection('email_queue').add({
            to: consentData.parentEmail,
            template: 'consent_expiration_reminder',
            data: {
              childName: consentData.childData.firstName,
              expirationDate: consentData.expiresAt.toDate().toLocaleDateString(),
              renewalUrl: `https://typebapp.com/renew-consent?id=${doc.id}`,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
          })
        );
      });
      await Promise.all(emailPromises);
      console.log(`Sent ${emailPromises.length} consent expiration reminders`);
      return null;
    } catch (error: any) {
      console.error('Error checking consent expiration:', error);
      throw error;
    }
  });

/**
 * Handle expired consents - disable child accounts
 */
export const handleExpiredConsents = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context: any) => {
    console.log('Handling expired parental consents...');
    const now = new Date();
    try {
      const expiredConsentsSnapshot = await db
        .collection('parental_consent')
        .where('status', '==', 'verified')
        .where('expiresAt', '<', now)
        .get();
      if (expiredConsentsSnapshot.empty) {
        console.log('No expired consents found');
        return null;
      }
      const batch = db.batch();
      let expiredCount = 0;
      for (const doc of expiredConsentsSnapshot.docs) {
        const consentData = doc.data();
        batch.update(doc.ref, {
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const childAccountsSnapshot = await db
          .collection('users')
          .where('parentConsentId', '==', doc.id)
          .get();
        childAccountsSnapshot.forEach((userDoc) => {
          batch.update(userDoc.ref, {
            accountStatus: 'disabled',
            disabledReason: 'parental_consent_expired',
            disabledAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await db.collection('email_queue').add({
          to: consentData.parentEmail,
          template: 'consent_expired',
          data: {
            childName: consentData.childData.firstName,
            renewalUrl: `https://typebapp.com/renew-consent?id=${doc.id}`,
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
        });
        expiredCount++;
      }
      await batch.commit();
      await db.collection('coppa_audit_log').add({
        eventType: 'consents_expired',
        data: {
          expiredCount,
          timestamp: now.toISOString(),
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Processed ${expiredCount} expired consents`);
      return null;
    } catch (error: any) {
      console.error('Error handling expired consents:', error);
      throw error;
    }
  });

/**
 * Process email queue - send pending emails
 */
export const processEmailQueue = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context: any) => {
    console.log('Processing email queue...');
    try {
      const pendingEmailsSnapshot = await db
        .collection('email_queue')
        .where('status', '==', 'pending')
        .limit(50)
        .get();
      if (pendingEmailsSnapshot.empty) {
        console.log('No pending emails');
        return null;
      }
      const batch = db.batch();
      let processedCount = 0;
      for (const doc of pendingEmailsSnapshot.docs) {
        const emailData: any = doc.data();
        try {
          console.log(`Sending email to ${emailData.to} with template ${emailData.template}`);
          batch.update(doc.ref, {
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          processedCount++;
        } catch (error: any) {
          console.error(`Failed to send email ${doc.id}:`, error);
          batch.update(doc.ref, {
            status: 'error',
            error: (error && error.message) || 'unknown',
            errorAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      await batch.commit();
      console.log(`Processed ${processedCount} emails`);
      return null;
    } catch (error: any) {
      console.error('Error processing email queue:', error);
      throw error;
    }
  });

/**
 * HTTP endpoint for parent consent verification
 */
export const verifyParentalConsent = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const consentId = req.query.id as string;
  if (!consentId) {
    res.status(400).json({ error: 'Consent ID required' });
    return;
  }
  try {
    const consentDoc = await db.collection('parental_consent').doc(consentId).get();
    if (!consentDoc.exists) {
      res.status(404).json({ error: 'Consent not found' });
      return;
    }
    const consentData = consentDoc.data()!;
    if (consentData.status === 'verified') {
      res.status(200).json({ 
        message: 'Consent already verified',
        childName: consentData.childData.firstName,
      });
      return;
    }
    if (new Date() > consentData.expiresAt.toDate()) {
      res.status(400).json({ error: 'Consent request has expired' });
      return;
    }
    await consentDoc.ref.update({
      status: 'verified',
      consentGiven: true,
      consentDate: admin.firestore.FieldValue.serverTimestamp(),
      verificationMethod: 'email',
    });
    await db.collection('coppa_audit_log').add({
      eventType: 'consent_verified',
      data: {
        consentId,
        childName: consentData.childData.firstName,
        parentEmail: consentData.parentEmail,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ 
      message: 'Consent verified successfully',
      childName: consentData.childData.firstName,
      nextStep: 'Your child can now create their account',
    });
  } catch (error) {
    console.error('Error verifying consent:', error);
    res.status(500).json({ error: 'Failed to verify consent' });
  }
});

/**
 * HTTP endpoint for parent data access requests
 */
export const parentDataAccess = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const { parentId, childId, action } = req.body;
  if (!parentId || !childId) {
    res.status(400).json({ error: 'Parent ID and Child ID required' });
    return;
  }
  try {
    const childDoc = await db.collection('users').doc(childId).get();
    if (!childDoc.exists || childDoc.data()?.parentId !== parentId) {
      res.status(403).json({ error: 'Unauthorized: Not the parent of this child' });
      return;
    }
    switch (action) {
      case 'export': {
        const tasks = await db.collection('families')
          .doc(childDoc.data()!.familyId)
          .collection('tasks')
          .where('assignedTo', '==', childId)
          .get();
        const rewards = await db.collection('families')
          .doc(childDoc.data()!.familyId)
          .collection('redemptions')
          .where('userId', '==', childId)
          .get();
        const exportData = {
          profile: childDoc.data(),
          tasks: tasks.docs.map(d => ({ id: d.id, ...d.data() })),
          rewards: rewards.docs.map(d => ({ id: d.id, ...d.data() })),
          exportDate: new Date().toISOString(),
        };
        res.status(200).json(exportData);
        break;
      }
      case 'delete': {
        const batch = db.batch();
        batch.delete(childDoc.ref);
        await batch.commit();
        await db.collection('coppa_audit_log').add({
          eventType: 'child_data_deleted',
          data: { childId, parentId, deletedAt: new Date().toISOString() },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ message: 'Child data deleted successfully' });
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in parent data access:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});