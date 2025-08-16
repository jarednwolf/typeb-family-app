/**
 * Error Message Catalog
 * 
 * Provides user-friendly, actionable error messages for common scenarios.
 * Each message includes:
 * - Clear explanation of what went wrong
 * - Specific steps to resolve the issue
 * - Supportive tone to reduce user frustration
 */

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  retryable?: boolean;
}

export const ErrorMessages = {
  // Network Errors
  NETWORK_ERROR: {
    title: "No Internet Connection",
    message: "Please check your internet connection and try again.",
    action: "Retry",
    retryable: true,
  },
  
  NETWORK_TIMEOUT: {
    title: "Request Timed Out",
    message: "This is taking longer than usual. Please check your connection and try again.",
    action: "Retry",
    retryable: true,
  },

  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: {
    title: "Sign In Failed",
    message: "The email or password you entered is incorrect. Please try again.",
    action: "Try Again",
    retryable: true,
  },
  
  AUTH_USER_NOT_FOUND: {
    title: "Account Not Found",
    message: "We couldn't find an account with that email. Would you like to create one?",
    action: "Sign Up",
    retryable: false,
  },
  
  AUTH_EMAIL_IN_USE: {
    title: "Email Already Registered",
    message: "This email is already associated with an account. Try signing in instead.",
    action: "Sign In",
    retryable: false,
  },
  
  AUTH_WEAK_PASSWORD: {
    title: "Password Too Weak",
    message: "Please use at least 8 characters including letters and numbers.",
    action: "Try Another",
    retryable: true,
  },
  
  AUTH_SESSION_EXPIRED: {
    title: "Session Expired",
    message: "For your security, please sign in again to continue.",
    action: "Sign In",
    retryable: false,
  },

  // Task Errors
  TASK_CREATE_FAILED: {
    title: "Couldn't Create Task",
    message: "We're having trouble creating your task right now. Please try again.",
    action: "Retry",
    retryable: true,
  },
  
  TASK_UPDATE_FAILED: {
    title: "Couldn't Update Task",
    message: "Your changes couldn't be saved. Please check your connection and try again.",
    action: "Retry",
    retryable: true,
  },
  
  TASK_DELETE_FAILED: {
    title: "Couldn't Delete Task",
    message: "We couldn't delete this task. Please try again.",
    action: "Retry",
    retryable: true,
  },
  
  TASK_LOAD_FAILED: {
    title: "Couldn't Load Tasks",
    message: "We're having trouble loading your tasks. Pull down to refresh.",
    action: "Refresh",
    retryable: true,
  },

  // Photo Errors
  PHOTO_UPLOAD_FAILED: {
    title: "Photo Upload Failed",
    message: "We couldn't upload your photo. Please check your connection and try again.",
    action: "Retry Upload",
    retryable: true,
  },
  
  PHOTO_TOO_LARGE: {
    title: "Photo Too Large",
    message: "This photo is over 10MB. Please choose a smaller photo or take a new one.",
    action: "Choose Another",
    retryable: true,
  },
  
  PHOTO_PERMISSION_DENIED: {
    title: "Camera Access Required",
    message: "Please allow camera access in your device settings to take photos.",
    action: "Open Settings",
    retryable: false,
  },

  // Family Errors
  FAMILY_CREATE_FAILED: {
    title: "Couldn't Create Family",
    message: "We're having trouble creating your family. Please try again.",
    action: "Retry",
    retryable: true,
  },
  
  FAMILY_JOIN_FAILED: {
    title: "Couldn't Join Family",
    message: "The invite code may be invalid or expired. Please check and try again.",
    action: "Try Again",
    retryable: true,
  },
  
  FAMILY_INVITE_EXPIRED: {
    title: "Invite Code Expired",
    message: "This invite code has expired. Please request a new one from your family admin.",
    action: "OK",
    retryable: false,
  },
  
  FAMILY_NOT_FOUND: {
    title: "Family Not Found",
    message: "We couldn't find this family. The invite code may be incorrect.",
    action: "Check Code",
    retryable: true,
  },

  // Permission Errors
  PERMISSION_DENIED: {
    title: "Permission Required",
    message: "You don't have permission to perform this action. Contact your family admin.",
    action: "OK",
    retryable: false,
  },
  
  PARENT_ACTION_REQUIRED: {
    title: "Parent Action Required",
    message: "A parent needs to approve this action. We've notified them for you.",
    action: "OK",
    retryable: false,
  },

  // Sync Errors
  SYNC_FAILED: {
    title: "Sync Failed",
    message: "Some changes couldn't be synced. They'll be saved when you're back online.",
    action: "OK",
    retryable: true,
  },
  
  OFFLINE_MODE: {
    title: "You're Offline",
    message: "Your changes will be saved and synced when you're back online.",
    action: "OK",
    retryable: false,
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "We encountered an unexpected error. Please try again.",
    action: "Retry",
    retryable: true,
  },
  
  SERVER_ERROR: {
    title: "Server Error",
    message: "Our servers are having issues. Please try again in a few moments.",
    action: "Retry",
    retryable: true,
  },
  
  MAINTENANCE_MODE: {
    title: "Under Maintenance",
    message: "We're updating TypeB to serve you better. Please check back in a few minutes.",
    action: "OK",
    retryable: false,
  },
};

