/**
 * Celebration Carousel Component
 * Shows recent celebrations in a horizontal carousel
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { Celebration } from '../../types/achievements';
import * as celebrationService from '../../services/celebrations';
import { useSelector } from 'react-redux';
import { selectFamily, selectFamilyMembers } from '../../store/slices/familySlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = spacing.sm;

interface CelebrationCarouselProps {
  onCelebrationPress?: (celebration: Celebration) => void;
  onSeeAll?: () => void;
}

const CelebrationCarousel: React.FC<CelebrationCarouselProps> = ({
  onCelebrationPress,
  onSeeAll,
}) => {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);

  useEffect(() => {
    loadCelebrations();
  }, [family]);

  const loadCelebrations = async () => {
    if (!family?.id) return;
    
    try {
      setIsLoading(true);
      const recentCelebrations = await celebrationService.getCelebrations(
        undefined,
        family.id,
        10
      );
      setCelebrations(recentCelebrations);
    } catch (error) {
      console.error('Error loading celebrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCelebrationIcon = (type: Celebration['type']): string => {
    const icons = {
      achievement: 'award',
      milestone: 'flag',
      streak: 'zap',
      family: 'users',
    };
    return icons[type];
  };

  const getCelebrationColor = (type: Celebration['type']): string => {
    const colors = {
      achievement: '#FFD700',
      milestone: '#007AFF',
      streak: '#FF9500',
      family: '#34C759',
    };
    return colors[type];
  };

  const getMemberName = (userId?: string): string => {
    if (!userId) return 'Family';
    const member = members.find(m => m.id === userId);
    return member?.displayName || 'Unknown';
  };

  const renderCelebration = ({ item, index }: { item: Celebration; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
      index * (CARD_WIDTH + CARD_MARGIN * 2),
      (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.celebrationCard,
          {
            width: CARD_WIDTH,
            marginHorizontal: CARD_MARGIN,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onCelebrationPress?.(item)}
        >
          <View
            style={[
              styles.cardHeader,
              { backgroundColor: getCelebrationColor(item.type) },
            ]}
          >
            <Icon
              name={getCelebrationIcon(item.type) as any}
              size={24}
              color={colors.white}
            />
            {!item.seen && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.celebrationTitle}>{item.title}</Text>
            <Text style={styles.celebrationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.memberName}>
                {getMemberName(item.userId)}
              </Text>
              <Text style={styles.timeAgo}>
                {format(item.timestamp, 'MMM d')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="gift" size={32} color={colors.gray300} />
          <Text style={styles.loadingText}>Loading celebrations...</Text>
        </View>
      </View>
    );
  }

  if (celebrations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="gift" size={32} color={colors.gray300} />
          <Text style={styles.emptyText}>No celebrations yet</Text>
          <Text style={styles.emptySubtext}>
            Complete tasks and reach milestones to celebrate!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="gift" size={18} color={colors.primary} />
          <Text style={styles.title}>Celebrations</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {celebrations.map((item, index) => 
          renderCelebration({ item, index })
        )}
      </Animated.ScrollView>

      <View style={styles.pagination}>
        {celebrations.slice(0, 5).map((_, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
            index * (CARD_WIDTH + CARD_MARGIN * 2),
            (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [6, 16, 6],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
  },
  celebrationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 10,
  },
  cardContent: {
    padding: spacing.md,
  },
  celebrationTitle: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  celebrationMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    ...typography.captionSemibold,
    color: colors.primary,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.gray400,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.gray700,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default CelebrationCarousel;