/**
 * Achievement System Types
 * Focus: Celebration and collaboration, not competition
 */

export type AchievementCategory = 'milestone' | 'streak' | 'special' | 'helper' | 'family';

export type AchievementLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'time' | 'custom';
  value: number;
  unit?: 'tasks' | 'days' | 'hours' | 'times';
  customCheck?: (userData: any) => boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  level: AchievementLevel;
  requirement: AchievementRequirement;
  hidden?: boolean; // For surprise achievements
  familyAchievement?: boolean; // Requires family participation
  encouragementMessage?: string; // Shown when unlocked
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
  celebrated: boolean;
  notified: boolean;
}

export interface FamilyAchievement {
  achievementId: string;
  familyId: string;
  contributors: string[];
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
  celebrated: boolean;
}

export interface StreakData {
  userId: string;
  streakType: 'daily' | 'weekly' | 'category' | 'time';
  current: number;
  best: number;
  startDate: Date;
  lastActiveDate: Date;
  freezesAvailable: number;
  freezesUsed: number;
  category?: string; // For category-specific streaks
}

export interface Celebration {
  id: string;
  type: 'achievement' | 'milestone' | 'streak' | 'family';
  userId?: string;
  familyId?: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  seen: boolean;
}

// Predefined achievements focused on positive reinforcement
export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // Milestone Achievements
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your very first task!',
    icon: 'flag',
    category: 'milestone',
    level: 'bronze',
    requirement: { type: 'count', value: 1, unit: 'tasks' },
    encouragementMessage: "Great start! Every journey begins with a single step.",
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: 'trending-up',
    category: 'milestone',
    level: 'bronze',
    requirement: { type: 'count', value: 10, unit: 'tasks' },
    encouragementMessage: "You're building great habits! Keep it up!",
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Complete 50 tasks',
    icon: 'award',
    category: 'milestone',
    level: 'silver',
    requirement: { type: 'count', value: 50, unit: 'tasks' },
    encouragementMessage: "Your dedication is inspiring! You're making real progress.",
  },
  {
    id: 'committed',
    name: 'Committed',
    description: 'Complete 100 tasks',
    icon: 'star',
    category: 'milestone',
    level: 'gold',
    requirement: { type: 'count', value: 100, unit: 'tasks' },
    encouragementMessage: "100 tasks completed! You're truly committed to growth.",
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Complete 500 tasks',
    icon: 'crown',
    category: 'milestone',
    level: 'platinum',
    requirement: { type: 'count', value: 500, unit: 'tasks' },
    encouragementMessage: "You're a champion! Your consistency is remarkable.",
  },
  {
    id: 'legend',
    name: 'Living Legend',
    description: 'Complete 1000 tasks',
    icon: 'zap',
    category: 'milestone',
    level: 'diamond',
    requirement: { type: 'count', value: 1000, unit: 'tasks' },
    encouragementMessage: "Legendary achievement! You're an inspiration to everyone.",
  },

  // Streak Achievements
  {
    id: 'three_day_streak',
    name: 'On a Roll',
    description: 'Complete tasks for 3 days in a row',
    icon: 'fire',
    category: 'streak',
    level: 'bronze',
    requirement: { type: 'streak', value: 3, unit: 'days' },
    encouragementMessage: "3 days strong! Consistency is key.",
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete tasks for 7 days straight',
    icon: 'calendar',
    category: 'streak',
    level: 'silver',
    requirement: { type: 'streak', value: 7, unit: 'days' },
    encouragementMessage: "A full week! You're building lasting habits.",
  },
  {
    id: 'fortnight_focus',
    name: 'Fortnight Focus',
    description: 'Complete tasks for 14 days straight',
    icon: 'target',
    category: 'streak',
    level: 'silver',
    requirement: { type: 'streak', value: 14, unit: 'days' },
    encouragementMessage: "Two weeks of consistency! You're unstoppable.",
  },
  {
    id: 'monthly_master',
    name: 'Monthly Master',
    description: 'Complete tasks for 30 days straight',
    icon: 'medal',
    category: 'streak',
    level: 'gold',
    requirement: { type: 'streak', value: 30, unit: 'days' },
    encouragementMessage: "A full month! You've mastered consistency.",
  },
  {
    id: 'quarterly_quest',
    name: 'Quarterly Quest',
    description: 'Complete tasks for 90 days straight',
    icon: 'trophy',
    category: 'streak',
    level: 'platinum',
    requirement: { type: 'streak', value: 90, unit: 'days' },
    encouragementMessage: "90 days! You've transformed habits into lifestyle.",
  },

  // Special Achievements
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a task before 7 AM',
    icon: 'sunrise',
    category: 'special',
    level: 'bronze',
    requirement: { type: 'time', value: 7, unit: 'hours' },
    encouragementMessage: "The early bird gets things done! Great morning energy.",
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a task after 10 PM',
    icon: 'moon',
    category: 'special',
    level: 'bronze',
    requirement: { type: 'time', value: 22, unit: 'hours' },
    encouragementMessage: "Burning the midnight oil! Your dedication shines.",
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete all weekend tasks',
    icon: 'coffee',
    category: 'special',
    level: 'silver',
    requirement: { type: 'custom', value: 1 },
    encouragementMessage: "Weekend conquered! Enjoy your well-earned rest.",
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 tasks within an hour',
    icon: 'flash',
    category: 'special',
    level: 'silver',
    requirement: { type: 'custom', value: 5, unit: 'tasks' },
    encouragementMessage: "Lightning fast! You're in the zone today.",
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Complete all assigned tasks in a day',
    icon: 'check-circle',
    category: 'special',
    level: 'gold',
    requirement: { type: 'custom', value: 1 },
    encouragementMessage: "Perfect execution! Today was your day.",
  },

  // Helper Achievements (Collaboration)
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Help a family member with their task',
    icon: 'users',
    category: 'helper',
    level: 'bronze',
    requirement: { type: 'count', value: 1, unit: 'times' },
    encouragementMessage: "Teamwork makes the dream work! Thanks for helping.",
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Teach someone how to complete a task',
    icon: 'book-open',
    category: 'helper',
    level: 'silver',
    requirement: { type: 'count', value: 5, unit: 'times' },
    encouragementMessage: "Sharing knowledge is true leadership. Great mentoring!",
  },
  {
    id: 'encourager',
    name: 'Encourager',
    description: 'Send 10 encouragements to family members',
    icon: 'heart',
    category: 'helper',
    level: 'silver',
    requirement: { type: 'count', value: 10, unit: 'times' },
    encouragementMessage: "Your encouragement lifts everyone up. Keep spreading joy!",
  },
  {
    id: 'super_supporter',
    name: 'Super Supporter',
    description: 'Help family members 25 times',
    icon: 'shield',
    category: 'helper',
    level: 'gold',
    requirement: { type: 'count', value: 25, unit: 'times' },
    encouragementMessage: "You're the backbone of the family team. Amazing support!",
  },

  // Family Achievements (Collective)
  {
    id: 'family_first_day',
    name: 'Family First Day',
    description: 'Everyone completes their tasks for the day',
    icon: 'home',
    category: 'family',
    level: 'silver',
    requirement: { type: 'custom', value: 1 },
    familyAchievement: true,
    encouragementMessage: "The whole family crushed it today! Celebrate together!",
  },
  {
    id: 'family_week',
    name: 'Family Week',
    description: 'Everyone completes tasks for 7 days',
    icon: 'award',
    category: 'family',
    level: 'gold',
    requirement: { type: 'streak', value: 7, unit: 'days' },
    familyAchievement: true,
    encouragementMessage: "A full week of family success! You're stronger together.",
  },
  {
    id: 'family_month',
    name: 'Family Month',
    description: 'Everyone completes tasks for 30 days',
    icon: 'trophy',
    category: 'family',
    level: 'platinum',
    requirement: { type: 'streak', value: 30, unit: 'days' },
    familyAchievement: true,
    encouragementMessage: "30 days of family excellence! This is true teamwork.",
  },
  {
    id: 'thousand_together',
    name: '1000 Tasks Together',
    description: 'Complete 1000 tasks as a family',
    icon: 'flag',
    category: 'family',
    level: 'platinum',
    requirement: { type: 'count', value: 1000, unit: 'tasks' },
    familyAchievement: true,
    encouragementMessage: "1000 tasks together! Your family bond is unbreakable.",
  },
];

// Helper functions for achievement checks
export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS_CATALOG.find(achievement => achievement.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS_CATALOG.filter(achievement => achievement.category === category);
};

export const getAchievementProgress = (
  achievement: Achievement,
  currentValue: number
): number => {
  const maxValue = achievement.requirement.value;
  return Math.min((currentValue / maxValue) * 100, 100);
};

export const isAchievementUnlocked = (
  achievement: Achievement,
  currentValue: number
): boolean => {
  return currentValue >= achievement.requirement.value;
};