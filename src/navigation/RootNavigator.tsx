import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { subscribeToAuthState } from '../services/auth';
import { performanceMonitoring } from '../services/performanceMonitoring';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <ActivityIndicator size="large" color="#0A0A0A" />
  </View>
);

const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const routeNameRef = useRef<string>();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((user) => {
      dispatch(setUser(user ? user.toJSON() as any : null));
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [dispatch]);

  // Track app startup performance
  useEffect(() => {
    performanceMonitoring.mark('app_startup_start');
    
    const timer = setTimeout(() => {
      performanceMonitoring.measure('app_startup', 'app_startup_start');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Track the initial route
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          routeNameRef.current = currentRoute.name;
          performanceMonitoring.startNavigation(currentRoute.name);
        }
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute();

        if (currentRoute && previousRouteName !== currentRoute.name) {
          // End tracking for previous screen
          if (previousRouteName) {
            performanceMonitoring.endNavigation(previousRouteName);
          }
          
          // Start tracking for new screen
          performanceMonitoring.startNavigation(currentRoute.name);
          routeNameRef.current = currentRoute.name;
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationTypeForReplace: 'pop',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;