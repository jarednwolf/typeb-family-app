import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Task, User } from '../types/models';
import { format, addMinutes, isAfter, isBefore, parseISO, setHours, setMinutes } from 'date-fns';
import pushNotificationService from './pushNotifications';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Storage keys
const NOTIFICATION_PERMISSION_KEY = 'notification_permission_status';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Rate limiting constants
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_NOTIFICATIONS_PER_WINDOW = 10;
const MAX_TEST_NOTIFICATIONS_PER_DAY = 3;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  defaultReminderMinutes: 30,
  escalationLevels: [15, 5], // Minutes before due
  notifyManager: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
  soundEnabled: true,
  vibrationEnabled: true,
};

export interface NotificationSettings {
  enabled: boolean;
  defaultReminderMinutes: number;
  escalationLevels: number[];
  notifyManager: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  taskId: string;
  type: 'reminder' | 'escalation' | 'manager_alert';
  scheduledFor: Date;
  notificationId?: string;
}

// Validation helpers
const validateNotificationContent = (content: { title?: string; body?: string }): void => {
  if (content.title && content.title.length > 100) {
    throw new Error('Notification title too long (max 100 characters)');
  }
  if (content.body && content.body.length > 500) {
    throw new Error('Notification body too long (max 500 characters)');
  }
  
  // Check for potential injection attempts
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  const combinedContent = `${content.title || ''} ${content.body || ''}`;
  for (const pattern of dangerousPatterns) {
    if (pattern.test(combinedContent)) {
      throw new Error('Invalid notification content');
    }
  }
};

