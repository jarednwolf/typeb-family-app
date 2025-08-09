// Temporarily mocked version to avoid ExpoTaskManager errors
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const LAST_SYNC_KEY = 'last_background_sync';
const BACKGROUND_TASK_ENABLED_KEY = 'background_tasks_enabled';

class BackgroundTaskService {
  private isRegistered = false;

  async initialize() {
    try {
      // Check if background tasks are supported
      if (Platform.OS === 'web') {
        console.log('Background tasks not supported on web');
        return;
      }

      console.log('Background tasks temporarily disabled for development');
      // Background tasks will be enabled in production build
    } catch (error) {
      console.error('Error initializing background tasks:', error);
    }
  }

  async registerBackgroundTasks() {
    try {
      console.log('Background task registration skipped (development mode)');
      this.isRegistered = false;
      await AsyncStorage.setItem(BACKGROUND_TASK_ENABLED_KEY, 'false');
    } catch (error) {
      console.error('Error registering background tasks:', error);
    }
  }

  async unregisterBackgroundTasks() {
    try {
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
      console.log('Background fetch interval configuration skipped (development mode)');
    }
  }

  // Get background fetch status
  async getBackgroundFetchStatus(): Promise<any> {
    try {
      return null; // Mocked for development
    } catch (error) {
      console.error('Error getting background fetch status:', error);
      return null;
    }
  }
}

export default new BackgroundTaskService();