/**
 * Button Component - Premium, minimal design
 * 
 * Variants:
 * - primary: Black background, white text (main CTAs)
 * - secondary: Light background with border (secondary actions)
 * - text: No background (tertiary actions)
 * - danger: Red variant for destructive actions
 * 
 * Sizes:
 * - large: 50px height (main CTAs)
 * - medium: 44px height (standard buttons)
 * - small: 36px height (compact areas)
 */

import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticFeedback } from '../../utils/haptics';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'large',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
  hapticFeedback = true,
  onPress,
  ...props
}) => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const isDisabled = disabled || loading;
  
  // Animation values
  const scale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  // Get button styles based on variant and size
  const buttonStyles = [
    styles.base,
    variant === 'text' ? styles.textVariant : styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];
  
  // Get text styles based on variant and size
  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    styles[`${size}Text` as keyof typeof styles] as TextStyle,
  ].filter(Boolean);
  
  // Determine colors for loading indicator and icon
  const getContentColor = () => {
    if (variant === 'primary') return isDarkMode ? theme.colors.black : theme.colors.white;
    if (variant === 'danger') return theme.colors.white;
    if (variant === 'secondary' || variant === 'text') return theme.colors.textPrimary;
    return theme.colors.textPrimary;
  };
  
  const contentColor = getContentColor();
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 18 : 20;
  
  // Handle press animations
  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.96, {
        damping: 15,
        stiffness: 400,
      });
      
      // Trigger ripple effect for primary buttons
      if (variant === 'primary') {
        rippleOpacity.value = withTiming(0.3, { duration: 200 });
        rippleScale.value = withSpring(1, {
          damping: 10,
          stiffness: 200,
        });
      }
    }
    
    if (hapticFeedback && !isDisabled) {
      HapticFeedback.selection();
    }
  };
  
  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
      
      // Fade out ripple
      if (variant === 'primary') {
        rippleOpacity.value = withTiming(0, { duration: 300 });
        rippleScale.value = withTiming(0, { duration: 300 });
      }
    }
  };
  
  const handlePress = (event: any) => {
    if (!isDisabled) {
      onPress?.(event);
      
      // Reset ripple for next press
      if (!reduceMotion && variant === 'primary') {
        setTimeout(() => {
          rippleScale.value = 0;
        }, 400);
      }
    }
  };
  
  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const animatedRippleStyle = useAnimatedStyle(() => {
    return {
      opacity: rippleOpacity.value,
      transform: [
        { scale: rippleScale.value },
      ],
    };
  });
  
  return (
    <Animated.View style={animatedButtonStyle}>
      <Pressable
        style={buttonStyles}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...props}
      >
        {/* Ripple effect overlay */}
        {variant === 'primary' && !loading && !reduceMotion && (
          <Animated.View
            style={[
              styles.ripple,
              animatedRippleStyle,
              { backgroundColor: theme.colors.white },
            ]}
            pointerEvents="none"
          />
        )}
        
        {loading ? (
          <ActivityIndicator
            color={contentColor}
            size="small"
          />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>
                <Feather name={icon} size={iconSize} color={contentColor} />
              </View>
            )}
            <Text style={textStyles} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>
                <Feather name={icon} size={iconSize} color={contentColor} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.L,
    overflow: 'hidden', // For ripple effect
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '200%',
    height: '200%',
    marginLeft: '-100%',
    marginTop: '-100%',
    borderRadius: 999,
  },
  
  // Variants
  primary: {
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.primary,
  },
  
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  
  textVariant: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.S,
  },
  
  danger: {
    backgroundColor: theme.colors.error,
  },
  
  // Sizes
  large: {
    height: theme.layout.buttonHeight.large,
    paddingHorizontal: theme.spacing.L,
  },
  
  medium: {
    height: theme.layout.buttonHeight.medium,
    paddingHorizontal: theme.spacing.M,
  },
  
  small: {
    height: theme.layout.buttonHeight.small,
    paddingHorizontal: theme.spacing.S,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Base text style
  text: {
    ...theme.typography.body,
    fontWeight: '600',
  } as TextStyle,
  
  primaryText: {
    color: isDarkMode ? theme.colors.black : theme.colors.white,
  },
  
  secondaryText: {
    color: theme.colors.textPrimary,
  },
  
  textText: {
    color: theme.colors.textPrimary,
  },
  
  dangerText: {
    color: theme.colors.white,
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
  
  // Icon spacing
  iconLeft: {
    marginRight: theme.spacing.XS,
  },
  
  iconRight: {
    marginLeft: theme.spacing.XS,
  },
});

// Export additional button variants for specific use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const TextButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="text" {...props} />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);

export default Button;