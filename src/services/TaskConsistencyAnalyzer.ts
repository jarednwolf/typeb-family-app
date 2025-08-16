import { firestore } from '../config/firebase';
import { Task, User, Family } from '../types/models';

interface ConsistencyPattern {
  taskTitle: string;
  taskId?: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  onTimeRate: number;
  averageDelay: number; // in hours
  consistencyScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  pattern: 'consistent' | 'sporadic' | 'declining' | 'improving';
}

interface TimePattern {
  dayOfWeek: string;
  completionRate: number;
  averageCompletionTime: string; // HH:MM format
  taskCount: number;
}

interface ChildConsistencyAnalysis {
  childId: string;
  childName: string;
  overallConsistencyScore: number;
  taskPatterns: ConsistencyPattern[];
  timePatterns: TimePattern[];
  
  // Behavioral Insights
  mostConsistentTasks: string[];
  leastConsistentTasks: string[];
  bestDays: string[];
  worstDays: string[];
  optimalTimeSlots: string[];
  
  // Completion Patterns
  weeklyCompletionPattern: number[]; // 7 days of completion rates
  monthlyTrend: 'improving' | 'stable' | 'declining';
  
  // Problem Areas
  problemPatterns: {
    pattern: string;
    description: string;
    affectedTasks: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
  
  // Recommendations
  recommendations: {
    type: 'schedule' | 'reminder' | 'task' | 'reward';
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
    expectedImpact: string;
  }[];
}

interface FamilyConsistencyAnalysis {
  familyId: string;
  analysisDate: Date;
  periodDays: number;
  
  // Overall Metrics
  familyConsistencyScore: number;
  averageCompletionRate: number;
  
  // Individual Analyses
  childAnalyses: ChildConsistencyAnalysis[];
  
  // Family Patterns
  commonStrengths: string[];
  commonChallenges: string[];
  
  // Time-based Insights
  familyBestTimes: string[];
  familyWorstTimes: string[];
  
  // Systemic Issues
  systemicIssues: {
    issue: string;
    affectedChildren: string[];
    suggestedSolution: string;
  }[];
  
  // Strategic Recommendations
  familyRecommendations: {
    category: string;
    recommendation: string;
    expectedBenefit: string;
  }[];
}

class TaskConsistencyAnalyzer {
  private readonly ANALYSIS_PERIOD_DAYS = 30;
  private readonly MIN_DATA_POINTS = 5;
  
  /**
   * Analyze consistency for entire family
   */
  async analyzeFamilyConsistency(
    familyId: string,
    periodDays: number = this.ANALYSIS_PERIOD_DAYS
  ): Promise<FamilyConsistencyAnalysis> {
    try {
      const family = await this.getFamily(familyId);
      const children = await this.getChildren(family);
      
      // Analyze each child
      const childAnalyses: ChildConsistencyAnalysis[] = [];
      for (const child of children) {
        const analysis = await this.analyzeChildConsistency(
          child,
          familyId,
          periodDays
        );
        childAnalyses.push(analysis);
      }
      
      // Calculate family-wide metrics
      const familyMetrics = this.calculateFamilyMetrics(childAnalyses);
      
      // Identify common patterns
      const commonPatterns = this.identifyCommonPatterns(childAnalyses);
      
      // Find systemic issues
      const systemicIssues = this.identifySystemicIssues(childAnalyses);
      
      // Generate family recommendations
      const familyRecommendations = this.generateFamilyRecommendations(
        childAnalyses,
        systemicIssues
      );
      
      return {
        familyId,
        analysisDate: new Date(),
        periodDays,
        familyConsistencyScore: familyMetrics.consistencyScore,
        averageCompletionRate: familyMetrics.completionRate,
        childAnalyses,
        commonStrengths: commonPatterns.strengths,
        commonChallenges: commonPatterns.challenges,
        familyBestTimes: commonPatterns.bestTimes,
        familyWorstTimes: commonPatterns.worstTimes,
        systemicIssues,
        familyRecommendations,
      };
    } catch (error) {
      console.error('Failed to analyze family consistency:', error);
      throw error;
    }
  }
  
  /**
   * Analyze consistency for individual child
   */
  private async analyzeChildConsistency(
    child: User,
    familyId: string,
    periodDays: number
  ): Promise<ChildConsistencyAnalysis> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Get all tasks for the period
    const tasks = await this.getChildTasks(child.id, familyId, startDate, endDate);
    
