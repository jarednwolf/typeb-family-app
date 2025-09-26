// Mock reactions service used by ReactionDisplay/Picker

export type ReactionType = 'like' | 'love' | 'celebrate' | 'support' | 'applause' | 'fire' | 'star' | 'trophy';

export const REACTION_METADATA: Record<ReactionType, { emoji: string; label: string; color: string; category: string; animationType?: string }> = {
  like: { emoji: '😊', label: 'Like', color: '#3B82F6', category: 'positive', animationType: 'bounce' },
  love: { emoji: '❤️', label: 'Love', color: '#EF4444', category: 'positive', animationType: 'pulse' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: '#8B5CF6', category: 'celebration', animationType: 'rotate' },
  support: { emoji: '💪', label: 'Support', color: '#10B981', category: 'positive', animationType: 'bounce' },
  applause: { emoji: '👏', label: 'Applause', color: '#F59E0B', category: 'positive', animationType: 'bounce' },
  fire: { emoji: '🔥', label: 'Fire', color: '#F97316', category: 'positive', animationType: 'pulse' },
  star: { emoji: '⭐', label: 'Star', color: '#FCD34D', category: 'positive', animationType: 'scale' },
  trophy: { emoji: '🚀', label: 'Amazing', color: '#6366F1', category: 'positive', animationType: 'scale' },
};

export const addReaction = jest.fn(async () => {});
export const removeReaction = jest.fn(async () => {});
export const getReactions = jest.fn(async () => ({}));

export default {
  REACTION_METADATA,
  addReaction,
  removeReaction,
  getReactions,
};


