import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getRandomEncouragement } from '../../services/encouragementMessages';

// Conditional import for haptics
let Haptics: any;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
  Haptics = null;
}

interface CompletionAnimationProps {
  onAnimationEnd?: () => void;
  showStarburst?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  onAnimationEnd,
  showStarburst = true,
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Animation values
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const starburstScale = useRef(new Animated.Value(0.5)).current;
  const starburstOpacity = useRef(new Animated.Value(0)).current;
  const starburstRotation = useRef(new Animated.Value(0)).current;

  const encouragementMessage = useRef(getRandomEncouragement()).current;

  useEffect(() => {
    // Trigger haptic feedback on iOS if available
    if (Platform.OS === 'ios' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Ignore haptic errors
      });
    }

    // Start animations
    Animated.parallel([
      // Checkmark animation - scales in with spring
      Animated.sequence([
        Animated.spring(checkmarkScale, {
          toValue: 1.2,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      
      // Checkmark fade in
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // Message float up and fade
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(messageTranslateY, {
            toValue: -40,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(messageOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(400),
            Animated.timing(messageOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),

      // Starburst animation (if enabled)
      ...(showStarburst ? [
        Animated.parallel([
          Animated.sequence([
            Animated.timing(starburstOpacity, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(starburstOpacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(starburstScale, {
            toValue: 2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(starburstRotation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ] : []),
    ]).start(() => {
      // Call callback when animation completes
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    });
  }, []);

  const starburstRotationInterpolated = starburstRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Starburst effect */}
      {showStarburst && (
        <Animated.View
          style={[
            styles.starburst,
            {
              opacity: starburstOpacity,
              transform: [
                { scale: starburstScale },
                { rotate: starburstRotationInterpolated },
              ],
            },
          ]}
        >
          {[...Array(8)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.starRay,
                {
                  backgroundColor: theme.colors.warning,
                  transform: [
                    { rotate: `${index * 45}deg` },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Checkmark */}
      <Animated.View
        style={[
          styles.checkmarkContainer,
          {
            opacity: checkmarkOpacity,
            transform: [{ scale: checkmarkScale }],
          },
        ]}
      >
        <View
          style={[
            styles.checkmarkCircle,
            { backgroundColor: theme.colors.success },
          ]}
        >
          <Feather name="check" size={32} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Encouragement message */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: messageOpacity,
            transform: [{ translateY: messageTranslateY }],
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: theme.colors.success },
          ]}
        >
          {encouragementMessage}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  starburst: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starRay: {
    position: 'absolute',
    width: 4,
    height: 60,
    borderRadius: 2,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  messageContainer: {
    position: 'absolute',
    top: '30%',
  },
  messageText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CompletionAnimation;