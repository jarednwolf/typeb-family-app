import { useEffect, useState, useCallback } from 'react';
import revenueCatService from '../services/revenueCat';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/userSlice';
import * as Sentry from '@sentry/react-native';

export interface PremiumStatus {
  isPremium: boolean;
  isLoading: boolean;
  productId?: string;
  expirationDate?: Date;
  willRenew?: boolean;
  isLifetime?: boolean;
}

export const usePremium = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isPremium: false,
    isLoading: true,
  });

  const checkPremiumStatus = useCallback(async () => {
    if (!currentUser?.uid) {
      setPremiumStatus({
        isPremium: false,
        isLoading: false,
      });
      return;
    }

    try {
      setPremiumStatus(prev => ({ ...prev, isLoading: true }));
      
      // Check RevenueCat subscription status
      const isPremium = await revenueCatService.isPremium();
      const customerInfo = await revenueCatService.getCustomerInfo();
      
      // Extract subscription details
      const activeSubscriptions = customerInfo?.activeSubscriptions || [];
      const entitlements = customerInfo?.entitlements?.active || {};
      
      let productId: string | undefined;
      let expirationDate: Date | undefined;
      let willRenew = false;
      let isLifetime = false;

      // Check for premium entitlement
      if (entitlements['premium']) {
        productId = entitlements['premium'].productIdentifier;
        
        if (entitlements['premium'].expirationDate) {
          expirationDate = new Date(entitlements['premium'].expirationDate);
        }
        
        willRenew = entitlements['premium'].willRenew || false;
        isLifetime = entitlements['premium'].periodType === 'lifetime';
      }

      setPremiumStatus({
        isPremium,
        isLoading: false,
        productId,
        expirationDate,
        willRenew,
        isLifetime,
      });
    } catch (error) {
      console.error('Error checking premium status:', error);
      Sentry.captureException(error);
      
      setPremiumStatus({
        isPremium: false,
        isLoading: false,
      });
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    checkPremiumStatus();
    
    // Set up listener for subscription changes
    // Guard: if service exposes listener, use it; otherwise, fallback to interval poll
    const maybeListener = (revenueCatService as any).addCustomerInfoUpdateListener?.(() => {
      checkPremiumStatus();
    });

    if (typeof maybeListener === 'function') {
      return () => { maybeListener(); };
    }

    const intervalId = setInterval(() => {
      checkPremiumStatus();
    }, 60_000);
    return () => clearInterval(intervalId);
  }, [checkPremiumStatus]);

  const refresh = useCallback(async () => {
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  return {
    ...premiumStatus,
    refresh,
  };
};

// Hook for checking specific premium features
export const usePremiumFeature = (featureName: string) => {
  const { isPremium, isLoading } = usePremium();
  
  // Define which features are premium
  const premiumFeatures = [
    'custom_categories',
    'unlimited_family_members',
    'advanced_analytics',
    'export_data',
    'priority_support',
    'ai_insights',
    'custom_rewards',
    'advanced_notifications',
    'family_challenges',
    'achievement_badges',
  ];

  const isFeatureAvailable = isPremium && premiumFeatures.includes(featureName);
  
  return {
    isAvailable: isFeatureAvailable,
    isPremium,
    isLoading,
  };
};
