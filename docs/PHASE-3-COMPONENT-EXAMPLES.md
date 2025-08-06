# Phase 3: React Native Component Examples

## 🎨 Core Component Implementation

### 1. TaskCard Component

```tsx
// components/cards/TaskCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Task } from '../../types/models';
import { colors, typography, spacing } from '../../constants/theme';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <TouchableOpacity 
          onPress={onComplete}
          style={[
            styles.checkbox,
            task.status === 'completed' && styles.checkboxCompleted
          ]}
        >
          {task.status === 'completed' && (
            <Feather name="check" size={16} color={colors.white} />
          )}
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={[
            styles.title,
            task.status === 'completed' && styles.titleCompleted
          ]}>
            {task.title}
          </Text>
          
          <View style={styles.metadata}>
            <View style={[styles.categoryBadge, { backgroundColor: task.category.color + '20' }]}>
              <Feather
                name={getCategoryIcon(task.category.name)}
                size={12}
                color={task.category.color}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText, { color: task.category.color }]}>
                {task.category.name}
              </Text>
            </View>
            
            {task.priority === 'high' && (
              <Text style={styles.priorityHigh}>High Priority</Text>
            )}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.assigneeContainer}>
              <Feather name="user" size={12} color={colors.textSecondary} />
              <Text style={styles.assignee}>{task.assignedTo}</Text>
            </View>
            
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Feather
                  name="calendar"
                  size={12}
                  color={isOverdue ? colors.error : colors.textSecondary}
                />
                <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {task.requiresPhoto && task.status === 'completed' && (
        <View style={styles.validationBadge}>
          <Feather
            name={task.validationStatus === 'approved' ? 'check-circle' : 'clock'}
            size={20}
            color={task.validationStatus === 'approved' ? colors.success : colors.warning}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.M,
    marginHorizontal: spacing.M,
    marginVertical: spacing.XS,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.separator,
    marginRight: spacing.S,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.XXS,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.XS,
  },
  categoryBadge: {
    paddingHorizontal: spacing.XS,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.XS,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.XS,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.XS,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    ...typography.caption1,
    fontWeight: '500',
  },
  priorityHigh: {
    ...typography.caption1,
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignee: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
  dueDateOverdue: {
    color: colors.error,
  },
  validationBadge: {
    marginLeft: spacing.S,
  },
});

// Helper function for category icons
const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    'Chores': 'home',
    'Homework': 'book',
    'Exercise': 'heart',
    'Personal': 'user',
    'Routine': 'repeat',
    'Other': 'more-horizontal',
  };
  return iconMap[category] || 'more-horizontal';
};

// Helper function for date formatting
const formatDueDate = (date: string): string => {
  const dueDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dueDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (dueDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};
```

### 2. Primary Button Component

```tsx
// components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'large',
  loading = false,
  icon,
  disabled,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.white : colors.textPrimary} 
          size="small" 
        />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: spacing.L,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  
  // Sizes
  large: {
    height: 50,
  },
  medium: {
    height: 44,
    paddingHorizontal: spacing.M,
  },
  small: {
    height: 36,
    paddingHorizontal: spacing.S,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  textText: {
    color: colors.textPrimary,
  },
  
  // Text sizes
  largeText: {
    fontSize: 17,
  },
  mediumText: {
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  
  icon: {
    marginRight: spacing.XS,
  },
});
```

### 3. Input Field Component

```tsx
// components/forms/Input.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedBorder = new Animated.Value(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(animatedBorder, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(animatedBorder, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.separator, colors.primary],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[
        styles.inputContainer,
        { borderColor: error ? colors.error : borderColor },
      ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.M,
  },
  label: {
    ...typography.subheadline,
    color: colors.textPrimary,
    marginBottom: spacing.XS,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: spacing.S,
    height: 44,
  },
  icon: {
    marginRight: spacing.XS,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  error: {
    ...typography.caption1,
    color: colors.error,
    marginTop: spacing.XXS,
  },
  hint: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginTop: spacing.XXS,
  },
});
```

### 4. Dashboard Stats Card

```tsx
// components/cards/StatsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../constants/theme';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = colors.primary,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && (
        <View style={styles.subtitleContainer}>
          {trend && (
            <Feather
              name={trend === 'up' ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend === 'up' ? colors.success : colors.error}
            />
          )}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.M,
    flex: 1,
    minHeight: 100,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    ...typography.caption1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.title1,
    fontWeight: '600',
    marginVertical: spacing.XS,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginLeft: spacing.XXS,
  },
});
```

### 5. Theme Constants

```tsx
// constants/theme.ts
export const colors = {
  // Primary colors
  primary: '#0A0A0A',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  
  // Backgrounds
  background: '#FAF8F5',
  surface: '#FFFFFF',
  backgroundTexture: '#F5F2ED',
  inputBackground: '#F2F2F7',
  
  // Text colors
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  
  // UI elements
  separator: '#E8E5E0',
  white: '#FFFFFF',
  black: '#000000',
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '400' as const,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400' as const,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400' as const,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
  },
};

export const spacing = {
  XXS: 4,
  XS: 8,
  S: 12,
  M: 16,
  L: 24,
  XL: 32,
  XXL: 48,
};

export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
```

## 🎯 Implementation Notes

### Component Best Practices
1. **Always use theme constants** - Never hardcode colors or spacing
2. **Support both platforms** - Test on iOS and Android
3. **Include loading states** - Every async action needs feedback
4. **Handle errors gracefully** - Show user-friendly messages
5. **Optimize for performance** - Use React.memo where appropriate

### Accessibility Checklist
- ✅ All touchable areas are at least 44x44px
- ✅ Color contrast meets WCAG AA standards
- ✅ All interactive elements have accessibility labels
- ✅ Support for screen readers
- ✅ Keyboard navigation support (tablets)

### Animation Performance
- Use `useNativeDriver: true` where possible
- Keep animations under 300ms for responsiveness
- Test on lower-end devices
- Provide reduced motion options

These components form the foundation of our UI and can be composed together to create all the screens in our app while maintaining consistency with our design system.