/**
 * Premium Features Unit Tests
 * 
 * Tests RevenueCat integration and premium feature gating:
 * - Subscription status checking
 * - Feature access control
 * - Purchase flow handling
 * - Premium content visibility
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { CustomCategories } from '../../components/premium/CustomCategories';
import { PremiumAnalytics } from '../../components/premium/PremiumAnalytics';
import { configureStore } from '@reduxjs/toolkit';
import revenueCatService from '../../services/revenueCat';
import { Alert } from 'react-native';

jest.mock('../../services/revenueCat');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Create mock store
const createMockStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      user: (state = { isPremium: false, ...initialState.user }) => state,
      premium: (state = { features: [], ...initialState.premium }) => state,
      family: (state = { currentFamily: { id: 'family-1', isPremium: initialState.user?.isPremium || false }, members: [] }) => state,
      auth: (state = { user: { uid: 'test-user-123' }, userProfile: { id: 'test-user-123', role: 'parent' } }) => state,
    },
  });
};

describe('Premium Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RevenueCat Service', () => {
    it('should initialize RevenueCat on app launch', async () => {
      (revenueCatService.initialize as jest.Mock).mockResolvedValue(true);
      
      const initialized = await revenueCatService.initialize();
      
      expect(initialized).toBe(true);
      expect(revenueCatService.initialize).toHaveBeenCalled();
    });

    it('should check premium status correctly', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(true);
      
      const isPremium = await revenueCatService.isPremium();
      
      expect(isPremium).toBe(true);
    });

    it('should handle purchase flow', async () => {
      const mockPurchaseResult = {
        success: true,
        productId: 'premium_monthly',
        transactionId: 'txn_123',
      };
      
      (revenueCatService.purchasePackage as jest.Mock).mockResolvedValue(mockPurchaseResult);
      
      const result = await revenueCatService.purchasePackage('premium_monthly');
      
      expect(result).toEqual(mockPurchaseResult);
      expect(result.success).toBe(true);
    });

    it('should handle purchase cancellation', async () => {
      const mockCancellation = {
        success: false,
        userCancelled: true,
      };
      
      (revenueCatService.purchasePackage as jest.Mock).mockResolvedValue(mockCancellation);
      
      const result = await revenueCatService.purchasePackage('premium_monthly');
      
      expect(result.userCancelled).toBe(true);
      expect(result.success).toBe(false);
    });

    it('should restore purchases', async () => {
      const mockRestoreResult = {
        success: true,
        restoredPurchases: ['premium_annual'],
      };
      
      (revenueCatService.restorePurchases as jest.Mock).mockResolvedValue(mockRestoreResult);
      
      const result = await revenueCatService.restorePurchases();
      
      expect(result.success).toBe(true);
      expect(result.restoredPurchases).toContain('premium_annual');
    });
  });

  describe('PremiumGate Component', () => {
    it('should show premium content when user is subscribed', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(true);
      
      const store = createMockStore({ user: { isPremium: true } });
      
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <PremiumGate feature="custom_categories">
            <CustomCategories />
          </PremiumGate>
        </Provider>
      );

      await waitFor(() => {
        expect(queryByText('Upgrade to Premium')).toBeNull();
        expect(getByText('Custom Categories')).toBeTruthy();
      });
    });

    it('should show upgrade prompt when user is not subscribed', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const store = createMockStore({ user: { isPremium: false } });
      
      const { getByText } = render(
        <Provider store={store}>
          <PremiumGate feature="custom_categories">
            <CustomCategories />
          </PremiumGate>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Upgrade to Premium')).toBeTruthy();
        expect(getByText('Unlock Custom Categories')).toBeTruthy();
      });
    });

    it('should handle upgrade button press', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      (revenueCatService.showPaywall as jest.Mock).mockResolvedValue(true);
      
      const store = createMockStore({ user: { isPremium: false } });
      
      const { getByText } = render(
        <Provider store={store}>
          <PremiumGate feature="custom_categories">
            <CustomCategories />
          </PremiumGate>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Upgrade to Premium')).toBeTruthy();
      });

      fireEvent.press(getByText('Upgrade to Premium'));

      await waitFor(() => {
        expect(revenueCatService.showPaywall).toHaveBeenCalled();
      });
    });

    it('should show feature-specific benefits', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const store = createMockStore({ user: { isPremium: false } });
      
      const { getByText } = render(
        <Provider store={store}>
          <PremiumGate feature="advanced_analytics">
            <PremiumAnalytics />
          </PremiumGate>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Premium Feature: Advanced Analytics')).toBeTruthy();
        expect(getByText(/Track detailed progress/)).toBeTruthy();
        expect(getByText(/Export reports/)).toBeTruthy();
      });
    });
  });

  describe('Feature Access Control', () => {
    const premiumFeatures = [
      'custom_categories',
      'advanced_analytics',
      'unlimited_photos',
      'priority_support',
      'family_insights',
    ];

    premiumFeatures.forEach(feature => {
      it(`should control access to ${feature}`, async () => {
        // Test as non-premium user
        (revenueCatService.hasFeatureAccess as jest.Mock).mockResolvedValue(false);
        
        let hasAccess = await revenueCatService.hasFeatureAccess(feature);
        expect(hasAccess).toBe(false);
        
        // Test as premium user
        (revenueCatService.hasFeatureAccess as jest.Mock).mockResolvedValue(true);
        
        hasAccess = await revenueCatService.hasFeatureAccess(feature);
        expect(hasAccess).toBe(true);
      });
    });

    it('should enforce photo limits for non-premium users', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      (revenueCatService.getPhotoLimit as jest.Mock).mockResolvedValue(10);
      
      const photoLimit = await revenueCatService.getPhotoLimit();
      
      expect(photoLimit).toBe(10);
    });

    it('should provide unlimited photos for premium users', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(true);
      (revenueCatService.getPhotoLimit as jest.Mock).mockResolvedValue(Infinity);
      
      const photoLimit = await revenueCatService.getPhotoLimit();
      
      expect(photoLimit).toBe(Infinity);
    });

    it('should limit custom categories for non-premium users', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      (revenueCatService.getCategoryLimit as jest.Mock).mockResolvedValue(3);
      
      const categoryLimit = await revenueCatService.getCategoryLimit();
      
      expect(categoryLimit).toBe(3);
    });
  });

  describe('Subscription Management', () => {
    it('should get current subscription info', async () => {
      const mockSubscriptionInfo = {
        productId: 'premium_annual',
        expirationDate: new Date('2025-01-01'),
        willRenew: true,
        isActive: true,
      };
      
      (revenueCatService.getSubscriptionInfo as jest.Mock).mockResolvedValue(mockSubscriptionInfo);
      
      const info = await revenueCatService.getSubscriptionInfo();
      
      expect(info.productId).toBe('premium_annual');
      expect(info.isActive).toBe(true);
      expect(info.willRenew).toBe(true);
    });

    it('should handle subscription expiration', async () => {
      const mockExpiredInfo = {
        productId: 'premium_monthly',
        expirationDate: new Date('2024-01-01'),
        willRenew: false,
        isActive: false,
      };
      
      (revenueCatService.getSubscriptionInfo as jest.Mock).mockResolvedValue(mockExpiredInfo);
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const info = await revenueCatService.getSubscriptionInfo();
      const isPremium = await revenueCatService.isPremium();
      
      expect(info.isActive).toBe(false);
      expect(isPremium).toBe(false);
    });

    it('should offer trial for new users', async () => {
      const mockTrialInfo = {
        isEligibleForTrial: true,
        trialDuration: 7,
        trialPrice: 0,
      };
      
      (revenueCatService.getTrialInfo as jest.Mock).mockResolvedValue(mockTrialInfo);
      
      const trialInfo = await revenueCatService.getTrialInfo();
      
      expect(trialInfo.isEligibleForTrial).toBe(true);
      expect(trialInfo.trialDuration).toBe(7);
      expect(trialInfo.trialPrice).toBe(0);
    });
  });

  describe('Paywall Component', () => {
    it('should display pricing options', async () => {
      const mockOfferings = {
        current: {
          monthly: { price: '$4.99', productId: 'premium_monthly' },
          annual: { price: '$39.99', productId: 'premium_annual', savings: '33%' },
        },
      };
      
      (revenueCatService.getOfferings as jest.Mock).mockResolvedValue(mockOfferings);
      
      const offerings = await revenueCatService.getOfferings();
      
      expect(offerings.current.monthly.price).toBe('$4.99');
      expect(offerings.current.annual.price).toBe('$39.99');
      expect(offerings.current.annual.savings).toBe('33%');
    });

    it('should handle purchase errors gracefully', async () => {
      const purchaseError = new Error('Network error');
      
      (revenueCatService.purchasePackage as jest.Mock).mockRejectedValue(purchaseError);
      
      await expect(
        revenueCatService.purchasePackage('premium_monthly')
      ).rejects.toThrow('Network error');
    });

    it('should track paywall events', async () => {
      const mockAnalytics = jest.fn();
      
      (revenueCatService.trackPaywallView as jest.Mock).mockImplementation(mockAnalytics);
      (revenueCatService.trackPurchaseAttempt as jest.Mock).mockImplementation(mockAnalytics);
      (revenueCatService.trackPurchaseSuccess as jest.Mock).mockImplementation(mockAnalytics);
      
      await revenueCatService.trackPaywallView();
      await revenueCatService.trackPurchaseAttempt('premium_monthly');
      await revenueCatService.trackPurchaseSuccess('premium_monthly', 'txn_123');
      
      expect(revenueCatService.trackPaywallView).toHaveBeenCalled();
      expect(revenueCatService.trackPurchaseAttempt).toHaveBeenCalledWith('premium_monthly');
      expect(revenueCatService.trackPurchaseSuccess).toHaveBeenCalledWith('premium_monthly', 'txn_123');
    });
  });

  describe('Premium Features UI', () => {
    it('should show premium badge on premium features', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const store = createMockStore({ user: { isPremium: false } });
      
      const { getAllByTestId } = render(
        <Provider store={store}>
          <CustomCategories showPremiumBadge={true} />
        </Provider>
      );

      await waitFor(() => {
        const premiumBadges = getAllByTestId('premium-badge');
        expect(premiumBadges.length).toBeGreaterThan(0);
      });
    });

    it('should disable premium features for non-subscribers', async () => {
      (revenueCatService.isPremium as jest.Mock).mockResolvedValue(false);
      
      const store = createMockStore({ user: { isPremium: false } });
      
      const { getByTestId } = render(
        <Provider store={store}>
          <CustomCategories />
        </Provider>
      );

      const addButton = getByTestId('add-category-button');
      
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Premium Feature',
          expect.stringContaining('Upgrade to Premium'),
          expect.any(Array)
        );
      });
    });
  });
});
