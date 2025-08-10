/**
 * Core data models for TypeB Family App
 * Following zero-tech-debt policy with complete type safety
 */

// User model - extends Firebase Auth user
export interface User {
  id: string;
  email: string;
  displayName: string;
  familyId?: string;
  role: 'parent' | 'child';
  createdAt: Date;
  updatedAt: Date;
  // Premium features
  isPremium: boolean;
  subscriptionEndDate?: Date;
  // Profile
  avatarUrl?: string;
  phoneNumber?: string;
  // Settings
  notificationsEnabled: boolean;
  reminderTime?: string; // HH:MM format
  timezone: string;
}

// Family model
export interface Family {
  id: string;
  name: string;
  inviteCode: string; // 6-character unique code
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  // Members
  memberIds: string[];
  parentIds: string[]; // Users with parent role
  childIds: string[]; // Users with child role
  // Settings
  maxMembers: number; // 1 for free, 10 for premium
  isPremium: boolean;
  // Task settings
  taskCategories: TaskCategory[];
  defaultTaskAssignee?: string; // User ID
  // Role customization
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;    // Display name for parent role
    memberLabel: string;   // Display name for child role
    adminPlural?: string;  // Plural form of admin label
    memberPlural?: string; // Plural form of member label
  };
}

// Task category
export interface TaskCategory {
  id: string;
  name: string;
  color: string; // Hex color
  icon?: string; // Icon name
  order: number;
}

// Task model
export interface Task {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  // Assignment
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  createdBy: string; // User ID
  // Status
  status: TaskStatus;
  completedAt?: Date;
  completedBy?: string; // User ID
  // Validation
  requiresPhoto: boolean;
  photoUrl?: string;
  photoValidatedBy?: string; // Parent user ID
  validationStatus?: 'pending' | 'approved' | 'rejected';
  validationNotes?: string;
  // Scheduling
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  // Reminders
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
  lastReminderSent?: Date;
  escalationLevel: number; // 0 = no escalation, 1 = first reminder, 2 = manager notified
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  // Priority
  priority: TaskPriority;
  // Points/rewards (for gamification)
  points?: number;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: Date;
}

// Notification model
export interface Notification {
  id: string;
  userId: string;
  familyId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_reminder'
  | 'task_escalation'
  | 'family_invite'
  | 'family_member_joined'
  | 'validation_required'
  | 'validation_result';

// Activity log for audit trail
export interface ActivityLog {
  id: string;
  familyId: string;
  userId: string;
  action: ActivityAction;
  entityType: 'task' | 'family' | 'user';
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'completed'
  | 'assigned'
  | 'validated'
  | 'joined'
  | 'left';

// Subscription model for premium features
export interface Subscription {
  id: string;
  familyId: string;
  userId: string; // Purchaser
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  productId: string;
  purchaseDate: Date;
  expiryDate: Date;
  autoRenew: boolean;
  platform: 'ios' | 'android';
  receiptData?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invite model for family invitations
export interface FamilyInvite {
  id: string;
  familyId: string;
  inviteCode: string;
  invitedBy: string; // User ID
  invitedEmail?: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string; // User ID
}

// Default task categories
export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
  { id: '1', name: 'Chores', color: '#10B981', icon: 'home', order: 1 },
  { id: '2', name: 'Homework', color: '#3B82F6', icon: 'book-open', order: 2 },
  { id: '3', name: 'Exercise', color: '#F59E0B', icon: 'heart', order: 3 },
  { id: '4', name: 'Personal', color: '#8B5CF6', icon: 'user', order: 4 },
  { id: '5', name: 'Other', color: '#6B7280', icon: 'grid', order: 5 },
];

// Validation schemas for forms
export interface CreateFamilyInput {
  name: string;
}

export interface JoinFamilyInput {
  inviteCode: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  categoryId: string;
  assignedTo: string;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  requiresPhoto: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  priority: TaskPriority;
  points?: number;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  validationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface ValidateTaskInput {
  taskId: string;
  approved: boolean;
  notes?: string;
}