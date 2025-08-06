import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import notificationService from './notifications';
import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Task } from '../types/models';

// Task names
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';
const BACKGROUND_SYNC_TASK = 'background-sync-task';

// Storage keys
const LAST_SYNC_KEY = 'last_background_sync';
const BACKGROUND_TASK_ENABLED_KEY = 'background_tasks_enabled';

// Define background notification task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('Background notification task running...');
    
    // Get current user ID from storage
    const userIdString = await AsyncStorage.getItem('persist:root');
    if (!userIdString) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const persistedData = JSON.parse(userIdString);
    const authData = JSON.parse(persistedData.auth);
    const userId = authData?.user?.uid;
    
    if (!userId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Check for upcoming tasks
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', userId),
      where('status', '==', 'pending'),
      where('dueDate', '>=', Timestamp.fromDate(now)),
      where('dueDate', '<=', Timestamp.fromDate(in24Hours))
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks: Task[] = [];
    
    tasksSnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    
    // Schedule local notifications for tasks
    let scheduledCount = 0;
    for (const task of tasks) {
      if (task.dueDate) {
        // Check if notification already scheduled
        const scheduled = notificationService.getScheduledNotifications(task.id);
        if (scheduled.length === 0) {
          // Schedule notification
          await notificationService.scheduleTaskReminder(
            task,
            { id: userId, role: 'member' } as any
          );
          scheduledCount++;
        }
      }
    }
    
    console.log(`Background task scheduled ${scheduledCount} notifications`);
    
    // Update last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    
    return scheduledCount > 0 
      ? BackgroundFetch.BackgroundFetchResult.NewData 
      : BackgroundFetch.BackgroundFetchResult.NoData;
      
  } catch (error) {
    console.error('Background notification task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Define background sync task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Background sync task running...');
    
    // This task would sync any offline changes
    // For now, we'll just update the last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundTaskService {
  private isRegistered = false;

  async initialize() {
    try {
      // Check if background tasks are supported
      if (Platform.OS === 'web') {
        console.log('Background tasks not supported on web');
        return;
      }

      // Check if tasks are already registered
      const isNotificationTaskRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_TASK
      );
      const isSyncTaskRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK
      );

      if (isNotificationTaskRegistered && isSyncTaskRegistered) {
        this.isRegistered = true;
        console.log('Background tasks already registered');
        return;
      }

      // Register background fetch
      await this.registerBackgroundTasks();
    } catch (error) {
      console.error('Error initializing background tasks:', error);
    }
  }

  async registerBackgroundTasks() {
    try {
      // Register notification task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Register sync task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 60 * 30, // 30 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isRegistered = true;
      await AsyncStorage.setItem(BACKGROUND_TASK_ENABLED_KEY, 'true');
      
      console.log('Background tasks registered successfully');
    } catch (error) {
      console.error('Error registering background tasks:', error);
    }
  }

  async unregisterBackgroundTasks() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      
      this.isRegistered = false;
      await AsyncStorage.setItem(BACKGROUND_TASK_ENABLED_KEY, 'false');
      
      console.log('Background tasks unregistered');
    } catch (error) {
      console.error('Error unregistering background tasks:', error);
    }
  }

  async getStatus(): Promise<{
    isRegistered: boolean;
    lastSync: Date | null;
    isEnabled: boolean;
  }> {
    try {
      const lastSyncString = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const isEnabledString = await AsyncStorage.getItem(BACKGROUND_TASK_ENABLED_KEY);
      
      return {
        isRegistered: this.isRegistered,
        lastSync: lastSyncString ? new Date(lastSyncString) : null,
        isEnabled: isEnabledString === 'true',
      };
    } catch (error) {
      console.error('Error getting background task status:', error);
      return {
        isRegistered: false,
        lastSync: null,
        isEnabled: false,
      };
    }
  }

  async setEnabled(enabled: boolean) {
    if (enabled) {
      await this.registerBackgroundTasks();
    } else {
      await this.unregisterBackgroundTasks();
    }
  }

  // iOS specific - set minimum background fetch interval
  async setMinimumBackgroundFetchInterval() {
    if (Platform.OS === 'ios') {
      await BackgroundFetch.setMinimumIntervalAsync(60 * 15); // 15 minutes
    }
  }

  // Get background fetch status
  async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status;
    } catch (error) {
      console.error('Error getting background fetch status:', error);
      return null;
    }
  }
}

export default new BackgroundTaskService();