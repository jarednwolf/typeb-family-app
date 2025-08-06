import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';

// Ignore specific warnings that are not critical for development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'Non-serializable values were found',
]);

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
