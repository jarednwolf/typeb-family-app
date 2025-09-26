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

const PrivacyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handleOpenWeb = () => {
    Linking.openURL('https://typeb.app/privacy');
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 8, 2025</Text>
          
          <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
          <Text style={styles.paragraph}>
            At TypeB, we take your privacy seriously. This policy describes how we collect, 
            use, and protect your information when you use our family task management app.
          </Text>

          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            • Account Information: Email, name, and password (encrypted){'\n'}
            • Family Data: Family names, member relationships, and roles{'\n'}
            • Task Information: Task details, assignments, and completion status{'\n'}
            • Usage Analytics: App usage patterns to improve our service{'\n'}
            • Device Information: Device type and OS version for compatibility
          </Text>

          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information to:{'\n'}
            • Provide and maintain the TypeB service{'\n'}
            • Send task reminders and notifications{'\n'}
            • Improve our app based on usage patterns{'\n'}
            • Provide customer support{'\n'}
            • Ensure security and prevent fraud
          </Text>

          <Text style={styles.sectionTitle}>Data Protection</Text>
          <Text style={styles.paragraph}>
            • All data is encrypted in transit and at rest{'\n'}
            • We use industry-standard security measures{'\n'}
            • Access is restricted to authorized family members only{'\n'}
            • We never sell your data to third parties{'\n'}
            • You can delete your account and data at any time
          </Text>

          <Text style={styles.sectionTitle}>Family Privacy</Text>
          <Text style={styles.paragraph}>
            • Parents/Managers can see all family tasks{'\n'}
            • Children can only see their own tasks{'\n'}
            • Family data is isolated from other families{'\n'}
            • Invite codes expire after 7 days for security
          </Text>

          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We use the following services:{'\n'}
            • Firebase (Google) for data storage and authentication{'\n'}
            • RevenueCat for subscription management{'\n'}
            • Firebase Analytics for usage insights{'\n'}
            {'\n'}
            These services have their own privacy policies and data practices.
          </Text>

          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            TypeB is designed for families with children 13 and older. For younger children, 
            parental consent and supervision is required. We do not knowingly collect 
            information from children under 13 without parental consent.
          </Text>

          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:{'\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate data{'\n'}
            • Delete your account and data{'\n'}
            • Export your data{'\n'}
            • Opt-out of non-essential communications
          </Text>

          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this privacy policy or your data:{'\n'}
            {'\n'}
            Email: privacy@typeb.app{'\n'}
            Website: typeb.app/privacy
          </Text>

          <TouchableOpacity 
            style={styles.webButton}
            onPress={handleOpenWeb}
          >
            <Text style={styles.webButtonText}>View Full Policy Online</Text>
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

export default PrivacyScreen;