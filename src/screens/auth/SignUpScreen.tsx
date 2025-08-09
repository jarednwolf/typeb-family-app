import React, { useState, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { signUp, selectIsLoading, selectAuthError, clearError } from '../../store/slices/authSlice';
import { validatePassword } from '../../services/auth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme } from '../../contexts/ThemeContext';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);
  const { theme, isDarkMode } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    
    // Validate password in real-time
    const validation = validatePassword(text);
    setPasswordErrors(validation.errors);
  };

  const handleSignUp = async () => {
    // Validate all fields
    if (!firstName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Password Requirements', passwordValidation.errors.join('\n'));
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    dispatch(clearError());
    const result = await dispatch(signUp({ email, password, displayName: firstName }));
    
    if (signUp.rejected.match(result)) {
      Alert.alert('Sign Up Failed', result.payload as string);
    } else {
      Alert.alert(
        'Verification Email Sent',
        'Please check your email to verify your account.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="signup-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Image
              source={require('../../../assets/type_b_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the TypeB Family community</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                testID="display-name-input"
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor={theme.colors.textTertiary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="email-input"
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  testID="password-input"
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
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
              
              {password.length > 0 && (
                <View style={styles.passwordRequirements}>
                  <Text style={[
                    styles.requirement,
                    password.length >= 8 ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    • At least 8 characters
                  </Text>
                  <Text style={[
                    styles.requirement,
                    /[A-Z]/.test(password) ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    • One uppercase letter
                  </Text>
                  <Text style={[
                    styles.requirement,
                    /[a-z]/.test(password) ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    • One lowercase letter
                  </Text>
                  <Text style={[
                    styles.requirement,
                    /[0-9]/.test(password) ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    • One number
                  </Text>
                  <Text style={[
                    styles.requirement,
                    /[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.requirementMet : styles.requirementUnmet
                  ]}>
                    • One special character
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                testID="confirm-password-input"
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                editable={!isLoading}
                onFocus={() => {
                  // Scroll to make confirm password field visible
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 500, animated: true });
                  }, 100);
                }}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              testID="create-account-button"
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.background} />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity testID="signin-link" onPress={() => navigation.goBack()} disabled={isLoading}>
                <Text style={styles.signInLink}>Sign In</Text>
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
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 150 : 32, // Extra padding for iOS keyboard and confirm password field
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backText: {
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginLeft: 4,
  },
  header: {
    marginBottom: 32,
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
  passwordRequirements: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requirement: {
    fontSize: 12,
    marginBottom: 4,
  },
  requirementMet: {
    color: theme.colors.success,
  },
  requirementUnmet: {
    color: theme.colors.textTertiary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  signUpButton: {
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  signInLink: {
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignUpScreen;