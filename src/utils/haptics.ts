/**
 * Haptic Feedback Utility
 * 
 * Provides a unified interface for haptic feedback across the app
 * with user preference support and platform compatibility
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAppSelector } from '../hooks/redux';

// Haptic feedback service
export const HapticFeedback = {
  // Light feedback for selections
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    } else {
      // Android doesn't have selection feedback, use light impact instead
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  // Impact feedback with different intensities
  impact: {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  },
  
  // Notification feedback for task states
  notification: {
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  },
  
  // Custom patterns for celebrations
  celebration: async () => {
    // Create a fun celebration pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  
  // Task-specific patterns
  taskComplete: () => HapticFeedback.notification.success(),
  taskDelete: () => HapticFeedback.impact.medium(),
  taskCreate: () => HapticFeedback.impact.light(),
  taskUpdate: () => HapticFeedback.selection(),
};

// Hook for haptic feedback with user preferences
export const useHaptics = () => {
  // TODO: Replace with actual selector when settings slice is updated
  // const hapticEnabled = useAppSelector(selectHapticSettings);
  const hapticEnabled = true; // Default to enabled for now
  
  return {
    selection: () => hapticEnabled && HapticFeedback.selection(),
    impact: {
      light: () => hapticEnabled && HapticFeedback.impact.light(),
      medium: () => hapticEnabled && HapticFeedback.impact.medium(),
      heavy: () => hapticEnabled && HapticFeedback.impact.heavy(),
    },
    notification: {
      success: () => hapticEnabled && HapticFeedback.notification.success(),
      warning: () => hapticEnabled && HapticFeedback.notification.warning(),
      error: () => hapticEnabled && HapticFeedback.notification.error(),
    },
    celebration: () => hapticEnabled && HapticFeedback.celebration(),
    // Task-specific methods
    taskComplete: () => hapticEnabled && HapticFeedback.taskComplete(),
    taskDelete: () => hapticEnabled && HapticFeedback.taskDelete(),
    taskCreate: () => hapticEnabled && HapticFeedback.taskCreate(),
    taskUpdate: () => hapticEnabled && HapticFeedback.taskUpdate(),
  };
};

// Utility to check if haptics are supported
export const isHapticsSupported = () => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};