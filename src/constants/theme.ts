/**
 * Theme constants for TypeB Family App
 * Premium, minimal design system inspired by Apple's HIG
 */

import { TextStyle, ViewStyle } from 'react-native';

// Color Palette
export const colors = {
  // Primary colors
  primary: '#0A0A0A',      // Premium black from logo
  success: '#34C759',      // Apple green
  warning: '#FF9500',      // Apple amber
  error: '#FF3B30',        // Apple red
  info: '#007AFF',         // Apple blue
  
  // Backgrounds
  background: '#FAF8F5',   // Warm background from logo
  surface: '#FFFFFF',      // Cards, modals
  backgroundTexture: '#F5F2ED', // Subtle depth
  inputBackground: '#F2F2F7',   // Input fields
  
  // Text colors
  textPrimary: '#0A0A0A',  // Black
  textSecondary: '#6B6B6B', // 60% black
  textTertiary: '#9B9B9B',  // 40% black
  
  // UI elements
  separator: '#E8E5E0',     // Warm gray
  white: '#FFFFFF',
  black: '#000000',
  
  // Category colors
  categories: {
    chores: '#10B981',      // Emerald
    homework: '#3B82F6',    // Blue
    exercise: '#F59E0B',    // Amber
    personal: '#8B5CF6',    // Purple
    routine: '#06B6D4',     // Cyan
    other: '#6B7280',       // Gray
  },
  
  // Premium
  premium: '#FFD700',       // Gold
} as const;

// Typography System
interface TypographyStyle extends TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
}

export const typography: Record<string, TypographyStyle> = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '400',
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
  },
};

// Spacing System
export const spacing = {
  XXS: 4,
  XS: 8,
  S: 12,
  M: 16,
  L: 24,
  XL: 32,
  XXL: 48,
} as const;

// Border Radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
} as const;

// Shadows
interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows: Record<string, ShadowStyle> = {
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

// Layout Constants
export const layout = {
  headerHeight: 44,
  tabBarHeight: 49,
  buttonHeight: {
    large: 50,
    medium: 44,
    small: 36,
  },
  inputHeight: 44,
  cardPadding: spacing.M,
  screenPadding: spacing.M,
  minimumTouchTarget: 44,
} as const;

// Animation Durations
export const animations = {
  fast: 200,
  normal: 300,
  slow: 400,
  spring: {
    tension: 40,
    friction: 7,
  },
} as const;

// Icon Sizes
export const iconSizes = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 28,
  xxlarge: 32,
  huge: 48,
  giant: 64,
} as const;

// Common Styles
export const commonStyles = {
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  contentContainer: {
    padding: spacing.M,
  } as ViewStyle,
  
  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    ...shadows.small,
  } as ViewStyle,
  
  // Buttons
  buttonBase: {
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  
  // Inputs
  inputContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: spacing.S,
  } as ViewStyle,
  
  // Lists
  listSeparator: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: spacing.M,
  } as ViewStyle,
  
  // Centered content
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
};

// Platform-specific adjustments
import { Platform } from 'react-native';

export const platformStyles = {
  headerTitleStyle: Platform.select({
    ios: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    android: {
      ...typography.title3,
      color: colors.textPrimary,
    },
  }),
  
  shadowStyle: Platform.select({
    ios: shadows.small,
    android: {
      ...shadows.small,
      // Android only uses elevation for shadows
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
  }),
};

// Dark mode colors (for future implementation)
export const darkColors = {
  primary: '#FFFFFF',
  background: '#000000',
  surface: '#1C1C1E',
  backgroundTexture: '#2C2C2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#C7C7CC',
  separator: '#38383A',
};

// Export theme object for easy access
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animations,
  iconSizes,
  commonStyles,
  platformStyles,
} as const;

export default theme;