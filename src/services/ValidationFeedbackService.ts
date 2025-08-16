import { firestore, storage } from '../config/firebase';
import { notificationOrchestrator } from './NotificationOrchestrator';
import { Task, User } from '../types/models';

interface RejectionReason {
  id: string;
  category: 'quality' | 'incomplete' | 'wrong_task' | 'safety' | 'other';
  message: string;
  guidance: string;
  severity: 'minor' | 'moderate' | 'major';
  examples?: string[];
}

interface ValidationFeedback {
  id: string;
  taskId: string;
  childId: string;
  parentId: string;
  photoUrl: string;
  rejectionReasons: RejectionReason[];
  customMessage?: string;
  timestamp: Date;
  resubmissionCount: number;
  resolved: boolean;
  resolvedAt?: Date;
  improvementTips: string[];
}

interface ResubmissionAttempt {
  attemptNumber: number;
  photoUrl: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: ValidationFeedback;
}

interface FeedbackPattern {
  childId: string;
  commonIssues: Map<string, number>;
  improvementRate: number;
  averageResubmissions: number;
  lastAnalyzedAt: Date;
}

class ValidationFeedbackService {
  private feedbackHistory: Map<string, ValidationFeedback[]> = new Map();
  private patterns: Map<string, FeedbackPattern> = new Map();
  
  // Pre-defined rejection reasons with guidance
  private rejectionReasons = {
    quality: {
      blurry: {
        id: 'blurry',
        category: 'quality' as const,
        message: 'Photo is too blurry',
        guidance: 'Hold your phone steady and tap to focus before taking the photo',
        severity: 'minor' as const,
        examples: ['Tap the screen to focus', 'Use good lighting', 'Clean your camera lens'],
      },
      dark: {
        id: 'dark',
        category: 'quality' as const,
        message: 'Photo is too dark',
        guidance: 'Take the photo in a well-lit area or turn on the lights',
        severity: 'minor' as const,
        examples: ['Open curtains for natural light', 'Turn on room lights', 'Avoid backlighting'],
      },
      partial: {
        id: 'partial',
        category: 'quality' as const,
        message: 'Photo only shows part of the task',
        guidance: 'Make sure to capture the entire completed task in the photo',
        severity: 'moderate' as const,
        examples: ['Step back to get everything in frame', 'Use landscape mode if needed'],
      },
    },
    incomplete: {
      notFinished: {
        id: 'not_finished',
        category: 'incomplete' as const,
        message: 'Task appears incomplete',
        guidance: 'Finish all parts of the task before taking the photo',
        severity: 'major' as const,
        examples: ['Check your task list', 'Make sure nothing is missing'],
      },
      messy: {
        id: 'messy',
        category: 'incomplete' as const,
        message: 'Task not done properly',
        guidance: 'Take your time and do the task thoroughly',
        severity: 'moderate' as const,
        examples: ['Organize items neatly', 'Clean up completely', 'Follow all task steps'],
      },
    },
    wrongTask: {
      different: {
        id: 'different_task',
        category: 'wrong_task' as const,
        message: 'This photo is for a different task',
        guidance: 'Make sure you\'re submitting the photo for the correct task',
        severity: 'major' as const,
        examples: ['Check the task title', 'Read the task description carefully'],
      },
      old: {
        id: 'old_photo',
        category: 'wrong_task' as const,
        message: 'This appears to be an old photo',
        guidance: 'Take a new photo showing the task completed today',
        severity: 'major' as const,
        examples: ['Take a fresh photo', 'Show today\'s date if possible'],
      },
    },
    safety: {
      unsafe: {
        id: 'unsafe',
        category: 'safety' as const,
        message: 'Safety concern in photo',
        guidance: 'Make sure the area is safe and follows household rules',
        severity: 'major' as const,
        examples: ['Clear walkways', 'Put away dangerous items', 'Follow safety rules'],
      },
    },
  };

