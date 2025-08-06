import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { db } from './firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// Storage keys
const FCM_TOKEN_KEY = 'fcm_token';
const PUSH_PERMISSION_KEY = 'push_permission_status';

// Topic names
const TOPIC_PREFIX = 'family_';
const TOPIC_ALL_USERS = 'all_users';

export interface PushNotificationData {
  type: 'task_reminder' | 'task_assigned' | 'task_completed' | 'family_update' | 'system';
  taskId?: string;
  familyId?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if push notifications are supported
      const isSupported = await this.checkPushSupport();
      if (!isSupported) {
        console.log('Push notifications not supported on this device');
        return;
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Subscribe to default topics
      await this.subscribeToDefaultTopics();

      this.isInitialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async checkPushSupport(): Promise<boolean> {
    // Push notifications require a physical device
    if (!Platform.OS || Platform.OS === 'web') {
      return false;
    }

    // Check if messaging is available
    try {
      const isSupported = await messaging().isSupported();
      return isSupported;
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      // Save permission status
      await AsyncStorage.setItem(PUSH_PERMISSION_KEY, enabled ? 'granted' : 'denied');

      if (enabled) {
        console.log('Push notification permission granted');
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Check if we have a saved token
      const savedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (savedToken) {
        this.fcmToken = savedToken;
        return savedToken;
      }

      // Get new token
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('FCM token obtained:', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async updateUserToken(userId: string) {
    if (!this.fcmToken || !userId) return;

    try {
      // Update user document with FCM token
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: this.fcmToken,
        fcmTokenUpdatedAt: new Date(),
        platform: Platform.OS,
      });

      console.log('User FCM token updated in Firestore');
    } catch (error) {
      console.error('Error updating user FCM token:', error);
    }
  }

  private setupMessageHandlers() {
    // Handle messages received while app is in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app from background state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification (killed state):', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      // TODO: Update token in user profile
    });
  }

  private async handleForegroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const { notification, data } = remoteMessage;

    if (!notification) return;

    // Show local notification using Expo
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'TypeB',
        body: notification.body || '',
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  private handleNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const data = remoteMessage.data as PushNotificationData;

    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case 'task_reminder':
        if (data.taskId) {
          // TODO: Navigate to task detail
          console.log('Navigate to task:', data.taskId);
        }
        break;

      case 'task_assigned':
        if (data.taskId) {
          // TODO: Navigate to task detail
          console.log('Navigate to assigned task:', data.taskId);
        }
        break;

      case 'task_completed':
        // TODO: Navigate to family dashboard
        console.log('Navigate to family dashboard');
        break;

      case 'family_update':
        // TODO: Navigate to family screen
        console.log('Navigate to family screen');
        break;

      default:
        // TODO: Navigate to dashboard
        console.log('Navigate to dashboard');
    }
  }

  async subscribeToTopic(topic: string) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  async unsubscribeFromTopic(topic: string) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  async subscribeToFamily(familyId: string) {
    if (!familyId) return;
    await this.subscribeToTopic(`${TOPIC_PREFIX}${familyId}`);
  }

  async unsubscribeFromFamily(familyId: string) {
    if (!familyId) return;
    await this.unsubscribeFromTopic(`${TOPIC_PREFIX}${familyId}`);
  }

  private async subscribeToDefaultTopics() {
    // Subscribe to all users topic for system notifications
    await this.subscribeToTopic(TOPIC_ALL_USERS);
  }

  async sendPushToUser(userId: string, notification: {
    title: string;
    body: string;
    data?: PushNotificationData;
  }) {
    // This would typically be done server-side via Cloud Functions
    // Placeholder for client-side reference
    console.log('Push notification would be sent to user:', userId, notification);
  }

  async sendPushToFamily(familyId: string, notification: {
    title: string;
    body: string;
    data?: PushNotificationData;
  }) {
    // This would typically be done server-side via Cloud Functions
    // Placeholder for client-side reference
    console.log('Push notification would be sent to family:', familyId, notification);
  }

  async clearToken() {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      this.fcmToken = null;
      console.log('FCM token cleared');
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  isReady(): boolean {
    return this.isInitialized && !!this.fcmToken;
  }
}

export default new PushNotificationService();