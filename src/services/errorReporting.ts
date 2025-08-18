import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { analyticsService } from './analytics';
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  metadata?: Record<string, any>;
  userDescription?: string;
  userId?: string;
  familyId?: string;
  timestamp: Date;
  platform: string;
  appVersion: string;
  osVersion: string;
  deviceType?: string;
  environment: string;
}

interface ErrorContext {
  componentStack?: string;
  errorBoundary?: boolean;
  errorCount?: number;
  screen?: string;
  action?: string;
  [key: string]: any;
}

class ErrorReportingService {
  private errorQueue: ErrorReport[] = [];
  private isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  private maxQueueSize = 50;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (!__DEV__) {
      const originalHandler = (global as any).onunhandledrejection;
      (global as any).onunhandledrejection = (event: any) => {
        this.reportError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          { unhandledRejection: true }
        );
        if (originalHandler && typeof originalHandler === 'function') {
          try {
            originalHandler(event);
          } catch (e) {
            // Ignore errors from original handler
          }
        }
      };
    }
  }

  async reportError(error: Error | string, context?: ErrorContext): Promise<void> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'object' ? error.stack : undefined;

      // Log to analytics
      analyticsService.trackError(error, context?.errorBoundary === true);

      // Create error report
      const report: ErrorReport = {
        message: errorMessage,
        stack: errorStack,
        componentStack: context?.componentStack,
        metadata: context,
        timestamp: new Date(),
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || 'unknown',
        osVersion: Platform.Version?.toString() || 'unknown',
        deviceType: Constants.deviceName || undefined,
        environment: this.isProduction ? 'production' : 'development',
      };

      // In development, just log to console
      if (__DEV__) {
        console.error('Error Report:', report);
        return;
      }

      // Add to queue for batch processing
      this.addToQueue(report);

      // Send immediately if it's a critical error
      if (context?.errorBoundary || context?.fatal) {
        await this.flushQueue();
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  async sendUserReport(data: {
    error: string;
    stack?: string;
    componentStack?: string;
    userDescription: string;
  }): Promise<void> {
    try {
      const report: ErrorReport = {
        message: data.error,
        stack: data.stack,
        componentStack: data.componentStack,
        userDescription: data.userDescription,
        timestamp: new Date(),
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || 'unknown',
        osVersion: Platform.Version?.toString() || 'unknown',
        deviceType: Constants.deviceName || undefined,
        environment: this.isProduction ? 'production' : 'development',
      };

      // Send to Firestore
      await this.sendToFirestore([report]);

      // Also send to backend API if available
      await this.sendToBackend([report]);
    } catch (error) {
      console.error('Failed to send user report:', error);
      throw error;
    }
  }

  private addToQueue(report: ErrorReport): void {
    this.errorQueue.push(report);

    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Schedule batch processing
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushQueue();
      }, 10000); // Flush every 10 seconds
    }

    // Flush immediately if queue is getting large
    if (this.errorQueue.length >= 10) {
      this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const reports = [...this.errorQueue];
    this.errorQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Send to Firestore
      await this.sendToFirestore(reports);

      // Send to backend API
      await this.sendToBackend(reports);
    } catch (error) {
      console.error('Failed to flush error queue:', error);
      // Re-add reports to queue on failure (with limit)
      if (this.errorQueue.length < this.maxQueueSize / 2) {
        this.errorQueue.unshift(...reports.slice(0, 5));
      }
    }
  }

  private async sendToFirestore(reports: ErrorReport[]): Promise<void> {
    if (!this.isProduction) return;

    try {
      const errorCollection = collection(db, 'errorReports');
      
      // Send reports in batches to avoid overwhelming Firestore
      const batchSize = 5;
      for (let i = 0; i < reports.length; i += batchSize) {
        const batch = reports.slice(i, i + batchSize);
        await Promise.all(
          batch.map(report => 
            addDoc(errorCollection, {
              ...report,
              timestamp: Timestamp.fromDate(report.timestamp),
            })
          )
        );
      }
    } catch (error) {
      console.error('Failed to send errors to Firestore:', error);
    }
  }

  private async sendToBackend(reports: ErrorReport[]): Promise<void> {
    try {
      const functionsUrl = process.env.EXPO_PUBLIC_CLOUD_FUNCTIONS_URL;
      if (!functionsUrl || !this.isProduction) return;

      await fetch(`${functionsUrl}/reportErrorBatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors: reports }),
      });
    } catch (error) {
      // Silently fail - we don't want error reporting to cause more errors
      console.debug('Failed to send errors to backend:', error);
    }
  }

  // Capture breadcrumbs for better error context
  private breadcrumbs: Array<{
    message: string;
    category: string;
    timestamp: Date;
    data?: any;
  }> = [];
  private maxBreadcrumbs = 20;

  addBreadcrumb(message: string, category: string, data?: any): void {
    this.breadcrumbs.push({
      message,
      category,
      timestamp: new Date(),
      data,
    });

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  getBreadcrumbs(): typeof this.breadcrumbs {
    return [...this.breadcrumbs];
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // Performance monitoring integration
  capturePerformanceIssue(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      this.reportError(
        `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
        {
          performance: true,
          metric,
          value,
          threshold,
          breadcrumbs: this.getBreadcrumbs(),
        }
      );
    }
  }

  // Network error handling
  captureNetworkError(url: string, method: string, status?: number, error?: any): void {
    this.reportError(
      `Network error: ${method} ${url} failed with status ${status || 'unknown'}`,
      {
        network: true,
        url,
        method,
        status,
        error: error?.toString(),
        breadcrumbs: this.getBreadcrumbs(),
      }
    );
  }

  // User feedback integration
  async captureUserFeedback(
    errorId: string,
    feedback: {
      email?: string;
      name?: string;
      comments: string;
    }
  ): Promise<void> {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) return;

      await fetch(`${apiUrl}/errors/${errorId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
    } catch (error) {
      console.error('Failed to send user feedback:', error);
    }
  }

  // Session replay for debugging (stores last N actions)
  private sessionReplay: Array<{
    action: string;
    timestamp: Date;
    data?: any;
  }> = [];
  private maxSessionReplaySize = 50;

  recordAction(action: string, data?: any): void {
    this.sessionReplay.push({
      action,
      timestamp: new Date(),
      data,
    });

    if (this.sessionReplay.length > this.maxSessionReplaySize) {
      this.sessionReplay.shift();
    }
  }

  getSessionReplay(): typeof this.sessionReplay {
    return [...this.sessionReplay];
  }

  // Cleanup method
  async flush(): Promise<void> {
    await this.flushQueue();
  }
}

// Export singleton instance
export const errorReportingService = new ErrorReportingService();

// Export types
export type { ErrorReport, ErrorContext };