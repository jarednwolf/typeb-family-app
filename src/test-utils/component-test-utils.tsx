/**
 * Component Test Utilities
 * 
 * Provides helpers for testing React Native components with:
 * - Redux store provider
 * - Navigation context
 * - Theme provider
 * - Mock data factories
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import familyReducer from '../store/slices/familySlice';
import tasksReducer from '../store/slices/tasksSlice';
import notificationReducer from '../store/slices/notificationSlice';
import { RootState } from '../store/store';

// Create a test store with initial state
export const createTestStore = (initialState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      family: familyReducer,
      tasks: tasksReducer,
      notifications: notificationReducer,
    },
    preloadedState: initialState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: [
            'auth/setUser',
            'family/setFamily',
            'tasks/setTasks',
            'notifications/addNotification',
          ],
          // Ignore these paths in the state
          ignoredPaths: [
            'auth.user',
            'family.currentFamily',
            'tasks.tasks',
            'notifications.notifications',
          ],
        },
      }),
  });
  return store;
};

// Default test store
export const defaultTestStore = createTestStore({
  auth: {
    user: null,
    userProfile: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isEmailVerified: false,
  },
  family: {
    currentFamily: null,
    members: [],
    inviteCode: null,
    isLoading: false,
    isJoining: false,
    isCreating: false,
    error: null,
  },
  tasks: {
    tasks: [],
    userTasks: [],
    overdueTasks: [],
    selectedTask: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    error: null,
    stats: {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
    },
    filters: {},
  },
  notifications: {
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
  },
});

// Props for the test wrapper
interface TestWrapperProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
}

// Test wrapper component with all providers
export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  store = defaultTestStore 
}) => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </Provider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

export const renderWithProviders = (
  component: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialState, store, ...renderOptions } = options || {};
  
  const testStore = store || (initialState ? createTestStore(initialState) : defaultTestStore);
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper store={testStore}>{children}</TestWrapper>
  );
  
  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    store: testStore,
  };
};

// Mock data factories
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  familyId: 'test-family-123',
  role: 'parent' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPremium: false,
  notificationsEnabled: true,
  timezone: 'America/New_York',
  ...overrides,
});

export const createMockFamily = (overrides?: Partial<any>) => ({
  id: 'test-family-123',
  name: 'Test Family',
  inviteCode: 'ABC123',
  createdBy: 'test-user-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  memberIds: ['test-user-123'],
  parentIds: ['test-user-123'],
  childIds: [],
  maxMembers: 4,
  isPremium: false,
  taskCategories: [
    { id: 'chores', name: 'Chores', color: '#FF6B6B', icon: 'home' },
    { id: 'homework', name: 'Homework', color: '#4ECDC4', icon: 'book' },
  ],
  ...overrides,
});

export const createMockTask = (overrides?: Partial<any>) => ({
  id: 'test-task-123',
  familyId: 'test-family-123',
  title: 'Test Task',
  description: 'Test task description',
  category: { id: 'chores', name: 'Chores', color: '#FF6B6B', icon: 'home' },
  assignedTo: 'test-user-123',
  assignedBy: 'test-user-123',
  createdBy: 'test-user-123',
  status: 'pending' as const,
  requiresPhoto: false,
  dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  isRecurring: false,
  reminderEnabled: false,
  escalationLevel: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  priority: 'medium' as const,
  points: 10,
  ...overrides,
});

// Utility functions for common test scenarios
export const waitForAsync = () => new Promise(resolve => setImmediate(resolve));

export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
};

export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// Helper to create a mock onPress handler with tracking
export const createMockHandler = () => {
  const handler = jest.fn();
  handler.mockName('onPress');
  return handler;
};

// Helper to test async actions
export const testAsyncAction = async (
  action: () => Promise<any>,
  assertions: () => void
) => {
  await action();
  await waitForAsync();
  assertions();
};

// Export everything for easy access
export * from '@testing-library/react-native';