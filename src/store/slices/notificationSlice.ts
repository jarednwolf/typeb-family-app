/**
 * Notification Redux slice
 * Manages in-app notifications, push notification settings, and notification history
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationType } from '../../types/models';
import notificationService from '../../services/notifications';
import pushNotificationService from '../../services/pushNotifications';
import { toISOString } from '../../utils/dateHelpers';

// Serializable version of Notification for Redux
interface SerializedNotification {
  id: string;
  userId: string;
  familyId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Notification settings
interface NotificationSettings {
  enabled: boolean;
  taskReminders: boolean;
  taskAssignments: boolean;
  taskCompletions: boolean;
  familyUpdates: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationState {
  notifications: SerializedNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  pushToken: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  hasPermission: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    enabled: true,
    taskReminders: true,
    taskAssignments: true,
    taskCompletions: true,
    familyUpdates: true,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  pushToken: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  hasPermission: false,
};

// Helper function to serialize notification
const serializeNotification = (notification: Notification): SerializedNotification => {
  return {
    ...notification,
    createdAt: toISOString(notification.createdAt) || '',
    expiresAt: toISOString(notification.expiresAt) || undefined,
  };
};

// Async thunks
export const requestNotificationPermission = createAsyncThunk(
  'notifications/requestPermission',
  async () => {
    const hasPermission = await notificationService.checkPermissions();
    let token: string | null = null;
    
    if (hasPermission) {
      token = await pushNotificationService.getFCMToken();
    }
    
    return { granted: hasPermission, token };
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: Partial<NotificationSettings>) => {
    await notificationService.saveSettings(settings);
    return settings;
  }
);

export const scheduleTaskReminder = createAsyncThunk(
  'notifications/scheduleReminder',
  async ({ task, user }: { task: any; user: any }) => {
    await notificationService.scheduleTaskReminder(task, user);
    return { taskId: task.id, scheduledAt: new Date().toISOString() };
  }
);

export const cancelTaskReminder = createAsyncThunk(
  'notifications/cancelReminder',
  async (taskId: string) => {
    await notificationService.cancelTaskNotifications(taskId);
    return taskId;
  }
);

export const sendTestNotification = createAsyncThunk(
  'notifications/sendTest',
  async () => {
    await notificationService.sendTestNotification();
    return true;
  }
);

export const updatePushToken = createAsyncThunk(
  'notifications/updatePushToken',
  async (userId: string) => {
    await notificationService.updateUserPushToken(userId);
    const token = pushNotificationService.getToken();
    return token;
  }
);

export const subscribeToFamily = createAsyncThunk(
  'notifications/subscribeToFamily',
  async (familyId: string) => {
    await notificationService.subscribeToFamilyNotifications(familyId);
    return familyId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const serialized = serializeNotification(action.payload);
      state.notifications.unshift(serialized);
      if (!serialized.read) {
        state.unreadCount++;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount--;
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    updateNotification: (state, action: PayloadAction<Notification>) => {
      const serialized = serializeNotification(action.payload);
      const index = state.notifications.findIndex(n => n.id === serialized.id);
      if (index !== -1) {
        const wasUnread = !state.notifications[index].read;
        const isNowRead = serialized.read;
        if (wasUnread && isNowRead) {
          state.unreadCount--;
        } else if (!wasUnread && !isNowRead) {
          state.unreadCount++;
        }
        state.notifications[index] = serialized;
      }
    },
    setPushToken: (state, action: PayloadAction<string | null>) => {
      state.pushToken = action.payload;
    },
    setHasPermission: (state, action: PayloadAction<boolean>) => {
      state.hasPermission = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastFetchedAt = null;
    },
    setSettings: (state, action: PayloadAction<NotificationSettings>) => {
      state.settings = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Request permission
    builder
      .addCase(requestNotificationPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasPermission = action.payload.granted;
        state.pushToken = action.payload.token || null;
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to request notification permission';
        state.hasPermission = false;
      });


    // Update settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update notification settings';
      });

    // Schedule reminder
    builder
      .addCase(scheduleTaskReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleTaskReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Store scheduled reminder info if needed
      })
      .addCase(scheduleTaskReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to schedule reminder';
      });

    // Cancel reminder
    builder
      .addCase(cancelTaskReminder.fulfilled, (state) => {
        // Update state if tracking scheduled reminders
      })
      .addCase(cancelTaskReminder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to cancel reminder';
      });

    // Update push token
    builder
      .addCase(updatePushToken.fulfilled, (state, action) => {
        state.pushToken = action.payload;
      })
      .addCase(updatePushToken.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update push token';
      });

    // Subscribe to family
    builder
      .addCase(subscribeToFamily.fulfilled, (state) => {
        // Family subscription successful
      })
      .addCase(subscribeToFamily.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to subscribe to family notifications';
      });

    // Send test notification
    builder
      .addCase(sendTestNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to send test notification';
      });
  },
});

// Export actions
export const {
  addNotification,
  removeNotification,
  updateNotification,
  setPushToken,
  setHasPermission,
  clearNotifications,
  setSettings,
  updateSettings,
  setError,
  clearError,
} = notificationSlice.actions;

// Export reducer
export default notificationSlice.reducer;

// Selectors
import { RootState } from '../store';

export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectNotificationSettings = (state: RootState) => state.notifications.settings;
export const selectPushToken = (state: RootState) => state.notifications.pushToken;
export const selectHasNotificationPermission = (state: RootState) => state.notifications.hasPermission;
export const selectNotificationLoading = (state: RootState) => state.notifications.isLoading;
export const selectNotificationError = (state: RootState) => state.notifications.error;

// Computed selectors
export const selectUnreadNotifications = (state: RootState) =>
  state.notifications.notifications.filter((n: SerializedNotification) => !n.read);

export const selectNotificationsByType = (state: RootState, type: NotificationType) =>
  state.notifications.notifications.filter((n: SerializedNotification) => n.type === type);

export const selectRecentNotifications = (state: RootState, limit: number = 10) =>
  state.notifications.notifications.slice(0, limit);

export const selectIsQuietHours = (state: RootState) => {
  const settings = state.notifications.settings;
  if (!settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
};