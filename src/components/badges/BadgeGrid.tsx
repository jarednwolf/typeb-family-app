/**
 * Badge Grid Component
 * Displays achievement badges in a responsive grid layout
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../../constants/theme';
import { BadgeDisplay } from './BadgeDisplay';
import { selectAchievementsWithProgress } from '../../store/slices/gamificationSlice';
import { AchievementCategory } from '../../types/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_SIZE = 80;
const BADGE_SPACING = 16;
const BADGES_PER_ROW = Math.floor((SCREEN_WIDTH - 32) / (BADGE_SIZE + BADGE_SPACING));

interface BadgeGridProps {
  category?: AchievementCategory;
  showLocked?: boolean;
  showUnlocked?: boolean;
  onBadgePress?: (achievementId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  headerComponent?: React.ReactElement;
  emptyMessage?: string;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  category,
  showLocked = true,
  showUnlocked = true,
  onBadgePress,
  onRefresh,
  refreshing = false,
  headerComponent,
  emptyMessage = 'No achievements yet. Start completing tasks to earn badges!',
}) => {
  const allAchievements = useSelector(selectAchievementsWithProgress);

  const filteredAchievements = useMemo(() => {
    let filtered = allAchievements;

    // Filter by category if specified
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }

    // Filter by lock status
    if (!showLocked) {
      filtered = filtered.filter(a => a.unlocked);
    }
    if (!showUnlocked) {
      filtered = filtered.filter(a => !a.unlocked);
    }

    // Sort: unlocked first, then by progress percentage
    return filtered.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return b.progressPercentage - a.progressPercentage;
    });
  }, [allAchievements, category, showLocked, showUnlocked]);

  // Group achievements by category for display
  const groupedAchievements = useMemo(() => {
    if (category) {
      // If specific category, don't group
      return [{ category, achievements: filteredAchievements }];
    }

    // Group by category
    const groups: Record<AchievementCategory, typeof filteredAchievements> = {
      milestone: [],
      streak: [],
      special: [],
      helper: [],
      family: [],
    };

    filteredAchievements.forEach(achievement => {
      groups[achievement.category].push(achievement);
    });

    // Convert to array and filter out empty groups
    return Object.entries(groups)
      .filter(([_, achievements]) => achievements.length > 0)
      .map(([category, achievements]) => ({
        category: category as AchievementCategory,
        achievements,
      }));
  }, [filteredAchievements, category]);

  const getCategoryTitle = (cat: AchievementCategory): string => {
    const titles: Record<AchievementCategory, string> = {
      milestone: '🎯 Milestones',
      streak: '🔥 Streaks',
      special: '⭐ Special',
      helper: '🤝 Collaboration',
      family: '👨‍👩‍👧‍👦 Family',
    };
    return titles[cat];
  };

  const renderBadgeRow = (achievements: typeof filteredAchievements, startIndex: number) => {
    const badges = [];
    const endIndex = Math.min(startIndex + BADGES_PER_ROW, achievements.length);

    for (let i = startIndex; i < endIndex; i++) {
      badges.push(
        <View key={achievements[i].id} style={styles.badgeWrapper}>
          <BadgeDisplay
            achievement={achievements[i]}
            size="medium"
            showProgress={true}
            showName={true}
            animated={true}
            onPress={() => onBadgePress?.(achievements[i].id)}
          />
        </View>
      );
    }

    // Add empty spaces to maintain grid alignment
    while (badges.length < BADGES_PER_ROW) {
      badges.push(
        <View key={`empty-${startIndex}-${badges.length}`} style={styles.badgeWrapper} />
      );
    }

    return (
      <View key={`row-${startIndex}`} style={styles.row}>
        {badges}
      </View>
    );
  };

  const renderCategory = (group: { category: AchievementCategory; achievements: typeof filteredAchievements }) => {
    const rows = [];
    for (let i = 0; i < group.achievements.length; i += BADGES_PER_ROW) {
      rows.push(renderBadgeRow(group.achievements, i));
    }

    return (
      <View key={group.category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{getCategoryTitle(group.category)}</Text>
        {rows}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
    >
      {headerComponent}

      {filteredAchievements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredAchievements.filter(a => a.unlocked).length}
              </Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredAchievements.length}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(
                  (filteredAchievements.filter(a => a.unlocked).length / 
                   filteredAchievements.length) * 100
                )}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          {/* Badge Grid */}
          {groupedAchievements.map(renderCategory)}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.XXL,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.M,
    marginVertical: theme.spacing.M,
    padding: theme.spacing.M,
    borderRadius: theme.borderRadius.large,
    ...theme.elevation[2],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.separator,
    marginVertical: theme.spacing.XS,
  },
  categorySection: {
    marginTop: theme.spacing.L,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.M,
    marginBottom: theme.spacing.M,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.M,
    marginBottom: theme.spacing.L,
  },
  badgeWrapper: {
    width: BADGE_SIZE + BADGE_SPACING,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.XXL * 2,
    paddingHorizontal: theme.spacing.XL,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BadgeGrid;