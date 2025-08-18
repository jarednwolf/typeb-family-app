/**
 * ReactionDisplay Component
 * Shows reactions with counts and animations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REACTION_METADATA, ReactionType } from '../../services/reactions';
import { ReactionPicker } from './ReactionPicker';
import { ReactionAnimation } from './ReactionAnimation';

interface ReactionDisplayProps {
  reactions?: Record<string, {
    userId: string;
    userName: string;
    reactionType: ReactionType;
    timestamp: number;
  }> | null;
  currentUserId: string;
  onAddReaction: (reactionType: ReactionType) => Promise<void>;
  onRemoveReaction: () => Promise<void>;
  contentId: string;
  contentType: string;
  showNames?: boolean;
  maxReactionsShown?: number;
  size?: 'small' | 'medium' | 'large';
  allowMultiple?: boolean;
  compact?: boolean;
  onReactionAdded?: (reaction: ReactionType) => void;
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  contentId,
  contentType,
  showNames = false,
  maxReactionsShown = 3,
  size = 'medium',
  allowMultiple = false,
  compact = false,
  onReactionAdded,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<ReactionType | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<{ x: number; y: number } | undefined>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonRef = useRef<View>(null);

  // Get reaction counts
  const getReactionCounts = () => {
    if (!reactions) return { byType: {}, total: 0, topReactions: [] };

    const counts: Record<ReactionType, number> = {} as Record<ReactionType, number>;
    let total = 0;

    Object.values(reactions).forEach((reaction) => {
      if (!counts[reaction.reactionType]) {
        counts[reaction.reactionType] = 0;
      }
      counts[reaction.reactionType]++;
      total++;
    });

    const topReactions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxReactionsShown)
      .map(([type]) => type as ReactionType);

    return { byType: counts, total, topReactions };
  };

  const { byType, total, topReactions } = getReactionCounts();
  const userReaction = reactions?.[currentUserId]?.reactionType || null;

  // Get size-specific dimensions
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { emojiSize: 16, fontSize: 12, padding: 4, height: 28 };
      case 'large':
        return { emojiSize: 24, fontSize: 16, padding: 8, height: 40 };
      default:
        return { emojiSize: 20, fontSize: 14, padding: 6, height: 32 };
    }
  };

  const { emojiSize, fontSize, padding, height } = getDimensions();

  const handleReactionButtonPress = () => {
    // Get button position for picker anchor
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPickerAnchor({ x: pageX + width / 2, y: pageY + height });
      setShowPicker(true);
    });
  };

  const handleAddReaction = async (reactionType: ReactionType) => {
    try {
      // Animate the reaction
      setAnimatingReaction(reactionType);
      setShowAnimation(true);

      // Add haptic feedback
      if (Platform.OS === 'ios') {
        try {
          const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
          impactAsync(ImpactFeedbackStyle.Light);
        } catch (error) {
          // Haptics not available
        }
      }

      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      await onAddReaction(reactionType);
      
      // Call additional callback if provided
      if (onReactionAdded) {
        onReactionAdded(reactionType);
      }

      // Hide animation after delay
      setTimeout(() => {
        setShowAnimation(false);
        setAnimatingReaction(null);
      }, 1500);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async () => {
    try {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      await onRemoveReaction();
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Reaction Summary */}
      {topReactions.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            marginRight: 8,
            backgroundColor: '#F3F4F6',
            borderRadius: height / 2,
            paddingHorizontal: padding,
            height,
            alignItems: 'center',
          }}
        >
          {topReactions.map((reactionType, index) => (
            <View key={reactionType} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: emojiSize }}>
                {REACTION_METADATA[reactionType].emoji}
              </Text>
              <Text
                style={{
                  fontSize,
                  color: '#6B7280',
                  marginLeft: 2,
                  marginRight: index < topReactions.length - 1 ? 6 : 0,
                }}
              >
                {(byType as Record<ReactionType, number>)[reactionType] || 0}
              </Text>
            </View>
          ))}
          {total > topReactions.reduce((sum, type) => sum + ((byType as Record<ReactionType, number>)[type] || 0), 0) && (
            <Text
              style={{
                fontSize,
                color: '#6B7280',
                marginLeft: 4,
              }}
            >
              +{total - topReactions.reduce((sum, type) => sum + ((byType as Record<ReactionType, number>)[type] || 0), 0)}
            </Text>
          )}
        </View>
      )}

      {/* Add/Change Reaction Button */}
      <Animated.View
        ref={buttonRef}
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={userReaction ? handleRemoveReaction : handleReactionButtonPress}
          onLongPress={userReaction ? handleReactionButtonPress : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: userReaction ? '#EBF5FF' : '#F3F4F6',
            borderRadius: height / 2,
            paddingHorizontal: padding,
            height,
            borderWidth: userReaction ? 1 : 0,
            borderColor: '#3B82F6',
          }}
        >
          {userReaction ? (
            <>
              <Text style={{ fontSize: emojiSize }}>
                {REACTION_METADATA[userReaction].emoji}
              </Text>
              {size !== 'small' && (
                <Text
                  style={{
                    fontSize: fontSize - 2,
                    color: '#3B82F6',
                    marginLeft: 4,
                    fontWeight: '500',
                  }}
                >
                  You
                </Text>
              )}
            </>
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={emojiSize}
                color="#6B7280"
              />
              {size !== 'small' && (
                <Text
                  style={{
                    fontSize,
                    color: '#6B7280',
                    marginLeft: 4,
                  }}
                >
                  React
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Show Names (optional) */}
      {showNames && reactions && Object.keys(reactions).length > 0 && (
        <TouchableOpacity
          style={{
            marginLeft: 8,
          }}
          onPress={() => {
            // Show modal with all reactors
            console.log('Show all reactions');
          }}
        >
          <Text
            style={{
              fontSize: fontSize - 2,
              color: '#6B7280',
              textDecorationLine: 'underline',
            }}
            numberOfLines={1}
          >
            {Object.values(reactions)
              .slice(0, 2)
              .map((r) => r.userName.split(' ')[0])
              .join(', ')}
            {Object.keys(reactions).length > 2 && ` +${Object.keys(reactions).length - 2}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddReaction}
        selectedReaction={userReaction}
        anchorPosition={pickerAnchor}
      />

      {/* Reaction Animation */}
      {showAnimation && animatingReaction && (
        <ReactionAnimation
          reactionType={animatingReaction}
          onComplete={() => {
            setShowAnimation(false);
            setAnimatingReaction(null);
          }}
        />
      )}
    </View>
  );
};

export default ReactionDisplay;