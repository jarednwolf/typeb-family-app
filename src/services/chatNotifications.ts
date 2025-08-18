/**
 * Chat Notification Service
 * Handles push notifications for chat messages with family-safe filtering
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ChatMessage, ChatNotificationSettings } from '../types/chat';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get push notification token
 */
export const getNotificationToken = async (): Promise<string | null> => {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

/**
 * Save user's notification settings
 */
export const saveNotificationSettings = async (
  userId: string,
  settings: ChatNotificationSettings
): Promise<void> => {
  try {
    await setDoc(
      doc(db, 'userSettings', userId),
      {
        chatNotifications: settings,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

/**
 * Get user's notification settings
 */
export const getNotificationSettings = async (
  userId: string
): Promise<ChatNotificationSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'userSettings', userId));
    if (settingsDoc.exists()) {
      return settingsDoc.data().chatNotifications || getDefaultSettings();
    }
    return getDefaultSettings();
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Get default notification settings
 */
const getDefaultSettings = (): ChatNotificationSettings => ({
  enabled: true,
  mentionsOnly: false,
  parentsOnly: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
  vibrationEnabled: true,
});

/**
 * Check if current time is within quiet hours
 */
const isQuietHours = (settings: ChatNotificationSettings): boolean => {
  if (!settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
};

/**
 * Schedule a chat notification
 */
export const scheduleChatNotification = async (
  message: ChatMessage,
  recipientId: string,
  recipientName: string
): Promise<void> => {
  try {
    // Get recipient's notification settings
    const settings = await getNotificationSettings(recipientId);
    
    // Check if notifications are enabled
    if (!settings.enabled) {
      return;
    }
    
    // Check quiet hours
    if (isQuietHours(settings)) {
      return;
    }
    
    // Check if only parent messages should trigger notifications
    if (settings.parentsOnly && message.senderRole !== 'parent') {
      return;
    }
    
    // Check if only mentions should trigger notifications
    if (settings.mentionsOnly && !message.text?.includes(`@${recipientName}`)) {
      return;
    }
    
    // Filter message content for safety
    const safeContent = filterMessageContent(message);
    
    // Create notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: `${message.senderName}`,
      body: safeContent,
      data: {
        messageId: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        type: 'chat_message',
      },
      sound: settings.soundEnabled,
      badge: 1,
      categoryIdentifier: 'chat_message',
    };
    
    // Add vibration pattern for Android
    if (Platform.OS === 'android' && settings.vibrationEnabled) {
      notificationContent.vibrate = [0, 250, 250, 250];
    }
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error scheduling chat notification:', error);
  }
};

/**
 * Filter message content for safe display in notifications
 */
const filterMessageContent = (message: ChatMessage): string => {
  switch (message.type) {
    case 'text':
      // Truncate long messages
      const text = message.text || '';
      if (text.length > 100) {
        return text.substring(0, 97) + '...';
      }
      return text;
      
    case 'voice':
      return '🎤 Voice message';
      
    case 'image':
      return '📷 Photo';
      
    case 'system':
      return message.text || 'System message';
      
    default:
      return 'New message';
  }
};

/**
 * Clear chat notifications for a specific chat
 */
export const clearChatNotifications = async (chatId: string): Promise<void> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of notifications) {
      if (notification.content.data?.chatId === chatId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    // Also clear presented notifications
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presentedNotifications) {
      if (notification.request.content.data?.chatId === chatId) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      }
    }
  } catch (error) {
    console.error('Error clearing chat notifications:', error);
  }
};

/**
 * Update badge count
 */
export const updateBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
};

/**
 * Handle notification response (when user taps on notification)
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  navigation: any
): void => {
  const { data } = response.notification.request.content;
  
  if (data?.type === 'chat_message') {
    // Navigate to chat screen
    navigation.navigate('Chat', {
      chatId: data.chatId,
      messageId: data.messageId,
    });
  }
};

/**
 * Register notification categories for interactive notifications
 */
export const registerNotificationCategories = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('chat_message', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        textInput: {
          placeholder: 'Type your reply...',
          submitButtonTitle: 'Send',
        },
      },
      {
        identifier: 'react',
        buttonTitle: '👍',
      },
      {
        identifier: 'view',
        buttonTitle: 'View',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }
};

/**
 * Send notification for moderation action
 */
export const sendModerationNotification = async (
  userId: string,
  messageApproved: boolean,
  moderatorName: string
): Promise<void> => {
  try {
    const title = messageApproved ? 'Message Approved' : 'Message Removed';
    const body = messageApproved
      ? `Your message has been approved by ${moderatorName}`
      : `Your message was removed by ${moderatorName} for violating chat guidelines`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'moderation',
          approved: messageApproved,
        },
        sound: true,
        categoryIdentifier: 'moderation',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending moderation notification:', error);
  }
};

/**
 * Send notification for @mention
 */
export const sendMentionNotification = async (
  mentionedUserId: string,
  message: ChatMessage
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${message.senderName} mentioned you`,
        body: filterMessageContent(message),
        data: {
          type: 'mention',
          messageId: message.id,
          chatId: message.chatId,
        },
        sound: true,
        badge: 1,
        categoryIdentifier: 'mention',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending mention notification:', error);
  }
};

/**
 * Send celebration notification
 */
export const sendCelebrationNotification = async (
  familyName: string,
  celebrationType: string,
  celebrationMessage: string
): Promise<void> => {
  try {
    const emojis = {
      task_completed: '✅',
      milestone_reached: '🏆',
      achievement_unlocked: '🌟',
      streak_maintained: '🔥',
    };
    
    const emoji = emojis[celebrationType as keyof typeof emojis] || '🎉';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${familyName} Celebration!`,
        body: celebrationMessage,
        data: {
          type: 'celebration',
          celebrationType,
        },
        sound: true,
        categoryIdentifier: 'celebration',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending celebration notification:', error);
  }
};

/**
 * Initialize notification listeners
 */
export const initializeNotificationListeners = (navigation: any): {
  notificationListener: Notifications.Subscription;
  responseListener: Notifications.Subscription;
} => {
  // Handle notifications when app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      // You can show an in-app alert here if needed
    }
  );
  
  // Handle notification interactions
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      handleNotificationResponse(response, navigation);
    }
  );
  
  return {
    notificationListener,
    responseListener,
  };
};

/**
 * Clean up notification listeners
 */
export const cleanupNotificationListeners = (listeners: {
  notificationListener: Notifications.Subscription;
  responseListener: Notifications.Subscription;
}): void => {
  listeners.notificationListener.remove();
  listeners.responseListener.remove();
};