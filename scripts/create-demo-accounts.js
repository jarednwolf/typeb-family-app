/**
 * Create Demo Accounts in Production Firebase
 * 
 * This script creates demo accounts directly in production Firebase
 * for testing and demonstration purposes.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const auth = admin.auth();
const db = admin.firestore();

async function createDemoAccounts() {
  console.log('🎭 Creating demo accounts in production Firebase...\n');
  
  try {
    // Demo Parent Account
    console.log('Creating demo parent account...');
    let demoParentUid;
    
    try {
      // Check if user already exists
      const existingParent = await auth.getUserByEmail('demo@typebapp.com');
      console.log('✓ Demo parent account already exists');
      demoParentUid = existingParent.uid;
    } catch (error) {
      // User doesn't exist, create it
      const demoParent = await auth.createUser({
        email: 'demo@typebapp.com',
        password: 'Demo123!',
        displayName: 'Demo Parent',
        emailVerified: true
      });
      demoParentUid = demoParent.uid;
      console.log('✓ Demo parent account created');
    }
    
    // Create/update parent user document
    await db.collection('users').doc(demoParentUid).set({
      id: demoParentUid,
      email: 'demo@typebapp.com',
      displayName: 'Demo Parent',
      role: 'parent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPremium: true,
      notificationsEnabled: true,
      timezone: 'America/Phoenix'
    }, { merge: true });
    console.log('✓ Demo parent user profile created\n');
    
    // Demo Child Account
    console.log('Creating demo child account...');
    let demoChildUid;
    
    try {
      // Check if user already exists
      const existingChild = await auth.getUserByEmail('demo.child@typebapp.com');
      console.log('✓ Demo child account already exists');
      demoChildUid = existingChild.uid;
    } catch (error) {
      // User doesn't exist, create it
      const demoChild = await auth.createUser({
        email: 'demo.child@typebapp.com',
        password: 'Demo123!',
        displayName: 'Demo Child',
        emailVerified: true
      });
      demoChildUid = demoChild.uid;
      console.log('✓ Demo child account created');
    }
    
    // Create/update child user document
    await db.collection('users').doc(demoChildUid).set({
      id: demoChildUid,
      email: 'demo.child@typebapp.com',
      displayName: 'Demo Child',
      role: 'child',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationsEnabled: true,
      timezone: 'America/Phoenix'
    }, { merge: true });
    console.log('✓ Demo child user profile created\n');
    
    // Create Demo Family
    console.log('Creating demo family...');
    const familyId = 'demo-family';
    
    await db.collection('families').doc(familyId).set({
      id: familyId,
      name: 'Demo Family',
      inviteCode: 'DEMO01',
      createdBy: demoParentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberIds: [demoParentUid, demoChildUid],
      parentIds: [demoParentUid],
      childIds: [demoChildUid],
      maxMembers: 10,
      isPremium: true,
      taskCategories: [
        { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
        { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
        { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
        { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
      ]
    }, { merge: true });
    console.log('✓ Demo family created\n');
    
    // Update users with family ID
    await db.collection('users').doc(demoParentUid).update({
      familyId: familyId
    });
    await db.collection('users').doc(demoChildUid).update({
      familyId: familyId
    });
    console.log('✓ Users linked to demo family\n');
    
    // Create a sample task
    console.log('Creating sample task...');
    const taskId = `demo-task-${Date.now()}`;
    await db.collection('tasks').doc(taskId).set({
      id: taskId,
      familyId: familyId,
      title: 'Example Task with Photo Validation',
      description: 'This is a demo task that requires photo validation',
      category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
      assignedTo: demoChildUid,
      assignedBy: demoParentUid,
      createdBy: demoParentUid,
      status: 'pending',
      requiresPhoto: true,
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      isRecurring: false,
      reminderEnabled: true,
      reminderTime: '09:00',
      escalationLevel: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: 'medium',
      points: 25
    });
    console.log('✓ Sample task created\n');
    
    console.log('🎉 Demo accounts created successfully!\n');
    console.log('Demo Parent:');
    console.log('  Email: demo@typebapp.com');
    console.log('  Password: Demo123!');
    console.log('\nDemo Child:');
    console.log('  Email: demo.child@typebapp.com');
    console.log('  Password: Demo123!');
    console.log('\nFamily Invite Code: DEMO01');
    
  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
createDemoAccounts();