    // Analyze task patterns
    const taskPatterns = await this.analyzeTaskPatterns(tasks);
    
    // Analyze time patterns
    const timePatterns = this.analyzeTimePatterns(tasks);
    
    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(taskPatterns);
    
    // Identify best and worst patterns
    const patterns = this.identifyPatterns(taskPatterns, timePatterns);
    
    // Analyze completion patterns over time
    const completionPatterns = this.analyzeCompletionPatterns(tasks, periodDays);
    
    // Identify problem patterns
    const problemPatterns = this.identifyProblemPatterns(
      taskPatterns,
      timePatterns,
      completionPatterns
    );
    
    // Generate recommendations
    const recommendations = this.generateChildRecommendations(
      taskPatterns,
      timePatterns,
      problemPatterns
    );
    
    return {
      childId: child.id,
      childName: child.displayName || 'Child',
      overallConsistencyScore: consistencyScore,
      taskPatterns,
      timePatterns,
      mostConsistentTasks: patterns.mostConsistent,
      leastConsistentTasks: patterns.leastConsistent,
      bestDays: patterns.bestDays,
      worstDays: patterns.worstDays,
      optimalTimeSlots: patterns.optimalTimes,
      weeklyCompletionPattern: completionPatterns.weekly,
      monthlyTrend: completionPatterns.trend,
      problemPatterns,
      recommendations,
    };
  }
  
  /**
   * Analyze patterns for specific tasks
   */
  private async analyzeTaskPatterns(tasks: any[]): Promise<ConsistencyPattern[]> {
    const taskGroups = new Map<string, any[]>();
    
    // Group tasks by title
    tasks.forEach(task => {
      const key = task.title;
      if (!taskGroups.has(key)) {
        taskGroups.set(key, []);
      }
      taskGroups.get(key)!.push(task);
    });
    
    const patterns: ConsistencyPattern[] = [];
    
    for (const [title, taskList] of taskGroups) {
      if (taskList.length < this.MIN_DATA_POINTS) continue;
      
      const pattern = this.analyzeTaskGroup(title, taskList);
      patterns.push(pattern);
    }
    
    return patterns.sort((a, b) => b.consistencyScore - a.consistencyScore);
  }
  
  /**
   * Analyze a group of similar tasks
   */
  private analyzeTaskGroup(title: string, tasks: any[]): ConsistencyPattern {
    const totalAssigned = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed');
    const totalCompleted = completed.length;
    
    // Calculate on-time rate
    const onTime = completed.filter(t => {
      if (!t.completedAt || !t.dueDate) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    });
    const onTimeRate = totalCompleted > 0 ? (onTime.length / totalCompleted) * 100 : 0;
    
    // Calculate average delay
    let totalDelay = 0;
    let delayCount = 0;
    completed.forEach(task => {
      if (task.completedAt && task.dueDate) {
        const delay = new Date(task.completedAt).getTime() - new Date(task.dueDate).getTime();
        if (delay > 0) {
          totalDelay += delay;
          delayCount++;
        }
      }
    });
    const averageDelay = delayCount > 0 
      ? totalDelay / delayCount / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    // Calculate completion rate
    const completionRate = (totalCompleted / totalAssigned) * 100;
    
    // Analyze trend
    const trend = this.analyzeTrend(tasks);
    
    // Determine pattern type
    const pattern = this.determinePattern(completionRate, onTimeRate, trend);
    
    // Calculate consistency score (0-100)
    const consistencyScore = this.calculateTaskConsistencyScore(
      completionRate,
      onTimeRate,
      averageDelay,
      trend
    );
    
    return {
      taskTitle: title,
      totalAssigned,
      totalCompleted,
      completionRate,
      onTimeRate,
      averageDelay,
      consistencyScore,
      trend,
      pattern,
    };
  }
  
  /**
   * Analyze completion trend over time
   */
  private analyzeTrend(tasks: any[]): 'improving' | 'stable' | 'declining' {
    // Sort tasks by date
    const sortedTasks = tasks.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    // Split into halves
    const midpoint = Math.floor(sortedTasks.length / 2);
    const firstHalf = sortedTasks.slice(0, midpoint);
    const secondHalf = sortedTasks.slice(midpoint);
    
    // Calculate completion rates
    const firstRate = firstHalf.filter(t => t.status === 'completed').length / firstHalf.length;
    const secondRate = secondHalf.filter(t => t.status === 'completed').length / secondHalf.length;
    
    // Determine trend
    const difference = secondRate - firstRate;
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }
  
