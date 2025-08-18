/**
 * Chat types for TypeB Family App
 * Safe, moderated family communication with positive interactions only
 */

import { ReactionType } from '../services/reactions';

// Message types
export type MessageType = 'text' | 'voice' | 'image' | 'system' | 'celebration';

// Message status
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Moderation status
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'removed';

// Chat message interface
export interface ChatMessage {
  id: string;
  familyId: string;
  chatId: string; // Support for multiple chat channels in the future
  
  // Sender information
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'parent' | 'child';
  
  // Message content
  type: MessageType;
  text?: string; // Text content
  voiceUrl?: string; // Voice message URL
  voiceDuration?: number; // Voice message duration in seconds
  imageUrl?: string; // Image URL
  thumbnailUrl?: string; // Image thumbnail
  
  // Status
  status: MessageStatus;
  moderationStatus: ModerationStatus;
  
  // Moderation
  flaggedBy?: string[]; // User IDs who flagged this message
  flagReason?: string;
  moderatedBy?: string; // Parent who moderated
  moderationNote?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  
  // Reactions (positive only)
  reactions?: Record<string, {
    userId: string;
    userName: string;
    reactionType: ReactionType;
    timestamp: number;
  }>;
  
  // Reply
  replyTo?: {
    messageId: string;
    senderId: string;
    senderName: string;
    preview: string; // First 50 chars of original message
  };
  
  // Read receipts
  readBy?: Record<string, {
    userId: string;
    readAt: Date;
  }>;
  
  // System message metadata
  systemMessageType?: 'member_joined' | 'member_left' | 'task_completed' | 'achievement_unlocked' | 'celebration';
  systemMessageData?: Record<string, any>;
}

// Chat room/channel interface
export interface ChatRoom {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  type: 'family' | 'parents_only' | 'direct'; // Different chat types
  
  // Participants
  participantIds: string[];
  adminIds: string[]; // Parents who can moderate
  
  // Settings
  isActive: boolean;
  allowVoiceMessages: boolean;
  allowImages: boolean;
  requireModeration: boolean; // If true, child messages need approval
  autoModerateLinks: boolean;
  autoModerateProfanity: boolean;
  
  // Last activity
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCount?: Record<string, number>; // Per user unread count
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

// Typing indicator
export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  startedAt: Date;
}

// Voice message metadata
export interface VoiceMessageMetadata {
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  format: 'mp3' | 'wav' | 'm4a';
  size: number; // in bytes
  waveform?: number[]; // Visual waveform data
}

// Message input state
export interface MessageInputState {
  text: string;
  replyTo?: ChatMessage;
  isRecording: boolean;
  recordingDuration: number;
  attachments: MessageAttachment[];
}

// Message attachment
export interface MessageAttachment {
  id: string;
  type: 'image' | 'voice';
  localUri?: string; // Local file URI before upload
  uploadProgress?: number; // 0-100
  uploadedUrl?: string; // Firebase Storage URL after upload
  metadata?: VoiceMessageMetadata | ImageMetadata;
}

// Image metadata
export interface ImageMetadata {
  width: number;
  height: number;
  size: number; // in bytes
  mimeType: string;
}

// Chat notification preferences
export interface ChatNotificationSettings {
  enabled: boolean;
  mentionsOnly: boolean;
  parentsOnly: boolean; // Only notify for parent messages
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Moderation filter settings
export interface ModerationSettings {
  enabled: boolean;
  filterProfanity: boolean;
  filterLinks: boolean;
  filterPhoneNumbers: boolean;
  filterEmails: boolean;
  blockExternalImages: boolean;
  requireParentApproval: boolean; // For child messages
  customBlockedWords: string[];
  allowedDomains: string[]; // Whitelist of allowed link domains
  maxMessageLength: number;
  maxVoiceDuration: number; // in seconds
}

// Chat analytics
export interface ChatAnalytics {
  familyId: string;
  period: 'day' | 'week' | 'month';
  totalMessages: number;
  messagesByUser: Record<string, number>;
  messagesByType: Record<MessageType, number>;
  averageResponseTime: number; // in minutes
  peakActivityHours: number[]; // Array of hours (0-23)
  positiveInteractions: number; // Messages with reactions
  flaggedMessages: number;
  voiceMessageMinutes: number;
}

// Safety report
export interface SafetyReport {
  id: string;
  familyId: string;
  reportedBy: string;
  reportedMessageId: string;
  reason: 'inappropriate' | 'bullying' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  resolvedBy?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// Mention
export interface Mention {
  userId: string;
  userName: string;
  startIndex: number; // Position in message text
  endIndex: number;
}

// Chat search
export interface ChatSearchParams {
  query: string;
  chatId?: string;
  senderId?: string;
  messageType?: MessageType;
  startDate?: Date;
  endDate?: Date;
  includeDeleted?: boolean;
  limit?: number;
}

// Chat export format
export interface ChatExport {
  familyId: string;
  familyName: string;
  exportDate: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  messages: ChatMessage[];
  participants: {
    id: string;
    name: string;
    role: 'parent' | 'child';
  }[];
  statistics: {
    totalMessages: number;
    messagesByUser: Record<string, number>;
    messagesByType: Record<MessageType, number>;
  };
}

// Quick replies (suggested responses)
export interface QuickReply {
  id: string;
  text: string;
  emoji?: string;
  category: 'greeting' | 'acknowledgment' | 'encouragement' | 'question';
}

// Default quick replies for positive communication
export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: 'Great job!', emoji: '👍', category: 'encouragement' },
  { id: '2', text: 'Thank you!', emoji: '🙏', category: 'acknowledgment' },
  { id: '3', text: 'Love you!', emoji: '❤️', category: 'greeting' },
  { id: '4', text: 'On my way!', emoji: '🏃', category: 'acknowledgment' },
  { id: '5', text: 'How was your day?', emoji: '😊', category: 'question' },
  { id: '6', text: 'Need help?', emoji: '🤝', category: 'question' },
  { id: '7', text: 'Well done!', emoji: '⭐', category: 'encouragement' },
  { id: '8', text: 'Miss you!', emoji: '🤗', category: 'greeting' },
];

// Profanity filter list (basic example - expand as needed)
export const PROFANITY_LIST: string[] = [
  // Add inappropriate words to filter
  // This is a simplified example - use a comprehensive library in production
  'badword1',
  'badword2',
  // In production, use a comprehensive profanity detection library
];

// Safe link domains
export const SAFE_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'wikipedia.org',
  'khanacademy.org',
  'scratch.mit.edu',
  'code.org',
  // Add more educational and safe domains
];