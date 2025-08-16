import { Alert } from 'react-native';
import { ErrorMessages, ErrorMessage, getErrorMessage, getFirebaseErrorMessage } from '../services/errorMessages';
import { errorMonitoring } from '../services/errorMonitoring';

type ErrorCategory = 'AUTH' | 'NETWORK' | 'VALIDATION' | 'PERMISSION' | 'STORAGE' | 'TASK' | 'FAMILY' | 'SUBSCRIPTION' | 'GENERAL';
type ErrorCode = keyof typeof ErrorMessages;

interface ErrorHandlerOptions {
  showAlert?: boolean;
  alertTitle?: string;
  fallbackMessage?: string;
  context?: Record<string, any>;
  onRetry?: () => void;
}

/**
 * Centralized error handler that uses the error message catalog
 * and provides consistent error handling across the app
 */
export class ErrorHandler {
  /**
   * Handle an error with appropriate user messaging and logging
   */
  static handle(
    error: any,
    category: ErrorCategory = 'GENERAL',
    options: ErrorHandlerOptions = {}
  ): string {
    const {
      showAlert = true,
      alertTitle = 'Oops!',
      fallbackMessage,
      context = {},
      onRetry,
    } = options;

    // Extract error code from various error formats
    const errorCode = this.extractErrorCode(error, category);
    
    // Get appropriate error message from catalog
    let errorMessage: ErrorMessage;
    if (error?.code && error.code.startsWith('auth/')) {
      errorMessage = getFirebaseErrorMessage(error.code);
    } else {
      errorMessage = getErrorMessage(errorCode as ErrorCode);
    }

    // Log to error monitoring service
    errorMonitoring.captureException(error, {
      category,
      errorCode,
      ...context,
    });

    // Log to console in development
    if (__DEV__) {
      console.error(`[${category}] Error:`, error);
      console.error('Context:', context);
    }

    // Show alert to user if requested
    if (showAlert) {
      const buttons: any[] = [{ text: 'OK', style: 'default' }];
      
      if (onRetry && errorMessage.retryable) {
        buttons.unshift({
          text: errorMessage.action || 'Try Again',
          onPress: onRetry,
          style: 'default',
        });
      }

      Alert.alert(errorMessage.title || alertTitle, errorMessage.message || fallbackMessage || 'An error occurred', buttons);
    }

    return errorMessage.message;
  }

