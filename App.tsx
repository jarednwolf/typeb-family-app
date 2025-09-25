import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
const notificationService = require('./src/services/notifications').default;
const backgroundTaskService = require('./src/services/backgroundTasks').default;
import { useRealtimeSyncManager } from './src/hooks/useRealtimeSync';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
const revenueCatService = require('./src/services/revenueCat').default;
import ErrorBoundary from './src/components/ErrorBoundary';
const errorMonitoring = require('./src/services/errorMonitoring').default;
const { configureGoogleSignIn } = require('./src/services/auth');
import i18n from './src/i18n';

// Runtime dev warnings are handled via LogBox in device builds; omitted for type-check

function AppContent() {
  // Initialize realtime sync
  useRealtimeSyncManager();
  
  // Get auth state from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // Initialize all services
    const initializeServices = async () => {
      try {
        // Initialize error monitoring (Sentry)
        errorMonitoring.initialize();
        
        // Configure Google Sign-In
        configureGoogleSignIn();
        
        // Initialize local and push notifications
        await notificationService.initialize();
        
        // Initialize background tasks
        await backgroundTaskService.initialize();
        
        // Initialize RevenueCat
        await revenueCatService.initialize();
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Error initializing services:', error);
        errorMonitoring.captureException(error as Error);
      }
    };

    initializeServices();
  }, []);

  // Handle user authentication changes
  useEffect(() => {
    const handleUserChange = async () => {
      if (user?.uid) {
        try {
          // Set user context for error monitoring
          errorMonitoring.setUser({
            id: user.uid,
            email: user.email || undefined,
            username: user.displayName || undefined,
          });
          
          // Identify user in RevenueCat
          await revenueCatService.identifyUser(user.uid);
          console.log('User services configured for:', user.uid);
        } catch (error) {
          console.error('Error configuring user services:', error);
          errorMonitoring.captureException(error as Error);
        }
      } else {
        // User logged out, clean up
        try {
          errorMonitoring.setUser(null);
          await revenueCatService.logOut();
          console.log('User services cleaned up');
        } catch (error) {
          console.error('Error cleaning up user services:', error);
        }
      }
    };

    handleUserChange();
  }, [user]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary showDebugInfo={__DEV__}>
      <Provider store={store}>
        <ThemeProvider>
          <AccessibilityProvider>
            <AppContent />
          </AccessibilityProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}
