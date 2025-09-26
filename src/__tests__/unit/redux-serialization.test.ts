/**
 * Redux Serialization Tests
 * Ensures all Redux state is properly serialized (no Date objects, functions, etc.)
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import familyReducer from '../../store/slices/familySlice';
import tasksReducer from '../../store/slices/tasksSlice';
import { toISOString } from '../../utils/dateHelpers';

describe('Redux Serialization', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        family: familyReducer,
        tasks: tasksReducer,
      },
      // Enable serialization checks
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Strict mode - will throw errors on non-serializable values
            warnAfter: 32,
            ignoredActions: [],
            ignoredPaths: [],
          },
        }),
    });
  });

  describe('Auth Slice Serialization', () => {
    it('should store dates as ISO strings in userProfile', () => {
      const now = new Date();
      const userProfile = {
        id: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'parent' as const,
        createdAt: toISOString(now) || '',
        updatedAt: toISOString(now) || '',
        isPremium: false,
        notificationsEnabled: true,
        timezone: 'UTC',
      };

      store.dispatch({
        type: 'auth/setUserProfile',
        payload: userProfile,
      });

      const state = store.getState();
      expect(typeof state.auth.userProfile?.createdAt).toBe('string');
      expect(typeof state.auth.userProfile?.updatedAt).toBe('string');
      expect(state.auth.userProfile?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Family Slice Serialization', () => {
    it('should store family dates as ISO strings', () => {
      const now = new Date();
      const family = {
        id: 'test-family',
        name: 'Test Family',
        inviteCode: 'ABC123',
        createdBy: 'test-user',
        createdAt: toISOString(now) || '',
        updatedAt: toISOString(now) || '',
        memberIds: ['test-user'],
        parentIds: ['test-user'],
        childIds: [],
        maxMembers: 10,
        isPremium: false,
        taskCategories: [],
      };

      store.dispatch({
        type: 'family/setFamily',
        payload: family,
      });

      const state = store.getState();
      expect(typeof state.family.currentFamily?.createdAt).toBe('string');
      expect(typeof state.family.currentFamily?.updatedAt).toBe('string');
    });

    it('should store member dates as ISO strings', () => {
      const now = new Date();
      const members = [{
        id: 'member-1',
        email: 'member@example.com',
        displayName: 'Member One',
        role: 'child' as const,
        createdAt: toISOString(now) || '',
        updatedAt: toISOString(now) || '',
        isPremium: false,
        notificationsEnabled: true,
        timezone: 'UTC',
      }];

      store.dispatch({
        type: 'family/setMembers',
        payload: members,
      });

      const state = store.getState();
      expect(typeof state.family.members[0]?.createdAt).toBe('string');
      expect(typeof state.family.members[0]?.updatedAt).toBe('string');
    });
  });

  describe('Tasks Slice Serialization', () => {
    it('should store task dates as ISO strings', () => {
      const now = new Date();
      const tasks = [{
        id: 'task-1',
        familyId: 'test-family',
        title: 'Test Task',
        category: { id: '1', name: 'Chores', color: '#10B981', order: 1 },
        assignedTo: 'test-user',
        assignedBy: 'test-user',
        createdBy: 'test-user',
        status: 'pending' as const,
        requiresPhoto: false,
        isRecurring: false,
        reminderEnabled: false,
        escalationLevel: 0,
        priority: 'medium' as const,
        createdAt: toISOString(now) || '',
        updatedAt: toISOString(now) || '',
        dueDate: toISOString(new Date(now.getTime() + 86400000)) || undefined,
      }];

      store.dispatch({
        type: 'tasks/setTasks',
        payload: tasks,
      });

      const state = store.getState();
      expect(typeof state.tasks.tasks[0]?.createdAt).toBe('string');
      expect(typeof state.tasks.tasks[0]?.updatedAt).toBe('string');
      expect(typeof state.tasks.tasks[0]?.dueDate).toBe('string');
    });

    it('should handle recurrence pattern with serialized dates', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 86400000); // 30 days later
      
      const tasks = [{
        id: 'task-2',
        familyId: 'test-family',
        title: 'Recurring Task',
        category: { id: '1', name: 'Chores', color: '#10B981', order: 1 },
        assignedTo: 'test-user',
        assignedBy: 'test-user',
        createdBy: 'test-user',
        status: 'pending' as const,
        requiresPhoto: false,
        isRecurring: true,
        recurrencePattern: {
          frequency: 'daily' as const,
          interval: 1,
          endDate: toISOString(endDate) || undefined,
        },
        reminderEnabled: false,
        escalationLevel: 0,
        priority: 'medium' as const,
        createdAt: toISOString(now) || '',
        updatedAt: toISOString(now) || '',
      }];

      store.dispatch({
        type: 'tasks/setTasks',
        payload: tasks,
      });

      const state = store.getState();
      const task = state.tasks.tasks[0];
      expect(task?.recurrencePattern).toBeDefined();
      expect(typeof task?.recurrencePattern?.endDate).toBe('string');
    });
  });

  describe('Redux Middleware Serialization Checks', () => {
    it('should not throw serialization errors when dispatching actions', () => {
      // This test verifies that our middleware doesn't detect any serialization issues
      expect(() => {
        // Dispatch various actions that would trigger serialization checks
        store.dispatch({
          type: 'auth/setUserProfile',
          payload: {
            id: 'test',
            email: 'test@example.com',
            displayName: 'Test',
            role: 'parent',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPremium: false,
            notificationsEnabled: true,
            timezone: 'UTC',
          },
        });

        store.dispatch({
          type: 'family/setFamily',
          payload: {
            id: 'family-1',
            name: 'Test Family',
            inviteCode: 'ABC123',
            createdBy: 'test',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            memberIds: [],
            parentIds: [],
            childIds: [],
            maxMembers: 10,
            isPremium: false,
            taskCategories: [],
          },
        });

        store.dispatch({
          type: 'tasks/setTasks',
          payload: [{
            id: 'task-1',
            familyId: 'family-1',
            title: 'Test Task',
            category: { id: '1', name: 'Chores', color: '#10B981', order: 1 },
            assignedTo: 'test',
            assignedBy: 'test',
            createdBy: 'test',
            status: 'pending',
            requiresPhoto: false,
            isRecurring: false,
            reminderEnabled: false,
            escalationLevel: 0,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        });
      }).not.toThrow();
    });
  });
});