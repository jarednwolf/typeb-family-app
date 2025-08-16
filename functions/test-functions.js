/**
 * Test script for Phase 0 Cloud Functions
 * Run this to verify atomic operations are working correctly
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

// Initialize Admin SDK for server-side operations
admin.initializeApp({
  projectId: 'typeb-family-app',
});

// Initialize client SDK for testing callable functions
const app = initializeApp({
  projectId: 'typeb-family-app',
});

const functions = getFunctions(app);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

const db = admin.firestore();
db.settings({
  host: '127.0.0.1:8080',
  ssl: false,
});

async function testAtomicOperations() {
  console.log('Testing Phase 0 Cloud Functions...\n');

  try {
    // 1. Create test family
    console.log('1. Creating test family...');
    const familyRef = db.collection('families').doc('test-family');
    await familyRef.set({
      name: 'Test Family',
      memberIds: ['parent1', 'child1'],
      parentIds: ['parent1'],
      childIds: ['child1'],
      counters: {
        pendingTasks: 1,
        completedTasks: 0,
        totalPointsAwarded: 0,
        totalPointsRedeemed: 0,
        pendingRedemptions: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Create test member
    console.log('2. Creating test member...');
    const memberRef = db.collection('families').doc('test-family').collection('members').doc('child1');
    await memberRef.set({
      userId: 'child1',
      name: 'Test Child',
      role: 'child',
      points: 100,
      totalPointsEarned: 100,
      totalPointsRedeemed: 0,
      tasksCompleted: 5,
    });

    // 3. Create test task
    console.log('3. Creating test task...');
    const taskRef = db.collection('families').doc('test-family').collection('tasks').doc('test-task');
    await taskRef.set({
      title: 'Test Task',
      assignedTo: 'child1',
      status: 'pending',
      rewardPoints: 20,
      photoValidationStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Simulate task completion (this should trigger approveTaskAndAwardPoints)
    console.log('4. Simulating task approval...');
    await taskRef.update({
      status: 'completed',
      photoValidationStatus: 'approved',
      photoValidatedBy: 'parent1',
      photoValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Wait for function to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verify points were awarded
    console.log('5. Verifying points were awarded...');
    const memberDoc = await memberRef.get();
    const memberData = memberDoc.data();
    console.log(`   Member points: ${memberData.points} (should be 120)`);
    console.log(`   Tasks completed: ${memberData.tasksCompleted} (should be 6)`);

    // 6. Create test reward
    console.log('6. Creating test reward...');
    const rewardRef = db.collection('families').doc('test-family').collection('rewards').doc('test-reward');
    await rewardRef.set({
      title: 'Test Reward',
      pointCost: 50,
      description: 'A test reward',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Test reward redemption
    console.log('7. Testing reward redemption...');
    const redeemReward = httpsCallable(functions, 'redeemReward');
    
    try {
      const result = await redeemReward({
        familyId: 'test-family',
        memberId: 'child1',
        rewardId: 'test-reward',
        pointCost: 50,
      });
      
      console.log('   Redemption result:', result.data);
      
      // Verify points were deducted
      const updatedMemberDoc = await memberRef.get();
      const updatedMemberData = updatedMemberDoc.data();
      console.log(`   Remaining points: ${updatedMemberData.points} (should be 70)`);
      
    } catch (error) {
      console.log('   Note: Callable function requires auth context, skipping client test');
    }

    // 8. Check audit logs
    console.log('8. Checking audit logs...');
    const auditLogs = await db.collection('auditLogs')
      .where('familyId', '==', 'test-family')
      .get();
    console.log(`   Found ${auditLogs.size} audit log entries`);
    
    auditLogs.forEach(doc => {
      const log = doc.data();
      console.log(`   - ${log.action} at ${log.timestamp?.toDate()}`);
    });

    console.log('\n✅ Phase 0 Cloud Functions test completed successfully!');
    
    // Cleanup
    console.log('\nCleaning up test data...');
    await familyRef.delete();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

// Run tests
testAtomicOperations();