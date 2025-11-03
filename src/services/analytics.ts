import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from './firebase';

// Analytics event types
export type AnalyticsEvent = 
  // Authentication events
  | 'sign_up'
  | 'login'
  | 'logout'
  | 'password_reset'
  
  // Family events
  | 'family_created'
  | 'family_joined'
  | 'family_member_added'
  | 'family_member_removed'
  | 'invite_code_generated'
  | 'invite_code_used'
  
  // Task events
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'task_deleted'
  | 'task_assigned'
  | 'photo_uploaded'
  | 'photo_validated'
  | 'photo_rejected'
  
  // Premium/Purchase events
  | 'premium_screen_viewed'
  | 'purchase_initiated'
  | 'purchase_completed'
  | 'purchase_cancelled'
  | 'purchase_error'
  | 'restore_initiated'
  | 'restore_completed'
  | 'restore_error'
  | 'subscription_status_checked'
  | 'subscription_status_updated'
  | 'offerings_fetched'
  | 'offerings_fetch_error'
  
  // Support events
  | 'support_ticket_created'
  | 'support_ticket_updated'
  | 'support_response_added'
  | 'faq_viewed'
  | 'faq_voted'
  | 'faq_search'
  
  // Category events
  | 'custom_category_created'
  | 'custom_category_updated'
  | 'custom_category_deleted'
  
  // Notification events
  | 'notification_received'
  | 'notification_opened'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'smart_notification_scheduled'
  
  // Analytics dashboard events
  | 'analytics_dashboard_viewed'
  | 'analytics_report_generated'
  | 'analytics_filter_applied'
  
  // App lifecycle events
  | 'app_opened'
  | 'app_backgrounded'
  | 'app_crashed'
  | 'app_updated'
  
  // RevenueCat specific events
  | 'revenueCat_configured'
  | 'revenueCat_configuration_error'
  | 'revenueCat_logout'
  | 'revenueCat_logout_error'
  | 'purchases_synced'
  | 'purchases_sync_error'
  
  // Error events
  | 'error_boundary_triggered'
  | 'api_error'
  | 'network_error';

interface RevenueData {
  productId: string;
  price: number;
  currency: string;
  quantity: number;
}

interface UserProperties {
  userId?: string;
  familyId?: string;
  role?: 'parent' | 'child';
  isPremium?: boolean;
  subscriptionType?: 'free' | 'premium';
  deviceType?: string;
  appVersion?: string;
  osVersion?: string;
  locale?: string;
}

