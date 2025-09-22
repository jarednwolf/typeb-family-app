#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const { ref, uploadBytes } = require('firebase/storage');

function log(result, name) {
  if (result) console.log(`[PASS] ${name}`);
  else console.log(`[FAIL] ${name}`);
}

async function main() {
  const projectId = process.env.GCLOUD_PROJECT || 'tybeb-staging';
const repoRoot = path.resolve(__dirname, '..');
const firestoreRules = fs.readFileSync(path.join(repoRoot, 'apps/web/firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(repoRoot, 'apps/web/storage.rules'), 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });

  let failures = 0;

  try {
    // Seed data with admin privileges
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'families/f1'), {
        parentIds: ['parent1'],
        memberIds: ['alice', 'parent1'],
        counters: { pendingTasks: 0, completedTasks: 0, totalPointsAwarded: 0 },
      });
      await setDoc(doc(db, 'families/f1/members/alice'), {
        points: 0,
        totalPointsEarned: 0,
        tasksCompleted: 0,
      });
      await setDoc(doc(db, 'families/f1/tasks/t1'), {
        assignedTo: 'alice',
        status: 'created',
        rewardPoints: 5,
        photoValidationStatus: 'pending',
      });
      await setDoc(doc(db, 'users/alice'), {
        id: 'alice',
        familyId: 'f1',
        isUnder13: true,
      });
      await setDoc(doc(db, 'users/parent1'), { id: 'parent1', familyId: 'f1', role: 'parent' });
    });

    // 1) Family member can read family; non-member cannot
    {
      const aliceCtx = testEnv.authenticatedContext('alice');
      const bobCtx = testEnv.authenticatedContext('bob');
      const dbAlice = aliceCtx.firestore();
      const dbBob = bobCtx.firestore();

      try { await assertSucceeds(getDoc(doc(dbAlice, 'families/f1'))); log(true, 'family read allowed for member'); } catch { log(false, 'family read allowed for member'); failures++; }
      try { await assertFails(getDoc(doc(dbBob, 'families/f1'))); log(true, 'family read denied for non-member'); } catch { log(false, 'family read denied for non-member'); failures++; }
    }

    // 4b) Parental consent: only parent with matching parentId can create
    {
      const bobCtx = testEnv.authenticatedContext('bob');
      const parentCtx = testEnv.authenticatedContext('parent1');
      const dbBob = bobCtx.firestore();
      const dbParent = parentCtx.firestore();
      const consentPath = 'parental_consent/parent1_alice';
      try {
        await assertFails(setDoc(doc(dbBob, consentPath), { parentId: 'parent1', childData: { userId: 'alice' }, status: 'pending' }));
        log(true, 'non-parent cannot create consent');
      } catch { log(false, 'non-parent cannot create consent'); failures++; }
      try {
        await assertSucceeds(setDoc(doc(dbParent, consentPath), { parentId: 'parent1', childData: { userId: 'alice' }, status: 'pending' }));
        log(true, 'parent can create consent');
      } catch { log(false, 'parent can create consent'); failures++; }
    }

    // 2) Parent cannot update points directly
    {
      const parentCtx = testEnv.authenticatedContext('parent1');
      const dbParent = parentCtx.firestore();
      try { await assertFails(updateDoc(doc(dbParent, 'families/f1/members/alice'), { points: 10 })); log(true, 'parent cannot update points'); } catch { log(false, 'parent cannot update points'); failures++; }
    }

    // 3) Assigned child can update allowed task fields; cannot update rewardPoints
    {
      const aliceCtx = testEnv.authenticatedContext('alice');
      const dbAlice = aliceCtx.firestore();
      try { await assertSucceeds(updateDoc(doc(dbAlice, 'families/f1/tasks/t1'), { status: 'completed' })); log(true, 'child can update task status'); } catch { log(false, 'child can update task status'); failures++; }
      try { await assertFails(updateDoc(doc(dbAlice, 'families/f1/tasks/t1'), { rewardPoints: 10 })); log(true, 'child cannot update rewardPoints'); } catch { log(false, 'child cannot update rewardPoints'); failures++; }
    }

    // 4) Under-13 user cannot update restricted fields (email)
    {
      const aliceCtx = testEnv.authenticatedContext('alice');
      const dbAlice = aliceCtx.firestore();
      try { await assertFails(updateDoc(doc(dbAlice, 'users/alice'), { email: 'a@b.com' })); log(true, 'under-13 cannot update email'); } catch { log(false, 'under-13 cannot update email'); failures++; }
      try { await assertSucceeds(updateDoc(doc(dbAlice, 'users/alice'), { timezone: 'America/Phoenix' })); log(true, 'under-13 can update non-sensitive field'); } catch { log(false, 'under-13 can update non-sensitive field'); failures++; }
    }

    // 5) Storage: family member can upload image to family task path; non-member denied
    {
      const aliceCtx = testEnv.authenticatedContext('alice');
      const bobCtx = testEnv.authenticatedContext('bob');
      const storageAlice = aliceCtx.storage();
      const storageBob = bobCtx.storage();
      const data = Buffer.from('test');

      try {
        await assertSucceeds(uploadBytes(ref(storageAlice, 'families/f1/tasks/t1/photo.jpg'), data, { contentType: 'image/jpeg' }));
        log(true, 'member can upload task image');
      } catch {
        log(false, 'member can upload task image'); failures++;
      }

      try {
        await assertFails(uploadBytes(ref(storageBob, 'families/f1/tasks/t1/photo2.jpg'), data, { contentType: 'image/jpeg' }));
        log(true, 'non-member denied uploading task image');
      } catch {
        log(false, 'non-member denied uploading task image'); failures++;
      }
    }
  } finally {
    await Promise.allSettled([testEnv.cleanup()]);
  }

  if (failures > 0) {
    console.error(`\nRules tests failed: ${failures} case(s)`);
    process.exit(1);
  } else {
    console.log('\nAll rules tests passed.');
  }
}

main().catch((e) => { console.error(e); process.exit(2); });


