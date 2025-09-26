/**
 * Spacing Utility System
 * Ensures consistent spacing throughout the app
 * Based on 4px base unit
 */

import { spacing as themeSpacing } from '../constants/theme';

// Base unit for spacing (4px)
const BASE_UNIT = 4;

/**
 * Spacing scale based on t-shirt sizes
 * Provides semantic naming for better developer experience
 */
export const spacing = {
  // Core spacing values from theme
  ...themeSpacing,
  
  // Semantic spacing aliases
  none: 0,
  tiny: themeSpacing.XXS,    // 4px
  small: themeSpacing.XS,     // 8px
  compact: themeSpacing.S,    // 12px
  medium: themeSpacing.M,     // 16px
  large: themeSpacing.L,      // 24px
  huge: themeSpacing.XL,      // 32px
  massive: themeSpacing.XXL,  // 48px
  
  // Component-specific spacing
  cardPadding: themeSpacing.M,
  screenPadding: themeSpacing.M,
  sectionGap: themeSpacing.L,
  listItemGap: themeSpacing.S,
  buttonPadding: themeSpacing.M,
  inputPadding: themeSpacing.S,
  
  // Layout spacing
  headerHeight: 44,
  tabBarHeight: 49,
  safeAreaBottom: 34, // iPhone X and newer
  
  // Inline spacing
  inlineXS: themeSpacing.XXS,
  inlineSM: themeSpacing.XS,
  inlineMD: themeSpacing.S,
  inlineLG: themeSpacing.M,
} as const;

/**
 * Dynamic spacing calculator
 * Allows for custom spacing based on the base unit
 */
export const getSpacing = (multiplier: number): number => {
  return BASE_UNIT * multiplier;
};

/**
 * Responsive spacing based on screen size
 */
export const responsiveSpacing = {
  small: (value: keyof typeof spacing) => spacing[value] * 0.75,
  medium: (value: keyof typeof spacing) => spacing[value],
  large: (value: keyof typeof spacing) => spacing[value] * 1.25,
};

/**
 * Padding/Margin helpers for consistent application
 */
export const createPadding = {
  all: (value: number) => ({
    padding: value,
  }),
  vertical: (value: number) => ({
    paddingVertical: value,
  }),
  horizontal: (value: number) => ({
    paddingHorizontal: value,
  }),
  top: (value: number) => ({
    paddingTop: value,
  }),
  bottom: (value: number) => ({
    paddingBottom: value,
  }),
  left: (value: number) => ({
    paddingLeft: value,
  }),
  right: (value: number) => ({
    paddingRight: value,
  }),
};

export const createMargin = {
  all: (value: number) => ({
    margin: value,
  }),
  vertical: (value: number) => ({
    marginVertical: value,
  }),
  horizontal: (value: number) => ({
    marginHorizontal: value,
  }),
  top: (value: number) => ({
    marginTop: value,
  }),
  bottom: (value: number) => ({
    marginBottom: value,
  }),
  left: (value: number) => ({
    marginLeft: value,
  }),
  right: (value: number) => ({
    marginRight: value,
  }),
};

/**
 * Gap utilities for flexbox layouts
 */
export const createGap = (value: number) => ({
  gap: value,
});

export const createRowGap = (value: number) => ({
  rowGap: value,
});

export const createColumnGap = (value: number) => ({
  columnGap: value,
});

/**
 * Common spacing patterns
 */
export const spacingPatterns = {
  // Card styles with consistent padding
  card: {
    ...createPadding.all(spacing.cardPadding),
    ...createMargin.horizontal(spacing.medium),
    ...createMargin.vertical(spacing.small),
  },
  
  // Screen container
  screen: {
    flex: 1,
    ...createPadding.horizontal(spacing.screenPadding),
  },
  
  // List item spacing
  listItem: {
    ...createPadding.vertical(spacing.compact),
    ...createPadding.horizontal(spacing.medium),
  },
  
  // Section spacing
  section: {
    ...createMargin.bottom(spacing.sectionGap),
  },
  
  // Form field spacing
  formField: {
    ...createMargin.bottom(spacing.medium),
  },
  
  // Button group spacing
  buttonGroup: {
    ...createGap(spacing.compact),
  },
  
  // Inline elements
  inline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    ...createGap(spacing.inlineSM),
  },
};

/**
 * Hook for responsive spacing
 */
import { Dimensions } from 'react-native';

export const useResponsiveSpacing = () => {
  const { width } = Dimensions.get('window');
  
  const getSize = () => {
    if (width < 375) return 'small';
    if (width > 428) return 'large';
    return 'medium';
  };
  
  const size = getSize();
  
  return {
    spacing: (value: keyof typeof spacing) => {
      switch (size) {
        case 'small':
          return responsiveSpacing.small(value);
        case 'large':
          return responsiveSpacing.large(value);
        default:
          return spacing[value];
      }
    },
    size,
  };
};

export default spacing;