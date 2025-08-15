// Store configuration
export { createStore } from './store';
export type { RootState, AppDispatch, AppStore } from './store';

// Hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Auth slice
export {
  default as authReducer,
  setAuthAdapter,
  signUp,
  signIn,
  signOut,
  resetPassword,
  setUser,
  clearError,
  setLoading,
  resetAuthState,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectIsEmailVerified,
} from './slices/authSlice';
export type { AuthState } from './slices/authSlice';

// Tasks slice
export {
  default as tasksReducer,
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setLoading as setTasksLoading,
  setError as setTasksError,
  setFilter,
  resetTasksState,
  selectTasks,
  selectTasksLoading,
  selectTasksError,
  selectTasksFilter,
  selectFilteredTasks,
} from './slices/tasksSlice';
export type { TasksState } from './slices/tasksSlice';