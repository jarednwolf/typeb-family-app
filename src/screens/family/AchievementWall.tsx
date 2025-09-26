/**
 * Achievement Wall Screen
 * Family success showcase with chronological achievement feed
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { format, parseISO, isWithinInterval, subDays, subMonths } from 'date-fns';
import { RootState, AppDispatch } from '../../store/store';
import { selectFamily, selectFamilyMembers } from '../../store/slices/familySlice';
import { selectUserProfile } from '../../store/slices/authSlice';
import { Achievement, Celebration, UserAchievement, FamilyAchievement } from '../../types/achievements';
import { colors, typography, spacing } from '../../constants/themeExtended';
import {
  getAchievementWallData,
  getAchievementStats,
  getInProgressAchievements,
  subscribeToAchievements,
  markCelebrationSeen,
  AchievementItem,
} from '../../services/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterCategory = 'all' | 'milestone' | 'streak' | 'special' | 'helper' | 'family';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'quarter';

const AchievementWall: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);
  const currentUser = useSelector(selectUserProfile);
  
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<AchievementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load achievements
  const loadAchievements = useCallback(async (isInitial = false) => {
    if (!family) return;
    
    try {
      if (isInitial) {
        setIsLoading(true);
      }
      
      // Fetch real achievements from Firebase
      const achievementsData = await getAchievementWallData(family.id, {
        memberId: selectedMember !== 'all' ? selectedMember : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      
      setAchievements(achievementsData);
      setFilteredAchievements(achievementsData);
      
      // Check if there are more pages to load
      setHasMore(achievementsData.length >= 50);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [family, selectedMember, selectedCategory]);

  // Filter achievements
  useEffect(() => {
    let filtered = [...achievements];
    
    // Filter by member
    if (selectedMember !== 'all') {
      filtered = filtered.filter(item => 
        item.type === 'user' && item.userAchievement?.userId === selectedMember
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.achievement.category === selectedCategory
      );
    }
    
    // Filter by date range
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (selectedDateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(item => 
        isWithinInterval(item.timestamp, { start: startDate, end: now })
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.achievement.name.toLowerCase().includes(query) ||
        item.achievement.description.toLowerCase().includes(query) ||
        item.memberName?.toLowerCase().includes(query)
      );
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setFilteredAchievements(filtered);
  }, [achievements, selectedMember, selectedCategory, selectedDateRange, searchQuery]);

  // Initial load and subscribe to real-time updates
  useEffect(() => {
    if (!family) return;
    
    loadAchievements(true);
    
    // Subscribe to real-time achievement updates
    const unsubscribe = subscribeToAchievements(family.id, (updatedAchievements) => {
      // Apply current filters
      let filtered = [...updatedAchievements];
      
      if (selectedMember !== 'all') {
        filtered = filtered.filter(item =>
          item.type === 'user' && item.userAchievement?.userId === selectedMember
        );
      }
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(item =>
          item.achievement.category === selectedCategory
        );
      }
      
      setAchievements(updatedAchievements);
      setFilteredAchievements(filtered);
    });
    
    return () => {
      unsubscribe();
    };
  }, [family, selectedMember, selectedCategory]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAchievements(false);
  }, [loadAchievements]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    
    // TODO: Implement pagination
    setPage(prev => prev + 1);
  }, [hasMore, isLoading]);

  // Handle celebration click
  const handleCelebrationSeen = useCallback(async (item: AchievementItem) => {
    if (item.celebration && !item.celebration.seen) {
      await markCelebrationSeen(item.celebration.id);
    }
  }, []);

  // Render achievement item
  const renderAchievementItem = ({ item }: { item: AchievementItem }) => {
    const levelColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };

    return (
      <TouchableOpacity
        style={styles.achievementCard}
        activeOpacity={0.9}
        onPress={() => handleCelebrationSeen(item)}
      >
        {/* Achievement Header */}
        <View style={styles.achievementHeader}>
          <View style={styles.achievementUser}>
            {item.memberAvatar ? (
              <Image source={{ uri: item.memberAvatar }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={20} color={colors.gray400} />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.memberName || 'Unknown'}</Text>
              <Text style={styles.achievementTime}>
                {format(item.timestamp, 'MMM d, yyyy • h:mm a')}
              </Text>
            </View>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: levelColors[item.achievement.level] }]}>
            <Text style={styles.levelText}>{item.achievement.level.toUpperCase()}</Text>
          </View>
        </View>

        {/* Achievement Content */}
        <View style={styles.achievementContent}>
          <View style={styles.achievementIcon}>
            <Icon name={item.achievement.icon as any} size={32} color={colors.primary} />
          </View>
          <View style={styles.achievementDetails}>
            <Text style={styles.achievementName}>{item.achievement.name}</Text>
            <Text style={styles.achievementDescription}>{item.achievement.description}</Text>
            {item.achievement.encouragementMessage && (
              <View style={styles.encouragementBox}>
                <Icon name="heart" size={14} color={colors.success} />
                <Text style={styles.encouragementText}>
                  {item.achievement.encouragementMessage}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Bar (if not completed) */}
        {item.userAchievement && item.userAchievement.progress < item.userAchievement.maxProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(item.userAchievement.progress / item.userAchievement.maxProgress) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.userAchievement.progress} / {item.userAchievement.maxProgress}
            </Text>
          </View>
        )}

        {/* Celebration Indicator */}
        {item.celebration && !item.celebration.seen && (
          <View style={styles.celebrationIndicator}>
            <Icon name="gift" size={16} color={colors.white} />
            <Text style={styles.celebrationText}>New Celebration!</Text>
          </View>
        )}

        {/* Contributors (for family achievements) */}
        {item.type === 'family' && item.familyAchievement && (
          <View style={styles.contributorsSection}>
            <Text style={styles.contributorsLabel}>Contributors:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.familyAchievement.contributors.map((contributorId, index) => {
                const contributor = members.find(m => m.id === contributorId);
                return (
                  <View key={contributorId} style={styles.contributor}>
                    {contributor?.avatarUrl ? (
                      <Image source={{ uri: contributor.avatarUrl }} style={styles.contributorAvatar} />
                    ) : (
                      <View style={[styles.contributorAvatar, styles.avatarPlaceholder]}>
                        <Icon name="user" size={12} color={colors.gray400} />
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Filter controls
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {/* Member Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Member:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedMember === 'all' && styles.filterChipActive
            ]}
            onPress={() => setSelectedMember('all')}
          >
            <Text style={[
              styles.filterChipText,
              selectedMember === 'all' && styles.filterChipTextActive
            ]}>
              All Members
            </Text>
          </TouchableOpacity>
          {members.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.filterChip,
                selectedMember === member.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedMember(member.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedMember === member.id && styles.filterChipTextActive
              ]}>
                {member.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {(['all', 'milestone', 'streak', 'special', 'helper', 'family'] as FilterCategory[]).map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date Range Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Date:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {(['all', 'today', 'week', 'month', 'quarter'] as DateRange[]).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterChip,
                selectedDateRange === range && styles.filterChipActive
              ]}
              onPress={() => setSelectedDateRange(range)}
            >
              <Text style={[
                styles.filterChipText,
                selectedDateRange === range && styles.filterChipTextActive
              ]}>
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Achievement Wall</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={20} color={colors.primary} />
          {(selectedMember !== 'all' || selectedCategory !== 'all' || selectedDateRange !== 'all') && (
            <View style={styles.filterDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search achievements..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray400}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x-circle" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters (collapsible) */}
      {showFilters && renderFilters()}

      {/* Achievement Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredAchievements.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredAchievements.filter(a => a.type === 'user').length}
          </Text>
          <Text style={styles.statLabel}>Personal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredAchievements.filter(a => a.type === 'family').length}
          </Text>
          <Text style={styles.statLabel}>Family</Text>
        </View>
      </View>

      {/* Achievements List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredAchievements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="award" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>No Achievements Yet</Text>
          <Text style={styles.emptyText}>
            Complete tasks and reach milestones to unlock achievements!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievementItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  filterButton: {
    position: 'relative' as const,
    padding: spacing.sm,
  },
  filterDot: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  filterContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.captionSemibold,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row' as const,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.gray700,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  achievementCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  achievementUser: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  achievementTime: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 10,
  },
  achievementContent: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing.md,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    ...typography.body,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  encouragementBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  encouragementText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
    flex: 1,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    position: 'absolute' as const,
    left: 0,
    top: 0,
  },
  progressText: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
    textAlign: 'right' as const,
  },
  celebrationIndicator: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  celebrationText: {
    ...typography.captionSemibold,
    color: colors.white,
    marginLeft: 4,
    fontSize: 10,
  },
  contributorsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  contributorsLabel: {
    ...typography.captionSemibold,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  contributor: {
    marginRight: spacing.xs,
  },
  contributorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.gray700,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center' as const,
  },
};

export default AchievementWall;