/**
 * Date utility functions
 * Shared between web and mobile platforms
 */

import { format, formatDistance, isToday, isTomorrow, isYesterday, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date: Date | string, formatString: string = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
};

/**
 * Format time for display
 */
export const formatTime = (date: Date | string, formatString: string = 'h:mm a'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Get friendly date label
 */
export const getFriendlyDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return formatDate(dateObj, 'EEEE, MMM d');
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return dateObj < now;
};

/**
 * Get days until date
 */
export const getDaysUntil = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Parse time string (HH:MM) to date
 */
export const parseTimeString = (timeString: string, baseDate: Date = new Date()): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hr ${mins} min`;
};

/**
 * Get date range for filters
 */
export const getDateRange = (range: 'today' | 'week' | 'month' | 'all'): { start: Date; end: Date } | null => {
  const now = new Date();
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfDay(addDays(now, -7)),
        end: endOfDay(now),
      };
    case 'month':
      return {
        start: startOfDay(addDays(now, -30)),
        end: endOfDay(now),
      };
    case 'all':
    default:
      return null;
  }
};

/**
 * Check if date is in quiet hours
 */
export const isInQuietHours = (
  date: Date,
  quietHours?: { start: string; end: string }
): boolean => {
  if (!quietHours) return false;
  
  const hours = date.getHours();
  const startHour = parseInt(quietHours.start.split(':')[0]);
  const endHour = parseInt(quietHours.end.split(':')[0]);
  
  if (startHour < endHour) {
    // Normal case: quiet hours don't cross midnight
    return hours >= startHour && hours < endHour;
  } else {
    // Quiet hours cross midnight
    return hours >= startHour || hours < endHour;
  }
};

/**
 * Get next occurrence for recurring task
 */
export const getNextOccurrence = (
  lastDate: Date,
  pattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  }
): Date => {
  const nextDate = new Date(lastDate);
  
  switch (pattern.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (pattern.interval || 1));
      break;
      
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (pattern.interval || 1) * 7);
      break;
      
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (pattern.interval || 1));
      if (pattern.dayOfMonth) {
        nextDate.setDate(pattern.dayOfMonth);
      }
      break;
  }
  
  return nextDate;
};