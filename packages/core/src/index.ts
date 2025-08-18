/**
 * @typeb/core - Shared business logic and services
 * 
 * This package contains all shared business logic, validators,
 * and utility functions used across TypeB applications.
 */

// Export services
export * from './services';

// Export validators
export * from './validators';

// Export utilities
export * from './utils';

// Re-export commonly used items for convenience
export {
  BaseService,
  type AuthAdapter,
  type DatabaseAdapter,
  type StorageAdapter,
  type PlatformConfig,
} from './services';

export {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateTaskTitle,
  validateCreateTaskInput,
  type ValidationResult,
} from './validators';

export {
  formatDate,
  formatTime,
  getRelativeTime,
  getFriendlyDate,
  isOverdue,
} from './utils';