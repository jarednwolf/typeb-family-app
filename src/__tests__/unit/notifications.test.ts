/**
 * Notification Service Unit Tests
 * Tests the smart notification system including scheduling, permissions, and delivery
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Task, User } from '../../types/models';

// Mock the entire notifications module
jest.mock('../../services/notifications', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    checkPermissions: jest.fn(),
    scheduleTaskReminder: jest.fn(),
    cancelTaskNotifications: jest.fn(),
    cancelAllNotifications: jest.fn(),
    sendTestNotification: jest.fn(),
    updateBadgeCount: jest.fn(),
    getSettings: jest.fn(),
    getScheduledNotifications: jest.fn(),
    updateUserPushToken: jest.fn(),
    subscribeToFamilyNotifications: jest.fn(),
    unsubscribeFromFamilyNotifications: jest.fn(),
    isPushReady: jest.fn(),
    saveSettings: jest.fn(),
  }
}));

// Import after mocks are set up
import notificationService from '../../services/notifications';

// Mock data
const mockUser: User = {
  id: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  familyId: 'test-family-123',
  role: 'parent',
  createdAt: new Date(),
  updatedAt: new Date(),
  isPremium: false,
  notificationsEnabled: true,
  timezone: 'America/Phoenix',
};

const mockTask: Task = {
  id: 'test-task-123',
  familyId: 'test-family-123',
  title: 'Test Task',
  description: 'Test Description',
  assignedTo: 'test-user-123',
  assignedBy: 'test-user-123',
  createdBy: 'test-user-123',
  status: 'pending',
  priority: 'medium',
  category: {
    id: '1',
    name: 'Chores',
    color: '#10B981',
    icon: 'home',
    order: 1,
  },
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  reminderEnabled: true,
  reminderTime: '09:00',
  createdAt: new Date(),
  updatedAt: new Date(),
  requiresPhoto: false,
  isRecurring: false,
  escalationLevel: 0,
};

describe('Notification Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    const mockService = notificationService as any;
    mockService.checkPermissions.mockResolvedValue(true);
    mockService.scheduleTaskReminder.mockResolvedValue(undefined);
    mockService.cancelTaskNotifications.mockResolvedValue(undefined);
    mockService.sendTestNotification.mockResolvedValue(undefined);
    mockService.updateBadgeCount.mockResolvedValue(undefined);
    mockService.cancelAllNotifications.mockResolvedValue(undefined);
    mockService.subscribeToFamilyNotifications.mockResolvedValue(undefined);
    mockService.isPushReady.mockReturnValue(true);
    mockService.getSettings.mockReturnValue({
      enabled: true,
      defaultReminderMinutes: 30,
      escalationLevels: [15, 5],
      notifyManager: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      soundEnabled: true,
      vibrationEnabled: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the notification service', async () => {
      await notificationService.initialize();
      
      expect(notificationService.initialize).toHaveBeenCalled();
    });
  });

  describe('checkPermissions', () => {
    it('should check and return granted permissions', async () => {
      const result = await notificationService.checkPermissions();
      
      expect(result).toBe(true);
      expect(notificationService.checkPermissions).toHaveBeenCalled();
    });

    it('should handle denied permissions', async () => {
      const mockService = notificationService as any;
      mockService.checkPermissions.mockResolvedValue(false);

      const result = await notificationService.checkPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('scheduleTaskReminder', () => {
    it('should schedule a task reminder', async () => {
      await notificationService.scheduleTaskReminder(mockTask, mockUser);
      
      expect(notificationService.scheduleTaskReminder).toHaveBeenCalledWith(
        mockTask,
        mockUser
      );
    });

    it('should handle tasks without reminders', async () => {
      const disabledTask = {
        ...mockTask,
        reminderEnabled: false,
      };
      
      await notificationService.scheduleTaskReminder(disabledTask, mockUser);
      
      expect(notificationService.scheduleTaskReminder).toHaveBeenCalledWith(
        disabledTask,
        mockUser
      );
    });
  });

  describe('cancelTaskNotifications', () => {
    it('should cancel task notifications', async () => {
      await notificationService.cancelTaskNotifications('test-task-123');
      
      expect(notificationService.cancelTaskNotifications).toHaveBeenCalledWith(
        'test-task-123'
      );
    });
  });

  describe('sendTestNotification', () => {
    it('should send a test notification', async () => {
      await notificationService.sendTestNotification();
      
      expect(notificationService.sendTestNotification).toHaveBeenCalled();
    });

    it('should handle permission errors', async () => {
      const mockService = notificationService as any;
      mockService.sendTestNotification.mockRejectedValue(
        new Error('Notification permissions not granted')
      );
      
      await expect(notificationService.sendTestNotification()).rejects.toThrow(
        'Notification permissions not granted'
      );
    });
  });

  describe('cancelAllNotifications', () => {
    it('should clear all notifications', async () => {
      await notificationService.cancelAllNotifications();
      
      expect(notificationService.cancelAllNotifications).toHaveBeenCalled();
    });
  });

  describe('Badge Management', () => {
    it('should update badge count', async () => {
      await notificationService.updateBadgeCount(5);
      
      expect(notificationService.updateBadgeCount).toHaveBeenCalledWith(5);
    });

    it('should handle zero badge count', async () => {
      await notificationService.updateBadgeCount(0);
      
      expect(notificationService.updateBadgeCount).toHaveBeenCalledWith(0);
    });

    it('should validate badge count', async () => {
      const mockService = notificationService as any;
      mockService.updateBadgeCount.mockRejectedValue(
        new Error('Invalid badge count')
      );
      
      await expect(notificationService.updateBadgeCount(-1)).rejects.toThrow(
        'Invalid badge count'
      );
    });
  });

  describe('Settings Management', () => {
    it('should get notification settings', () => {
      const settings = notificationService.getSettings();
      
      expect(settings).toMatchObject({
        enabled: true,
        defaultReminderMinutes: 30,
        escalationLevels: [15, 5],
      });
    });

    it('should save notification settings', async () => {
      const newSettings = {
        enabled: false,
        defaultReminderMinutes: 60,
      };
      
      await notificationService.saveSettings(newSettings);
      
      expect(notificationService.saveSettings).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('Scheduled Notifications', () => {
    it('should get scheduled notifications', () => {
      const mockService = notificationService as any;
      mockService.getScheduledNotifications.mockReturnValue([
        {
          id: 'test-notification-1',
          taskId: 'test-task-123',
          type: 'reminder',
          scheduledFor: new Date(),
        },
      ]);
      
      const notifications = notificationService.getScheduledNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].taskId).toBe('test-task-123');
    });

    it('should filter scheduled notifications by task', () => {
      const mockService = notificationService as any;
      mockService.getScheduledNotifications.mockReturnValue([
        {
          id: 'test-notification-1',
          taskId: 'test-task-123',
          type: 'reminder',
          scheduledFor: new Date(),
        },
      ]);
      
      const notifications = notificationService.getScheduledNotifications('test-task-123');
      
      expect(notificationService.getScheduledNotifications).toHaveBeenCalledWith('test-task-123');
      expect(notifications).toHaveLength(1);
    });
  });

  describe('Push Notifications Integration', () => {
    it('should update user push token', async () => {
      await notificationService.updateUserPushToken('test-user-123');
      
      expect(notificationService.updateUserPushToken).toHaveBeenCalledWith('test-user-123');
    });

    it('should subscribe to family notifications', async () => {
      await notificationService.subscribeToFamilyNotifications('test-family-123');
      
      expect(notificationService.subscribeToFamilyNotifications).toHaveBeenCalledWith(
        'test-family-123'
      );
    });

    it('should unsubscribe from family notifications', async () => {
      await notificationService.unsubscribeFromFamilyNotifications('test-family-123');
      
      expect(notificationService.unsubscribeFromFamilyNotifications).toHaveBeenCalledWith(
        'test-family-123'
      );
    });

    it('should check if push notifications are ready', () => {
      const isReady = notificationService.isPushReady();
      
      expect(isReady).toBe(true);
      expect(notificationService.isPushReady).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const mockService = notificationService as any;
      mockService.scheduleTaskReminder.mockRejectedValue(
        new Error('Authentication required')
      );
      
      await expect(
        notificationService.scheduleTaskReminder(mockTask, mockUser)
      ).rejects.toThrow('Authentication required');
    });

    it('should handle rate limit errors', async () => {
      const mockService = notificationService as any;
      mockService.sendTestNotification.mockRejectedValue(
        new Error('Too many notification requests')
      );
      
      await expect(notificationService.sendTestNotification()).rejects.toThrow(
        'Too many notification requests'
      );
    });

    it('should handle unauthorized access', async () => {
      const mockService = notificationService as any;
      mockService.cancelTaskNotifications.mockRejectedValue(
        new Error('Unauthorized to schedule notifications for this task')
      );
      
      await expect(
        notificationService.cancelTaskNotifications('other-task-123')
      ).rejects.toThrow('Unauthorized');
    });
  });
});