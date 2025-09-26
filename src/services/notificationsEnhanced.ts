import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  taskReminders: boolean;
  familyActivity: boolean;
  achievements: boolean;
  dailyDigest: boolean;
  quietHoursStart?: string; // e.g., "21:00"
  quietHoursEnd?: string; // e.g., "07:00"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: Date | { hour: number; minute: number; repeats: boolean };
  category?: 'task' | 'reminder' | 'achievement' | 'family';
}

class NotificationsService {
  private static instance: NotificationsService;
  private pushToken: string | null = null;
  private preferences: NotificationPreferences = {
    taskReminders: true,
    familyActivity: true,
    achievements: true,
    dailyDigest: true,
    soundEnabled: true,
    vibrationEnabled: true,
  };
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  /**
   * Initialize notifications and listeners
   */
  private async initializeNotifications() {
    try {
      // Load preferences from storage
      await this.loadPreferences();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Request permissions and get token
      await this.registerForPushNotifications();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        
        // Log to analytics
        this.logNotificationEvent('received', notification);
      }
    );

    // Handle notification interactions
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification interaction:', response);
        
        // Handle the interaction based on the notification data
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your project ID
      })).data;

      this.pushToken = token;

      // Configure Android-specific settings
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Save token to Firebase
      await this.saveTokenToFirebase(token);

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Save push token to Firebase for the current user
   */
  private async saveTokenToFirebase(token: string): Promise<void> {
    try {
      // This would typically update the user's document with the token
      const userId = await AsyncStorage.getItem('@current_user_id');
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          pushToken: token,
          pushTokenUpdatedAt: new Date().toISOString(),
          deviceType: Platform.OS,
        });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      // Check if notifications are enabled
      if (!this.areNotificationsEnabled()) {
        throw new Error('Notifications are disabled');
      }

      // Check quiet hours
      if (this.isInQuietHours()) {
        console.log('Skipping notification during quiet hours');
        return '';
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: this.preferences.soundEnabled,
          badge: 1,
          categoryIdentifier: notification.category,
        },
        trigger: notification.trigger,
      });

      // Log scheduled notification
      await this.logScheduledNotification(notification, id);

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Schedule task reminder notification
   */
  async scheduleTaskReminder(
    taskId: string,
    taskTitle: string,
    reminderTime: Date
  ): Promise<void> {
    if (!this.preferences.taskReminders) {
      return;
    }

    await this.scheduleNotification({
      id: `task-${taskId}`,
      title: '📋 Task Reminder',
      body: `Don't forget to complete: ${taskTitle}`,
      data: { taskId, type: 'task_reminder' },
      trigger: reminderTime,
      category: 'task',
    });
  }

  /**
   * Send family activity notification
   */
  async sendFamilyActivityNotification(
    activityType: string,
    actorName: string,
    details: string
  ): Promise<void> {
    if (!this.preferences.familyActivity) {
      return;
    }

    const titles: Record<string, string> = {
      task_completed: '✅ Task Completed',
      task_assigned: '📝 New Task Assigned',
      achievement_unlocked: '🏆 Achievement Unlocked',
      photo_uploaded: '📸 Photo Submitted',
      points_earned: '⭐ Points Earned',
    };

    await this.scheduleNotification({
      id: `activity-${Date.now()}`,
      title: titles[activityType] || 'Family Activity',
      body: `${actorName} ${details}`,
      data: { type: 'family_activity', activityType },
      trigger: null as any, // Immediate
      category: 'family',
    });
  }

  /**
   * Schedule daily digest notification
   */
  async scheduleDailyDigest(hour: number = 19, minute: number = 0): Promise<void> {
    if (!this.preferences.dailyDigest) {
      return;
    }

    await this.scheduleNotification({
      id: 'daily-digest',
      title: '📊 Daily Family Summary',
      body: 'Check out what your family accomplished today!',
      data: { type: 'daily_digest' },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
      category: 'family',
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();

    // Update notification settings based on preferences
    if (!preferences.taskReminders) {
      // Cancel all task reminder notifications
      const scheduled = await this.getScheduledNotifications();
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'task_reminder') {
          await this.cancelNotification(notification.identifier);
        }
      }
    }

    if (preferences.dailyDigest === false) {
      await this.cancelNotification('daily-digest');
    } else if (preferences.dailyDigest === true) {
      await this.scheduleDailyDigest();
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  /**
   * Check if notifications are enabled
   */
  private areNotificationsEnabled(): boolean {
    return this.pushToken !== null;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHoursStart || !this.preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = this.preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Handle notification response/interaction
   */
  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { notification } = response;
    const data = notification.request.content.data;

    switch (data?.type) {
      case 'task_reminder':
        // Navigate to task details
        try {
          const { default: RootNavigation } = await import('../utils/rootNavigation');
          RootNavigation.navigate('Tasks', {
            screen: 'TaskDetail',
            params: { taskId: data.taskId },
          });
        } catch (e) {
          console.log('Navigate to task:', data.taskId);
        }
        break;

      case 'family_activity':
        try {
          const { default: RootNavigation } = await import('../utils/rootNavigation');
          RootNavigation.navigate('Dashboard');
        } catch (e) {
          console.log('Navigate to activity feed');
        }
        break;

      case 'daily_digest':
        try {
          const { default: RootNavigation } = await import('../utils/rootNavigation');
          RootNavigation.navigate('Dashboard');
        } catch (e) {
          console.log('Navigate to dashboard');
        }
        break;

      default:
        console.log('Unknown notification type:', data?.type);
    }

    // Log interaction
    this.logNotificationEvent('interacted', notification);
  }

  /**
   * Log notification event for analytics
   */
  private async logNotificationEvent(
    event: string,
    notification: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'notificationEvents'), {
        event,
        notificationId: notification.request?.identifier,
        title: notification.request?.content?.title,
        category: notification.request?.content?.categoryIdentifier,
        timestamp: new Date().toISOString(),
        userId: await AsyncStorage.getItem('@current_user_id'),
      });
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  /**
   * Log scheduled notification
   */
  private async logScheduledNotification(
    notification: ScheduledNotification,
    scheduledId: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'scheduledNotifications'), {
        scheduledId,
        ...notification,
        scheduledAt: new Date().toISOString(),
        userId: await AsyncStorage.getItem('@current_user_id'),
      });
    } catch (error) {
      console.error('Error logging scheduled notification:', error);
    }
  }

  /**
   * Save preferences to AsyncStorage
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@notification_preferences',
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  /**
   * Load preferences from AsyncStorage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default NotificationsService.getInstance();
