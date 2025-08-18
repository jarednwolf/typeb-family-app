/**
 * Extended theme constants with additional colors and typography
 */

import { colors as baseColors, typography as baseTypography, spacing as baseSpacing } from './theme';

// Extended color palette with gray scale
export const colors = {
  ...baseColors,
  // Gray scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  // Additional semantic colors
  text: baseColors.textPrimary,
  primaryLight: '#E5E5E5',
  successLight: '#D1FAE5',
  errorLight: '#FEE2E2',
  infoLight: '#DBEAFE',
};

// Extended typography with additional styles
export const typography = {
  ...baseTypography,
  h1: baseTypography.largeTitle,
  h2: baseTypography.title1,
  h3: baseTypography.title2,
  h4: baseTypography.title3,
  body: baseTypography.body,
  bodySemibold: {
    ...baseTypography.body,
    fontWeight: '600' as const,
  },
  captionSemibold: {
    ...baseTypography.caption1,
    fontWeight: '600' as const,
  },
  caption: baseTypography.caption1,
};

// Extended spacing with lowercase aliases
export const spacing = {
  ...baseSpacing,
  xs: baseSpacing.XS,
  sm: baseSpacing.S,
  md: baseSpacing.M,
  lg: baseSpacing.L,
  xl: baseSpacing.XL,
  xxl: baseSpacing.XXL,
};

export default {
  colors,
  typography,
  spacing,
};