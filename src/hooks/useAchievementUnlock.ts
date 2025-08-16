import { useState, useCallback } from 'react';
import { HapticFeedback } from '../utils/haptics';

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const useAchievementUnlock = () => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const unlockAchievement = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement);
    setIsVisible(true);
    
    // Trigger celebration haptics
    HapticFeedback.celebration();
  }, []);

  const hideAchievement = useCallback(() => {
    setIsVisible(false);
    // Clear achievement after animation
    setTimeout(() => {
      setCurrentAchievement(null);
    }, 300);
  }, []);

  return {
    currentAchievement,
    isVisible,
    unlockAchievement,
    hideAchievement,
  };
};

// Predefined achievements for the app
export const ACHIEVEMENTS = {
  // Task-related achievements
  FIRST_TASK: {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    level: 'bronze' as const,
  },
  TASK_STREAK_3: {
    id: 'task_streak_3',
    name: 'On a Roll',
    description: 'Complete 3 tasks in a row',
    level: 'bronze' as const,
  },
  TASK_STREAK_7: {
    id: 'task_streak_7',
    name: 'Week Warrior',
    description: 'Complete 7 tasks in a row',
    level: 'silver' as const,
  },
  TASK_STREAK_30: {
    id: 'task_streak_30',
    name: 'Consistency Champion',
    description: 'Complete 30 tasks in a row',
    level: 'gold' as const,
  },
  TASK_MASTER: {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete 100 tasks total',
    level: 'platinum' as const,
  },
  
  // Category-specific achievements
  CHORE_CHAMPION: {
    id: 'chore_champion',
    name: 'Chore Champion',
    description: 'Complete 20 chores',
    level: 'silver' as const,
  },
  HOMEWORK_HERO: {
    id: 'homework_hero',
    name: 'Homework Hero',
    description: 'Complete all homework for a week',
    level: 'silver' as const,
  },
  FITNESS_FANATIC: {
    id: 'fitness_fanatic',
    name: 'Fitness Fanatic',
    description: 'Complete 15 exercise tasks',
    level: 'silver' as const,
  },
  
  // Time-based achievements
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a task before 7 AM',
    level: 'bronze' as const,
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a task after 10 PM',
    level: 'bronze' as const,
  },
  WEEKEND_WARRIOR: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete all weekend tasks',
    level: 'silver' as const,
  },
  
  // Family achievements
  TEAM_PLAYER: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Help a family member with their task',
    level: 'bronze' as const,
  },
  FAMILY_FIRST: {
    id: 'family_first',
    name: 'Family First',
    description: 'Everyone completes their tasks for a day',
    level: 'gold' as const,
  },
  
  // Special achievements
  PERFECT_WEEK: {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all tasks for an entire week',
    level: 'gold' as const,
  },
  OVERACHIEVER: {
    id: 'overachiever',
    name: 'Overachiever',
    description: 'Complete tasks 2 hours early, 5 times',
    level: 'silver' as const,
  },
  QUICK_STARTER: {
    id: 'quick_starter',
    name: 'Quick Starter',
    description: 'Start and complete a task within 5 minutes',
    level: 'bronze' as const,
  },
  PHOTO_PRO: {
    id: 'photo_pro',
    name: 'Photo Pro',
    description: 'Upload 10 task completion photos',
    level: 'bronze' as const,
  },
};