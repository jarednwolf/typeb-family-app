import React, { useEffect, useRef } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { performanceMonitoring } from '../services/performanceMonitoring';

export function useNavigationPerformance() {
  const navigation = useNavigation();
  const route = useRoute();
  const hasTrackedRef = useRef(false);

  // Track screen focus events for performance
  useFocusEffect(() => {
    if (!hasTrackedRef.current) {
      performanceMonitoring.endNavigation(route.name);
      hasTrackedRef.current = true;
    }

    return () => {
      hasTrackedRef.current = false;
    };
  });

  // Track navigation state changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      const state = e.data.state;
      if (state && state.routes && state.index !== undefined) {
        const currentRoute = state.routes[state.index];
        if (currentRoute && currentRoute.name) {
          performanceMonitoring.startNavigation(currentRoute.name);
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  return {
    markPerformance: (name: string) => performanceMonitoring.mark(name),
    measurePerformance: (name: string, startMark: string, endMark?: string) => 
      performanceMonitoring.measure(name, startMark, endMark),
    recordMetric: (name: string, value: number, unit?: 'ms' | 'bytes' | 'count') =>
      performanceMonitoring.recordMetric(name, value, unit),
  };
}

// HOC to automatically track screen performance
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  screenName?: string
): React.ComponentType<T> {
  const WrappedComponent = (props: T) => {
    const route = useRoute();
    const name = screenName || route.name;
    
    useEffect(() => {
      performanceMonitoring.startNavigation(name);
      return () => {
        performanceMonitoring.endNavigation(name);
      };
    }, [name]);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent as React.ComponentType<T>;
}