/**
 * Role Helper Utilities
 * 
 * Provides functions to work with customizable roles throughout the app.
 * Ensures consistent role label display while maintaining internal 'parent'/'child' structure.
 */

import { Family, User } from '../types/models';
import { DEFAULT_ROLE_PRESET } from '../constants/rolePresets';

// Type that accepts both Family and SerializedFamily from Redux
type FamilyLike = {
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;
    memberLabel: string;
    adminPlural?: string;
    memberPlural?: string;
  };
} | null;

/**
 * Gets the display label for a role based on family configuration
 *
 * @param family - The family object (may be null)
 * @param role - Internal role ('parent' or 'child')
 * @param plural - Whether to return plural form
 * @returns Display label for the role
 */
export const getRoleLabel = (
  family: FamilyLike,
  role: 'parent' | 'child',
  plural: boolean = false
): string => {
  // Default labels if no family or roleConfig
  const defaultLabels = {
    parent: plural ? 'Parents' : 'Parent',
    child: plural ? 'Children' : 'Child'
  };

  if (!family?.roleConfig) {
    return defaultLabels[role];
  }

  const config = family.roleConfig;
  
  if (role === 'parent') {
    if (plural && config.adminPlural) {
      return config.adminPlural;
    }
    return config.adminLabel || defaultLabels.parent;
  } else {
    if (plural && config.memberPlural) {
      return config.memberPlural;
    }
    return config.memberLabel || defaultLabels.child;
  }
};

/**
 * Gets the role label for a specific user in a family
 */
export const getUserRoleLabel = (
  user: User | null,
  family: FamilyLike,
  plural: boolean = false
): string => {
  if (!user?.role) {
    return 'Member'; // Fallback for edge cases
  }
  
  return getRoleLabel(family, user.role, plural);
};

/**
 * Checks if a user has admin privileges (is a 'parent')
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'parent';
};

/**
 * Checks if a user is a regular member (is a 'child')
 */
export const isMember = (user: User | null): boolean => {
  return user?.role === 'child';
};

/**
 * Gets action text with proper role label
 * Example: "Only Parents can create tasks" -> "Only Team Leads can create tasks"
 */
export const getRoleActionText = (
  family: FamilyLike,
  template: string,
  role: 'parent' | 'child',
  plural: boolean = false
): string => {
  const roleLabel = getRoleLabel(family, role, plural);
  
  // Replace common patterns
  const patterns = [
    { search: /\bParents?\b/gi, role: 'parent' },
    { search: /\bChildren\b/gi, role: 'child' },
    { search: /\bChild\b/gi, role: 'child' },
  ];
  
  let result = template;
  patterns.forEach(pattern => {
    if (pattern.role === role) {
      result = result.replace(pattern.search, roleLabel);
    }
  });
  
  return result;
};

/**
 * Gets the possessive form of a role label
 * Example: "Parent's" or "Team Lead's"
 */
export const getRolePossessive = (
  family: FamilyLike,
  role: 'parent' | 'child'
): string => {
  const label = getRoleLabel(family, role, false);
  return label.endsWith('s') ? `${label}'` : `${label}'s`;
};

/**
 * Formats a list of users by role for display
 */
export const formatMembersByRole = (
  members: User[],
  family: FamilyLike
): { admins: User[]; members: User[] } => {
  const admins = members.filter(m => m.role === 'parent');
  const regularMembers = members.filter(m => m.role === 'child');
  
  return {
    admins,
    members: regularMembers
  };
};

/**
 * Gets a description of the role for onboarding/help text
 */
export const getRoleDescription = (
  family: FamilyLike,
  role: 'parent' | 'child'
): string => {
  const roleLabel = getRoleLabel(family, role, false);
  
  if (role === 'parent') {
    return `As a ${roleLabel}, you can create and manage tasks, invite family members, and oversee all activities.`;
  } else {
    return `As a ${roleLabel}, you can view and complete tasks assigned to you and track your progress.`;
  }
};

/**
 * Checks if custom roles are being used
 */
export const hasCustomRoles = (family: FamilyLike): boolean => {
  return family?.roleConfig?.preset === 'custom';
};

/**
 * Gets the role preset icon
 */
export const getRolePresetIcon = (family: FamilyLike): string => {
  if (!family?.roleConfig?.preset) {
    return DEFAULT_ROLE_PRESET.icon;
  }
  
  // Map preset to icon
  const icons: Record<string, string> = {
    family: '👨‍👩‍👧‍👦',
    roommates: '🏠',
    team: '👥',
    custom: '⚙️'
  };
  
  return icons[family.roleConfig.preset] || DEFAULT_ROLE_PRESET.icon;
};

/**
 * Validates if a role configuration is complete
 */
export const isRoleConfigValid = (roleConfig: any): boolean => {
  if (!roleConfig) return false;
  
  const required = ['preset', 'adminLabel', 'memberLabel'];
  return required.every(field => roleConfig[field] && roleConfig[field].trim().length > 0);
};

/**
 * Creates a default role configuration
 */
export const createDefaultRoleConfig = () => {
  return {
    preset: 'family' as const,
    adminLabel: DEFAULT_ROLE_PRESET.adminLabel,
    memberLabel: DEFAULT_ROLE_PRESET.memberLabel,
    adminPlural: DEFAULT_ROLE_PRESET.adminPlural,
    memberPlural: DEFAULT_ROLE_PRESET.memberPlural
  };
};