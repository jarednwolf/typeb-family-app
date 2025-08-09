#!/usr/bin/env node

/**
 * Seeds Firebase emulator with test data for E2E tests
 * Run with: node scripts/seed-emulator.js
 */

const admin = require('firebase-admin');
const { testUsers, testFamily, testTasks } = require('../e2e/fixtures/testData');

// Initialize admin SDK with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
  projectId: 'typeb-family-app',
});

const auth = admin.auth();
const db = admin.firestore();

async function clearData() {
  console.log('🧹 Clearing existing data...');
  
  // Clear all users
  const listUsersResult = await auth.listUsers();
  const userIds = listUsersResult.users.map(user => user.uid);
  if (userIds.length > 0) {
    await auth.deleteUsers(userIds);
  }
  
  // Clear Firestore collections
  const collections = ['users', 'families', 'tasks'];
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  
  console.log('✅ Data cleared');
}

async function seedUsers() {
  console.log('👥 Creating test users...');
  
  const createdUsers = {};
  
  // Create parent user
  const parentRecord = await auth.createUser({
    email: testUsers.parent.email,
    password: testUsers.parent.password,
    displayName: testUsers.parent.displayName,
    emailVerified: true,
  });
  createdUsers.parent = parentRecord;
  
  // Create child user
  const childRecord = await auth.createUser({
    email: testUsers.child.email,
    password: testUsers.child.password,
    displayName: testUsers.child.displayName,
    emailVerified: true,
  });
  createdUsers.child = childRecord;
  
  // Create existing user for login tests
  const existingRecord = await auth.createUser({
    email: testUsers.existingUser.email,
    password: testUsers.existingUser.password,
    displayName: testUsers.existingUser.displayName,
    emailVerified: true,
  });
  createdUsers.existing = existingRecord;
  
  console.log('✅ Users created');
  return createdUsers;
}

async function seedFamily(users) {
  console.log('🏠 Creating test family...');
  
  // Create family document
  const familyRef = db.collection('families').doc();
  const familyData = {
    id: familyRef.id,
    name: testFamily.name,
    inviteCode: testFamily.inviteCode,
    createdBy: users.parent.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    memberIds: [users.parent.uid, users.child.uid],
    parentIds: [users.parent.uid],
    childIds: [users.child.uid],
    maxMembers: testFamily.maxMembers,
    isPremium: true, // Enable premium for testing all features
    taskCategories: [
      { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
      { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
      { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
      { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
      { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' },
    ],
  };
  
  await familyRef.set(familyData);
  
  // Update user documents with family reference
  await db.collection('users').doc(users.parent.uid).set({
    id: users.parent.uid,
    email: testUsers.parent.email,
    displayName: testUsers.parent.displayName,
    familyId: familyRef.id,
    role: 'parent',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isPremium: true,
    notificationsEnabled: true,
    timezone: 'America/New_York',
  });
  
  await db.collection('users').doc(users.child.uid).set({
    id: users.child.uid,
    email: testUsers.child.email,
    displayName: testUsers.child.displayName,
    familyId: familyRef.id,
    role: 'child',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isPremium: false,
    notificationsEnabled: true,
    timezone: 'America/New_York',
  });
  
  // Create user document for existing user (no family)
  await db.collection('users').doc(users.existing.uid).set({
    id: users.existing.uid,
    email: testUsers.existingUser.email,
    displayName: testUsers.existingUser.displayName,
    familyId: null,
    role: 'parent',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isPremium: false,
    notificationsEnabled: true,
    timezone: 'America/New_York',
  });
  
  console.log('✅ Family created');
  return familyRef.id;
}

async function seedTasks(familyId, users) {
  console.log('📋 Creating test tasks...');
  
  const batch = db.batch();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  testTasks.forEach((task, index) => {
    const taskRef = db.collection('tasks').doc();
    const taskData = {
      id: taskRef.id,
      familyId: familyId,
      title: task.title,
      description: task.description,
      category: {
        id: String(index + 1),
        name: task.category,
        color: '#10B981',
        icon: 'check',
      },
      assignedTo: index === 0 ? users.parent.uid : users.child.uid,
      assignedBy: users.parent.uid,
      createdBy: users.parent.uid,
      status: task.status,
      requiresPhoto: task.requiresPhoto || false,
      dueDate: tomorrow.toISOString(),
      isRecurring: task.isRecurring || false,
      reminderEnabled: true,
      reminderEscalationLevel: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      priority: task.priority,
      points: 10,
    };
    
    batch.set(taskRef, taskData);
  });
  
  await batch.commit();
  console.log('✅ Tasks created');
}

async function main() {
  try {
    console.log('🚀 Starting Firebase emulator seeding...\n');
    
    // Clear existing data
    await clearData();
    
    // Seed users
    const users = await seedUsers();
    
    // Seed family
    const familyId = await seedFamily(users);
    
    // Seed tasks
    await seedTasks(familyId, users);
    
    console.log('\n✨ Emulator seeding complete!');
    console.log('\n📝 Test Credentials:');
    console.log(`   Parent: ${testUsers.parent.email} / ${testUsers.parent.password}`);
    console.log(`   Child: ${testUsers.child.email} / ${testUsers.child.password}`);
    console.log(`   Existing: ${testUsers.existingUser.email} / ${testUsers.existingUser.password}`);
    console.log(`   Family Invite Code: ${testFamily.inviteCode}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding emulator:', error);
    process.exit(1);
  }
}

// Run the seeding
main();