const sanitizeNotificationContent = (content: string): string => {
  // Remove any HTML tags
  return content.replace(/<[^>]*>/g, '').trim();
};

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();

  async initialize() {
    // Load settings
    await this.loadSettings();
    
    // Load scheduled notifications
    await this.loadScheduledNotifications();
    
    // Set up notification listeners
    this.setupListeners();
    
    // Check and request permissions
    await this.checkPermissions();
    
    // Initialize push notifications
    await pushNotificationService.initialize();
  }

  private setupListeners() {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.taskId) {
        // TODO: Navigate to task detail screen
        console.log('Navigate to task:', data.taskId);
      }
    });
  }

  async checkPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Save permission status
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, finalStatus);

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async saveSettings(settings: Partial<NotificationSettings>) {
    // Validate settings
    if (settings.defaultReminderMinutes !== undefined) {
      if (settings.defaultReminderMinutes < 5 || settings.defaultReminderMinutes > 1440) {
        throw new Error('Invalid reminder time (must be between 5 minutes and 24 hours)');
      }
    }
    
    if (settings.escalationLevels) {
      if (!Array.isArray(settings.escalationLevels) || settings.escalationLevels.length > 5) {
        throw new Error('Invalid escalation levels');
      }
      for (const level of settings.escalationLevels) {
        if (typeof level !== 'number' || level < 1 || level > 60) {
          throw new Error('Escalation levels must be between 1 and 60 minutes');
        }
      }
    }
    
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  async loadScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        if (Array.isArray(notifications)) {
          notifications.forEach(n => {
            this.scheduledNotifications.set(n.id, {
              ...n,
              scheduledFor: new Date(n.scheduledFor),
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  async saveScheduledNotifications() {
    const notifications = Array.from(this.scheduledNotifications.values());
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  private async checkRateLimit(userId: string, action: string): Promise<void> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    
    if (validTimestamps.length >= MAX_NOTIFICATIONS_PER_WINDOW) {
      throw new Error('Too many notification requests. Please try again later.');
    }
    
    validTimestamps.push(now);
    this.rateLimitMap.set(key, validTimestamps);
  }

  private async validateTaskAccess(taskId: string, userId: string): Promise<Task> {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
    
    // User must be assigned to the task or be a family manager
    if (task.assignedTo !== userId) {
      // Check if user is a family manager
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (userData.role !== 'parent' || userData.familyId !== task.familyId) {
        throw new Error('Unauthorized to schedule notifications for this task');
      }
    }
    
    return task;
  }

  async scheduleTaskReminder(task: Task, user: User) {
    if (!this.settings.enabled) return;
    if (!task.dueDate) return; // No due date, no reminders

    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== user.id) {
      throw new Error('Authentication required');
    }

    // Check rate limiting
    await this.checkRateLimit(user.id, 'schedule_reminder');

    // Validate task access
    await this.validateTaskAccess(task.id, user.id);

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return;

    // Cancel existing notifications for this task
    await this.cancelTaskNotifications(task.id);
    
    // Convert dueDate to Date object if it's a string
    const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
    
    // For push notifications, we'll rely on Cloud Functions
    // Local notifications are a fallback for immediate reminders
    const now = new Date();
    const timeToDue = dueDate.getTime() - now.getTime();
    const minutesToDue = Math.floor(timeToDue / (1000 * 60));
    
    // Only schedule local notifications if due within 24 hours
    // Longer reminders will be handled by Cloud Functions
    if (minutesToDue > 24 * 60) {
      console.log('Task due in more than 24 hours, will use push notifications');
      return;
    }

    // Validate and sanitize task title
    const sanitizedTitle = sanitizeNotificationContent(task.title);
    validateNotificationContent({ title: sanitizedTitle });

    // Schedule initial reminder
    const reminderTime = addMinutes(dueDate, -this.settings.defaultReminderMinutes);
    
    if (isAfter(reminderTime, new Date())) {
      const adjustedTime = this.adjustForQuietHours(reminderTime);
      await this.scheduleNotification({
        id: `${task.id}_reminder`,
        taskId: task.id,
        type: 'reminder',
        scheduledFor: adjustedTime,
        title: '⏰ Task Reminder',
        body: `"${sanitizedTitle}" is due in ${this.settings.defaultReminderMinutes} minutes`,
        data: { taskId: task.id, type: 'reminder' },
      });
    }

    // Schedule escalation reminders
    for (let i = 0; i < this.settings.escalationLevels.length; i++) {
      const escalationMinutes = this.settings.escalationLevels[i];
      const escalationTime = addMinutes(dueDate, -escalationMinutes);
      
      if (isAfter(escalationTime, new Date())) {
        const adjustedTime = this.adjustForQuietHours(escalationTime);
        await this.scheduleNotification({
          id: `${task.id}_escalation_${i}`,
          taskId: task.id,
          type: 'escalation',
          scheduledFor: adjustedTime,
          title: '🚨 Urgent: Task Due Soon',
          body: `"${sanitizedTitle}" is due in ${escalationMinutes} minutes!`,
          data: { taskId: task.id, type: 'escalation', level: i },
        });
      }
    }

    // Schedule manager notification if enabled
    if (this.settings.notifyManager && user.role === 'child') {
      const managerAlertTime = addMinutes(dueDate, 5); // 5 minutes after due
      await this.scheduleNotification({
        id: `${task.id}_manager`,
        taskId: task.id,
        type: 'manager_alert',
        scheduledFor: managerAlertTime,
        title: '👨‍👩‍👧 Family Alert',
        body: `${user.displayName}'s task "${sanitizedTitle}" is overdue`,
        data: { taskId: task.id, type: 'manager_alert', userId: user.id },
      });
    }

    await this.saveScheduledNotifications();
    
    // Log notification scheduling in Firestore for audit
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', user.id);
      transaction.update(userRef, {
        lastNotificationScheduled: serverTimestamp(),
      });
    });
  }

  private adjustForQuietHours(date: Date): Date {
    if (!this.settings.quietHours.enabled) return date;

    const { start, end } = this.settings.quietHours;
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const quietStart = setMinutes(setHours(date, startHour), startMinute);
    const quietEnd = setMinutes(setHours(date, endHour), endMinute);

    // Handle overnight quiet hours
    if (quietEnd < quietStart) {
      if (date >= quietStart || date < quietEnd) {
        // In quiet hours, schedule for end of quiet hours
        return quietEnd;
      }
    } else {
      if (date >= quietStart && date < quietEnd) {
        // In quiet hours, schedule for end of quiet hours
        return quietEnd;
      }
    }

    return date;
  }

  private async scheduleNotification(params: {
    id: string;
    taskId: string;
    type: 'reminder' | 'escalation' | 'manager_alert';
    scheduledFor: Date;
    title: string;
    body: string;
    data: any;
  }) {
    // Validate content before scheduling
    validateNotificationContent({ title: params.title, body: params.body });
    
    const trigger: Notifications.DateTriggerInput = {
      date: params.scheduledFor,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
        sound: this.settings.soundEnabled,
        priority: params.type === 'escalation' ? 'high' : 'default',
      },
      trigger,
    });

    // Store scheduled notification
    this.scheduledNotifications.set(params.id, {
      id: params.id,
      taskId: params.taskId,
      type: params.type,
      scheduledFor: params.scheduledFor,
      notificationId,
    });
  }

  async cancelTaskNotifications(taskId: string) {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Validate task access before canceling
    await this.validateTaskAccess(taskId, currentUser.uid);

    const toCancel: string[] = [];
    
    this.scheduledNotifications.forEach((notification, id) => {
      if (notification.taskId === taskId) {
        toCancel.push(id);
        if (notification.notificationId) {
          Notifications.cancelScheduledNotificationAsync(notification.notificationId);
        }
      }
    });

    toCancel.forEach(id => this.scheduledNotifications.delete(id));
    await this.saveScheduledNotifications();
  }

  async cancelAllNotifications() {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
    await this.saveScheduledNotifications();
  }

  async sendTestNotification() {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check daily rate limit for test notifications
    const today = new Date().toDateString();
    const testKey = `${currentUser.uid}:test:${today}`;
    const testCount = this.rateLimitMap.get(testKey)?.[0] || 0;
    
    if (testCount >= MAX_TEST_NOTIFICATIONS_PER_DAY) {
      throw new Error('Daily test notification limit reached');
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Test Notification',
        body: 'Notifications are working correctly!',
        data: { test: true },
      },
      trigger: {
        seconds: 2,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      } as Notifications.TimeIntervalTriggerInput,
    });
    
    // Update test notification count
    this.rateLimitMap.set(testKey, [testCount + 1]);
  }

  async updateBadgeCount(count: number) {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Validate count
    if (typeof count !== 'number' || count < 0 || count > 999) {
      throw new Error('Invalid badge count');
    }

    if (Platform.OS === 'ios' && Notifications.setBadgeCountAsync) {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getScheduledNotifications(taskId?: string): ScheduledNotification[] {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const notifications = Array.from(this.scheduledNotifications.values());
    if (taskId) {
      return notifications.filter(n => n.taskId === taskId);
    }
    return notifications;
  }
  
  // Integration with push notifications
  async updateUserPushToken(userId: string) {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Authentication required');
    }

    await pushNotificationService.updateUserToken(userId);
  }
  
  async subscribeToFamilyNotifications(familyId: string) {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Verify user is member of the family
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    if (userData.familyId !== familyId) {
      throw new Error('Not a member of this family');
    }

    await pushNotificationService.subscribeToFamily(familyId);
  }
  
  async unsubscribeFromFamilyNotifications(familyId: string) {
    // Verify authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    await pushNotificationService.unsubscribeFromFamily(familyId);
  }
  
  isPushReady(): boolean {
    return pushNotificationService.isReady();
  }
}

export default new NotificationService();