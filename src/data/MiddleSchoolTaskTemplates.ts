export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
  ageRange: [number, number]; // [min, max] age
  requiresPhoto: boolean;
  photoInstructions?: string;
  estimatedMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points: number;
  tags: string[];
  recurrence?: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    time?: string; // HH:MM format
  };
}

export const MIDDLE_SCHOOL_TASK_TEMPLATES: TaskTemplate[] = [
  // Morning Routines
  {
    id: 'make-bed',
    title: 'Make Your Bed',
    description: 'Straighten sheets, arrange pillows neatly, and smooth out comforter',
    category: { name: 'Bedroom', color: '#9C27B0', icon: '🛏️' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Take a photo showing the entire made bed',
    estimatedMinutes: 5,
    priority: 'medium',
    points: 10,
    tags: ['morning', 'daily', 'bedroom'],
    recurrence: { type: 'daily', time: '07:00' }
  },
  {
    id: 'brush-teeth',
    title: 'Brush Teeth (Morning)',
    description: 'Brush teeth for 2 minutes, including tongue',
    category: { name: 'Hygiene', color: '#00BCD4', icon: '🦷' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean sink and toothbrush put away',
    estimatedMinutes: 3,
    priority: 'high',
    points: 10,
    tags: ['morning', 'daily', 'hygiene'],
    recurrence: { type: 'daily', time: '07:15' }
  },
  {
    id: 'pack-school-bag',
    title: 'Pack School Bag',
    description: 'Check homework, books, lunch, and supplies are packed',
    category: { name: 'School', color: '#FF5722', icon: '🎒' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show organized backpack with everything packed',
    estimatedMinutes: 10,
    priority: 'urgent',
    points: 15,
    tags: ['morning', 'school', 'organization'],
    recurrence: { type: 'weekly', daysOfWeek: [1, 2, 3, 4, 5], time: '07:30' }
  },

  // Homework & Study
  {
    id: 'homework-complete',
    title: 'Complete Homework',
    description: 'Finish all homework assignments for tomorrow',
    category: { name: 'School', color: '#FF5722', icon: '📚' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show completed homework with your name visible',
    estimatedMinutes: 60,
    priority: 'urgent',
    points: 30,
    tags: ['afternoon', 'school', 'homework'],
    recurrence: { type: 'weekly', daysOfWeek: [1, 2, 3, 4, 5], time: '16:00' }
  },
  {
    id: 'study-30min',
    title: '30 Minutes Study Time',
    description: 'Study or review class materials for 30 minutes',
    category: { name: 'School', color: '#FF5722', icon: '📖' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show study materials and notes',
    estimatedMinutes: 30,
    priority: 'high',
    points: 20,
    tags: ['afternoon', 'school', 'study'],
    recurrence: { type: 'weekly', daysOfWeek: [1, 2, 3, 4], time: '17:00' }
  },
  {
    id: 'read-20min',
    title: 'Read for 20 Minutes',
    description: 'Read a book for at least 20 minutes',
    category: { name: 'School', color: '#FF5722', icon: '📚' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show the book and page number you reached',
    estimatedMinutes: 20,
    priority: 'medium',
    points: 15,
    tags: ['evening', 'reading', 'education'],
    recurrence: { type: 'daily', time: '20:00' }
  },

  // Chores
  {
    id: 'empty-dishwasher',
    title: 'Empty Dishwasher',
    description: 'Put away all clean dishes from dishwasher',
    category: { name: 'Kitchen', color: '#4CAF50', icon: '🍽️' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show empty dishwasher and closed cabinets',
    estimatedMinutes: 10,
    priority: 'medium',
    points: 15,
    tags: ['chores', 'kitchen', 'daily'],
    recurrence: { type: 'daily', time: '18:00' }
  },
  {
    id: 'take-out-trash',
    title: 'Take Out Trash',
    description: 'Empty all trash bins and take to outside bin',
    category: { name: 'Chores', color: '#795548', icon: '🗑️' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show new trash bag in kitchen bin',
    estimatedMinutes: 10,
    priority: 'medium',
    points: 15,
    tags: ['chores', 'weekly'],
    recurrence: { type: 'weekly', daysOfWeek: [2, 5], time: '18:30' }
  },
  {
    id: 'clean-room',
    title: 'Tidy Bedroom',
    description: 'Pick up clothes, organize desk, and vacuum floor',
    category: { name: 'Bedroom', color: '#9C27B0', icon: '🧹' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean floor and organized desk',
    estimatedMinutes: 20,
    priority: 'medium',
    points: 20,
    tags: ['chores', 'bedroom', 'weekly'],
    recurrence: { type: 'weekly', daysOfWeek: [6], time: '10:00' }
  },
  {
    id: 'laundry-basket',
    title: 'Put Dirty Clothes in Hamper',
    description: 'Collect all dirty clothes and put in laundry hamper',
    category: { name: 'Bedroom', color: '#9C27B0', icon: '👕' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean floor with no clothes lying around',
    estimatedMinutes: 5,
    priority: 'low',
    points: 10,
    tags: ['chores', 'bedroom', 'daily'],
    recurrence: { type: 'daily', time: '20:30' }
  },
  {
    id: 'water-plants',
    title: 'Water Plants',
    description: 'Water all indoor and outdoor plants',
    category: { name: 'Chores', color: '#4CAF50', icon: '🌱' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show watered plants',
    estimatedMinutes: 10,
    priority: 'low',
    points: 10,
    tags: ['chores', 'weekly'],
    recurrence: { type: 'weekly', daysOfWeek: [1, 4], time: '17:00' }
  },

  // Personal Care
  {
    id: 'shower',
    title: 'Take a Shower',
    description: 'Shower with soap and shampoo, hang up towel after',
    category: { name: 'Hygiene', color: '#00BCD4', icon: '🚿' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean bathroom with towel hung up',
    estimatedMinutes: 15,
    priority: 'high',
    points: 15,
    tags: ['hygiene', 'daily', 'evening'],
    recurrence: { type: 'daily', time: '19:30' }
  },
  {
    id: 'brush-teeth-night',
    title: 'Brush Teeth (Night)',
    description: 'Brush teeth and floss before bed',
    category: { name: 'Hygiene', color: '#00BCD4', icon: '🦷' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean sink area',
    estimatedMinutes: 3,
    priority: 'high',
    points: 10,
    tags: ['hygiene', 'daily', 'evening'],
    recurrence: { type: 'daily', time: '21:00' }
  },
  {
    id: 'pack-lunch',
    title: 'Pack Tomorrow\'s Lunch',
    description: 'Prepare and pack lunch for school tomorrow',
    category: { name: 'Kitchen', color: '#4CAF50', icon: '🥪' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show packed lunch in bag',
    estimatedMinutes: 10,
    priority: 'medium',
    points: 15,
    tags: ['evening', 'school', 'preparation'],
    recurrence: { type: 'weekly', daysOfWeek: [0, 1, 2, 3, 4], time: '20:00' }
  },

  // Sports & Activities
  {
    id: 'practice-instrument',
    title: 'Practice Instrument',
    description: 'Practice musical instrument for 30 minutes',
    category: { name: 'Activities', color: '#E91E63', icon: '🎵' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show instrument and practice sheet',
    estimatedMinutes: 30,
    priority: 'medium',
    points: 20,
    tags: ['practice', 'music', 'daily'],
    recurrence: { type: 'daily', time: '16:30' }
  },
  {
    id: 'sports-gear',
    title: 'Prepare Sports Gear',
    description: 'Pack sports bag with uniform, shoes, and water bottle',
    category: { name: 'Sports', color: '#FF9800', icon: '⚽' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show packed sports bag',
    estimatedMinutes: 10,
    priority: 'medium',
    points: 10,
    tags: ['sports', 'preparation'],
    recurrence: { type: 'weekly', daysOfWeek: [1, 3], time: '20:30' }
  },
  {
    id: 'exercise-30min',
    title: '30 Minutes Exercise',
    description: 'Do 30 minutes of physical activity',
    category: { name: 'Health', color: '#FF9800', icon: '🏃' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show exercise area or activity tracker',
    estimatedMinutes: 30,
    priority: 'medium',
    points: 20,
    tags: ['health', 'exercise', 'daily'],
    recurrence: { type: 'daily', time: '17:30' }
  },

  // Organization
  {
    id: 'organize-desk',
    title: 'Organize Study Desk',
    description: 'Clear and organize desk, sharpen pencils, arrange supplies',
    category: { name: 'Organization', color: '#3F51B5', icon: '📝' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clean and organized desk',
    estimatedMinutes: 15,
    priority: 'low',
    points: 15,
    tags: ['organization', 'bedroom', 'weekly'],
    recurrence: { type: 'weekly', daysOfWeek: [0], time: '15:00' }
  },
  {
    id: 'charge-devices',
    title: 'Charge All Devices',
    description: 'Plug in tablet, phone, and laptop to charge overnight',
    category: { name: 'Technology', color: '#607D8B', icon: '🔌' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show all devices plugged in and charging',
    estimatedMinutes: 5,
    priority: 'low',
    points: 10,
    tags: ['technology', 'evening', 'daily'],
    recurrence: { type: 'daily', time: '21:00' }
  },
  {
    id: 'prep-clothes',
    title: 'Lay Out Tomorrow\'s Clothes',
    description: 'Choose and lay out clothes for tomorrow',
    category: { name: 'Organization', color: '#3F51B5', icon: '👔' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show clothes laid out for tomorrow',
    estimatedMinutes: 5,
    priority: 'low',
    points: 10,
    tags: ['organization', 'evening', 'preparation'],
    recurrence: { type: 'daily', time: '20:45' }
  },

  // Pet Care
  {
    id: 'feed-pet',
    title: 'Feed Pet',
    description: 'Give pet fresh food and water',
    category: { name: 'Pet Care', color: '#8BC34A', icon: '🐕' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show pet with fresh food and water bowls',
    estimatedMinutes: 5,
    priority: 'high',
    points: 15,
    tags: ['pets', 'daily', 'care'],
    recurrence: { type: 'daily', time: '07:30' }
  },
  {
    id: 'walk-dog',
    title: 'Walk the Dog',
    description: 'Take dog for a 20-minute walk',
    category: { name: 'Pet Care', color: '#8BC34A', icon: '🦮' },
    ageRange: [11, 14],
    requiresPhoto: true,
    photoInstructions: 'Show dog on leash outside',
    estimatedMinutes: 20,
    priority: 'high',
    points: 20,
    tags: ['pets', 'exercise', 'daily'],
    recurrence: { type: 'daily', time: '17:00' }
  },
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): TaskTemplate[] => {
  return MIDDLE_SCHOOL_TASK_TEMPLATES.filter(t => t.category.name === category);
};

// Helper function to get templates by age
export const getTemplatesForAge = (age: number): TaskTemplate[] => {
  return MIDDLE_SCHOOL_TASK_TEMPLATES.filter(t => 
    age >= t.ageRange[0] && age <= t.ageRange[1]
  );
};

// Helper function to get daily routine templates
export const getDailyRoutineTemplates = (): TaskTemplate[] => {
  return MIDDLE_SCHOOL_TASK_TEMPLATES.filter(t => 
    t.recurrence?.type === 'daily'
  );
};

// Get all unique categories
export const getCategories = (): Array<{ name: string; color: string; icon: string }> => {
  const categoryMap = new Map();
  MIDDLE_SCHOOL_TASK_TEMPLATES.forEach(t => {
    if (!categoryMap.has(t.category.name)) {
      categoryMap.set(t.category.name, t.category);
    }
  });
  return Array.from(categoryMap.values());
};