  /**
   * Initialize the feedback service
   */
  async initialize(familyId: string) {
    try {
      // Load historical feedback data
      await this.loadFeedbackHistory(familyId);
      
      // Analyze patterns
      await this.analyzePatterns(familyId);
      
      // Setup real-time listeners
      this.setupListeners(familyId);
    } catch (error) {
      console.error('Failed to initialize ValidationFeedbackService:', error);
    }
  }

  /**
   * Create feedback for a rejected photo
   */
  async createFeedback(
    task: Task & { id: string },
    childId: string,
    parentId: string,
    photoUrl: string,
    rejectionReasonIds: string[],
    customMessage?: string
  ): Promise<ValidationFeedback> {
    try {
      // Gather rejection reasons
      const reasons: RejectionReason[] = [];
      for (const reasonId of rejectionReasonIds) {
        const reason = this.findRejectionReason(reasonId);
        if (reason) {
          reasons.push(reason);
        }
      }

      // Get previous submission count
      const previousAttempts = await this.getResubmissionCount(task.id, childId);

      // Generate improvement tips based on rejection reasons
      const tips = this.generateImprovementTips(reasons, previousAttempts);

      // Create feedback object
      const feedback: ValidationFeedback = {
        id: `${task.id}_${Date.now()}`,
        taskId: task.id,
        childId,
        parentId,
        photoUrl,
        rejectionReasons: reasons,
        customMessage,
        timestamp: new Date(),
        resubmissionCount: previousAttempts,
        resolved: false,
        improvementTips: tips,
      };

      // Store in Firestore
      await firestore()
        .collection('validationFeedback')
        .doc(feedback.id)
        .set({
          ...feedback,
          timestamp: feedback.timestamp.toISOString(),
        });

      // Update local cache
      const childFeedback = this.feedbackHistory.get(childId) || [];
      childFeedback.push(feedback);
      this.feedbackHistory.set(childId, childFeedback);

      // Send notification to child with guidance
      await this.notifyChildOfRejection(childId, task, feedback);

      // Update pattern analysis
      this.updatePatterns(childId, reasons);

      // Check if intervention is needed
      await this.checkForIntervention(childId, task.id, previousAttempts);

      return feedback;
    } catch (error) {
      console.error('Failed to create feedback:', error);
      throw error;
    }
  }

  /**
   * Handle photo resubmission
   */
  async handleResubmission(
    taskId: string,
    childId: string,
    newPhotoUrl: string
  ): Promise<ResubmissionAttempt> {
    try {
      // Get previous feedback
      const previousFeedback = await this.getLatestFeedback(taskId, childId);
      
      // Create resubmission attempt
      const attempt: ResubmissionAttempt = {
        attemptNumber: (previousFeedback?.resubmissionCount || 0) + 1,
        photoUrl: newPhotoUrl,
        submittedAt: new Date(),
        status: 'pending',
      };

      // Store resubmission
      await firestore()
        .collection('tasks')
        .doc(taskId)
        .collection('resubmissions')
        .add({
          ...attempt,
          submittedAt: attempt.submittedAt.toISOString(),
          childId,
        });

      // Notify parent of resubmission with context
      await this.notifyParentOfResubmission(taskId, childId, attempt, previousFeedback);

      // Provide encouragement to child
      if (attempt.attemptNumber === 2) {
        await this.sendEncouragementMessage(childId, 'Great job trying again! You\'re learning!');
      } else if (attempt.attemptNumber === 3) {
        await this.sendEncouragementMessage(childId, 'Keep it up! Practice makes perfect!');
      }

      return attempt;
    } catch (error) {
      console.error('Failed to handle resubmission:', error);
      throw error;
    }
  }

