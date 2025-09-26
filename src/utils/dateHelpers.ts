/**
 * Date and timestamp utility functions
 * Handles serialization/deserialization for Redux state
 * Ensures all dates in Redux are stored as ISO strings to avoid serialization warnings
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Date, Timestamp, or string to an ISO string for Redux storage
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns ISO string or null
 */
export const toISOString = (date: Date | Timestamp | string | null | undefined): string | null => {
  if (!date) return null;
  
  // Handle Firestore Timestamp (check if it has toDate method)
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // Handle string (assume it's already an ISO string)
  if (typeof date === 'string') {
    // Validate it's a valid date string
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  
  return null;
};

/**
 * Converts an ISO string back to a Date object
 * @param iso - ISO date string or null/undefined
 * @returns Date object or null
 */
export const fromISOString = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  
  try {
    const date = new Date(iso);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Converts a Date or ISO string to a Firestore Timestamp
 * @param date - Date object, ISO string, or null
 * @returns Firestore Timestamp or null
 */
export const toTimestamp = (date: Date | string | null | undefined): Timestamp | null => {
  if (!date) return null;
  
  try {
    // Check if Timestamp is available (not in test environment)
    if (typeof Timestamp === 'undefined') {
      return null;
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    return Timestamp.fromDate(dateObj);
  } catch {
    return null;
  }
};

/**
 * Serializes a date for Redux storage
 * Alias for toISOString for clarity in Redux contexts
 */
export const serializeDate = toISOString;

/**
 * Deserializes a date from Redux storage
 * Alias for fromISOString for clarity in Redux contexts
 */
export const deserializeDate = fromISOString;

/**
 * Checks if a value is a valid date
 * @param value - Any value to check
 * @returns true if the value can be converted to a valid date
 */
export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  
  // Check for Timestamp-like object
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return true;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
};

/**
 * Formats a date for display
 * @param date - Date, Timestamp, ISO string, or null
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or empty string
 */
export const formatDate = (
  date: Date | Timestamp | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = date;
  }
  
  if (!dateObj || !isValidDate(dateObj)) return '';
  
  return dateObj.toLocaleDateString(undefined, options);
};

/**
 * Formats a date and time for display
 * @param date - Date, Timestamp, ISO string, or null
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date/time string or empty string
 */
export const formatDateTime = (
  date: Date | Timestamp | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = date;
  }
  
  if (!dateObj || !isValidDate(dateObj)) return '';
  
  return dateObj.toLocaleString(undefined, options);
};

/**
 * Gets a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date - Date, Timestamp, ISO string, or null
 * @returns Relative time string or empty string
 */
export const getRelativeTime = (date: Date | Timestamp | string | null | undefined): string => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = date;
  }
  
  if (!dateObj || !isValidDate(dateObj)) return '';
  
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  if (Math.abs(diffMins) < 1) return 'just now';
  if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `in ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
  }
  if (Math.abs(diffDays) < 30) {
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
  }
  
  return formatDate(dateObj);
};

/**
 * Checks if a date is overdue (past current time)
 * @param date - Date, Timestamp, ISO string, or null
 * @returns true if the date is in the past
 */
export const isOverdue = (date: Date | Timestamp | string | null | undefined): boolean => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = date;
  }
  
  if (!dateObj || !isValidDate(dateObj)) return false;
  
  return dateObj.getTime() < Date.now();
};

/**
 * Gets the start of day for a given date
 * @param date - Date, Timestamp, ISO string, or null
 * @returns Date object set to start of day (00:00:00) or null
 */
export const startOfDay = (date: Date | Timestamp | string | null | undefined): Date | null => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = new Date(date);
  }
  
  if (!dateObj || !isValidDate(dateObj)) return null;
  
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Gets the end of day for a given date
 * @param date - Date, Timestamp, ISO string, or null
 * @returns Date object set to end of day (23:59:59.999) or null
 */
export const endOfDay = (date: Date | Timestamp | string | null | undefined): Date | null => {
  let dateObj: Date | null = null;
  
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = fromISOString(date);
  } else if (date instanceof Date) {
    dateObj = new Date(date);
  }
  
  if (!dateObj || !isValidDate(dateObj)) return null;
  
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};