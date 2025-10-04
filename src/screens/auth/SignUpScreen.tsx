import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db as firestore } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { configureGoogleSignIn, validateEmail, validatePassword, formatAuthError } from '../../services/auth';
import analytics from '../../services/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const SignUpScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const firstNameRef = useRef<any>(null);
  const birthYearRef = useRef<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [isUnder13, setIsUnder13] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In when component mounts
    configureGoogleSignIn();
  }, []);

  const checkAge = (year: string) => {
    setBirthYear(year);
    if (year.length === 4) {
      const age = new Date().getFullYear() - parseInt(year);
      setIsUnder13(age < 13);
    }
  };

  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isFormValid = emailValidation.isValid && passwordValidation.isValid && !!firstName && !!birthYear && (!isUnder13 || parentConsent);

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      // COPPA Check
      const age = new Date().getFullYear() - parseInt(birthYear);
      
      if (age < 13 && !parentConsent) {
        Alert.alert(
          'Parental Consent Required',
          'Users under 13 need parental consent. Please have a parent check the consent box.'
        );
        return;
      }

      if (!isFormValid) {
        if (!firstName) {
          firstNameRef.current?.focus();
        } else if (!emailValidation.isValid) {
          emailRef.current?.focus();
        } else if (!passwordValidation.isValid) {
          passwordRef.current?.focus();
        } else if (!birthYear) {
          birthYearRef.current?.focus();
        }
        setIsLoading(false);
        return;
      }

      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // Store user data with COPPA compliance
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        firstName,
        email: email.trim().toLowerCase(),
        birthYear: parseInt(birthYear),
        age,
        createdAt: new Date(),
        parentEmail: isUnder13 ? parentEmail : null,
        parentConsentGiven: isUnder13 ? parentConsent : null,
        consentTimestamp: isUnder13 ? new Date() : null,
      });

      // If under 13, also store parental consent record
      if (isUnder13 && parentConsent) {
        await setDoc(
          doc(firestore, 'parentalConsents', userCredential.user.uid),
          {
            childId: userCredential.user.uid,
            childEmail: email.trim().toLowerCase(),
            parentEmail,
            consentGiven: true,
            timestamp: new Date(),
            ipAddress: 'user-ip', // In production, get actual IP
          }
        );
      }

      Alert.alert('Success', 'Account created successfully! Please verify your email.');
      analytics.track('auth_sign_up', { method: 'password' });
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Error', formatAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        ref={firstNameRef}
        style={[styles.input, !firstName ? { borderColor: '#f87171' } : null]}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        ref={emailRef}
        style={[styles.input, !emailValidation.isValid && email.length > 0 ? { borderColor: '#f87171' } : null]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!emailValidation.isValid && email.length > 0 && (
        <Text style={{ color: '#f87171', marginBottom: 10 }}>{emailValidation.error}</Text>
      )}

      <TextInput
        ref={passwordRef}
        style={[styles.input, !passwordValidation.isValid && password.length > 0 ? { borderColor: '#f87171' } : null]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!passwordValidation.isValid && password.length > 0 && (
        <Text style={{ color: '#f87171', marginBottom: 10 }}>
          {(passwordValidation.errors && passwordValidation.errors[0]) || 'Invalid password'}
        </Text>
      )}
      {password.length === 0 && (
        <Text style={styles.helperText}>8+ characters, include a number and letter</Text>
      )}

      <TextInput
        ref={birthYearRef}
        style={[styles.input, !birthYear ? { borderColor: '#f87171' } : null]}
        placeholder="Birth Year (YYYY)"
        value={birthYear}
        onChangeText={checkAge}
        keyboardType="numeric"
        maxLength={4}
      />

      {/* COPPA: Show parental consent for under 13 */}
      {isUnder13 && (
        <View style={styles.coppaSection}>
          <Text style={styles.coppaTitle}>⚠️ Parental Consent Required</Text>
          <Text style={styles.coppaText}>
            Users under 13 need parental permission to use TypeB.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Parent/Guardian Email"
            value={parentEmail}
            onChangeText={setParentEmail}
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={styles.consentBox}
            onPress={() => setParentConsent(!parentConsent)}
          >
            <View style={[styles.checkbox, parentConsent && styles.checked]} />
            <Text style={styles.consentText}>
              I am the parent/guardian and I consent to my child using TypeB.
              I understand data will be collected as described in the Privacy Policy.
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, (isLoading || !isFormValid) && styles.disabled]}
        onPress={handleSignUp}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleSignInButton
        variant="signup"
        onSuccess={() => {
          // Navigation will be handled by auth state change
          console.log('Google Sign-Up successful');
        }}
        disabled={isLoading || !birthYear || (isUnder13 && !parentConsent)}
      />

      <TouchableOpacity onPress={() => (navigation as any).navigate('SignIn' as never)} disabled={isLoading}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>

      <Text style={styles.privacy}>
        By signing up, you agree to our Terms of Service and Privacy Policy.
        {'\n'}Users under 13 require parental consent.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  helperText: {
    color: '#6b7280',
    marginTop: 6,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  },
  privacy: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  coppaSection: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  coppaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  coppaText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666',
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    borderRadius: 4,
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
});
