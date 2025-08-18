# Week 1 Technical Implementation Guide

## Day 1-2: Quick Wins Implementation

### 1. Haptic Feedback System

#### Create Haptic Utility
```typescript
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const HapticFeedback = {
  // Light feedback for selections
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
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
  celebration: () => {
    const pattern = [0, 50, 100, 50];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 50);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
  },
};

// Hook for haptic preferences
export const useHaptics = () => {
  const settings = useAppSelector(selectHapticSettings);
  
  return {
    selection: () => settings.enabled && HapticFeedback.selection(),
    impact: {
      light: () => settings.enabled && HapticFeedback.impact.light(),
      medium: () => settings.enabled && HapticFeedback.impact.medium(),
      heavy: () => settings.enabled && HapticFeedback.impact.heavy(),
    },
    notification: {
      success: () => settings.enabled && HapticFeedback.notification.success(),
      warning: () => settings.enabled && HapticFeedback.notification.warning(),
      error: () => settings.enabled && HapticFeedback.notification.error(),
    },
    celebration: () => settings.enabled && HapticFeedback.celebration(),
  };
};
```

#### Update TaskCard.tsx (Line 151)
```typescript
// In TaskCard.tsx
import { useHaptics } from '../../utils/haptics';

// Inside component
const haptics = useHaptics();

// Update handleComplete function
const handleComplete = () => {
  if (!isCompleted) {
    haptics.notification.success(); // Add haptic feedback
    setShowAnimation(true);
  }
  onComplete();
};
```

### 2. Touch Target Updates

#### Update theme.ts
```typescript
// Add to layout constants
export const layout = {
  // ... existing properties
  minimumTouchTarget: 44, // iOS HIG minimum
  touchTargetWithPadding: 48, // Comfortable touch target
};
```

#### Update Button.tsx
```typescript
// Ensure minimum heights meet touch targets
const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  // Update size variants
  large: {
    minHeight: 50, // Already good
    minWidth: theme.layout.minimumTouchTarget,
    paddingHorizontal: theme.spacing.L,
  },
  
  medium: {
    minHeight: 44, // Update from current
    minWidth: theme.layout.minimumTouchTarget,
    paddingHorizontal: theme.spacing.M,
  },
  
  small: {
    minHeight: 44, // Update from 36
    minWidth: theme.layout.minimumTouchTarget,
    paddingHorizontal: theme.spacing.S,
  },
});
```

#### Update TaskCard Checkbox
```typescript
// In TaskCard.tsx styles
checkbox: {
  width: 44, // Update from 24
  height: 44, // Update from 24
  borderRadius: 22, // Half of width/height
  // ... rest of styles
  // Remove margin adjustments in parent to accommodate larger size
},
```

### 3. Error Message Catalog

#### Create Error Service
```typescript
// src/services/errorMessages.ts
import { Feather } from '@expo/vector-icons';

export interface ErrorConfig {
  title: string;
  message: string;
  icon: keyof typeof Feather.glyphMap;
  actions: Array<{
    label: string;
    style: 'default' | 'cancel' | 'destructive';
    action?: () => void;
  }>;
}

export const ERROR_CATALOG = {
  // Network Errors
  NETWORK_OFFLINE: {
    title: "You're Offline",
    message: "Changes will sync when you're back online",
    icon: "wifi-off",
    actions: [{ label: "OK", style: "default" }]
  },
  
  NETWORK_TIMEOUT: {
    title: "Connection Timed Out",
    message: "The server is taking too long. Try again?",
    icon: "clock",
    actions: [
      { label: "Cancel", style: "cancel" },
      { label: "Retry", style: "default" }
    ]
  },
  
  // Task Errors
  TASK_CREATE_FAILED: {
    title: "Couldn't Create Task",
    message: "We saved your work. Tap retry when ready.",
    icon: "alert-circle",
    actions: [
      { label: "Cancel", style: "cancel" },
      { label: "Retry", style: "default" }
    ]
  },
  
  TASK_UPDATE_FAILED: {
    title: "Update Failed",
    message: "Your changes are saved locally and will sync soon.",
    icon: "save",
    actions: [{ label: "Got it", style: "default" }]
  },
  
  TASK_DELETE_FAILED: {
    title: "Couldn't Delete Task",
    message: "The task is still there. Try again?",
    icon: "trash-2",
    actions: [
      { label: "Keep Task", style: "cancel" },
      { label: "Try Again", style: "destructive" }
    ]
  },
  
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: {
    title: "Sign In Failed",
    message: "Check your email and password",
    icon: "lock",
    actions: [{ label: "Try Again", style: "default" }]
  },
  
  AUTH_EMAIL_IN_USE: {
    title: "Email Already Used",
    message: "This email is registered. Sign in instead?",
    icon: "mail",
    actions: [
      { label: "Cancel", style: "cancel" },
      { label: "Sign In", style: "default" }
    ]
  },
  
  // Family Errors
  FAMILY_INVITE_INVALID: {
    title: "Invalid Invite Code",
    message: "Double-check the code or ask for a new one",
    icon: "x-circle",
    actions: [{ label: "Try Again", style: "default" }]
  },
  
  FAMILY_JOIN_FAILED: {
    title: "Couldn't Join Family",
    message: "Something went wrong. Try the code again?",
    icon: "users",
    actions: [
      { label: "Cancel", style: "cancel" },
      { label: "Retry", style: "default" }
    ]
  },
  
  // Photo Errors
  PHOTO_UPLOAD_FAILED: {
    title: "Photo Upload Failed",
    message: "We'll try again when you have better connection",
    icon: "camera-off",
    actions: [{ label: "OK", style: "default" }]
  },
  
  PHOTO_TOO_LARGE: {
    title: "Photo Too Large",
    message: "Try a smaller photo (max 10MB)",
    icon: "image",
    actions: [{ label: "Choose Another", style: "default" }]
  },
  
  // Generic Errors
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "We're not sure what happened. Try again?",
    icon: "help-circle",
    actions: [
      { label: "Cancel", style: "cancel" },
      { label: "Retry", style: "default" }
    ]
  }
};

// Helper to show error
export const showError = (errorKey: keyof typeof ERROR_CATALOG, onRetry?: () => void) => {
  const error = ERROR_CATALOG[errorKey];
  
  Alert.alert(
    error.title,
    error.message,
    error.actions.map(action => ({
      ...action,
      onPress: action.action || (action.label === "Retry" ? onRetry : undefined)
    }))
  );
};
```

