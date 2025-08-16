import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { taskConsistencyAnalyzer } from '../../services/TaskConsistencyAnalyzer';
import { weeklySummaryService } from '../../services/WeeklySummaryService';

const { width: screenWidth } = Dimensions.get('window');

interface CompletionPatternsProps {
  familyId: string;
  childId?: string; // Optional: show patterns for specific child
  onInsightTap?: (insight: any) => void;
}

interface HeatmapData {
  day: string;
  hour: number;
  value: number; // 0-100 completion rate
  taskCount: number;
}

interface PatternCard {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
}

export const CompletionPatterns: React.FC<CompletionPatternsProps> = ({
  familyId,
  childId,
  onInsightTap,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'heatmap' | 'patterns' | 'trends'>('patterns');
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [patternCards, setPatternCards] = useState<PatternCard[]>([]);
  const [weeklyPattern, setWeeklyPattern] = useState<number[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [consistencyScore, setConsistencyScore] = useState(0);

  useEffect(() => {
    loadPatternData();
  }, [familyId, childId]);

  const loadPatternData = async () => {
    try {
      setLoading(true);
      
      // Get consistency analysis
      const analysis = await taskConsistencyAnalyzer.analyzeFamilyConsistency(familyId, 30);
      
      // Get weekly summary for recent patterns
      const weeklySummary = await weeklySummaryService.generateWeeklySummary(familyId);
      
      // Process data based on whether we're showing family or child view
      if (childId) {
        const childAnalysis = analysis.childAnalyses.find(c => c.childId === childId);
        if (childAnalysis) {
          processChildPatterns(childAnalysis, weeklySummary);
        }
      } else {
        processFamilyPatterns(analysis, weeklySummary);
      }
      
    } catch (error) {
      console.error('Failed to load pattern data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChildPatterns = (childAnalysis: any, weeklySummary: any) => {
    // Set consistency score
    setConsistencyScore(childAnalysis.overallConsistencyScore);
    
    // Set weekly pattern
    setWeeklyPattern(childAnalysis.weeklyCompletionPattern);
    
    // Generate heatmap data
    const heatmap = generateHeatmapData(childAnalysis.timePatterns);
    setHeatmapData(heatmap);
    
    // Create pattern cards
    const cards: PatternCard[] = [
      {
        title: 'Consistency Score',
        value: `${childAnalysis.overallConsistencyScore}%`,
        trend: childAnalysis.monthlyTrend === 'improving' ? 'up' : 
               childAnalysis.monthlyTrend === 'declining' ? 'down' : 'stable',
        color: getScoreColor(childAnalysis.overallConsistencyScore),
        icon: 'target',
      },
      {
        title: 'Best Day',
        value: childAnalysis.bestDays[0] || 'No pattern',
        trend: 'stable',
        color: theme.colors.success,
        icon: 'calendar',
      },
      {
        title: 'Optimal Time',
        value: childAnalysis.optimalTimeSlots[0] || 'Varies',
        trend: 'stable',
        color: theme.colors.info,
        icon: 'clock',
      },
      {
        title: 'Weekly Streak',
        value: calculateStreak(childAnalysis.weeklyCompletionPattern),
        trend: childAnalysis.weeklyCompletionPattern[6] > childAnalysis.weeklyCompletionPattern[0] ? 'up' : 'down',
        color: theme.colors.warning,
        icon: 'zap',
      },
    ];
    setPatternCards(cards);
    
    // Generate insights
    const childInsights = generateChildInsights(childAnalysis);
    setInsights(childInsights);
  };

  const processFamilyPatterns = (analysis: any, weeklySummary: any) => {
    // Set family consistency score
    setConsistencyScore(analysis.familyConsistencyScore);
    
    // Calculate average weekly pattern
    const avgPattern = calculateAveragePattern(analysis.childAnalyses);
    setWeeklyPattern(avgPattern);
    
    // Generate family heatmap
    const heatmap = generateFamilyHeatmap(analysis.childAnalyses);
    setHeatmapData(heatmap);
    
    // Create family pattern cards
    const cards: PatternCard[] = [
      {
        title: 'Family Score',
        value: `${analysis.familyConsistencyScore}%`,
        trend: determineFamilyTrend(analysis.childAnalyses),
        color: getScoreColor(analysis.familyConsistencyScore),
        icon: 'users',
      },
      {
        title: 'Completion Rate',
        value: `${analysis.averageCompletionRate.toFixed(0)}%`,
        trend: weeklySummary.overallCompletionRate > 75 ? 'up' : 'down',
        color: theme.colors.primary,
        icon: 'check-circle',
      },
      {
        title: 'Active Children',
        value: analysis.childAnalyses.filter((c: any) => c.overallConsistencyScore > 60).length,
        trend: 'stable',
        color: theme.colors.success,
        icon: 'activity',
      },
      {
        title: 'Issues',
        value: analysis.systemicIssues.length,
        trend: analysis.systemicIssues.length > 0 ? 'down' : 'stable',
        color: analysis.systemicIssues.length > 0 ? theme.colors.error : theme.colors.success,
        icon: 'alert-circle',
      },
    ];
    setPatternCards(cards);
    
    // Generate family insights
    const familyInsights = generateFamilyInsights(analysis, weeklySummary);
    setInsights(familyInsights);
  };

  const generateHeatmapData = (timePatterns: any[]): HeatmapData[] => {
    const heatmap: HeatmapData[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [6, 9, 12, 15, 18, 21]; // Key hours of the day
    
    days.forEach(day => {
      hours.forEach(hour => {
        // Find pattern for this day/time combination
        const pattern = timePatterns.find((p: any) => p.dayOfWeek.startsWith(day));
        const value = pattern ? pattern.completionRate : 0;
        
        heatmap.push({
          day,
          hour,
          value,
          taskCount: pattern?.taskCount || 0,
        });
      });
    });
    
    return heatmap;
  };

  const generateFamilyHeatmap = (childAnalyses: any[]): HeatmapData[] => {
    // Aggregate all child patterns for family view
    const aggregated = new Map<string, { total: number; count: number }>();
    
    childAnalyses.forEach((child: any) => {
      child.timePatterns.forEach((pattern: any) => {
        const key = pattern.dayOfWeek;
        const existing = aggregated.get(key) || { total: 0, count: 0 };
        existing.total += pattern.completionRate;
        existing.count += 1;
        aggregated.set(key, existing);
      });
    });
    
    const heatmap: HeatmapData[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [6, 9, 12, 15, 18, 21];
    
    days.forEach(day => {
      hours.forEach(hour => {
        const dayData = Array.from(aggregated.entries()).find(([key]) => key.startsWith(day));
        const value = dayData ? dayData[1].total / dayData[1].count : 0;
        
        heatmap.push({
          day,
          hour,
          value,
          taskCount: dayData ? dayData[1].count : 0,
        });
      });
    });
    
    return heatmap;
  };

  const calculateAveragePattern = (childAnalyses: any[]): number[] => {
    const pattern = [0, 0, 0, 0, 0, 0, 0];
    
    childAnalyses.forEach((child: any) => {
      child.weeklyCompletionPattern.forEach((value: number, index: number) => {
        pattern[index] += value;
      });
    });
    
    return pattern.map(v => v / childAnalyses.length);
  };

  const calculateStreak = (pattern: number[]): string => {
    let streak = 0;
    for (let i = pattern.length - 1; i >= 0; i--) {
      if (pattern[i] >= 80) {
        streak++;
      } else {
        break;
      }
    }
    return `${streak} days`;
  };

  const determineFamilyTrend = (childAnalyses: any[]): 'up' | 'down' | 'stable' => {
    const trends = childAnalyses.map((c: any) => c.monthlyTrend);
    const improving = trends.filter((t: string) => t === 'improving').length;
    const declining = trends.filter((t: string) => t === 'declining').length;
    
    if (improving > declining) return 'up';
    if (declining > improving) return 'down';
    return 'stable';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const generateChildInsights = (analysis: any): string[] => {
    const insights: string[] = [];
    
    if (analysis.overallConsistencyScore >= 80) {
      insights.push('🌟 Excellent consistency! Keep up the great work!');
    }
    
    if (analysis.bestDays.length > 0) {
      insights.push(`📅 Performs best on ${analysis.bestDays.join(', ')}`);
    }
    
    if (analysis.optimalTimeSlots.length > 0) {
      insights.push(`⏰ Most productive during ${analysis.optimalTimeSlots[0]}`);
    }
    
    if (analysis.monthlyTrend === 'improving') {
      insights.push('📈 Showing consistent improvement this month');
    }
    
    if (analysis.problemPatterns.length > 0) {
      insights.push(`⚠️ Needs support with: ${analysis.problemPatterns[0].pattern}`);
    }
    
    return insights;
  };

  const generateFamilyInsights = (analysis: any, summary: any): string[] => {
    const insights: string[] = [];
    
    if (analysis.familyConsistencyScore >= 80) {
      insights.push('🏆 Outstanding family accountability!');
    }
    
    if (summary.topPerformer) {
      insights.push(`⭐ ${summary.topPerformer.childName} is leading the family`);
    }
    
    if (summary.mostImprovedChild && summary.mostImprovedChild.improvementRate > 10) {
      insights.push(`📈 ${summary.mostImprovedChild.childName} improved by ${summary.mostImprovedChild.improvementRate.toFixed(0)}%`);
    }
    
    if (analysis.commonStrengths.length > 0) {
      insights.push(`💪 Family strength: ${analysis.commonStrengths[0]}`);
    }
    
    if (analysis.systemicIssues.length > 0) {
      insights.push(`🎯 Focus area: ${analysis.systemicIssues[0].issue}`);
    }
    
    return insights;
  };

  const renderHeatmap = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [6, 9, 12, 15, 18, 21];
    
    return (
      <View style={styles.heatmapContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Activity Heatmap
        </Text>
        
        <View style={styles.heatmapGrid}>
          {/* Hour labels */}
          <View style={styles.heatmapRow}>
            <View style={styles.heatmapCorner} />
            {hours.map(hour => (
              <View key={hour} style={styles.heatmapHeader}>
                <Text style={[styles.heatmapLabel, { color: theme.colors.textSecondary }]}>
                  {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Day rows */}
          {days.map(day => (
            <View key={day} style={styles.heatmapRow}>
              <View style={styles.heatmapDayLabel}>
                <Text style={[styles.heatmapLabel, { color: theme.colors.textSecondary }]}>
                  {day}
                </Text>
              </View>
              
              {hours.map(hour => {
                const data = heatmapData.find(d => d.day === day && d.hour === hour);
                const intensity = data ? data.value / 100 : 0;
                const backgroundColor = data
                  ? `rgba(76, 175, 80, ${0.2 + intensity * 0.8})`
                  : theme.colors.backgroundTertiary;
                
                return (
                  <TouchableOpacity
                    key={`${day}-${hour}`}
                    style={[
                      styles.heatmapCell,
                      { backgroundColor },
                    ]}
                    onPress={() => {
                      if (data && data.taskCount > 0) {
                        onInsightTap?.({
                          type: 'time_pattern',
                          day,
                          hour,
                          completionRate: data.value,
                          taskCount: data.taskCount,
                        });
                      }
                    }}
                  >
                    {data && data.taskCount > 0 && (
                      <Text style={styles.heatmapCellText}>
                        {Math.round(data.value)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPatternCards = () => {
    return (
      <View style={styles.cardsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Key Patterns
        </Text>
        
        <View style={styles.cardsGrid}>
          {patternCards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.patternCard,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => onInsightTap?.(card)}
            >
              <View style={styles.cardHeader}>
                <Feather name={card.icon as any} size={20} color={card.color} />
                {card.trend !== 'stable' && (
                  <Feather
                    name={card.trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={card.trend === 'up' ? theme.colors.success : theme.colors.error}
                  />
                )}
              </View>
              
              <Text style={[styles.cardValue, { color: card.color }]}>
                {card.value}
              </Text>
              
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                {card.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderWeeklyTrend = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const maxValue = Math.max(...weeklyPattern, 100);
    
    return (
      <View style={styles.trendContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Weekly Trend
        </Text>
        
        <View style={styles.trendChart}>
          {weeklyPattern.map((value, index) => {
            const height = (value / maxValue) * 100;
            const color = value >= 80 ? theme.colors.success :
                         value >= 60 ? theme.colors.warning :
                         theme.colors.error;
            
            return (
              <View key={index} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      height: `${height}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
                <Text style={[styles.trendBarLabel, { color: theme.colors.textSecondary }]}>
                  {days[index]}
                </Text>
                <Text style={[styles.trendBarValue, { color: theme.colors.textTertiary }]}>
                  {Math.round(value)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    return (
      <View style={styles.insightsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Insights
        </Text>
        
        {insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.insightCard,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
            onPress={() => onInsightTap?.({ type: 'insight', text: insight })}
          >
            <Text style={[styles.insightText, { color: theme.colors.textPrimary }]}>
              {insight}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* View Selector */}
      <View style={styles.viewSelector}>
        {['patterns', 'heatmap', 'trends'].map((view) => (
          <TouchableOpacity
            key={view}
            style={[
              styles.viewTab,
              {
                backgroundColor: selectedView === view
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              },
            ]}
            onPress={() => setSelectedView(view as any)}
          >
            <Text
              style={[
                styles.viewTabText,
                {
                  color: selectedView === view
                    ? theme.colors.white
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Consistency Score Banner */}
      <View
        style={[
          styles.scoreBanner,
          { backgroundColor: getScoreColor(consistencyScore) + '20' },
        ]}
      >
        <View style={styles.scoreContent}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
            {childId ? 'Personal' : 'Family'} Consistency
          </Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(consistencyScore) }]}>
            {consistencyScore}%
          </Text>
        </View>
        
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${consistencyScore}%`,
                backgroundColor: getScoreColor(consistencyScore),
              },
            ]}
          />
        </View>
      </View>
      
      {/* Content based on selected view */}
      {selectedView === 'patterns' && renderPatternCards()}
      {selectedView === 'heatmap' && renderHeatmap()}
      {selectedView === 'trends' && renderWeeklyTrend()}
      
      {/* Always show insights */}
      {renderInsights()}
    </ScrollView>
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
  viewSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  patternCard: {
    width: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
  },
  heatmapContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heatmapGrid: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  heatmapRow: {
    flexDirection: 'row',
  },
  heatmapCorner: {
    width: 40,
    height: 30,
  },
  heatmapHeader: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapDayLabel: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  heatmapCell: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heatmapCellText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  trendContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  trendChart: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    gap: 8,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 4,
  },
  trendBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  trendBarValue: {
    fontSize: 8,
  },
  insightsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  insightCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});