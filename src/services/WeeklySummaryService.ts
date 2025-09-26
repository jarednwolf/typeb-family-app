import { firestore } from '../config/firebase';
import { notificationOrchestrator } from './NotificationOrchestrator';
import { validationFeedbackService } from './ValidationFeedbackService';
import { taskEscalationService } from './TaskEscalationService';
import { Task, User, Family } from '../types/models';

interface ChildWeeklySummary {
  childId: string;
  childName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  
  // Task Metrics
  totalTasksAssigned: number;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksLate: number;
  tasksMissed: number;
  completionRate: number;
  onTimeRate: number;
  averageCompletionTime: number; // in minutes
  
  // Habit Formation (21-day tracking)
  currentStreaks: {
    taskId: string;
    taskTitle: string;
    streakDays: number;
    isAt21Days: boolean;
  }[];
  habitsFormed: number; // Tasks with 21+ day streaks
  habitsInProgress: number; // Tasks with 7-20 day streaks
  habitsStarting: number; // Tasks with 1-6 day streaks
  
  // Photo Verification
  photosSubmitted: number;
  photosApproved: number;
  photosRejected: number;
  photoQualityScore: number; // 0-100
  averageResubmissions: number;
  
  // Behavioral Insights
  mostProductiveTime: string; // e.g., "Morning (7-9 AM)"
  consistentTasks: string[]; // Tasks completed reliably
  strugglingTasks: string[]; // Tasks frequently missed or late
  
  // Week-over-Week Comparison
  completionRateChange: number; // Percentage change from last week
  onTimeRateChange: number;
  photoQualityChange: number;
  improvementAreas: string[];
  declineAreas: string[];
  
  // Escalations
  totalEscalations: number;
  escalationReasons: string[];
  
  // Rewards & Recognition
  pointsEarned: number;
  achievementsUnlocked: string[];
  suggestedRewards: string[];
}

interface FamilyWeeklySummary {
  familyId: string;
  familyName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  generatedAt: Date;
  
  // Overall Family Metrics
  familyAccountabilityScore: number; // 0-100
  totalTasksCompleted: number;
  overallCompletionRate: number;
  overallOnTimeRate: number;
  
  // Individual Child Summaries
  childSummaries: ChildWeeklySummary[];
  
  // Family Trends
  topPerformer: {
    childName: string;
    reason: string;
  };
  mostImprovedChild: {
    childName: string;
    improvementRate: number;
  };
  
  // Areas of Focus
  familyStrengths: string[];
  familyImprovementAreas: string[];
  
  // Parent Action Items
  actionItems: {
    priority: 'high' | 'medium' | 'low';
    childName: string;
    action: string;
    reason: string;
  }[];
  
  // Weekly Highlights
  highlights: {
    type: 'achievement' | 'milestone' | 'concern';
    message: string;
    childName?: string;
  }[];
  
  // Recommendations
  taskRecommendations: {
    childName: string;
    suggestion: string;
    reason: string;
  }[];
  
  systemRecommendations: string[]; // e.g., "Consider adjusting reminder times"
}

class WeeklySummaryService {
  private summaryCache: Map<string, FamilyWeeklySummary> = new Map();
  private generationSchedule: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize weekly summary generation for a family
   */
  async initialize(familyId: string) {
    try {
      // Schedule weekly generation (Sunday night at 8 PM)
      this.scheduleWeeklyGeneration(familyId);
      
      // Generate immediate summary if needed
      const lastSummary = await this.getLastSummary(familyId);
      if (!lastSummary || this.isOlderThanWeek(lastSummary.generatedAt)) {
        await this.generateWeeklySummary(familyId);
      }
    } catch (error) {
      console.error('Failed to initialize WeeklySummaryService:', error);
    }
  }

