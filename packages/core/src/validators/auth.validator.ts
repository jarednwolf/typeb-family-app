/**
 * Authentication validation functions
 * Shared between web and mobile platforms
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > 254) { // RFC 5321
    return { isValid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = trimmedEmail.split('@')[1];
  const suspiciousDomains = ['gmial.com', 'gmai.com', 'yahooo.com', 'hotmial.com'];
  
  if (suspiciousDomains.includes(domain)) {
    let suggestion = 'gmail.com';
    if (domain.startsWith('gm')) {
      suggestion = 'gmail.com';
    } else if (domain.startsWith('ya')) {
      suggestion = 'yahoo.com';
    } else if (domain.startsWith('hot')) {
      suggestion = 'hotmail.com';
    }
    return { isValid: false, error: `Did you mean @${suggestion}?` };
  }

  return { isValid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push('Password is too long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate display name
 */
export const validateDisplayName = (displayName: string): ValidationResult => {
  if (!displayName || typeof displayName !== 'string') {
    return { isValid: false, error: 'Display name is required' };
  }

  const trimmed = displayName.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Display name must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmation: string
): ValidationResult => {
  if (!confirmation) {
    return { isValid: false, error: 'Password confirmation is required' };
  }

  if (password !== confirmation) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Sanitize email for safe use
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Check if email is likely valid without regex
 * Useful for real-time validation
 */
export const isEmailLikelyValid = (email: string): boolean => {
  if (!email) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  const domainParts = domain.split('.');
  return domainParts.length >= 2 && domainParts.every(part => part.length > 0);
};