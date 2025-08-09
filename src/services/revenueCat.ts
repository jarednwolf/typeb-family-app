import { Platform } from 'react-native';
import { store } from '../store/store';
import { updatePremiumStatus } from '../store/slices/premiumSlice';
import { analyticsService } from './analytics';

// Type definitions for when RevenueCat is not available
type PurchasesOffering = any;
type PurchasesPackage = any;
type CustomerInfo = any;
type PurchasesError = any;

// Conditionally import RevenueCat only if available
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (error) {
  console.log('RevenueCat not available - running in development mode without IAP');
}

// Get API keys from environment variables
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_YOUR_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_YOUR_ANDROID_KEY';

// Check if we're in production mode
const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;
  private isDevelopmentMode = !Purchases || !isProduction;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async configure(userId: string): Promise<void> {
    if (this.isConfigured) return;

    // Skip configuration in development mode
    if (this.isDevelopmentMode) {
      console.log('RevenueCat: Running in development mode without native module');
      this.isConfigured = true;
      // Set default free tier in development
      store.dispatch(updatePremiumStatus({
        isPremium: false,
        expirationDate: null,
        subscriptionType: 'free',
      }));
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios'
        ? REVENUECAT_API_KEY_IOS
        : REVENUECAT_API_KEY_ANDROID;

      // Validate API key
      if (apiKey.includes('YOUR_') || apiKey.includes('_KEY')) {
        throw new Error('RevenueCat API keys not configured. Please set up production keys.');
      }

      // Configure RevenueCat
      Purchases.configure({ 
        apiKey, 
        appUserID: userId,
        observerMode: false, // Set to false for production
        useAmazon: false // Set to true if distributing on Amazon
      });
      
      // Set up listener for customer info updates
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
      
      // Set log level based on environment
      if (isProduction) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
      } else {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }
      
      this.isConfigured = true;
      
      // Check initial subscription status
      await this.checkSubscriptionStatus();
      
      // Track configuration success
      analyticsService.track('revenueCat_configured', {
        platform: Platform.OS,
        userId
      });
    } catch (error: any) {
      console.error('RevenueCat configuration error:', error);
      
      // Track configuration error
      analyticsService.track('revenueCat_configuration_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
      
      // In production, we should handle this gracefully
      if (isProduction) {
        // Fall back to free tier if RevenueCat fails
        store.dispatch(updatePremiumStatus({
          isPremium: false,
          expirationDate: null,
          subscriptionType: 'free',
        }));
      }
    }
  }

  private handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    const expirationDate = customerInfo.entitlements.active['premium']?.expirationDate;
    const willRenew = customerInfo.entitlements.active['premium']?.willRenew;
    
    // Update Redux state
    store.dispatch(updatePremiumStatus({
      isPremium,
      expirationDate: expirationDate || null,
      subscriptionType: isPremium ? 'premium' : 'free',
      willRenew: willRenew || false,
    }));
    
    // Track subscription status change
    analyticsService.track('subscription_status_updated', {
      isPremium,
      expirationDate,
      willRenew,
      platform: Platform.OS
    });
  };

  async checkSubscriptionStatus(): Promise<boolean> {
    if (this.isDevelopmentMode) {
      return false; // Always return free tier in development
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.handleCustomerInfoUpdate(customerInfo);
      
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      // Track subscription check
      analyticsService.track('subscription_status_checked', {
        isPremium,
        platform: Platform.OS
      });
      
      return isPremium;
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      
      // Track error
      analyticsService.track('subscription_check_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
      
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (this.isDevelopmentMode) {
      // Return mock offerings for development
      return {
        identifier: 'default',
        availablePackages: [
          {
            identifier: 'monthly',
            product: {
              identifier: 'typeb_premium_monthly',
              title: 'Premium Monthly',
              priceString: '$4.99',
              price: 4.99,
              currencyCode: 'USD',
              introPrice: {
                priceString: 'Free',
                price: 0,
                periodNumberOfUnits: 7,
                periodUnit: 'day'
              }
            }
          },
          {
            identifier: 'annual',
            product: {
              identifier: 'typeb_premium_annual',
              title: 'Premium Annual',
              priceString: '$39.99',
              price: 39.99,
              currencyCode: 'USD',
              introPrice: null
            }
          }
        ]
      } as any;
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      // Track offerings fetch
      analyticsService.track('offerings_fetched', {
        hasOfferings: offerings.current !== null,
        offeringId: offerings.current?.identifier,
        packageCount: offerings.current?.availablePackages?.length || 0,
        platform: Platform.OS
      });
      
      return offerings.current;
    } catch (error: any) {
      console.error('Error fetching offerings:', error);
      
      // Track error
      analyticsService.track('offerings_fetch_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
      
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<boolean> {
    if (this.isDevelopmentMode) {
      // Simulate purchase in development
      console.log('Development mode: Simulating purchase of', packageToPurchase.identifier);
      
      // Update Redux state to simulate premium
      store.dispatch(updatePremiumStatus({
        isPremium: true,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        subscriptionType: 'premium',
        willRenew: true,
      }));
      
      return true;
    }

    try {
      // Track purchase initiation
      analyticsService.track('purchase_initiated', {
        packageId: packageToPurchase.identifier,
        productId: packageToPurchase.product.identifier,
        price: packageToPurchase.product.price,
        platform: Platform.OS
      });
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.handleCustomerInfoUpdate(customerInfo);
      
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      // Track purchase completion
      analyticsService.track('purchase_completed', {
        packageId: packageToPurchase.identifier,
        productId: packageToPurchase.product.identifier,
        price: packageToPurchase.product.price,
        isPremium,
        platform: Platform.OS
      });
      
      // Track revenue event
      analyticsService.trackRevenue({
        productId: packageToPurchase.product.identifier,
        price: packageToPurchase.product.price,
        currency: packageToPurchase.product.currencyCode || 'USD',
        quantity: 1
      });
      
      return isPremium;
    } catch (error) {
      const purchaseError = error as PurchasesError;
      
      if (purchaseError.userCancelled) {
        console.log('User cancelled purchase');
        
        // Track cancellation
        analyticsService.track('purchase_cancelled', {
          packageId: packageToPurchase.identifier,
          platform: Platform.OS
        });
      } else {
        console.error('Purchase error:', purchaseError);
        
        // Track error
        analyticsService.track('purchase_error', {
          packageId: packageToPurchase.identifier,
          error: purchaseError.message,
          errorCode: purchaseError.code,
          platform: Platform.OS
        });
      }
      
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (this.isDevelopmentMode) {
      console.log('Development mode: No purchases to restore');
      return false;
    }

    try {
      // Track restore initiation
      analyticsService.track('restore_initiated', {
        platform: Platform.OS
      });
      
      const customerInfo = await Purchases.restorePurchases();
      this.handleCustomerInfoUpdate(customerInfo);
      
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      // Track restore completion
      analyticsService.track('restore_completed', {
        isPremium,
        platform: Platform.OS
      });
      
      return isPremium;
    } catch (error: any) {
      console.error('Restore purchases error:', error);
      
      // Track error
      analyticsService.track('restore_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
      
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.isDevelopmentMode) {
      this.isConfigured = false;
      // Reset to free tier
      store.dispatch(updatePremiumStatus({
        isPremium: false,
        expirationDate: null,
        subscriptionType: 'free',
        willRenew: false,
      }));
      return;
    }

    try {
      await Purchases.logOut();
      this.isConfigured = false;
      
      // Track logout
      analyticsService.track('revenueCat_logout', {
        platform: Platform.OS
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Track error
      analyticsService.track('revenueCat_logout_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
    }
  }
  
  // Additional production methods
  
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (this.isDevelopmentMode) {
      return null;
    }
    
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }
  
  async syncPurchases(): Promise<void> {
    if (this.isDevelopmentMode) {
      return;
    }
    
    try {
      await Purchases.syncPurchases();
      
      // Track sync
      analyticsService.track('purchases_synced', {
        platform: Platform.OS
      });
    } catch (error: any) {
      console.error('Error syncing purchases:', error);
      
      // Track error
      analyticsService.track('purchases_sync_error', {
        error: error?.message || 'Unknown error',
        platform: Platform.OS
      });
    }
  }
  
  async setAttributes(attributes: Record<string, string>): Promise<void> {
    if (this.isDevelopmentMode) {
      return;
    }
    
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Error setting attributes:', error);
    }
  }
}

export const revenueCat = RevenueCatService.getInstance();