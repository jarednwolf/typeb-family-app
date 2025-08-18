/**
 * Analytics Service
 * 
 * Comprehensive analytics tracking for conversion optimization.
 * Integrates with Google Analytics 4, Facebook Pixel, and custom tracking.
 * 
 * Features:
 * - Google Analytics 4 event tracking
 * - Facebook Pixel integration
 * - Conversion funnel tracking
 * - UTM parameter handling
 * - Custom event tracking
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface AnalyticsEvent {
  name: string;
  category: string;
  label?: string;
  value?: number;
  parameters?: Record<string, any>;
}

export interface ConversionEvent {
  step: 'visit' | 'signup_start' | 'signup_complete' | 'activation' | 'first_task' | 'first_reward';
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  userRole?: 'parent' | 'child';
  familySize?: number;
  plan?: 'free' | 'premium';
  signupDate?: string;
}

class AnalyticsService {
  private initialized = false;
  private userId: string | null = null;
  private sessionId: string;
  private pageViewStart: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics services
   */
  private initializeAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics 4
    this.initializeGA4();

    // Initialize Facebook Pixel
    this.initializeFacebookPixel();

    // Track page views
    this.trackPageView();

    // Set up scroll tracking
    this.setupScrollTracking();

    // Set up UTM tracking
    this.trackUTMParameters();

    this.initialized = true;
  }

  /**
   * Initialize Google Analytics 4
   */
  private initializeGA4(): void {
    if (!window.gtag) {
      // Load GA4 script dynamically in production
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer!.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID || 'G-XXXXXXXXXX');
    }
  }

  /**
   * Initialize Facebook Pixel
   */
  private initializeFacebookPixel(): void {
    if (!window.fbq) {
      // Load Facebook Pixel script dynamically in production
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(script);

      window.fbq!('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID || 'XXXXXXXXXX');
      window.fbq!('track', 'PageView');
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string): void {
    const currentPath = path || window.location.pathname;
    
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: currentPath,
        page_title: document.title,
        session_id: this.sessionId,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Reset page view timer
    this.pageViewStart = Date.now();
  }

  /**
   * Track custom event
   */
  public trackEvent(event: AnalyticsEvent): void {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event.name, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        session_id: this.sessionId,
        ...event.parameters,
      });
    }

    // Facebook Pixel custom events
    if (window.fbq && event.category === 'conversion') {
      window.fbq('trackCustom', event.name, event.parameters);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  /**
   * Track conversion funnel events
   */
  public trackConversion(event: ConversionEvent): void {
    const conversionData = {
      event_category: 'conversion',
      event_label: event.step,
      value: event.value,
      currency: event.currency || 'USD',
      session_id: this.sessionId,
      ...event.metadata,
    };

    // Google Analytics conversion tracking
    if (window.gtag) {
      switch (event.step) {
        case 'visit':
          window.gtag('event', 'view_item', conversionData);
          break;
        case 'signup_start':
          window.gtag('event', 'begin_checkout', conversionData);
          break;
        case 'signup_complete':
          window.gtag('event', 'sign_up', {
            method: 'email',
            ...conversionData,
          });
          break;
        case 'activation':
          window.gtag('event', 'tutorial_complete', conversionData);
          break;
        case 'first_task':
          window.gtag('event', 'post_score', {
            score: 1,
            ...conversionData,
          });
          break;
        case 'first_reward':
          window.gtag('event', 'earn_virtual_currency', {
            virtual_currency_name: 'points',
            ...conversionData,
          });
          break;
      }
    }

    // Facebook Pixel conversion tracking
    if (window.fbq) {
      switch (event.step) {
        case 'signup_start':
          window.fbq('track', 'InitiateCheckout', conversionData);
          break;
        case 'signup_complete':
          window.fbq('track', 'CompleteRegistration', conversionData);
          break;
        case 'activation':
          window.fbq('track', 'Subscribe', conversionData);
          break;
      }
    }
  }

  /**
   * Track scroll depth
   */
  private setupScrollTracking(): void {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set<number>();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        thresholds.forEach(threshold => {
          if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            this.trackEvent({
              name: 'scroll_depth',
              category: 'engagement',
              label: `${threshold}%`,
              value: threshold,
            });
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Track UTM parameters
   */
  public trackUTMParameters(): void {
    const params = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = params.get(param);
      if (value) {
        utmParams[param] = value;
      }
    });

    if (Object.keys(utmParams).length > 0) {
      // Store UTM parameters in session storage
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));

      // Track campaign event
      this.trackEvent({
        name: 'campaign_land',
        category: 'acquisition',
        parameters: utmParams,
      });
    }
  }

  /**
   * Get stored UTM parameters
   */
  public getUTMParameters(): Record<string, string> {
    const stored = sessionStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Track time on page
   */
  public trackTimeOnPage(): void {
    const timeOnPage = Math.round((Date.now() - this.pageViewStart) / 1000);
    
    this.trackEvent({
      name: 'time_on_page',
      category: 'engagement',
      label: window.location.pathname,
      value: timeOnPage,
    });
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: UserProperties): void {
    this.userId = properties.userId || null;

    // Google Analytics user properties
    if (window.gtag) {
      window.gtag('set', 'user_properties', properties);
      if (properties.userId) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID || 'G-XXXXXXXXXX', {
          user_id: properties.userId,
        });
      }
    }

    // Facebook Pixel user properties
    if (window.fbq && properties.userId) {
      window.fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID || 'XXXXXXXXXX', {
        external_id: properties.userId,
      });
    }
  }

  /**
   * Track CTA clicks
   */
  public trackCTAClick(ctaName: string, location: string): void {
    this.trackEvent({
      name: 'cta_click',
      category: 'engagement',
      label: ctaName,
      parameters: {
        cta_location: location,
        page_path: window.location.pathname,
      },
    });
  }

  /**
   * Track form interactions
   */
  public trackFormInteraction(formName: string, action: 'start' | 'complete' | 'error', fieldName?: string): void {
    this.trackEvent({
      name: `form_${action}`,
      category: 'form',
      label: formName,
      parameters: {
        field_name: fieldName,
      },
    });
  }

  /**
   * Track video engagement
   */
  public trackVideoEngagement(action: 'play' | 'pause' | 'complete', videoName: string, watchTime?: number): void {
    this.trackEvent({
      name: `video_${action}`,
      category: 'video',
      label: videoName,
      value: watchTime,
    });
  }

  /**
   * Track A/B test exposure
   */
  public trackABTestExposure(testName: string, variant: string): void {
    this.trackEvent({
      name: 'ab_test_exposure',
      category: 'experiment',
      label: testName,
      parameters: {
        variant,
      },
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();