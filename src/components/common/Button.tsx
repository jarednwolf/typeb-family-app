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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme, isDarkMode } = useTheme();
  const isDisabled = disabled || loading;
  
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

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.L,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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