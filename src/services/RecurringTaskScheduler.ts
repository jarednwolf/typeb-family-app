import { firestore } from '../config/firebase';
import { Task } from '../types/models';
import { TaskTemplate, MIDDLE_SCHOOL_TASK_TEMPLATES } from '../data/MiddleSchoolTaskTemplates';

interface ScheduledTask {
  templateId: string;
  familyId: string;
  assignedTo: string;
  nextRunDate: Date;
  recurrence: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    time: string;
  };
  isActive: boolean;
}

class RecurringTaskScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the scheduler and load scheduled tasks
   */
  async initialize(familyId: string) {
    try {
      // Load scheduled tasks from Firestore
      const snapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('scheduledTasks')
        .where('isActive', '==', true)
        .get();

      snapshot.forEach(doc => {
        const data = doc.data() as ScheduledTask;
        this.scheduledTasks.set(doc.id, data);
      });

      // Start the scheduler
      this.startScheduler();
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
    }
  }

  /**
   * Add a recurring task based on a template
   */
  async addRecurringTask(
    familyId: string,
    templateId: string,
    assignedTo: string,
    customRecurrence?: {
      type: 'daily' | 'weekly' | 'custom';
      daysOfWeek?: number[];
      time: string;
    }
  ): Promise<string> {
    const template = MIDDLE_SCHOOL_TASK_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const recurrence = customRecurrence || template.recurrence;
    if (!recurrence) {
      throw new Error('No recurrence pattern specified');
    }

    const scheduledTask: ScheduledTask = {
      templateId,
      familyId,
      assignedTo,
      nextRunDate: this.calculateNextRunDate(recurrence),
      recurrence,
      isActive: true,
    };

    // Save to Firestore
    const docRef = await firestore()
      .collection('families')
      .doc(familyId)
      .collection('scheduledTasks')
      .add(scheduledTask);

    // Add to local map
    this.scheduledTasks.set(docRef.id, scheduledTask);

    return docRef.id;
  }

  /**
   * Create tasks from templates that are due
   */
  private async createScheduledTasks() {
    const now = new Date();
    
    for (const [id, scheduledTask] of this.scheduledTasks) {
      if (scheduledTask.isActive && scheduledTask.nextRunDate <= now) {
        try {
          await this.createTaskFromTemplate(scheduledTask);
          
          // Update next run date
          scheduledTask.nextRunDate = this.calculateNextRunDate(scheduledTask.recurrence);
          
          // Update in Firestore
          await firestore()
            .collection('families')
            .doc(scheduledTask.familyId)
            .collection('scheduledTasks')
            .doc(id)
            .update({
              nextRunDate: scheduledTask.nextRunDate,
            });
        } catch (error) {
          console.error(`Failed to create scheduled task ${id}:`, error);
        }
      }
    }
  }

  /**
   * Create a task from a template
   */
  private async createTaskFromTemplate(scheduledTask: ScheduledTask) {
    const template = MIDDLE_SCHOOL_TASK_TEMPLATES.find(t => t.id === scheduledTask.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Calculate due date (today at the specified time)
    const dueDate = new Date();
    if (scheduledTask.recurrence.time) {
      const [hours, minutes] = scheduledTask.recurrence.time.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    }

    const task: Partial<Task> = {
      familyId: scheduledTask.familyId,
      title: template.title,
      description: template.description,
      category: template.category,
      assignedTo: scheduledTask.assignedTo,
      assignedBy: 'system', // Indicate this was auto-created
      createdBy: 'system',
      status: 'pending',
      requiresPhoto: template.requiresPhoto,
      dueDate: dueDate.toISOString(),
      isRecurring: true,
      reminderEnabled: true,
      reminderTime: scheduledTask.recurrence.time,
      priority: template.priority,
      points: template.points,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      escalationLevel: 0,
      metadata: {
        templateId: template.id,
        scheduledTaskId: scheduledTask.templateId,
        estimatedMinutes: template.estimatedMinutes,
        photoInstructions: template.photoInstructions,
        tags: template.tags,
      }
    };

    // Create the task in Firestore
    await firestore()
      .collection('families')
      .doc(scheduledTask.familyId)
      .collection('tasks')
      .add(task);

    // Send notification
    await this.sendTaskCreatedNotification(scheduledTask.assignedTo, template.title);
  }

  /**
   * Calculate the next run date based on recurrence pattern
   */
  private calculateNextRunDate(recurrence: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    time: string;
  }): Date {
    const now = new Date();
    const [hours, minutes] = recurrence.time.split(':').map(Number);
    
    if (recurrence.type === 'daily') {
      // Next occurrence is tomorrow at the specified time
      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(hours, minutes, 0, 0);
      return nextDate;
    } else if (recurrence.type === 'weekly' && recurrence.daysOfWeek) {
      // Find the next day of week that matches
      const currentDay = now.getDay();
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If today is a target day and we haven't passed the time yet, use today
      if (recurrence.daysOfWeek.includes(currentDay) && targetTime > now) {
        return targetTime;
      }
      
      // Find the next matching day
      for (let i = 1; i <= 7; i++) {
        const nextDay = (currentDay + i) % 7;
        if (recurrence.daysOfWeek.includes(nextDay)) {
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + i);
          nextDate.setHours(hours, minutes, 0, 0);
          return nextDate;
        }
      }
    }
    
    // Default to tomorrow if no pattern matches
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(hours, minutes, 0, 0);
    return nextDate;
  }

  /**
   * Send notification when a task is created
   */
  private async sendTaskCreatedNotification(userId: string, taskTitle: string) {
    // This would integrate with your notification service
    console.log(`Notification sent to ${userId}: New task "${taskTitle}" has been assigned`);
  }

  /**
   * Start the scheduler to check for due tasks
   */
  private startScheduler() {
    // Check every minute for tasks that need to be created
    this.checkInterval = setInterval(() => {
      this.createScheduledTasks();
    }, 60000); // 1 minute

    // Run immediately on start
    this.createScheduledTasks();
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Pause a scheduled task
   */
  async pauseScheduledTask(familyId: string, scheduledTaskId: string) {
    const task = this.scheduledTasks.get(scheduledTaskId);
    if (task) {
      task.isActive = false;
      
      await firestore()
        .collection('families')
        .doc(familyId)
        .collection('scheduledTasks')
        .doc(scheduledTaskId)
        .update({ isActive: false });
    }
  }

  /**
   * Resume a scheduled task
   */
  async resumeScheduledTask(familyId: string, scheduledTaskId: string) {
    const task = this.scheduledTasks.get(scheduledTaskId);
    if (task) {
      task.isActive = true;
      task.nextRunDate = this.calculateNextRunDate(task.recurrence);
      
      await firestore()
        .collection('families')
        .doc(familyId)
        .collection('scheduledTasks')
        .doc(scheduledTaskId)
        .update({ 
          isActive: true,
          nextRunDate: task.nextRunDate
        });
    }
  }

  /**
   * Delete a scheduled task
   */
  async deleteScheduledTask(familyId: string, scheduledTaskId: string) {
    this.scheduledTasks.delete(scheduledTaskId);
    
    await firestore()
      .collection('families')
      .doc(familyId)
      .collection('scheduledTasks')
      .doc(scheduledTaskId)
      .delete();
  }

  /**
   * Get all scheduled tasks for a family
   */
  async getScheduledTasks(familyId: string): Promise<Array<ScheduledTask & { id: string; templateData?: TaskTemplate }>> {
    const tasks: Array<ScheduledTask & { id: string; templateData?: TaskTemplate }> = [];
    
    this.scheduledTasks.forEach((task, id) => {
      if (task.familyId === familyId) {
        const template = MIDDLE_SCHOOL_TASK_TEMPLATES.find(t => t.id === task.templateId);
        tasks.push({
          ...task,
          id,
          templateData: template
        });
      }
    });
    
    return tasks;
  }

  /**
   * Bulk schedule daily routines for a child
   */
  async scheduleDailyRoutines(familyId: string, childId: string, childAge: number) {
    const templates = MIDDLE_SCHOOL_TASK_TEMPLATES.filter(t => 
      t.recurrence?.type === 'daily' &&
      childAge >= t.ageRange[0] && 
      childAge <= t.ageRange[1]
    );

    const scheduledIds: string[] = [];
    
    for (const template of templates) {
      if (template.recurrence) {
        try {
          const id = await this.addRecurringTask(
            familyId,
            template.id,
            childId,
            template.recurrence
          );
          scheduledIds.push(id);
        } catch (error) {
          console.error(`Failed to schedule ${template.id}:`, error);
        }
      }
    }
    
    return scheduledIds;
  }

  /**
   * Get upcoming tasks for the next N days
   */
  getUpcomingTasks(days: number = 7): Array<{
    scheduledTask: ScheduledTask;
    template: TaskTemplate;
    dueDate: Date;
  }> {
    const upcoming: Array<{
      scheduledTask: ScheduledTask;
      template: TaskTemplate;
      dueDate: Date;
    }> = [];
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    this.scheduledTasks.forEach(task => {
      if (task.isActive && task.nextRunDate <= endDate) {
        const template = MIDDLE_SCHOOL_TASK_TEMPLATES.find(t => t.id === task.templateId);
        if (template) {
          upcoming.push({
            scheduledTask: task,
            template,
            dueDate: task.nextRunDate
          });
        }
      }
    });
    
    return upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}

// Export singleton instance
export const recurringTaskScheduler = new RecurringTaskScheduler();