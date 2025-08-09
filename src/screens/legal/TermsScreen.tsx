import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handleOpenWeb = () => {
    Linking.openURL('https://typeb.app/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Effective Date: January 8, 2025</Text>
          
          <Text style={styles.sectionTitle}>Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By using TypeB ("the App"), you agree to these Terms of Service. 
            If you disagree with any part of these terms, please do not use our App.
          </Text>

          <Text style={styles.sectionTitle}>Description of Service</Text>
          <Text style={styles.paragraph}>
            TypeB is a family task management application that helps families organize, 
            assign, and track household tasks and responsibilities. The service includes 
            both free and premium subscription features.
          </Text>

          <Text style={styles.sectionTitle}>User Accounts</Text>
          <Text style={styles.paragraph}>
            • You must provide accurate and complete information{'\n'}
            • You are responsible for maintaining account security{'\n'}
            • You must be 13 years or older to create an account{'\n'}
            • Parents are responsible for their children's use of the App{'\n'}
            • One person may not create multiple accounts
          </Text>

          <Text style={styles.sectionTitle}>Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree NOT to:{'\n'}
            • Use the App for any illegal purposes{'\n'}
            • Harass, abuse, or harm other users{'\n'}
            • Upload inappropriate or offensive content{'\n'}
            • Attempt to hack or compromise the App{'\n'}
            • Share your account with unauthorized users{'\n'}
            • Use the App to spam or send unsolicited messages
          </Text>

          <Text style={styles.sectionTitle}>Premium Subscription</Text>
          <Text style={styles.paragraph}>
            • Premium features require a paid subscription{'\n'}
            • Subscriptions auto-renew unless cancelled{'\n'}
            • Prices may change with 30 days notice{'\n'}
            • Refunds are handled per App Store policies{'\n'}
            • Free trial converts to paid subscription if not cancelled
          </Text>

          <Text style={styles.sectionTitle}>Content and Ownership</Text>
          <Text style={styles.paragraph}>
            • You retain ownership of content you create{'\n'}
            • You grant us license to use content for service operation{'\n'}
            • We may remove content that violates these terms{'\n'}
            • The TypeB brand and app are our intellectual property
          </Text>

          <Text style={styles.sectionTitle}>Privacy and Data</Text>
          <Text style={styles.paragraph}>
            Your use of TypeB is also governed by our Privacy Policy. 
            We take data protection seriously and will never sell your personal information 
            to third parties.
          </Text>

          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TypeB is provided "as is" without warranties of any kind. We are not liable for 
            any indirect, incidental, or consequential damages arising from your use of the App. 
            Our total liability shall not exceed the amount you paid us in the past 12 months.
          </Text>

          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may update these terms from time to time. We will notify you of significant 
            changes via email or in-app notification. Continued use of the App after changes 
            constitutes acceptance of the new terms.
          </Text>

          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            • You may terminate your account at any time{'\n'}
            • We may suspend or terminate accounts that violate these terms{'\n'}
            • Upon termination, your data will be deleted per our Privacy Policy{'\n'}
            • Paid subscriptions remain active until the end of the billing period
          </Text>

          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms of Service:{'\n'}
            {'\n'}
            Email: legal@typeb.app{'\n'}
            Website: typeb.app/terms
          </Text>

          <TouchableOpacity 
            style={styles.webButton}
            onPress={handleOpenWeb}
          >
            <Text style={styles.webButtonText}>View Full Terms Online</Text>
            <Feather name="external-link" size={18} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  backButton: {
    padding: spacing.XS,
  },
  headerTitle: {
    fontSize: typography.title3.fontSize,
    fontWeight: typography.title3.fontWeight as any,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: spacing.XXL,
  },
  content: {
    padding: spacing.L,
  },
  lastUpdated: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textTertiary,
    marginBottom: spacing.L,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.headline.fontSize,
    fontWeight: typography.headline.fontWeight as any,
    color: theme.colors.textPrimary,
    marginTop: spacing.L,
    marginBottom: spacing.M,
  },
  paragraph: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.M,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
    borderWidth: 1,
    borderColor: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.M,
    marginTop: spacing.XL,
    gap: spacing.S,
  },
  webButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
  },
});

export default TermsScreen;