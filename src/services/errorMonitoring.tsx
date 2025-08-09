import React, { Component, ReactNode } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';

// Mock Sentry for development - in production, install @sentry/react-native
const Sentry = {
  init: (config: any) => console.log('Sentry init:', config),
  withScope: (callback: Function) => callback({}),
  captureException: (error: any) => console.error('Sentry exception:', error),
  captureMessage: (message: string, level?: string) => console.log(`Sentry ${level}:`, message),
  setUser: (user: any) => console.log('Sentry user:', user),
  setTag: (key: string, value: any) => console.log('Sentry tag:', key, value),
  setTags: (tags: any) => console.log('Sentry tags:', tags),
  addBreadcrumb: (breadcrumb: any) => console.log('Sentry breadcrumb:', breadcrumb),
  clearBreadcrumbs: () => console.log('Sentry breadcrumbs cleared'),
  startTransaction: (config: any) => ({ finish: () => {} }),
  startSession: () => console.log('Sentry session started'),
  endSession: () => console.log('Sentry session ended'),
  startProfiling: () => console.log('Sentry profiling started'),
  stopProfiling: () => console.log('Sentry profiling stopped'),
  ReactNativeTracing: class {},
  ReactNavigationInstrumentation: class {},
};

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

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
      // In production, this would use the real Sentry SDK
      console.log('Initializing error monitoring with DSN:', sentryDsn);
      this.isInitialized = true;
      console.log('Error monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  // Capture exception with context
  captureException(error: Error | string, context?: Record<string, any>) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    if (!this.isInitialized) {
      console.error('Error (not sent to Sentry):', errorObj, context);
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(errorObj);
    });
  }

  // Capture message (for non-error events)
  captureMessage(message: string, level: SeverityLevel = 'info', context?: Record<string, any>) {
    if (!this.isInitialized) {
      console.log(`Message (${level}):`, message, context);
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  // Set user context
  setUser(user: { id: string; email?: string; username?: string; familyId?: string } | null) {
    if (!this.isInitialized) return;
    Sentry.setUser(user);
  }

  // Add breadcrumb for tracking user actions
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: SeverityLevel;
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
    Sentry.setTags(tags);
  }

  // Performance monitoring
  startTransaction(name: string, op: string = 'navigation') {
    if (!this.isInitialized) return null;
    return Sentry.startTransaction({ name, op });
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

    Sentry.withScope((scope: any) => {
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

  // Crash test (for testing only)
  testCrash() {
    if (this.isProduction) {
      console.warn('Crash test disabled in production');
      return;
    }
    
    throw new Error('Test crash - this is intentional for testing error reporting');
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// React Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to error monitoring
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
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>
              {this.state.error.toString()}
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});