### 4. Loading Skeletons

#### Create Skeleton Components
```typescript
// src/components/common/Skeletons.tsx
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Shimmer animation hook
const useShimmer = () => {
  const animValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
};

// Base skeleton element
const SkeletonElement: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
  const { theme } = useTheme();
  const opacity = useShimmer();
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.separator,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Task Card Skeleton
export const TaskCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.taskCardContent}>
        <SkeletonElement width={24} height={24} borderRadius={12} />
        <View style={styles.taskCardText}>
          <SkeletonElement height={16} width="70%" />
          <SkeletonElement height={12} width="40%" style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

// Task List Skeleton
export const TaskListSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <TaskCardSkeleton key={i} />
      ))}
    </View>
  );
};

// Dashboard Stats Skeleton
export const StatsCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
      <SkeletonElement width={40} height={40} borderRadius={20} />
      <View style={styles.statsContent}>
        <SkeletonElement height={24} width={60} />
        <SkeletonElement height={14} width={80} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SkeletonElement height={28} width={200} />
          <SkeletonElement height={16} width={120} style={{ marginTop: 8 }} />
        </View>
        <SkeletonElement width={24} height={24} borderRadius={12} />
      </View>
      
      {/* Progress Card */}
      <View style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
        <SkeletonElement height={20} width="100%" />
        <SkeletonElement height={12} width="100%" style={{ marginTop: 12 }} />
      </View>
      
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </View>
      
      {/* Tasks */}
      <View style={styles.section}>
        <SkeletonElement height={20} width={120} style={{ marginBottom: 16 }} />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCardText: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsContent: {
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
});
```

## Day 3-4: Accessibility Foundation

### Color Contrast Updates

See the theme.ts updates in the main action items document.

### Accessibility Context

```typescript
// src/contexts/AccessibilityContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(true);

  useEffect(() => {
    // Check screen reader
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    
    // Listen for changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    // Load haptic preference
    AsyncStorage.getItem('@haptic_feedback').then(value => {
      if (value !== null) {
        setHapticFeedbackEnabled(value === 'true');
      }
    });
    
    return () => {
      screenReaderListener.remove();
    };
  }, []);
  
  const updateHapticPreference = async (enabled: boolean) => {
    setHapticFeedbackEnabled(enabled);
    await AsyncStorage.setItem('@haptic_feedback', enabled.toString());
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isHighContrastEnabled,
        hapticFeedbackEnabled,
        setHapticFeedbackEnabled: updateHapticPreference,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
```

## Implementation Checklist

### Immediate Actions (Day 1-2)
- [ ] Install expo-haptics: `expo install expo-haptics`
- [ ] Create haptics.ts utility file
- [ ] Update TaskCard with haptic feedback
- [ ] Update Button component touch targets
- [ ] Update all checkbox/radio button sizes
- [ ] Create errorMessages.ts service
- [ ] Replace all generic Alert.alert calls
- [ ] Create Skeletons.tsx component
- [ ] Implement loading skeletons in screens

### Accessibility Updates (Day 3-4)
- [ ] Update theme.ts with new colors
- [ ] Create AccessibilityContext
- [ ] Wrap App with AccessibilityProvider
- [ ] Add accessibility props to components
- [ ] Test with VoiceOver/TalkBack

### Testing (Day 5)
- [ ] Set up jest-axe
- [ ] Write accessibility tests
- [ ] Manual testing checklist
- [ ] Document findings

## Code Review Checklist

Before submitting PR:
- [ ] All touch targets ≥ 44x44px
- [ ] Haptic feedback on all interactions
- [ ] Loading states use skeletons
- [ ] Error messages are helpful
- [ ] Colors meet WCAG AA
- [ ] Screen reader tested
- [ ] No console warnings
- [ ] Tests passing