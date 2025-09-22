import React from 'react';

export const useTheme = () => ({
  theme: {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      info: '#5AC8FA',
      surface: '#FFFFFF',
      background: '#F2F2F7',
      backgroundTexture: '#F7F7F7',
      textPrimary: '#000000',
      textSecondary: '#3C3C43',
      textTertiary: '#C7C7CC',
      separator: '#E5E5EA',
      white: '#FFFFFF',
      black: '#000000',
      premium: '#FFD700',
    },
    spacing: {
      XXS: 2,
      XS: 4,
      S: 8,
      M: 16,
      L: 24,
      XL: 32,
      XXL: 48,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      xlarge: 16,
      round: 999,
    },
    elevation: {
      4: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    },
    typography: {
      body: { fontSize: 16, lineHeight: 22 },
      caption1: { fontSize: 12, lineHeight: 16 },
      headline: { fontSize: 20, lineHeight: 24, fontWeight: '600' },
    },
    layout: {
      buttonHeight: { small: 32, medium: 44, large: 56 },
    },
  },
  isDarkMode: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
