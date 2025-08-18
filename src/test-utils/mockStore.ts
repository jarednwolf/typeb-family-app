import configureStore from 'redux-mock-store';
import { RootState } from '../store/store';

const middlewares: any[] = [];
const mockStore = configureStore(middlewares);

export const createMockStore = (initialState: Partial<RootState> = {}) => {
  const defaultState: any = {
    auth: {
      user: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        photoURL: null,
        phoneNumber: undefined,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    family: {
      currentFamily: {
        id: 'test-family-123',
        name: 'Test Family',
        inviteCode: 'TEST123',
        createdBy: 'test-user-123',
        memberIds: ['test-user-123'],
        parentIds: ['test-user-123'],
        childIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        maxMembers: 10,
        isPremium: true,
        taskCategories: [
          { id: '1', name: 'Chores', icon: 'home', color: '#10B981', order: 1 },
          { id: '2', name: 'Homework', icon: 'book-open', color: '#3B82F6', order: 2 },
        ],
      },
      members: [
        {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: true,
          photoURL: null,
          phoneNumber: undefined,
        },
      ],
      isLoading: false,
      error: null,
      inviteCode: null,
      isJoining: false,
      isCreating: false,
    },
    tasks: {
      tasks: [],
      userTasks: [],
      overdueTasks: [],
      selectedTask: null,
      isLoading: false,
      error: null,
      stats: null,
      filters: {
        status: 'all',
        assignee: 'all',
        category: 'all',
        priority: 'all',
      },
    },
    notifications: {
      notifications: [],
      unreadCount: 0,
      settings: {
        taskReminders: true,
        taskUpdates: true,
        achievements: true,
        familyUpdates: true,
        pushEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
        },
      },
      pushToken: null,
      lastFetchedAt: null,
      hasPermission: false,
      isLoading: false,
      error: null,
    },
    settings: {
      theme: 'light',
      notifications: {
        taskReminders: true,
        taskAssignments: true,
        achievements: true,
        familyUpdates: true,
        pushEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
        },
      },
      haptics: true,
      sound: true,
      language: 'en',
      privacyMode: false,
    },
    gamification: {
      userAchievements: [],
      familyAchievements: [],
      celebrations: [],
      streaks: {},
      currentDailyStreak: 0,
      bestDailyStreak: 0,
      currentCelebration: null,
      totalAchievementsUnlocked: 0,
      totalTasksCompleted: 0,
      soundEnabled: true,
      celebrationsEnabled: true,
      confettiEnabled: true,
      isLoading: false,
      error: null,
    },
  };

  return mockStore({
    ...defaultState,
    ...initialState,
  });
};