  /**
   * Determine pattern type
   */
  private determinePattern(
    completionRate: number,
    onTimeRate: number,
    trend: string
  ): 'consistent' | 'sporadic' | 'declining' | 'improving' {
    if (trend === 'declining' && completionRate < 70) return 'declining';
    if (trend === 'improving' && completionRate > 50) return 'improving';
    if (completionRate >= 80 && onTimeRate >= 70) return 'consistent';
    return 'sporadic';
  }
  
  /**
   * Calculate task consistency score
   */
  private calculateTaskConsistencyScore(
    completionRate: number,
    onTimeRate: number,
    averageDelay: number,
    trend: string
  ): number {
    let score = 0;
    
    // Completion rate (40 points max)
    score += (completionRate / 100) * 40;
    
    // On-time rate (30 points max)
    score += (onTimeRate / 100) * 30;
    
    // Delay penalty (20 points max)
    const delayPenalty = Math.min(averageDelay * 2, 20);
    score += 20 - delayPenalty;
    
    // Trend bonus/penalty (10 points)
    if (trend === 'improving') score += 10;
    else if (trend === 'stable') score += 5;
    // 'declining' gets 0 points
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Analyze time-based patterns
   */
  private analyzeTimePatterns(tasks: any[]): TimePattern[] {
    const dayPatterns = new Map<string, { completed: number; total: number; times: number[] }>();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize day patterns
    days.forEach(day => {
      dayPatterns.set(day, { completed: 0, total: 0, times: [] });
    });
    
    // Analyze each task
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const dayName = days[dueDate.getDay()];
      const pattern = dayPatterns.get(dayName)!;
      
      pattern.total++;
      
      if (task.status === 'completed' && task.completedAt) {
        pattern.completed++;
        const completedDate = new Date(task.completedAt);
        pattern.times.push(completedDate.getHours() * 60 + completedDate.getMinutes());
      }
    });
    
    // Calculate patterns
    const patterns: TimePattern[] = [];
    
    for (const [day, data] of dayPatterns) {
      if (data.total === 0) continue;
      
      const avgMinutes = data.times.length > 0
        ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
        : 0;
      
      patterns.push({
        dayOfWeek: day,
        completionRate: (data.completed / data.total) * 100,
        averageCompletionTime: `${Math.floor(avgMinutes / 60).toString().padStart(2, '0')}:${(avgMinutes % 60).toString().padStart(2, '0')}`,
        taskCount: data.total,
      });
    }
    
