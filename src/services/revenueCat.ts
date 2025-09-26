/**
 * RevenueCat Service
 * Manages in-app purchases and subscriptions
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesEntitlementInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

// Product IDs - must match what's configured in RevenueCat dashboard
export const PRODUCT_IDS = {
  MONTHLY: 'typeb_premium_monthly',
  ANNUAL: 'typeb_premium_annual',
};

// Entitlement IDs
export const ENTITLEMENT_IDS = {
  PREMIUM: 'premium',
};

class RevenueCatService {
  private initialized = false;
  private currentOfferings: PurchasesOffering | null = null;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId?: string) {
    if (this.initialized) {
      console.log('[RevenueCat] Already initialized');
      return;
    }

    try {
      // Configure SDK based on platform
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_YOUR_IOS_KEY',
        android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_YOUR_ANDROID_KEY',
      });

      if (!apiKey || apiKey.includes('YOUR')) {
        console.warn('[RevenueCat] API key not configured properly');
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure the SDK
      await Purchases.configure({
        apiKey,
        appUserID: userId, // Optional: set if you want to sync with your own user ID
        observerMode: false, // Set to true if you're using RevenueCat alongside your own billing
        useAmazon: false,
      });

      this.initialized = true;
      console.log('[RevenueCat] Successfully initialized');

      // Fetch initial offerings
      await this.fetchOfferings();
    } catch (error) {
      console.error('[RevenueCat] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Identify user (useful after login)
   */
  async identifyUser(userId: string) {
    try {
      await Purchases.logIn(userId);
      console.log('[RevenueCat] User identified:', userId);
    } catch (error) {
      console.error('[RevenueCat] Failed to identify user:', error);
    }
  }

  /**
   * Log out user (useful on sign out)
   */
  async logOut() {
    try {
      await Purchases.logOut();
      console.log('[RevenueCat] User logged out');
    } catch (error) {
      console.error('[RevenueCat] Failed to log out:', error);
    }
  }

  /**
   * Fetch available offerings
   */
  async fetchOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null) {
        this.currentOfferings = offerings.current;
        console.log('[RevenueCat] Fetched offerings:', offerings.current.identifier);
        return offerings.current;
      }
      
      console.warn('[RevenueCat] No current offering available');
      return null;
    } catch (error) {
      console.error('[RevenueCat] Failed to fetch offerings:', error);
      return null;
    }
  }

  /**
   * Get available packages
   */
  async getPackages(): Promise<PurchasesPackage[]> {
    if (!this.currentOfferings) {
      await this.fetchOfferings();
    }

    if (!this.currentOfferings) {
      return [];
    }

    return this.currentOfferings.availablePackages;
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      console.log('[RevenueCat] Purchasing package:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('[RevenueCat] Purchase successful');
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
      } else {
        console.error('[RevenueCat] Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * Purchase by product ID
   */
  async purchaseProduct(productId: string): Promise<CustomerInfo> {
    try {
      const packages = await this.getPackages();
      const packageToPurchase = packages.find(pkg => 
        pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found`);
      }

      return await this.purchasePackage(packageToPurchase);
    } catch (error) {
      console.error('[RevenueCat] Failed to purchase product:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      console.log('[RevenueCat] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCat] Purchases restored successfully');
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Check if user has premium access
   */
  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return this.checkPremiumStatus(customerInfo);
    } catch (error) {
      console.error('[RevenueCat] Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Check premium status from customer info
   */
  checkPremiumStatus(customerInfo: CustomerInfo): boolean {
    // Check if user has the premium entitlement
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
    return premiumEntitlement !== undefined && premiumEntitlement !== null;
  }

  /**
   * Get active subscription info
   */
  getActiveSubscription(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
    return premiumEntitlement || null;
  }

  /**
   * Format price for display
   */
  formatPrice(packageItem: PurchasesPackage): string {
    const price = packageItem.product.priceString;
    const period = packageItem.packageType;

    switch (period) {
      case 'MONTHLY':
        return `${price}/month`;
      case 'ANNUAL':
        return `${price}/year`;
      default:
        return price;
    }
  }

  /**
   * Calculate savings for annual plan
   */
  calculateAnnualSavings(monthlyPackage?: PurchasesPackage, annualPackage?: PurchasesPackage): string | null {
    if (!monthlyPackage || !annualPackage) return null;

    const monthlyPrice = monthlyPackage.product.price;
    const annualPrice = annualPackage.product.price;
    const yearlyFromMonthly = monthlyPrice * 12;
    const savings = yearlyFromMonthly - annualPrice;

    if (savings > 0) {
      const percentage = Math.round((savings / yearlyFromMonthly) * 100);
      return `Save ${percentage}%`;
    }

    return null;
  }

  /**
   * Handle app lifecycle (for iOS)
   * Call this in AppDelegate or when app becomes active
   */
  async syncPurchases() {
    if (Platform.OS === 'ios') {
      try {
        await Purchases.syncPurchases();
        console.log('[RevenueCat] Purchases synced');
      } catch (error) {
        console.error('[RevenueCat] Failed to sync purchases:', error);
      }
    }
  }
}

// Export singleton instance
const revenueCatService = new RevenueCatService();
export default revenueCatService;