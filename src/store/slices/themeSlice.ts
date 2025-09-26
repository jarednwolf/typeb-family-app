import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDarkMode: boolean;
}

const initialState: ThemeState = {
  mode: 'system',
  isDarkMode: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      // Save to AsyncStorage
      AsyncStorage.setItem('themeMode', action.payload);
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    toggleTheme: (state) => {
      if (state.mode === 'system') {
        state.mode = state.isDarkMode ? 'light' : 'dark';
      } else {
        state.mode = state.mode === 'light' ? 'dark' : 'light';
      }
      state.isDarkMode = state.mode === 'dark';
      // Save to AsyncStorage
      AsyncStorage.setItem('themeMode', state.mode);
    },
    loadThemeFromStorage: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
  },
});

export const { setThemeMode, setIsDarkMode, toggleTheme, loadThemeFromStorage } = themeSlice.actions;
export default themeSlice.reducer;