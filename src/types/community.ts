/**
 * Community Types
 * 
 * Collaborative features for families
 * Focused on unity, support, and shared goals
 */

export interface Announcement {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  attachments?: AnnouncementAttachment[];
  reactions?: { [userId: string]: string }; // Positive reactions only
  readBy: string[]; // User IDs who have read
  isPinned: boolean;
  expiresAt?: Date; // Optional expiry for time-sensitive announcements
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    eventId?: string; // Link to calendar event
    goalId?: string; // Link to family goal
    taskId?: string; // Link to task
  };
}

export enum AnnouncementCategory {
  GENERAL = 'general',
  CELEBRATION = 'celebration',
  EVENT = 'event',
  ACHIEVEMENT = 'achievement',
  REMINDER = 'reminder',
  PLANNING = 'planning',
  HEALTH = 'health',
  EDUCATION = 'education'
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface AnnouncementAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
}

export interface CalendarEvent {
  id: string;
  familyId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
  category: EventCategory;
  color: string; // Hex color for display
  attendees: EventAttendee[];
  reminders: EventReminder[];
  recurrence?: RecurrenceRule;
  attachments?: EventAttachment[];
  isPrivate: boolean; // Only visible to invited attendees
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    goalId?: string; // Link to family goal
    taskIds?: string[]; // Related tasks
    announcementId?: string; // Related announcement
  };
}

export enum EventCategory {
  APPOINTMENT = 'appointment',
  BIRTHDAY = 'birthday',
  HOLIDAY = 'holiday',
  SCHOOL = 'school',
  SPORTS = 'sports',
  FAMILY_TIME = 'family_time',
  MEDICAL = 'medical',
  VACATION = 'vacation',
  MILESTONE = 'milestone',
  OTHER = 'other'
}

export enum EventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled'
}

export interface EventAttendee {
  userId: string;
  name: string;
  avatar?: string;
  status: AttendeeStatus;
  isRequired: boolean;
  responseTime?: Date;
  note?: string;
}

export enum AttendeeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe'
}

export interface EventReminder {
  id: string;
  minutes: number; // Minutes before event
  type: 'notification' | 'email';
  sentTo: string[]; // User IDs
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  occurrences?: number; // Max number of occurrences
}

export interface EventAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  uploadedBy: string;
}

export interface FamilyGoal {
  id: string;
  familyId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate?: Date;
  milestones: GoalMilestone[];
  participants: GoalParticipant[];
  progress: number; // 0-100
  status: GoalStatus;
  rewards?: GoalReward[];
  attachments?: GoalAttachment[];
  isShared: boolean; // Visible to all family members
  tags?: string[];
  celebrations?: Celebration[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum GoalCategory {
  HEALTH = 'health',
  EDUCATION = 'education',
  FINANCIAL = 'financial',
  TRAVEL = 'travel',
  HOME = 'home',
  RELATIONSHIP = 'relationship',
  HOBBY = 'hobby',
  CHARITY = 'charity',
  CAREER = 'career',
  SPIRITUAL = 'spiritual',
  OTHER = 'other'
}

export enum GoalStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completedDate?: Date;
  completedBy?: string;
  progress: number;
  isCompleted: boolean;
  order: number;
  tasks?: string[]; // Task IDs that contribute to this milestone
}

export interface GoalParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'contributor' | 'supporter';
  contribution?: string; // Description of their contribution
  joinedAt: Date;
}

export interface GoalReward {
  id: string;
  type: 'points' | 'badge' | 'privilege' | 'celebration';
  value: number | string;
  description: string;
  unlockedAt?: Date;
  unlockedBy?: string[];
}

export interface GoalAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Celebration {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  reactions?: { [userId: string]: string };
  createdAt: Date;
}

export interface PlanningSession {
  id: string;
  familyId: string;
  initiatorId: string;
  initiatorName: string;
  title: string;
  description: string;
  type: PlanningType;
  status: PlanningStatus;
  participants: PlanningParticipant[];
  items: PlanningItem[];
  decisions: PlanningDecision[];
  votingEnabled: boolean;
  votingDeadline?: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  attachments?: PlanningAttachment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PlanningType {
  VACATION = 'vacation',
  WEEKEND = 'weekend',
  MEAL = 'meal',
  BUDGET = 'budget',
  CHORES = 'chores',
  SHOPPING = 'shopping',
  EVENT = 'event',
  PROJECT = 'project',
  GENERAL = 'general'
}

export enum PlanningStatus {
  BRAINSTORMING = 'brainstorming',
  VOTING = 'voting',
  FINALIZING = 'finalizing',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface PlanningParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'organizer' | 'participant';
  hasVoted: boolean;
  joinedAt: Date;
}

export interface PlanningItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  suggestedBy: string;
  suggestedByName: string;
  votes?: { [userId: string]: number }; // 1-5 rating
  comments?: ItemComment[];
  isApproved: boolean;
  order?: number;
  metadata?: {
    cost?: number;
    duration?: number;
    location?: string;
    date?: Date;
  };
}

export interface ItemComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isPositive: boolean; // Enforce positive communication
  createdAt: Date;
}

export interface PlanningDecision {
  id: string;
  itemId: string;
  decision: 'approved' | 'rejected' | 'modified';
  reason?: string;
  decidedBy: string;
  decidedAt: Date;
  finalDetails?: string;
}

export interface PlanningAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  uploadedBy: string;
}

// Notification preferences for community features
export interface CommunityNotificationSettings {
  announcements: {
    enabled: boolean;
    categories: AnnouncementCategory[];
    priorities: AnnouncementPriority[];
  };
  calendar: {
    enabled: boolean;
    reminderTimes: number[]; // Minutes before event
    categories: EventCategory[];
  };
  goals: {
    enabled: boolean;
    milestoneUpdates: boolean;
    progressUpdates: boolean;
    celebrations: boolean;
  };
  planning: {
    enabled: boolean;
    newSessions: boolean;
    votingReminders: boolean;
    decisions: boolean;
  };
}

// Analytics for community engagement
export interface CommunityAnalytics {
  familyId: string;
  period: 'week' | 'month' | 'year';
  announcements: {
    total: number;
    byCategory: { [key in AnnouncementCategory]?: number };
    averageReadRate: number;
    mostActive: string[]; // User IDs
  };
  calendar: {
    totalEvents: number;
    byCategory: { [key in EventCategory]?: number };
    attendanceRate: number;
    upcomingCount: number;
  };
  goals: {
    active: number;
    completed: number;
    averageProgress: number;
    participationRate: number;
    byCategory: { [key in GoalCategory]?: number };
  };
  planning: {
    totalSessions: number;
    completedSessions: number;
    averageParticipation: number;
    decisionsReached: number;
  };
  engagement: {
    activeUsers: number;
    totalInteractions: number;
    collaborationScore: number; // 0-100
    supportScore: number; // 0-100 based on positive interactions
  };
}

// Helper types for permissions
export interface CommunityPermissions {
  canCreateAnnouncements: boolean;
  canPinAnnouncements: boolean;
  canCreateEvents: boolean;
  canManageAllEvents: boolean;
  canCreateGoals: boolean;
  canInitiatePlanning: boolean;
  canMakeDecisions: boolean;
  canModerateContent: boolean;
}

// Integration with existing features
export interface CommunityIntegration {
  tasks: {
    linkedGoals: string[];
    linkedEvents: string[];
  };
  chat: {
    announcementChannels: string[];
    planningThreads: string[];
  };
  rewards: {
    goalCompletionPoints: number;
    eventParticipationPoints: number;
    planningContributionPoints: number;
  };
}