import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store/store';
import { setIsDarkMode, loadThemeFromStorage } from '../store/slices/themeSlice';
import { theme as lightTheme } from '../constants/theme';
import { darkTheme } from '../constants/darkTheme';

// Create a union type for both themes
type AppTheme = typeof lightTheme | typeof darkTheme;

interface ThemeContextType {
  theme: AppTheme;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const systemColorScheme = useColorScheme();
  const { mode, isDarkMode } = useSelector((state: RootState) => state.theme);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode) {
          dispatch(loadThemeFromStorage(savedMode as 'light' | 'dark' | 'system'));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [dispatch]);

  // Update dark mode based on mode setting and system preference
  useEffect(() => {
    let isDark = false;
    
    if (mode === 'system') {
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = mode === 'dark';
    }
    
    dispatch(setIsDarkMode(isDark));
  }, [mode, systemColorScheme, dispatch]);

  // Select theme based on dark mode
  const currentTheme = useMemo((): AppTheme => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  const value = useMemo(() => ({
    theme: currentTheme,
    isDarkMode,
  }), [currentTheme, isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the theme type for use in components
export type { AppTheme };