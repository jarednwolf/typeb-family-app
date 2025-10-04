import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import revenueCatService, { PRODUCT_IDS } from '../../services/revenueCat';
import analytics from '../../services/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface PaywallProps {
  onSuccess?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const Paywall: React.FC<PaywallProps> = ({
  onSuccess,
  onClose,
  showCloseButton = true,
}) => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      
      // Initialize RevenueCat if needed
      await revenueCatService.initialize();
      
      // Fetch available packages
      const availablePackages = await revenueCatService.getPackages();
      setPackages(availablePackages);

      // Find monthly and annual packages
      const monthly = availablePackages.find(pkg => 
        pkg.product.identifier === PRODUCT_IDS.MONTHLY || 
        pkg.packageType === 'MONTHLY'
      );
      const annual = availablePackages.find(pkg => 
        pkg.product.identifier === PRODUCT_IDS.ANNUAL || 
        pkg.packageType === 'ANNUAL'
      );

      setMonthlyPackage(monthly || null);
      setAnnualPackage(annual || null);

      // Default to annual package (better value)
      setSelectedPackage(annual || monthly || null);
    } catch (error) {
      console.error('[Paywall] Failed to load packages:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setIsPurchasing(true);
    try {
      const customerInfo = await revenueCatService.purchasePackage(selectedPackage);
      
      if (revenueCatService.checkPremiumStatus(customerInfo)) {
        Alert.alert('Success!', 'Welcome to TypeB Premium! 🎉');
        onSuccess?.();
        analytics.track('purchase_success', { product: selectedPackage.identifier });
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      
      if (revenueCatService.checkPremiumStatus(customerInfo)) {
        Alert.alert('Success!', 'Your purchases have been restored.');
        onSuccess?.();
        analytics.track('purchase_restore');
      } else {
        Alert.alert('No Purchases', 'No active subscriptions found to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const annualSavings = revenueCatService.calculateAnnualSavings(monthlyPackage ?? undefined, annualPackage ?? undefined);

  const styles = createStyles(theme, isDarkMode);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {showCloseButton && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isPurchasing}
            >
              <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>✨ PREMIUM</Text>
          </View>
          
          <Text style={styles.title}>Unlock Full Potential</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to all premium features
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {[
            'Unlimited family members',
            'Custom task categories',
            'Advanced photo validation',
            'Priority support',
            'Detailed analytics & insights',
            'Custom rewards system',
            'Ad-free experience',
            'Early access to new features',
          ].map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Subscription Options */}
        <View style={styles.optionsContainer}>
          {monthlyPackage && (
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedPackage?.identifier === monthlyPackage.identifier && styles.selectedOption,
              ]}
              onPress={() => setSelectedPackage(monthlyPackage)}
              disabled={isPurchasing}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Monthly</Text>
                <View style={[
                  styles.radioButton,
                  selectedPackage?.identifier === monthlyPackage.identifier && styles.radioButtonSelected,
                ]} />
              </View>
              <Text style={styles.optionPrice}>
                {monthlyPackage.product.priceString}
              </Text>
              <Text style={styles.optionPeriod}>per month</Text>
            </TouchableOpacity>
          )}

          {annualPackage && (
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedPackage?.identifier === annualPackage.identifier && styles.selectedOption,
              ]}
              onPress={() => setSelectedPackage(annualPackage)}
              disabled={isPurchasing}
            >
              {annualSavings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>{annualSavings}</Text>
                </View>
              )}
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Annual</Text>
                <View style={[
                  styles.radioButton,
                  selectedPackage?.identifier === annualPackage.identifier && styles.radioButtonSelected,
                ]} />
              </View>
              <Text style={styles.optionPrice}>
                {annualPackage.product.priceString}
              </Text>
              <Text style={styles.optionPeriod}>per year</Text>
              {monthlyPackage && (
                <Text style={styles.optionEquivalent}>
                  Equal to {(annualPackage.product.price / 12).toFixed(2)}/month
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || !selectedPackage}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>Start Free Trial</Text>
          )}
        </TouchableOpacity>

        {/* Restore & Help Buttons */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isPurchasing}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => Alert.alert('Need Help?', 'If you have trouble with billing or purchases, contact support@typebapp.com.')}
          disabled={isPurchasing}
        >
          <Text style={styles.restoreButtonText}>Need Help?</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          • 14-day free trial, then auto-renews{'\n'}
          • Cancel anytime in app settings{'\n'}
          • Prices may vary by region
        </Text>

        {/* Legal Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => {/* Navigate to privacy policy */}}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={() => {/* Navigate to terms */}}>
            <Text style={styles.legalLink}>Terms of Service</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  premiumBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: isDarkMode ? theme.colors.surface : '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: isDarkMode ? theme.colors.primary + '20' : theme.colors.primary + '10',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  optionPeriod: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  optionEquivalent: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  restoreButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  terms: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLink: {
    fontSize: 12,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});

export default Paywall;
