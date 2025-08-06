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

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, layout, animations } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
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
  ...props
}) => {
  const isDisabled = disabled || loading;
  
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
    if (variant === 'primary') return colors.white;
    if (variant === 'danger') return colors.white;
    if (variant === 'secondary' || variant === 'text') return colors.textPrimary;
    return colors.textPrimary;
  };
  
  const contentColor = getContentColor();
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 18 : 20;
  
  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.L,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  
  textVariant: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.S,
  },
  
  danger: {
    backgroundColor: colors.error,
  },
  
  // Sizes
  large: {
    height: layout.buttonHeight.large,
    paddingHorizontal: spacing.L,
  },
  
  medium: {
    height: layout.buttonHeight.medium,
    paddingHorizontal: spacing.M,
  },
  
  small: {
    height: layout.buttonHeight.small,
    paddingHorizontal: spacing.S,
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
    ...typography.body,
    fontWeight: '600',
  } as TextStyle,
  
  primaryText: {
    color: colors.white,
  },
  
  secondaryText: {
    color: colors.textPrimary,
  },
  
  textText: {
    color: colors.textPrimary,
  },
  
  dangerText: {
    color: colors.white,
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
    marginRight: spacing.XS,
  },
  
  iconRight: {
    marginLeft: spacing.XS,
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