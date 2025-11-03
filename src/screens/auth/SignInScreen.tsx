import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { signIn, selectIsLoading, selectAuthError, clearError, selectIsEmailVerified, selectUser } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { configureGoogleSignIn, validateEmail, validatePassword } from '../../services/auth';
import VerificationBanner from '../../components/VerificationBanner';
import analytics from '../../services/analytics';

type SignInScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);
  const isEmailVerified = useAppSelector(selectIsEmailVerified);
  const currentUser = useAppSelector(selectUser);
  const { theme, isDarkMode } = useTheme();
  const emailInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(true);

  // inline validation
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isFormValid = emailValidation.isValid && passwordValidation.isValid;

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  useEffect(() => {
    // Configure Google Sign-In when component mounts (disabled on iOS for v1)
    const features = (Constants as any)?.expoConfig?.extra?.features || {};
    const enableGoogleSso = features.googleSSO === true && Platform.OS !== 'ios';
    if (enableGoogleSso) {
      configureGoogleSignIn();
    }
  }, []);

  const handleSignIn = async () => {
    if (!isFormValid) {
      if (!emailValidation.isValid) {
        emailInputRef.current?.focus();
      } else if (!passwordValidation.isValid) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    dispatch(clearError());
    const result = await dispatch(signIn({ email, password }));
    
    if (signIn.rejected.match(result)) {
      // Focus password on failure to encourage retry
      passwordInputRef.current?.focus();
    } else {
      analytics.track('auth_sign_in', { method: 'password' });
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container} testID="signin-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../../assets/type_b_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>More than checking the box</Text>
          </View>

          {/* Inline error banner */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email verification banner (only if signed in and unverified) */}
          {currentUser && !isEmailVerified && showVerification && (
            <VerificationBanner onDismiss={() => setShowVerification(false)} />
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailInputRef}
                testID="email-input"
                style={[styles.input, !emailValidation.isValid && email.length > 0 ? { borderColor: theme.colors.error } : null]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={(v) => { if (error) dispatch(clearError()); setEmail(v); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                editable={!isLoading}
              />
              {!emailValidation.isValid && email.length > 0 && (
                <Text style={{ color: theme.colors.error, marginTop: 6 }}>{emailValidation.error}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  testID="password-input"
                  style={[styles.input, styles.passwordInput, !passwordValidation.isValid && password.length > 0 ? { borderColor: theme.colors.error } : null]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={password}
                  onChangeText={(v) => { if (error) dispatch(clearError()); setPassword(v); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {!passwordValidation.isValid && password.length > 0 && (
                <Text style={{ color: theme.colors.error, marginTop: 6 }}>
                  {(passwordValidation.errors && passwordValidation.errors[0]) || 'Invalid password'}
                </Text>
              )}
              {password.length === 0 && (
                <Text style={styles.helperText}>8+ characters, include a number and letter</Text>
              )}
            </View>

            <TouchableOpacity
              testID="forgot-password-button"
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="signin-button"
              style={[styles.signInButton, (isLoading || !isFormValid) && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.background} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

          {((Constants as any)?.expoConfig?.extra?.features?.googleSSO === true && Platform.OS !== 'ios') && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <GoogleSignInButton
                variant="signin"
                onSuccess={() => {
                  // Navigation will be handled by auth state change
                  console.log('Google Sign-In successful');
                }}
                disabled={isLoading}
              />
            </>
          )}

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity testID="signup-link" onPress={handleSignUp} disabled={isLoading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 48,
    marginTop: 32,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  errorBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: isDarkMode ? '#3b0d0d' : '#FEE2E2',
    borderWidth: 1,
    borderColor: isDarkMode ? '#7f1d1d' : '#FCA5A5',
    borderRadius: 8,
  },
  errorBannerText: {
    color: isDarkMode ? '#FCA5A5' : '#7F1D1D',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: isDarkMode ? theme.colors.surface : '#F9FAFB',
  },
  helperText: {
    color: theme.colors.textTertiary,
    marginTop: 6,
    fontSize: 12,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  showPasswordText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  signUpLink: {
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SignInScreen;