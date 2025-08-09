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
      console.log('Push notifications using React Native Firebase are not supported in Expo Go');
      console.log('Using Expo Notifications for local notifications only');
      
      // For Expo Go, we'll only use local notifications
      // Push notifications require a development build
      
      this.isInitialized = true;
      console.log('Push notification service initialized (limited mode for Expo Go)');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      // Use Expo's notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      const enabled = finalStatus === 'granted';
      await AsyncStorage.setItem(PUSH_PERMISSION_KEY, enabled ? 'granted' : 'denied');
      
      if (enabled) {
        console.log('Notification permission granted');
      }
      
      return enabled;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    // In Expo Go, we can't get a real FCM token
    // Return a mock token for development
    const mockToken = 'expo-go-mock-token-' + Math.random().toString(36).substr(2, 9);
    this.fcmToken = mockToken;
    await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);
    console.log('Mock FCM token for Expo Go:', mockToken);
    return mockToken;
  }

  async updateUserToken(userId: string) {
    if (!this.fcmToken || !userId) return;

    try {
      // Update user document with mock FCM token
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: this.fcmToken,
        fcmTokenUpdatedAt: new Date(),
        platform: Platform.OS,
        isExpoGo: true, // Flag to indicate this is from Expo Go
      });

      console.log('User mock FCM token updated in Firestore');
    } catch (error) {
      console.error('Error updating user FCM token:', error);
    }
  }

  private setupMessageHandlers() {
    // In Expo Go, we can't handle Firebase messages
    // This is a no-op for now
    console.log('Firebase message handlers not available in Expo Go');
  }

  private async handleForegroundMessage(notification: any) {
    // Show local notification using Expo
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'TypeB',
        body: notification.body || '',
        data: notification.data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  private handleNotificationOpen(data: PushNotificationData) {
    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case 'task_reminder':
        if (data.taskId) {
          console.log('Navigate to task:', data.taskId);
        }
        break;

      case 'task_assigned':
        if (data.taskId) {
          console.log('Navigate to assigned task:', data.taskId);
        }
        break;

      case 'task_completed':
        console.log('Navigate to family dashboard');
        break;

      case 'family_update':
        console.log('Navigate to family screen');
        break;

      default:
        console.log('Navigate to dashboard');
    }
  }

  async subscribeToTopic(topic: string) {
    // Topics not supported in Expo Go
    console.log(`Mock subscribe to topic: ${topic}`);
  }

  async unsubscribeFromTopic(topic: string) {
    // Topics not supported in Expo Go
    console.log(`Mock unsubscribe from topic: ${topic}`);
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
    console.log('Push notification would be sent to user:', userId, notification);
  }

  async sendPushToFamily(familyId: string, notification: {
    title: string;
    body: string;
    data?: PushNotificationData;
  }) {
    // This would typically be done server-side via Cloud Functions
    console.log('Push notification would be sent to family:', familyId, notification);
  }

  async clearToken() {
    try {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      this.fcmToken = null;
      console.log('Mock FCM token cleared');
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export default new PushNotificationService();