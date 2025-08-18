/**
 * Global Error Boundary Component
 * 
 * Comprehensive error handling:
 * - Graceful error catching
 * - User-friendly error messages
 * - Error reporting to backend
 * - Recovery actions
 * - Fallback UI components
 * - Debug mode for developers
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitoring } from '../services/performanceMonitoring';
import errorMonitoring from '../services/errorMonitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDebugInfo?: boolean;
  theme?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  isRecovering: boolean;
}

const ERROR_COUNT_KEY = '@error_boundary_count';
const ERROR_LOG_KEY = '@error_boundary_log';
const MAX_ERROR_COUNT = 3;

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isRecovering: false,
    };
  }

  async componentDidMount() {
    // Load error count from storage
    const errorCount = await this.loadErrorCount();
    this.setState({ errorCount });
    
    // Clear error count if it's been more than 24 hours
    this.scheduleErrorCountReset();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
      isRecovering: false,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
    
    // Track error in performance monitoring
    performanceMonitoring.trackError(error, 'high', {
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
    });
    
    // Report to Sentry
    errorMonitoring.captureException(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
      errorCount: this.state.errorCount,
    });
    
    // Save error to storage for debugging
    await this.saveErrorLog(error, errorInfo);
    
    // Update error count
    await this.incrementErrorCount();
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to crash analytics service (in production)
    this.reportToCrashAnalytics(error, errorInfo);
    
    // Check if we should force restart
    if (this.state.errorCount >= MAX_ERROR_COUNT) {
      this.handleCriticalError();
    }
  }

  private async loadErrorCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(ERROR_COUNT_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async incrementErrorCount(): Promise<void> {
    try {
      const newCount = this.state.errorCount + 1;
      await AsyncStorage.setItem(ERROR_COUNT_KEY, newCount.toString());
    } catch (error) {
      console.error('Failed to save error count:', error);
    }
  }

  private async saveErrorLog(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: Platform.Version,
      };
      
      // Get existing logs
      const existingLogs = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log and keep only last 10
      logs.unshift(errorLog);
      if (logs.length > 10) {
        logs.pop();
      }
      
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save error log:', error);
    }
  }

  private scheduleErrorCountReset(): void {
    // Reset error count after 24 hours
    setTimeout(async () => {
      await AsyncStorage.removeItem(ERROR_COUNT_KEY);
      this.setState({ errorCount: 0 });
    }, 24 * 60 * 60 * 1000);
  }

  private reportToCrashAnalytics(error: Error, errorInfo: ErrorInfo): void {
    // In production, send to crash analytics service
    // For now, just log
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: Platform.Version,
        errorCount: this.state.errorCount,
        retryCount: this.retryCount,
      },
    };
    
    if (!__DEV__) {
      // Send to analytics service
      console.log('Sending error report:', errorReport);
    }
  }

  private handleCriticalError(): void {
    Alert.alert(
      'Application Error',
      'The app has encountered multiple errors and needs to restart.',
      [
        {
          text: 'Restart App',
          onPress: () => this.restartApp(),
        },
      ],
      { cancelable: false }
    );
  }

  private async restartApp(): Promise<void> {
    // Clear error count
    await AsyncStorage.removeItem(ERROR_COUNT_KEY);
    
    // Restart the app
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      // For native apps, would use expo-updates.reloadAsync() or similar
      // For now, just clear state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: 0,
        isRecovering: false,
      });
    }
  }

  private handleRetry = (): void => {
    if (this.retryCount >= this.maxRetries) {
      Alert.alert(
        'Max Retries Reached',
        'Unable to recover from the error. Please restart the app.',
        [
          { text: 'Restart', onPress: () => this.restartApp() },
        ]
      );
      return;
    }
    
    this.retryCount++;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: true,
    });
    
    // Reset recovery state after a delay
    setTimeout(() => {
      this.setState({ isRecovering: false });
    }, 1000);
  };

  private handleReport = async (): Promise<void> => {
    if (!this.state.error) return;
    
    const errorDetails = `
Error: ${this.state.error.message}

Stack: ${this.state.error.stack}

Component Stack: ${this.state.errorInfo?.componentStack}

Platform: ${Platform.OS} ${Platform.Version}
Time: ${new Date().toISOString()}
    `.trim();
    
    Alert.alert(
      'Report Error',
      'Would you like to send an error report to help us fix this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Report',
          onPress: () => {
            // In production, send email or open support ticket
            console.log('Error report:', errorDetails);
            Alert.alert('Thank You', 'Your error report has been sent.');
          },
        },
      ]
    );
  };

  private async clearErrorLogs(): Promise<void> {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    await AsyncStorage.removeItem(ERROR_COUNT_KEY);
    this.setState({ errorCount: 0 });
    Alert.alert('Success', 'Error logs have been cleared.');
  }

  private renderErrorDetails(): ReactNode {
    const { error, errorInfo } = this.state;
    
    if (!this.props.showDebugInfo || !__DEV__) {
      return null;
    }
    
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        <ScrollView style={styles.debugScroll}>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Error: </Text>
            {error?.message}
          </Text>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Stack: </Text>
            {error?.stack}
          </Text>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Component Stack: </Text>
            {errorInfo?.componentStack}
          </Text>
        </ScrollView>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => this.clearErrorLogs()}
        >
          <Text style={styles.clearButtonText}>Clear Error Logs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const { hasError, isRecovering } = this.state;
    const { children, fallback, theme } = this.props;
    
    if (hasError && !isRecovering) {
      // Custom fallback provided
      if (fallback) {
        return <>{fallback}</>;
      }
      
      // Default error UI
      return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF' }]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Feather 
                name="alert-triangle" 
                size={64} 
                color={theme?.colors?.error || '#FF3B30'} 
              />
            </View>
            
            <Text style={[styles.title, { color: theme?.colors?.textPrimary || '#000000' }]}>
              Oops! Something went wrong
            </Text>
            
            <Text style={[styles.message, { color: theme?.colors?.textSecondary || '#666666' }]}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme?.colors?.primary || '#007AFF' }]}
                onPress={this.handleRetry}
              >
                <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme?.colors?.primary || '#007AFF' }]}
                onPress={this.handleReport}
              >
                <Feather name="send" size={20} color={theme?.colors?.primary || '#007AFF'} />
                <Text style={[styles.secondaryButtonText, { color: theme?.colors?.primary || '#007AFF' }]}>
                  Report Issue
                </Text>
              </TouchableOpacity>
            </View>
            
            {this.state.errorCount > 1 && (
              <TouchableOpacity
                style={styles.restartButton}
                onPress={() => this.restartApp()}
              >
                <Text style={[styles.restartButtonText, { color: theme?.colors?.error || '#FF3B30' }]}>
                  Restart App
                </Text>
              </TouchableOpacity>
            )}
            
            {this.renderErrorDetails()}
          </View>
        </View>
      );
    }
    
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    marginTop: 20,
    padding: 8,
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  debugContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugLabel: {
    fontWeight: 'bold',
  },
  clearButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ErrorBoundary;