/**
 * Encouragement Messages Service
 * Provides randomized motivational messages for task completion
 */

export const getRandomEncouragement = (): string => {
  const messages = [
    "Great job!",
    "Crushing it!",
    "Way to go!",
    "Awesome work!",
    "Keep it up!",
    "You're on fire!",
    "Nicely done!",
    "Fantastic!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getStreakMessage = (days: number): string => {
  if (days === 0) return "";
  if (days === 1) return "Starting a streak!";
  if (days < 3) return `${days} day streak`;
  if (days < 7) return `${days} day streak!`;
  if (days < 14) return `${days} day streak! You're on fire`;
  if (days < 30) return `${days} day streak! Incredible`;
  return `${days} day streak! Legendary`;
};

export const getProgressMessage = (percentage: number): string => {
  if (percentage === 0) return "Ready to start your day?";
  if (percentage < 25) return "Great start!";
  if (percentage < 50) return "Keep going!";
  if (percentage < 75) return "Halfway there!";
  if (percentage < 100) return "Almost done!";
  return "Perfect day!";
};

export const getMilestoneMessage = (percentage: number): string | null => {
  switch (percentage) {
    case 25:
      return "Great start to your day!";
    case 50:
      return "Halfway there! Keep it up!";
    case 75:
      return "Almost done! Just a few more!";
    case 100:
      return "Perfect day! All tasks complete!";
    default:
      return null;
  }
};