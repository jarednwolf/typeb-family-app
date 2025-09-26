import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

interface PerformanceMetrics {
  appStartTime: number;
  screenLoadTimes: Map<string, number>;
  apiCallTimes: Map<string, number[]>;
  imageLoadTimes: number[];
  memoryUsage: number;
  jsFrameRate: number;
}

interface PerformanceReport {
  appStartTime: number;
  avgScreenLoadTime: number;
  avgAPICallTime: number;
  avgImageLoadTime: number;
  slowScreens: Array<{ name: string; time: number }>;
  slowAPICalls: Array<{ name: string; avgTime: number; maxTime: number }>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;
  private marks: Map<string, number>;
  private isEnabled: boolean;
  
  constructor() {
    this.startTime = Date.now();
    this.marks = new Map();
    this.isEnabled = !__DEV__; // Only enable in production
    this.metrics = {
      appStartTime: 0,
      screenLoadTimes: new Map(),
      apiCallTimes: new Map(),
      imageLoadTimes: [],
      memoryUsage: 0,
      jsFrameRate: 60,
    };
    
    this.setupPerformanceMonitoring();
  }
  
  private setupPerformanceMonitoring() {
    if (!this.isEnabled) return;
    
    // Monitor JS frame rate
    let lastFrameTime = Date.now();
    const frameMonitor = () => {
      const now = Date.now();
      const frameTime = now - lastFrameTime;
      if (frameTime > 0) {
        this.metrics.jsFrameRate = Math.min(60, 1000 / frameTime);
      }
      lastFrameTime = now;
      requestAnimationFrame(frameMonitor);
    };
    requestAnimationFrame(frameMonitor);
  }
  
  // Mark app initialization complete
  markAppReady() {
    if (!this.isEnabled) return;
    
    this.metrics.appStartTime = Date.now() - this.startTime;
    
    analytics().logEvent('app_startup_time', {
      duration: this.metrics.appStartTime,
      platform: Platform.OS,
    });
    
    if (this.metrics.appStartTime > 3000) {
      crashlytics().log(`Slow app startup detected: ${this.metrics.appStartTime}ms`);
    }
    
    // Send to Firestore for dashboard
    this.sendMetricToFirestore('performance', {
      type: 'app_startup',
      startupTime: this.metrics.appStartTime,
      platform: Platform.OS,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Track screen transitions
  trackScreenTransition(fromScreen: string, toScreen: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const transitionKey = `screen_${fromScreen}_to_${toScreen}`;
    const startTime = Date.now();
    this.marks.set(transitionKey, startTime);
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.screenLoadTimes.set(transitionKey, duration);
      
      if (duration > 500) {
        analytics().logEvent('slow_screen_transition', {
          from: fromScreen,
          to: toScreen,
          duration,
        });
      }
      
      // Send to Firestore
      this.sendMetricToFirestore('performance', {
        type: 'screen_transition',
        screenLoadTime: duration,
        fromScreen,
        toScreen,
        platform: Platform.OS,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    };
  }
  
  // Track API calls
  async trackAPICall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) return apiCall();
    
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      // Store timing
      const times = this.metrics.apiCallTimes.get(name) || [];
      times.push(duration);
      this.metrics.apiCallTimes.set(name, times);
      
      // Log slow API calls
      if (duration > 1000) {
        analytics().logEvent('slow_api_call', {
          api: name,
          duration,
        });
        
        crashlytics().log(`Slow API call: ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      crashlytics().recordError(error as Error, `API call failed: ${name}`);
      
      analytics().logEvent('api_call_error', {
        api: name,
        duration,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }
  
  // Track image loading
  trackImageLoad(uri: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.metrics.imageLoadTimes.push(duration);
      
      if (duration > 2000) {
        analytics().logEvent('slow_image_load', {
          duration,
          uri: uri.substring(0, 50), // Truncate for privacy
        });
      }
    };
  }
  
  // Track custom metrics
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    analytics().logEvent('custom_metric', {
      metric_name: name,
      metric_value: value,
      ...metadata,
    });
    
    // Send to Firestore for dashboard
    this.sendMetricToFirestore('performance', {
      type: 'custom',
      name,
      value,
      metadata,
      platform: Platform.OS,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Get performance report
  getPerformanceReport(): PerformanceReport {
    const screenLoadTimes = Array.from(this.metrics.screenLoadTimes.values());
    const avgScreenLoadTime = screenLoadTimes.length > 0
      ? screenLoadTimes.reduce((a, b) => a + b, 0) / screenLoadTimes.length
      : 0;
    
    const allAPITimes = Array.from(this.metrics.apiCallTimes.values()).flat();
    const avgAPICallTime = allAPITimes.length > 0
      ? allAPITimes.reduce((a, b) => a + b, 0) / allAPITimes.length
      : 0;
    
    const avgImageLoadTime = this.metrics.imageLoadTimes.length > 0
      ? this.metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.imageLoadTimes.length
      : 0;
    
    const slowScreens = Array.from(this.metrics.screenLoadTimes.entries())
      .filter(([_, time]) => time > 500)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time);
    
    const slowAPICalls = Array.from(this.metrics.apiCallTimes.entries())
      .filter(([_, times]) => times.some(t => t > 1000))
      .map(([name, times]) => ({
        name,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
      }))
      .sort((a, b) => b.maxTime - a.maxTime);
    
    return {
      appStartTime: this.metrics.appStartTime,
      avgScreenLoadTime,
      avgAPICallTime,
      avgImageLoadTime,
      slowScreens,
      slowAPICalls,
    };
  }
  
  // Send performance report to backend
  async submitPerformanceReport() {
    if (!this.isEnabled) return;
    
    const report = this.getPerformanceReport();
    
    // Log to analytics
    await analytics().logEvent('performance_report', {
      app_start: Math.round(report.appStartTime),
      avg_screen_load: Math.round(report.avgScreenLoadTime),
      avg_api_call: Math.round(report.avgAPICallTime),
      avg_image_load: Math.round(report.avgImageLoadTime),
      slow_screens_count: report.slowScreens.length,
      slow_api_calls_count: report.slowAPICalls.length,
      platform: Platform.OS,
    });
    
    // Send detailed report to Firestore
    try {
      await firestore().collection('performanceReports').add({
        ...report,
        platform: Platform.OS,
        jsFrameRate: this.metrics.jsFrameRate,
        timestamp: firestore.FieldValue.serverTimestamp(),
        version: '1.0.0', // Get from app config
      });
    } catch (error) {
      console.error('Failed to submit performance report:', error);
    }
  }
  
  // Helper to send metrics to Firestore
  private async sendMetricToFirestore(collection: string, data: any) {
    try {
      await firestore().collection(collection).add(data);
    } catch (error) {
      console.error(`Failed to send metric to ${collection}:`, error);
    }
  }
  
  // Clear metrics (useful for testing)
  clearMetrics() {
    this.metrics = {
      appStartTime: 0,
      screenLoadTimes: new Map(),
      apiCallTimes: new Map(),
      imageLoadTimes: [],
      memoryUsage: 0,
      jsFrameRate: 60,
    };
    this.marks.clear();
  }
  
  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  
  // Get current metrics (for debugging)
  getCurrentMetrics(): PerformanceMetrics {
    return this.metrics;
  }
}

// Export singleton instance
export default new PerformanceMonitor();