class AnalyticsService {
  private analytics: any = null;
  private isInitialized = false;
  private isProduction = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ENVIRONMENT) === 'production';
  private enableAnalytics = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ENABLE_ANALYTICS) === 'true';

  // Keys that are considered sensitive and will be masked in analytics params
  private static readonly SENSITIVE_KEYS = new Set([
    'email', 'userEmail', 'displayName', 'name', 'firstName', 'lastName',
    'phone', 'phoneNumber', 'avatar', 'avatarUrl', 'address', 'location',
    'lat', 'lng', 'latitude', 'longitude', 'ip', 'token', 'idToken', 'accessToken'
  ]);

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Only initialize Firebase Analytics in production or if explicitly enabled
      if (this.isProduction || this.enableAnalytics) {
        // Firebase Analytics is automatically available in web/production builds
        // For native apps, it requires additional setup
        if (Platform.OS === 'web') {
          this.analytics = getAnalytics(app);
          this.isInitialized = true;
          console.log('Analytics initialized for web');
        } else {
          // For native platforms, Firebase Analytics requires additional native setup
          // This would be handled by expo-firebase-analytics or react-native-firebase
          console.log('Analytics not available for native platform in current setup');
        }
      } else {
        console.log('Analytics disabled in development mode');
      }

      // Set default user properties
      await this.setDefaultUserProperties();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async setDefaultUserProperties() {
    try {
      const properties: UserProperties = {
        deviceType: Device.deviceType ? String(Device.deviceType) : undefined,
        appVersion: Constants.expoConfig?.version || 'unknown',
        osVersion: Platform.Version?.toString() || 'unknown',
        locale: typeof Constants.expoConfig?.locales?.[0] === 'string'
          ? Constants.expoConfig.locales[0]
          : 'en',
      };

      await this.setUserProperties(properties);
    } catch (error) {
      console.error('Failed to set default user properties:', error);
    }
  }

  // Track a custom event
  track(eventName: AnalyticsEvent | string, params?: Record<string, any>) {
    try {
      const canonicalName = this.canonicalizeEventName(String(eventName));
      const scrubbedParams = this.scrubPII(params || {});

      // Always log to console in development (scrubbed)
      if (!this.isProduction) {
        console.log(`📊 Analytics Event: ${eventName} (→ ${canonicalName})`, scrubbedParams);
      }

      // Send to Firebase Analytics if initialized
      if (this.isInitialized && this.analytics) {
        logEvent(this.analytics, canonicalName, {
          ...scrubbedParams,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        });
      }

      // Also send to custom analytics endpoint if configured
      if (this.isProduction) {
        this.sendToCustomAnalytics(canonicalName, scrubbedParams);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track screen view
  trackScreen(screenName: string, params?: Record<string, any>) {
    this.track('screen_view' as any, {
      screen_name: screenName,
      ...params,
    });
  }

  // Track revenue event
  trackRevenue(data: RevenueData) {
    this.track('purchase' as any, {
      value: data.price,
      currency: data.currency,
      transaction_id: `${Date.now()}_${data.productId}`,
      items: [{
        item_id: data.productId,
        item_name: data.productId,
        price: data.price,
        quantity: data.quantity,
      }],
    });
  }

  // Set user ID for analytics
  async setUserId(userId: string | null) {
    try {
      if (!this.isProduction) {
        console.log(`📊 Analytics: Setting user ID: ${userId}`);
      }

      if (this.isInitialized && this.analytics) {
        setUserId(this.analytics, userId);
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  // Set user properties
  async setUserProperties(properties: UserProperties) {
    try {
      if (!this.isProduction) {
        console.log('📊 Analytics: Setting user properties:', properties);
      }

      if (this.isInitialized && this.analytics) {
        setUserProperties(this.analytics, properties as any);
      }
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  // Track timing events (e.g., how long a task takes)
  trackTiming(category: string, variable: string, time: number, label?: string) {
    this.track('timing_complete' as any, {
      timing_category: category,
      timing_variable: variable,
      timing_time: time,
      timing_label: label,
    });
  }

  // Track errors
  trackError(error: Error | string, fatal: boolean = false) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;

    this.track('app_exception' as any, {
      description: errorMessage,
      stack: errorStack,
      fatal,
    });
  }

  // Send to custom analytics endpoint (for additional analytics services)
  private async sendToCustomAnalytics(eventName: string, params?: Record<string, any>) {
    try {
      const functionsUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_CLOUD_FUNCTIONS_URL : undefined;
      if (!functionsUrl) return;

      // Send analytics data to your backend
      await fetch(`${functionsUrl}/trackAnalyticsEvent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          params,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version,
        }),
      });
    } catch (error) {
      // Silently fail - we don't want analytics errors to affect the app
      console.debug('Failed to send custom analytics:', error);
    }
  }

  // Batch events for performance (useful for high-frequency events)
  private eventQueue: Array<{ event: string; params: any }> = [];
  private batchTimer: any = null;

  trackBatched(eventName: AnalyticsEvent | string, params?: Record<string, any>) {
    this.eventQueue.push({ event: eventName, params });

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, 5000); // Flush every 5 seconds
    }

    // Flush immediately if queue is large
    if (this.eventQueue.length >= 20) {
      this.flushBatch();
    }
  }

  private flushBatch() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Send batched events
    events.forEach(({ event, params }) => {
      this.track(event, params);
    });
  }

  // Session tracking
  private sessionStartTime: number = Date.now();

  startSession() {
    this.sessionStartTime = Date.now();
    this.track('session_start' as any);
  }

  endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.track('session_end' as any, {
      session_duration: sessionDuration,
    });
  }

  // Performance monitoring
  measurePerformance(name: string, startMark: string, endMark: string) {
    try {
      if (typeof performance !== 'undefined' && performance.measure) {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        
        if (measure) {
          this.trackTiming('performance', name, measure.duration);
        }
      }
    } catch (error) {
      console.debug('Performance measurement not available:', error);
    }
  }

  // Convert freeform event names used in app/tests to canonical snake_case for providers
  private canonicalizeEventName(eventName: string): string {
    const map: Record<string, string> = {
      'Purchase Completed': 'purchase_completed',
      'Purchases Restored': 'restore_completed',
      'Trial Started': 'trial_started',
      'Premium Screen Viewed': 'premium_screen_viewed',
      'Task Created': 'task_created',
      'Task Completed': 'task_completed',
    };
    return map[eventName] || eventName.replace(/\s+/g, '_').toLowerCase();
  }

  // Scrub PII recursively from params
  private scrubPII(input: any): any {
    if (input == null) return input;
    if (Array.isArray(input)) return input.map((v) => this.scrubPII(v));
    if (typeof input !== 'object') return this.maskIfSensitiveValue('', input);

    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (AnalyticsService.SENSITIVE_KEYS.has(key)) {
        output[key] = '***';
        continue;
      }
      if (value && typeof value === 'object') {
        output[key] = this.scrubPII(value);
      } else {
        output[key] = this.maskIfSensitiveValue(key, value);
      }
    }
    return output;
  }

  private maskIfSensitiveValue(key: string, value: any): any {
    if (typeof value !== 'string') return value;
    const v = value as string;
    // Email pattern
    if (/(.+)@(.+)\.(.+)/.test(v)) return '***@***';
    // Phone-like digits
    const digits = v.replace(/\D/g, '');
    if (digits.length >= 7) return `***${digits.slice(-2)}`;
    // Tokens
    if (/^(eyJ|ya29\.|pk_live_|pk_test_)/.test(v)) return '***';
    // Names - if key suggests name, mask partially
    if (/name/i.test(key)) return v.length <= 2 ? '**' : `${v[0]}***`;
    return v;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types
export type { RevenueData, UserProperties };
export default analyticsService;