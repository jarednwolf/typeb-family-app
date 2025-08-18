'use client';

import { useState, useEffect } from 'react';

/**
 * Feature Flag Hook
 * 
 * Custom hook for managing feature flags in the application.
 * Integrates with Firebase Remote Config for A/B testing and controlled rollouts.
 * 
 * @param flagName - The name of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function useFeatureFlag(flagName: string): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // In production, this would integrate with Firebase Remote Config
    // For now, we'll use localStorage for development
    const checkFeatureFlag = async () => {
      try {
        // Check localStorage first for development
        const localFlags = localStorage.getItem('featureFlags');
        if (localFlags) {
          const flags = JSON.parse(localFlags);
          setIsEnabled(flags[flagName] || false);
          return;
        }

        // Default feature flags for development
        const defaultFlags: Record<string, boolean> = {
          enableNewHeroSection: true,
          enableDemoVideo: true,
          enableTestimonials: true,
          enableEmailCaptureModal: true,
          enableSocialProof: true,
        };

        setIsEnabled(defaultFlags[flagName] || false);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      }
    };

    checkFeatureFlag();
  }, [flagName]);

  return isEnabled;
}

/**
 * Set a feature flag value (for development/testing)
 * 
 * @param flagName - The name of the feature flag
 * @param value - The value to set
 */
export function setFeatureFlag(flagName: string, value: boolean): void {
  try {
    const flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
    flags[flagName] = value;
    localStorage.setItem('featureFlags', JSON.stringify(flags));
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
      detail: { flagName, value } 
    }));
  } catch (error) {
    console.error('Error setting feature flag:', error);
  }
}

/**
 * Get all feature flags (for development/testing)
 * 
 * @returns Object containing all feature flags
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('featureFlags') || '{}');
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return {};
  }
}