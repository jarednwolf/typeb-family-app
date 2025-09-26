import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { TASK_REACTION_EMOJIS, REACTION_MESSAGES, ReactionEmoji } from '../../types/reactions';
import { colors, spacing, typography } from '../../constants/theme';
import { HapticFeedback } from '../../utils/haptics';

interface EmojiReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: ReactionEmoji) => void;
  anchorPosition?: { x: number; y: number };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EmojiReactionPicker: React.FC<EmojiReactionPickerProps> = ({
  visible,
  onClose,
  onSelect,
  anchorPosition,
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<ReactionEmoji | null>(null);
  const animatedValues = TASK_REACTION_EMOJIS.map(() => new Animated.Value(0));
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Stagger emoji animations
      const animations = animatedValues.map((anim, index) =>
        Animated.spring(anim, {
          toValue: 1,
          delay: index * 50,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        })
      );
      Animated.parallel(animations).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      animatedValues.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const handleEmojiSelect = (emoji: ReactionEmoji) => {
    HapticFeedback.impact.medium();
    setSelectedEmoji(emoji);
    
    // Animate selection
    const index = TASK_REACTION_EMOJIS.indexOf(emoji);
    Animated.sequence([
      Animated.spring(animatedValues[index], {
        toValue: 1.5,
        tension: 200,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValues[index], {
        toValue: 1,
        tension: 200,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSelect(emoji);
      onClose();
    });
  };

  // Calculate picker position
  const pickerStyle = anchorPosition
    ? {
        position: 'absolute' as const,
        left: Math.max(10, Math.min(anchorPosition.x - 160, SCREEN_WIDTH - 330)),
        top: anchorPosition.y - 80,
      }
    : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.container,
            pickerStyle,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.picker}>
            {TASK_REACTION_EMOJIS.map((emoji, index) => (
              <Animated.View
                key={emoji}
                style={{
                  transform: [
                    {
                      scale: animatedValues[index].interpolate({
                        inputRange: [0, 1, 1.5],
                        outputRange: [0, 1, 1.2],
                      }),
                    },
                    {
                      translateY: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => handleEmojiSelect(emoji)}
                  accessibilityLabel={`React with ${REACTION_MESSAGES[emoji]}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          {selectedEmoji && (
            <Animated.Text
              style={[
                styles.message,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {REACTION_MESSAGES[selectedEmoji]}
            </Animated.Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.M,
    padding: spacing.M,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 320,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.XS,
  },
  emojiButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: spacing.M,
    backgroundColor: colors.background,
    margin: spacing.XXS,
  },
  selectedEmoji: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 28,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.XS,
    color: colors.textSecondary,
  },
});

export default EmojiReactionPicker;