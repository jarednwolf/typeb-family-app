import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { resendVerificationEmail, formatAuthError } from '../services/auth';

interface Props {
  onDismiss?: () => void;
}

const VerificationBanner: React.FC<Props> = ({ onDismiss }) => {
  const { theme, isDarkMode } = useTheme();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme, isDarkMode);

  const handleResend = async () => {
    setError(null);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (e: any) {
      setError(formatAuthError(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Please verify your email to unlock all features. Check your inbox for the verification link.
      </Text>
      {sent ? (
        <Text style={styles.success}>Verification email sent.</Text>
      ) : (
        <TouchableOpacity onPress={handleResend} style={styles.cta}>
          <Text style={styles.ctaText}>Resend Verification Email</Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: isDarkMode ? theme.colors.surface : '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    marginBottom: 8,
  },
  success: {
    color: theme.colors.success,
    fontSize: 14,
    marginBottom: 8,
  },
  cta: {
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ctaText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.error,
    marginTop: 4,
  },
  dismiss: {
    marginTop: 8,
  },
  dismissText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
});

export default VerificationBanner;
