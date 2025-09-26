import { firestore } from '../config/firebase';
import notificationService from './notifications';
import { smartReminderService } from './SmartReminderService';
import { Task, Family, User } from '../types/models';

interface NotificationRule {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_overdue' | 'photo_submitted' | 
        'photo_approved' | 'photo_rejected' | 'streak_milestone' | 'weekly_summary' |
        'escalation' | 'habit_formed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  conditions?: {
    minStreak?: number;
    taskPriority?: string;
    hoursOverdue?: number;
    completionRate?: number;
  };
  template: {
    title: string;
    body: string;
    sound?: string;
    badge?: number;
  };
}

interface NotificationQueue {
  id: string;
  rule: NotificationRule;
  data: any;
  scheduledFor: Date;
  sent: boolean;
  attempts: number;
}

interface UserNotificationPreferences {
  userId: string;
  enabledTypes: string[];
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  groupingWindow: number; // Minutes to group notifications
  maxPerHour: number;
  priorityOverrides: {
    [key: string]: 'always' | 'never' | 'quiet_hours_only';
  };
}

class NotificationOrchestrator {
  private notificationQueue: Map<string, NotificationQueue> = new Map();
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private recentNotifications: Map<string, Date[]> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the orchestrator for a family
   */
  async initialize(familyId: string) {
    try {
      // Load family notification rules
      await this.loadFamilyRules(familyId);
      
      // Load user preferences
      await this.loadUserPreferences(familyId);
      
      // Start processing queue
      this.startQueueProcessor();
      
      // Setup event listeners
      this.setupEventListeners(familyId);
    } catch (error) {
      console.error('Failed to initialize notification orchestrator:', error);
    }
  }

  /**
   * Load family-specific notification rules
   */
  private async loadFamilyRules(familyId: string) {
    // Default rules for all families
    const defaultRules: NotificationRule[] = [
      {
        id: 'task_created',
        type: 'task_created',
        priority: 'medium',
        recipients: ['assigned_child'],
        template: {
          title: 'New Task Assigned',
          body: '📋 {taskTitle} has been assigned to you',
        },
      },
      {
        id: 'task_completed',
        type: 'task_completed',
        priority: 'low',
        recipients: ['parents'],
        template: {
          title: 'Task Completed',
          body: '✅ {childName} completed {taskTitle}',
        },
      },
      {
        id: 'photo_submitted',
        type: 'photo_submitted',
        priority: 'medium',
        recipients: ['parents'],
        template: {
          title: 'Photo Verification Needed',
          body: '📸 {childName} submitted proof for {taskTitle}',
        },
      },
      {
        id: 'task_overdue_1h',
        type: 'task_overdue',
        priority: 'high',
        recipients: ['assigned_child', 'parents'],
        conditions: {
          hoursOverdue: 1,
        },
        template: {
          title: 'Task Overdue',
          body: '⚠️ {taskTitle} is now overdue!',
        },
      },
      {
        id: 'streak_milestone_7',
        type: 'streak_milestone',
        priority: 'medium',
        recipients: ['assigned_child', 'parents'],
        conditions: {
          minStreak: 7,
        },
        template: {
          title: 'Streak Milestone! 🔥',
          body: '🎉 {childName} has a 7-day streak!',
        },
      },
      {
        id: 'streak_milestone_21',
        type: 'streak_milestone',
        priority: 'high',
        recipients: ['assigned_child', 'parents'],
        conditions: {
          minStreak: 21,
        },
        template: {
          title: 'Habit Formed! 🌟',
          body: '🏆 {childName} completed 21 days - habit formed!',
          sound: 'celebration',
        },
      },
      {
        id: 'escalation_parent',
        type: 'escalation',
        priority: 'critical',
        recipients: ['parents'],
        conditions: {
          hoursOverdue: 24,
        },
        template: {
          title: 'Urgent: Task Needs Attention',
          body: '🚨 {taskTitle} for {childName} is significantly overdue',
          sound: 'alert',
        },
      },
    ];

    // Store rules (in production, these would be loaded from Firestore)
    // For now, we'll use the defaults
  }

