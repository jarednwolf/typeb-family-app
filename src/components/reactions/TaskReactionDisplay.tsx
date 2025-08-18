import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Reaction, ReactionEmoji } from '../../types/reactions';
import { colors, spacing, typography } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';

interface TaskReactionDisplayProps {
  reactions: Reaction[];
  onAddReaction: () => void;
  onRemoveReaction: (emoji: ReactionEmoji) => void;
  showAddButton?: boolean;
}

export const TaskReactionDisplay: React.FC<TaskReactionDisplayProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  showAddButton = true,
}) => {
  const currentUser = useAppSelector(selectUser);
  const currentUserId = currentUser?.uid;
  const [animatedValues] = useState(
    new Map<string, Animated.Value>()
  );

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc, reaction) => {
    const key = reaction.emoji;
    if (!acc[key]) {
      acc[key] = {
        emoji: reaction.emoji,
        users: [],
        count: 0,
      };
    }
    acc[key].users.push({
      userId: reaction.userId,
      userName: reaction.userName,
    });
    acc[key].count++;
    return acc;
  }, {} as Record<string, { emoji: string; users: Array<{ userId: string; userName: string }>; count: number }>);

  const handleReactionPress = (emoji: ReactionEmoji) => {
    const group = reactionGroups[emoji];
    const userReacted = group.users.some(user => user.userId === currentUserId);
    
    HapticFeedback.selection();
    
    if (userReacted) {
      // Remove reaction
      animateReaction(emoji, false);
      setTimeout(() => onRemoveReaction(emoji), 150);
    } else {
      // This would add the same reaction, but we'll use the add button for new reactions
      onAddReaction();
    }
  };

  const animateReaction = (emoji: string, isAdding: boolean) => {
    const key = `reaction-${emoji}`;
    if (!animatedValues.has(key)) {
      animatedValues.set(key, new Animated.Value(1));
    }
    const animValue = animatedValues.get(key)!;

    Animated.sequence([
      Animated.spring(animValue, {
        toValue: isAdding ? 1.2 : 0.8,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getAnimatedStyle = (emoji: string) => {
    const key = `reaction-${emoji}`;
    const animValue = animatedValues.get(key) || new Animated.Value(1);
    return {
      transform: [{ scale: animValue }],
    };
  };

  if (Object.keys(reactionGroups).length === 0 && !showAddButton) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.reactionsRow}>
        {Object.values(reactionGroups).map((group) => {
          const userReacted = group.users.some(user => user.userId === currentUserId);
          const userNames = group.users.map(u => u.userName).join(', ');
          
          return (
            <Animated.View
              key={group.emoji}
              style={getAnimatedStyle(group.emoji)}
            >
              <TouchableOpacity
                style={[
                  styles.reactionBubble,
                  userReacted && styles.userReacted,
                ]}
                onPress={() => handleReactionPress(group.emoji as ReactionEmoji)}
                accessibilityLabel={`${group.emoji} reaction by ${userNames}`}
                accessibilityRole="button"
                accessibilityHint={userReacted ? 'Tap to remove your reaction' : 'Tap to add this reaction'}
              >
                <Text style={styles.emoji}>{group.emoji}</Text>
                {group.count > 1 && (
                  <Text style={[
                    styles.count,
                    userReacted && styles.userReactedText,
                  ]}>
                    {group.count}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        
        {showAddButton && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddReaction}
            accessibilityLabel="Add reaction"
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>😊</Text>
            <Text style={styles.plusSign}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.XS,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.XS,
    alignItems: 'center',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XXS,
    borderRadius: spacing.M,
    marginRight: spacing.XXS,
    marginBottom: spacing.XXS,
  },
  userReacted: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    ...typography.caption1,
    marginLeft: spacing.XXS,
    color: colors.textSecondary,
  },
  userReactedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XXS,
    borderRadius: spacing.M,
    borderWidth: 1,
    borderColor: colors.separator,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    opacity: 0.6,
  },
  plusSign: {
    fontSize: 12,
    marginLeft: 2,
    color: colors.textSecondary,
  },
});

export default TaskReactionDisplay;