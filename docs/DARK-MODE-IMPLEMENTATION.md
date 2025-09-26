# Dark Mode Implementation Guide

## Overview
This document outlines the dark mode implementation for the TypeB Family App, detailing the infrastructure, patterns, and migration process for supporting both light and dark themes.

## Infrastructure

### 1. Theme Context (`src/contexts/ThemeContext.tsx`)
- Provides theme object and `isDarkMode` boolean to all components
- Automatically switches between light and dark themes based on Redux state
- Handles system theme preference detection

### 2. Redux Theme Slice (`src/store/slices/themeSlice.ts`)
- Manages theme mode: 'light' | 'dark' | 'system'
- Persists user preference to AsyncStorage
- Provides actions for theme toggling

### 3. Theme Definitions
- **Light Theme**: `src/constants/theme.ts`
- **Dark Theme**: `src/constants/darkTheme.ts`
- Both themes share the same structure for consistency

## Color Palette

### Light Mode
```typescript
{
  primary: '#0A0A0A',      // Premium black
  background: '#FAF8F5',   // Warm off-white
  surface: '#FFFFFF',      // Cards, modals
  textPrimary: '#0A0A0A',  // Black
  textSecondary: '#6B6B6B', // 60% black
  textTertiary: '#9B9B9B',  // 40% black
  separator: '#E8E5E0',     // Warm gray
}
```

### Dark Mode
```typescript
{
  primary: '#FFFFFF',      // White text on dark
  background: '#000000',   // Pure black
  surface: '#1C1C1E',      // Cards, modals
  textPrimary: '#FFFFFF',  // White
  textSecondary: '#EBEBF5', // 92% white
  textTertiary: '#C7C7CC',  // 78% white
  separator: '#38383A',     // Dark gray
}
```

## Implementation Status

### ✅ Completed
1. **Infrastructure**
   - ThemeContext setup
   - Redux theme slice
   - Theme persistence
   - System theme detection

2. **Navigation**
   - MainNavigator (tab bar and headers)
   - Stack navigators (all screens)
   - Tab bar icons and labels

3. **Screens**
   - Dashboard screen
   - Tasks screen

4. **Components**
   - Card component (already had support)
   - Button component
   - TaskCard component

### 🚧 In Progress
- Family screen
- Settings screen
- Auth screens (Login, Register)
- Modal components

### ⏳ Pending
- Other screens and components
- Testing across all screens
- Documentation updates

## Migration Pattern

### For Screens
Replace static theme imports with the `useTheme` hook:

```typescript
// Before
import { theme } from '../../constants/theme';

export const MyScreen: FC = () => {
  // Component logic
  return <View style={styles.container}>...</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
});

// After
import { useTheme } from '../../contexts/ThemeContext';

export const MyScreen: FC = () => {
  const { theme, isDarkMode } = useTheme();
  
  // Create dynamic styles
  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
    },
  }), [theme, isDarkMode]);
  
  return <View style={styles.container}>...</View>;
};
```

### For Components
Similar pattern, but create a style factory function:

```typescript
// Before
import { colors, typography } from '../../constants/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
  },
});

// After
import { useTheme } from '../../contexts/ThemeContext';

export const MyComponent: FC = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  // Component logic
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  button: {
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.primary,
  },
});
```

## Dark Mode Specific Adjustments

### 1. Primary Actions
- Light mode: Black (`#0A0A0A`)
- Dark mode: Blue (`#007AFF`) for better visibility

### 2. Shadows
- Light mode: 25% opacity
- Dark mode: 50% opacity for better depth perception

### 3. Category Colors
- Slightly adjusted for better contrast in dark mode
- Example: Blue `#3B82F6` → `#5B9EF6`

### 4. FAB (Floating Action Button)
- Light mode: Black background
- Dark mode: Blue background for visibility

## Testing Checklist

### Visual Testing
- [ ] Toggle between light and dark modes
- [ ] Check text readability in both modes
- [ ] Verify contrast ratios meet WCAG standards
- [ ] Test on different devices and screen sizes
- [ ] Verify animations and transitions

### Functional Testing
- [ ] Theme persistence across app restarts
- [ ] System theme preference detection
- [ ] Manual theme override
- [ ] Performance with theme switching

## Best Practices

1. **Always use theme colors** - Never hardcode colors
2. **Consider both modes** - Test UI changes in both themes
3. **Use semantic colors** - `textPrimary` instead of `black`
4. **Memoize styles** - Use `useMemo` for performance
5. **Handle edge cases** - Consider disabled states, overlays, etc.

## Common Issues and Solutions

### Issue: Hardcoded Colors
**Solution**: Search for hex codes and replace with theme colors

### Issue: Poor Contrast
**Solution**: Use `isDarkMode` to conditionally adjust colors

### Issue: Performance
**Solution**: Memoize style creation with `useMemo`

### Issue: Icons Not Visible
**Solution**: Use theme colors for icon tints

## Future Enhancements

1. **Auto Dark Mode Schedule** - Automatic switching based on time
2. **Theme Customization** - Allow users to customize colors
3. **High Contrast Mode** - Accessibility enhancement
4. **Reduced Motion** - Respect system accessibility settings

## Resources

- [Apple Human Interface Guidelines - Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Material Design - Dark Theme](https://material.io/design/color/dark-theme.html)
- [React Native Appearance API](https://reactnative.dev/docs/appearance)

## Conclusion

The dark mode implementation provides a premium experience that:
- Reduces eye strain in low-light conditions
- Saves battery on OLED screens
- Offers a modern, sophisticated appearance
- Respects user system preferences

The migration is straightforward following the patterns outlined above, and the infrastructure is designed to be maintainable and extensible.

---

**Last Updated**: January 9, 2025
**Status**: Partially Implemented
**Next Steps**: Complete remaining screens and components