  /**
   * Analyze feedback patterns for a child
   */
  async analyzePatterns(familyId: string): Promise<void> {
    try {
      const snapshot = await firestore()
        .collection('validationFeedback')
        .where('resolved', '==', true)
        .get();

      const childPatterns = new Map<string, FeedbackPattern>();

      snapshot.forEach((doc) => {
        const feedback = doc.data() as ValidationFeedback;
        
        let pattern = childPatterns.get(feedback.childId) || {
          childId: feedback.childId,
          commonIssues: new Map<string, number>(),
          improvementRate: 0,
          averageResubmissions: 0,
          lastAnalyzedAt: new Date(),
        };

        // Track common issues
        feedback.rejectionReasons.forEach((reason) => {
          const count = pattern.commonIssues.get(reason.id) || 0;
          pattern.commonIssues.set(reason.id, count + 1);
        });

        // Update average resubmissions
        pattern.averageResubmissions = 
          (pattern.averageResubmissions + feedback.resubmissionCount) / 2;

        childPatterns.set(feedback.childId, pattern);
      });

      // Calculate improvement rates
      for (const [childId, pattern] of childPatterns) {
        const improvementRate = await this.calculateImprovementRate(childId);
        pattern.improvementRate = improvementRate;
        this.patterns.set(childId, pattern);
      }
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
    }
  }

  /**
   * Generate improvement tips based on rejection reasons
   */
  private generateImprovementTips(
    reasons: RejectionReason[],
    attemptNumber: number
  ): string[] {
    const tips: string[] = [];

    // Add specific tips for each rejection reason
    reasons.forEach((reason) => {
      tips.push(reason.guidance);
      if (reason.examples) {
        tips.push(...reason.examples.slice(0, 2)); // Add first 2 examples
      }
    });

    // Add general tips based on attempt number
    if (attemptNumber === 0) {
      tips.push('Take your time to review the task requirements');
    } else if (attemptNumber === 1) {
      tips.push('Look at the feedback carefully before trying again');
    } else if (attemptNumber >= 2) {
      tips.push('Ask for help if you\'re unsure about the task');
    }

    // Add pattern-based tips if available
    const pattern = this.patterns.get(reasons[0]?.id);
    if (pattern && pattern.commonIssues.size > 0) {
      const mostCommon = Array.from(pattern.commonIssues.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommon) {
        const commonReason = this.findRejectionReason(mostCommon[0]);
        if (commonReason && !tips.includes(commonReason.guidance)) {
          tips.push(`Tip: You often have issues with ${commonReason.message.toLowerCase()}. ${commonReason.guidance}`);
        }
      }
    }

    return tips;
  }

  /**
   * Check if intervention is needed
   */
  private async checkForIntervention(
    childId: string,
    taskId: string,
    attemptNumber: number
  ): Promise<void> {
    // Alert parent if child is struggling (3+ attempts)
    if (attemptNumber >= 3) {
      await this.alertParentOfStruggle(childId, taskId, attemptNumber);
    }

    // Suggest easier task or break if pattern shows consistent issues
    const pattern = this.patterns.get(childId);
    if (pattern && pattern.averageResubmissions > 2.5) {
      await this.suggestTaskAdjustment(childId, taskId);
    }
  }

  /**
   * Provide positive feedback when improvement is shown
   */
  async providePositiveFeedback(
    childId: string,
    taskId: string,
    improvementAreas: string[]
  ): Promise<void> {
    try {
      const messages = [
        '🌟 Great improvement! Your photo quality is much better!',
        '👏 Well done! You followed all the feedback perfectly!',
        '🎉 Excellent work! Keep up this great standard!',
        '💪 You\'re getting better at this! Nice job!',
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];
      
      await firestore()
        .collection('positiveFeedback')
        .add({
          childId,
          taskId,
          message,
          improvementAreas,
          timestamp: new Date().toISOString(),
        });

      // Send encouraging notification
      await this.sendEncouragementMessage(childId, message);

      // Update improvement metrics
      await this.updateImprovementMetrics(childId, improvementAreas);
    } catch (error) {
      console.error('Failed to provide positive feedback:', error);
    }
  }

