import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ChildAccountability {
  childId: string;
  name: string;
  avatar: string;
  todayTotal: number;
  todayCompleted: number;
  pendingVerification: number;
  currentStreak: number;
  completionRate: number;
  lastActivity: Date | null;
  overdueCount: number;
}

interface AccountabilityMetricsProps {
  children: ChildAccountability[];
  tasks: any[];
}

const HABIT_FORMATION_DAYS = 21;
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const AccountabilityMetrics: React.FC<AccountabilityMetricsProps> = ({ children, tasks }) => {
  const { theme, isDarkMode } = useTheme();

  // Calculate habit formation progress for each child
  const habitMetrics = useMemo(() => {
    return children.map(child => {
      const childTasks = tasks.filter(t => t.assignedTo === child.childId);
      
      // Get last 21 days of activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - HABIT_FORMATION_DAYS + 1);
      
      const dailyCompletion: { [key: string]: boolean } = {};
      const tasksByDay: { [key: string]: { total: number; completed: number } } = {};
      
      // Initialize all days
      for (let i = 0; i < HABIT_FORMATION_DAYS; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyCompletion[dateKey] = false;
        tasksByDay[dateKey] = { total: 0, completed: 0 };
      }
      
      // Process tasks
      childTasks.forEach(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const dateKey = dueDate.toISOString().split('T')[0];
          
          if (dateKey in tasksByDay) {
            tasksByDay[dateKey].total++;
            if (task.status === 'completed') {
              tasksByDay[dateKey].completed++;
            }
          }
        }
      });
      
      // Calculate daily completion
      Object.keys(tasksByDay).forEach(dateKey => {
        if (tasksByDay[dateKey].total > 0) {
          dailyCompletion[dateKey] = 
            tasksByDay[dateKey].completed === tasksByDay[dateKey].total;
        }
      });
      
      // Calculate habit score (percentage of days with full completion)
      const completeDays = Object.values(dailyCompletion).filter(v => v).length;
      const habitScore = Math.round((completeDays / HABIT_FORMATION_DAYS) * 100);
      
      // Find longest streak in the 21-day period
      let maxStreak = 0;
      let currentPeriodStreak = 0;
      Object.keys(dailyCompletion).sort().forEach(dateKey => {
        if (dailyCompletion[dateKey]) {
          currentPeriodStreak++;
          maxStreak = Math.max(maxStreak, currentPeriodStreak);
        } else {
          currentPeriodStreak = 0;
        }
      });
      
      return {
        childId: child.childId,
        name: child.name,
        avatar: child.avatar,
        habitScore,
        dailyCompletion,
        currentStreak: child.currentStreak,
        maxStreakInPeriod: maxStreak,
        tasksByDay,
      };
    });
  }, [children, tasks]);

  // Calculate weekly patterns
  const weeklyPatterns = useMemo(() => {
    const patterns: { [day: number]: { completed: number; total: number } } = {};
    
    // Initialize days
    for (let i = 0; i < 7; i++) {
      patterns[i] = { completed: 0, total: 0 };
    }
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const dayOfWeek = dueDate.getDay();
        patterns[dayOfWeek].total++;
        if (task.status === 'completed') {
          patterns[dayOfWeek].completed++;
        }
      }
    });
    
    return patterns;
  }, [tasks]);

  const getHabitStageLabel = (score: number) => {
    if (score >= 90) return { label: 'Habit Formed! 🎉', color: theme.colors.success };
    if (score >= 70) return { label: 'Almost There! 💪', color: theme.colors.info };
    if (score >= 50) return { label: 'Building Momentum 📈', color: theme.colors.warning };
    if (score >= 30) return { label: 'Getting Started 🌱', color: theme.colors.warning };
    return { label: 'Early Days 🌅', color: theme.colors.textSecondary };
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.L,
    },
    metricsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.L,
      marginBottom: theme.spacing.M,
      ...theme.shadows.small,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.M,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    habitScore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.XS,
    },
    scoreValue: {
      fontSize: 24,
      fontWeight: '700',
    },
    scoreLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    habitGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: theme.spacing.M,
    },
    dayCell: {
      width: (screenWidth - theme.spacing.L * 2 - theme.spacing.L * 2 - 4 * 6) / 7,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.backgroundTexture,
    },
    dayCompleted: {
      backgroundColor: theme.colors.success,
    },
    dayPartial: {
      backgroundColor: theme.colors.warning,
    },
    dayMissed: {
      backgroundColor: theme.colors.error + '30',
    },
    dayFuture: {
      backgroundColor: theme.colors.separator,
      opacity: 0.5,
    },
    dayNumber: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    dayNumberCompleted: {
      color: theme.colors.white,
    },
    habitStage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.S,
      borderTopWidth: 1,
      borderTopColor: theme.colors.separator,
    },
    stageLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    streakInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.XXS,
    },
    streakText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    childMetric: {
      marginBottom: theme.spacing.M,
    },
    childHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.S,
      marginBottom: theme.spacing.S,
    },
    childAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.white,
    },
    childName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    weeklyPattern: {
      marginTop: theme.spacing.M,
    },
    weeklyTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.S,
    },
    weekDays: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.XS,
    },
    weekDay: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayLabel: {
      fontSize: 10,
      color: theme.colors.textTertiary,
      marginBottom: 4,
    },
    weekDayBar: {
      width: '80%',
      height: 40,
      backgroundColor: theme.colors.separator,
      borderRadius: theme.borderRadius.small,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    weekDayFill: {
      width: '100%',
      borderRadius: theme.borderRadius.small,
    },
    insightCard: {
      backgroundColor: isDarkMode ? theme.colors.info + '20' : theme.colors.info + '10',
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.M,
      marginTop: theme.spacing.M,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.S,
    },
    insightIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.info,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.M,
      marginTop: theme.spacing.S,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.XS,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: theme.borderRadius.small,
    },
    legendText: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
  });

  // Generate insight based on data
  const generateInsight = () => {
    const avgHabitScore = Math.round(
      habitMetrics.reduce((sum, m) => sum + m.habitScore, 0) / habitMetrics.length
    );
    
    if (avgHabitScore >= 80) {
      return "🎉 Excellent progress! Your family is building strong accountability habits.";
    } else if (avgHabitScore >= 60) {
      return "📈 Good momentum! Keep encouraging consistency to build lasting habits.";
    } else if (avgHabitScore >= 40) {
      return "🌱 You're on the right track. Focus on daily completion to build momentum.";
    } else {
      return "💡 Tip: Start with smaller, achievable daily goals to build consistency.";
    }
  };

  return (
    <ScrollView 
      horizontal={false}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      {/* 21-Day Habit Formation Tracker */}
      <View style={styles.metricsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>21-Day Habit Formation</Text>
          <Feather name="trending-up" size={20} color={theme.colors.primary} />
        </View>
        
        {habitMetrics.map(metric => (
          <View key={metric.childId} style={styles.childMetric}>
            <View style={styles.childHeader}>
              <View style={styles.childAvatar}>
                <Text style={styles.avatarText}>{metric.avatar}</Text>
              </View>
              <Text style={styles.childName}>{metric.name}</Text>
              <View style={styles.habitScore}>
                <Text style={[
                  styles.scoreValue,
                  { color: getHabitStageLabel(metric.habitScore).color }
                ]}>
                  {metric.habitScore}%
                </Text>
              </View>
            </View>
            
            <View style={styles.habitGrid}>
              {Object.keys(metric.dailyCompletion).sort().map((dateKey, index) => {
                const date = new Date(dateKey);
                const isToday = date.toDateString() === new Date().toDateString();
                const isFuture = date > new Date();
                const dayNum = index + 1;
                const tasks = metric.tasksByDay[dateKey];
                const hasCompleted = metric.dailyCompletion[dateKey];
                const hasPartial = tasks.completed > 0 && tasks.completed < tasks.total;
                
                return (
                  <View
                    key={dateKey}
                    style={[
                      styles.dayCell,
                      hasCompleted && styles.dayCompleted,
                      hasPartial && styles.dayPartial,
                      !hasCompleted && !hasPartial && tasks.total > 0 && styles.dayMissed,
                      isFuture && styles.dayFuture,
                      isToday && { borderWidth: 2, borderColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={[
                      styles.dayNumber,
                      hasCompleted && styles.dayNumberCompleted,
                    ]}>
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <View style={styles.habitStage}>
              <Text style={[
                styles.stageLabel,
                { color: getHabitStageLabel(metric.habitScore).color }
              ]}>
                {getHabitStageLabel(metric.habitScore).label}
              </Text>
              <View style={styles.streakInfo}>
                <Feather name="zap" size={14} color={theme.colors.warning} />
                <Text style={styles.streakText}>
                  {metric.currentStreak} day streak
                </Text>
              </View>
            </View>
          </View>
        ))}
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.legendText}>Complete</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.error + '30' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </View>

      {/* Weekly Pattern Analysis */}
      <View style={styles.metricsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Completion Patterns</Text>
          <Feather name="bar-chart-2" size={20} color={theme.colors.primary} />
        </View>
        
        <View style={styles.weeklyPattern}>
          <View style={styles.weekDays}>
            {WEEK_DAYS.map((day, index) => {
              const pattern = weeklyPatterns[index];
              const percentage = pattern.total > 0 
                ? (pattern.completed / pattern.total) * 100 
                : 0;
              
              return (
                <View key={index} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{day}</Text>
                  <View style={styles.weekDayBar}>
                    <View 
                      style={[
                        styles.weekDayFill,
                        {
                          height: `${percentage}%`,
                          backgroundColor: percentage >= 80 
                            ? theme.colors.success
                            : percentage >= 50
                              ? theme.colors.warning
                              : theme.colors.error,
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Feather name="info" size={16} color={theme.colors.white} />
          </View>
          <Text style={styles.insightText}>
            {generateInsight()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default AccountabilityMetrics;