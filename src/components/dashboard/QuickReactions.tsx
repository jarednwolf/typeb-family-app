/**
 * Quick Reactions Component
 * Quick reaction bar for dashboard interactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { ReactionType } from '../../services/socialIntegration';

interface QuickReactionsProps {
  targetId: string;
  targetType: string;
  onReaction?: (type: ReactionType) => void;
  currentReaction?: ReactionType | null;
  reactionCounts?: Record<ReactionType, number>;
  compact?: boolean;
}

const QuickReactions: React.FC<QuickReactionsProps> = ({
  targetId,
  targetType,
  onReaction,
  currentReaction,
  reactionCounts = {},
  compact = false,
}) => {
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(currentReaction || null);
  const [animatedScales] = useState<Record<string, Animated.Value>>(() => {
    const scales: Record<string, Animated.Value> = {};
    reactions.forEach(r => {
      scales[r.type] = new Animated.Value(1);
    });
    return scales;
  });

  const reactions: Array<{ type: ReactionType; icon: string; color: string }> = [
    { type: 'like', icon: 'thumbs-up', color: colors.info },
    { type: 'love', icon: 'heart', color: colors.error },
    { type: 'celebrate', icon: 'gift', color: colors.warning },
    { type: 'support', icon: 'users', color: colors.success },
    { type: 'applause', icon: 'award', color: colors.primary },
  ];

  const handleReaction = (type: ReactionType) => {
    const isRemoving = selectedReaction === type;
    
    // Animate the reaction
    Animated.sequence([
      Animated.spring(animatedScales[type], {
        toValue: isRemoving ? 0.8 : 1.2,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(animatedScales[type], {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedReaction(isRemoving ? null : type);
    onReaction?.(type);
  };

  const getTotalReactions = (): number => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {reactions.slice(0, 3).map(reaction => (
          <TouchableOpacity
            key={reaction.type}
            style={[
              styles.compactReaction,
              selectedReaction === reaction.type && styles.compactReactionActive,
            ]}
            onPress={() => handleReaction(reaction.type)}
          >
            <Icon
              name={reaction.icon as any}
              size={16}
              color={
                selectedReaction === reaction.type
                  ? reaction.color
                  : colors.gray400
              }
            />
            {reactionCounts[reaction.type] ? (
              <Text style={styles.compactCount}>
                {reactionCounts[reaction.type]}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
        {getTotalReactions() > 0 && (
          <Text style={styles.totalCount}>
            {getTotalReactions()} reactions
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.reactionsBar}>
        {reactions.map(reaction => {
          const count = reactionCounts[reaction.type] || 0;
          const isSelected = selectedReaction === reaction.type;

          return (
            <Animated.View
              key={reaction.type}
              style={[
                styles.reactionWrapper,
                {
                  transform: [{ scale: animatedScales[reaction.type] }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.reactionButton,
                  isSelected && styles.reactionButtonActive,
                  isSelected && { backgroundColor: reaction.color + '20' },
                ]}
                onPress={() => handleReaction(reaction.type)}
                activeOpacity={0.7}
              >
                <Icon
                  name={reaction.icon as any}
                  size={20}
                  color={isSelected ? reaction.color : colors.gray500}
                />
                {count > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: reaction.color },
                    ]}
                  >
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text
                style={[
                  styles.reactionLabel,
                  isSelected && { color: reaction.color },
                ]}
              >
                {reaction.type}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {getTotalReactions() > 0 && (
        <View style={styles.summaryContainer}>
          <Icon name="heart" size={14} color={colors.gray400} />
          <Text style={styles.summaryText}>
            {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  reactionWrapper: {
    alignItems: 'center',
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    position: 'relative',
  },
  reactionButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    ...typography.captionSemibold,
    color: colors.white,
    fontSize: 10,
  },
  reactionLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
    fontSize: 11,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  summaryText: {
    ...typography.caption,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  compactReaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    marginRight: spacing.xs,
  },
  compactReactionActive: {
    backgroundColor: colors.primaryLight,
  },
  compactCount: {
    ...typography.caption,
    color: colors.gray600,
    marginLeft: 4,
    fontSize: 12,
  },
  totalCount: {
    ...typography.caption,
    color: colors.gray500,
    marginLeft: spacing.xs,
  },
});

export default QuickReactions;