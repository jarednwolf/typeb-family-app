import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { taskConsistencyAnalyzer } from '../../services/TaskConsistencyAnalyzer';
import { weeklySummaryService } from '../../services/WeeklySummaryService';
import { validationFeedbackService } from '../../services/ValidationFeedbackService';
import { taskEscalationService } from '../../services/TaskEscalationService';

const { width: screenWidth } = Dimensions.get('window');

interface ParentInsightsProps {
  familyId: string;
  onActionTap?: (action: any) => void;
  onChildSelect?: (childId: string) => void;
}

interface InsightCard {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  childName?: string;
  childId?: string;
  actionLabel?: string;
  actionType?: string;
  data?: any;
}

interface ChildSnapshot {
  childId: string;
  childName: string;
  status: 'thriving' | 'stable' | 'needs_attention' | 'struggling';
  consistencyScore: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  keyMetrics: {
    tasksCompleted: number;
    onTimeRate: number;
    currentStreak: number;
    photoQuality: number;
  };
  topIssue?: string;
  recommendation?: string;
}

export const ParentInsights: React.FC<ParentInsightsProps> = ({
  familyId,
  onActionTap,
  onChildSelect,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'actions'>('overview');
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [childSnapshots, setChildSnapshots] = useState<ChildSnapshot[]>([]);
  const [familyScore, setFamilyScore] = useState(0);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [familyId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Get comprehensive analytics
      const [
        consistencyAnalysis,
        weeklySummary,
        feedbackSummary,
        escalationSummary,
      ] = await Promise.all([
        taskConsistencyAnalyzer.analyzeFamilyConsistency(familyId, 7),
        weeklySummaryService.generateWeeklySummary(familyId),
        validationFeedbackService.getFeedbackSummary(familyId, 7),
        taskEscalationService.getEscalationSummary(familyId, 7),
      ]);

      // Process data
      processChildSnapshots(consistencyAnalysis, weeklySummary);
      generateInsights(
        consistencyAnalysis,
        weeklySummary,
        feedbackSummary,
        escalationSummary
      );
      extractActionItems(weeklySummary, consistencyAnalysis);
      
      setFamilyScore(consistencyAnalysis.familyConsistencyScore);
      
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChildSnapshots = (analysis: any, summary: any) => {
    const snapshots: ChildSnapshot[] = [];
    
    analysis.childAnalyses.forEach((childAnalysis: any) => {
      const childSummary = summary.childSummaries.find(
        (s: any) => s.childId === childAnalysis.childId
      );
      
      if (childSummary) {
        const status = getChildStatus(childAnalysis, childSummary);
        
        snapshots.push({
          childId: childAnalysis.childId,
          childName: childAnalysis.childName,
          status,
          consistencyScore: childAnalysis.overallConsistencyScore,
          weeklyTrend: determineWeeklyTrend(childSummary),
          keyMetrics: {
            tasksCompleted: childSummary.tasksCompleted,
            onTimeRate: childSummary.onTimeRate,
            currentStreak: childSummary.currentStreaks.length > 0
              ? Math.max(...childSummary.currentStreaks.map((s: any) => s.streakDays))
              : 0,
            photoQuality: childSummary.photoQualityScore,
          },
          topIssue: childAnalysis.problemPatterns.length > 0
            ? childAnalysis.problemPatterns[0].pattern
            : undefined,
          recommendation: childAnalysis.recommendations.length > 0
            ? childAnalysis.recommendations[0].suggestion
            : undefined,
        });
      }
    });
    
    setChildSnapshots(snapshots);
  };

  const getChildStatus = (analysis: any, summary: any): ChildSnapshot['status'] => {
    const score = analysis.overallConsistencyScore;
    const trend = analysis.monthlyTrend;
    const escalations = summary.totalEscalations;
    
    if (score >= 80 && trend !== 'declining' && escalations === 0) {
      return 'thriving';
    } else if (score >= 60 && escalations < 3) {
      return 'stable';
    } else if (score >= 40 || escalations < 5) {
      return 'needs_attention';
    } else {
      return 'struggling';
    }
  };

  const determineWeeklyTrend = (summary: any): 'up' | 'down' | 'stable' => {
    if (summary.completionRateChange > 5) return 'up';
    if (summary.completionRateChange < -5) return 'down';
    return 'stable';
  };

  const generateInsights = (
    consistency: any,
    weekly: any,
    feedback: any,
    escalation: any
  ) => {
    const insightCards: InsightCard[] = [];
    
    // High priority alerts
    if (escalation.currentlyEscalated >= 3) {
      insightCards.push({
        id: 'escalation-alert',
        type: 'alert',
        priority: 'high',
        title: 'Multiple Overdue Tasks',
        message: `${escalation.currentlyEscalated} tasks are currently overdue and need immediate attention`,
        actionLabel: 'View Tasks',
        actionType: 'view_overdue',
      });
    }
    
    // Children needing support
    feedback.childrenNeedingSupport.forEach((childId: string) => {
      const child = consistency.childAnalyses.find((c: any) => c.childId === childId);
      if (child) {
        insightCards.push({
          id: `support-${childId}`,
          type: 'warning',
          priority: 'high',
          title: 'Child Needs Support',
          message: `${child.childName} is struggling with task completion and may need your help`,
          childName: child.childName,
          childId,
          actionLabel: 'View Details',
          actionType: 'view_child',
        });
      }
    });
    
    // Success stories
    if (weekly.topPerformer) {
      insightCards.push({
        id: 'top-performer',
        type: 'success',
        priority: 'low',
        title: 'Star Performer!',
        message: `${weekly.topPerformer.childName}: ${weekly.topPerformer.reason}`,
        childName: weekly.topPerformer.childName,
        actionLabel: 'Celebrate',
        actionType: 'celebrate',
      });
    }
    
    // Improvement opportunities
    consistency.systemicIssues.forEach((issue: any, index: number) => {
      insightCards.push({
        id: `systemic-${index}`,
        type: 'info',
        priority: 'medium',
        title: issue.issue,
        message: issue.suggestedSolution,
        actionLabel: 'Learn More',
        actionType: 'learn_more',
        data: issue,
      });
    });
    
    // Photo quality issues
    if (feedback.commonIssues.length > 0) {
      const topIssue = feedback.commonIssues[0];
      insightCards.push({
        id: 'photo-quality',
        type: 'warning',
        priority: 'medium',
        title: 'Common Photo Issue',
        message: `"${topIssue.reason}" occurred ${topIssue.count} times this week. Consider reviewing photo guidelines with children.`,
        actionLabel: 'View Guidelines',
        actionType: 'photo_guidelines',
      });
    }
    
    // Positive trends
    if (weekly.mostImprovedChild && weekly.mostImprovedChild.improvementRate > 10) {
      insightCards.push({
        id: 'most-improved',
        type: 'success',
        priority: 'low',
        title: 'Great Improvement!',
        message: `${weekly.mostImprovedChild.childName} improved by ${weekly.mostImprovedChild.improvementRate.toFixed(0)}% this week`,
        childName: weekly.mostImprovedChild.childName,
        actionLabel: 'View Progress',
        actionType: 'view_progress',
      });
    }
    
    // Sort by priority
    insightCards.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    setInsights(insightCards);
  };

  const extractActionItems = (weekly: any, consistency: any) => {
    const items = [...weekly.actionItems];
    
    // Add recommendations from consistency analysis
    consistency.familyRecommendations.forEach((rec: any) => {
      items.push({
        priority: 'medium',
        action: rec.recommendation,
        reason: rec.expectedBenefit,
      });
    });
    
    // Sort and limit
    items.sort((a, b) => {
      const priorityOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    setActionItems(items.slice(0, 5));
  };

  const getStatusColor = (status: ChildSnapshot['status']) => {
    switch (status) {
      case 'thriving': return theme.colors.success;
      case 'stable': return theme.colors.info;
      case 'needs_attention': return theme.colors.warning;
      case 'struggling': return theme.colors.error;
    }
  };

  const getStatusIcon = (status: ChildSnapshot['status']) => {
    switch (status) {
      case 'thriving': return 'star';
      case 'stable': return 'check-circle';
      case 'needs_attention': return 'alert-triangle';
      case 'struggling': return 'alert-circle';
    }
  };

  const renderOverview = () => {
    return (
      <View style={styles.overviewContainer}>
        {/* Family Score Card */}
        <View
          style={[
            styles.familyScoreCard,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: theme.colors.textSecondary }]}>
              Family Accountability Score
            </Text>
            <TouchableOpacity
              onPress={() => onActionTap?.({ type: 'refresh' })}
            >
              <Feather
                name="refresh-cw"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.scoreContent}>
            <Text style={[styles.scoreValue, { color: theme.colors.primary }]}>
              {familyScore}%
            </Text>
            <View style={styles.scoreProgress}>
              <View
                style={[
                  styles.scoreProgressFill,
                  {
                    width: `${familyScore}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
        
        {/* Children Snapshots */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Children Overview
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {childSnapshots.map((child) => (
            <TouchableOpacity
              key={child.childId}
              style={[
                styles.childCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: getStatusColor(child.status),
                },
              ]}
              onPress={() => onChildSelect?.(child.childId)}
            >
              <View style={styles.childCardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(child.status) + '20' },
                  ]}
                >
                  <Feather
                    name={getStatusIcon(child.status) as any}
                    size={16}
                    color={getStatusColor(child.status)}
                  />
                </View>
                {child.weeklyTrend !== 'stable' && (
                  <Feather
                    name={child.weeklyTrend === 'up' ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={child.weeklyTrend === 'up' ? theme.colors.success : theme.colors.error}
                  />
                )}
              </View>
              
              <Text style={[styles.childName, { color: theme.colors.textPrimary }]}>
                {child.childName}
              </Text>
              
              <Text
                style={[
                  styles.childScore,
                  { color: getStatusColor(child.status) },
                ]}
              >
                {child.consistencyScore}%
              </Text>
              
              <View style={styles.childMetrics}>
                <View style={styles.metricRow}>
                  <Feather name="check" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.metricText, { color: theme.colors.textTertiary }]}>
                    {child.keyMetrics.tasksCompleted} tasks
                  </Text>
                </View>
                
                <View style={styles.metricRow}>
                  <Feather name="clock" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.metricText, { color: theme.colors.textTertiary }]}>
                    {child.keyMetrics.onTimeRate}% on time
                  </Text>
                </View>
                
                {child.keyMetrics.currentStreak > 0 && (
                  <View style={styles.metricRow}>
                    <Feather name="zap" size={12} color={theme.colors.warning} />
                    <Text style={[styles.metricText, { color: theme.colors.warning }]}>
                      {child.keyMetrics.currentStreak} day streak
                    </Text>
                  </View>
                )}
              </View>
              
              {child.topIssue && (
                <View
                  style={[
                    styles.issueTag,
                    { backgroundColor: theme.colors.error + '15' },
                  ]}
                >
                  <Text
                    style={[styles.issueText, { color: theme.colors.error }]}
                    numberOfLines={1}
                  >
                    {child.topIssue}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderInsights = () => {
    return (
      <View style={styles.insightsContainer}>
        {insights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            style={[
              styles.insightCard,
              {
                backgroundColor: theme.colors.surface,
                borderLeftColor: getInsightColor(insight.type),
              },
            ]}
            onPress={() => onActionTap?.(insight)}
          >
            <View style={styles.insightHeader}>
              <Feather
                name={getInsightIcon(insight.type) as any}
                size={20}
                color={getInsightColor(insight.type)}
              />
              <View style={styles.insightTitleContainer}>
                <Text style={[styles.insightTitle, { color: theme.colors.textPrimary }]}>
                  {insight.title}
                </Text>
                {insight.childName && (
                  <Text style={[styles.insightChild, { color: theme.colors.textSecondary }]}>
                    {insight.childName}
                  </Text>
                )}
              </View>
            </View>
            
            <Text style={[styles.insightMessage, { color: theme.colors.textSecondary }]}>
              {insight.message}
            </Text>
            
            {insight.actionLabel && (
              <TouchableOpacity
                style={[
                  styles.insightAction,
                  { backgroundColor: getInsightColor(insight.type) + '15' },
                ]}
                onPress={() => onActionTap?.(insight)}
              >
                <Text style={[styles.insightActionText, { color: getInsightColor(insight.type) }]}>
                  {insight.actionLabel}
                </Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color={getInsightColor(insight.type)}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Recommended Actions
        </Text>
        
        {actionItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => onActionTap?.(item)}
          >
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            />
            
            <View style={styles.actionContent}>
              {item.childName && (
                <Text style={[styles.actionChild, { color: theme.colors.primary }]}>
                  {item.childName}
                </Text>
              )}
              
              <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>
                {item.action}
              </Text>
              
              <Text style={[styles.actionReason, { color: theme.colors.textTertiary }]}>
                {item.reason}
              </Text>
            </View>
            
            <Feather
              name="arrow-right"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getInsightColor = (type: InsightCard['type']) => {
    switch (type) {
      case 'alert': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      case 'info': return theme.colors.info;
    }
  };

  const getInsightIcon = (type: InsightCard['type']) => {
    switch (type) {
      case 'alert': return 'alert-octagon';
      case 'warning': return 'alert-triangle';
      case 'success': return 'check-circle';
      case 'info': return 'info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.info;
      default: return theme.colors.textTertiary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {(['overview', 'insights', 'actions'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && { borderBottomColor: theme.colors.primary },
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === tab
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInsights().then(() => setRefreshing(false));
            }}
          />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'insights' && renderInsights()}
        {selectedTab === 'actions' && renderActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
  },
  familyScoreCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 14,
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreProgress: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  childCard: {
    width: 180,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  childScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  childMetrics: {
    gap: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
  },
  issueTag: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  issueText: {
    fontSize: 10,
    fontWeight: '500',
  },
  insightsContainer: {
    padding: 16,
    gap: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  insightTitleContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightChild: {
    fontSize: 12,
    marginTop: 2,
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 8,
  },
  actionChild: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  actionReason: {
    fontSize: 12,
  },
});