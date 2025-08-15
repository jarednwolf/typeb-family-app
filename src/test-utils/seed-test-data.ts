/**
 * Seed Test Data Script
 * 
 * This script populates the Firebase emulators with test data
 * for development and testing purposes.
 */

import { 
  initializeTestApp, 
  clearFirestoreData, 
  createTestUser,
  createTestFamily,
  createTestTask,
  cleanupTestApp,
  waitForEmulators
} from './firebase-test-helpers';
import { doc, updateDoc } from 'firebase/firestore';

interface SeedDataResult {
  users: Array<{ email: string; password: string; role: string }>;
  families: string[];
  tasks: string[];
}

/**
 * Seed comprehensive test data
 */
export const seedTestData = async (): Promise<SeedDataResult> => {
  console.log('🌱 Starting test data seeding...');
  
  try {
    // Wait for emulators to be ready
    console.log('⏳ Waiting for emulators to start...');
    await waitForEmulators();
    
    // Initialize test app
    console.log('🔧 Initializing test app...');
    const testApp = await initializeTestApp('typeb-family-app');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await clearFirestoreData();
    
    const result: SeedDataResult = {
      users: [],
      families: [],
      tasks: []
    };
    
    // Create Smith Family
    console.log('👨‍👩‍👧‍👦 Creating Smith family...');
    const smithParent = await createTestUser({
      email: 'john.smith@test.com',
      password: 'Parent123!',
      displayName: 'John Smith',
      role: 'parent'
    });
    result.users.push({ email: 'john.smith@test.com', password: 'Parent123!', role: 'parent' });
    
    const smithParent2 = await createTestUser({
      email: 'jane.smith@test.com',
      password: 'Parent123!',
      displayName: 'Jane Smith',
      role: 'parent'
    });
    result.users.push({ email: 'jane.smith@test.com', password: 'Parent123!', role: 'parent' });
    
    const smithChild1 = await createTestUser({
      email: 'emma.smith@test.com',
      password: 'Child123!',
      displayName: 'Emma Smith',
      role: 'child'
    });
    result.users.push({ email: 'emma.smith@test.com', password: 'Child123!', role: 'child' });
    
    const smithChild2 = await createTestUser({
      email: 'liam.smith@test.com',
      password: 'Child123!',
      displayName: 'Liam Smith',
      role: 'child'
    });
    result.users.push({ email: 'liam.smith@test.com', password: 'Child123!', role: 'child' });
    
    const smithFamilyId = await createTestFamily({
      name: 'The Smith Family',
      createdBy: smithParent.uid,
      memberIds: [smithParent.uid, smithParent2.uid, smithChild1.uid, smithChild2.uid]
    });
    result.families.push(smithFamilyId);
    
    // Update family with parent/child IDs
    const { firestore } = testApp;
    await updateDoc(doc(firestore, 'families', smithFamilyId), {
      parentIds: [smithParent.uid, smithParent2.uid],
      childIds: [smithChild1.uid, smithChild2.uid]
    });
    
    // Update users with family ID
    for (const userId of [smithParent.uid, smithParent2.uid, smithChild1.uid, smithChild2.uid]) {
      await updateDoc(doc(firestore, 'users', userId), {
        familyId: smithFamilyId
      });
    }
    
    // Create tasks for Smith family
    console.log('📝 Creating tasks for Smith family...');
    const smithTasks = [
      // Emma's tasks
      {
        title: 'Clean bedroom',
        assignedTo: smithChild1.uid,
        assignedBy: smithParent.uid,
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        points: 15
      },
      {
        title: 'Math homework',
        assignedTo: smithChild1.uid,
        assignedBy: smithParent2.uid,
        category: { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
        dueDate: new Date().toISOString(), // Today
        priority: 'high' as const,
        points: 20
      },
      {
        title: 'Practice piano',
        assignedTo: smithChild1.uid,
        assignedBy: smithParent.uid,
        category: { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
        dueDate: new Date().toISOString(), // Today
        isRecurring: true,
        points: 10
      },
      // Liam's tasks
      {
        title: 'Take out trash',
        assignedTo: smithChild2.uid,
        assignedBy: smithParent.uid,
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        dueDate: new Date().toISOString(), // Today
        points: 10
      },
      {
        title: 'Science project',
        assignedTo: smithChild2.uid,
        assignedBy: smithParent2.uid,
        category: { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
        dueDate: new Date(Date.now() + 172800000).toISOString(), // 2 days
        priority: 'urgent' as const,
        requiresPhoto: true,
        points: 30
      },
      {
        title: 'Soccer practice',
        assignedTo: smithChild2.uid,
        assignedBy: smithParent.uid,
        category: { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
        dueDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours
        points: 15
      },
      // Parent tasks
      {
        title: 'Grocery shopping',
        assignedTo: smithParent.uid,
        assignedBy: smithParent.uid,
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        dueDate: new Date().toISOString(), // Today
        points: 20
      },
      {
        title: 'Pay bills',
        assignedTo: smithParent2.uid,
        assignedBy: smithParent2.uid,
        category: { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' },
        dueDate: new Date(Date.now() + 259200000).toISOString(), // 3 days
        priority: 'high' as const,
        points: 25
      }
    ];
    
    for (const taskData of smithTasks) {
      const taskId = await createTestTask({
        ...taskData,
        familyId: smithFamilyId
      });
      result.tasks.push(taskId);
    }
    
    // Create Johnson Family (smaller family)
    console.log('👨‍👧 Creating Johnson family...');
    const johnsonParent = await createTestUser({
      email: 'mike.johnson@test.com',
      password: 'Parent123!',
      displayName: 'Mike Johnson',
      role: 'parent'
    });
    result.users.push({ email: 'mike.johnson@test.com', password: 'Parent123!', role: 'parent' });
    
    const johnsonChild = await createTestUser({
      email: 'sarah.johnson@test.com',
      password: 'Child123!',
      displayName: 'Sarah Johnson',
      role: 'child'
    });
    result.users.push({ email: 'sarah.johnson@test.com', password: 'Child123!', role: 'child' });
    
    const johnsonFamilyId = await createTestFamily({
      name: 'The Johnson Family',
      createdBy: johnsonParent.uid,
      memberIds: [johnsonParent.uid, johnsonChild.uid]
    });
    result.families.push(johnsonFamilyId);
    
    // Update family and users
    await updateDoc(doc(firestore, 'families', johnsonFamilyId), {
      parentIds: [johnsonParent.uid],
      childIds: [johnsonChild.uid]
    });
    
    await updateDoc(doc(firestore, 'users', johnsonParent.uid), {
      familyId: johnsonFamilyId
    });
    
    await updateDoc(doc(firestore, 'users', johnsonChild.uid), {
      familyId: johnsonFamilyId
    });
    
    // Create tasks for Johnson family
    console.log('📝 Creating tasks for Johnson family...');
    const johnsonTasks = [
      {
        title: 'Do dishes',
        assignedTo: johnsonChild.uid,
        assignedBy: johnsonParent.uid,
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        dueDate: new Date().toISOString(), // Today
        points: 10
      },
      {
        title: 'Read for 30 minutes',
        assignedTo: johnsonChild.uid,
        assignedBy: johnsonParent.uid,
        category: { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
        dueDate: new Date().toISOString(), // Today
        isRecurring: true,
        points: 15
      }
    ];
    
    for (const taskData of johnsonTasks) {
      const taskId = await createTestTask({
        ...taskData,
        familyId: johnsonFamilyId
      });
      result.tasks.push(taskId);
    }
    
    // Create a demo account
    console.log('🎭 Creating demo account...');
    const demoParent = await createTestUser({
      email: 'demo@typebapp.com',
      password: 'Demo123!',
      displayName: 'Demo Parent',
      role: 'parent'
    });
    result.users.push({ email: 'demo@typebapp.com', password: 'Demo123!', role: 'parent' });
    
    const demoChild = await createTestUser({
      email: 'demo.child@typebapp.com',
      password: 'Demo123!',
      displayName: 'Demo Child',
      role: 'child'
    });
    result.users.push({ email: 'demo.child@typebapp.com', password: 'Demo123!', role: 'child' });
    
    const demoFamilyId = await createTestFamily({
      name: 'Demo Family',
      createdBy: demoParent.uid,
      memberIds: [demoParent.uid, demoChild.uid]
    });
    result.families.push(demoFamilyId);
    
    // Update demo family
    await updateDoc(doc(firestore, 'families', demoFamilyId), {
      parentIds: [demoParent.uid],
      childIds: [demoChild.uid],
      inviteCode: 'DEMO01',
      isPremium: true // Enable premium features for demo
    });
    
    // Update demo users
    await updateDoc(doc(firestore, 'users', demoParent.uid), {
      familyId: demoFamilyId,
      isPremium: true
    });
    
    await updateDoc(doc(firestore, 'users', demoChild.uid), {
      familyId: demoFamilyId
    });
    
    // Create demo tasks
    const demoTasks = [
      {
        title: 'Example task with photo validation',
        assignedTo: demoChild.uid,
        assignedBy: demoParent.uid,
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        dueDate: new Date().toISOString(),
        requiresPhoto: true,
        points: 25
      }
    ];
    
    for (const taskData of demoTasks) {
      const taskId = await createTestTask({
        ...taskData,
        familyId: demoFamilyId
      });
      result.tasks.push(taskId);
    }
    
    console.log('✅ Test data seeding completed!');
    console.log(`📊 Created ${result.users.length} users, ${result.families.length} families, and ${result.tasks.length} tasks`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedTestData;