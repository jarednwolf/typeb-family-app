/**
 * Role Presets for TypeB Family App
 * 
 * Provides predefined role configurations for different family/group types.
 * Internal system always uses 'parent'/'child' roles, but display labels are customizable.
 */

export interface RolePreset {
  id: string;
  name: string;
  description: string;
  adminLabel: string;    // Display name for 'parent' role
  memberLabel: string;   // Display name for 'child' role
  adminPlural: string;   // Plural form of admin label
  memberPlural: string;  // Plural form of member label
  icon: string;          // Emoji or icon identifier
}

export const ROLE_PRESETS: Record<string, RolePreset> = {
  family: {
    id: 'family',
    name: 'Traditional Family',
    description: 'Parents and children working together',
    adminLabel: 'Parent',
    memberLabel: 'Child',
    adminPlural: 'Parents',
    memberPlural: 'Children',
    icon: '👨‍👩‍👧‍👦'
  },
  roommates: {
    id: 'roommates',
    name: 'Roommates',
    description: 'Shared living space management',
    adminLabel: 'House Manager',
    memberLabel: 'Roommate',
    adminPlural: 'House Managers',
    memberPlural: 'Roommates',
    icon: '🏠'
  },
  team: {
    id: 'team',
    name: 'Team/Group',
    description: 'Work or activity group coordination',
    adminLabel: 'Team Lead',
    memberLabel: 'Team Member',
    adminPlural: 'Team Leads',
    memberPlural: 'Team Members',
    icon: '👥'
  },
  custom: {
    id: 'custom',
    name: 'Custom Roles',
    description: 'Define your own role names',
    adminLabel: '',  // User will provide
    memberLabel: '', // User will provide
    adminPlural: '',
    memberPlural: '',
    icon: '⚙️'
  }
};

// Default preset if none specified
export const DEFAULT_ROLE_PRESET = ROLE_PRESETS.family;

// Validation constants
export const ROLE_LABEL_MIN_LENGTH = 2;
export const ROLE_LABEL_MAX_LENGTH = 20;

/**
 * Validates a custom role label
 */
export const validateRoleLabel = (label: string): { valid: boolean; error?: string } => {
  if (!label || label.trim().length === 0) {
    return { valid: false, error: 'Role label is required' };
  }
  
  const trimmed = label.trim();
  
  if (trimmed.length < ROLE_LABEL_MIN_LENGTH) {
    return { valid: false, error: `Role label must be at least ${ROLE_LABEL_MIN_LENGTH} characters` };
  }
  
  if (trimmed.length > ROLE_LABEL_MAX_LENGTH) {
    return { valid: false, error: `Role label must be less than ${ROLE_LABEL_MAX_LENGTH} characters` };
  }
  
  // Check for inappropriate characters
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Role label can only contain letters and spaces' };
  }
  
  return { valid: true };
};

/**
 * Gets preset by ID with fallback to default
 */
export const getPresetById = (presetId: string): RolePreset => {
  return ROLE_PRESETS[presetId] || DEFAULT_ROLE_PRESET;
};

/**
 * Formats role label for display (capitalizes first letter)
 */
export const formatRoleLabel = (label: string): string => {
  if (!label) return '';
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
};