  /**
   * Extract error code from various error formats
   */
  private static extractErrorCode(error: any, category: ErrorCategory): ErrorCode {
    // Firebase error format
    if (error?.code && error.code.startsWith('auth/')) {
      return 'AUTH_INVALID_CREDENTIALS';
    }

    // Custom error format
    if (error?.errorCode && ErrorMessages[error.errorCode as ErrorCode]) {
      return error.errorCode as ErrorCode;
    }

    // HTTP error format
    if (error?.response?.status) {
      if (error.response.status >= 500) {
        return 'SERVER_ERROR';
      }
      if (error.response.status === 401) {
        return 'AUTH_SESSION_EXPIRED';
      }
      if (error.response.status === 403) {
        return 'PERMISSION_DENIED';
      }
    }

    // Network error
    if (error?.message?.toLowerCase().includes('network')) {
      return 'NETWORK_ERROR';
    }

    // Timeout error
    if (error?.message?.toLowerCase().includes('timeout')) {
      return 'NETWORK_TIMEOUT';
    }

    // Permission error
    if (error?.message?.toLowerCase().includes('permission')) {
      return 'PERMISSION_DENIED';
    }

    // Category-specific defaults
    const categoryDefaults: Record<ErrorCategory, ErrorCode> = {
      AUTH: 'AUTH_INVALID_CREDENTIALS',
      NETWORK: 'NETWORK_ERROR',
      VALIDATION: 'UNKNOWN_ERROR',
      PERMISSION: 'PERMISSION_DENIED',
      STORAGE: 'PHOTO_UPLOAD_FAILED',
      TASK: 'TASK_CREATE_FAILED',
      FAMILY: 'FAMILY_CREATE_FAILED',
      SUBSCRIPTION: 'PERMISSION_DENIED',
      GENERAL: 'UNKNOWN_ERROR',
    };

    return categoryDefaults[category] || 'UNKNOWN_ERROR';
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'AUTH', {
      alertTitle: 'Authentication Error',
      ...options,
    });
  }

  /**
   * Handle task-related errors
   */
  static handleTaskError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'TASK', {
      alertTitle: 'Task Error',
      ...options,
    });
  }

  /**
   * Handle family-related errors
   */
  static handleFamilyError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'FAMILY', {
      alertTitle: 'Family Error',
      ...options,
    });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'VALIDATION', {
      alertTitle: 'Validation Error',
      ...options,
    });
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'NETWORK', {
      alertTitle: 'Connection Error',
      ...options,
    });
  }

  /**
   * Handle permission errors
   */
  static handlePermissionError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'PERMISSION', {
      alertTitle: 'Permission Required',
      ...options,
    });
  }

  /**
   * Handle storage errors
   */
  static handleStorageError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'STORAGE', {
      alertTitle: 'Storage Error',
      ...options,
    });
  }

  /**
   * Handle subscription/premium errors
   */
  static handleSubscriptionError(error: any, options?: ErrorHandlerOptions): string {
    return this.handle(error, 'SUBSCRIPTION', {
      alertTitle: 'Subscription',
      ...options,
    });
  }

  /**
   * Create a formatted error object for API responses
   */
  static createErrorResponse(
    category: ErrorCategory,
    code: ErrorCode,
    details?: any
  ): { error: { category: string; code: string; message: string; details?: any } } {
    const errorMessage = getErrorMessage(code);
    return {
      error: {
        category,
        code,
        message: errorMessage.message,
        details,
      },
    };
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: any): boolean {
    const code = this.extractErrorCode(error, 'GENERAL');
    const retryableCodes: ErrorCode[] = [
      'NETWORK_ERROR',
      'NETWORK_TIMEOUT',
      'SERVER_ERROR',
      'SYNC_FAILED',
      'TASK_CREATE_FAILED',
      'TASK_UPDATE_FAILED',
      'TASK_DELETE_FAILED',
      'TASK_LOAD_FAILED',
      'PHOTO_UPLOAD_FAILED',
      'FAMILY_CREATE_FAILED',
      'FAMILY_JOIN_FAILED',
    ];
    
    return retryableCodes.includes(code) ||
           (error?.response?.status >= 500 && error?.response?.status < 600);
  }

  /**
   * Format error for display in UI components
   */
  static formatForDisplay(error: any, category: ErrorCategory = 'GENERAL'): {
    title: string;
    message: string;
    isRetryable: boolean;
  } {
    const code = this.extractErrorCode(error, category);
    const errorMessage = getErrorMessage(code);
    
    return {
      title: errorMessage.title || this.getCategoryTitle(category),
      message: errorMessage.message,
      isRetryable: errorMessage.retryable || this.isRetryable(error),
    };
  }

  /**
   * Get user-friendly title for error category
   */
  private static getCategoryTitle(category: ErrorCategory): string {
    const titles: Record<ErrorCategory, string> = {
      AUTH: 'Authentication Issue',
      NETWORK: 'Connection Problem',
      VALIDATION: 'Invalid Input',
      PERMISSION: 'Permission Required',
      STORAGE: 'Storage Issue',
      TASK: 'Task Operation Failed',
      FAMILY: 'Family Operation Failed',
      SUBSCRIPTION: 'Subscription Required',
      GENERAL: 'Something Went Wrong',
    };
    
    return titles[category] || 'Error';
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const handleAuthError = ErrorHandler.handleAuthError.bind(ErrorHandler);
export const handleTaskError = ErrorHandler.handleTaskError.bind(ErrorHandler);
export const handleFamilyError = ErrorHandler.handleFamilyError.bind(ErrorHandler);
export const handleValidationError = ErrorHandler.handleValidationError.bind(ErrorHandler);
export const handleNetworkError = ErrorHandler.handleNetworkError.bind(ErrorHandler);
export const handlePermissionError = ErrorHandler.handlePermissionError.bind(ErrorHandler);
export const handleStorageError = ErrorHandler.handleStorageError.bind(ErrorHandler);
export const handleSubscriptionError = ErrorHandler.handleSubscriptionError.bind(ErrorHandler);
export const isRetryableError = ErrorHandler.isRetryable.bind(ErrorHandler);
export const formatErrorForDisplay = ErrorHandler.formatForDisplay.bind(ErrorHandler);