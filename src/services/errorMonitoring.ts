/**
 * Error Monitoring Service
 * Configures and manages Sentry error tracking
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

class ErrorMonitoringService {
  private initialized = false;

  /**
   * Initialize Sentry
   */
  initialize() {
    if (this.initialized) {
      console.log('[ErrorMonitoring] Already initialized');
      return;
    }

    const dsn = (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SENTRY_DSN : undefined) || Constants.expoConfig?.extra?.sentryDsn;

    if (!dsn) {
      console.warn('[ErrorMonitoring] Sentry DSN not configured');
      return;
    }

    try {
      Sentry.init({
        dsn,
        debug: __DEV__, // Enable debug mode in development
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production
        attachStacktrace: true,
        autoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000, // 30 seconds
        
        // Integration configuration
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            tracingOrigins: ['localhost', /^https:\/\/yourserver\.io\/api/],
            beforeNavigate: (context) => {
              // Add additional context to navigation transactions
              return {
                ...context,
                tags: {
                  ...context.tags,
                  platform: Platform.OS,
                },
              };
            },
          }),
        ],
        
        // Before sending error to Sentry
        beforeSend: (event, hint) => {
          // Filter out certain errors in production
          if (!__DEV__) {
            // Don't send network errors in production
            if (event.exception?.values?.[0]?.type === 'NetworkError') {
              return null;
            }
            
            // Don't send cancelled promise errors
            if (event.exception?.values?.[0]?.value?.includes('cancelled')) {
              return null;
            }
          }
          
          // Remove sensitive data
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          
          // Add custom tags
          event.tags = {
            ...event.tags,
            app_version: Constants.expoConfig?.version || '1.0.0',
            platform: Platform.OS,
            platform_version: Platform.Version,
          };
          
          return event;
        },
        
        // Before breadcrumb is added
        beforeBreadcrumb: (breadcrumb, hint) => {
          // Filter out certain breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }
          
          // Sanitize breadcrumb data
          if (breadcrumb.data) {
            // Remove any potential sensitive data from breadcrumbs
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
          }
          
          return breadcrumb;
        },
      });

      this.initialized = true;
      console.log('[ErrorMonitoring] Sentry initialized successfully');
    } catch (error) {
      console.error('[ErrorMonitoring] Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string } | null) {
    if (!this.initialized) return;

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  /**
   * Add custom context
   */
  setContext(key: string, context: any) {
    if (!this.initialized) return;
    Sentry.setContext(key, context);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: any;
    data?: any;
  }) {
    if (!this.initialized) return;
    
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Capture exception
   */
  captureException(error: Error | string, context?: any) {
    if (!this.initialized) {
      console.error('[ErrorMonitoring] Error captured (Sentry not initialized):', error);
      return;
    }

    if (context) {
      Sentry.withScope((scope) => {
        scope.setContext('additional', context);
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: any = 'info', context?: any) {
    if (!this.initialized) {
      console.log(`[ErrorMonitoring] Message captured (${level}):`, message);
      return;
    }

    if (context) {
      Sentry.withScope((scope) => {
        scope.setContext('additional', context);
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string) {
    if (!this.initialized) return null;
    
    return Sentry.startTransaction({
      name,
      op,
    });
  }

  /**
   * Wrap async function with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: { operation?: string; [key: string]: any }
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.captureException(error as Error, context);
      throw error;
    }
  }

  /**
   * Create error boundary fallback
   */
  createErrorBoundaryFallback(resetError: () => void) {
    return (error: Error, errorInfo: { componentStack: string }) => {
      this.captureException(error, {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
      });
      
      // You can return a custom error UI here
      console.error('Error boundary caught:', error);
    };
  }

  /**
   * Performance monitoring helpers
   */
  measurePerformance(name: string, fn: () => void) {
    const transaction = this.startTransaction(name, 'custom');
    const startTime = Date.now();
    
    try {
      fn();
    } finally {
      const duration = Date.now() - startTime;
      
      if (transaction) {
        transaction.setData('duration', duration);
        transaction.finish();
      }
      
      // Log slow operations
      if (duration > 1000) {
        this.captureMessage(
          `Slow operation: ${name} took ${duration}ms`,
          'warning',
          { duration, operation: name }
        );
      }
    }
  }

  /**
   * Network request monitoring
   */
  monitorNetworkRequest(url: string, method: string, startTime: number, error?: Error) {
    const duration = Date.now() - startTime;
    
    this.addBreadcrumb({
      message: `${method} ${url}`,
      category: 'network',
      level: error ? 'error' : 'info',
      data: {
        url,
        method,
        duration,
        error: error?.message,
      },
    });
    
    // Alert on slow requests
    if (duration > 5000) {
      this.captureMessage(
        `Slow network request: ${method} ${url} took ${duration}ms`,
        'warning',
        { url, method, duration }
      );
    }
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, properties?: { [key: string]: any }) {
    this.addBreadcrumb({
      message: eventName,
      category: 'event',
      level: 'info',
      data: properties,
    });
  }

  /**
   * Flush events before app terminates
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) return true;
    
    try {
      await Sentry.flush();
      return true;
    } catch (error) {
      console.error('[ErrorMonitoring] Failed to flush events:', error);
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) return true;
    
    try {
      await Sentry.close();
      this.initialized = false;
      return true;
    } catch (error) {
      console.error('[ErrorMonitoring] Failed to close Sentry:', error);
      return false;
    }
  }

  /**
   * Enable/disable extra privacy mode for breadcrumbs/PII
   */
  setPrivacyEnabled(_enabled: boolean) {
    // In this app build, breadcrumbs are already sanitized; wiring optional flag
  }
}

// Export singleton instance
const errorMonitoring = new ErrorMonitoringService();
export default errorMonitoring;
