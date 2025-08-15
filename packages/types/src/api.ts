/**
 * API request and response types
 * Shared between mobile and web applications
 */

import { User, Family, Task, Notification, Subscription } from './models';

// Base API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

// Family API types
export interface CreateFamilyRequest {
  name: string;
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;
    memberLabel: string;
  };
}

export interface JoinFamilyRequest {
  inviteCode: string;
  role: 'parent' | 'child';
}

export interface FamilyResponse {
  family: Family;
  members: User[];
}

// Task API types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  categoryId: string;
  assignedTo: string;
  dueDate?: string; // ISO string
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: string; // ISO string
  };
  requiresPhoto: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CompleteTaskRequest {
  photoUrl?: string;
}

export interface ValidateTaskRequest {
  approved: boolean;
  notes?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Notification API types
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

// Subscription API types
export interface CreateSubscriptionRequest {
  productId: string;
  platform: 'ios' | 'android' | 'web';
  receiptData?: string;
  paymentMethodId?: string; // For web Stripe payments
}

export interface SubscriptionResponse {
  subscription: Subscription;
  family: Family;
}

// Analytics API types
export interface AnalyticsRequest {
  familyId: string;
  userId?: string;
  dateRange: {
    start: string; // ISO string
    end: string; // ISO string
  };
  metrics?: string[];
}

export interface AnalyticsResponse {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number; // in hours
  };
  trends: {
    daily: Array<{
      date: string;
      completed: number;
      created: number;
    }>;
  };
  topPerformers: Array<{
    userId: string;
    displayName: string;
    tasksCompleted: number;
    completionRate: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    percentage: number;
  }>;
}

// File upload types
export interface UploadResponse {
  url: string;
  publicUrl: string;
  metadata: {
    size: number;
    contentType: string;
    uploadedAt: string;
  };
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter types
export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: {
    start?: string;
    end?: string;
  };
  requiresPhoto?: boolean;
  isRecurring?: boolean;
}

// WebSocket event types for real-time updates
export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

export type WebSocketEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.deleted'
  | 'family.updated'
  | 'family.member_joined'
  | 'family.member_left'
  | 'notification.new'
  | 'subscription.updated';