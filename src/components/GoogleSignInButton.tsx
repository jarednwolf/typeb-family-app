import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signInWithGoogle, isGoogleSignInAvailable } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'signin' | 'signup';
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  variant = 'signin',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDarkMode } = useTheme();

  const handleGoogleSignIn = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      // Check if Google Sign-In is available
      const isAvailable = await isGoogleSignInAvailable();
      if (!isAvailable) {
        throw new Error('Google Sign-In is not available on this device');
      }

      // Perform Google Sign-In
      const result = await signInWithGoogle();
      
      if (result) {
        // Success
        console.log('[GoogleSignInButton] Sign-in successful');
        onSuccess?.();
      } else {
        // User cancelled
        console.log('[GoogleSignInButton] Sign-in cancelled');
      }
    } catch (error: any) {
      console.error('[GoogleSignInButton] Sign-in error:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      Alert.alert('Sign In Failed', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = variant === 'signup' ? 'Sign up with Google' : 'Sign in with Google';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDarkMode ? styles.buttonDark : styles.buttonLight,
        (isLoading || disabled) && styles.buttonDisabled,
      ]}
      onPress={handleGoogleSignIn}
      disabled={isLoading || disabled}
      testID="google-signin-button"
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#000'} />
        ) : (
          <>
            <View style={styles.googleLogo}>
              <Svg width="20" height="20" viewBox="0 0 46 46">
                <Path
                  fill="#4285F4"
                  d="M23.4 19.3v8.5h12.2c-.5 2.7-2 5-4.2 6.5l6.8 5.3c4-3.7 6.3-9.1 6.3-15.5 0-1.5-.1-2.9-.4-4.3H23.4v.5z"
                />
                <Path
                  fill="#34A853"
                  d="M10.3 27.2l-1.5 1.1-5.3 4.1c3.4 6.7 10.3 11.1 18 11.1 5.4 0 10-1.8 13.3-4.8l-6.8-5.3c-1.9 1.3-4.3 2-6.5 2-5 0-9.3-3.4-10.8-8l-.4-.2z"
                />
                <Path
                  fill="#FBBC04"
                  d="M5 13.4C3.7 16.1 3 19 3 22s.7 5.9 2 8.6l6.8-5.3c-.4-1.2-.6-2.4-.6-3.7s.2-2.5.6-3.7L5 13.4z"
                />
                <Path
                  fill="#EA4335"
                  d="M23.4 8.9c3 0 5.7 1 7.8 3l5.8-5.8C33 2.3 28.4 0 23.4 0 15.9 0 9 4.4 5.5 11.1l6.8 5.3c1.5-4.6 5.8-7.5 10.8-7.5h.3z"
                />
              </Svg>
            </View>
            <Text style={[
              styles.buttonText,
              isDarkMode ? styles.buttonTextDark : styles.buttonTextLight,
            ]}>
              {buttonText}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  buttonLight: {
    backgroundColor: '#fff',
    borderColor: '#dadce0',
  },
  buttonDark: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonTextLight: {
    color: '#3c4043',
  },
  buttonTextDark: {
    color: '#fff',
  },
});

export default GoogleSignInButton;
