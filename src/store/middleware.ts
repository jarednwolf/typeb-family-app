import { isRejectedWithValue, Middleware } from '@reduxjs/toolkit';

// Custom middleware to handle errors
export const errorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.error('API Error:', action.payload);
  }
  return next(action);
};

// Serialization check configuration for Redux Toolkit
export const serializableCheckConfig = {
  ignoredActions: [
    // Ignore date serialization warnings for task actions
    'tasks/create/pending',
    'tasks/create/fulfilled',
    'tasks/create/rejected',
    'tasks/update/pending',
    'tasks/update/fulfilled',
    'tasks/update/rejected',
  ],
  ignoredActionPaths: [
    'meta.arg.input.dueDate',
    'meta.arg.input.recurrencePattern.endDate',
    'payload.dueDate',
    'payload.createdAt',
    'payload.updatedAt',
    'payload.completedAt',
  ],
  ignoredPaths: [
    'tasks.tasks',
    'tasks.userTasks',
    'tasks.overdueTasks',
    'tasks.selectedTask',
    'auth.user',
    'auth.userProfile',
    'family.currentFamily',
    'family.members',
  ],
};