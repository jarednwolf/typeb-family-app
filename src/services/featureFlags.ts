import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { app } from './firebase';
import { analyticsService } from './analytics';

/**
 * Feature flag service for A/B testing and controlled rollouts
 * @remarks
 * Follows TypeB development standards - no emojis, comprehensive documentation
 */
class FeatureFlagService {
  private remoteConfig: RemoteConfig;
  private isInitialized = false;
  private defaultValues = {
    // Phase 0 flags
    enableThumbnailGeneration: false,
    enableCloudFunctions: false,
    enableAnalyticsDashboard: false,
    enableDenormalizedCounters: false,
    
    // Phase 1 flags (for future)
    enableNewHeroSection: false,
    enableDemoVideo: false,
    enableTestimonials: false,
    enableEmailCaptureModal: false,
    
    // Kill switches
    killSwitchTaskCreation: false,
    killSwitchPhotoUpload: false,
    killSwitchNotifications: false,
  };

  constructor() {
    this.remoteConfig = getRemoteConfig(app);
    this.initialize();
  }

  /**
   * Initialize Remote Config with default values
   * @throws {Error} If Remote Config fails to initialize
   */
  private async initialize(): Promise<void> {
    try {
      // Set default values
      this.remoteConfig.defaultConfig = this.defaultValues;
      
      // Set minimum fetch interval (5 minutes for production, 0 for dev)
      this.remoteConfig.settings.minimumFetchIntervalMillis = 
        __DEV__ ? 0 : 5 * 60 * 1000;
      
      // Fetch and activate
      await fetchAndActivate(this.remoteConfig);
      this.isInitialized = true;
      
      // Track initialization
      analyticsService.track('remote_config_initialized');
      
      console.log('[FeatureFlags] Remote Config initialized successfully');
    } catch (error) {
      console.error('[FeatureFlags] Failed to initialize:', error);
      analyticsService.trackError(error as Error, false);
      // Use defaults if Remote Config fails
      this.isInitialized = false;
    }
  }

  /**
   * Check if a feature flag is enabled
   * @param flag - Feature flag key
   * @returns boolean indicating if feature is enabled
   */
  async isEnabled(flag: keyof typeof this.defaultValues): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        // Return default value if not initialized
        return this.defaultValues[flag] as boolean;
      }
      
      const value = getValue(this.remoteConfig, flag);
      const isEnabled = value.asBoolean();
      
      // Track feature flag check
      analyticsService.track('feature_flag_checked', {
        flag,
        enabled: isEnabled,
      });
      
      return isEnabled;
    } catch (error) {
      console.error(`[FeatureFlags] Error checking flag ${flag}:`, error);
      return this.defaultValues[flag] as boolean;
    }
  }

  /**
   * Get all active feature flags (for debugging)
   * @returns Object with all flag values
   */
  async getAllFlags(): Promise<Record<string, boolean>> {
    const flags: Record<string, boolean> = {};
    
    for (const key of Object.keys(this.defaultValues)) {
      flags[key] = await this.isEnabled(key as keyof typeof this.defaultValues);
    }
    
    return flags;
  }

  /**
   * Force refresh Remote Config values
   * @returns Promise that resolves when refresh is complete
   */
  async refresh(): Promise<void> {
    try {
      await fetchAndActivate(this.remoteConfig);
      analyticsService.track('remote_config_refreshed');
    } catch (error) {
      console.error('[FeatureFlags] Failed to refresh:', error);
      analyticsService.trackError(error as Error, false);
    }
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();

// Export types
export type FeatureFlag = keyof typeof featureFlagService['defaultValues'];