import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';

export const createStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      tasks: tasksReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['auth/setUser'],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['payload.user', 'payload.userProfile'],
          // Ignore these paths in the state
          ignoredPaths: ['auth.user'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];