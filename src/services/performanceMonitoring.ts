import { InteractionManager, Platform } from 'react-native';
import { analyticsService } from './analytics';
import { errorReportingService } from './errorReporting';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface NavigationMetric {
  screen: string;
  previousScreen?: string;
  transitionDuration: number;
  renderDuration: number;
  interactionReady: number;
  timestamp: Date;
}

interface MemoryMetric {
  used: number;
  total: number;
  percentage: number;
  timestamp: Date;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private navigationMetrics: NavigationMetric[] = [];
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();
  private maxMetricsStored = 100;
  private navigationStartTime: number | null = null;
  private currentScreen: string | null = null;
  private previousScreen: string | null = null;
  private isEnabled = !__DEV__ || process.env.EXPO_PUBLIC_PERFORMANCE_MONITORING === 'true';

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (!this.isEnabled) return;

    // Monitor app state changes for performance impacts
    if (Platform.OS !== 'web') {
      // React Native specific monitoring
      this.monitorInteractionManager();
    }
  }

  private monitorInteractionManager() {
    // Monkey patch InteractionManager to track long tasks
    const originalRunAfterInteractions = InteractionManager.runAfterInteractions;
    InteractionManager.runAfterInteractions = (callback: () => void) => {
      const startTime = Date.now();
      return originalRunAfterInteractions(() => {
        const duration = Date.now() - startTime;
        if (duration > 100) {
          this.recordMetric('long_interaction', duration, 'ms', {
            threshold: 100,
          });
        }
        callback();
      });
    };
  }

  // Mark a point in time for performance measurement
  mark(name: string): void {
    if (!this.isEnabled) return;
    this.marks.set(name, Date.now());
  }

  // Measure the time between two marks
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.isEnabled) return null;

    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : Date.now();

    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return null;
    }

    const duration = (endMark && !this.marks.has(endMark)) ? 0 : (end || Date.now()) - start;
    this.measures.set(name, duration);

    // Record as metric
    this.recordMetric(name, duration, 'ms', {
      startMark,
      endMark: endMark || 'now',
    });

    // Clean up marks if needed
    if (endMark) {
      this.marks.delete(startMark);
      this.marks.delete(endMark);
    }

    return duration;
  }

  // Record a custom performance metric
  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep metrics list bounded
    if (this.metrics.length > this.maxMetricsStored) {
      this.metrics.shift();
    }

    // Log to analytics if significant
    if (this.isSignificantMetric(name, value)) {
      analyticsService.trackTiming('performance', name, value, unit);
    }

    // Report performance issues
    this.checkPerformanceThresholds(name, value, unit);
  }

  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      screen_transition: 300,
      screen_render: 500,
      api_call: 1000,
      image_load: 500,
      data_fetch: 800,
    };

    const threshold = thresholds[name] || 1000;
    return value > threshold;
  }

  private checkPerformanceThresholds(name: string, value: number, unit: string): void {
    const criticalThresholds: Record<string, number> = {
      screen_transition: 1000,
      screen_render: 2000,
      api_call: 5000,
      app_startup: 3000,
    };

    const threshold = criticalThresholds[name];
    if (threshold && value > threshold) {
      errorReportingService.capturePerformanceIssue(
        `${name} (${unit})`,
        value,
        threshold
      );
    }
  }

  // Navigation performance tracking
  startNavigation(toScreen: string): void {
    if (!this.isEnabled) return;

    this.previousScreen = this.currentScreen;
    this.currentScreen = toScreen;
    this.navigationStartTime = Date.now();
    this.mark(`nav_start_${toScreen}`);
  }

  endNavigation(screen: string): void {
    if (!this.isEnabled || !this.navigationStartTime) return;

    const transitionDuration = Date.now() - this.navigationStartTime;
    const renderMark = `nav_render_${screen}`;
    const interactionMark = `nav_interaction_${screen}`;

    // Mark when the screen is rendered
    this.mark(renderMark);

    // Wait for interactions to complete
    InteractionManager.runAfterInteractions(() => {
      this.mark(interactionMark);

      const renderDuration = this.measure(
        `${screen}_render`,
        `nav_start_${screen}`,
        renderMark
      ) || 0;

      const interactionReady = this.measure(
        `${screen}_interaction`,
        `nav_start_${screen}`,
        interactionMark
      ) || 0;

      const metric: NavigationMetric = {
        screen,
        previousScreen: this.previousScreen || undefined,
        transitionDuration,
        renderDuration,
        interactionReady,
        timestamp: new Date(),
      };

      this.navigationMetrics.push(metric);

      // Keep navigation metrics bounded
      if (this.navigationMetrics.length > 50) {
        this.navigationMetrics.shift();
      }

      // Log to analytics
      analyticsService.track('screen_performance' as any, {
        screen,
        transition_ms: transitionDuration,
        render_ms: renderDuration,
        interaction_ms: interactionReady,
        from_screen: this.previousScreen,
      });

      this.navigationStartTime = null;
    });
  }

  // Memory monitoring
  async checkMemoryUsage(): Promise<MemoryMetric | null> {
    if (!this.isEnabled) return null;

    try {
      // This is a placeholder - actual memory monitoring would require native modules
      // In a real implementation, you'd use react-native-get-random-values or similar
      const used = 100 * 1024 * 1024; // Mock 100MB
      const total = 512 * 1024 * 1024; // Mock 512MB
      const percentage = (used / total) * 100;

      const metric: MemoryMetric = {
        used,
        total,
        percentage,
        timestamp: new Date(),
      };

      if (percentage > 80) {
        console.warn('High memory usage detected:', percentage.toFixed(2) + '%');
        errorReportingService.addBreadcrumb(
          `High memory usage: ${percentage.toFixed(2)}%`,
          'performance'
        );
      }

      return metric;
    } catch (error) {
      console.error('Failed to check memory usage:', error);
      return null;
    }
  }

  // FPS monitoring (for animations)
  private frameCount = 0;
  private lastFrameTime = Date.now();
  private fpsValues: number[] = [];

  measureFPS(): number {
    const now = Date.now();
    const delta = now - this.lastFrameTime;

    if (delta >= 1000) {
      const fps = (this.frameCount * 1000) / delta;
      this.fpsValues.push(fps);

      if (this.fpsValues.length > 10) {
        this.fpsValues.shift();
      }

      if (fps < 30) {
        this.recordMetric('low_fps', fps, 'count', {
          threshold: 30,
        });
      }

      this.frameCount = 0;
      this.lastFrameTime = now;
      return fps;
    }

    this.frameCount++;
    return this.fpsValues[this.fpsValues.length - 1] || 60;
  }

  // Get average FPS
  getAverageFPS(): number {
    if (this.fpsValues.length === 0) return 60;
    return this.fpsValues.reduce((a, b) => a + b, 0) / this.fpsValues.length;
  }

  // Bundle size tracking
  trackBundleSize(size: number): void {
    if (!this.isEnabled) return;

    this.recordMetric('bundle_size', size, 'bytes', {
      platform: Platform.OS,
    });

    if (size > 50 * 1024 * 1024) {
      // Alert if bundle is over 50MB
      console.warn('Large bundle size detected:', (size / 1024 / 1024).toFixed(2) + 'MB');
    }
  }

  // API performance tracking
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status?: number
  ): void {
    if (!this.isEnabled) return;

    this.recordMetric('api_call', duration, 'ms', {
      endpoint,
      method,
      status,
      success: status ? status < 400 : undefined,
    });

    if (duration > 3000) {
      errorReportingService.captureNetworkError(
        endpoint,
        method,
        status,
        `Slow API response: ${duration}ms`
      );
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    navigationMetrics: NavigationMetric[];
    averageFPS: number;
    slowScreens: string[];
  } {
    const slowScreens = this.navigationMetrics
      .filter(m => m.interactionReady > 1000)
      .map(m => m.screen);

    return {
      metrics: [...this.metrics],
      navigationMetrics: [...this.navigationMetrics],
      averageFPS: this.getAverageFPS(),
      slowScreens: [...new Set(slowScreens)],
    };
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.navigationMetrics = [];
    this.marks.clear();
    this.measures.clear();
    this.fpsValues = [];
  }

  // Export metrics for debugging
  exportMetrics(): string {
    return JSON.stringify(this.getPerformanceSummary(), null, 2);
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export types
export type { PerformanceMetric, NavigationMetric, MemoryMetric };