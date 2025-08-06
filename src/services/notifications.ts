import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Task, User } from '../types/models';
import { format, addMinutes, isAfter, isBefore, parseISO, setHours, setMinutes } from 'date-fns';
import pushNotificationService from './pushNotifications';

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

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

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
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  async loadScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored) as ScheduledNotification[];
        notifications.forEach(n => {
          this.scheduledNotifications.set(n.id, {
            ...n,
            scheduledFor: new Date(n.scheduledFor),
          });
        });
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  async saveScheduledNotifications() {
    const notifications = Array.from(this.scheduledNotifications.values());
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  async scheduleTaskReminder(task: Task, user: User) {
    if (!this.settings.enabled) return;
    if (!task.dueDate) return; // No due date, no reminders

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return;

    // Cancel existing notifications for this task
    await this.cancelTaskNotifications(task.id);
    
    // For push notifications, we'll rely on Cloud Functions
    // Local notifications are a fallback for immediate reminders
    const now = new Date();
    const timeToDue = task.dueDate.getTime() - now.getTime();
    const minutesToDue = Math.floor(timeToDue / (1000 * 60));
    
    // Only schedule local notifications if due within 24 hours
    // Longer reminders will be handled by Cloud Functions
    if (minutesToDue > 24 * 60) {
      console.log('Task due in more than 24 hours, will use push notifications');
      return;
    }

    // Schedule initial reminder
    const reminderTime = addMinutes(task.dueDate, -this.settings.defaultReminderMinutes);
    
    if (isAfter(reminderTime, new Date())) {
      const adjustedTime = this.adjustForQuietHours(reminderTime);
      await this.scheduleNotification({
        id: `${task.id}_reminder`,
        taskId: task.id,
        type: 'reminder',
        scheduledFor: adjustedTime,
        title: '⏰ Task Reminder',
        body: `"${task.title}" is due in ${this.settings.defaultReminderMinutes} minutes`,
        data: { taskId: task.id, type: 'reminder' },
      });
    }

    // Schedule escalation reminders
    for (let i = 0; i < this.settings.escalationLevels.length; i++) {
      const escalationMinutes = this.settings.escalationLevels[i];
      const escalationTime = addMinutes(task.dueDate, -escalationMinutes);
      
      if (isAfter(escalationTime, new Date())) {
        const adjustedTime = this.adjustForQuietHours(escalationTime);
        await this.scheduleNotification({
          id: `${task.id}_escalation_${i}`,
          taskId: task.id,
          type: 'escalation',
          scheduledFor: adjustedTime,
          title: '🚨 Urgent: Task Due Soon',
          body: `"${task.title}" is due in ${escalationMinutes} minutes!`,
          data: { taskId: task.id, type: 'escalation', level: i },
        });
      }
    }

    // Schedule manager notification if enabled
    if (this.settings.notifyManager && user.role === 'child') {
      const managerAlertTime = addMinutes(task.dueDate, 5); // 5 minutes after due
      await this.scheduleNotification({
        id: `${task.id}_manager`,
        taskId: task.id,
        type: 'manager_alert',
        scheduledFor: managerAlertTime,
        title: '👨‍👩‍👧 Family Alert',
        body: `${user.displayName}'s task "${task.title}" is overdue`,
        data: { taskId: task.id, type: 'manager_alert', userId: user.id },
      });
    }

    await this.saveScheduledNotifications();
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
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
    await this.saveScheduledNotifications();
  }

  async sendTestNotification() {
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
  }

  async updateBadgeCount(count: number) {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getScheduledNotifications(taskId?: string): ScheduledNotification[] {
    const notifications = Array.from(this.scheduledNotifications.values());
    if (taskId) {
      return notifications.filter(n => n.taskId === taskId);
    }
    return notifications;
  }
  
  // Integration with push notifications
  async updateUserPushToken(userId: string) {
    await pushNotificationService.updateUserToken(userId);
  }
  
  async subscribeToFamilyNotifications(familyId: string) {
    await pushNotificationService.subscribeToFamily(familyId);
  }
  
  async unsubscribeFromFamilyNotifications(familyId: string) {
    await pushNotificationService.unsubscribeFromFamily(familyId);
  }
  
  isPushReady(): boolean {
    return pushNotificationService.isReady();
  }
}

export default new NotificationService();