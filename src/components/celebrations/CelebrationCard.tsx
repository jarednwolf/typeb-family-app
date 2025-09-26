/**
 * CelebrationCard Component
 * Individual celebration display card
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { Achievement, Celebration } from '../../types/achievements';

interface CelebrationCardProps {
  celebration: Celebration;
  achievement?: Achievement;
  memberName: string;
  memberAvatar?: string;
  onPress?: () => void;
  compact?: boolean;
}

const CelebrationCard: React.FC<CelebrationCardProps> = ({
  celebration,
  achievement,
  memberName,
  memberAvatar,
  onPress,
  compact = false,
}) => {
  const getTypeIcon = () => {
    switch (celebration.type) {
      case 'achievement':
        return 'award';
      case 'milestone':
        return 'flag';
      case 'streak':
        return 'zap';
      case 'family':
        return 'users';
      default:
        return 'star';
    }
  };

  const getTypeColor = () => {
    switch (celebration.type) {
      case 'achievement':
        return colors.success;
      case 'milestone':
        return colors.info;
      case 'streak':
        return colors.warning;
      case 'family':
        return colors.primary;
      default:
        return colors.gray500;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.compactIconContainer, { backgroundColor: getTypeColor() + '20' }]}>
          <Icon name={getTypeIcon() as any} size={16} color={getTypeColor()} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {celebration.title}
          </Text>
          <Text style={styles.compactSubtitle} numberOfLines={1}>
            {memberName} • {format(celebration.timestamp, 'MMM d')}
          </Text>
        </View>
        {!celebration.seen && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {memberAvatar ? (
            <Image source={{ uri: memberAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="user" size={16} color={colors.gray400} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{memberName}</Text>
            <Text style={styles.timestamp}>
              {format(celebration.timestamp, 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
        </View>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor() + '20' }]}>
          <Icon name={getTypeIcon() as any} size={20} color={getTypeColor()} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{celebration.title}</Text>
        <Text style={styles.message}>{celebration.message}</Text>
        
        {achievement && (
          <View style={styles.achievementInfo}>
            <View style={styles.achievementIcon}>
              <Icon 
                name={achievement.icon as any} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.achievementDetails}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="heart" size={16} color={colors.gray600} />
          <Text style={styles.actionText}>Celebrate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="message-circle" size={16} color={colors.gray600} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-2" size={16} color={colors.gray600} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* New indicator */}
      {!celebration.seen && (
        <View style={styles.newIndicator}>
          <Icon name="gift" size={12} color={colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 14,
  },
  timestamp: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 2,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  achievementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 14,
  },
  achievementDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },
  newIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 14,
  },
  compactSubtitle: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 2,
  },
  newBadge: {
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
});

export default CelebrationCard;