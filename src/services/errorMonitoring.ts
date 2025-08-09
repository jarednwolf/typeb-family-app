import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

class ErrorMonitoringService {
  private isInitialized = false;
  private isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  private enableCrashReporting = process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true';

  async initialize() {
    // Only initialize in production or if explicitly enabled
    if (!this.isProduction && !this.enableCrashReporting) {
      console.log('Error monitoring disabled in development mode');
      return;
    }

    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!sentryDsn) {
      console.warn('Sentry DSN not configured');
      return;
    }

    try {
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
        debug: !this.isProduction,
        tracesSampleRate: this.isProduction ? 0.2 : 1.0, // 20% in production, 100% in dev
        attachStacktrace: true,
        attachScreenshot: true, // Attach screenshots to errors
        
        // Release tracking
        release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
        dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString(),
        
        // Integration configuration
        integrations: [
          new Sentry.ReactNativeTracing({
            tracingOrigins: ['localhost', /^\//],
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],
        
        // Before sending event
        beforeSend: (event, hint) => {
          // Filter out non-critical errors in production
          if (this.isProduction) {
            // Don't send network errors that are expected
            if (event.exception?.values?.[0]?.type === 'NetworkError') {
              return null;
            }
            
            // Sanitize sensitive data
            if (event.request?.cookies) {
              delete event.request.cookies;
            }
            if (event.user?.email) {
              event.user.email = '***';
            }
          }
          
          // Log to console in development
          if (!this.isProduction) {
            console.error('Sentry Event:', event, hint);
          }
          
          return event;
        },
        
        // Breadcrumb filtering
        beforeBreadcrumb: (breadcrumb) => {
          // Filter out sensitive breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }
          
          // Sanitize data in breadcrumbs
          if (breadcrumb.data?.password) {
            breadcrumb.data.password = '***';
          }
          
          return breadcrumb;
        },
      });

      this.isInitialized = true;
      console.log('Error monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  // Capture exception with context
  captureException(error: Error | string, context?: Record<string, any>) {
    if (!this.isInitialized) {
      console.error('Error (not sent to Sentry):', error, context);
      return;
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(errorObj);
    });
  }

  // Capture message (for non-error events)
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (!this.isInitialized) {
      console.log(`Message (${level}):`, message, context);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  // Set user context
  setUser(user: { id: string; email?: string; username?: string; familyId?: string } | null) {
    if (!this.isInitialized) return;

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        // Add custom attributes
        familyId: user.familyId,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  // Add breadcrumb for tracking user actions
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }) {
    if (!this.isInitialized) {
      console.log('Breadcrumb:', breadcrumb);
      return;
    }

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  // Set tag for categorization
  setTag(key: string, value: string | number | boolean) {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
  }

  // Set multiple tags
  setTags(tags: Record<string, string | number | boolean>) {
    if (!this.isInitialized) return;
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  // Performance monitoring
  startTransaction(name: string, op: string = 'navigation') {
    if (!this.isInitialized) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  // Profiling for performance issues
  startProfiling() {
    if (!this.isInitialized || !this.isProduction) return;
    
    // Start profiling session
    Sentry.startProfiling();
  }

  stopProfiling() {
    if (!this.isInitialized || !this.isProduction) return;
    
    // Stop profiling session
    Sentry.stopProfiling();
  }

  // Crash test (for testing only)
  testCrash() {
    if (this.isProduction) {
      console.warn('Crash test disabled in production');
      return;
    }
    
    throw new Error('Test crash - this is intentional for testing error reporting');
  }

  // Network error tracking
  trackNetworkError(url: string, status: number, error?: string) {
    this.captureMessage(`Network Error: ${url}`, 'error', {
      url,
      status,
      error,
      platform: Platform.OS,
    });
  }

  // Track failed API calls
  trackApiError(endpoint: string, error: any, params?: any) {
    this.captureException(error, {
      endpoint,
      params: params ? JSON.stringify(params) : undefined,
      platform: Platform.OS,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    if (!this.isInitialized) return;

    Sentry.withScope((scope) => {
      scope.setContext('performance', {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString(),
      });
      Sentry.captureMessage(`Performance: ${metric}`, 'info');
    });
  }

  // Session tracking
  startSession() {
    if (!this.isInitialized) return;
    Sentry.startSession();
  }

  endSession() {
    if (!this.isInitialized) return;
    Sentry.endSession();
  }

  // Clear all data (for logout)
  clear() {
    if (!this.isInitialized) return;
    
    Sentry.setUser(null);
    Sentry.setTags({});
    Sentry.clearBreadcrumbs();
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// React Error Boundary Component
import React, { Component, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to Sentry
    errorMonitoring.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We've encountered an unexpected error. The issue has been reported and we'll fix it soon.
          </Text>
          <Button title="Try Again" onPress={this.handleReset} />
          {__DEV__ && (
            <Text style={styles.error}>
              {this.state.error?.toString()}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  error: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffebee',
    color: '#c62828',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});