'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/services/analytics';

/**
 * Conversion Tracking Hook
 * 
 * Custom hook for tracking conversion funnel events and user interactions.
 * Automatically tracks page visits and provides methods for tracking conversions.
 * 
 * @returns Object with tracking methods
 */
export function useConversionTracking() {
  const hasTrackedVisit = useRef(false);

  useEffect(() => {
    // Track initial visit
    if (!hasTrackedVisit.current) {
      analytics.trackConversion({
        step: 'visit',
        metadata: {
          referrer: document.referrer,
          landing_page: window.location.pathname,
        },
      });
      hasTrackedVisit.current = true;
    }

    // Track page unload time
    return () => {
      analytics.trackTimeOnPage();
    };
  }, []);

  /**
   * Track signup start
   */
  const trackSignupStart = (source: string) => {
    analytics.trackConversion({
      step: 'signup_start',
      metadata: {
        source,
        utm_params: analytics.getUTMParameters(),
      },
    });
  };

  /**
   * Track signup completion
   */
  const trackSignupComplete = (userId: string, method: string = 'email') => {
    analytics.trackConversion({
      step: 'signup_complete',
      metadata: {
        user_id: userId,
        method,
        utm_params: analytics.getUTMParameters(),
      },
    });

    // Set user properties
    analytics.setUserProperties({
      userId,
      signupDate: new Date().toISOString(),
    });
  };

  /**
   * Track user activation
   */
  const trackActivation = (userId: string, activationType: string) => {
    analytics.trackConversion({
      step: 'activation',
      metadata: {
        user_id: userId,
        activation_type: activationType,
      },
    });
  };

  /**
   * Track first task creation
   */
  const trackFirstTask = (userId: string, taskType: string) => {
    analytics.trackConversion({
      step: 'first_task',
      metadata: {
        user_id: userId,
        task_type: taskType,
      },
    });
  };

  /**
   * Track first reward redemption
   */
  const trackFirstReward = (userId: string, rewardValue: number) => {
    analytics.trackConversion({
      step: 'first_reward',
      value: rewardValue,
      metadata: {
        user_id: userId,
      },
    });
  };

  /**
   * Track CTA click
   */
  const trackCTAClick = (ctaName: string, location: string) => {
    analytics.trackCTAClick(ctaName, location);
  };

  /**
   * Track form interaction
   */
  const trackFormInteraction = (formName: string, action: 'start' | 'complete' | 'error', fieldName?: string) => {
    analytics.trackFormInteraction(formName, action, fieldName);
  };

  /**
   * Track video engagement
   */
  const trackVideoEngagement = (action: 'play' | 'pause' | 'complete', videoName: string, watchTime?: number) => {
    analytics.trackVideoEngagement(action, videoName, watchTime);
  };

  /**
   * Track A/B test exposure
   */
  const trackABTestExposure = (testName: string, variant: string) => {
    analytics.trackABTestExposure(testName, variant);
  };

  return {
    trackSignupStart,
    trackSignupComplete,
    trackActivation,
    trackFirstTask,
    trackFirstReward,
    trackCTAClick,
    trackFormInteraction,
    trackVideoEngagement,
    trackABTestExposure,
  };
}