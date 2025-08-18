import React, { Component, ReactNode, ErrorInfo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analytics';
import { errorReportingService } from '../../services/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log to analytics
      analyticsService.track('app_error' as any, {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });

      // Report to error reporting service
      await errorReportingService.reportError(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorCount: this.state.errorCount,
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    // In React Native, we can't programmatically reload the app
    // So we'll just reset the error boundary and suggest manual restart
    Alert.alert(
      'Restart Required',
      'Please close and reopen the app to fully reload.',
      [
        { text: 'Try Again', onPress: this.handleReset },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Would you like to send an error report to help us fix this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Report', 
          onPress: async () => {
            try {
              await errorReportingService.sendUserReport({
                error: this.state.error?.message || 'Unknown error',
                stack: this.state.error?.stack || '',
                componentStack: this.state.errorInfo?.componentStack || '',
                userDescription: 'App crashed unexpectedly',
              });
              Alert.alert('Thank You', 'Your report has been sent successfully.');
            } catch (error) {
              Alert.alert('Failed', 'Unable to send report. Please try again later.');
            }
          }
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              <Ionicons 
                name="alert-circle-outline" 
                size={80} 
                color="#FF6B6B" 
              />
              
              <Text style={styles.title}>Oops! Something went wrong</Text>
              
              <Text style={styles.message}>
                We're sorry for the inconvenience. The app encountered an unexpected error.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                  <Text style={styles.errorDetailsText}>
                    {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <ScrollView style={styles.stackTrace}>
                      <Text style={styles.stackTraceText}>
                        {this.state.error.stack}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleReload}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Reload App</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleReset}
                >
                  <Text style={styles.secondaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.tertiaryButton]}
                  onPress={this.handleReportIssue}
                >
                  <Ionicons name="bug-outline" size={20} color="#666666" />
                  <Text style={styles.tertiaryButtonText}>Report Issue</Text>
                </TouchableOpacity>
              </View>

              {this.state.errorCount > 2 && (
                <View style={styles.persistentErrorContainer}>
                  <Ionicons name="warning-outline" size={20} color="#FFA500" />
                  <Text style={styles.persistentErrorText}>
                    This error keeps occurring. Please try restarting the app completely.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButtonText: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 8,
  },
  errorDetails: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    maxWidth: 350,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CC0000',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#CC0000',
    fontFamily: 'monospace',
  },
  stackTrace: {
    maxHeight: 200,
    marginTop: 10,
  },
  stackTraceText: {
    fontSize: 10,
    color: '#CC0000',
    fontFamily: 'monospace',
  },
  persistentErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE0A0',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    maxWidth: 350,
  },
  persistentErrorText: {
    fontSize: 12,
    color: '#CC6600',
    marginLeft: 8,
    flex: 1,
  },
});

export default ErrorBoundary;