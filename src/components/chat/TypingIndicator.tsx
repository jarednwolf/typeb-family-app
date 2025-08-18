/**
 * TypingIndicator Component
 * Shows when other users are typing
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';

interface TypingIndicatorProps {
  users: Array<{
    userId: string;
    userName: string;
  }>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (users.length > 0) {
      // Create bouncing animation for dots
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = Animated.parallel([
        createAnimation(dot1Anim, 0),
        createAnimation(dot2Anim, 150),
        createAnimation(dot3Anim, 300),
      ]);

      animations.start();

      return () => {
        animations.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
      };
    }
  }, [users.length]);

  if (users.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: '#6B7280',
            fontStyle: 'italic',
            marginRight: 8,
          }}
        >
          {getTypingText()}
        </Text>
        
        {/* Animated Dots */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#6B7280',
              marginHorizontal: 2,
              transform: [
                {
                  translateY: dot1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#6B7280',
              marginHorizontal: 2,
              transform: [
                {
                  translateY: dot2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#6B7280',
              marginHorizontal: 2,
              transform: [
                {
                  translateY: dot3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default TypingIndicator;