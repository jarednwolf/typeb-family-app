/**
 * Validation schemas for forms and data
 * Using Yup for schema validation
 */

import * as yup from 'yup';
import { TaskPriority, TaskStatus, Task, Family } from '../types/models';

// Family validation schemas
export const createFamilySchema = yup.object().shape({
  name: yup
    .string()
    .required('Family name is required')
    .min(2, 'Family name must be at least 2 characters')
    .max(50, 'Family name must be less than 50 characters')
    .matches(/^[a-zA-Z0-9\s'-]+$/, 'Family name contains invalid characters'),
});

export const joinFamilySchema = yup.object().shape({
  inviteCode: yup
    .string()
    .required('Invite code is required')
    .length(6, 'Invite code must be exactly 6 characters')
    .matches(/^[A-Z0-9]+$/, 'Invite code must contain only uppercase letters and numbers'),
});

// Task validation schemas
export const createTaskSchema = yup.object().shape({
  title: yup
    .string()
    .required('Task title is required')
    .min(2, 'Task title must be at least 2 characters')
    .max(100, 'Task title must be less than 100 characters'),
  
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters'),
  
  categoryId: yup
    .string()
    .required('Category is required'),
  
  assignedTo: yup
    .string()
    .required('Task must be assigned to someone'),
  
  dueDate: yup
    .date()
    .nullable()
    .min(new Date(), 'Due date cannot be in the past')
    .when('isRecurring', {
      is: true,
      then: (schema: yup.DateSchema) => schema.required('Due date is required for recurring tasks'),
    }),
  
  isRecurring: yup
    .boolean()
    .default(false),
  
  recurrencePattern: yup.object().when('isRecurring', {
    is: true,
    then: yup.object().shape({
      frequency: yup
        .string()
        .oneOf(['daily', 'weekly', 'monthly'], 'Invalid recurrence frequency')
        .required('Recurrence frequency is required'),
      interval: yup
        .number()
        .min(1, 'Interval must be at least 1')
        .max(30, 'Interval cannot exceed 30')
        .required('Recurrence interval is required'),
      daysOfWeek: yup
        .array()
        .of(yup.number().min(0).max(6))
        .when('frequency', {
          is: 'weekly',
          then: (schema: yup.ArraySchema<number[] | undefined>) => schema.min(1, 'Select at least one day of the week'),
        }),
      dayOfMonth: yup
        .number()
        .min(1)
        .max(31)
        .when('frequency', {
          is: 'monthly',
          then: (schema: yup.NumberSchema) => schema.required('Day of month is required'),
        }),
      endDate: yup
        .date()
        .nullable()
        .min(yup.ref('dueDate'), 'End date must be after the due date'),
    }),
    otherwise: yup.object().nullable(),
  }),
  
  requiresPhoto: yup
    .boolean()
    .default(false),
  
  reminderEnabled: yup
    .boolean()
    .default(false),
  
  reminderTime: yup
    .string()
    .when('reminderEnabled', {
      is: true,
      then: (schema: yup.StringSchema) => schema
        .required('Reminder time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    }),
  
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'] as TaskPriority[])
    .default('medium'),
  
  points: yup
    .number()
    .nullable()
    .min(0, 'Points cannot be negative')
    .max(1000, 'Points cannot exceed 1000'),
});

export const updateTaskSchema = yup.object().shape({
  title: yup
    .string()
    .min(2, 'Task title must be at least 2 characters')
    .max(100, 'Task title must be less than 100 characters'),
  
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters'),
  
  categoryId: yup.string(),
  
  assignedTo: yup.string(),
  
  status: yup
    .string()
    .oneOf(['pending', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]),
  
  dueDate: yup
    .date()
    .nullable(),
  
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'] as TaskPriority[]),
  
  points: yup
    .number()
    .nullable()
    .min(0, 'Points cannot be negative')
    .max(1000, 'Points cannot exceed 1000'),
});

export const validateTaskPhotoSchema = yup.object().shape({
  taskId: yup
    .string()
    .required('Task ID is required'),
  
  approved: yup
    .boolean()
    .required('Approval status is required'),
  
  notes: yup
    .string()
    .max(200, 'Notes must be less than 200 characters'),
});

// User profile validation schemas
export const updateProfileSchema = yup.object().shape({
  displayName: yup
    .string()
    .required('Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  
  phoneNumber: yup
    .string()
    .nullable()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  timezone: yup
    .string()
    .required('Timezone is required'),
  
  notificationsEnabled: yup
    .boolean()
    .default(true),
  
  reminderTime: yup
    .string()
    .nullable()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

// Helper functions for validation
export const validateData = async <T>(
  schema: yup.Schema<T>,
  data: unknown
): Promise<{ isValid: boolean; errors: Record<string, string>; data?: T }> => {
  try {
    const validatedData = await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {}, data: validatedData };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err: yup.ValidationError) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeFamilyName = (name: string): string => {
  return sanitizeString(name).replace(/[^a-zA-Z0-9\s'-]/g, '');
};

export const sanitizeInviteCode = (code: string): string => {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// Date validation helpers
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isFutureDate = (date: Date): boolean => {
  return isValidDate(date) && date > new Date();
};

export const isPastDate = (date: Date): boolean => {
  return isValidDate(date) && date < new Date();
};

// Time format helpers
export const formatTime = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '';
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const parseTime = (time: string): { hours: number; minutes: number } | null => {
  const formatted = formatTime(time);
  if (!formatted) return null;
  
  const [hours, minutes] = formatted.split(':').map(Number);
  return { hours, minutes };
};

// Task-specific validation helpers
export const canCompleteTask = (task: Partial<Task>): boolean => {
  return task.status === 'pending' || task.status === 'in_progress';
};

export const canEditTask = (task: Partial<Task>, userId: string, isParent: boolean): boolean => {
  return task.createdBy === userId || task.assignedTo === userId || isParent;
};

export const canDeleteTask = (task: Partial<Task>, userId: string, isParent: boolean): boolean => {
  return task.createdBy === userId || isParent;
};

export const canValidateTask = (task: Partial<Task>, userId: string, isParent: boolean): boolean => {
  return isParent && !!task.requiresPhoto && task.status === 'completed' && !!task.photoUrl;
};

// Family-specific validation helpers
export const canInviteMembers = (family: Partial<Family>, userId: string): boolean => {
  return family.parentIds?.includes(userId) ?? false;
};

export const canRemoveMember = (family: Partial<Family>, userId: string, targetUserId: string): boolean => {
  return (family.parentIds?.includes(userId) ?? false) && userId !== targetUserId;
};

export const canLeaveFamily = (family: Partial<Family>, userId: string): boolean => {
  // Can't leave if you're the only parent
  if (family.parentIds?.length === 1 && family.parentIds[0] === userId) {
    return family.memberIds?.length === 1; // Can only leave if you're the only member
  }
  return true;
};

export const canChangeMemberRole = (family: Partial<Family>, userId: string, targetUserId: string): boolean => {
  return (family.parentIds?.includes(userId) ?? false) && userId !== targetUserId;
};

// Error message helpers
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') return error.message;
    if ('error' in error && typeof error.error === 'string') return error.error;
  }
  return 'An unexpected error occurred';
};

export const formatValidationErrors = (errors: Record<string, string>): string => {
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 0) return '';
  if (errorMessages.length === 1) return errorMessages[0];
  return errorMessages.map((msg, index) => `${index + 1}. ${msg}`).join('\n');
};