/**
 * Theme Type Definitions
 * 
 * Proper TypeScript types for theme-related objects
 * Eliminates the need for `any` types in style functions
 */

import { TextStyle, ViewStyle } from 'react-native';

// Re-export the theme types from constants
export type AppTheme = any;

// Typography style type
export interface TypographyStyle extends TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
}

// Shadow style type
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Theme colors type
export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  backgroundTexture: string;
  inputBackground: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  white: string;
  black: string;
  categories: {
    chores: string;
    homework: string;
    exercise: string;
    personal: string;
    routine: string;
    other: string;
  };
  premium: string;
}

// Complete theme type
export interface Theme {
  colors: ThemeColors;
  typography: Record<string, TypographyStyle>;
  spacing: {
    XXS: number;
    XS: number;
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    round: number;
  };
  shadows: Record<string, ShadowStyle>;
  layout: {
    headerHeight: number;
    tabBarHeight: number;
    buttonHeight: {
      large: number;
      medium: number;
      small: number;
    };
    inputHeight: number;
    cardPadding: number;
    screenPadding: number;
    minimumTouchTarget: number;
  };
  animations: {
    fast: number;
    normal: number;
    slow: number;
    spring: {
      tension: number;
      friction: number;
    };
  };
  iconSizes: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
    huge: number;
    giant: number;
  };
  commonStyles: Record<string, ViewStyle>;
  platformStyles: Record<string, any>;
}

// Style creator function type
export type StyleCreator<T> = (theme: Theme, isDarkMode: boolean) => T;

// Common component props with theme
export interface ThemedComponentProps {
  theme?: Theme;
  isDarkMode?: boolean;
}