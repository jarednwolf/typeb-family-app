// Reaction types for social features
export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface TaskReaction {
  taskId: string;
  reactions: Reaction[];
}

// Predefined emoji reactions for tasks
export const TASK_REACTION_EMOJIS = [
  '👏', // Clap - Great job!
  '🎉', // Party - Celebration
  '💪', // Strong - Keep going!
  '⭐', // Star - Excellent
  '🔥', // Fire - On fire!
  '❤️', // Heart - Love it
  '😊', // Smile - Happy
  '🚀', // Rocket - Amazing progress
] as const;

export type ReactionEmoji = typeof TASK_REACTION_EMOJIS[number];

// Animation variants for reactions
export const REACTION_ANIMATIONS = {
  bounce: {
    scale: [1, 1.3, 1],
    rotate: [0, -10, 10, 0],
  },
  float: {
    translateY: [0, -20, 0],
    opacity: [1, 0.8, 1],
  },
  pulse: {
    scale: [1, 1.2, 1],
  },
} as const;

// Celebration messages for reactions
export const REACTION_MESSAGES: Record<ReactionEmoji, string> = {
  '👏': 'Great job!',
  '🎉': "Let's celebrate!",
  '💪': 'Keep it up!',
  '⭐': 'Excellent work!',
  '🔥': "You're on fire!",
  '❤️': 'Love this!',
  '😊': 'So happy!',
  '🚀': 'Amazing progress!',
};