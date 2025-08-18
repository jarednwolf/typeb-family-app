/**
 * Task validation functions
 * Shared between web and mobile platforms
 */

import type { CreateTaskInput, UpdateTaskInput, TaskPriority, TaskStatus } from '@typeb/types';
import { ValidationResult } from './auth.validator';

// Validation constants
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

/**
 * Validate task title
 */
export const validateTaskTitle = (title: string): ValidationResult => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title is required' };
  }

  const trimmed = title.trim();

  if (trimmed.length < MIN_TITLE_LENGTH) {
    return { 
      isValid: false, 
      error: `Title must be at least ${MIN_TITLE_LENGTH} characters` 
    };
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { 
      isValid: false, 
      error: `Title must be less than ${MAX_TITLE_LENGTH} characters` 
    };
  }

  return { isValid: true };
};

/**
 * Validate task description
 */
export const validateTaskDescription = (description?: string): ValidationResult => {
  if (!description) {
    return { isValid: true }; // Description is optional
  }

  if (typeof description !== 'string') {
    return { isValid: false, error: 'Description must be a string' };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { 
      isValid: false, 
      error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` 
    };
  }

  return { isValid: true };
};

/**
 * Validate task priority
 */
export const validateTaskPriority = (priority: string): ValidationResult => {
  if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
    return { 
      isValid: false, 
      error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` 
    };
  }

  return { isValid: true };
};

/**
 * Validate task status
 */
export const validateTaskStatus = (status: string): ValidationResult => {
  if (!VALID_STATUSES.includes(status as TaskStatus)) {
    return { 
      isValid: false, 
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
    };
  }

  return { isValid: true };
};

/**
 * Validate due date
 */
export const validateDueDate = (dueDate?: Date | string): ValidationResult => {
  if (!dueDate) {
    return { isValid: true }; // Due date is optional
  }

  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  const dueDateOnly = new Date(date);
  dueDateOnly.setHours(0, 0, 0, 0);
  
  if (dueDateOnly < now) {
    return { isValid: false, error: 'Due date cannot be in the past' };
  }

  return { isValid: true };
};

/**
 * Validate recurrence pattern
 */
export const validateRecurrencePattern = (
  isRecurring: boolean,
  pattern?: any
): ValidationResult => {
  if (!isRecurring) {
    return { isValid: true };
  }

  if (!pattern) {
    return { isValid: false, error: 'Recurrence pattern is required for recurring tasks' };
  }

  if (!['daily', 'weekly', 'monthly'].includes(pattern.frequency)) {
    return { isValid: false, error: 'Invalid recurrence frequency' };
  }

  if (pattern.interval && (pattern.interval < 1 || pattern.interval > 30)) {
    return { isValid: false, error: 'Recurrence interval must be between 1 and 30' };
  }

  if (pattern.endDate && new Date(pattern.endDate) <= new Date()) {
    return { isValid: false, error: 'Recurrence end date must be in the future' };
  }

  if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
    if (!Array.isArray(pattern.daysOfWeek)) {
      return { isValid: false, error: 'Days of week must be an array' };
    }
    if (!pattern.daysOfWeek.every((day: number) => day >= 0 && day <= 6)) {
      return { isValid: false, error: 'Invalid day of week value' };
    }
  }

  if (pattern.frequency === 'monthly' && pattern.dayOfMonth) {
    if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      return { isValid: false, error: 'Day of month must be between 1 and 31' };
    }
  }

  return { isValid: true };
};

/**
 * Validate points value
 */
export const validatePoints = (points?: number): ValidationResult => {
  if (points === undefined) {
    return { isValid: true }; // Points are optional
  }

  if (typeof points !== 'number') {
    return { isValid: false, error: 'Points must be a number' };
  }

  if (points < 0 || points > 1000) {
    return { isValid: false, error: 'Points must be between 0 and 1000' };
  }

  if (!Number.isInteger(points)) {
    return { isValid: false, error: 'Points must be a whole number' };
  }

  return { isValid: true };
};

/**
 * Validate complete task input
 */
export const validateCreateTaskInput = (input: CreateTaskInput): ValidationResult => {
  const errors: string[] = [];

  // Validate title
  const titleResult = validateTaskTitle(input.title);
  if (!titleResult.isValid && titleResult.error) {
    errors.push(titleResult.error);
  }

  // Validate description
  const descResult = validateTaskDescription(input.description);
  if (!descResult.isValid && descResult.error) {
    errors.push(descResult.error);
  }

  // Validate priority
  const priorityResult = validateTaskPriority(input.priority);
  if (!priorityResult.isValid && priorityResult.error) {
    errors.push(priorityResult.error);
  }

  // Validate due date
  const dueDateResult = validateDueDate(input.dueDate);
  if (!dueDateResult.isValid && dueDateResult.error) {
    errors.push(dueDateResult.error);
  }

  // Validate recurrence
  const recurrenceResult = validateRecurrencePattern(
    input.isRecurring,
    input.recurrencePattern
  );
  if (!recurrenceResult.isValid && recurrenceResult.error) {
    errors.push(recurrenceResult.error);
  }

  // Validate points
  const pointsResult = validatePoints(input.points);
  if (!pointsResult.isValid && pointsResult.error) {
    errors.push(pointsResult.error);
  }

  // Additional validations
  if (!input.categoryId) {
    errors.push('Category is required');
  }

  if (!input.assignedTo) {
    errors.push('Task must be assigned to someone');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Validate update task input
 */
export const validateUpdateTaskInput = (input: UpdateTaskInput): ValidationResult => {
  const errors: string[] = [];

  // Only validate fields that are being updated
  if (input.title !== undefined) {
    const titleResult = validateTaskTitle(input.title);
    if (!titleResult.isValid && titleResult.error) {
      errors.push(titleResult.error);
    }
  }

  if (input.description !== undefined) {
    const descResult = validateTaskDescription(input.description);
    if (!descResult.isValid && descResult.error) {
      errors.push(descResult.error);
    }
  }

  if (input.priority !== undefined) {
    const priorityResult = validateTaskPriority(input.priority);
    if (!priorityResult.isValid && priorityResult.error) {
      errors.push(priorityResult.error);
    }
  }

  if (input.status !== undefined) {
    const statusResult = validateTaskStatus(input.status);
    if (!statusResult.isValid && statusResult.error) {
      errors.push(statusResult.error);
    }
  }

  if (input.dueDate !== undefined) {
    const dueDateResult = validateDueDate(input.dueDate);
    if (!dueDateResult.isValid && dueDateResult.error) {
      errors.push(dueDateResult.error);
    }
  }

  if (input.points !== undefined) {
    const pointsResult = validatePoints(input.points);
    if (!pointsResult.isValid && pointsResult.error) {
      errors.push(pointsResult.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};