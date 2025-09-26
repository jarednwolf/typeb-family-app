/**
 * Premium Feature Gates
 *
 * Centralized logic for checking premium features and enforcing limits
 */

import { Family, User } from '../types/models';

// Type that accepts both Family and SerializedFamily from Redux
type FamilyLike = {
  id: string;
  memberIds: string[];
  isPremium: boolean;
  maxMembers: number;
};

type UserLike = {
  id: string;
  isPremium: boolean;
};

/**
 * Premium feature identifiers
 */
export const PremiumFeatures = {
  MULTIPLE_MEMBERS: 'multiple_members',
  PHOTO_VALIDATION: 'photo_validation',
  SMART_NOTIFICATIONS: 'smart_notifications',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_CATEGORIES: 'custom_categories',
  CUSTOM_ROLES: 'custom_roles',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

export type PremiumFeature = typeof PremiumFeatures[keyof typeof PremiumFeatures];

/**
 * Check if a user or family has access to a premium feature
 */
export const hasPremiumFeature = (
  feature: PremiumFeature,
  userProfile: UserLike | null,
  family?: FamilyLike | null
): boolean => {
  // Check user premium status first
  if (userProfile?.isPremium) {
    return true;
  }
  
  // Check family premium status
  if (family?.isPremium) {
    return true;
  }
  
  return false;
};

/**
 * Check if family can add more members
 */
export const canAddFamilyMember = (family: FamilyLike | null): boolean => {
  if (!family) {
    return false;
  }
  
  // Premium families can have up to 10 members
  if (family.isPremium) {
    return family.memberIds.length < 10;
  }
  
  // Free families limited to 1 member
  return family.memberIds.length < 1;
};

/**
 * Get remaining member slots for a family
 */
export const getRemainingMemberSlots = (family: FamilyLike | null): number => {
  if (!family) {
    return 0;
  }
  
  const maxMembers = family.isPremium ? 10 : 1;
  return Math.max(0, maxMembers - family.memberIds.length);
};

/**
 * Check if user needs premium for a specific action
 */
export const needsPremiumFor = (
  action: 'invite_member' | 'photo_validation' | 'custom_category' | 'custom_role',
  family: FamilyLike | null,
  userProfile: UserLike | null
): boolean => {
  // Already has premium
  if (hasPremiumFeature(PremiumFeatures.MULTIPLE_MEMBERS, userProfile, family)) {
    return false;
  }
  
  switch (action) {
    case 'invite_member':
      return family ? family.memberIds.length >= 1 : false;
    case 'photo_validation':
      return true;
    case 'custom_category':
      return true;
    case 'custom_role':
      return true;
    default:
      return false;
  }
};

/**
 * Get premium feature description
 */
export const getPremiumFeatureDescription = (feature: PremiumFeature): string => {
  const descriptions: Record<PremiumFeature, string> = {
    [PremiumFeatures.MULTIPLE_MEMBERS]: 'Add up to 10 family members',
    [PremiumFeatures.PHOTO_VALIDATION]: 'Require photo proof for task completion',
    [PremiumFeatures.SMART_NOTIFICATIONS]: 'Advanced reminder and escalation options',
    [PremiumFeatures.ADVANCED_ANALYTICS]: 'Detailed insights and progress tracking',
    [PremiumFeatures.CUSTOM_CATEGORIES]: 'Create your own task categories',
    [PremiumFeatures.CUSTOM_ROLES]: 'Customize role names for your family',
    [PremiumFeatures.PRIORITY_SUPPORT]: '24/7 customer support via email',
  };
  
  return descriptions[feature] || 'Premium feature';
};

/**
 * Get upgrade prompt message for specific context
 */
export const getUpgradePromptMessage = (
  context: 'member_limit' | 'photo_required' | 'custom_category' | 'analytics'
): { title: string; message: string; cta: string } => {
  const prompts = {
    member_limit: {
      title: 'Add Family Members',
      message: 'Upgrade to Premium to add more family members and unlock advanced features.',
      cta: 'Upgrade to Premium',
    },
    photo_required: {
      title: 'Photo Validation',
      message: 'Require photo proof for task completion with TypeB Premium.',
      cta: 'Unlock Photo Validation',
    },
    custom_category: {
      title: 'Custom Categories',
      message: 'Create your own task categories with TypeB Premium.',
      cta: 'Get Premium',
    },
    analytics: {
      title: 'Advanced Analytics',
      message: 'Get detailed insights and progress tracking with TypeB Premium.',
      cta: 'View Analytics',
    },
  };
  
  return prompts[context];
};

/**
 * Check if feature should show premium badge
 */
export const shouldShowPremiumBadge = (
  feature: PremiumFeature,
  userProfile: UserLike | null,
  family: FamilyLike | null
): boolean => {
  // Don't show badge if user already has premium
  if (hasPremiumFeature(feature, userProfile, family)) {
    return false;
  }
  
  // Show badge for premium features
  return true;
};

/**
 * Get member limit text for display
 */
export const getMemberLimitText = (family: FamilyLike | null): string => {
  if (!family) {
    return '1 member (free plan)';
  }
  
  const currentMembers = family.memberIds.length;
  const maxMembers = family.isPremium ? 10 : 1;
  
  if (family.isPremium) {
    return `${currentMembers} of ${maxMembers} members`;
  }
  
  return currentMembers >= 1
    ? 'Member limit reached (upgrade for more)'
    : '1 member allowed (free plan)';
};