import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import familyReducer from './slices/familySlice';
import tasksReducer from './slices/tasksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    family: familyReducer,
    tasks: tasksReducer,
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
          'tasks/addTask',
          'tasks/updateTaskInList',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.user',
          'payload.userProfile',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.dueDate',
          'payload.completedAt',
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
        ],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;