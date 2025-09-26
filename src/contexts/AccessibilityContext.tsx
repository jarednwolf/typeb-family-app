import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  // Screen reader settings
  isScreenReaderEnabled: boolean;
  announceStateChanges: boolean;
  
  // Visual settings
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  boldText: boolean;
  
  // Interaction settings
  hapticFeedback: boolean;
  soundEffects: boolean;
  
  // Task-specific settings
  autoReadTaskDetails: boolean;
  verboseCompletionFeedback: boolean;
  confirmBeforeDelete: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  announce: (message: string, options?: { delay?: number }) => void;
}

const defaultSettings: AccessibilitySettings = {
  // Screen reader settings
  isScreenReaderEnabled: false,
  announceStateChanges: true,
  
  // Visual settings
  reduceMotion: false,
  highContrast: false,
  fontSize: 'medium',
  boldText: false,
  
  // Interaction settings
  hapticFeedback: true,
  soundEffects: true,
  
  // Task-specific settings
  autoReadTaskDetails: true,
  verboseCompletionFeedback: true,
  confirmBeforeDelete: true,
};

const STORAGE_KEY = '@accessibility_settings';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage and check system accessibility
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if screen reader is enabled
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        
        // Check if reduce motion is enabled
        const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled?.() || false;
        
        // Load saved settings
        const savedSettingsJson = await AsyncStorage.getItem(STORAGE_KEY);
        const savedSettings = savedSettingsJson ? JSON.parse(savedSettingsJson) : {};
        
        // Merge system settings with saved settings
        setSettings({
          ...defaultSettings,
          ...savedSettings,
          isScreenReaderEnabled: screenReaderEnabled,
          reduceMotion: reduceMotionEnabled,
        });
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Subscribe to screen reader changes
    const screenReaderChangedSubscription = AccessibilityInfo.addEventListener?.(
      'screenReaderChanged',
      (isEnabled: boolean) => {
        setSettings(prev => ({ ...prev, isScreenReaderEnabled: isEnabled }));
      }
    );

    // Subscribe to reduce motion changes (if available)
    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (isEnabled: boolean) => {
        setSettings(prev => ({ ...prev, reduceMotion: isEnabled }));
      }
    );

    return () => {
      screenReaderChangedSubscription?.remove();
      reduceMotionChangedSubscription?.remove();
    };
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = async () => {
        try {
          // Don't save system-controlled settings
          const { isScreenReaderEnabled, reduceMotion, ...settingsToSave } = settings;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
        } catch (error) {
          console.error('Failed to save accessibility settings:', error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  const updateSetting = async <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): Promise<void> => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Announce setting change to screen reader
    if (settings.isScreenReaderEnabled && settings.announceStateChanges) {
      const message = getSettingChangeAnnouncement(key, value);
      if (message) {
        announce(message);
      }
    }
  };

  const resetSettings = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Keep system settings but reset user preferences
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled?.() || false;
      
      setSettings({
        ...defaultSettings,
        isScreenReaderEnabled: screenReaderEnabled,
        reduceMotion: reduceMotionEnabled,
      });
      
      if (settings.isScreenReaderEnabled) {
        announce('Accessibility settings have been reset to defaults');
      }
    } catch (error) {
      console.error('Failed to reset accessibility settings:', error);
    }
  };

  const announce = (message: string, options?: { delay?: number }) => {
    if (settings.isScreenReaderEnabled) {
      const announceMessage = () => {
        AccessibilityInfo.announceForAccessibility(message);
      };
      
      if (options?.delay) {
        setTimeout(announceMessage, options.delay);
      } else {
        announceMessage();
      }
    }
  };

  const getSettingChangeAnnouncement = (
    key: keyof AccessibilitySettings,
    value: any
  ): string | null => {
    const announcements: Record<string, (value: any) => string> = {
      hapticFeedback: (v) => `Haptic feedback ${v ? 'enabled' : 'disabled'}`,
      soundEffects: (v) => `Sound effects ${v ? 'enabled' : 'disabled'}`,
      highContrast: (v) => `High contrast mode ${v ? 'enabled' : 'disabled'}`,
      boldText: (v) => `Bold text ${v ? 'enabled' : 'disabled'}`,
      fontSize: (v) => `Font size changed to ${v}`,
      autoReadTaskDetails: (v) => `Automatic task reading ${v ? 'enabled' : 'disabled'}`,
      verboseCompletionFeedback: (v) => `Verbose completion feedback ${v ? 'enabled' : 'disabled'}`,
      confirmBeforeDelete: (v) => `Delete confirmation ${v ? 'enabled' : 'disabled'}`,
      announceStateChanges: (v) => `State change announcements ${v ? 'enabled' : 'disabled'}`,
    };

    return announcements[key]?.(value) || null;
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announce,
  };

  if (isLoading) {
    // Return with default settings while loading
    return (
      <AccessibilityContext.Provider value={{
        settings: defaultSettings,
        updateSetting: async () => {},
        resetSettings: async () => {},
        announce: () => {},
      }}>
        {children}
      </AccessibilityContext.Provider>
    );
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Export convenience hooks for common accessibility checks
export const useScreenReader = () => {
  const { settings } = useAccessibility();
  return settings.isScreenReaderEnabled;
};

export const useReduceMotion = () => {
  const { settings } = useAccessibility();
  return settings.reduceMotion;
};

export const useHighContrast = () => {
  const { settings } = useAccessibility();
  return settings.highContrast;
};

export const useFontSize = () => {
  const { settings } = useAccessibility();
  
  const fontSizeMultipliers = {
    small: 0.85,
    medium: 1,
    large: 1.15,
    xlarge: 1.3,
  };
  
  return {
    size: settings.fontSize,
    multiplier: fontSizeMultipliers[settings.fontSize],
    scale: (baseSize: number) => baseSize * fontSizeMultipliers[settings.fontSize],
  };
};

// Helper function to generate accessibility hints
export const getAccessibilityHint = (action: string, context?: string): string => {
  const baseHint = `Double tap to ${action}`;
  return context ? `${baseHint}. ${context}` : baseHint;
};

// Helper function to generate accessibility labels
export const getAccessibilityLabel = (
  type: string,
  name: string,
  state?: Record<string, any>
): string => {
  let label = `${type}: ${name}`;
  
  if (state) {
    const stateDescriptions: string[] = [];
    
    if (state.isCompleted !== undefined) {
      stateDescriptions.push(state.isCompleted ? 'completed' : 'not completed');
    }
    
    if (state.isOverdue) {
      stateDescriptions.push('overdue');
    }
    
    if (state.priority) {
      stateDescriptions.push(`${state.priority} priority`);
    }
    
    if (state.dueDate) {
      stateDescriptions.push(`due ${state.dueDate}`);
    }
    
    if (stateDescriptions.length > 0) {
      label += `, ${stateDescriptions.join(', ')}`;
    }
  }
  
  return label;
};

export default AccessibilityContext;