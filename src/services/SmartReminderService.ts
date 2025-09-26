import { firestore } from '../config/firebase';
import notificationService from './notifications';
import { Task, UserProfile } from '../types/models';

interface ReminderPattern {
  childId: string;
  optimalTimes: string[]; // Times when child is most responsive
  completionRate: number;
  averageResponseTime: number; // Minutes after reminder
  preferredLeadTime: number; // Minutes before due
  schoolHours: {
    start: string;
    end: string;
  };
  quietHours: {
    start: string;
    end: string;
  };
}

interface ReminderStrategy {
  type: 'gentle' | 'moderate' | 'urgent' | 'escalated';
  frequency: number; // Reminders per day
  leadTimes: number[]; // Minutes before due
  messages: string[];
}

interface TaskCompletionHistory {
  taskId: string;
  completedAt: Date;
  dueDate: Date;
  remindersSent: number;
  responseTime: number; // Minutes from last reminder
}

class SmartReminderService {
  private reminderPatterns: Map<string, ReminderPattern> = new Map();
  private activeReminders: Map<string, NodeJS.Timeout> = new Map();
  private completionHistory: TaskCompletionHistory[] = [];

  /**
   * Initialize the smart reminder service for a family
   */
  async initialize(familyId: string) {
    try {
      // Load reminder patterns for all children in the family
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();
      
      const memberIds = familyDoc.data()?.memberIds || [];
      
      for (const memberId of memberIds) {
        await this.loadReminderPattern(memberId);
      }

      // Load completion history
      await this.loadCompletionHistory(familyId);
      
      // Start monitoring tasks
      this.startTaskMonitoring(familyId);
    } catch (error) {
      console.error('Failed to initialize smart reminder service:', error);
    }
  }

  /**
   * Load reminder pattern for a child
   */
  private async loadReminderPattern(childId: string): Promise<ReminderPattern> {
    try {
      const doc = await firestore()
        .collection('users')
        .doc(childId)
        .collection('reminderPatterns')
        .doc('current')
        .get();
      
      if (doc.exists) {
        const pattern = doc.data() as ReminderPattern;
        this.reminderPatterns.set(childId, pattern);
        return pattern;
      }
      
      // Create default pattern
      const defaultPattern: ReminderPattern = {
        childId,
        optimalTimes: ['07:00', '15:30', '18:00', '20:00'], // Morning, after school, dinner, evening
        completionRate: 0.5,
        averageResponseTime: 30,
        preferredLeadTime: 60,
        schoolHours: {
          start: '08:00',
          end: '15:00',
        },
        quietHours: {
          start: '21:00',
          end: '06:00',
        },
      };
      
      this.reminderPatterns.set(childId, defaultPattern);
      return defaultPattern;
    } catch (error) {
      console.error(`Failed to load reminder pattern for ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Load completion history for analysis
   */
  private async loadCompletionHistory(familyId: string) {
    try {
      const snapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('completionHistory')
        .orderBy('completedAt', 'desc')
        .limit(100)
        .get();
      
      this.completionHistory = snapshot.docs.map(doc => doc.data() as TaskCompletionHistory);
    } catch (error) {
      console.error('Failed to load completion history:', error);
    }
  }

  /**
   * Start monitoring tasks for smart reminders
   */
  private startTaskMonitoring(familyId: string) {
    // Listen for task updates
    firestore()
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .where('status', '==', 'pending')
      .where('reminderEnabled', '==', true)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const task = { id: change.doc.id, ...change.doc.data() } as Task & { id: string };
          
          if (change.type === 'added' || change.type === 'modified') {
            this.scheduleSmartReminder(task);
          } else if (change.type === 'removed') {
            this.cancelReminder(task.id);
          }
        });
      });
  }

  /**
   * Schedule smart reminders for a task
   */
  async scheduleSmartReminder(task: Task & { id: string }) {
    // Cancel existing reminders
    this.cancelReminder(task.id);
    
    // Get reminder pattern for the assigned child
    const pattern = this.reminderPatterns.get(task.assignedTo);
    if (!pattern) {
      console.warn(`No reminder pattern found for ${task.assignedTo}`);
      return;
    }
    
    // Determine reminder strategy based on task analysis
    const strategy = this.determineReminderStrategy(task, pattern);
    
    // Schedule reminders based on strategy
    const reminders = this.calculateReminderTimes(task, pattern, strategy);
    
    for (const reminderTime of reminders) {
      const delay = reminderTime.getTime() - Date.now();
      
      if (delay > 0) {
        const timeout = setTimeout(() => {
          this.sendSmartReminder(task, pattern, strategy);
        }, delay);
        
        // Store timeout for cancellation
        this.activeReminders.set(`${task.id}_${reminderTime.getTime()}`, timeout);
      }
    }
  }

  /**
   * Determine the reminder strategy based on task and pattern
   */
  private determineReminderStrategy(
    task: Task & { id: string },
    pattern: ReminderPattern
  ): ReminderStrategy {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Analyze task characteristics
    const isHighPriority = task.priority === 'high';
    const isPhotoRequired = task.requiresPhoto;
    const hasLowCompletionRate = pattern.completionRate < 0.4;
    const isOverdue = dueDate < now;
    
    // Escalated strategy for overdue tasks
    if (isOverdue) {
      return {
        type: 'escalated',
        frequency: 4,
        leadTimes: [0],
        messages: [
          `⚠️ ${task.title} is overdue! Please complete it immediately.`,
          `🚨 URGENT: ${task.title} needs to be done NOW!`,
          `❗ Final reminder: ${task.title} is significantly overdue.`,
        ],
      };
    }
    
    // Urgent strategy for high priority or last-minute tasks
    if (isHighPriority || hoursUntilDue < 2) {
      return {
        type: 'urgent',
        frequency: 3,
        leadTimes: [120, 60, 30],
        messages: [
          `⏰ Important: ${task.title} is due soon!`,
          `⚡ Don't forget: ${task.title} needs to be completed.`,
          `🔔 Last chance: ${task.title} is almost due!`,
        ],
      };
    }
    