  /**
   * Get feedback summary for parent dashboard
   */
  async getFeedbackSummary(
    familyId: string,
    days: number = 7
  ): Promise<{
    totalRejections: number;
    commonIssues: { reason: string; count: number }[];
    averageResubmissions: number;
    improvementTrend: number;
    childrenNeedingSupport: string[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await firestore()
        .collection('validationFeedback')
        .where('timestamp', '>=', startDate.toISOString())
        .get();

      let totalRejections = 0;
      const issueCount = new Map<string, number>();
      let totalResubmissions = 0;
      const childrenStruggling = new Set<string>();

      snapshot.forEach((doc) => {
        const feedback = doc.data() as ValidationFeedback;
        totalRejections++;
        totalResubmissions += feedback.resubmissionCount;

        feedback.rejectionReasons.forEach((reason) => {
          const count = issueCount.get(reason.message) || 0;
          issueCount.set(reason.message, count + 1);
        });

        if (feedback.resubmissionCount >= 3) {
          childrenStruggling.add(feedback.childId);
        }
      });

      // Sort common issues
      const commonIssues = Array.from(issueCount.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate improvement trend
      const improvementTrend = await this.calculateOverallImprovementTrend(familyId, days);

      return {
        totalRejections,
        commonIssues,
        averageResubmissions: totalRejections > 0 
          ? totalResubmissions / totalRejections 
          : 0,
        improvementTrend,
        childrenNeedingSupport: Array.from(childrenStruggling),
      };
    } catch (error) {
      console.error('Failed to get feedback summary:', error);
      return {
        totalRejections: 0,
        commonIssues: [],
        averageResubmissions: 0,
        improvementTrend: 0,
        childrenNeedingSupport: [],
      };
    }
  }

  /**
   * Generate coaching tips for parents
   */
  async generateCoachingTips(childId: string): Promise<string[]> {
    const pattern = this.patterns.get(childId);
    const tips: string[] = [];

    if (!pattern) {
      tips.push('Help your child understand task requirements clearly');
      tips.push('Review their photos together before submission');
      return tips;
    }

    // Based on common issues
    const topIssues = Array.from(pattern.commonIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topIssues.forEach(([issueId]) => {
      const reason = this.findRejectionReason(issueId);
      if (reason) {
        switch (reason.category) {
          case 'quality':
            tips.push('Help them find good lighting for photos');
            tips.push('Teach them to check photo clarity before submitting');
            break;
          case 'incomplete':
            tips.push('Review task requirements together beforehand');
            tips.push('Create a checklist for complex tasks');
            break;
          case 'wrong_task':
            tips.push('Help them organize their task list');
            tips.push('Set up reminders for specific tasks');
            break;
        }
      }
    });

    // Based on improvement rate
    if (pattern.improvementRate < 0.3) {
      tips.push('Consider breaking tasks into smaller steps');
      tips.push('Provide more hands-on guidance initially');
    } else if (pattern.improvementRate > 0.7) {
      tips.push('Great progress! Start giving more independence');
      tips.push('Praise their improvement to build confidence');
    }

    return tips;
  }

  /**
   * Helper methods
   */
  private findRejectionReason(reasonId: string): RejectionReason | null {
    for (const category of Object.values(this.rejectionReasons)) {
      for (const reason of Object.values(category)) {
        if (reason.id === reasonId) {
          return reason;
        }
      }
    }
    return null;
  }

  private async getLatestFeedback(
    taskId: string,
    childId: string
  ): Promise<ValidationFeedback | null> {
    try {
      const snapshot = await firestore()
        .collection('validationFeedback')
        .where('taskId', '==', taskId)
        .where('childId', '==', childId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as ValidationFeedback;
    } catch (error) {
      console.error('Failed to get latest feedback:', error);
      return null;
    }
  }

  private async getResubmissionCount(
    taskId: string,
    childId: string
  ): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection('tasks')
        .doc(taskId)
        .collection('resubmissions')
        .where('childId', '==', childId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Failed to get resubmission count:', error);
      return 0;
    }
  }

  private async calculateImprovementRate(childId: string): Promise<number> {
    // Calculate based on reduction in rejections over time
    // This is a simplified calculation
    const feedback = this.feedbackHistory.get(childId) || [];
    if (feedback.length < 2) return 0;

    const recent = feedback.slice(-5);
    const older = feedback.slice(-10, -5);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, f) => sum + f.resubmissionCount, 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + f.resubmissionCount, 0) / older.length;

    const improvement = Math.max(0, (olderAvg - recentAvg) / olderAvg);
    return Math.min(1, improvement);
  }

