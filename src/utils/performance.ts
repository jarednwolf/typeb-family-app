/**
 * Performance Monitoring Utilities
 * 
 * Provides tools for measuring and tracking app performance metrics
 * including render times, API latency, memory usage, and user interactions
 */

import { Platform } from 'react-native';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'mb' | 'count' | 'percent';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
  sessionId: string;
  timestamp: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private sessionId: string;
  private isEnabled: boolean = __DEV__; // Only enable in development by default

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Start a performance measurement
   */
  mark(name: string): void {
    if (!this.isEnabled) return;
    this.marks.set(name, Date.now());
  }

  /**
   * End a performance measurement and record the duration
   */
  measure(name: string, startMark: string, metadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;
    
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Performance mark '${startMark}' not found`);
      return null;
    }

    const duration = Date.now() - startTime;
    
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      metadata
    });

    // Clean up the mark
    this.marks.delete(startMark);
    
    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;
    
    this.metrics.push(metric);
    
    // Log in development
    if (__DEV__) {
      console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`, metric.metadata);
    }

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName: string, callback: () => void): void {
    if (!this.isEnabled) return;
    
    const startMark = `${componentName}_render_start`;
    this.mark(startMark);
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      const duration = this.measure(`${componentName}_render`, startMark, {
        component: componentName
      });
      
      // Alert if render takes too long
      if (duration && duration > 100) {
        console.warn(`Slow render detected: ${componentName} took ${duration}ms`);
      }
      
      callback();
    });
  }

  /**
   * Measure API call performance
   */
  async measureAPI<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startMark = `${name}_api_start`;
    this.mark(startMark);
    
    try {
      const result = await apiCall();
      
      const duration = this.measure(`${name}_api`, startMark, {
        ...metadata,
        status: 'success'
      });
      
      // Alert if API call is slow
      if (duration && duration > 3000) {
        console.warn(`Slow API call: ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      this.measure(`${name}_api`, startMark, {
        ...metadata,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Track memory usage (approximate)
   */
  trackMemoryUsage(): void {
    if (!this.isEnabled) return;
    
    // This is a simplified memory tracking
    // In production, you'd use more sophisticated tools
    if ((global as any).performance && (global as any).performance.memory) {
      const memory = (global as any).performance.memory;
      
      this.recordMetric({
        name: 'memory_usage',
        value: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
        unit: 'mb',
        timestamp: new Date().toISOString(),
        metadata: {
          heapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576),
          totalHeapSize: Math.round(memory.totalJSHeapSize / 1048576)
        }
      });
    }
  }

  /**
   * Track list scroll performance
   */
  trackScrollPerformance(listName: string, fps: number): void {
    if (!this.isEnabled) return;
    
    this.recordMetric({
      name: `${listName}_scroll_fps`,
      value: fps,
      unit: 'count',
      timestamp: new Date().toISOString(),
      metadata: {
        list: listName,
        smooth: fps >= 55 // Consider 55+ FPS as smooth
      }
    });
    
    if (fps < 30) {
      console.warn(`Poor scroll performance in ${listName}: ${fps} FPS`);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    return {
      metrics: [...this.metrics],
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Platform.select({
          ios: 'iOS Device',
          android: 'Android Device',
          default: 'Unknown'
        })
      },
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {
      totalMetrics: this.metrics.length,
      sessionId: this.sessionId
    };

    // Calculate averages for each metric type
    const metricGroups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      summary[name] = {
        average: Math.round(avg),
        max,
        min,
        count: values.length
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component performance
 */
export const usePerformanceTracking = (componentName: string) => {
  const trackRender = (callback?: () => void) => {
    performanceMonitor.measureRender(componentName, callback || (() => {}));
  };

  const trackAPI = async <T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measureAPI(`${componentName}_${name}`, apiCall, metadata);
  };

  const trackCustom = (name: string, value: number, unit: PerformanceMetric['unit'] = 'ms') => {
    performanceMonitor.recordMetric({
      name: `${componentName}_${name}`,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata: { component: componentName }
    });
  };

  return {
    trackRender,
    trackAPI,
    trackCustom
  };
};

/**
 * Performance thresholds for alerting
 */
export const PERFORMANCE_THRESHOLDS = {
  // Screen navigation
  SCREEN_LOAD: 300, // ms
  
  // API calls
  API_FAST: 500, // ms
  API_NORMAL: 1000, // ms
  API_SLOW: 3000, // ms
  
  // Rendering
  RENDER_FAST: 16, // ms (60 FPS)
  RENDER_NORMAL: 50, // ms
  RENDER_SLOW: 100, // ms
  
  // List scrolling
  SCROLL_FPS_SMOOTH: 55,
  SCROLL_FPS_ACCEPTABLE: 30,
  SCROLL_FPS_POOR: 20,
  
  // Memory
  MEMORY_LOW: 50, // MB
  MEMORY_NORMAL: 100, // MB
  MEMORY_HIGH: 200, // MB
  
  // Task operations
  TASK_CREATE: 1000, // ms
  TASK_UPDATE: 500, // ms
  TASK_DELETE: 500, // ms
  TASK_LOAD_LIST: 2000, // ms
  
  // Image operations
  IMAGE_UPLOAD: 3000, // ms for 5MB
  IMAGE_THUMBNAIL: 500, // ms
  
  // Offline sync
  SYNC_QUICK: 2000, // ms
  SYNC_NORMAL: 5000, // ms
  SYNC_SLOW: 10000, // ms
};

export default performanceMonitor;