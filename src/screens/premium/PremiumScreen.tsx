import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { PurchasesPackage } from 'react-native-purchases';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { RootState } from '../../store/store';
import { useTheme } from '../../contexts/ThemeContext';
import revenueCat from '../../services/revenueCat';

interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
}

const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const isPremium = useSelector((state: RootState) => state.premium.isPremium);
  const expirationDate = useSelector((state: RootState) => state.premium.expirationDate);
  const { theme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    try {
      const currentOffering = await revenueCat.fetchOfferings();
      if (currentOffering?.availablePackages) {
        setOfferings(currentOffering.availablePackages as any);
        // Select the first package by default (usually monthly)
        setSelectedPackage(currentOffering.availablePackages[0] as any);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features: PremiumFeature[] = [
    {
      icon: 'users',
      title: 'Add Family Members',
      description: 'Add up to 10 family members (free plan limited to 1)'
    },
    { 
      icon: 'camera', 
      title: 'Photo Validation', 
      description: 'Require photo proof for task completion' 
    },
    { 
      icon: 'bell', 
      title: 'Smart Notifications', 
      description: 'Advanced reminder and escalation options' 
    },
    { 
      icon: 'bar-chart', 
      title: 'Advanced Analytics', 
      description: 'Detailed insights and progress tracking' 
    },
    { 
      icon: 'shield', 
      title: 'Priority Support', 
      description: '24/7 customer support via email' 
    },
    { 
      icon: 'tag', 
      title: 'Custom Categories', 
      description: 'Create your own task categories' 
    },
  ];

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await revenueCat.purchasePackage(selectedPackage);
      if (success) {
        Alert.alert(
          'Success!',
          'Welcome to TypeB Premium! You now have access to all premium features.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const success = await revenueCat.restorePurchases();
      if (success) {
        Alert.alert(
          'Success!',
          'Your purchases have been restored successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('No Purchases', 'No previous purchases found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Processing..." />;
  }

  // If user is already premium, show different content
  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              testID="premium-back-button"
            >
              <Feather name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Image
                source={require('../../../assets/type_b_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>You're Premium!</Text>
              <Text style={styles.subtitle}>Thank you for supporting TypeB</Text>
            </View>
          </View>

          {/* Subscription Info */}
          <Card style={styles.subscriptionCard}>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionLabel}>Current Plan</Text>
              <Text style={styles.subscriptionValue}>Premium Monthly</Text>
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionLabel}>Next Billing Date</Text>
              <Text style={styles.subscriptionValue}>
                {expirationDate ?
                  new Date(expirationDate).toLocaleDateString() :
                  'Lifetime'
                }
              </Text>
            </View>
          </Card>

          {/* Active Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Your Premium Features</Text>
            {features.map((feature, index) => (
              <Card key={index} style={styles.featureCard}>
                <View style={styles.featureContent}>
                  <View style={styles.featureIcon}>
                    <Feather 
                      name={feature.icon as any} 
                      size={24} 
                      color={theme.colors.success} 
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <Feather 
                    name="check-circle" 
                    size={20} 
                    color={theme.colors.success} 
                  />
                </View>
              </Card>
            ))}
          </View>

          {/* Manage Subscription */}
          <View style={styles.manageSection}>
            <TouchableOpacity 
              onPress={() => Alert.alert('Manage Subscription', 'This will open your app store subscription settings.')}
              style={styles.manageButton}
            >
              <Text style={styles.manageText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Non-premium user view
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="premium-back-button"
          >
            <Feather name="x" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Image
              source={require('../../../assets/type_b_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>TypeB Premium</Text>
            <Text style={styles.subtitle}>Unlock the full potential of TypeB</Text>
            
            {/* Pricing Options */}
            {offerings.length > 0 && (
              <View style={styles.pricingContainer}>
                {offerings.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.pricingOption,
                      selectedPackage?.identifier === pkg.identifier && styles.pricingOptionSelected
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                  >
                    <View style={styles.pricingRadio}>
                      {selectedPackage?.identifier === pkg.identifier && (
                        <View style={styles.pricingRadioInner} />
                      )}
                    </View>
                    <View style={styles.pricingDetails}>
                      <Text style={styles.pricingTitle}>
                        {pkg.product.title}
                      </Text>
                      <Text style={styles.pricingPrice}>
                        {pkg.product.priceString}
                      </Text>
                      {pkg.product.introPrice && (
                        <Text style={styles.pricingTrial}>
                          {pkg.product.introPrice.priceString} for {pkg.product.introPrice.periodNumberOfUnits} {pkg.product.introPrice.periodUnit}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Top CTA Button */}
        <View style={styles.topCtaContainer}>
          <Button
            title={isPurchasing ? "Processing..." : "Start Free Trial"}
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            disabled={isPurchasing || offerings.length === 0}
            testID="subscribe-button-top"
          />
          {isPurchasing && (
            <ActivityIndicator
              style={styles.loadingIndicator}
              color={theme.colors.primary}
            />
          )}
        </View>

        {/* Features - Main Focus */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <View style={styles.featureContent}>
                <View style={styles.featureIcon}>
                  <Feather 
                    name={feature.icon as any}
                    size={24}
                    color={isDarkMode ? theme.colors.info : theme.colors.textPrimary}
                  />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Bottom CTA Buttons */}
        <View style={styles.bottomCtaContainer}>
          <Button
            title={isPurchasing ? "Processing..." : "Start Free Trial"}
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            disabled={isPurchasing || offerings.length === 0}
            testID="subscribe-button"
          />
          <TouchableOpacity
            onPress={handleRestore}
            style={styles.restoreButton}
            disabled={isPurchasing}
            testID="restore-button"
          >
            <Text style={[styles.restoreText, isPurchasing && styles.disabledText]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            {'\n\n'}
            {selectedPackage?.product.introPrice ?
              `After your ${selectedPackage.product.introPrice.periodNumberOfUnits}-${selectedPackage.product.introPrice.periodUnit} free trial, ` :
              ''
            }
            your subscription will automatically renew at {selectedPackage?.product.priceString || '$4.99'}/month.
            {'\n\n'}
            Cancel anytime in your device settings at least 24 hours before renewal.
          </Text>
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
  scrollContent: {
    paddingBottom: spacing.XXL,
  },
  header: {
    paddingHorizontal: spacing.L,
    paddingTop: spacing.L,
    paddingBottom: spacing.XL,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.S,
    marginLeft: -spacing.S,
    marginBottom: spacing.M,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.XL,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  title: {
    fontSize: typography.title1.fontSize,
    fontWeight: typography.title1.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.XS,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  priceHeader: {
    marginTop: spacing.M,
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: borderRadius.medium,
  },
  priceHeaderText: {
    fontSize: typography.subheadline.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  topCtaContainer: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  featuresSection: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  sectionTitle: {
    fontSize: typography.title2.fontSize,
    fontWeight: typography.title2.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.L,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: spacing.S,
    padding: spacing.M,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.M,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textSecondary,
  },
  bottomCtaContainer: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.L,
    paddingTop: spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  subscribeButton: {
    marginBottom: spacing.M,
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.M,
  },
  restoreText: {
    fontSize: typography.body.fontSize,
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    fontWeight: '500',
  },
  terms: {
    paddingHorizontal: spacing.XL,
    marginTop: spacing.M,
  },
  termsText: {
    fontSize: typography.caption1.fontSize,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  subscriptionCard: {
    marginHorizontal: spacing.L,
    marginBottom: spacing.L,
    padding: spacing.M,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.S,
  },
  subscriptionLabel: {
    fontSize: typography.subheadline.fontSize,
    color: theme.colors.textSecondary,
  },
  subscriptionValue: {
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  manageSection: {
    paddingHorizontal: spacing.L,
    marginTop: spacing.L,
  },
  manageButton: {
    alignItems: 'center',
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.large,
  },
  manageText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
  },
  pricingContainer: {
    marginTop: spacing.L,
    width: '100%',
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.M,
    marginBottom: spacing.S,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: isDarkMode ? theme.colors.primary + '20' : theme.colors.primary + '10',
  },
  pricingRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: spacing.M,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  pricingDetails: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  pricingPrice: {
    fontSize: typography.subheadline.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  pricingTrial: {
    fontSize: typography.caption1.fontSize,
    color: theme.colors.success,
    marginTop: 2,
  },
  loadingIndicator: {
    marginTop: spacing.S,
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default PremiumScreen;