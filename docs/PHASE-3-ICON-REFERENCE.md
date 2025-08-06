# Phase 3: Icon Reference Guide

## 🚫 NO EMOJIS - Only Platform Icons

We use **Feather Icons** as our primary icon library for its premium, minimal aesthetic with consistent 2px stroke weight. For iOS-specific needs or missing icons, we fall back to **Ionicons**.

## Icon Implementation

### React Native Code Example
```tsx
import { Feather } from '@expo/vector-icons';

// Primary usage with Feather
<Feather name="home" size={24} color="#0A0A0A" />

// Fallback to Ionicons when needed
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="notifications-outline" size={24} color="#0A0A0A" />

// NEVER use emojis
// ❌ <Text>🏠</Text>
```

## Core Icon Set

### Navigation Icons
| Purpose | Feather Name | Size | Notes |
|---------|--------------|------|-------|
| Dashboard | `home` | 24 | Main screen |
| Tasks | `check-circle` | 24 | Task list |
| Family | `users` | 24 | Family members |
| Settings | `settings` | 24 | App settings |

### Task Icons
| Purpose | Feather Name | Size | Notes |
|---------|--------------|------|-------|
| Checkbox (empty) | `circle` | 24 | Uncompleted task |
| Checkbox (filled) | `check-circle` | 24 | Completed task |
| Add Task | `plus-circle` | 28 | FAB button |
| Calendar | `calendar` | 16 | Due date |
| Assignee | `user` | 16 | Task assignment |
| Priority High | `alert-circle` | 16 | High priority |
| Photo Required | `camera` | 16 | Validation needed |
| Edit | `edit-2` | 20 | Edit action |
| Delete | `trash-2` | 20 | Delete action |

### Category Icons
| Category | Feather Name | Color | Fallback |
|----------|--------------|-------|----------|
| Chores | `home` | #10B981 | - |
| Homework | `book` | #3B82F6 | - |
| Exercise | `heart` | #F59E0B | - |
| Personal | `user` | #8B5CF6 | - |
| Other | `more-horizontal` | #6B7280 | - |
| Routine | `repeat` | #06B6D4 | - |

### Status Icons
| Status | Feather Name | Color | Usage |
|--------|--------------|-------|-------|
| Success | `check` | #34C759 | Completion feedback |
| Warning | `alert-triangle` | #FF9500 | Warnings |
| Error | `x-circle` | #FF3B30 | Error states |
| Info | `info` | #007AFF | Information |

### Premium Icons
| Purpose | Feather Name | Color | Notes |
|---------|--------------|-------|-------|
| Premium Feature | `star` | #FFD700 | Premium badge |
| Lock | `lock` | #6B6B6B | Locked features |
| Upgrade | `trending-up` | #0A0A0A | Upgrade prompt |

### Action Icons
| Action | Feather Name | Size | Usage |
|--------|--------------|------|-------|
| Close | `x` | 24 | Close modals |
| Back | `chevron-left` | 24 | Navigation back |
| Forward | `chevron-right` | 24 | Navigation forward |
| Menu | `menu` | 24 | Hamburger menu |
| Search | `search` | 20 | Search action |
| Filter | `filter` | 20 | Filter options |
| Sort | `bar-chart-2` | 20 | Sort options |
| More | `more-vertical` | 20 | More options |
| Share | `share-2` | 20 | Share action |

### UI State Icons
| State | Feather Name | Size | Usage |
|-------|--------------|------|-------|
| Loading | `loader` | 24 | Loading spinner |
| Empty | `inbox` | 64 | Empty states |
| Offline | `wifi-off` | 48 | No connection |
| Sync | `refresh-cw` | 20 | Syncing data |

## Usage Guidelines

### 1. Consistent Sizing
- Navigation bar: 24px
- Inline icons: 16px
- Action buttons: 20px
- FAB: 28px
- Empty states: 48-64px

### 2. Color Usage
- Active/Selected: `#0A0A0A` (black)
- Inactive: `#6B6B6B` (gray)
- Success: `#34C759` (green)
- Warning: `#FF9500` (amber)
- Error: `#FF3B30` (red)
- Info: `#007AFF` (blue)

