/**
 * Premium Features Integration Tests
 * 
 * Tests complete premium feature workflows with RevenueCat:
 * - Subscription purchase flow
 * - Feature gating across components
 * - Premium content access
 * - Subscription management
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { CustomCategories } from '../../components/premium/CustomCategories';
import { PaywallScreen } from '../../screens/premium/PaywallScreen';
import { store } from '../../store';
import revenueCatService from '../../services/revenueCat';
import analyticsService from '../../services/analytics';

jest.mock('../../services/revenueCat');
jest.mock('../../services/analytics');
jest.mock('react-native-purchases', () => ({
  Purchases: {
    configure: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
  },
  LOG_LEVEL: { VERBOSE: 0 },
}));

describe('Premium Features Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Purchase Flow', () => {
    it('should complete full subscription purchase workflow', async () => {
      // Setup initial state - non-premium user
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      (revenueCatService.getOfferings as jest.Mock).mockResolvedValue({
        current: {
          availablePackages: [
            {
              identifier: 'monthly',
              product: {
                price_string: '$4.99',
                title: 'Premium Monthly',
              },
            },
            {
              identifier: 'annual',
              product: {
                price_string: '$39.99',
                title: 'Premium Annual',
              },
            },
          ],
        },
      });

      const { getByText, getByTestId, queryByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PremiumGate feature="custom_categories">
              <CustomCategories />
            </PremiumGate>
          </NavigationContainer>
        </Provider>
      );

      // Should show upgrade prompt
      await waitFor(() => {
        expect(getByText('Upgrade to Premium')).toBeTruthy();
      });

      // Tap upgrade button
      fireEvent.press(getByText('Upgrade to Premium'));

      // Mock successful purchase
      (revenueCatService.purchasePackage as jest.Mock).mockResolvedValue({
        success: true,
        customerInfo: {
          entitlements: {
            active: { premium: { isActive: true } },
          },
        },
      });
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(true);

      // Select and purchase monthly plan
      await waitFor(() => {
        expect(getByText('Premium Monthly')).toBeTruthy();
      });

      fireEvent.press(getByTestId('purchase-monthly'));

      // Verify purchase tracking
      await waitFor(() => {
        expect(analyticsService.track).toHaveBeenCalledWith('Purchase Completed', {
          product: 'monthly',
          price: '$4.99',
        });
      });

      // Should now show premium content
      await waitFor(() => {
        expect(queryByText('Upgrade to Premium')).toBeNull();
        expect(getByText('Custom Categories')).toBeTruthy();
      });
    });

    it('should handle purchase restoration', async () => {
      (revenueCatService.restorePurchases as jest.Mock).mockResolvedValue({
        success: true,
        customerInfo: {
          entitlements: {
            active: { premium: { isActive: true } },
          },
        },
      });

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PaywallScreen />
          </NavigationContainer>
        </Provider>
      );

      fireEvent.press(getByText('Restore Purchases'));

      await waitFor(() => {
        expect(revenueCatService.restorePurchases).toHaveBeenCalled();
        expect(analyticsService.track).toHaveBeenCalledWith('Purchases Restored');
      });
    });
  });

  describe('Feature Access Control Integration', () => {
    it('should gate multiple features based on subscription status', async () => {
      // Test as non-premium user
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const { getByTestId, rerender } = render(
        <Provider store={store}>
          <NavigationContainer>
            <CustomCategories />
          </NavigationContainer>
        </Provider>
      );

      // Try to add custom category
      fireEvent.press(getByTestId('add-category-button'));

      await waitFor(() => {
        expect(getByTestId('premium-prompt')).toBeTruthy();
      });

      // Simulate user becoming premium
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(true);
      
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <CustomCategories />
          </NavigationContainer>
        </Provider>
      );

      // Should now allow adding categories
      fireEvent.press(getByTestId('add-category-button'));

      await waitFor(() => {
        expect(getByTestId('category-form')).toBeTruthy();
      });
    });

    it('should enforce photo limits for non-premium users', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      (revenueCatService.getPhotoCount as jest.Mock).mockResolvedValue(10);
      (revenueCatService.getPhotoLimit as jest.Mock).mockResolvedValue(10);

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PhotoCapture taskId="123" />
          </NavigationContainer>
        </Provider>
      );

      // Should show limit warning
      await waitFor(() => {
        expect(getByText('Photo limit reached (10/10)')).toBeTruthy();
      });

      // Try to take photo
      fireEvent.press(getByTestId('capture-button'));

      await waitFor(() => {
        expect(getByText('Upgrade for Unlimited Photos')).toBeTruthy();
      });
    });
  });

  describe('Subscription Management Integration', () => {
    it('should display current subscription details', async () => {
      (revenueCatService.getSubscriptionInfo as jest.Mock).mockResolvedValue({
        productId: 'premium_annual',
        expirationDate: new Date('2025-12-31'),
        willRenew: true,
        isActive: true,
        originalPurchaseDate: new Date('2024-12-31'),
      });

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <SubscriptionSettings />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Premium Annual')).toBeTruthy();
        expect(getByText('Expires: Dec 31, 2025')).toBeTruthy();
        expect(getByText('Auto-renewal: On')).toBeTruthy();
      });
    });

    it('should handle subscription cancellation', async () => {
      (revenueCatService.getSubscriptionInfo as jest.Mock).mockResolvedValue({
        productId: 'premium_monthly',
        expirationDate: new Date('2025-01-31'),
        willRenew: false,
        isActive: true,
      });

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <SubscriptionSettings />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Subscription ending on Jan 31, 2025')).toBeTruthy();
        expect(getByText('Resubscribe')).toBeTruthy();
      });
    });
  });

  describe('Offline Premium Access', () => {
    it('should maintain premium access when offline', async () => {
      // Mock offline state
      (revenueCatService.getCachedCustomerInfo as jest.Mock).mockResolvedValue({
        entitlements: {
          active: { premium: { isActive: true } },
        },
      });

      const { queryByText, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PremiumGate feature="advanced_analytics" useCache={true}>
              <AdvancedAnalytics />
            </PremiumGate>
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(queryByText('Upgrade to Premium')).toBeNull();
        expect(getByText('Advanced Analytics')).toBeTruthy();
      });
    });

    it('should sync subscription status when coming online', async () => {
      // Start offline with cached premium status
      (revenueCatService.getCachedCustomerInfo as jest.Mock).mockResolvedValue({
        entitlements: {
          active: { premium: { isActive: true } },
        },
      });

      const { rerender } = render(
        <Provider store={store}>
          <NavigationContainer>
            <CustomCategories />
          </NavigationContainer>
        </Provider>
      );

      // Simulate coming online with expired subscription
      (revenueCatService.syncCustomerInfo as jest.Mock).mockResolvedValue({
        entitlements: {
          active: {},
        },
      });
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);

      // Trigger sync
      await act(async () => {
        await revenueCatService.syncCustomerInfo();
      });

      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <CustomCategories />
          </NavigationContainer>
        </Provider>
      );

      // Should now show as non-premium
      await waitFor(() => {
        expect(getByTestId('premium-badge')).toBeTruthy();
      });
    });
  });

  describe('Trial Period Integration', () => {
    it('should handle free trial signup', async () => {
      (revenueCatService.getTrialInfo as jest.Mock).mockResolvedValue({
        isEligibleForTrial: true,
        trialDuration: 7,
        trialPrice: 0,
      });

      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PaywallScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Start 7-Day Free Trial')).toBeTruthy();
      });

      fireEvent.press(getByTestId('start-trial-button'));

      (revenueCatService.purchasePackage as jest.Mock).mockResolvedValue({
        success: true,
        customerInfo: {
          entitlements: {
            active: { 
              premium: { 
                isActive: true,
                periodType: 'TRIAL',
              },
            },
          },
        },
      });

      await waitFor(() => {
        expect(analyticsService.track).toHaveBeenCalledWith('Trial Started', {
          duration: 7,
          product: 'premium_monthly',
        });
      });
    });

    it('should show trial expiration warning', async () => {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 2); // 2 days left

      (revenueCatService.getSubscriptionInfo as jest.Mock).mockResolvedValue({
        periodType: 'TRIAL',
        expirationDate: trialEndDate,
        isActive: true,
      });

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <HomeScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText(/Trial ends in 2 days/)).toBeTruthy();
        expect(getByText('Continue with Premium')).toBeTruthy();
      });
    });
  });
});

// Helper component imports (these would be imported from actual files)
const SubscriptionSettings = () => null;
const AdvancedAnalytics = () => null;
const HomeScreen = () => null;
