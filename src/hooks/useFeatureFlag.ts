import { useState, useEffect } from 'react';
import { featureFlagService, FeatureFlag } from '../services/featureFlags';

/**
 * Hook to check feature flag status
 * @param flag - Feature flag to check
 * @param defaultValue - Default value while loading
 * @returns Tuple of [isEnabled, isLoading]
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  defaultValue = false
): [boolean, boolean] {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const enabled = await featureFlagService.isEnabled(flag);
        setIsEnabled(enabled);
      } catch (error) {
        console.error(`[useFeatureFlag] Error checking ${flag}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFlag();
  }, [flag]);

  return [isEnabled, isLoading];
}