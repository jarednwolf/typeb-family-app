/**
 * Performance Test Data Generator
 * 
 * Creates large datasets for stress testing the TypeB Family App
 * Tests app performance with 100+ tasks and 10+ family members
 */

import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  Timestamp,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../src/services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/services/firebase';

interface TestDataConfig {
  familyId?: string;
  numMembers: number;
  numTasks: number;
  numCompletedTasks: number;
  includeRecurring: boolean;
  includePhotos: boolean;
  includeOverdue: boolean;
}

interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'child';
}

interface TestTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'completed' | 'in_progress';
  dueDate?: Date;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class PerformanceTestDataGenerator {
  private testUsers: TestUser[] = [];
  private testTasks: TestTask[] = [];
  private familyId: string = '';
  private inviteCode: string = '';

  /**
   * Generate a complete test dataset
   */
  async generateTestData(config: TestDataConfig): Promise<void> {
    console.log('🚀 Starting performance test data generation...');
    console.log('Configuration:', config);

    try {
      // Step 1: Create test family
      await this.createTestFamily(config);
      
      // Step 2: Create test users
      await this.createTestUsers(config.numMembers);
      
      // Step 3: Create test tasks
      await this.createTestTasks(config);
      
      // Step 4: Generate some activity data
      await this.generateActivityData();
      
      console.log('✅ Test data generation complete!');
      console.log(`Created: ${this.testUsers.length} users, ${this.testTasks.length} tasks`);
      console.log(`Family ID: ${this.familyId}`);
      console.log(`Invite Code: ${this.inviteCode}`);
      
      return this.printTestCredentials();
    } catch (error) {
      console.error('❌ Error generating test data:', error);
      throw error;
    }
  }

  /**
   * Create a test family
   */
  private async createTestFamily(config: TestDataConfig): Promise<void> {
    this.familyId = config.familyId || `test-family-${Date.now()}`;
    this.inviteCode = this.generateInviteCode();

    const familyData = {
      id: this.familyId,
      name: `Performance Test Family ${new Date().toLocaleDateString()}`,
      inviteCode: this.inviteCode,
      createdBy: 'test-parent-1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
      parentIds: [],
      childIds: [],
      maxMembers: 20, // Premium family for testing
      isPremium: true,
      taskCategories: [
        { id: 'chores', name: 'Chores', color: '#FF6B6B', icon: 'home' },
        { id: 'homework', name: 'Homework', color: '#4ECDC4', icon: 'book' },
        { id: 'exercise', name: 'Exercise', color: '#45B7D1', icon: 'activity' },
        { id: 'personal', name: 'Personal', color: '#96CEB4', icon: 'user' },
        { id: 'other', name: 'Other', color: '#9B59B6', icon: 'more-horizontal' }
      ]
    };

    await setDoc(doc(db, 'families', this.familyId), familyData);
    console.log(`✓ Created family: ${this.familyId}`);
  }

  /**
   * Create test users
   */
  private async createTestUsers(numMembers: number): Promise<void> {
    const batch = writeBatch(db);
    const memberIds: string[] = [];
    const parentIds: string[] = [];
    const childIds: string[] = [];

    // Create at least 2 parents and rest as children
    const numParents = Math.min(2, Math.floor(numMembers / 3));
    const numChildren = numMembers - numParents;

    console.log(`Creating ${numParents} parents and ${numChildren} children...`);

    // Create parent users
    for (let i = 1; i <= numParents; i++) {
      const userId = `test-parent-${i}`;
      const email = `parent${i}.test@typeb.app`;
      
      const userData = {
        id: userId,
        email,
        displayName: `Test Parent ${i}`,
        familyId: this.familyId,
        role: 'parent' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPremium: true,
        notificationsEnabled: true,
        timezone: 'America/New_York',
        avatarUrl: `https://ui-avatars.com/api/?name=Parent+${i}&background=random`
      };

      batch.set(doc(db, 'users', userId), userData);
      
      this.testUsers.push({
        id: userId,
        email,
        displayName: userData.displayName,
        role: 'parent'
      });
      
      memberIds.push(userId);
      parentIds.push(userId);
    }

    // Create child users
    for (let i = 1; i <= numChildren; i++) {
      const userId = `test-child-${i}`;
      const email = `child${i}.test@typeb.app`;
      
      const userData = {
        id: userId,
        email,
        displayName: `Test Child ${i}`,
        familyId: this.familyId,
        role: 'child' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPremium: false,
        notificationsEnabled: true,
        timezone: 'America/New_York',
        avatarUrl: `https://ui-avatars.com/api/?name=Child+${i}&background=random`
      };

      batch.set(doc(db, 'users', userId), userData);
      
      this.testUsers.push({
        id: userId,
        email,
        displayName: userData.displayName,
        role: 'child'
      });
      
      memberIds.push(userId);
      childIds.push(userId);
    }

    // Update family with member IDs
    batch.update(doc(db, 'families', this.familyId), {
      memberIds,
      parentIds,
      childIds
    });

    await batch.commit();
    console.log(`✓ Created ${this.testUsers.length} test users`);
  }

  /**
   * Create test tasks
   */
  private async createTestTasks(config: TestDataConfig): Promise<void> {
    const batch = writeBatch(db);
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit

    const categories = ['chores', 'homework', 'exercise', 'personal', 'other'];
    const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
    
    const taskTemplates = [
      'Clean the kitchen',
      'Do math homework',
      'Take out the trash',
      'Walk the dog',
      'Practice piano',
      'Read for 30 minutes',
      'Organize bedroom',
      'Water the plants',
      'Complete science project',
      'Exercise for 20 minutes',
      'Wash the dishes',
      'Vacuum living room',
      'Study for test',
      'Feed the pets',
      'Make the bed'
    ];

    const childUsers = this.testUsers.filter(u => u.role === 'child');
    const parentUsers = this.testUsers.filter(u => u.role === 'parent');

    console.log(`Creating ${config.numTasks} tasks...`);

    for (let i = 1; i <= config.numTasks; i++) {
      const taskId = `test-task-${Date.now()}-${i}`;
      const isCompleted = i <= config.numCompletedTasks;
      const isOverdue = config.includeOverdue && i % 5 === 0 && !isCompleted;
      const isRecurring = config.includeRecurring && i % 7 === 0;
      
      // Assign tasks to children
      const assignedUser = childUsers[i % childUsers.length];
      const assignedBy = parentUsers[0];
      
      const now = new Date();
      const dueDate = new Date();
      
      if (isOverdue) {
        dueDate.setDate(now.getDate() - Math.floor(Math.random() * 7) - 1);
      } else if (isCompleted) {
        dueDate.setDate(now.getDate() - Math.floor(Math.random() * 3));
      } else {
        dueDate.setDate(now.getDate() + Math.floor(Math.random() * 14));
      }

      const taskData = {
        id: taskId,
        familyId: this.familyId,
        title: `${taskTemplates[i % taskTemplates.length]} #${i}`,
        description: `This is test task ${i} for performance testing. It includes a longer description to simulate real-world usage.`,
        category: categories[i % categories.length],
        assignedTo: assignedUser.id,
        assignedBy: assignedBy.id,
        createdBy: assignedBy.id,
        status: isCompleted ? 'completed' : (i % 10 === 0 ? 'in_progress' : 'pending'),
        completedAt: isCompleted ? Timestamp.fromDate(new Date(now.getTime() - Math.random() * 86400000)) : null,
        completedBy: isCompleted ? assignedUser.id : null,
        requiresPhoto: config.includePhotos && i % 4 === 0,
        photoUrl: config.includePhotos && isCompleted && i % 4 === 0 
          ? 'https://picsum.photos/400/300' 
          : null,
        dueDate: Timestamp.fromDate(dueDate),
        isRecurring,
        recurrencePattern: isRecurring ? {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5],
          endDate: null
        } : null,
        reminderEnabled: i % 3 === 0,
        reminderTime: '09:00',
        priority: priorities[i % priorities.length],
        rewardPoints: Math.floor(Math.random() * 100) + 10,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(doc(db, 'tasks', taskId), taskData);
      
      this.testTasks.push({
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        status: taskData.status as any,
        dueDate: dueDate,
        category: taskData.category,
        priority: taskData.priority
      });

      batchCount++;
      
      // Commit batch if we reach the limit
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`✓ Committed batch of ${batchCount} tasks`);
        batchCount = 0;
      }
    }

    // Commit remaining tasks
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✓ Committed final batch of ${batchCount} tasks`);
    }

    console.log(`✓ Created ${this.testTasks.length} test tasks`);
  }

  /**
   * Generate activity data for realistic testing
   */
  private async generateActivityData(): Promise<void> {
    const batch = writeBatch(db);
    const activities = [];
    
    // Generate some recent activities
    for (let i = 0; i < 20; i++) {
      const activityId = `test-activity-${Date.now()}-${i}`;
      const activityTypes = ['task_completed', 'task_created', 'member_joined', 'task_assigned'];
      const randomUser = this.testUsers[Math.floor(Math.random() * this.testUsers.length)];
      
      const activityData = {
        id: activityId,
        familyId: this.familyId,
        type: activityTypes[i % activityTypes.length],
        userId: randomUser.id,
        userName: randomUser.displayName,
        timestamp: serverTimestamp(),
        metadata: {
          taskTitle: i < this.testTasks.length ? this.testTasks[i].title : 'Sample Task'
        }
      };
      
      batch.set(doc(db, 'activities', activityId), activityData);
      activities.push(activityData);
    }
    
    await batch.commit();
    console.log(`✓ Created ${activities.length} activity records`);
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test tasks
      const tasksQuery = query(collection(db, 'tasks'), where('familyId', '==', this.familyId));
      const taskDocs = await getDocs(tasksQuery);
      
      for (const doc of taskDocs.docs) {
        await deleteDoc(doc.ref);
      }
      console.log(`✓ Deleted ${taskDocs.size} test tasks`);
      
      // Delete test users
      for (const user of this.testUsers) {
        await deleteDoc(doc(db, 'users', user.id));
      }
      console.log(`✓ Deleted ${this.testUsers.length} test users`);
      
      // Delete test family
      await deleteDoc(doc(db, 'families', this.familyId));
      console.log(`✓ Deleted test family`);
      
      // Delete activities
      const activitiesQuery = query(collection(db, 'activities'), where('familyId', '==', this.familyId));
      const activityDocs = await getDocs(activitiesQuery);
      
      for (const doc of activityDocs.docs) {
        await deleteDoc(doc.ref);
      }
      console.log(`✓ Deleted ${activityDocs.size} activity records`);
      
      console.log('✅ Test data cleanup complete!');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Generate a random invite code
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Print test credentials for easy access
   */
  private printTestCredentials(): void {
    console.log('\n📋 TEST CREDENTIALS');
    console.log('==================');
    console.log(`Family ID: ${this.familyId}`);
    console.log(`Invite Code: ${this.inviteCode}`);
    console.log('\nTest Users:');
    
    this.testUsers.forEach(user => {
      console.log(`  ${user.role.toUpperCase()}: ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n💡 Use these credentials to log in and test the app with large datasets');
    console.log('⚠️  Remember to run cleanup when done testing!');
  }
}

// Export for use in testing
export const testDataGenerator = new PerformanceTestDataGenerator();

// CLI interface for running the script
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const config: TestDataConfig = {
    numMembers: parseInt(args[1]) || 10,
    numTasks: parseInt(args[2]) || 100,
    numCompletedTasks: parseInt(args[3]) || 30,
    includeRecurring: args.includes('--recurring'),
    includePhotos: args.includes('--photos'),
    includeOverdue: args.includes('--overdue')
  };
  
  if (command === 'generate') {
    testDataGenerator.generateTestData(config)
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else if (command === 'cleanup') {
    testDataGenerator.cleanupTestData()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  npm run perf:generate [numMembers] [numTasks] [numCompleted] [--recurring] [--photos] [--overdue]');
    console.log('  npm run perf:cleanup');
    console.log('\nExamples:');
    console.log('  npm run perf:generate 10 100 30 --recurring --photos');
    console.log('  npm run perf:generate 15 200 50 --overdue');
    console.log('  npm run perf:cleanup');
  }
}