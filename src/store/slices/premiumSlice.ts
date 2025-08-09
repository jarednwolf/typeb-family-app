import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PremiumFeature {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

interface PremiumState {
  isPremium: boolean;
  subscriptionType: 'free' | 'premium' | 'premium_plus';
  expirationDate: string | null;
  willRenew: boolean;
  features: PremiumFeature[];
  limits: {
    maxFamilyMembers: number;
    maxTasksPerDay: number;
    maxCustomCategories: number;
    photoValidation: boolean;
    smartNotifications: boolean;
    analytics: boolean;
    prioritySupport: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: PremiumState = {
  isPremium: false,
  subscriptionType: 'free',
  expirationDate: null,
  willRenew: false,
  features: [
    {
      id: 'photo_validation',
      name: 'Photo Validation',
      enabled: false,
      description: 'Managers can review and validate photo submissions',
    },
    {
      id: 'custom_categories',
      name: 'Custom Categories',
      enabled: false,
      description: 'Create unlimited custom task categories',
    },
    {
      id: 'smart_notifications',
      name: 'Smart Notifications',
      enabled: false,
      description: 'Intelligent reminders with escalation logic',
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      enabled: false,
      description: 'Detailed performance metrics and insights',
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      enabled: false,
      description: 'Get help within 2 hours',
    },
  ],
  limits: {
    maxFamilyMembers: 5,
    maxTasksPerDay: 10,
    maxCustomCategories: 3,
    photoValidation: false,
    smartNotifications: false,
    analytics: false,
    prioritySupport: false,
  },
  loading: false,
  error: null,
};

const premiumLimits = {
  maxFamilyMembers: 20,
  maxTasksPerDay: -1, // unlimited
  maxCustomCategories: -1, // unlimited
  photoValidation: true,
  smartNotifications: true,
  analytics: true,
  prioritySupport: true,
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    updatePremiumStatus: (
      state,
      action: PayloadAction<{
        isPremium: boolean;
        expirationDate: string | null;
        subscriptionType: 'free' | 'premium' | 'premium_plus';
        willRenew?: boolean;
      }>
    ) => {
      state.isPremium = action.payload.isPremium;
      state.expirationDate = action.payload.expirationDate;
      state.subscriptionType = action.payload.subscriptionType;
      state.willRenew = action.payload.willRenew ?? false;
      
      // Update features based on premium status
      state.features = state.features.map(feature => ({
        ...feature,
        enabled: action.payload.isPremium,
      }));
      
      // Update limits based on premium status
      if (action.payload.isPremium) {
        state.limits = premiumLimits;
      } else {
        state.limits = initialState.limits;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetPremiumState: (state) => {
      return initialState;
    },
  },
});

export const {
  updatePremiumStatus,
  setLoading,
  setError,
  resetPremiumState,
} = premiumSlice.actions;

export default premiumSlice.reducer;