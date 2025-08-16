import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';
import notificationService from './src/services/notifications';
import backgroundTaskService from './src/services/backgroundTasks';
import { useRealtimeSyncManager } from './src/hooks/useRealtimeSync';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { revenueCat } from './src/services/revenueCat';

// Ignore specific warnings that are not critical for development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'Non-serializable values were found',
]);

function AppContent() {
  // Initialize realtime sync
  useRealtimeSyncManager();
  
  // Get auth state from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // Initialize notification services
    const initializeServices = async () => {
      try {
        // Initialize local and push notifications
        await notificationService.initialize();
        
        // Initialize background tasks
        await backgroundTaskService.initialize();
        
        console.log('All notification services initialized');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();
  }, []);

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (user?.uid) {
        try {
          await revenueCat.configure(user.uid);
          console.log('RevenueCat initialized for user:', user.uid);
        } catch (error) {
          console.error('Error initializing RevenueCat:', error);
        }
      } else {
        // User logged out, clean up RevenueCat
        try {
          await revenueCat.logout();
          console.log('RevenueCat logged out');
        } catch (error) {
          console.error('Error logging out RevenueCat:', error);
        }
      }
    };

    initializeRevenueCat();
  }, [user]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </ThemeProvider>
    </Provider>
  );
}