/**
 * Get error message by code with fallback
 */
export function getErrorMessage(code: keyof typeof ErrorMessages): ErrorMessage {
  return ErrorMessages[code] || ErrorMessages.UNKNOWN_ERROR;
}

/**
 * Format Firebase error codes to our error messages
 */
export function getFirebaseErrorMessage(errorCode: string): ErrorMessage {
  const errorMap: Record<string, keyof typeof ErrorMessages> = {
    'auth/invalid-email': 'AUTH_INVALID_CREDENTIALS',
    'auth/user-disabled': 'AUTH_INVALID_CREDENTIALS',
    'auth/user-not-found': 'AUTH_USER_NOT_FOUND',
    'auth/wrong-password': 'AUTH_INVALID_CREDENTIALS',
    'auth/email-already-in-use': 'AUTH_EMAIL_IN_USE',
    'auth/weak-password': 'AUTH_WEAK_PASSWORD',
    'auth/network-request-failed': 'NETWORK_ERROR',
    'auth/too-many-requests': 'SERVER_ERROR',
    'permission-denied': 'PERMISSION_DENIED',
    'unavailable': 'SERVER_ERROR',
    'deadline-exceeded': 'NETWORK_TIMEOUT',
  };

  const mappedCode = errorMap[errorCode];
  return getErrorMessage(mappedCode as keyof typeof ErrorMessages);
}

/**
 * Create a custom error with our error message format
 */
export class AppError extends Error {
  code: keyof typeof ErrorMessages;
  errorMessage: ErrorMessage;

  constructor(code: keyof typeof ErrorMessages, customMessage?: string) {
    const errorMessage = getErrorMessage(code);
    super(customMessage || errorMessage.message);
    this.code = code;
    this.errorMessage = errorMessage;
    this.name = 'AppError';
  }
}

/**
 * Helper to display error in UI components
 */
export interface ErrorDisplay {
  show: boolean;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}

export function createErrorDisplay(
  error: Error | AppError | null,
  onRetry?: () => void
): ErrorDisplay | null {
  if (!error) return null;

  let errorMessage: ErrorMessage;
  
  if (error instanceof AppError) {
    errorMessage = error.errorMessage;
  } else if (error.message.includes('Network')) {
    errorMessage = getErrorMessage('NETWORK_ERROR');
  } else {
    errorMessage = getErrorMessage('UNKNOWN_ERROR');
  }

  return {
    show: true,
    title: errorMessage.title,
    message: errorMessage.message,
    action: errorMessage.action,
    onAction: errorMessage.retryable ? onRetry : undefined,
  };
}