/**
 * Performance Service
 * 
 * Performance monitoring and optimization:
 * - Image lazy loading implementation
 * - List virtualization helpers
 * - Bundle size analysis
 * - Code splitting configuration
 * - Memory leak detection
 * - Cache management
 * - Network request batching
 * - Debouncing and throttling utilities
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance metrics tracking
interface PerformanceMetrics {
  appStartTime: number;
  screenTransitions: Map<string, number[]>;
  memoryUsage: number[];
  networkLatency: Map<string, number[]>;
  fps: number[];
  errorCount: number;
  cacheHitRate: number;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics;
  private cacheStore: Map<string, { data: any; timestamp: number; ttl: number }>;
  private requestQueue: Map<string, Promise<any>>;
  private batchQueue: Map<string, any[]>;
  private batchTimers: Map<string, NodeJS.Timeout>;

  private constructor() {
    this.metrics = {
      appStartTime: Date.now(),
      screenTransitions: new Map(),
      memoryUsage: [],
      networkLatency: new Map(),
      fps: [],
      errorCount: 0,
      cacheHitRate: 0,
    };
    this.cacheStore = new Map();
    this.requestQueue = new Map();
    this.batchQueue = new Map();
    this.batchTimers = new Map();
    
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initializeMonitoring() {
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processPendingRequests();
      }
    });
    
    // Clean up expired cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  // Image Lazy Loading
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => Image.prefetch(url));
    await Promise.all(promises);
  }

  // Debounce utility
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle utility
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // Cache Management
  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cached = this.cacheStore.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < cached.ttl) {
      this.metrics.cacheHitRate++;
      return cached.data as T;
    }
    
    // Check if request is already in progress
    const pendingRequest = this.requestQueue.get(key);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }
    
    // Make new request
    const request = fetcher();
    this.requestQueue.set(key, request);
    
    try {
      const data = await request;
      this.cacheStore.set(key, { data, timestamp: now, ttl });
      this.requestQueue.delete(key);
      return data;
    } catch (error) {
      this.requestQueue.delete(key);
      throw error;
    }
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cacheStore.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    for (const [key] of this.cacheStore) {
      if (regex.test(key)) {
        this.cacheStore.delete(key);
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cacheStore) {
      if (now - value.timestamp > value.ttl) {
        this.cacheStore.delete(key);
      }
    }
  }

  // Network Request Batching
  batchRequest<T>(
    batchKey: string,
    item: T,
    processor: (items: T[]) => Promise<void>,
    delay: number = 100
  ): void {
    // Add item to batch queue
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, []);
    }
    this.batchQueue.get(batchKey)!.push(item);
    
    // Clear existing timer
    const existingTimer = this.batchTimers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      const items = this.batchQueue.get(batchKey) || [];
      if (items.length > 0) {
        this.batchQueue.set(batchKey, []);
        await processor(items);
      }
      this.batchTimers.delete(batchKey);
    }, delay);
    
    this.batchTimers.set(batchKey, timer);
  }

  // Memory Management
  getMemoryUsage(): number {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        return performance.memory.usedJSHeapSize / 1048576; // Convert to MB
      }
    }
    return 0;
  }

  trackMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    this.metrics.memoryUsage.push(usage);
    
    // Keep only last 100 measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  // Screen Transition Tracking
  trackScreenTransition(screenName: string, duration: number): void {
    if (!this.metrics.screenTransitions.has(screenName)) {
      this.metrics.screenTransitions.set(screenName, []);
    }
    
    const transitions = this.metrics.screenTransitions.get(screenName)!;
    transitions.push(duration);
    
    // Keep only last 50 measurements per screen
    if (transitions.length > 50) {
      transitions.shift();
    }
  }

  // Network Latency Tracking
  async trackNetworkRequest<T>(
    endpoint: string,
    request: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await request();
      const duration = Date.now() - startTime;
      
      if (!this.metrics.networkLatency.has(endpoint)) {
        this.metrics.networkLatency.set(endpoint, []);
      }
      
      const latencies = this.metrics.networkLatency.get(endpoint)!;
      latencies.push(duration);
      
      // Keep only last 50 measurements per endpoint
      if (latencies.length > 50) {
        latencies.shift();
      }
      
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  // FPS Monitoring
  trackFPS(fps: number): void {
    this.metrics.fps.push(fps);
    
    // Keep only last 100 measurements
    if (this.metrics.fps.length > 100) {
      this.metrics.fps.shift();
    }
  }

  // Get Performance Report
  getPerformanceReport(): {
    avgScreenTransition: number;
    avgMemoryUsage: number;
    avgNetworkLatency: number;
    avgFPS: number;
    cacheHitRate: number;
    errorRate: number;
    uptime: number;
  } {
    const calculateAverage = (arr: number[]) => 
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    // Calculate average screen transition time
    let totalTransitions: number[] = [];
    for (const transitions of this.metrics.screenTransitions.values()) {
      totalTransitions = totalTransitions.concat(transitions);
    }
    
    // Calculate average network latency
    let totalLatencies: number[] = [];
    for (const latencies of this.metrics.networkLatency.values()) {
      totalLatencies = totalLatencies.concat(latencies);
    }
    
    const totalRequests = totalLatencies.length + this.metrics.cacheHitRate;
    
    return {
      avgScreenTransition: calculateAverage(totalTransitions),
      avgMemoryUsage: calculateAverage(this.metrics.memoryUsage),
      avgNetworkLatency: calculateAverage(totalLatencies),
      avgFPS: calculateAverage(this.metrics.fps),
      cacheHitRate: totalRequests > 0 ? this.metrics.cacheHitRate / totalRequests : 0,
      errorRate: totalRequests > 0 ? this.metrics.errorCount / totalRequests : 0,
      uptime: Date.now() - this.metrics.appStartTime,
    };
  }

  // Offline Request Queue
  private pendingRequests: Map<string, { request: () => Promise<any>; resolver: (value: any) => void; rejecter: (reason?: any) => void }> = new Map();

  async queueOfflineRequest<T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      return request();
    }
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(key, { request, resolver: resolve, rejecter: reject });
    });
  }

  private async processPendingRequests(): Promise<void> {
    for (const [key, { request, resolver, rejecter }] of this.pendingRequests) {
      try {
        const result = await request();
        resolver(result);
        this.pendingRequests.delete(key);
      } catch (error) {
        rejecter(error);
        this.pendingRequests.delete(key);
      }
    }
  }

  // Cleanup
  cleanup(): void {
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    this.batchQueue.clear();
    this.cacheStore.clear();
    this.requestQueue.clear();
    this.pendingRequests.clear();
  }
}

// React Hooks for Performance Optimization

// Use lazy loading for images
export const useLazyImage = (url: string, placeholder?: string) => {
  const [imageUrl, setImageUrl] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    Image.prefetch(url)
      .then(() => {
        if (isMounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [url]);
  
  return { imageUrl, isLoading, error };
};

// Use debounced value
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Use throttled callback
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
};

// Use intersection observer for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<any>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') {
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );
    
    observer.observe(ref.current);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options]);
  
  return isIntersecting;
};

// Export singleton instance
export const performanceService = PerformanceService.getInstance();

// Export performance monitoring decorator
export function measurePerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      
      console.log(`[Performance] ${propertyName} took ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[Performance] ${propertyName} failed after ${duration}ms`);
      throw error;
    }
  };
  
  return descriptor;
}

export default performanceService;