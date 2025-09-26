import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/common/Card';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface FAQ {
  question: string;
  answer: string;
}

const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const faqs: FAQ[] = [
    {
      question: 'How do I create a family?',
      answer: 'Go to the Family tab and tap "Create Family". Enter a family name and you\'ll receive an invite code to share with your family members.',
    },
    {
      question: 'How do I join an existing family?',
      answer: 'Go to the Family tab and tap "Join Family". Enter the 6-character invite code provided by your family manager.',
    },
    {
      question: 'What is included in Premium?',
      answer: 'Premium includes unlimited family members (up to 10), photo validation for tasks, advanced analytics, smart notification escalation, custom categories, and priority support.',
    },
    {
      question: 'How do I assign tasks to family members?',
      answer: 'As a parent/manager, create a task and select the family member from the "Assign to" dropdown. They\'ll receive a notification about their new task.',
    },
    {
      question: 'Can children create their own tasks?',
      answer: 'By default, only parents can create and assign tasks. This can be changed in Family Settings (premium feature).',
    },
    {
      question: 'How do recurring tasks work?',
      answer: 'When creating a task, toggle "Recurring" and select the frequency (daily, weekly, monthly). The task will automatically regenerate after completion.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime through your device\'s app store settings. You\'ll continue to have access until the end of your billing period.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use industry-standard encryption for all data transmission and storage. We never sell your data to third parties.',
    },
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@typeb.app?subject=Help Request');
  };

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Feather name="help-circle" size={32} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
          </View>
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>Find answers to common questions below</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <Card key={index} style={styles.faqCard}>
              <TouchableOpacity
                onPress={() => toggleFAQ(index)}
                style={styles.faqHeader}
                activeOpacity={0.7}
              >
                <Text style={styles.question}>{faq.question}</Text>
                <Feather 
                  name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answer}>{faq.answer}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Still Need Help?</Text>
          <Card style={styles.contactCard}>
            <View style={styles.contactContent}>
              <View style={styles.contactIcon}>
                <Feather name="mail" size={24} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Contact Support</Text>
                <Text style={styles.contactDescription}>
                  Our support team typically responds within 24 hours
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleContactSupport} 
              style={styles.contactButton}
            >
              <Text style={styles.contactButtonText}>Send Email</Text>
              <Feather name="arrow-right" size={18} color={isDarkMode ? theme.colors.background : theme.colors.surface} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourceLinks}>
            <TouchableOpacity 
              style={styles.resourceLink}
              onPress={() => Linking.openURL('https://typeb.app/guide')}
            >
              <Feather name="book-open" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.resourceText}>User Guide</Text>
              <Feather name="external-link" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resourceLink}
              onPress={() => Linking.openURL('https://typeb.app/tips')}
            >
              <Feather name="zap" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.resourceText}>Tips & Tricks</Text>
              <Feather name="external-link" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
  headerContent: {
    alignItems: 'center',
    paddingVertical: spacing.XL,
    paddingHorizontal: spacing.L,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDarkMode ? theme.colors.info + '20' : theme.colors.textPrimary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.M,
  },
  title: {
    fontSize: typography.title2.fontSize,
    fontWeight: typography.title2.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.XS,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  sectionTitle: {
    fontSize: typography.headline.fontSize,
    fontWeight: typography.headline.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  faqCard: {
    marginBottom: spacing.S,
    padding: 0,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.M,
  },
  question: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: spacing.S,
  },
  answerContainer: {
    paddingHorizontal: spacing.M,
    paddingBottom: spacing.M,
    paddingTop: 0,
  },
  answer: {
    fontSize: typography.subheadline.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  contactSection: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  contactCard: {
    padding: spacing.M,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.M,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? theme.colors.info + '20' : theme.colors.textPrimary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.M,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textSecondary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.M,
    gap: spacing.S,
  },
  contactButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.background : theme.colors.surface,
  },
  resourcesSection: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.L,
  },
  resourceLinks: {
    gap: spacing.S,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    padding: spacing.M,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.S,
  },
  resourceText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: theme.colors.textPrimary,
    marginLeft: spacing.M,
  },
});

export default HelpScreen;