### 3. Icon Weight
- Feather icons have consistent 2px stroke
- Maintain visual consistency when mixing libraries
- Use color/size for emphasis, not weight

### 4. Platform Considerations
```tsx
// Icon wrapper for consistency
const Icon = ({ name, size = 24, color = '#0A0A0A', library = 'feather' }) => {
  if (library === 'feather') {
    return <Feather name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
};

// Usage
<Icon name="home" size={24} color={colors.primary} />
```

## Component Examples

### Task Card with Icons
```tsx
<View style={styles.taskCard}>
  <Feather name="circle" size={24} color="#E8E5E0" />
  <View style={styles.content}>
    <Text style={styles.title}>Clean the kitchen</Text>
    <View style={styles.meta}>
      <Feather name="home" size={16} color="#10B981" />
      <Text style={styles.category}>Chores</Text>
      <Feather name="user" size={16} color="#6B6B6B" />
      <Text style={styles.assignee}>Sarah</Text>
    </View>
  </View>
</View>
```

### Navigation Tab Bar
```tsx
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      const icons = {
        Dashboard: 'home',
        Tasks: 'check-circle',
        Family: 'users',
        Settings: 'settings'
      };
      
      return (
        <Feather 
          name={icons[route.name]} 
          size={size} 
          color={focused ? '#0A0A0A' : '#6B6B6B'} 
        />
      );
    },
  })}
>
```

### Empty State
```tsx
<View style={styles.emptyState}>
  <Feather name="inbox" size={64} color="#9B9B9B" />
  <Text style={styles.emptyTitle}>No tasks yet</Text>
  <Text style={styles.emptySubtitle}>Create your first task to get started</Text>
  <TouchableOpacity style={styles.emptyButton}>
    <Feather name="plus-circle" size={20} color="#FFFFFF" />
    <Text style={styles.emptyButtonText}>Create Task</Text>
  </TouchableOpacity>
</View>
```

### Premium Feature Lock
```tsx
<View style={styles.premiumFeature}>
  <View style={styles.lockedContent}>
    <Feather name="lock" size={32} color="#6B6B6B" />
    <Text style={styles.lockedTitle}>Premium Feature</Text>
    <Text style={styles.lockedSubtitle}>Upgrade to unlock photo validation</Text>
  </View>
  <TouchableOpacity style={styles.upgradeButton}>
    <Feather name="star" size={16} color="#FFD700" />
    <Text style={styles.upgradeText}>Upgrade to Premium</Text>
  </TouchableOpacity>
</View>
```

## Icon Animation Examples

### Loading Spinner
```tsx
import { Animated, Easing } from 'react-native';

const LoadingIcon = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Feather name="loader" size={24} color="#0A0A0A" />
    </Animated.View>
  );
};
```

### Task Complete Animation
```tsx
const TaskCompleteIcon = ({ completed }) => {
  const scaleValue = useRef(new Animated.Value(completed ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: completed ? 1 : 0,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [completed]);
  
  return (
    <View>
      <Feather name="circle" size={24} color="#E8E5E0" />
      <Animated.View 
        style={[
          styles.checkmark,
          { transform: [{ scale: scaleValue }] }
        ]}
      >
        <Feather name="check-circle" size={24} color="#34C759" />
      </Animated.View>
    </View>
  );
};
```

## Accessibility

All icons must include:
- Proper accessibility labels
- Role descriptions for screen readers
- Sufficient contrast ratios (WCAG AA)
- Hidden decorative icons from screen readers

```tsx
<Feather 
  name="home" 
  size={24} 
  color={colors.primary}
  accessibilityLabel="Dashboard"
  accessibilityRole="button"
  accessibilityHint="Navigate to dashboard"
/>

// Decorative icon
<Feather 
  name="chevron-right" 
  size={16} 
  color={colors.secondary}
  accessibilityElementsHidden={true}
  importantForAccessibility="no"
/>
```

## Migration from Other Libraries

When migrating from Ionicons or other libraries:

1. Replace icon imports: `@expo/vector-icons/Ionicons` → `@expo/vector-icons/Feather`
2. Update icon names using the mapping above
3. Adjust sizes if needed (Feather icons may appear slightly smaller)
4. Test on both platforms for consistency

This ensures our app maintains a premium, minimal appearance with consistent iconography throughout.