    // Moderate strategy for tasks requiring photos or with low completion rates
    if (isPhotoRequired || hasLowCompletionRate) {
      return {
        type: 'moderate',
        frequency: 2,
        leadTimes: [180, 60],
        messages: [
          `📸 Remember: ${task.title} (photo required)`,
          `✅ Time to complete: ${task.title}`,
        ],
      };
    }
    
    // Gentle strategy for regular tasks
    return {
      type: 'gentle',
      frequency: 1,
      leadTimes: [pattern.preferredLeadTime],
      messages: [
        `💫 Friendly reminder: ${task.title}`,
      ],
    };
  }

  /**
   * Calculate optimal reminder times
   */
  private calculateReminderTimes(
    task: Task & { id: string },
    pattern: ReminderPattern,
    strategy: ReminderStrategy
  ): Date[] {
    const reminderTimes: Date[] = [];
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    // Calculate reminder times based on lead times
    for (const leadTime of strategy.leadTimes) {
      const reminderTime = new Date(dueDate.getTime() - leadTime * 60 * 1000);
      
      // Skip if in the past
      if (reminderTime <= now) continue;
      
      // Adjust for quiet hours
      const adjustedTime = this.adjustForQuietHours(reminderTime, pattern);
      
      // Optimize for best response times
      const optimizedTime = this.optimizeReminderTime(adjustedTime, pattern);
      
      reminderTimes.push(optimizedTime);
    }
    
    return reminderTimes;
  }

  /**
   * Adjust reminder time to avoid quiet hours
   */
  private adjustForQuietHours(time: Date, pattern: ReminderPattern): Date {
    const quietStart = this.parseTime(pattern.quietHours.start);
    const quietEnd = this.parseTime(pattern.quietHours.end);
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const timeMinutes = hours * 60 + minutes;
    
    // Check if in quiet hours
    if (quietStart > quietEnd) {
      // Quiet hours span midnight
      if (timeMinutes >= quietStart || timeMinutes < quietEnd) {
        // Move to end of quiet hours
        const adjusted = new Date(time);
        adjusted.setHours(Math.floor(quietEnd / 60), quietEnd % 60, 0, 0);
        return adjusted;
      }
    } else {
      // Normal quiet hours
      if (timeMinutes >= quietStart && timeMinutes < quietEnd) {
        // Move to end of quiet hours
        const adjusted = new Date(time);
        adjusted.setHours(Math.floor(quietEnd / 60), quietEnd % 60, 0, 0);
        return adjusted;
      }
    }
    
    return time;
  }

  /**
   * Optimize reminder time based on child's response patterns
   */
  private optimizeReminderTime(time: Date, pattern: ReminderPattern): Date {
    // Find the nearest optimal time
    const timeMinutes = time.getHours() * 60 + time.getMinutes();
    let bestTime = time;
    let minDifference = Infinity;
    
    for (const optimalTime of pattern.optimalTimes) {
      const optimalMinutes = this.parseTime(optimalTime);
      const difference = Math.abs(timeMinutes - optimalMinutes);
      
      if (difference < minDifference && difference < 60) {
        // Within 1 hour, use the optimal time
        minDifference = difference;
        const adjusted = new Date(time);
        adjusted.setHours(Math.floor(optimalMinutes / 60), optimalMinutes % 60, 0, 0);
        bestTime = adjusted;
      }
    }
    
    return bestTime;
  }

  /**
   * Send a smart reminder
   */
  private async sendSmartReminder(
    task: Task & { id: string },
    pattern: ReminderPattern,
    strategy: ReminderStrategy
  ) {
    try {
      // Get user profile for notification
      const userDoc = await firestore()
        .collection('users')
        .doc(task.assignedTo)
        .get();
      
      const user = userDoc.data() as UserProfile;
      
      if (!user?.pushToken) {
        console.warn(`No push token for user ${task.assignedTo}`);
        return;
      }
      
      // Select appropriate message
      const messageIndex = Math.min(
        this.getReminderssentCount(task.id),
        strategy.messages.length - 1
      );
      const message = strategy.messages[messageIndex];
      
      // Send notification
      await notificationService.sendToDevice(user.pushToken, {
        title: 'Task Reminder',
        body: message,
        data: {
          type: 'task_reminder',
          taskId: task.id,
          priority: task.priority,
          strategyType: strategy.type,
        },
      });
      
      // Track reminder sent
      await this.trackReminderSent(task.id, task.assignedTo);
      
      // Update pattern based on response (will be called when task is completed)
      this.scheduleResponseTracking(task.id, task.assignedTo);
      
    } catch (error) {
      console.error(`Failed to send smart reminder for task ${task.id}:`, error);
    }
  }

  /**
   * Track that a reminder was sent
   */
  private async trackReminderSent(taskId: string, childId: string) {
    try {
      await firestore()
        .collection('reminderTracking')
        .add({
          taskId,
          childId,
          sentAt: new Date(),
          responded: false,
        });
    } catch (error) {
      console.error('Failed to track reminder:', error);
    }
  }

  /**
   * Schedule tracking of response to reminder
   */
  private scheduleResponseTracking(taskId: string, childId: string) {
    // Check for response after 30 minutes
    setTimeout(async () => {
      try {
        const taskDoc = await firestore()
          .collection('tasks')
          .doc(taskId)
          .get();
        
        if (taskDoc.exists && taskDoc.data()?.status === 'completed') {
          // Task was completed, update pattern
          await this.updateReminderPattern(childId, true, 30);
        }
      } catch (error) {
        console.error('Failed to track response:', error);
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Update reminder pattern based on response
   */
  private async updateReminderPattern(
    childId: string,
    responded: boolean,
    responseTime: number
  ) {
    const pattern = this.reminderPatterns.get(childId);
    if (!pattern) return;
    
    // Update completion rate (rolling average)
    pattern.completionRate = pattern.completionRate * 0.9 + (responded ? 0.1 : 0);
    
    // Update average response time
    if (responded) {
      pattern.averageResponseTime = 
        pattern.averageResponseTime * 0.8 + responseTime * 0.2;
    }
    
    // Save updated pattern
    try {
      await firestore()
        .collection('users')
        .doc(childId)
        .collection('reminderPatterns')
        .doc('current')
        .set(pattern);
    } catch (error) {
      console.error('Failed to update reminder pattern:', error);
    }
  }

  /**
   * Cancel reminders for a task
   */
  private cancelReminder(taskId: string) {
    // Cancel all reminders for this task
    for (const [key, timeout] of this.activeReminders.entries()) {
      if (key.startsWith(taskId)) {
        clearTimeout(timeout);
        this.activeReminders.delete(key);
      }
    }
  }

  /**
   * Get count of reminders sent for a task
   */
  private getReminderssentCount(taskId: string): number {
    // This would query the database in a real implementation
    return 0;
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Analyze effectiveness of reminder strategies
   */
  async analyzeReminderEffectiveness(childId: string): Promise<{
    bestTimes: string[];
    averageResponseTime: number;
    completionRate: number;
    recommendations: string[];
  }> {
    const pattern = this.reminderPatterns.get(childId);
    if (!pattern) {
      throw new Error('No pattern found for child');
    }
    
    // Analyze completion history
    const childHistory = this.completionHistory.filter(h => h.taskId.includes(childId));
    
    // Find best response times
    const responseByHour = new Map<number, { count: number; totalTime: number }>();
    
    for (const history of childHistory) {
      const hour = new Date(history.completedAt).getHours();
      const current = responseByHour.get(hour) || { count: 0, totalTime: 0 };
      current.count++;
      current.totalTime += history.responseTime;
      responseByHour.set(hour, current);
    }
    
    // Sort hours by effectiveness
    const sortedHours = Array.from(responseByHour.entries())
      .sort((a, b) => {
        const avgA = a[1].totalTime / a[1].count;
        const avgB = b[1].totalTime / b[1].count;
        return avgA - avgB;
      })
      .slice(0, 4)
      .map(([hour]) => `${hour.toString().padStart(2, '0')}:00`);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (pattern.completionRate < 0.3) {
      recommendations.push('Consider increasing reminder frequency');
      recommendations.push('Try adding photo verification for accountability');
    }
    
    if (pattern.averageResponseTime > 60) {
      recommendations.push('Reminders may be too early - try closer to due time');
    }
    
    if (pattern.averageResponseTime < 15) {
      recommendations.push('Great response time! Consider reducing reminder frequency');
    }
    
    return {
      bestTimes: sortedHours.length > 0 ? sortedHours : pattern.optimalTimes,
      averageResponseTime: pattern.averageResponseTime,
      completionRate: pattern.completionRate,
      recommendations,
    };
  }

  /**
   * Clean up service
   */
  dispose() {
    // Cancel all active reminders
    for (const timeout of this.activeReminders.values()) {
      clearTimeout(timeout);
    }
    this.activeReminders.clear();
  }
}

// Export singleton instance
export const smartReminderService = new SmartReminderService();