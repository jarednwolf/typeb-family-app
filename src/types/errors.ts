/**
 * Error Types for TypeB Family App
 * 
 * This file defines all custom error types used throughout the application.
 * Following the principle of type safety first - no `any` types allowed.
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for invalid user input or data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Permission error for unauthorized access attempts
 */
export class PermissionError extends AppError {
  constructor(message: string, details?: unknown) {
    super('PERMISSION_ERROR', message, details);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Network error for connectivity issues
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: unknown) {
    super('NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super('NOT_FOUND_ERROR', message, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Authentication error for login/auth issues
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  constructor(message: string, details?: unknown) {
    super('RATE_LIMIT_ERROR', message, details);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Business logic error for domain-specific violations
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: unknown) {
    super('BUSINESS_LOGIC_ERROR', message, details);
    this.name = 'BusinessLogicError';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * Consistent error codes used throughout the application
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  
  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_MIN_LENGTH: 'VALIDATION_MIN_LENGTH',
  VALIDATION_MAX_LENGTH: 'VALIDATION_MAX_LENGTH',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_DATE: 'VALIDATION_INVALID_DATE',
  
  // Permissions
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_INSUFFICIENT_ROLE: 'PERMISSION_INSUFFICIENT_ROLE',
  PERMISSION_NOT_FAMILY_MEMBER: 'PERMISSION_NOT_FAMILY_MEMBER',
  PERMISSION_NOT_PARENT: 'PERMISSION_NOT_PARENT',
  PERMISSION_NOT_OWNER: 'PERMISSION_NOT_OWNER',
  
  // Business Logic
  FAMILY_FULL: 'FAMILY_FULL',
  FAMILY_NOT_FOUND: 'FAMILY_NOT_FOUND',
  FAMILY_ALREADY_MEMBER: 'FAMILY_ALREADY_MEMBER',
  TASK_ALREADY_COMPLETED: 'TASK_ALREADY_COMPLETED',
  TASK_NOT_ASSIGNED: 'TASK_NOT_ASSIGNED',
  TASK_VALIDATION_REQUIRED: 'TASK_VALIDATION_REQUIRED',
  INVITE_CODE_INVALID: 'INVITE_CODE_INVALID',
  INVITE_CODE_EXPIRED: 'INVITE_CODE_EXPIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // Network
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_ACCOUNT_LOCKED: 'RATE_LIMIT_ACCOUNT_LOCKED',
} as const;

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a specific type of AppError
 */
export function isErrorType<T extends AppError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return error instanceof ErrorClass;
}

/**
 * Firebase error code mapping to our error types
 */
export function mapFirebaseError(firebaseError: { code?: string; message?: string }): AppError {
  const code = firebaseError.code || '';
  const message = firebaseError.message || 'An error occurred';
  
  switch (code) {
    // Auth errors
    case 'auth/invalid-email':
      return new ValidationError('Invalid email address', { code: ERROR_CODES.VALIDATION_INVALID_EMAIL });
    case 'auth/user-disabled':
      return new AuthenticationError('This account has been disabled', { code: ERROR_CODES.AUTH_USER_NOT_FOUND });
    case 'auth/user-not-found':
      return new AuthenticationError('No account found with this email', { code: ERROR_CODES.AUTH_USER_NOT_FOUND });
    case 'auth/wrong-password':
      return new AuthenticationError('Invalid email or password', { code: ERROR_CODES.AUTH_INVALID_CREDENTIALS });
    case 'auth/email-already-in-use':
      return new ValidationError('An account already exists with this email', { code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS });
    case 'auth/weak-password':
      return new ValidationError('Password is too weak', { code: ERROR_CODES.AUTH_WEAK_PASSWORD });
    case 'auth/network-request-failed':
      return new NetworkError('Network connection failed', { code: ERROR_CODES.NETWORK_OFFLINE });
    case 'auth/too-many-requests':
      return new RateLimitError('Too many failed attempts. Please try again later', { code: ERROR_CODES.RATE_LIMIT_EXCEEDED });
      
    // Firestore errors
    case 'permission-denied':
      return new PermissionError('You do not have permission to perform this action', { code: ERROR_CODES.PERMISSION_DENIED });
    case 'not-found':
      return new NotFoundError('The requested resource was not found', { code });
    case 'unavailable':
      return new NetworkError('Service temporarily unavailable', { code: ERROR_CODES.NETWORK_SERVER_ERROR });
      
    default:
      return new AppError('UNKNOWN_ERROR', message, { originalCode: code });
  }
}

/**
 * User-friendly error messages for display
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error with appropriate context
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[TypeB Error]', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(isAppError(error) ? { code: error.code, details: error.details } : {})
    } : error,
    context,
    timestamp: new Date().toISOString()
  });
}