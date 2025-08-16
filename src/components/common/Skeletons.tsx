/**
 * Loading Skeleton Components
 * 
 * Provides skeleton screens for loading states to improve perceived performance.
 * Uses shimmer animations to indicate active loading.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Task Card Skeleton
 */
export const TaskCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskCardLeft}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.taskCardContent}>
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <View style={styles.taskCardMeta}>
            <Skeleton width={80} height={24} borderRadius={12} />
            <Skeleton width={60} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
          <View style={styles.taskCardFooter}>
            <Skeleton width={100} height={14} />
            <Skeleton width={80} height={14} style={{ marginLeft: 'auto' }} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Dashboard Card Skeleton
 */
export const DashboardCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardCardHeader}>
        <Skeleton width={120} height={18} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <Skeleton width="60%" height={32} style={{ marginVertical: 16 }} />
      <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={12} />
    </View>
  );
};

/**
 * List Item Skeleton
 */
export const ListItemSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.listItem}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={14} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
};

/**
 * Tasks Screen Skeleton
 */
export const TasksScreenSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={150} height={32} />
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <Skeleton width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width={100} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width={90} height={32} borderRadius={16} />
      </View>

      {/* Task Cards */}
      <View style={styles.taskList}>
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </View>
    </View>
  );
};

/**
 * Dashboard Screen Skeleton
 */
export const DashboardScreenSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Skeleton width={80} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width={120} height={24} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={60} height={32} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={60} height={32} />
        </View>
      </View>

      {/* Dashboard Cards */}
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
    </View>
  );
};

/**
 * Photo Grid Skeleton
 */
export const PhotoGridSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const itemSize = (screenWidth - theme.spacing.M * 3) / 2;

  return (
    <View style={styles.photoGrid}>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton
          key={item}
          width={itemSize}
          height={itemSize}
          borderRadius={theme.borderRadius.medium}
          style={{ marginBottom: theme.spacing.M }}
        />
      ))}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Task Card Skeleton
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.M,
    marginHorizontal: theme.spacing.M,
    marginBottom: theme.spacing.S,
    ...theme.shadows.small,
  },
  taskCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCardContent: {
    flex: 1,
    marginLeft: theme.spacing.S,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Dashboard Card Skeleton
  dashboardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.L,
    marginHorizontal: theme.spacing.M,
    marginBottom: theme.spacing.M,
    ...theme.shadows.small,
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.M,
  },
  
  // List Item Skeleton
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  listItemContent: {
    flex: 1,
    marginLeft: theme.spacing.M,
  },
  
  // Screen Skeletons
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.M,
    paddingTop: theme.spacing.L,
    paddingBottom: theme.spacing.M,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.M,
    marginBottom: theme.spacing.M,
  },
  taskList: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.M,
    marginBottom: theme.spacing.L,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.M,
    marginRight: theme.spacing.M,
    ...theme.shadows.small,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.M,
  },
});

export default {
  Skeleton,
  TaskCardSkeleton,
  DashboardCardSkeleton,
  ListItemSkeleton,
  TasksScreenSkeleton,
  DashboardScreenSkeleton,
  PhotoGridSkeleton,
};