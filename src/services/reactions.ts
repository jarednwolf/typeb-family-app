/**
 * Reactions Service
 * Bridges emoji reactions with the social integration system
 */

import { ReactionType } from './socialIntegration';
import { addReaction as addSocialReaction, removeReaction as removeSocialReaction } from './socialIntegration';
import { ReactionEmoji, TASK_REACTION_EMOJIS } from '../types/reactions';

// Map emoji reactions to social reaction types
export const EMOJI_TO_REACTION_TYPE: Record<ReactionEmoji, ReactionType> = {
  '👏': 'applause',
  '🎉': 'celebrate',
  '💪': 'support',
  '⭐': 'star',
  '🔥': 'fire',
  '❤️': 'love',
  '😊': 'like',
  '🚀': 'trophy',
};

// Reverse mapping
export const REACTION_TYPE_TO_EMOJI: Record<ReactionType, ReactionEmoji> = Object.entries(
  EMOJI_TO_REACTION_TYPE
).reduce((acc, [emoji, type]) => {
  acc[type] = emoji as ReactionEmoji;
  return acc;
}, {} as Record<ReactionType, ReactionEmoji>);

// Reaction metadata for display
export const REACTION_METADATA: Record<ReactionType, { emoji: string; label: string; color: string; category: string; animationType?: 'bounce' | 'float' | 'pulse' | 'rotate' | 'scale' }> = {
  like: { emoji: '😊', label: 'Like', color: '#3B82F6', category: 'positive', animationType: 'bounce' },
  love: { emoji: '❤️', label: 'Love', color: '#EF4444', category: 'positive', animationType: 'pulse' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: '#8B5CF6', category: 'celebration', animationType: 'rotate' },
  support: { emoji: '💪', label: 'Support', color: '#10B981', category: 'positive', animationType: 'bounce' },
  applause: { emoji: '👏', label: 'Applause', color: '#F59E0B', category: 'positive', animationType: 'bounce' },
  fire: { emoji: '🔥', label: 'Fire', color: '#F97316', category: 'positive', animationType: 'pulse' },
  star: { emoji: '⭐', label: 'Star', color: '#FCD34D', category: 'positive', animationType: 'scale' },
  trophy: { emoji: '🚀', label: 'Amazing', color: '#6366F1', category: 'positive', animationType: 'scale' },
};

export type { ReactionType };

/**
 * Add emoji reaction to a task
 */
export const addEmojiReaction = async (
  userId: string,
  userName: string,
  taskId: string,
  emoji: ReactionEmoji,
  userAvatar?: string
): Promise<void> => {
  const reactionType = EMOJI_TO_REACTION_TYPE[emoji];
  if (!reactionType) {
    throw new Error(`Invalid emoji reaction: ${emoji}`);
  }

  return addSocialReaction(
    userId,
    userName,
    taskId,
    'task',
    reactionType,
    userAvatar
  );
};

/**
 * Remove emoji reaction from a task
 */
export const removeEmojiReaction = async (
  userId: string,
  taskId: string,
  emoji: ReactionEmoji
): Promise<void> => {
  const reactionType = EMOJI_TO_REACTION_TYPE[emoji];
  if (!reactionType) {
    throw new Error(`Invalid emoji reaction: ${emoji}`);
  }

  return removeSocialReaction(userId, taskId, reactionType);
};

/**
 * Get available emoji reactions
 */
export const getAvailableEmojis = (): ReactionEmoji[] => {
  return [...TASK_REACTION_EMOJIS];
};

/**
 * Get reaction type from emoji
 */
export const getReactionTypeFromEmoji = (emoji: ReactionEmoji): ReactionType | null => {
  return EMOJI_TO_REACTION_TYPE[emoji] || null;
};

/**
 * Get emoji from reaction type
 */
export const getEmojiFromReactionType = (type: ReactionType): ReactionEmoji | null => {
  return REACTION_TYPE_TO_EMOJI[type] || null;
};

// Re-export social integration functions for compatibility
export { 
  addReaction,
  removeReaction,
  getReactions 
} from './socialIntegration';

// Parent reaction type for compatibility
export type ParentReaction = ReactionType;