  /**
   * Load user notification preferences
   */
  private async loadUserPreferences(familyId: string) {
    try {
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();
      
      const memberIds = familyDoc.data()?.memberIds || [];
      
      for (const memberId of memberIds) {
        const prefsDoc = await firestore()
          .collection('users')
          .doc(memberId)
          .collection('preferences')
          .doc('notifications')
          .get();
        
        if (prefsDoc.exists) {
          this.userPreferences.set(memberId, prefsDoc.data() as UserNotificationPreferences);
        } else {
          // Set default preferences
          const defaultPrefs: UserNotificationPreferences = {
            userId: memberId,
            enabledTypes: ['all'],
            quietHours: {
              enabled: true,
              start: '21:00',
              end: '07:00',
            },
            groupingWindow: 15, // Group notifications within 15 minutes
            maxPerHour: 10,
            priorityOverrides: {
              critical: 'always',
              high: 'always',
            },
          };
          this.userPreferences.set(memberId, defaultPrefs);
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  /**
   * Setup event listeners for various triggers
   */
  private setupEventListeners(familyId: string) {
    // Listen for task changes
    firestore()
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const task = { id: change.doc.id, ...change.doc.data() } as Task & { id: string };
          
          if (change.type === 'added') {
            this.handleTaskCreated(task, familyId);
          } else if (change.type === 'modified') {
            const oldData = change.doc.data();
            this.handleTaskUpdated(task, oldData, familyId);
          }
        });
      });

    // Listen for photo submissions
    firestore()
      .collection('families')
      .doc(familyId)
      .collection('photoSubmissions')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.handlePhotoSubmitted(change.doc.data(), familyId);
          } else if (change.type === 'modified') {
            this.handlePhotoReviewed(change.doc.data(), familyId);
          }
        });
      });
  }

  /**
   * Handle task created event
   */
  private async handleTaskCreated(task: Task & { id: string }, familyId: string) {
    // Queue notification for assigned child
    await this.queueNotification({
      id: `task_created_${task.id}`,
      rule: {
        id: 'task_created',
        type: 'task_created',
        priority: 'medium',
        recipients: [task.assignedTo],
        template: {
          title: 'New Task Assigned',
          body: `📋 ${task.title} has been assigned to you`,
        },
      },
      data: { task, familyId },
      scheduledFor: new Date(),
      sent: false,
      attempts: 0,
    });
  }

  /**
   * Handle task updated event
   */
  private async handleTaskUpdated(
    task: Task & { id: string },
    oldData: any,
    familyId: string
  ) {
    // Check if task was completed
    if (task.status === 'completed' && oldData.status !== 'completed') {
      await this.handleTaskCompleted(task, familyId);
    }
    
    // Check if task is overdue
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'pending') {
      await this.handleTaskOverdue(task, familyId);
    }
  }

  /**
   * Handle task completed
   */
  private async handleTaskCompleted(task: Task & { id: string }, familyId: string) {
    // Get child name
    const childDoc = await firestore()
      .collection('users')
      .doc(task.assignedTo)
      .get();
    
    const childName = childDoc.data()?.displayName || 'Your child';
    
    // Notify parents
    const family = await this.getFamily(familyId);
    const parents = await this.getParents(family);
    
    for (const parent of parents) {
      await this.queueNotification({
        id: `task_completed_${task.id}_${parent.id}`,
        rule: {
          id: 'task_completed',
          type: 'task_completed',
          priority: 'low',
          recipients: [parent.id],
          template: {
            title: 'Task Completed',
            body: `✅ ${childName} completed ${task.title}`,
          },
        },
        data: { task, familyId, childName },
        scheduledFor: new Date(),
        sent: false,
        attempts: 0,
      });
    }
    
    // Check for streak milestones
    await this.checkStreakMilestone(task.assignedTo, familyId);
  }

  /**
   * Handle task overdue
   */
  private async handleTaskOverdue(task: Task & { id: string }, familyId: string) {
    const hoursOverdue = Math.floor(
      (Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60)
    );
    
    // Determine notification priority based on how overdue
    let priority: 'medium' | 'high' | 'critical' = 'medium';
    if (hoursOverdue >= 24) {
      priority = 'critical';
    } else if (hoursOverdue >= 3) {
      priority = 'high';
    }
    
    // Queue escalating notifications
    await this.queueNotification({
      id: `task_overdue_${task.id}_${hoursOverdue}h`,
      rule: {
        id: `task_overdue_${priority}`,
        type: 'task_overdue',
        priority,
        recipients: priority === 'critical' ? ['parents'] : [task.assignedTo],
        template: {
          title: priority === 'critical' ? 'Urgent: Task Needs Attention' : 'Task Overdue',
          body: `⚠️ ${task.title} is ${hoursOverdue} hours overdue!`,
          sound: priority === 'critical' ? 'alert' : undefined,
        },
      },
      data: { task, familyId, hoursOverdue },
      scheduledFor: new Date(),
      sent: false,
      attempts: 0,
    });
  }

  /**
   * Handle photo submitted
   */
  private async handlePhotoSubmitted(submission: any, familyId: string) {
    // Get task and child info
    const task = await this.getTask(submission.taskId, familyId);
    const child = await this.getUser(submission.userId);
    
    // Notify parents for review
    const family = await this.getFamily(familyId);
    const parents = await this.getParents(family);
    
    for (const parent of parents) {
      await this.queueNotification({
        id: `photo_submitted_${submission.id}_${parent.id}`,
        rule: {
          id: 'photo_submitted',
          type: 'photo_submitted',
          priority: 'medium',
          recipients: [parent.id],
          template: {
            title: 'Photo Verification Needed',
            body: `📸 ${child.displayName} submitted proof for ${task.title}`,
          },
        },
        data: { submission, task, familyId },
        scheduledFor: new Date(),
        sent: false,
        attempts: 0,
      });
    }
  }

  /**
   * Handle photo reviewed
   */
  private async handlePhotoReviewed(submission: any, familyId: string) {
    if (submission.status === 'approved' || submission.status === 'rejected') {
      const task = await this.getTask(submission.taskId, familyId);
      
      await this.queueNotification({
        id: `photo_${submission.status}_${submission.id}`,
        rule: {
          id: `photo_${submission.status}`,
          type: submission.status === 'approved' ? 'photo_approved' : 'photo_rejected',
          priority: 'low',
          recipients: [submission.userId],
          template: {
            title: submission.status === 'approved' ? 'Photo Approved!' : 'Photo Rejected',
            body: submission.status === 'approved' 
              ? `✅ Your photo for ${task.title} was approved!`
              : `❌ Your photo for ${task.title} needs to be retaken. ${submission.feedback || ''}`,
          },
        },
        data: { submission, task, familyId },
        scheduledFor: new Date(),
        sent: false,
        attempts: 0,
      });
    }
  }

  /**
   * Check for streak milestones
   */
  private async checkStreakMilestone(userId: string, familyId: string) {
    // Get user's current streak
    const streakDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('streaks')
      .doc('current')
      .get();
    
    const currentStreak = streakDoc.data()?.streak || 0;
    
    // Check milestone thresholds
    const milestones = [7, 14, 21, 30];
    
    for (const milestone of milestones) {
      if (currentStreak === milestone) {
        const user = await this.getUser(userId);
        const family = await this.getFamily(familyId);
        const parents = await this.getParents(family);
        
        // Notify child and parents
        const recipients = [userId, ...parents.map(p => p.id)];
        
        for (const recipientId of recipients) {
          await this.queueNotification({
            id: `streak_milestone_${milestone}_${userId}_${recipientId}`,
            rule: {
              id: `streak_milestone_${milestone}`,
              type: 'streak_milestone',
              priority: milestone >= 21 ? 'high' : 'medium',
              recipients: [recipientId],
              template: {
                title: milestone === 21 ? 'Habit Formed! 🌟' : `Streak Milestone! 🔥`,
                body: milestone === 21 
                  ? `🏆 ${user.displayName} completed 21 days - habit formed!`
                  : `🎉 ${user.displayName} has a ${milestone}-day streak!`,
                sound: milestone >= 21 ? 'celebration' : undefined,
              },
            },
            data: { userId, milestone, familyId },
            scheduledFor: new Date(),
            sent: false,
            attempts: 0,
          });
        }
      }
    }
  }

  /**
   * Queue a notification
   */
  private async queueNotification(notification: NotificationQueue) {
    // Check if notification should be sent based on user preferences
    for (const recipientId of notification.rule.recipients) {
      const prefs = this.userPreferences.get(recipientId);
      
      if (!prefs || !this.shouldSendNotification(notification, prefs)) {
        continue;
      }
      
      // Adjust timing based on quiet hours
      const adjustedTime = this.adjustForQuietHours(notification.scheduledFor, prefs);
      
      // Check for grouping
      const groupedTime = this.checkForGrouping(adjustedTime, recipientId, notification.rule.priority);
      
      // Add to queue
      const queueId = `${notification.id}_${recipientId}`;
      this.notificationQueue.set(queueId, {
        ...notification,
        scheduledFor: groupedTime,
      });
    }
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    notification: NotificationQueue,
    prefs: UserNotificationPreferences
  ): boolean {
    // Check if type is enabled
    if (!prefs.enabledTypes.includes('all') && 
        !prefs.enabledTypes.includes(notification.rule.type)) {
      return false;
    }
    
    // Check priority overrides
    const override = prefs.priorityOverrides[notification.rule.priority];
    if (override === 'never') {
      return false;
    }
    
    // Check rate limiting
    const userNotifications = this.recentNotifications.get(prefs.userId) || [];
    const recentCount = userNotifications.filter(
      time => time > new Date(Date.now() - 60 * 60 * 1000)
    ).length;
    
    if (recentCount >= prefs.maxPerHour && notification.rule.priority !== 'critical') {
      return false;
    }
    
    return true;
  }

  /**
   * Adjust notification time for quiet hours
   */
  private adjustForQuietHours(
    scheduledTime: Date,
    prefs: UserNotificationPreferences
  ): Date {
    if (!prefs.quietHours.enabled) {
      return scheduledTime;
    }
    
    const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);
    
    const hours = scheduledTime.getHours();
    const minutes = scheduledTime.getMinutes();
    const timeMinutes = hours * 60 + minutes;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Check if in quiet hours
    let inQuietHours = false;
    if (startMinutes > endMinutes) {
      // Quiet hours span midnight
      inQuietHours = timeMinutes >= startMinutes || timeMinutes < endMinutes;
    } else {
      inQuietHours = timeMinutes >= startMinutes && timeMinutes < endMinutes;
    }
    
    if (inQuietHours) {
      // Move to end of quiet hours
      const adjusted = new Date(scheduledTime);
      adjusted.setHours(endHour, endMin, 0, 0);
      
      // If that's in the past, move to tomorrow
      if (adjusted < new Date()) {
        adjusted.setDate(adjusted.getDate() + 1);
      }
      
      return adjusted;
    }
    
    return scheduledTime;
  }

  /**
   * Check for notification grouping
   */
  private checkForGrouping(
    scheduledTime: Date,
    userId: string,
    priority: string
  ): Date {
    const prefs = this.userPreferences.get(userId);
    if (!prefs || priority === 'critical') {
      return scheduledTime;
    }
    
    // Check for recent scheduled notifications
    for (const [id, queued] of this.notificationQueue) {
      if (id.includes(userId) && !queued.sent) {
        const timeDiff = Math.abs(queued.scheduledFor.getTime() - scheduledTime.getTime());
        
        if (timeDiff < prefs.groupingWindow * 60 * 1000) {
          // Group with existing notification
          return queued.scheduledFor;
        }
      }
    }
    
    return scheduledTime;
  }

  /**
   * Start processing notification queue
   */
  private startQueueProcessor() {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Process pending notifications
   */
  private async processQueue() {
    const now = new Date();
    
    for (const [id, notification] of this.notificationQueue) {
      if (!notification.sent && notification.scheduledFor <= now) {
        try {
          await this.sendNotification(notification);
          notification.sent = true;
        } catch (error) {
          console.error(`Failed to send notification ${id}:`, error);
          notification.attempts++;
          
          if (notification.attempts >= 3) {
            // Max attempts reached, remove from queue
            this.notificationQueue.delete(id);
          }
        }
      }
    }
    
    // Clean up sent notifications
    for (const [id, notification] of this.notificationQueue) {
      if (notification.sent) {
        this.notificationQueue.delete(id);
      }
    }
  }

  /**
   * Send a notification
   */
  private async sendNotification(notification: NotificationQueue) {
    // Get recipient push token
    const recipientId = notification.rule.recipients[0]; // Assuming single recipient per queue item
    const userDoc = await firestore()
      .collection('users')
      .doc(recipientId)
      .get();
    
    const pushToken = userDoc.data()?.pushToken;
    
    if (!pushToken) {
      console.warn(`No push token for user ${recipientId}`);
      return;
    }
    
    // Send via notification service
    await notificationService.sendPushNotification(
      pushToken,
      notification.rule.template.title,
      notification.rule.template.body,
      {
        ...notification.data,
        notificationType: notification.rule.type,
        priority: notification.rule.priority,
        sound: notification.rule.template.sound,
      }
    );
    
    // Track sent notification
    const userNotifications = this.recentNotifications.get(recipientId) || [];
    userNotifications.push(new Date());
    this.recentNotifications.set(recipientId, userNotifications);
    
    // Clean up old entries
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.recentNotifications.set(
      recipientId,
      userNotifications.filter(time => time > cutoff)
    );
  }

  /**
   * Helper methods
   */
  private async getFamily(familyId: string): Promise<Family> {
    const doc = await firestore()
      .collection('families')
      .doc(familyId)
      .get();
    return doc.data() as Family;
  }

  private async getUser(userId: string): Promise<User> {
    const doc = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    return doc.data() as User;
  }

  private async getTask(taskId: string, familyId: string): Promise<Task> {
    const doc = await firestore()
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .doc(taskId)
      .get();
    return doc.data() as Task;
  }

  private async getParents(family: Family): Promise<User[]> {
    const parents: User[] = [];
    
    for (const memberId of family.memberIds || []) {
      const member = await this.getUser(memberId);
      if (member.role === 'parent') {
        parents.push(member);
      }
    }
    
    return parents;
  }

  /**
   * Generate weekly summary
   */
  async generateWeeklySummary(familyId: string) {
    // This would generate a comprehensive weekly summary
    // Implementation would analyze task completion, streaks, patterns, etc.
    console.log('Generating weekly summary for family:', familyId);
  }

  /**
   * Clean up
   */
  dispose() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Export singleton instance
export const notificationOrchestrator = new NotificationOrchestrator();