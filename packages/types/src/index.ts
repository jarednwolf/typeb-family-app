/**
 * @typeb/types - Shared TypeScript type definitions
 * 
 * This package contains all shared types used across
 * the TypeB mobile and web applications.
 */

// Export all model types
export * from './models';

// Export all API types
export * from './api';

// Re-export commonly used types for convenience
export type {
  User,
  Family,
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  Notification,
  NotificationType,
  Subscription,
  ActivityLog,
  ActivityAction,
  FamilyInvite,
  RecurrencePattern,
} from './models';

export type {
  ApiResponse,
  ApiError,
  AuthResponse,
  TaskListResponse,
  AnalyticsResponse,
  WebSocketEvent,
  WebSocketEventType,
} from './api';

// Export constants
export { DEFAULT_TASK_CATEGORIES } from './models';