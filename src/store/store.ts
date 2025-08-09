import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import familyReducer from './slices/familySlice';
import tasksReducer from './slices/tasksSlice';
import notificationReducer from './slices/notificationSlice';
import themeReducer from './slices/themeSlice';
import premiumReducer from './slices/premiumSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    family: familyReducer,
    tasks: tasksReducer,
    notifications: notificationReducer,
    theme: themeReducer,
    premium: premiumReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'auth/setUser',
          'family/setFamily',
          'family/setMembers',
          'tasks/setTasks',
          'tasks/setUserTasks',
          'tasks/setOverdueTasks',
          'tasks/addTask',
          'tasks/updateTaskInList',
          'tasks/create/pending',
          'tasks/create/fulfilled',
          'tasks/create/rejected',
          'notifications/addNotification',
          'notifications/updateNotification',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.user',
          'payload.userProfile',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.dueDate',
          'payload.completedAt',
          'payload.expiresAt',
          'meta.arg.input.dueDate',
          'meta.arg.input.recurrencePattern.endDate',
          'meta.arg.task',
          'meta.arg.user',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user',
          'family.currentFamily',
          'family.members',
          'tasks.tasks',
          'tasks.userTasks',
          'tasks.overdueTasks',
          'tasks.selectedTask',
          'notifications.notifications',
        ],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;