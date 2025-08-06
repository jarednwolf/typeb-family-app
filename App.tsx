import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';
import notificationService from './src/services/notifications';
import backgroundTaskService from './src/services/backgroundTasks';

// Ignore specific warnings that are not critical for development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'Non-serializable values were found',
]);

function AppContent() {
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

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
