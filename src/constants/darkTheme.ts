/**
 * Dark theme constants for TypeB Family App
 * Premium, minimal design system inspired by Apple's HIG
 */

import { TextStyle, ViewStyle } from 'react-native';

// Dark Mode Color Palette
export const darkColors = {
  // Primary colors
  primary: '#FFFFFF',      // White text on dark
  success: '#30D158',      // Softer green for dark mode (easier on eyes)
  warning: '#FF9F0A',      // Slightly adjusted amber for dark mode
  error: '#FF453A',        // Slightly adjusted red for dark mode
  info: '#0A84FF',         // Slightly brighter blue for dark mode
  
  // Backgrounds
  background: '#000000',   // Pure black
  surface: '#1C1C1E',      // Cards, modals
  backgroundTexture: '#2C2C2E', // Subtle depth
  inputBackground: '#2C2C2E',   // Input fields
  
  // Text colors
  textPrimary: '#FFFFFF',  // White
  textSecondary: '#EBEBF5', // 92% white
  textTertiary: '#C7C7CC',  // 78% white
  
  // UI elements
  separator: '#38383A',     // Dark gray
  white: '#FFFFFF',
  black: '#000000',
  
  // Category colors (slightly adjusted for dark mode)
  categories: {
    chores: '#10B981',      // Emerald
    homework: '#5B9EF6',    // Lighter Blue
    exercise: '#F59E0B',    // Amber
    personal: '#A78BFA',    // Lighter Purple
    routine: '#22D3EE',     // Lighter Cyan
    other: '#9CA3AF',       // Lighter Gray
  },
  
  // Premium
  premium: '#FFD700',       // Gold
} as const;

// Dark mode shadows
interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const darkShadows: Record<string, ShadowStyle> = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Import shared constants from light theme
import { 
  typography, 
  spacing, 
  borderRadius, 
  layout, 
  animations, 
  iconSizes,
  platformStyles as basePlatformStyles
} from './theme';
import { Platform } from 'react-native';

// Dark mode common styles
export const darkCommonStyles = {
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: darkColors.background,
  } as ViewStyle,
  
  contentContainer: {
    padding: spacing.M,
  } as ViewStyle,
  
  // Cards
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    ...darkShadows.small,
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
    backgroundColor: darkColors.inputBackground,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: darkColors.separator,
    paddingHorizontal: spacing.S,
  } as ViewStyle,
  
  // Lists
  listSeparator: {
    height: 1,
    backgroundColor: darkColors.separator,
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

// Dark mode platform-specific adjustments
export const darkPlatformStyles = {
  headerTitleStyle: Platform.select({
    ios: {
      ...typography.headline,
      color: darkColors.textPrimary,
    },
    android: {
      ...typography.title3,
      color: darkColors.textPrimary,
    },
  }),
  
  shadowStyle: Platform.select({
    ios: darkShadows.small,
    android: {
      ...darkShadows.small,
      // Android only uses elevation for shadows
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
  }),
};

// Export dark theme object for easy access
export const darkTheme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows: darkShadows,
  layout,
  animations,
  iconSizes,
  commonStyles: darkCommonStyles,
  platformStyles: darkPlatformStyles,
} as const;

export type Theme = typeof darkTheme;

export default darkTheme;