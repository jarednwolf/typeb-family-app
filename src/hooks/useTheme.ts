import { useColorScheme } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    white: string;
    black: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: string;
    };
    h2: {
      fontSize: number;
      fontWeight: string;
    };
    h3: {
      fontSize: number;
      fontWeight: string;
    };
    body: {
      fontSize: number;
    };
    caption: {
      fontSize: number;
    };
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#5AC8FA',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textPrimary: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#C7C7CC',
    border: '#C6C6C8',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    success: '#32D74B',
    error: '#FF453A',
    warning: '#FF9F0A',
    info: '#64D2FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#48484A',
    border: '#38383A',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  return { theme, isDark: colorScheme === 'dark' };
};