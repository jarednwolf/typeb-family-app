/**
 * ReactionAnimation Component
 * Displays animated reactions when users add them
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions, Text } from 'react-native';
import { REACTION_METADATA, ReactionType } from '../../services/reactions';

interface ReactionAnimationProps {
  reactionType: ReactionType;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ReactionAnimation: React.FC<ReactionAnimationProps> = ({
  reactionType,
  onComplete,
  position,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const metadata = REACTION_METADATA[reactionType];

  useEffect(() => {
    // Start animation
    const animations = [];

    // Choose animation type based on metadata
    switch (metadata.animationType) {
      case 'bounce':
        animations.push(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1.5,
                tension: 50,
                friction: 3,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -100,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
        break;

      case 'pulse':
        animations.push(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1.8,
                tension: 50,
                friction: 5,
                useNativeDriver: true,
              }),
            ]),
            Animated.loop(
              Animated.sequence([
                Animated.timing(scale, {
                  toValue: 2,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 1.8,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]),
              { iterations: 2 }
            ),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -80,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
        break;

      case 'rotate':
        animations.push(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1.5,
                tension: 50,
                friction: 3,
                useNativeDriver: true,
              }),
              Animated.timing(rotate, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -100,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
        break;

      case 'scale':
      default:
        animations.push(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 2,
                tension: 40,
                friction: 3,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(scale, {
              toValue: 1.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -100,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
        break;
    }

    Animated.parallel(animations).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animationPosition = position || {
    x: SCREEN_WIDTH / 2 - 30,
    y: SCREEN_HEIGHT / 2 - 30,
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: animationPosition.x,
        top: animationPosition.y,
        opacity,
        transform: [
          { translateY },
          { scale },
          { rotate: spin },
        ],
        zIndex: 9999,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 60 }}>
          {metadata.emoji}
        </Text>
        
        {/* Optional: Add sparkles or other decorative elements */}
        {metadata.category === 'celebration' && (
          <View
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {['✨', '✨', '✨'].map((sparkle, index) => (
              <Animated.Text
                key={index}
                style={{
                  position: 'absolute',
                  fontSize: 20,
                  opacity: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.7],
                  }),
                  transform: [
                    {
                      translateX: index === 0 ? -20 : index === 1 ? 20 : 0,
                    },
                    {
                      translateY: index === 2 ? -20 : 10,
                    },
                    {
                      scale: scale.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0, 0.5, 1],
                      }),
                    },
                  ],
                }}
              >
                {sparkle}
              </Animated.Text>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default ReactionAnimation;