  /**
   * Generate comprehensive weekly summary
   */
  async generateWeeklySummary(familyId: string): Promise<FamilyWeeklySummary> {
    try {
      const weekEndDate = new Date();
      const weekStartDate = new Date(weekEndDate);
      weekStartDate.setDate(weekStartDate.getDate() - 7);

      // Get family information
      const family = await this.getFamily(familyId);
      const children = await this.getChildren(family);

      // Generate individual child summaries
      const childSummaries: ChildWeeklySummary[] = [];
      
      for (const child of children) {
        const summary = await this.generateChildSummary(
          child,
          weekStartDate,
          weekEndDate,
          familyId
        );
        childSummaries.push(summary);
      }

      // Calculate family-wide metrics
      const familyMetrics = this.calculateFamilyMetrics(childSummaries);

      // Identify trends and patterns
      const trends = await this.analyzeFamilyTrends(childSummaries, familyId);

      // Generate action items for parents
      const actionItems = this.generateActionItems(childSummaries);

      // Create highlights
      const highlights = this.generateHighlights(childSummaries, trends);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        childSummaries,
        trends,
        familyId
      );

      // Create complete summary
      const summary: FamilyWeeklySummary = {
        familyId,
        familyName: family.name,
        weekStartDate,
        weekEndDate,
        generatedAt: new Date(),
        familyAccountabilityScore: familyMetrics.accountabilityScore,
        totalTasksCompleted: familyMetrics.totalCompleted,
        overallCompletionRate: familyMetrics.completionRate,
        overallOnTimeRate: familyMetrics.onTimeRate,
        childSummaries,
        topPerformer: trends.topPerformer,
        mostImprovedChild: trends.mostImproved,
        familyStrengths: trends.strengths,
        familyImprovementAreas: trends.improvementAreas,
        actionItems,
        highlights,
        taskRecommendations: recommendations.taskRecommendations,
        systemRecommendations: recommendations.systemRecommendations,
      };

      // Store summary
      await this.storeSummary(summary);

      // Send to parents
      await this.sendSummaryToParents(summary, family);

      // Cache for quick access
      this.summaryCache.set(familyId, summary);

      return summary;
    } catch (error) {
      console.error('Failed to generate weekly summary:', error);
      throw error;
    }
  }

  /**
   * Generate summary for individual child
   */
  private async generateChildSummary(
    child: User,
    weekStartDate: Date,
    weekEndDate: Date,
    familyId: string
  ): Promise<ChildWeeklySummary> {
    // Get tasks for the week
    const tasks = await this.getChildTasksForWeek(
      child.id,
      weekStartDate,
      weekEndDate,
      familyId
    );

    // Calculate basic metrics
    const taskMetrics = this.calculateTaskMetrics(tasks);

    // Get habit/streak information
    const habitData = await this.getHabitData(child.id, tasks);

    // Get photo verification data
    const photoData = await this.getPhotoVerificationData(
      child.id,
      weekStartDate,
      weekEndDate
    );

    // Analyze behavioral patterns
    const behavioralInsights = await this.analyzeBehavior(child.id, tasks);

    // Compare with previous week
    const weekComparison = await this.compareWithPreviousWeek(
      child.id,
      taskMetrics,
      photoData
    );

    // Get escalation data
    const escalationData = await this.getEscalationData(
      child.id,
      weekStartDate,
      weekEndDate,
      familyId
    );

    // Calculate rewards
    const rewardData = await this.calculateRewards(child.id, taskMetrics, habitData);

    return {
      childId: child.id,
      childName: child.displayName || 'Child',
      weekStartDate,
      weekEndDate,
      
      // Task Metrics
      totalTasksAssigned: taskMetrics.total,
      tasksCompleted: taskMetrics.completed,
      tasksOnTime: taskMetrics.onTime,
      tasksLate: taskMetrics.late,
      tasksMissed: taskMetrics.missed,
      completionRate: taskMetrics.completionRate,
      onTimeRate: taskMetrics.onTimeRate,
      averageCompletionTime: taskMetrics.avgCompletionTime,
      
      // Habits
      currentStreaks: habitData.currentStreaks,
      habitsFormed: habitData.formed,
      habitsInProgress: habitData.inProgress,
      habitsStarting: habitData.starting,
      
      // Photos
      photosSubmitted: photoData.submitted,
      photosApproved: photoData.approved,
      photosRejected: photoData.rejected,
      photoQualityScore: photoData.qualityScore,
      averageResubmissions: photoData.avgResubmissions,
      
      // Behavioral
      mostProductiveTime: behavioralInsights.productiveTime,
      consistentTasks: behavioralInsights.consistentTasks,
      strugglingTasks: behavioralInsights.strugglingTasks,
      
      // Comparison
      completionRateChange: weekComparison.completionChange,
      onTimeRateChange: weekComparison.onTimeChange,
      photoQualityChange: weekComparison.qualityChange,
      improvementAreas: weekComparison.improvements,
      declineAreas: weekComparison.declines,
      
      // Escalations
      totalEscalations: escalationData.total,
      escalationReasons: escalationData.reasons,
      
      // Rewards
      pointsEarned: rewardData.points,
      achievementsUnlocked: rewardData.achievements,
      suggestedRewards: rewardData.suggestions,
    };
  }

  /**
   * Calculate task metrics
   */
  private calculateTaskMetrics(tasks: any[]): any {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const onTime = tasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      t.dueDate &&
      new Date(t.completedAt) <= new Date(t.dueDate)
    ).length;
    const late = completed - onTime;
    const missed = tasks.filter(t => 
      t.status !== 'completed' && 
      t.dueDate &&
      new Date(t.dueDate) < new Date()
    ).length;

    // Calculate average completion time
    const completionTimes: number[] = [];
    tasks.forEach(task => {
      if (task.completedAt && task.createdAt) {
        const time = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        completionTimes.push(time / (1000 * 60)); // Convert to minutes
      }
    });
    
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    return {
      total,
      completed,
      onTime,
      late,
      missed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      onTimeRate: completed > 0 ? (onTime / completed) * 100 : 0,
      avgCompletionTime,
    };
  }

  /**
   * Get habit formation data
   */
  private async getHabitData(childId: string, tasks: any[]): Promise<any> {
    const streaks: any[] = [];
    const taskGroups = new Map<string, any[]>();

    // Group tasks by title to track streaks
    tasks.forEach(task => {
      const key = task.title;
      if (!taskGroups.has(key)) {
        taskGroups.set(key, []);
      }
      taskGroups.get(key)!.push(task);
    });

    // Calculate streaks for each task type
    for (const [title, taskList] of taskGroups) {
      const streak = await this.calculateStreak(taskList);
      if (streak > 0) {
        streaks.push({
          taskId: taskList[0].id,
          taskTitle: title,
          streakDays: streak,
          isAt21Days: streak >= 21,
        });
      }
    }

    return {
      currentStreaks: streaks,
      formed: streaks.filter(s => s.streakDays >= 21).length,
      inProgress: streaks.filter(s => s.streakDays >= 7 && s.streakDays < 21).length,
      starting: streaks.filter(s => s.streakDays < 7).length,
    };
  }

  /**
   * Calculate streak for a set of tasks
   */
  private async calculateStreak(tasks: any[]): Promise<number> {
    // Sort by date
    const sortedTasks = tasks.sort((a, b) => 
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

    let streak = 0;
    let lastDate: Date | null = null;

    for (const task of sortedTasks) {
      if (task.status !== 'completed') {
        break; // Streak broken
      }

      const taskDate = new Date(task.dueDate);
      
      if (!lastDate) {
        streak = 1;
        lastDate = taskDate;
      } else {
        const dayDiff = Math.floor(
          (lastDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (dayDiff === 1) {
          streak++;
          lastDate = taskDate;
        } else {
          break; // Gap in streak
        }
      }
    }

    return streak;
  }

  /**
   * Get photo verification data
   */
  private async getPhotoVerificationData(
    childId: string,
    weekStartDate: Date,
    weekEndDate: Date
  ): Promise<any> {
    const feedbackSummary = await validationFeedbackService.getFeedbackSummary(
      childId,
      7
    );

    // Calculate quality score (0-100)
    const qualityScore = Math.max(
      0,
      100 - (feedbackSummary.averageResubmissions * 20)
    );

    return {
      submitted: feedbackSummary.totalRejections + 100, // Placeholder
      approved: 100, // Placeholder
      rejected: feedbackSummary.totalRejections,
      qualityScore,
      avgResubmissions: feedbackSummary.averageResubmissions,
    };
  }

  /**
   * Analyze behavioral patterns
   */
  private async analyzeBehavior(childId: string, tasks: any[]): Promise<any> {
    // Analyze completion times
    const timeAnalysis = new Map<string, number>();
    const taskConsistency = new Map<string, number>();

    tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        const timeSlot = this.getTimeSlot(hour);
        timeAnalysis.set(timeSlot, (timeAnalysis.get(timeSlot) || 0) + 1);
      }

      // Track consistency
      const title = task.title;
      if (task.status === 'completed') {
        taskConsistency.set(title, (taskConsistency.get(title) || 0) + 1);
      }
    });

    // Find most productive time
    let maxTime = '';
    let maxCount = 0;
    for (const [time, count] of timeAnalysis) {
      if (count > maxCount) {
        maxTime = time;
        maxCount = count;
      }
    }

    // Identify consistent and struggling tasks
    const consistentTasks: string[] = [];
    const strugglingTasks: string[] = [];
    
    for (const [title, completions] of taskConsistency) {
      const totalAssigned = tasks.filter(t => t.title === title).length;
      const rate = completions / totalAssigned;
      
      if (rate >= 0.8) {
        consistentTasks.push(title);
      } else if (rate < 0.5) {
        strugglingTasks.push(title);
      }
    }

    return {
      productiveTime: maxTime || 'No clear pattern',
      consistentTasks,
      strugglingTasks,
    };
  }

  /**
   * Get time slot label
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 9) return 'Early Morning (5-9 AM)';
    if (hour >= 9 && hour < 12) return 'Morning (9 AM-12 PM)';
    if (hour >= 12 && hour < 15) return 'Afternoon (12-3 PM)';
    if (hour >= 15 && hour < 18) return 'Late Afternoon (3-6 PM)';
    if (hour >= 18 && hour < 21) return 'Evening (6-9 PM)';
    if (hour >= 21 || hour < 5) return 'Night (9 PM-5 AM)';
    return 'Unknown';
  }

  /**
   * Compare with previous week's performance
   */
  private async compareWithPreviousWeek(
    childId: string,
    currentMetrics: any,
    currentPhotoData: any
  ): Promise<any> {
    // Get previous week's summary
    const previousSummary = await this.getPreviousWeekSummary(childId);
    
    if (!previousSummary) {
      return {
        completionChange: 0,
        onTimeChange: 0,
        qualityChange: 0,
        improvements: [],
        declines: [],
      };
    }

    const completionChange = currentMetrics.completionRate - previousSummary.completionRate;
    const onTimeChange = currentMetrics.onTimeRate - previousSummary.onTimeRate;
    const qualityChange = currentPhotoData.qualityScore - previousSummary.photoQualityScore;

    const improvements: string[] = [];
    const declines: string[] = [];

    if (completionChange > 5) improvements.push('Task completion rate');
    if (completionChange < -5) declines.push('Task completion rate');
    
    if (onTimeChange > 5) improvements.push('On-time submissions');
    if (onTimeChange < -5) declines.push('On-time submissions');
    
    if (qualityChange > 5) improvements.push('Photo quality');
    if (qualityChange < -5) declines.push('Photo quality');

    return {
      completionChange,
      onTimeChange,
      qualityChange,
      improvements,
      declines,
    };
  }

  /**
   * Get escalation data
   */
  private async getEscalationData(
    childId: string,
    weekStartDate: Date,
    weekEndDate: Date,
    familyId: string
  ): Promise<any> {
    const summary = await taskEscalationService.getEscalationSummary(familyId, 7);
    const childEscalations = summary.byChild[childId] || 0;

    const reasons: string[] = [];
    if (childEscalations > 0) {
      if (childEscalations >= 5) reasons.push('Frequent overdue tasks');
      else if (childEscalations >= 3) reasons.push('Multiple overdue tasks');
      else reasons.push('Occasional overdue tasks');
    }

    return {
      total: childEscalations,
      reasons,
    };
  }

  /**
   * Calculate rewards and achievements
   */
  private async calculateRewards(
    childId: string,
    taskMetrics: any,
    habitData: any
  ): Promise<any> {
    const points = Math.round(
      taskMetrics.completed * 10 +
      taskMetrics.onTime * 5 +
      habitData.formed * 50
    );

    const achievements: string[] = [];
    if (taskMetrics.completionRate === 100) achievements.push('Perfect Week! 🌟');
    if (habitData.formed > 0) achievements.push('Habit Master! 💪');
    if (taskMetrics.onTimeRate >= 90) achievements.push('Time Champion! ⏰');

    const suggestions: string[] = [];
    if (points >= 500) suggestions.push('Extra screen time (30 min)');
    if (points >= 300) suggestions.push('Choose weekend activity');
    if (points >= 150) suggestions.push('Special treat');

    return {
      points,
      achievements,
      suggestions,
    };
  }

  /**
   * Calculate family-wide metrics
   */
  private calculateFamilyMetrics(childSummaries: ChildWeeklySummary[]): any {
    const totalCompleted = childSummaries.reduce((sum, c) => sum + c.tasksCompleted, 0);
    const totalAssigned = childSummaries.reduce((sum, c) => sum + c.totalTasksAssigned, 0);
    const totalOnTime = childSummaries.reduce((sum, c) => sum + c.tasksOnTime, 0);

    // Calculate accountability score (0-100)
    const completionScore = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 40 : 0;
    const onTimeScore = totalCompleted > 0 ? (totalOnTime / totalCompleted) * 30 : 0;
    const habitScore = childSummaries.reduce((sum, c) => 
      sum + Math.min(30, c.habitsFormed * 10), 0
    ) / Math.max(1, childSummaries.length);

    return {
      totalCompleted,
      completionRate: totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0,
      onTimeRate: totalCompleted > 0 ? (totalOnTime / totalCompleted) * 100 : 0,
      accountabilityScore: Math.round(completionScore + onTimeScore + habitScore),
    };
  }

  /**
   * Analyze family trends
   */
  private async analyzeFamilyTrends(
    childSummaries: ChildWeeklySummary[],
    familyId: string
  ): Promise<any> {
    // Find top performer
    let topPerformer = { childName: '', reason: '' };
    let maxScore = 0;
    
    childSummaries.forEach(summary => {
      const score = summary.completionRate + summary.onTimeRate + summary.habitsFormed * 10;
      if (score > maxScore) {
        maxScore = score;
        topPerformer = {
          childName: summary.childName,
          reason: this.getTopPerformerReason(summary),
        };
      }
    });

    // Find most improved
    let mostImproved = { childName: '', improvementRate: 0 };
    let maxImprovement = 0;
    
    childSummaries.forEach(summary => {
      const improvement = summary.completionRateChange + summary.onTimeRateChange;
      if (improvement > maxImprovement) {
        maxImprovement = improvement;
        mostImproved = {
          childName: summary.childName,
          improvementRate: improvement,
        };
      }
    });

    // Identify family strengths and improvement areas
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    const avgCompletionRate = childSummaries.reduce((sum, c) => sum + c.completionRate, 0) / childSummaries.length;
    const avgOnTimeRate = childSummaries.reduce((sum, c) => sum + c.onTimeRate, 0) / childSummaries.length;
    const totalHabits = childSummaries.reduce((sum, c) => sum + c.habitsFormed, 0);

    if (avgCompletionRate >= 80) strengths.push('Strong task completion');
    if (avgOnTimeRate >= 75) strengths.push('Excellent time management');
    if (totalHabits >= childSummaries.length * 2) strengths.push('Great habit formation');

    if (avgCompletionRate < 60) improvementAreas.push('Task completion consistency');
    if (avgOnTimeRate < 50) improvementAreas.push('Time management');
    if (totalHabits < childSummaries.length) improvementAreas.push('Building consistent habits');

    return {
      topPerformer,
      mostImproved,
      strengths,
      improvementAreas,
    };
  }

  /**
   * Get top performer reason
   */
  private getTopPerformerReason(summary: ChildWeeklySummary): string {
    if (summary.completionRate === 100) return 'Perfect task completion!';
    if (summary.habitsFormed >= 3) return 'Multiple habits maintained!';
    if (summary.onTimeRate >= 95) return 'Exceptional time management!';
    return 'Consistent performance across all areas';
  }

  /**
   * Generate action items for parents
   */
  private generateActionItems(childSummaries: ChildWeeklySummary[]): any[] {
    const actionItems: any[] = [];

    childSummaries.forEach(summary => {
      // High priority items
      if (summary.totalEscalations >= 5) {
        actionItems.push({
          priority: 'high',
          childName: summary.childName,
          action: 'Review task difficulty and provide additional support',
          reason: `${summary.totalEscalations} escalations this week`,
        });
      }

      if (summary.completionRate < 50) {
        actionItems.push({
          priority: 'high',
          childName: summary.childName,
          action: 'Have a conversation about task challenges',
          reason: 'Low completion rate indicates potential struggles',
        });
      }

      // Medium priority items
      if (summary.photoQualityScore < 60) {
        actionItems.push({
          priority: 'medium',
          childName: summary.childName,
          action: 'Help improve photo-taking skills',
          reason: 'Photo quality needs improvement',
        });
      }

      if (summary.strugglingTasks.length >= 3) {
        actionItems.push({
          priority: 'medium',
          childName: summary.childName,
          action: `Review these tasks: ${summary.strugglingTasks.slice(0, 2).join(', ')}`,
          reason: 'Consistent difficulty with specific tasks',
        });
      }

      // Low priority items
      if (summary.habitsFormed >= 2) {
        actionItems.push({
          priority: 'low',
          childName: summary.childName,
          action: 'Celebrate habit achievements!',
          reason: 'Positive reinforcement for good habits',
        });
      }
    });

    // Sort by priority
    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate weekly highlights
   */
  private generateHighlights(childSummaries: ChildWeeklySummary[], trends: any): any[] {
    const highlights: any[] = [];

    // Add achievements
    childSummaries.forEach(summary => {
      if (summary.completionRate === 100) {
        highlights.push({
          type: 'achievement',
          message: `${summary.childName} completed ALL tasks this week! 🎉`,
          childName: summary.childName,
        });
      }

      if (summary.habitsFormed > 0) {
        highlights.push({
          type: 'milestone',
          message: `${summary.childName} has formed ${summary.habitsFormed} new habit(s)!`,
          childName: summary.childName,
        });
      }
    });

    // Add concerns
    childSummaries.forEach(summary => {
      if (summary.totalEscalations >= 5) {
        highlights.push({
          type: 'concern',
          message: `${summary.childName} needs additional support with task completion`,
          childName: summary.childName,
        });
      }
    });

    // Add family-level highlights
    if (trends.strengths.includes('Strong task completion')) {
      highlights.push({
        type: 'achievement',
        message: 'The whole family is doing great with task completion!',
      });
    }

    return highlights.slice(0, 5); // Limit to top 5 highlights
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    childSummaries: ChildWeeklySummary[],
    trends: any,
    familyId: string
  ): Promise<any> {
    const taskRecommendations: any[] = [];
    const systemRecommendations: string[] = [];

    // Task recommendations for each child
    childSummaries.forEach(summary => {
      if (summary.strugglingTasks.length > 0) {
        taskRecommendations.push({
          childName: summary.childName,
          suggestion: `Break down "${summary.strugglingTasks[0]}" into smaller steps`,
          reason: 'Complex tasks are easier when divided',
        });
      }

      if (summary.mostProductiveTime !== 'No clear pattern') {
        taskRecommendations.push({
          childName: summary.childName,
          suggestion: `Schedule important tasks during ${summary.mostProductiveTime}`,
          reason: 'Leverage natural productivity patterns',
        });
      }
    });

    // System recommendations
    const avgPhotoQuality = childSummaries.reduce((sum, c) => sum + c.photoQualityScore, 0) / childSummaries.length;
    
    if (avgPhotoQuality < 70) {
      systemRecommendations.push('Consider a family photo-taking tutorial session');
    }

    const avgEscalations = childSummaries.reduce((sum, c) => sum + c.totalEscalations, 0) / childSummaries.length;
    if (avgEscalations > 3) {
      systemRecommendations.push('Review and adjust reminder timing settings');
    }

    if (trends.improvementAreas.includes('Building consistent habits')) {
      systemRecommendations.push('Use recurring tasks for daily routines');
    }

    return {
      taskRecommendations,
      systemRecommendations,
    };
  }

  /**
   * Schedule weekly generation
   */
  private scheduleWeeklyGeneration(familyId: string) {
    // Clear existing schedule if any
    if (this.generationSchedule.has(familyId)) {
      clearInterval(this.generationSchedule.get(familyId)!);
    }

    // Calculate time until next Sunday 8 PM
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(20, 0, 0, 0);

    const timeUntilNext = nextSunday.getTime() - now.getTime();

    // Schedule first generation
    setTimeout(() => {
      this.generateWeeklySummary(familyId);

      // Then schedule weekly
      const interval = setInterval(() => {
        this.generateWeeklySummary(familyId);
      }, 7 * 24 * 60 * 60 * 1000); // Weekly

      this.generationSchedule.set(familyId, interval);
    }, timeUntilNext);
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

  private async getChildren(family: Family): Promise<User[]> {
    const children: User[] = [];
    
    for (const memberId of family.memberIds || []) {
      const doc = await firestore()
        .collection('users')
        .doc(memberId)
        .get();
      
      const user = doc.data() as User;
      if (user.role === 'child') {
        children.push(user);
      }
    }
    
    return children;
  }

  private async getChildTasksForWeek(
    childId: string,
    weekStartDate: Date,
    weekEndDate: Date,
    familyId: string
  ): Promise<any[]> {
    const snapshot = await firestore()
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .where('assignedTo', '==', childId)
      .where('dueDate', '>=', weekStartDate.toISOString())
      .where('dueDate', '<=', weekEndDate.toISOString())
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getLastSummary(familyId: string): Promise<FamilyWeeklySummary | null> {
    const snapshot = await firestore()
      .collection('weeklySummaries')
      .where('familyId', '==', familyId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    return snapshot.docs[0].data() as FamilyWeeklySummary;
  }

  private isOlderThanWeek(date: Date): boolean {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date < weekAgo;
  }

  private async getPreviousWeekSummary(childId: string): Promise<ChildWeeklySummary | null> {
    // Get summary from 1 week ago
    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 7);

    const snapshot = await firestore()
      .collection('childWeeklySummaries')
      .where('childId', '==', childId)
      .where('weekEndDate', '>=', new Date(previousWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .where('weekEndDate', '<=', previousWeek.toISOString())
      .orderBy('weekEndDate', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    return snapshot.docs[0].data() as ChildWeeklySummary;
  }

  private async storeSummary(summary: FamilyWeeklySummary) {
    // Store family summary
    await firestore()
      .collection('weeklySummaries')
      .add({
        ...summary,
        weekStartDate: summary.weekStartDate.toISOString(),
        weekEndDate: summary.weekEndDate.toISOString(),
        generatedAt: summary.generatedAt.toISOString(),
      });

    // Store individual child summaries for easy access
    for (const childSummary of summary.childSummaries) {
      await firestore()
        .collection('childWeeklySummaries')
        .add({
          ...childSummary,
          familyId: summary.familyId,
          weekStartDate: childSummary.weekStartDate.toISOString(),
          weekEndDate: childSummary.weekEndDate.toISOString(),
        });
    }
  }

  private async sendSummaryToParents(summary: FamilyWeeklySummary, family: Family) {
    // Get parent users
    const parents: User[] = [];
    for (const memberId of family.memberIds || []) {
      const doc = await firestore()
        .collection('users')
        .doc(memberId)
        .get();
      
      const user = doc.data() as User;
      if (user.role === 'parent') {
        parents.push(user);
      }
    }

    // Send notification to each parent
    for (const parent of parents) {
      await notificationOrchestrator.sendNotification({
        userId: parent.id,
        title: 'Your Weekly Family Summary is Ready!',
        body: `Family accountability score: ${summary.familyAccountabilityScore}/100. Tap to view details.`,
        data: {
          type: 'weekly_summary',
          summaryId: summary.familyId,
        },
        priority: 'high',
      });
    }
  }

  /**
   * Get formatted summary for display
   */
  async getFormattedSummary(familyId: string): Promise<string> {
    const summary = this.summaryCache.get(familyId) || await this.getLastSummary(familyId);
    
    if (!summary) {
      return 'No summary available yet.';
    }

    let formatted = `
📊 **Weekly Family Summary**
Week of ${summary.weekStartDate.toLocaleDateString()} - ${summary.weekEndDate.toLocaleDateString()}

**Family Accountability Score: ${summary.familyAccountabilityScore}/100**

📈 **Overall Metrics:**
• Tasks Completed: ${summary.totalTasksCompleted}
• Completion Rate: ${summary.overallCompletionRate.toFixed(1)}%
• On-Time Rate: ${summary.overallOnTimeRate.toFixed(1)}%

🏆 **Top Performer:** ${summary.topPerformer.childName}
   ${summary.topPerformer.reason}

⭐ **Most Improved:** ${summary.mostImprovedChild.childName}
   +${summary.mostImprovedChild.improvementRate.toFixed(1)}% improvement

**Key Highlights:**
`;

    summary.highlights.forEach(highlight => {
      const icon = highlight.type === 'achievement' ? '🎉' :
                   highlight.type === 'milestone' ? '🏅' : '⚠️';
      formatted += `${icon} ${highlight.message}\n`;
    });

    formatted += '\n**Action Items for Parents:**\n';
    summary.actionItems.slice(0, 3).forEach(item => {
      const priority = item.priority === 'high' ? '🔴' :
                      item.priority === 'medium' ? '🟡' : '🟢';
      formatted += `${priority} ${item.childName}: ${item.action}\n`;
    });

    return formatted;
  }

  /**
   * Clean up
   */
  dispose() {
    // Clear all scheduled generations
    for (const [_, interval] of this.generationSchedule) {
      clearInterval(interval);
    }
    this.generationSchedule.clear();
  }
}

// Export singleton instance
export const weeklySummaryService = new WeeklySummaryService();