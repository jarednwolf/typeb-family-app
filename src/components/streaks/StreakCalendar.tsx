/**
 * Streak Calendar Component
 * Visual calendar showing streak history
 * Inspired by contribution graphs, but for personal progress
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useHaptics } from '../../utils/haptics';

interface StreakCalendarProps {
  streakDates: Date[];
  onDatePress?: (date: Date) => void;
  showMonthLabels?: boolean;
  showDayLabels?: boolean;
}

const CELL_SIZE = 40;
const CELL_MARGIN = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  streakDates,
  onDatePress,
  showMonthLabels = true,
  showDayLabels = true,
}) => {
  const haptics = useHaptics();

  // Generate calendar data for the last 12 weeks
  const calendarData = useMemo(() => {
    const weeks: Date[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from 12 weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 84); // 12 weeks * 7 days
    
    // Adjust to the beginning of the week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate 12 weeks of dates
    for (let week = 0; week < 12; week++) {
      const weekDates: Date[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        weekDates.push(currentDate);
      }
      weeks.push(weekDates);
    }
    
    return weeks;
  }, []);

  // Check if a date has a streak
  const hasStreak = (date: Date): boolean => {
    const dateStr = date.toDateString();
    return streakDates.some(streakDate => 
      new Date(streakDate).toDateString() === dateStr
    );
  };

  // Get intensity level for visual feedback
  const getIntensity = (date: Date): string => {
    if (!hasStreak(date)) return theme.colors.inputBackground;
    
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return theme.colors.success; // Today
    if (diffDays < 7) return theme.colors.primary; // This week
    if (diffDays < 30) return theme.colors.info; // This month
    return theme.colors.textTertiary; // Older
  };

  const handleDatePress = (date: Date) => {
    if (onDatePress) {
      haptics.selection();
      onDatePress(date);
    }
  };

  const getDayLabel = (dayIndex: number): string => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[dayIndex];
  };

  const getMonthLabel = (date: Date): string | null => {
    if (date.getDate() <= 7) {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Streak Journey</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.calendarContainer}>
          {/* Day labels */}
          {showDayLabels && (
            <View style={styles.dayLabelsColumn}>
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <View key={day} style={styles.dayLabel}>
                  <Text style={styles.dayLabelText}>{getDayLabel(day)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Calendar grid */}
          <View style={styles.weeksContainer}>
            {/* Month labels row */}
            {showMonthLabels && (
              <View style={styles.monthLabelsRow}>
                {calendarData.map((week, weekIndex) => {
                  const monthLabel = getMonthLabel(week[0]);
                  return (
                    <View key={weekIndex} style={styles.monthLabelContainer}>
                      {monthLabel && (
                        <Text style={styles.monthLabel}>{monthLabel}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Weeks */}
            <View style={styles.weeks}>
              {calendarData.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((date, dayIndex) => {
                    const intensity = getIntensity(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isFuture = date > new Date();
                    
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.day,
                          { backgroundColor: intensity },
                          isToday && styles.today,
                          isFuture && styles.futureDay,
                        ]}
                        onPress={() => !isFuture && handleDatePress(date)}
                        disabled={isFuture}
                      >
                        {hasStreak(date) && !isFuture && (
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color="white"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Activity:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.colors.inputBackground }]} />
            <Text style={styles.legendText}>None</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.colors.textTertiary }]} />
            <Text style={styles.legendText}>Past</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.colors.info }]} />
            <Text style={styles.legendText}>Recent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>This Week</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.statValue}>{streakDates.length}</Text>
          <Text style={styles.statLabel}>Total Days</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="percent"
            size={20}
            color={theme.colors.success}
          />
          <Text style={styles.statValue}>
            {Math.round((streakDates.length / 84) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="fire"
            size={20}
            color={theme.colors.error}
          />
          <Text style={styles.statValue}>
            {getLongestStreak(streakDates)}
          </Text>
          <Text style={styles.statLabel}>Longest</Text>
        </View>
      </View>
    </View>
  );
};

// Helper function to calculate longest streak
const getLongestStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let longest = 1;
  let current = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (daysDiff > 1) {
      current = 1;
    }
  }
  
  return longest;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.M,
    marginVertical: theme.spacing.S,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.M,
  },
  scrollContent: {
    paddingRight: theme.spacing.M,
  },
  calendarContainer: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    marginRight: theme.spacing.XS,
    marginTop: 20, // Align with calendar grid
  },
  dayLabel: {
    height: CELL_SIZE + CELL_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabelText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  weeksContainer: {
    flex: 1,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    height: 20,
  },
  monthLabelContainer: {
    width: CELL_SIZE + CELL_MARGIN,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  weeks: {
    flexDirection: 'row',
  },
  week: {
    marginRight: CELL_MARGIN,
  },
  day: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: CELL_MARGIN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  futureDay: {
    opacity: 0.3,
  },
  legend: {
    marginTop: theme.spacing.M,
    paddingTop: theme.spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  legendTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.XS,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.M,
    paddingTop: theme.spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

export default StreakCalendar;