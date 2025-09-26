/**
 * ReactionPicker Component
 * Displays a grid of positive emoji reactions for users to choose from
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REACTION_METADATA, ReactionType } from '../../services/reactions';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reaction: ReactionType) => void;
  currentReaction?: ReactionType | null;
  selectedReaction?: ReactionType | null;
  anchorPosition?: { x: number; y: number };
  showCategories?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PICKER_WIDTH = Math.min(320, SCREEN_WIDTH - 40);
const EMOJI_SIZE = 40;
const EMOJI_CONTAINER_SIZE = 56;

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentReaction,
  selectedReaction,
  anchorPosition,
  showCategories = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'classic' | 'celebration' | 'emotion' | 'achievement'>('all');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getFilteredReactions = () => {
    const reactions = Object.entries(REACTION_METADATA);
    if (selectedCategory === 'all') {
      return reactions;
    }
    return reactions.filter(([_, metadata]) => metadata.category === selectedCategory);
  };

  const handleReactionSelect = (reaction: ReactionType) => {
    // Haptic feedback on iOS
    if (Platform.OS === 'ios') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available
      }
    }
    
    onSelect(reaction);
    onClose();
  };

  const pickerStyle: any = {
    position: 'absolute',
    ...(anchorPosition
      ? {
          top: Math.min(anchorPosition.y + 20, SCREEN_HEIGHT - 400),
          left: Math.max(20, Math.min(anchorPosition.x - PICKER_WIDTH / 2, SCREEN_WIDTH - PICKER_WIDTH - 20)),
        }
      : {
          top: SCREEN_HEIGHT / 2 - 200,
          left: SCREEN_WIDTH / 2 - PICKER_WIDTH / 2,
        }),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            pickerStyle,
            {
              width: PICKER_WIDTH,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
              }}
            >
              Choose a Reaction
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          {showCategories && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              {(['all', 'classic', 'celebration', 'emotion', 'achievement'] as const).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginHorizontal: 4,
                    borderRadius: 20,
                    backgroundColor: selectedCategory === category ? '#3B82F6' : '#F3F4F6',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: selectedCategory === category ? '#FFFFFF' : '#6B7280',
                      textTransform: 'capitalize',
                    }}
                  >
                    {category === 'all' ? 'All' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Emoji Grid */}
          <ScrollView
            style={{ maxHeight: 280 }}
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              padding: 12,
              justifyContent: 'center',
            }}
          >
            {getFilteredReactions().map(([reaction, metadata]) => {
              const isSelected = (currentReaction || selectedReaction) === reaction;
              return (
                <TouchableOpacity
                  key={reaction}
                  onPress={() => handleReactionSelect(reaction as ReactionType)}
                  style={{
                    width: EMOJI_CONTAINER_SIZE,
                    height: EMOJI_CONTAINER_SIZE,
                    margin: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#EBF5FF' : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#3B82F6',
                  }}
                >
                  <Animated.Text
                    style={{
                      fontSize: EMOJI_SIZE,
                      transform: [
                        {
                          scale: isSelected ? 1.1 : 1,
                        },
                      ],
                    }}
                  >
                    {metadata.emoji}
                  </Animated.Text>
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        backgroundColor: '#3B82F6',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Current Reaction Indicator */}
          {currentReaction && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginRight: 8,
                }}
              >
                Your reaction:
              </Text>
              <Text style={{ fontSize: 24 }}>
                {REACTION_METADATA[currentReaction].emoji}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginLeft: 8,
                }}
              >
                {REACTION_METADATA[currentReaction].label}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ReactionPicker;