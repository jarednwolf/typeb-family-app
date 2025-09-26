#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : require('../firebase-service-account.json');

// Use production Firebase for demo account
const projectId = process.env.USE_STAGING ? 'tybeb-staging' : 'tybeb-prod';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${projectId}.firebaseio.com`
});

const auth = admin.auth();
const db = admin.firestore();

async function createDemoAccount() {
  console.log('🎭 Creating Demo Account for App Store Review...\n');
  console.log(`📦 Using Firebase project: ${projectId}\n`);
  
  const demoEmail = 'demo@typebapp.com';
  const demoPassword = 'Demo123!TypeB';
  
  try {
    // Create or update demo user
    let user;
    try {
      user = await auth.createUser({
        email: demoEmail,
        password: demoPassword,
        displayName: 'Demo User',
        emailVerified: true
      });
      console.log('✅ Demo user created');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        user = await auth.getUserByEmail(demoEmail);
        // Update password
        await auth.updateUser(user.uid, {
          password: demoPassword,
          displayName: 'Demo User',
          emailVerified: true
        });
        console.log('✅ Demo user already exists - password updated');
      } else {
        throw error;
      }
    }
    
    // Check if demo family already exists
    const existingFamilies = await db.collection('families')
      .where('inviteCode', '==', 'DEMO2024')
      .get();
    
    let familyRef;
    if (existingFamilies.empty) {
      // Create demo family
      familyRef = await db.collection('families').add({
        name: 'Demo Family',
        createdBy: user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        members: [user.uid],
        inviteCode: 'DEMO2024',
        settings: {
          timezone: 'America/New_York',
          weekStartsOn: 0,
          allowPhotoValidation: true,
          requirePhotoApproval: false,
          celebrateCompletions: true
        }
      });
      console.log('✅ Demo family created');
    } else {
      familyRef = existingFamilies.docs[0].ref;
      console.log('✅ Demo family already exists');
    }
    
    // Add demo family members
    const familyMembers = [
      { 
        name: 'Sarah Parent', 
        role: 'parent', 
        email: 'parent.demo@typebapp.com',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Parent&background=667eea&color=fff'
      },
      { 
        name: 'Alex Teen', 
        role: 'child', 
        age: 14,
        avatar: 'https://ui-avatars.com/api/?name=Alex+Teen&background=764ba2&color=fff'
      },
      { 
        name: 'Emma Child', 
        role: 'child', 
        age: 8,
        avatar: 'https://ui-avatars.com/api/?name=Emma+Child&background=f093fb&color=fff'
      }
    ];
    
    // Clear existing demo members
    const existingMembers = await db.collection('familyMembers')
      .where('familyId', '==', familyRef.id)
      .get();
    
    for (const doc of existingMembers.docs) {
      await doc.ref.delete();
    }
    
    // Add new members
    for (const member of familyMembers) {
      const memberData = {
        familyId: familyRef.id,
        name: member.name,
        role: member.role,
        age: member.age,
        avatar: member.avatar,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        points: Math.floor(Math.random() * 500) + 100
      };
      
      if (member.email) {
        try {
          const memberUser = await auth.createUser({
            email: member.email,
            password: demoPassword,
            displayName: member.name,
            emailVerified: true
          });
          memberData.userId = memberUser.uid;
        } catch (error) {
          if (error.code === 'auth/email-already-exists') {
            const existingUser = await auth.getUserByEmail(member.email);
            memberData.userId = existingUser.uid;
          }
        }
      }
      
      await db.collection('familyMembers').add(memberData);
    }
    console.log('✅ Demo family members added');
    
    // Clear existing demo tasks
    const existingTasks = await db.collection('tasks')
      .where('familyId', '==', familyRef.id)
      .get();
    
    for (const doc of existingTasks.docs) {
      await doc.ref.delete();
    }
    
    // Create demo tasks with variety
    const now = new Date();
    const tasks = [
      {
        title: 'Clean Your Room',
        description: 'Make bed, organize desk, vacuum floor',
        category: 'chores',
        priority: 'high',
        requiresPhoto: true,
        points: 50,
        assignedTo: 'Alex Teen',
        status: 'completed',
        photoUrl: 'https://picsum.photos/400/300?random=1',
        completedAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
        validatedBy: user.uid,
        validationStatus: 'approved'
      },
      {
        title: 'Math Homework',
        description: 'Complete pages 45-47 in workbook',
        category: 'education',
        priority: 'high',
        requiresPhoto: true,
        points: 30,
        assignedTo: 'Emma Child',
        status: 'pending',
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        reminderSent: false
      },
      {
        title: 'Walk the Dog',
        description: '30 minute walk around the neighborhood',
        category: 'pets',
        priority: 'medium',
        requiresPhoto: false,
        points: 20,
        assignedTo: 'Alex Teen',
        status: 'in_progress',
        startedAt: new Date(now - 10 * 60 * 1000) // 10 minutes ago
      },
      {
        title: 'Practice Piano',
        description: '30 minutes of practice - work on scales and new piece',
        category: 'activities',
        priority: 'medium',
        requiresPhoto: true,
        points: 25,
        assignedTo: 'Emma Child',
        status: 'completed',
        photoUrl: 'https://picsum.photos/400/300?random=2',
        completedAt: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
        validatedBy: user.uid,
        validationStatus: 'approved',
        feedback: 'Great job! I can hear the improvement!'
      },
      {
        title: 'Take Out Trash',
        description: 'Empty all trash cans and take bins to curb',
        category: 'chores',
        priority: 'low',
        requiresPhoto: true,
        points: 15,
        assignedTo: 'Alex Teen',
        status: 'pending',
        recurring: 'weekly',
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // In 2 days
      },
      {
        title: 'Read for 20 Minutes',
        description: 'Continue reading your current book',
        category: 'education',
        priority: 'medium',
        requiresPhoto: false,
        points: 20,
        assignedTo: 'Emma Child',
        status: 'completed',
        completedAt: new Date(now - 3 * 60 * 60 * 1000), // 3 hours ago
        notes: 'Finished chapter 5 of Harry Potter!'
      },
      {
        title: 'Set the Table',
        description: 'Set the table for dinner - plates, utensils, napkins',
        category: 'chores',
        priority: 'medium',
        requiresPhoto: true,
        points: 10,
        assignedTo: 'Emma Child',
        status: 'pending',
        recurring: 'daily',
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000) // In 4 hours
      },
      {
        title: 'Science Project',
        description: 'Work on volcano model for science fair',
        category: 'education',
        priority: 'high',
        requiresPhoto: true,
        points: 75,
        assignedTo: 'Alex Teen',
        status: 'in_progress',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
        subtasks: [
          { title: 'Research volcanoes', completed: true },
          { title: 'Build model base', completed: true },
          { title: 'Paint and decorate', completed: false },
          { title: 'Prepare presentation', completed: false }
        ]
      }
    ];
    
    for (const task of tasks) {
      await db.collection('tasks').add({
        ...task,
        familyId: familyRef.id,
        createdBy: user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Demo tasks created (variety of statuses)');
    
    // Add demo achievements and streaks
    const achievements = [
      {
        userId: user.uid,
        familyId: familyRef.id,
        type: 'streak',
        name: '7 Day Streak 🔥',
        description: 'Complete tasks for 7 days in a row',
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        icon: '🔥',
        points: 100
      },
      {
        userId: user.uid,
        familyId: familyRef.id,
        type: 'milestone',
        name: 'Task Master 🏆',
        description: 'Complete 50 tasks',
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        icon: '🏆',
        points: 200
      },
      {
        userId: user.uid,
        familyId: familyRef.id,
        type: 'badge',
        name: 'Photo Pro 📸',
        description: 'Upload 25 validation photos',
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        icon: '📸',
        points: 50
      }
    ];
    
    for (const achievement of achievements) {
      await db.collection('achievements').add(achievement);
    }
    console.log('✅ Demo achievements added');
    
    // Create demo rewards
    const rewards = [
      {
        familyId: familyRef.id,
        name: 'Extra Screen Time (30 min)',
        pointsCost: 50,
        category: 'privilege',
        available: true,
        icon: '📱'
      },
      {
        familyId: familyRef.id,
        name: 'Choose Movie Night Film',
        pointsCost: 100,
        category: 'privilege',
        available: true,
        icon: '🎬'
      },
      {
        familyId: familyRef.id,
        name: '$10 iTunes Gift Card',
        pointsCost: 200,
        category: 'gift',
        available: true,
        icon: '🎁'
      },
      {
        familyId: familyRef.id,
        name: 'Stay Up 30 Minutes Later',
        pointsCost: 75,
        category: 'privilege',
        available: true,
        icon: '🌙'
      }
    ];
    
    for (const reward of rewards) {
      await db.collection('rewards').add({
        ...reward,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Demo rewards catalog created');
    
    // Create demo premium subscription (trial)
    await db.collection('subscriptions').doc(user.uid).set({
      status: 'trialing',
      plan: 'premium_annual',
      trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      features: [
        'unlimited_members',
        'advanced_analytics',
        'custom_categories',
        'priority_support',
        'export_data',
        'family_calendar',
        'reward_store'
      ]
    });
    console.log('✅ Demo premium trial activated (7 days)');
    
    // Add some demo comments/reactions
    const tasksForComments = await db.collection('tasks')
      .where('familyId', '==', familyRef.id)
      .where('status', '==', 'completed')
      .limit(2)
      .get();
    
    for (const taskDoc of tasksForComments.docs) {
      await db.collection('comments').add({
        taskId: taskDoc.id,
        familyId: familyRef.id,
        userId: user.uid,
        userName: 'Demo User',
        text: 'Great job! Keep up the good work! 👏',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await db.collection('reactions').add({
        taskId: taskDoc.id,
        familyId: familyRef.id,
        userId: user.uid,
        emoji: '⭐',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Demo comments and reactions added');
    
    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Demo Account Setup Complete!\n');
    console.log('='.repeat(50));
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('   Email: demo@typebapp.com');
    console.log('   Password: Demo123!TypeB');
    console.log('\n👨‍👩‍👧‍👦 FAMILY SETUP:');
    console.log('   Family Code: DEMO2024');
    console.log('   Members: 4 (1 parent, 2 children)');
    console.log('\n📋 DEMO CONTENT:');
    console.log('   - 8 sample tasks (various states)');
    console.log('   - Photo validation examples');
    console.log('   - 3 achievements unlocked');
    console.log('   - 4 rewards available');
    console.log('   - Comments and reactions');
    console.log('   - Premium trial active (7 days)');
    console.log('\n🎯 APP STORE REVIEW NOTES:');
    console.log('   "Use the demo account above to explore all features.');
    console.log('   The account has premium features enabled and sample');
    console.log('   data to demonstrate the app\'s functionality."');
    console.log('\n✅ Ready for app store review!');
    console.log('='.repeat(50) + '\n');
    
    // Save credentials to file for reference
    const fs = require('fs');
    const credentials = `# TypeB Family App - Demo Account Credentials

## App Store Review Account
- **Email**: demo@typebapp.com
- **Password**: Demo123!TypeB
- **Family Code**: DEMO2024

## Additional Test Accounts
- **Parent**: parent.demo@typebapp.com / Demo123!TypeB
- **Main User**: demo@typebapp.com / Demo123!TypeB

## Features Available
- Premium trial active (7 days)
- Photo validation enabled
- Multiple family members
- Sample tasks in various states
- Rewards and achievements
- Comments and reactions

## App Review Notes
Use the demo account credentials above to test all features. The account includes:
- Active family with multiple members
- Tasks in various completion states
- Photo validation examples
- Premium features enabled
- Sample achievements and rewards

The app is designed for families to manage tasks and chores with photo validation.
Target audience: Parents with children ages 6-17.

## Support
If you need assistance during review:
- Email: support@typebapp.com
- Documentation: https://typebapp.com/docs
`;
    
    fs.writeFileSync('DEMO_ACCOUNT_CREDENTIALS.md', credentials);
    console.log('📄 Credentials saved to: DEMO_ACCOUNT_CREDENTIALS.md\n');
    
  } catch (error) {
    console.error('❌ Error creating demo account:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

// Run the script
createDemoAccount()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