  private async calculateOverallImprovementTrend(
    familyId: string,
    days: number
  ): Promise<number> {
    // Simplified trend calculation
    // Positive means improving, negative means declining
    return 0.15; // Placeholder
  }

  private updatePatterns(childId: string, reasons: RejectionReason[]) {
    const pattern = this.patterns.get(childId) || {
      childId,
      commonIssues: new Map(),
      improvementRate: 0,
      averageResubmissions: 0,
      lastAnalyzedAt: new Date(),
    };

    reasons.forEach((reason) => {
      const count = pattern.commonIssues.get(reason.id) || 0;
      pattern.commonIssues.set(reason.id, count + 1);
    });

    pattern.lastAnalyzedAt = new Date();
    this.patterns.set(childId, pattern);
  }

  private async loadFeedbackHistory(familyId: string) {
    try {
      const snapshot = await firestore()
        .collection('validationFeedback')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      snapshot.forEach((doc) => {
        const feedback = doc.data() as ValidationFeedback;
        const childFeedback = this.feedbackHistory.get(feedback.childId) || [];
        childFeedback.push(feedback);
        this.feedbackHistory.set(feedback.childId, childFeedback);
      });
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    }
  }

  private setupListeners(familyId: string) {
    // Setup real-time listeners for feedback updates
    firestore()
      .collection('validationFeedback')
      .where('resolved', '==', false)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const feedback = change.doc.data() as ValidationFeedback;
            const childFeedback = this.feedbackHistory.get(feedback.childId) || [];
            const index = childFeedback.findIndex(f => f.id === feedback.id);
            
            if (index >= 0) {
              childFeedback[index] = feedback;
            } else {
              childFeedback.push(feedback);
            }
            
            this.feedbackHistory.set(feedback.childId, childFeedback);
          }
        });
      });
  }

  private async notifyChildOfRejection(
    childId: string,
    task: Task & { id: string },
    feedback: ValidationFeedback
  ) {
    const mainReason = feedback.rejectionReasons[0];
    const message = feedback.customMessage || 
      `Your photo for "${task.title}" needs improvement: ${mainReason.message}. ${mainReason.guidance}`;
    
    // Would integrate with NotificationOrchestrator
    console.log(`Notifying child ${childId}: ${message}`);
  }

  private async notifyParentOfResubmission(
    taskId: string,
    childId: string,
    attempt: ResubmissionAttempt,
    previousFeedback: ValidationFeedback | null
  ) {
    const message = `Child has resubmitted photo for task (attempt #${attempt.attemptNumber})`;
    // Would integrate with NotificationOrchestrator
    console.log(`Notifying parent of resubmission: ${message}`);
  }

  private async sendEncouragementMessage(childId: string, message: string) {
    // Would integrate with NotificationOrchestrator
    console.log(`Encouraging child ${childId}: ${message}`);
  }

  private async alertParentOfStruggle(
    childId: string,
    taskId: string,
    attemptNumber: number
  ) {
    const message = `Your child is having difficulty with a task (${attemptNumber} attempts). They may need your help.`;
    // Would integrate with NotificationOrchestrator
    console.log(`Alerting parent: ${message}`);
  }

  private async suggestTaskAdjustment(childId: string, taskId: string) {
    // Suggest breaking down task or providing additional guidance
    console.log(`Suggesting task adjustment for child ${childId} on task ${taskId}`);
  }

  private async updateImprovementMetrics(
    childId: string,
    improvementAreas: string[]
  ) {
    // Update metrics tracking improvement
    console.log(`Updating improvement metrics for ${childId}: ${improvementAreas.join(', ')}`);
  }
}

// Export singleton instance
export const validationFeedbackService = new ValidationFeedbackService();