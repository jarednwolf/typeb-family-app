#!/usr/bin/env node

/**
 * Setup Demo Data Script
 * Creates user profiles, family, and tasks for demo accounts
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  collection,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration from your .env
const firebaseConfig = {
  apiKey: "AIzaSyB7J0bv6LIADDlgCWj_ZkovFON-gaoGt5w",
  authDomain: "typeb-family-app.firebaseapp.com",
  projectId: "typeb-family-app",
  storageBucket: "typeb-family-app.firebasestorage.app",
  messagingSenderId: "1030430696382",
  appId: "1:1030430696382:web:31fd0b7449fe8d9a098fef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Demo account UIDs (from the authentication we verified)
const DEMO_PARENT_UID = "PuI1XilzwxMPnUqM4cskkm9BGBk1";
const DEMO_CHILD_UID = "LzPvMWkMOTakRsxbx7krgcPUZ0q2";
const DEMO_FAMILY_ID = "demo-family-2025";

async function setupDemoData() {
  console.log('🎭 Setting up demo data in Firestore...\n');
  
  try {
    // 1. Create Demo Parent Profile
    console.log('Creating demo parent profile...');
    await setDoc(doc(db, 'users', DEMO_PARENT_UID), {
      id: DEMO_PARENT_UID,
      email: 'demo@typebapp.com',
      displayName: 'Demo Parent',
      role: 'parent',
      familyId: DEMO_FAMILY_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPremium: true,
      notificationsEnabled: true,
      timezone: 'America/Phoenix',
      points: 150,
      level: 3,
      achievements: ['family_creator', 'task_master', 'premium_member']
    });
    console.log('✅ Demo parent profile created');
    
    // 2. Create Demo Child Profile
    console.log('Creating demo child profile...');
    await setDoc(doc(db, 'users', DEMO_CHILD_UID), {
      id: DEMO_CHILD_UID,
      email: 'demo.child@typebapp.com',
      displayName: 'Demo Child',
      role: 'child',
      familyId: DEMO_FAMILY_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationsEnabled: true,
      timezone: 'America/Phoenix',
      points: 85,
      level: 2,
      achievements: ['first_task', 'week_streak']
    });
    console.log('✅ Demo child profile created');
    
    // 3. Create Demo Family
    console.log('Creating demo family...');
    await setDoc(doc(db, 'families', DEMO_FAMILY_ID), {
      id: DEMO_FAMILY_ID,
      name: 'Demo Family',
      inviteCode: 'DEMO2025',
      createdBy: DEMO_PARENT_UID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberIds: [DEMO_PARENT_UID, DEMO_CHILD_UID],
      parentIds: [DEMO_PARENT_UID],
      childIds: [DEMO_CHILD_UID],
      maxMembers: 10,
      isPremium: true,
      taskCategories: [
        { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
        { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
        { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
        { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
      ],
      settings: {
        allowChildrenToCreateTasks: false,
        requirePhotoValidation: true,
        enableRewards: true,
        enableNotifications: true
      }
    });
    console.log('✅ Demo family created');
    
    // 4. Create Sample Tasks
    console.log('Creating sample tasks...');
    
    const tasks = [
      {
        id: `demo-task-${Date.now()}-1`,
        familyId: DEMO_FAMILY_ID,
        title: 'Clean Your Room',
        description: 'Make bed, organize desk, and vacuum the floor',
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        assignedTo: DEMO_CHILD_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'pending',
        requiresPhoto: true,
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        isRecurring: false,
        reminderEnabled: true,
        reminderTime: '09:00',
        escalationLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'high',
        points: 25
      },
      {
        id: `demo-task-${Date.now()}-2`,
        familyId: DEMO_FAMILY_ID,
        title: 'Math Homework',
        description: 'Complete Chapter 5 exercises',
        category: { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book' },
        assignedTo: DEMO_CHILD_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'pending',
        requiresPhoto: false,
        dueDate: new Date().toISOString(), // Today
        isRecurring: false,
        reminderEnabled: true,
        reminderTime: '15:00',
        escalationLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'urgent',
        points: 20
      },
      {
        id: `demo-task-${Date.now()}-3`,
        familyId: DEMO_FAMILY_ID,
        title: '30 Minutes Exercise',
        description: 'Go for a run or do workout video',
        category: { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart' },
        assignedTo: DEMO_CHILD_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'in_progress',
        requiresPhoto: true,
        dueDate: new Date().toISOString(), // Today
        isRecurring: true,
        recurringSchedule: {
          frequency: 'daily',
          daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
        },
        reminderEnabled: true,
        reminderTime: '07:00',
        escalationLevel: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date().toISOString(),
        priority: 'medium',
        points: 15
      },
      {
        id: `demo-task-${Date.now()}-4`,
        familyId: DEMO_FAMILY_ID,
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        category: { id: '1', name: 'Chores', color: '#10B981', icon: 'home' },
        assignedTo: DEMO_CHILD_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'completed',
        requiresPhoto: true,
        photoUrl: 'https://via.placeholder.com/400x300/10B981/ffffff?text=Task+Completed',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        completedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        isRecurring: false,
        reminderEnabled: false,
        escalationLevel: 0,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        priority: 'low',
        points: 10,
        pointsEarned: 10
      },
      {
        id: `demo-task-${Date.now()}-5`,
        familyId: DEMO_FAMILY_ID,
        title: 'Practice Piano',
        description: '30 minutes of piano practice',
        category: { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user' },
        assignedTo: DEMO_CHILD_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'pending',
        requiresPhoto: false,
        dueDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        isRecurring: true,
        recurringSchedule: {
          frequency: 'daily',
          daysOfWeek: [1, 2, 3, 4, 5, 6] // Mon-Sat
        },
        reminderEnabled: true,
        reminderTime: '16:00',
        escalationLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'medium',
        points: 15
      },
      {
        id: `demo-task-${Date.now()}-6`,
        familyId: DEMO_FAMILY_ID,
        title: 'Grocery Shopping',
        description: 'Pick up items from grocery list',
        category: { id: '5', name: 'Other', color: '#6B7280', icon: 'more-horizontal' },
        assignedTo: DEMO_PARENT_UID,
        assignedBy: DEMO_PARENT_UID,
        createdBy: DEMO_PARENT_UID,
        status: 'pending',
        requiresPhoto: false,
        dueDate: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
        isRecurring: false,
        reminderEnabled: true,
        reminderTime: '10:00',
        escalationLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'high',
        points: 30
      }
    ];
    
    // Create all tasks
    for (const task of tasks) {
      await setDoc(doc(db, 'tasks', task.id), task);
      console.log(`  ✅ Created task: ${task.title}`);
    }
    
    // 5. Create some notifications
    console.log('\nCreating sample notifications...');
    const notifications = [
      {
        id: `demo-notif-${Date.now()}-1`,
        userId: DEMO_CHILD_UID,
        familyId: DEMO_FAMILY_ID,
        type: 'task_reminder',
        title: 'Task Reminder',
        message: 'Math Homework is due today!',
        taskId: tasks[1].id,
        read: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        priority: 'high'
      },
      {
        id: `demo-notif-${Date.now()}-2`,
        userId: DEMO_PARENT_UID,
        familyId: DEMO_FAMILY_ID,
        type: 'task_completed',
        title: 'Task Completed',
        message: 'Demo Child completed "Take Out Trash"',
        taskId: tasks[3].id,
        read: true,
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        priority: 'medium'
      }
    ];
    
    for (const notification of notifications) {
      await setDoc(doc(db, 'notifications', notification.id), notification);
      console.log(`  ✅ Created notification: ${notification.title}`);
    }
    
    // 6. Create activity log entries
    console.log('\nCreating activity log...');
    const activities = [
      {
        id: `demo-activity-${Date.now()}-1`,
        familyId: DEMO_FAMILY_ID,
        userId: DEMO_CHILD_UID,
        type: 'task_completed',
        description: 'Completed task: Take Out Trash',
        taskId: tasks[3].id,
        points: 10,
        timestamp: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: `demo-activity-${Date.now()}-2`,
        familyId: DEMO_FAMILY_ID,
        userId: DEMO_PARENT_UID,
        type: 'task_created',
        description: 'Created task: Math Homework',
        taskId: tasks[1].id,
        timestamp: new Date().toISOString()
      }
    ];
    
    for (const activity of activities) {
      await setDoc(doc(db, 'activities', activity.id), activity);
      console.log(`  ✅ Created activity: ${activity.description}`);
    }
    
    console.log('\n========================================');
    console.log('✅ DEMO DATA SETUP COMPLETE!');
    console.log('========================================\n');
    console.log('Demo accounts are now fully configured with:');
    console.log('  • User profiles (Parent & Child)');
    console.log('  • Demo Family with premium features');
    console.log('  • 6 sample tasks (various statuses)');
    console.log('  • Sample notifications');
    console.log('  • Activity history\n');
    console.log('Demo Parent Login:');
    console.log('  📧 Email: demo@typebapp.com');
    console.log('  🔑 Password: Demo123!\n');
    console.log('Demo Child Login:');
    console.log('  📧 Email: demo.child@typebapp.com');
    console.log('  🔑 Password: Demo123!\n');
    console.log('Family Invite Code: DEMO2025\n');
    console.log('Testers can now sign in and see a fully populated app!');
    
  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the setup
setupDemoData();