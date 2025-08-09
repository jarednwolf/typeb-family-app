/**
 * Smart Notifications Service
 * 
 * Premium feature that provides intelligent notification scheduling
 * with escalation logic for overdue tasks
 */

import * as Notifications from 'expo-notifications';
import { Task, User, Family } from '../types/models';
import { db } from './firebase';
import { doc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import notificationService from './notifications';

interface NotificationRule {
  id: string;
  type: 'reminder' | 'overdue' | 'escalation';
  triggerTime: number; // minutes before/after due date
  recipientRole: 'assignee' | 'parent' | 'all';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Default notification rules for premium users
const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'reminder_1day',
    type: 'reminder',
    triggerTime: -1440, // 24 hours before
    recipientRole: 'assignee',
    message: 'Task "{taskTitle}" is due tomorrow',
    priority: 'medium',
  },
  {
    id: 'reminder_2hours',
    type: 'reminder',
    triggerTime: -120, // 2 hours before
    recipientRole: 'assignee',
    message: 'Task "{taskTitle}" is due in 2 hours',
    priority: 'high',
  },
  {
    id: 'overdue_immediate',
    type: 'overdue',
    triggerTime: 0, // At due time
    recipientRole: 'assignee',
    message: 'Task "{taskTitle}" is now overdue!',
    priority: 'urgent',
  },
  {
    id: 'escalation_2hours',
    type: 'escalation',
    triggerTime: 120, // 2 hours after due
    recipientRole: 'parent',
    message: '{assigneeName} has an overdue task: "{taskTitle}"',
    priority: 'high',
  },
  {
    id: 'escalation_1day',
    type: 'escalation',
    triggerTime: 1440, // 24 hours after due
    recipientRole: 'all',
    message: 'URGENT: Task "{taskTitle}" is 1 day overdue',
    priority: 'urgent',
  },
];

class SmartNotificationService {
  private rules: NotificationRule[] = DEFAULT_RULES;
  private scheduledNotifications: Map<string, string[]> = new Map(); // taskId -> notificationIds

  /**
   * Initialize smart notifications for a family
   */
  async initialize(family: Family): Promise<void> {
    if (!family.isPremium) {
      console.log('Smart notifications are a premium feature');
      return;
    }

    // Load custom rules if they exist
    await this.loadCustomRules(family.id);
  }

  /**
   * Load custom notification rules for a family
   */
  private async loadCustomRules(familyId: string): Promise<void> {
    try {
      const rulesDoc = await getDocs(
        query(
          collection(db, 'notificationRules'),
          where('familyId', '==', familyId)
        )
      );

      if (!rulesDoc.empty) {
        const customRules = rulesDoc.docs[0].data().rules as NotificationRule[];
        this.rules = [...DEFAULT_RULES, ...customRules];
      }
    } catch (error) {
      console.error('Error loading custom notification rules:', error);
    }
  }

  /**
   * Schedule smart notifications for a task
   */
  async scheduleTaskNotifications(
    task: Task,
    assignee: User,
    family: Family
  ): Promise<void> {
    if (!family.isPremium || !task.dueDate) {
      return;
    }

    // Cancel existing notifications for this task
    await this.cancelTaskNotifications(task.id);

    const notificationIds: string[] = [];
    const dueDate = new Date(task.dueDate);

    for (const rule of this.rules) {
      const triggerDate = new Date(dueDate.getTime() + rule.triggerTime * 60000);
      
      // Skip if trigger time has already passed
      if (triggerDate <= new Date()) {
        continue;
      }

      // Determine recipients based on rule
      const recipients = await this.getRecipients(rule, task, assignee, family);

      for (const recipient of recipients) {
        const message = this.formatMessage(rule.message, task, assignee);
        
        // Use Expo Notifications directly for scheduling
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: this.getNotificationTitle(rule),
            body: message,
            data: {
              taskId: task.id,
              ruleId: rule.id,
              type: rule.type,
              priority: rule.priority,
            },
            sound: true,
          },
          trigger: triggerDate, // Date object is accepted directly
        });