    return patterns.sort((a, b) => b.completionRate - a.completionRate);
  }
  
  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(taskPatterns: ConsistencyPattern[]): number {
    if (taskPatterns.length === 0) return 0;
    
    const totalScore = taskPatterns.reduce((sum, pattern) => 
      sum + pattern.consistencyScore, 0
    );
    
    return Math.round(totalScore / taskPatterns.length);
  }
  
  /**
   * Identify best and worst patterns
   */
  private identifyPatterns(
    taskPatterns: ConsistencyPattern[],
    timePatterns: TimePattern[]
  ): any {
    const mostConsistent = taskPatterns
      .filter(p => p.consistencyScore >= 80)
      .map(p => p.taskTitle)
      .slice(0, 3);
    
    const leastConsistent = taskPatterns
      .filter(p => p.consistencyScore < 50)
      .map(p => p.taskTitle)
      .slice(0, 3);
    
    const bestDays = timePatterns
      .filter(p => p.completionRate >= 75)
      .map(p => p.dayOfWeek)
      .slice(0, 3);
    
    const worstDays = timePatterns
      .filter(p => p.completionRate < 50)
      .map(p => p.dayOfWeek)
      .slice(0, 3);
    
    // Identify optimal time slots
    const timeSlots = new Map<string, number>();
    timePatterns.forEach(pattern => {
      const hour = parseInt(pattern.averageCompletionTime.split(':')[0]);
      const slot = this.getTimeSlot(hour);
      timeSlots.set(slot, (timeSlots.get(slot) || 0) + pattern.completionRate);
    });
    
    const optimalTimes = Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slot]) => slot)
      .slice(0, 2);
    
    return {
      mostConsistent,
      leastConsistent,
      bestDays,
      worstDays,
      optimalTimes,
    };
  }
  
  /**
   * Analyze completion patterns over time
   */
  private analyzeCompletionPatterns(tasks: any[], periodDays: number): any {
    // Calculate weekly pattern (last 7 days)
    const weekly: number[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });
      
      if (dayTasks.length > 0) {
        const completed = dayTasks.filter(t => t.status === 'completed').length;
        weekly.push((completed / dayTasks.length) * 100);
      } else {
        weekly.push(0);
      }
    }
    
    // Determine monthly trend
    const firstWeek = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - periodDays);
      const weekAgoPlus7 = new Date(weekAgo);
      weekAgoPlus7.setDate(weekAgoPlus7.getDate() + 7);
      return taskDate >= weekAgo && taskDate < weekAgoPlus7;
    });
    
    const lastWeek = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return taskDate >= weekAgo;
    });
    
    const firstWeekRate = firstWeek.length > 0
      ? firstWeek.filter(t => t.status === 'completed').length / firstWeek.length
      : 0;
    
    const lastWeekRate = lastWeek.length > 0
      ? lastWeek.filter(t => t.status === 'completed').length / lastWeek.length
      : 0;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (lastWeekRate > firstWeekRate + 0.1) trend = 'improving';
    else if (lastWeekRate < firstWeekRate - 0.1) trend = 'declining';
    
    return {
      weekly,
      trend,
    };
  }
  
  /**
   * Identify problem patterns
   */
  private identifyProblemPatterns(
    taskPatterns: ConsistencyPattern[],
    timePatterns: TimePattern[],
    completionPatterns: any
  ): any[] {
    const problems: any[] = [];
    
    // Check for consistently late tasks
    const lateTasks = taskPatterns.filter(p => 
      p.onTimeRate < 50 && p.averageDelay > 3
    );
    
    if (lateTasks.length > 0) {
      problems.push({
        pattern: 'Chronic Lateness',
        description: 'Tasks are frequently completed after the deadline',
        affectedTasks: lateTasks.map(t => t.taskTitle),
        severity: lateTasks.length >= 3 ? 'high' : 'medium',
      });
    }
    
    // Check for declining performance
    if (completionPatterns.trend === 'declining') {
      const decliningTasks = taskPatterns
        .filter(p => p.trend === 'declining')
        .map(p => p.taskTitle);
      
      problems.push({
        pattern: 'Declining Performance',
        description: 'Task completion rate is decreasing over time',
        affectedTasks: decliningTasks,
        severity: 'high',
      });
    }
    
    // Check for weekend issues
    const weekendDays = timePatterns.filter(p => 
      (p.dayOfWeek === 'Saturday' || p.dayOfWeek === 'Sunday') &&
      p.completionRate < 50
    );
    
    if (weekendDays.length > 0) {
      problems.push({
        pattern: 'Weekend Struggles',
        description: 'Tasks are often missed on weekends',
        affectedTasks: [],
        severity: 'medium',
      });
    }
    
    // Check for sporadic completion
    const sporadicTasks = taskPatterns.filter(p => p.pattern === 'sporadic');
    
    if (sporadicTasks.length >= 3) {
      problems.push({
        pattern: 'Inconsistent Completion',
        description: 'Task completion is unpredictable',
        affectedTasks: sporadicTasks.map(t => t.taskTitle),
        severity: 'medium',
      });
    }
    
    return problems;
  }
  
  /**
   * Generate recommendations for child
   */
  private generateChildRecommendations(
    taskPatterns: ConsistencyPattern[],
    timePatterns: TimePattern[],
    problemPatterns: any[]
  ): any[] {
    const recommendations: any[] = [];
    
    // Address chronic lateness
    if (problemPatterns.some(p => p.pattern === 'Chronic Lateness')) {
      recommendations.push({
        type: 'reminder',
        suggestion: 'Set earlier reminder times for frequently late tasks',
        priority: 'high',
        expectedImpact: 'Reduce task delays by 50%',
      });
    }
    
    // Address declining performance
    if (problemPatterns.some(p => p.pattern === 'Declining Performance')) {
      recommendations.push({
        type: 'task',
        suggestion: 'Reduce task complexity or break into smaller steps',
        priority: 'high',
        expectedImpact: 'Improve completion rate by 30%',
      });
      
      recommendations.push({
        type: 'reward',
        suggestion: 'Implement immediate rewards for task completion',
        priority: 'medium',
        expectedImpact: 'Increase motivation and engagement',
      });
    }
    
    // Optimize scheduling based on time patterns
    const bestDays = timePatterns
      .filter(p => p.completionRate >= 80)
      .map(p => p.dayOfWeek);
    
    if (bestDays.length > 0) {
      recommendations.push({
        type: 'schedule',
        suggestion: `Schedule important tasks on ${bestDays.join(', ')}`,
        priority: 'medium',
        expectedImpact: 'Increase important task completion by 25%',
      });
    }
    
    // Address weekend issues
    if (problemPatterns.some(p => p.pattern === 'Weekend Struggles')) {
      recommendations.push({
        type: 'schedule',
        suggestion: 'Create special weekend routines with flexible timing',
        priority: 'medium',
        expectedImpact: 'Improve weekend task completion',
      });
    }
    
    // Suggest habit stacking for consistent tasks
    const consistentTasks = taskPatterns.filter(p => p.consistencyScore >= 85);
    if (consistentTasks.length > 0) {
      recommendations.push({
        type: 'task',
        suggestion: `Stack new habits with successful tasks like "${consistentTasks[0].taskTitle}"`,
        priority: 'low',
        expectedImpact: 'Build new habits more effectively',
      });
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }
  
  /**
   * Calculate family-wide metrics
   */
  private calculateFamilyMetrics(childAnalyses: ChildConsistencyAnalysis[]): any {
    if (childAnalyses.length === 0) {
      return { consistencyScore: 0, completionRate: 0 };
    }
    
    const totalConsistency = childAnalyses.reduce((sum, c) => 
      sum + c.overallConsistencyScore, 0
    );
    
    const totalCompletion = childAnalyses.reduce((sum, c) => {
      const avgRate = c.taskPatterns.reduce((s, p) => s + p.completionRate, 0) / 
        Math.max(1, c.taskPatterns.length);
      return sum + avgRate;
    }, 0);
    
    return {
      consistencyScore: Math.round(totalConsistency / childAnalyses.length),
      completionRate: Math.round(totalCompletion / childAnalyses.length),
    };
  }
  
  /**
   * Identify common family patterns
   */
  private identifyCommonPatterns(childAnalyses: ChildConsistencyAnalysis[]): any {
    const strengths: string[] = [];
    const challenges: string[] = [];
    const bestTimes: string[] = [];
    const worstTimes: string[] = [];
    
    // Count common patterns
    const taskFrequency = new Map<string, number>();
    const dayFrequency = new Map<string, { good: number; bad: number }>();
    const timeFrequency = new Map<string, number>();
    
    childAnalyses.forEach(analysis => {
      // Count consistent tasks
      analysis.mostConsistentTasks.forEach(task => {
        taskFrequency.set(task, (taskFrequency.get(task) || 0) + 1);
      });
      
      // Count best/worst days
      analysis.bestDays.forEach(day => {
        const freq = dayFrequency.get(day) || { good: 0, bad: 0 };
        freq.good++;
        dayFrequency.set(day, freq);
      });
      
      analysis.worstDays.forEach(day => {
        const freq = dayFrequency.get(day) || { good: 0, bad: 0 };
        freq.bad++;
        dayFrequency.set(day, freq);
      });
      
      // Count optimal times
      analysis.optimalTimeSlots.forEach(time => {
        timeFrequency.set(time, (timeFrequency.get(time) || 0) + 1);
      });
    });
    
    // Identify common strengths (tasks consistent for multiple children)
    for (const [task, count] of taskFrequency) {
      if (count >= Math.ceil(childAnalyses.length / 2)) {
        strengths.push(`Strong family consistency with "${task}"`);
      }
    }
    
    // Identify common challenges
    const commonProblems = new Map<string, number>();
    childAnalyses.forEach(analysis => {
      analysis.problemPatterns.forEach(problem => {
        commonProblems.set(problem.pattern, (commonProblems.get(problem.pattern) || 0) + 1);
      });
    });
    
    for (const [problem, count] of commonProblems) {
      if (count >= Math.ceil(childAnalyses.length / 2)) {
        challenges.push(problem);
      }
    }
    
    // Identify family best/worst times
    for (const [day, freq] of dayFrequency) {
      if (freq.good >= Math.ceil(childAnalyses.length / 2)) {
        bestTimes.push(day);
      }
      if (freq.bad >= Math.ceil(childAnalyses.length / 2)) {
        worstTimes.push(day);
      }
    }
    
    return {
      strengths,
      challenges,
      bestTimes,
      worstTimes,
    };
  }
  
  /**
   * Identify systemic issues affecting multiple children
   */
  private identifySystemicIssues(childAnalyses: ChildConsistencyAnalysis[]): any[] {
    const issues: any[] = [];
    
    // Check for widespread declining performance
    const decliningChildren = childAnalyses.filter(c => 
      c.monthlyTrend === 'declining'
    );
    
    if (decliningChildren.length >= childAnalyses.length / 2) {
      issues.push({
        issue: 'Family-wide Performance Decline',
        affectedChildren: decliningChildren.map(c => c.childName),
        suggestedSolution: 'Review overall task load and consider family meeting to address challenges',
      });
    }
    
    // Check for common time management issues
    const lateChildren = childAnalyses.filter(c => {
      const avgDelay = c.taskPatterns.reduce((sum, p) => sum + p.averageDelay, 0) / 
        Math.max(1, c.taskPatterns.length);
      return avgDelay > 2; // More than 2 hours average delay
    });
    
    if (lateChildren.length >= childAnalyses.length / 2) {
      issues.push({
        issue: 'Systemic Time Management Problems',
        affectedChildren: lateChildren.map(c => c.childName),
        suggestedSolution: 'Implement family-wide time management training and tools',
      });
    }
    
    // Check for weekend struggles across family
    const weekendStrugglers = childAnalyses.filter(c => 
      c.problemPatterns.some(p => p.pattern === 'Weekend Struggles')
    );
    
    if (weekendStrugglers.length >= childAnalyses.length / 2) {
      issues.push({
        issue: 'Weekend Routine Breakdown',
        affectedChildren: weekendStrugglers.map(c => c.childName),
        suggestedSolution: 'Create structured weekend routines with flexibility',
      });
    }
    
    return issues;
  }
  
  /**
   * Generate family-wide recommendations
   */
  private generateFamilyRecommendations(
    childAnalyses: ChildConsistencyAnalysis[],
    systemicIssues: any[]
  ): any[] {
    const recommendations: any[] = [];
    
    // Address systemic issues first
    systemicIssues.forEach(issue => {
      recommendations.push({
        category: 'Systemic',
        recommendation: issue.suggestedSolution,
        expectedBenefit: `Improve consistency for ${issue.affectedChildren.length} children`,
      });
    });
    
    // Analyze family-wide consistency score
    const avgConsistency = childAnalyses.reduce((sum, c) =>
      sum + c.overallConsistencyScore, 0
    ) / childAnalyses.length;
    
    if (avgConsistency < 60) {
      recommendations.push({
        category: 'Family Structure',
        recommendation: 'Implement family accountability meetings weekly',
        expectedBenefit: 'Increase family consistency score by 20-30%',
      });
    }
    
    // Check for common time management issues
    const avgDelays = childAnalyses.map(c => {
      const delays = c.taskPatterns.map(p => p.averageDelay);
      return delays.reduce((sum, d) => sum + d, 0) / Math.max(1, delays.length);
    });
    
    if (avgDelays.some(d => d > 3)) {
      recommendations.push({
        category: 'Time Management',
        recommendation: 'Create visual time management tools and countdown timers',
        expectedBenefit: 'Reduce average task delays by 50%',
      });
    }
    
    // Suggest reward system improvements
    const lowPerformers = childAnalyses.filter(c => c.overallConsistencyScore < 50);
    if (lowPerformers.length > 0) {
      recommendations.push({
        category: 'Motivation',
        recommendation: 'Implement tiered reward system with immediate feedback',
        expectedBenefit: 'Increase engagement and completion rates',
      });
    }
    
    // Recommend task optimization
    const commonStruggles = new Set<string>();
    childAnalyses.forEach(c => {
      c.leastConsistentTasks.forEach(task => commonStruggles.add(task));
    });
    
    if (commonStruggles.size > 0) {
      recommendations.push({
        category: 'Task Design',
        recommendation: `Review and simplify these challenging tasks: ${Array.from(commonStruggles).slice(0, 3).join(', ')}`,
        expectedBenefit: 'Improve task completion rates by 25%',
      });
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
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
  
  private async getChildTasks(
    childId: string,
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const snapshot = await firestore()
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .where('assignedTo', '==', childId)
      .where('dueDate', '>=', startDate.toISOString())
      .where('dueDate', '<=', endDate.toISOString())
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
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
   * Generate formatted analysis report
   */
  async generateReport(analysis: FamilyConsistencyAnalysis): Promise<string> {
    let report = `
📊 **Family Task Consistency Analysis**
Date: ${analysis.analysisDate.toLocaleDateString()}
Period: Last ${analysis.periodDays} days

**Overall Family Consistency Score: ${analysis.familyConsistencyScore}/100**
Average Completion Rate: ${analysis.averageCompletionRate.toFixed(1)}%

📈 **Individual Performance:**
`;
    
    analysis.childAnalyses.forEach(child => {
      report += `
**${child.childName}**
• Consistency Score: ${child.overallConsistencyScore}/100
• Monthly Trend: ${child.monthlyTrend}
• Best Days: ${child.bestDays.join(', ') || 'None identified'}
• Optimal Times: ${child.optimalTimeSlots.join(', ') || 'No clear pattern'}
`;
      
      if (child.problemPatterns.length > 0) {
        report += `• ⚠️ Issues: ${child.problemPatterns.map(p => p.pattern).join(', ')}\n`;
      }
    });
    
    if (analysis.commonStrengths.length > 0) {
      report += `\n💪 **Family Strengths:**\n`;
      analysis.commonStrengths.forEach(strength => {
        report += `• ${strength}\n`;
      });
    }
    
    if (analysis.commonChallenges.length > 0) {
      report += `\n🎯 **Areas for Improvement:**\n`;
      analysis.commonChallenges.forEach(challenge => {
        report += `• ${challenge}\n`;
      });
    }
    
    if (analysis.systemicIssues.length > 0) {
      report += `\n⚠️ **Systemic Issues:**\n`;
      analysis.systemicIssues.forEach(issue => {
        report += `• ${issue.issue}: ${issue.suggestedSolution}\n`;
      });
    }
    
    if (analysis.familyRecommendations.length > 0) {
      report += `\n💡 **Recommendations:**\n`;
      analysis.familyRecommendations.forEach(rec => {
        report += `• ${rec.recommendation}\n  Expected Benefit: ${rec.expectedBenefit}\n`;
      });
    }
    
    return report;
  }
  
  /**
   * Get quick insights for dashboard
   */
  async getQuickInsights(
    familyId: string
  ): Promise<{
    consistencyScore: number;
    trend: 'improving' | 'stable' | 'declining';
    topIssue: string | null;
    topRecommendation: string | null;
  }> {
    try {
      const analysis = await this.analyzeFamilyConsistency(familyId, 7);
      
      // Determine overall trend
      const trends = analysis.childAnalyses.map(c => c.monthlyTrend);
      const improvingCount = trends.filter(t => t === 'improving').length;
      const decliningCount = trends.filter(t => t === 'declining').length;
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (improvingCount > decliningCount + 1) trend = 'improving';
      else if (decliningCount > improvingCount + 1) trend = 'declining';
      
      // Get top issue
      const topIssue = analysis.systemicIssues.length > 0
        ? analysis.systemicIssues[0].issue
        : analysis.commonChallenges.length > 0
        ? analysis.commonChallenges[0]
        : null;
      
      // Get top recommendation
      const topRecommendation = analysis.familyRecommendations.length > 0
        ? analysis.familyRecommendations[0].recommendation
        : null;
      
      return {
        consistencyScore: analysis.familyConsistencyScore,
        trend,
        topIssue,
        topRecommendation,
      };
    } catch (error) {
      console.error('Failed to get quick insights:', error);
      return {
        consistencyScore: 0,
        trend: 'stable',
        topIssue: null,
        topRecommendation: null,
      };
    }
  }
}

// Export singleton instance
export const taskConsistencyAnalyzer = new TaskConsistencyAnalyzer();