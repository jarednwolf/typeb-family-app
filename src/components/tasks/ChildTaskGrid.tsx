import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

interface ChildTaskGridProps {
  children: ChildAccountability[];
  onChildPress: (childId: string) => void;
}

const ChildTaskGrid: React.FC<ChildTaskGridProps> = ({ children, onChildPress }) => {
  const { theme, isDarkMode } = useTheme();

  const getStatusColor = (completionRate: number) => {
    if (completionRate >= 80) return theme.colors.success;
    if (completionRate >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 21) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '✨';
    if (streak >= 3) return '⭐';
    return null;
  };

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'No activity yet';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.L,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.S,
    },
    gridItem: {
      width: (screenWidth - theme.spacing.L * 2 - theme.spacing.S * 2) / 2,
      margin: theme.spacing.S,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.M,
      ...theme.shadows.small,
      minHeight: 180,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.M,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.S,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.white,
    },
    nameContainer: {
      flex: 1,
    },
    childName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    lastActivity: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statsContainer: {
      marginBottom: theme.spacing.S,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.XS,
    },
    progressLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    progressValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.separator,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: theme.spacing.S,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: theme.spacing.XS,
      flexWrap: 'wrap',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundTexture,
      paddingHorizontal: theme.spacing.S,
      paddingVertical: theme.spacing.XXS,
      borderRadius: theme.borderRadius.round,
      gap: 4,
    },
    streakBadge: {
      backgroundColor: theme.colors.warning + '20',
    },
    pendingBadge: {
      backgroundColor: theme.colors.info + '20',
    },
    overdueBadge: {
      backgroundColor: theme.colors.error + '20',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '500',
    },
    streakText: {
      color: theme.colors.warning,
    },
    pendingText: {
      color: theme.colors.info,
    },
    overdueText: {
      color: theme.colors.error,
    },
    streakIcon: {
      fontSize: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.XXL,
    },
    emptyIcon: {
      marginBottom: theme.spacing.M,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.S,
    },
    emptyMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.L,
    },
    alertIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.error,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
  });

  if (children.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather 
          name="users" 
          size={48} 
          color={theme.colors.textTertiary} 
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No Children Added</Text>
        <Text style={styles.emptyMessage}>
          Add children to your family to start tracking their accountability
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal={false} 
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.grid}>
        {children.map((child) => {
          const completionPercentage = child.todayTotal > 0 
            ? Math.round((child.todayCompleted / child.todayTotal) * 100)
            : 100;
          const statusColor = getStatusColor(completionPercentage);
          const streakIcon = getStreakIcon(child.currentStreak);
          const hasUrgentItems = child.pendingVerification > 0 || child.overdueCount > 0;

          return (
            <View key={child.childId} style={styles.gridItem}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => onChildPress(child.childId)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{child.avatar}</Text>
                      {hasUrgentItems && <View style={styles.alertIndicator} />}
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={styles.childName} numberOfLines={1}>
                        {child.name}
                      </Text>
                      <Text style={styles.lastActivity}>
                        {formatLastActivity(child.lastActivity)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Today</Text>
                    <Text style={styles.progressValue}>
                      {child.todayCompleted}/{child.todayTotal}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${completionPercentage}%`,
                          backgroundColor: statusColor,
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.badgesRow}>
                  {child.currentStreak > 0 && (
                    <View style={[styles.badge, styles.streakBadge]}>
                      {streakIcon && <Text style={styles.streakIcon}>{streakIcon}</Text>}
                      <Text style={[styles.badgeText, styles.streakText]}>
                        {child.currentStreak} day{child.currentStreak !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  
                  {child.pendingVerification > 0 && (
                    <View style={[styles.badge, styles.pendingBadge]}>
                      <Feather name="camera" size={10} color={theme.colors.info} />
                      <Text style={[styles.badgeText, styles.pendingText]}>
                        {child.pendingVerification}
                      </Text>
                    </View>
                  )}
                  
                  {child.overdueCount > 0 && (
                    <View style={[styles.badge, styles.overdueBadge]}>
                      <Feather name="alert-circle" size={10} color={theme.colors.error} />
                      <Text style={[styles.badgeText, styles.overdueText]}>
                        {child.overdueCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default ChildTaskGrid;