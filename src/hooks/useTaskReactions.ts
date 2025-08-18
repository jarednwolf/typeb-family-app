import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from './redux';
import { selectUser } from '../store/slices/authSlice';
import { selectFamily } from '../store/slices/familySlice';
import {
  addEmojiReaction,
  removeEmojiReaction,
  getReactions,
  EMOJI_TO_REACTION_TYPE
} from '../services/reactions';
import {
  ReactionEmoji,
  Reaction
} from '../types/reactions';
import { ReactionType, Reaction as SocialReaction } from '../services/socialIntegration';
import { HapticFeedback } from '../utils/haptics';

interface UseTaskReactionsReturn {
  reactions: Reaction[];
  isLoading: boolean;
  error: string | null;
  addReaction: (emoji: ReactionEmoji) => Promise<void>;
  removeReaction: (emoji: ReactionEmoji) => Promise<void>;
  hasUserReacted: (emoji?: ReactionEmoji) => boolean;
  refreshReactions: () => Promise<void>;
}

export const useTaskReactions = (taskId: string): UseTaskReactionsReturn => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAppSelector(selectUser);
  const family = useAppSelector(selectFamily);
  
  // Load reactions on mount
  useEffect(() => {
    if (taskId && family?.id) {
      loadReactions();
    }
  }, [taskId, family?.id]);
  
  const loadReactions = useCallback(async () => {
    if (!taskId || !family?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const socialReactions = await getReactions(taskId, 'task');
      
      // Convert social reactions to emoji reactions
      const emojiReactions: Reaction[] = socialReactions.map((sr: SocialReaction) => {
        const emoji = Object.entries(EMOJI_TO_REACTION_TYPE).find(
          ([_, type]) => type === sr.type
        )?.[0] as ReactionEmoji;
        
        return {
          emoji: emoji || '😊',
          userId: sr.userId,
          userName: sr.userName,
          timestamp: sr.timestamp,
        };
      });
      
      setReactions(emojiReactions);
    } catch (err) {
      console.error('Failed to load reactions:', err);
      setError('Failed to load reactions');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, family?.id]);
  
  const addReaction = useCallback(async (emoji: ReactionEmoji) => {
    if (!user || !family?.id) {
      setError('Please sign in to react');
      return;
    }
    
    try {
      HapticFeedback.impact.medium();
      
      await addEmojiReaction(
        (user as any).uid,
        (user as any).displayName || 'Anonymous',
        taskId,
        emoji,
        (user as any).photoURL || undefined
      );
      
      // Optimistically update UI
      const newReaction: Reaction = {
        emoji,
        userId: (user as any).uid,
        userName: (user as any).displayName || 'Anonymous',
        timestamp: new Date(),
      };
      
      setReactions(prev => [...prev, newReaction]);
      setError(null);
    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError('Failed to add reaction');
      // Refresh to sync with server
      await loadReactions();
    }
  }, [user, family?.id, taskId, loadReactions]);
  
  const removeReaction = useCallback(async (emoji: ReactionEmoji) => {
    if (!user || !family?.id) {
      setError('Please sign in to react');
      return;
    }
    
    try {
      HapticFeedback.impact.light();
      
      await removeEmojiReaction((user as any).uid, taskId, emoji);
      
      // Optimistically update UI
      setReactions(prev =>
        prev.filter(r => !(r.userId === (user as any).uid && r.emoji === emoji))
      );
      setError(null);
    } catch (err) {
      console.error('Failed to remove reaction:', err);
      setError('Failed to remove reaction');
      // Refresh to sync with server
      await loadReactions();
    }
  }, [user, family?.id, taskId, loadReactions]);
  
  const hasUserReacted = useCallback((emoji?: ReactionEmoji): boolean => {
    if (!user) return false;
    
    if (emoji) {
      return reactions.some(r => r.userId === (user as any).uid && r.emoji === emoji);
    }
    
    return reactions.some(r => r.userId === (user as any).uid);
  }, [user, reactions]);
  
  const refreshReactions = useCallback(async () => {
    await loadReactions();
  }, [loadReactions]);
  
  return {
    reactions,
    isLoading,
    error,
    addReaction,
    removeReaction,
    hasUserReacted,
    refreshReactions,
  };
};