        notificationIds.push(notificationId);
      }
    }

    // Store scheduled notification IDs
    this.scheduledNotifications.set(task.id, notificationIds);

    // Update task with escalation level
    await this.updateTaskEscalation(task.id, 0);
  }

  /**
   * Get recipients for a notification rule
   */
  private async getRecipients(
    rule: NotificationRule,
    task: Task,
    assignee: User,
    family: Family
  ): Promise<User[]> {
    const recipients: User[] = [];

    switch (rule.recipientRole) {
      case 'assignee':
        recipients.push(assignee);
        break;
      
      case 'parent':
        // Get all parents in the family
        const parentsQuery = query(
          collection(db, 'users'),
          where('familyId', '==', family.id),
          where('role', '==', 'parent')
        );
        const parentsSnapshot = await getDocs(parentsQuery);
        parentsSnapshot.forEach(doc => {
          recipients.push(doc.data() as User);
        });
        break;
      
      case 'all':
        // Get all family members
        const membersQuery = query(
          collection(db, 'users'),
          where('familyId', '==', family.id)
        );
        const membersSnapshot = await getDocs(membersQuery);
        membersSnapshot.forEach(doc => {
          recipients.push(doc.data() as User);
        });
        break;
    }

    // Filter out users with notifications disabled
    return recipients.filter(user => user.notificationsEnabled);
  }

  /**
   * Format notification message with task details
   */
  private formatMessage(template: string, task: Task, assignee: User): string {
    return template
      .replace('{taskTitle}', task.title)
      .replace('{assigneeName}', assignee.displayName || 'User')
      .replace('{dueDate}', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A')
      .replace('{points}', task.points?.toString() || '0');
  }

  /**
   * Get notification title based on rule type
   */
  private getNotificationTitle(rule: NotificationRule): string {
    switch (rule.type) {
      case 'reminder':
        return '⏰ Task Reminder';
      case 'overdue':
        return '⚠️ Task Overdue';
      case 'escalation':
        return '🚨 Urgent: Task Escalation';
      default:
        return '📋 Task Notification';
    }
  }

  /**
   * Cancel all notifications for a task
   */
  async cancelTaskNotifications(taskId: string): Promise<void> {
    const notificationIds = this.scheduledNotifications.get(taskId);
    
    if (notificationIds) {
      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      this.scheduledNotifications.delete(taskId);
    }
  }

  /**
   * Update task escalation level
   */
  private async updateTaskEscalation(taskId: string, level: number): Promise<void> {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        escalationLevel: level,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating task escalation level:', error);
    }
  }

  /**
   * Handle overdue task escalation
   */
  async handleOverdueEscalation(task: Task, family: Family): Promise<void> {
    if (!family.isPremium || task.status === 'completed') {
      return;
    }

    const now = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    if (!dueDate || dueDate >= now) {
      return; // Not overdue
    }

    const hoursOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
    let escalationLevel = 0;

    if (hoursOverdue >= 24) {
      escalationLevel = 3; // Critical
    } else if (hoursOverdue >= 12) {
      escalationLevel = 2; // High
    } else if (hoursOverdue >= 2) {
      escalationLevel = 1; // Medium
    }

    if (escalationLevel > task.escalationLevel) {
      await this.updateTaskEscalation(task.id, escalationLevel);
      await this.sendEscalationNotification(task, escalationLevel, family);
    }
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(
    task: Task,
    level: number,
    family: Family
  ): Promise<void> {
    const titles = [
      '',
      '⚠️ Task Overdue',
      '🚨 Task Escalation',
      '🔴 CRITICAL: Task Severely Overdue',
    ];

    const messages = [
      '',
      `Task "${task.title}" is overdue and needs attention`,
      `URGENT: Task "${task.title}" has been overdue for several hours`,
      `CRITICAL: Task "${task.title}" is severely overdue. Immediate action required!`,
    ];

    // Get all parents for escalation
    const parentsQuery = query(
      collection(db, 'users'),
      where('familyId', '==', family.id),
      where('role', '==', 'parent')
    );
    const parentsSnapshot = await getDocs(parentsQuery);
    
    const parents = parentsSnapshot.docs.map(doc => doc.data() as User);
    
    for (const parent of parents) {
      if (parent.notificationsEnabled) {
        // Send immediate notification using Expo Notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: titles[level],
            body: messages[level],
            data: {
              taskId: task.id,
              escalationLevel: level.toString(),
              type: 'escalation',
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Immediate notification
        });
      }
    }
  }

  /**
   * Get smart insights for task management
   */
  async getTaskInsights(familyId: string): Promise<{
    overdueCount: number;
    upcomingCount: number;
    completionRate: number;
    averageCompletionTime: number;
    recommendations: string[];
  }> {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('familyId', '==', familyId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => doc.data() as Task);

    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.status === 'pending' && 
      t.dueDate && 
      new Date(t.dueDate) < now
    );

    const upcomingTasks = tasks.filter(t =>
      t.status === 'pending' &&
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 
      ? (completedTasks.length / tasks.length) * 100 
      : 0;

    // Calculate average completion time
    let totalCompletionTime = 0;
    let completionCount = 0;
    
    for (const task of completedTasks) {
      if (task.completedAt && task.createdAt) {
        const completionTime = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        totalCompletionTime += completionTime;
        completionCount++;
      }
    }
    
    const averageCompletionTime = completionCount > 0
      ? totalCompletionTime / completionCount / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Generate smart recommendations
    const recommendations: string[] = [];
    
    if (overdueTasks.length > 5) {
      recommendations.push('Consider redistributing overdue tasks among family members');
    }
    
    if (completionRate < 50) {
      recommendations.push('Try breaking down large tasks into smaller, manageable ones');
    }
    
    if (averageCompletionTime > 48) {
      recommendations.push('Tasks are taking long to complete. Consider setting earlier reminders');
    }

    return {
      overdueCount: overdueTasks.length,
      upcomingCount: upcomingTasks.length,
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime),
      recommendations,
    };
  }
}

export default new SmartNotificationService();