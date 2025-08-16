# TypeB Family App Design System
## Visual Hierarchy & Microinteractions Guide

### Table of Contents
1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Animation System](#animation-system)
4. [Elevation & Shadows](#elevation--shadows)
5. [Spacing System](#spacing-system)
6. [Component Animations](#component-animations)
7. [Accessibility](#accessibility)
8. [Performance Guidelines](#performance-guidelines)
9. [Implementation Examples](#implementation-examples)

---

## Overview

The TypeB Family App design system provides a cohesive, premium visual experience with carefully crafted microinteractions that enhance usability while maintaining accessibility and performance standards.

### Design Philosophy
- **Minimal & Premium**: Clean interfaces with purposeful animations
- **Accessibility First**: All animations respect user preferences
- **Performance Optimized**: 60fps animations using native drivers
- **Consistent & Predictable**: Unified timing and easing functions

---

## Core Principles

### 1. Motion with Purpose
Every animation serves a functional purpose:
- **Feedback**: Confirm user actions
- **Focus**: Direct attention to important elements
- **Continuity**: Smooth transitions between states
- **Celebration**: Reward achievements and completions

### 2. Responsive to Context
Animations adapt based on:
- User accessibility settings (`reduceMotion`)
- Device capabilities
- Task urgency and priority
- User achievement levels

### 3. Progressive Enhancement
Base functionality works without animations, enhanced experiences layer on top.

---

## Animation System

### Duration Constants
```typescript
animations: {
  veryFast: 150ms,  // Quick feedback
  fast: 200ms,      // Button presses, selections
  normal: 300ms,    // Standard transitions
  slow: 500ms,      // Complex animations
  verySlow: 800ms   // Celebrations, achievements
}
```

### Easing Curves
```typescript
easing: {
  standard: cubic-bezier(0.4, 0.0, 0.2, 1),    // Most animations
  decelerate: cubic-bezier(0.0, 0.0, 0.2, 1),  // Enter animations
  accelerate: cubic-bezier(0.4, 0.0, 1, 1),    // Exit animations
  sharp: cubic-bezier(0.4, 0.0, 0.6, 1)        // Quick movements
}
```

### Spring Configurations
```typescript
spring: {
  tension: 40,
  friction: 7,
  // Custom configurations for different use cases
  bouncy: { damping: 8, stiffness: 200 },
  smooth: { damping: 15, stiffness: 150 },
  snappy: { damping: 20, stiffness: 300 }
}
```

---

## Elevation & Shadows

### 5-Level Elevation System
```typescript
elevation: {
  0: No shadow (flat elements)
  2: Subtle lift (cards at rest)
  4: Standard elevation (active cards)
  8: High elevation (modals, overlays)
  16: Maximum elevation (toasts, tooltips)
}
```

### Usage Guidelines
- **Cards**: Level 2 at rest, level 4 when pressed
- **Buttons**: Level 2 for primary, level 0 for secondary
- **Modals**: Level 8 with backdrop
- **FAB**: Level 4, animates to level 8 on press
- **Navigation**: Level 4 for tab bar

---

## Spacing System

### Semantic Spacing Scale
```typescript
spacing: {
  XXS: 4px   // Inline elements
  XS: 8px    // Compact spacing
  S: 12px    // Tight groups
  M: 16px    // Standard spacing
  L: 24px    // Section spacing
  XL: 32px   // Large gaps
  XXL: 48px  // Major sections
}
```

### Component-Specific Patterns
- **Card Padding**: spacing.M (16px)
- **Screen Padding**: spacing.M (16px)
- **List Item Spacing**: spacing.S (12px)
- **Section Margins**: spacing.L (24px)
- **Button Padding**: Horizontal spacing.M, Vertical spacing.S

---

## Component Animations

### 1. Navigation Transitions
**File**: `src/navigation/navigationAnimations.ts`
- **Slide**: Default iOS-style slide transition
- **Fade**: Subtle opacity transitions
- **Modal**: Bottom sheet with spring animation
- **Flip**: 3D card flip for special screens

### 2. Task Cards
**File**: `src/components/cards/TaskCard.tsx`
- **Press Animation**: Scale to 0.97 with haptic feedback
- **Priority Indicators**: Pulse animation for urgent tasks
- **Completion**: Fade out with scale
- **Swipe Actions**: Visual feedback for swipe-to-complete/delete

### 3. SwipeableTaskCard
**File**: `src/components/cards/SwipeableTaskCard.tsx`
- **Right Swipe**: Green background, checkmark icon, complete action
- **Left Swipe**: Red background, trash icon, delete action
- **Spring Physics**: Natural gesture response
- **Snap Points**: Automatic snap to action thresholds

### 4. Achievement Unlocks
**File**: `src/components/animations/AchievementUnlockAnimation.tsx`
- **Entrance**: Bounce with scale overshoot
- **Badge Animation**: Rotation wobble + pulse
- **Particles**: Confetti explosion effect
- **Levels**: Bronze, Silver, Gold, Platinum variants

### 5. Dashboard Parallax
**File**: `src/screens/dashboard/DashboardScreen.tsx`
- **Header Shrink**: Reduces on scroll
- **Card Parallax**: Different scroll speeds for depth
- **Staggered Entry**: Cards animate in sequence
- **FAB Animation**: Scale based on scroll position

### 6. Animated Tab Bar
**File**: `src/navigation/AnimatedTabBar.tsx`
- **Active Tab**: Scale 1.1 with bounce
- **Tab Switch**: Icon bounce + color transition
- **Badge Animation**: Pulse for notifications
- **Haptic Feedback**: On tab selection

### 7. Empty States
**File**: `src/components/common/AnimatedEmptyState.tsx`
- **Float Animation**: Gentle up/down movement
- **Bounce**: Playful bounce effect
- **Pulse**: Attention-grabbing pulse
- **Swing**: Pendulum swing motion
- **Particles**: Floating background elements

### 8. Loading States
**File**: `src/components/common/SmoothLoadingState.tsx`
- **Shimmer**: iOS-style content placeholder
- **Skeleton**: Structure-based loading
- **Dots**: Three-dot loading indicator
- **Progress**: Determinate progress bar

### 9. Progress Bars
**File**: `src/components/common/AnimatedProgressBar.tsx`
- **Default**: Smooth fill animation
- **Gradient**: Animated gradient movement
- **Striped**: Diagonal stripe animation
- **Pulse**: Pulsing glow effect
- **Segmented**: Step-based progress

### 10. Button Animations
**File**: `src/components/common/Button.tsx`
- **Press Scale**: 0.96 scale on press
- **Ripple Effect**: Material Design ripple
- **Loading State**: Spinner with fade transition
- **Disabled State**: Reduced opacity with no animations

### 11. Task Completion Celebration
**File**: `src/components/animations/TaskCompletionCelebration.tsx`
- **Minimal**: Simple checkmark with fade
- **Standard**: Checkmark + confetti
- **Grand**: Full celebration with starburst

---

## Accessibility

### Core Accessibility Features
1. **Reduce Motion Support**
   - All animations check `AccessibilityInfo.isReduceMotionEnabled`
   - Fallback to instant transitions when enabled
   - Maintained functionality without animations

2. **Screen Reader Announcements**
   - Achievement unlocks announced
   - Task state changes verbalized
   - Loading states communicated

3. **Touch Targets**
   - Minimum 44x44pt touch targets
   - Adequate spacing between interactive elements
   - Visual feedback for all interactions

4. **Color Contrast**
   - WCAG AA compliant color ratios
   - High contrast mode support
   - Clear visual hierarchy

### Implementation Pattern
```typescript
const { settings } = useAccessibility();
const animationConfig = settings.reduceMotion 
  ? { duration: 0 } 
  : { duration: 300, easing: Easing.out(Easing.quad) };
```

---

## Performance Guidelines

### Animation Best Practices
1. **Use Native Driver**
   ```typescript
   Animated.timing(animatedValue, {
     toValue: 1,
     duration: 300,
     useNativeDriver: true // Always true for transforms/opacity
   })
   ```

2. **Avoid Layout Animations**
   - Prefer `transform` and `opacity`
   - Avoid animating `width`, `height`, `padding`, `margin`

3. **Cleanup Animations**
   ```typescript
   useEffect(() => {
     const animation = Animated.timing(...)
     animation.start()
     return () => animation.stop()
   }, [])
   ```

4. **Use InteractionManager**
   ```typescript
   InteractionManager.runAfterInteractions(() => {
     // Heavy operations after animations
   })
   ```

### Memory Management
- Clean up animation listeners
- Cancel ongoing animations on unmount
- Use `useMemo` for complex animation configs
- Limit concurrent animations

### Performance Metrics
- **Target FPS**: 60fps on mid-range devices
- **Animation Budget**: <16ms per frame
- **Memory Usage**: <50MB for animation assets
- **Battery Impact**: Minimal with native driver

---

## Implementation Examples

### Using Animation Hooks
```typescript
import { usePressAnimation, useFadeAnimation } from '@/utils/animations';

const MyComponent = () => {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation(0.95);
  const { animatedStyle: fadeStyle, fadeIn } = useFadeAnimation();
  
  useEffect(() => {
    fadeIn();
  }, []);
  
  return (
    <Animated.View style={[styles.container, animatedStyle, fadeStyle]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Text>Animated Component</Text>
      </Pressable>
    </Animated.View>
  );
};
```

### Implementing Swipe Gestures
```typescript
import { SwipeableTaskCard } from '@/components/cards/SwipeableTaskCard';

<SwipeableTaskCard
  task={task}
  onComplete={() => handleComplete(task.id)}
  onDelete={() => handleDelete(task.id)}
  renderRightActions={renderCompleteAction}
  renderLeftActions={renderDeleteAction}
/>
```

### Achievement System Integration
```typescript
import { useAchievementUnlock, ACHIEVEMENTS } from '@/hooks/useAchievementUnlock';
import { AchievementUnlockAnimation } from '@/components/animations/AchievementUnlockAnimation';

const TaskScreen = () => {
  const { currentAchievement, isVisible, unlockAchievement, hideAchievement } = useAchievementUnlock();
  
  const handleTaskComplete = () => {
    // Check for achievements
    if (completedTasks === 1) {
      unlockAchievement(ACHIEVEMENTS.FIRST_TASK);
    }
  };
  
  return (
    <>
      {/* Screen content */}
      <AchievementUnlockAnimation
        visible={isVisible}
        achievementName={currentAchievement?.name}
        achievementDescription={currentAchievement?.description}
        level={currentAchievement?.level}
        onComplete={hideAchievement}
      />
    </>
  );
};
```

### Responsive Loading States
```typescript
import { SmoothLoadingState } from '@/components/common/SmoothLoadingState';

<SmoothLoadingState
  variant="skeleton"
  itemCount={3}
  message="Loading tasks..."
/>
```

---

## Testing Animations

### Manual Testing Checklist
- [ ] Test with Reduce Motion enabled
- [ ] Verify 60fps on target devices
- [ ] Check memory usage during animations
- [ ] Test gesture responsiveness
- [ ] Verify haptic feedback on supported devices
- [ ] Test animation cleanup on navigation
- [ ] Verify accessibility announcements

### Automated Testing
```typescript
// Example animation test
describe('TaskCard Animations', () => {
  it('should scale on press', () => {
    const { getByTestId } = render(<TaskCard task={mockTask} />);
    const card = getByTestId('task-card');
    
    fireEvent.pressIn(card);
    expect(card.props.style.transform).toContainEqual({ scale: 0.97 });
    
    fireEvent.pressOut(card);
    expect(card.props.style.transform).toContainEqual({ scale: 1 });
  });
});
```

---

## Migration Guide

### Updating Existing Components
1. Import animation utilities
2. Add accessibility context
3. Implement animation hooks
4. Add haptic feedback
5. Test with reduce motion

### Before (Static Component)
```typescript
const Card = ({ children }) => (
  <View style={styles.card}>{children}</View>
);
```

### After (Animated Component)
```typescript
const Card = ({ children }) => {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation();
  const { settings } = useAccessibility();
  
  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable 
        onPressIn={handlePressIn} 
        onPressOut={handlePressOut}
        disabled={settings.reduceMotion}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
```

---

## Resources

### Internal Documentation
- [Animation Utilities](/src/utils/animations.ts)
- [Theme Constants](/src/constants/theme.ts)
- [Accessibility Context](/src/contexts/AccessibilityContext.tsx)
- [Haptic System](/src/utils/haptics.ts)

### External Resources
- [React Native Reanimated 2 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Motion](https://material.io/design/motion/)

---

*Last Updated: Week 2 Implementation*
*Version: 1.0.0*