import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handleLink = (url: string) => {
    Linking.openURL(url);
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/type_b_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>TypeB</Text>
          <Text style={styles.tagline}>More than checking the box</Text>
          <Text style={styles.version}>Version 1.0.1</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            TypeB is designed to help families stay organized and connected. 
            Built with love for Type B personalities who need a little extra help 
            staying on track, our app makes task management simple, fun, and effective 
            for the whole family.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>Family task management</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>Smart reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>Progress tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>Recurring tasks</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>Family collaboration</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.links}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleLink('https://typeb.app')}
            >
              <Feather name="globe" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.linkText}>Visit our website</Text>
              <Feather name="external-link" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleLink('https://twitter.com/typebapp')}
            >
              <Feather name="twitter" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.linkText}>Follow us on Twitter</Text>
              <Feather name="external-link" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleLink('mailto:hello@typeb.app')}
            >
              <Feather name="mail" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.linkText}>Contact us</Text>
              <Feather name="arrow-right" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.links}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate('Privacy' as never)}
            >
              <Feather name="shield" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Feather name="chevron-right" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate('Terms' as never)}
            >
              <Feather name="file-text" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.linkText}>Terms of Service</Text>
              <Feather name="chevron-right" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2025 TypeB. All rights reserved.</Text>
          <Text style={styles.madeWith}>Made with ❤️ for families everywhere</Text>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: spacing.XL,
    paddingHorizontal: spacing.L,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.M,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  appName: {
    fontSize: typography.title1.fontSize,
    fontWeight: typography.title1.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.XS,
  },
  tagline: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.S,
  },
  version: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textTertiary,
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
  description: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  featureList: {
    gap: spacing.S,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
    marginBottom: spacing.S,
  },
  featureText: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textPrimary,
  },
  links: {
    gap: spacing.S,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    padding: spacing.M,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.S,
  },
  linkText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: theme.colors.textPrimary,
    marginLeft: spacing.M,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.XL,
    paddingHorizontal: spacing.L,
  },
  copyright: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textTertiary,
    marginBottom: spacing.XS,
  },
  madeWith: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textTertiary,
  },
});

export default AboutScreen;