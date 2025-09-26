import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export type ReactionType = 'STAR' | 'FIRE' | 'CLAP' | 'HEART' | 'THUMBS_UP';

interface ParentReactionData {
  reaction: ReactionType;
  timestamp: Date;
  parentName: string;
}

interface ParentReactionProps {
  taskId: string;
  reactions?: Record<string, ParentReactionData>;
  onReactionUpdate?: (taskId: string, reaction: ReactionType | null) => Promise<void>;
  style?: ViewStyle;
  readonly?: boolean;
}

const REACTION_CONFIG: Record<ReactionType, { text: string; color: string }> = {
  STAR: { text: 'STAR', color: '#FFB800' },
  FIRE: { text: 'FIRE', color: '#FF6B6B' },
  CLAP: { text: 'CLAP', color: '#4ECDC4' },
  HEART: { text: 'HEART', color: '#FF69B4' },
  THUMBS_UP: { text: 'THUMBS UP', color: '#4CAF50' },
};

const ParentReaction: React.FC<ParentReactionProps> = ({
  taskId,
  reactions = {},
  onReactionUpdate,
  style,
  readonly = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  const currentUserId = userProfile?.id;
  const currentUserReaction = currentUserId && reactions[currentUserId]?.reaction;
  const isParent = userProfile?.role === 'parent';
  const canReact = isParent && !readonly && onReactionUpdate;
  
  const handleReactionSelect = useCallback(async (reaction: ReactionType) => {
    if (!canReact || !currentUserId || !userProfile?.displayName) return;
    
    setIsLoading(true);
    try {
      // If selecting the same reaction, remove it
      const newReaction = reaction === currentUserReaction ? null : reaction;
      await onReactionUpdate(taskId, newReaction);
      setShowPicker(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canReact, currentUserId, currentUserReaction, onReactionUpdate, taskId, userProfile]);
  
  const reactionEntries = Object.entries(reactions).filter(([_, data]) => data.reaction);
  
  return (
    <View style={[styles.container, style]}>
      {reactionEntries.length > 0 && (
        <View style={styles.reactionsContainer}>
          {reactionEntries.map(([parentId, data]) => {
            const config = REACTION_CONFIG[data.reaction];
            const isCurrentUser = parentId === currentUserId;
            
            return (
              <TouchableOpacity
                key={parentId}
                style={[
                  styles.reactionBubble,
                  {
                    backgroundColor: isDarkMode
                      ? config.color + '20'
                      : config.color + '15',
                    borderColor: config.color,
                  },
                  isCurrentUser && styles.currentUserReaction,
                ]}
                onPress={() => canReact && isCurrentUser && setShowPicker(!showPicker)}
                disabled={!canReact || !isCurrentUser}
              >
                <Text style={[styles.reactionText, { color: config.color }]}>
                  {config.text}
                </Text>
                <Text style={[styles.parentName, { color: theme.colors.textSecondary }]}>
                  {data.parentName}
                </Text>
                {isCurrentUser && canReact && (
                  <View style={[styles.editIndicator, { backgroundColor: config.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      
      {canReact && reactionEntries.length === 0 && (
        <TouchableOpacity
          style={[styles.addReactionButton, { borderColor: theme.colors.separator }]}
          onPress={() => setShowPicker(!showPicker)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.addReactionText, { color: theme.colors.textSecondary }]}>
              + Add Reaction
            </Text>
          )}
        </TouchableOpacity>
      )}
      
      {showPicker && canReact && (
        <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface }]}>
          {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((reaction) => {
            const config = REACTION_CONFIG[reaction];
            const isSelected = reaction === currentUserReaction;
            
            return (
              <TouchableOpacity
                key={reaction}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: isDarkMode
                      ? config.color + '20'
                      : config.color + '15',
                    borderColor: config.color,
                  },
                  isSelected && styles.selectedOption,
                ]}
                onPress={() => handleReactionSelect(reaction)}
                disabled={isLoading}
              >
                <Text style={[styles.pickerOptionText, { color: config.color }]}>
                  {config.text}
                </Text>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: config.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.S,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.XS,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    gap: spacing.XXS,
  },
  currentUserReaction: {
    borderWidth: 2,
  },
  reactionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  parentName: {
    fontSize: 11,
    fontWeight: '500',
  },
  editIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: spacing.XXS,
  },
  addReactionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addReactionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.XS,
    borderRadius: borderRadius.medium,
    padding: spacing.S,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  pickerOption: {
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginBottom: spacing.XS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: {
    borderWidth: 2,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ParentReaction;