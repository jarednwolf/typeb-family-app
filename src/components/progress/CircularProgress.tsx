/**
 * Circular Progress Component
 * Shows progress in a circular format with animations
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  label?: string;
  icon?: string;
  animated?: boolean;
  gradient?: boolean;
  celebrateOnComplete?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = theme.colors.primary,
  backgroundColor = theme.colors.inputBackground,
  showPercentage = true,
  showValue = false,
  label,
  icon,
  animated = true,
  gradient = false,
  celebrateOnComplete = true,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  
  useEffect(() => {
    if (animated) {
      progress.value = withTiming(percentage / 100, {
        duration: 1000,
      });
      
      if (percentage >= 100 && celebrateOnComplete) {
        scale.value = withSequence(
          withSpring(1.1, { damping: 10, stiffness: 200 }),
          withSpring(1, { damping: 15, stiffness: 150 })
        );
      }
    } else {
      progress.value = percentage / 100;
    }
  }, [value, max, animated, celebrateOnComplete]);
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const textScale = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 0.5, 1],
          [1, 1.05, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  
  const getProgressColor = () => {
    if (gradient) {
      return 'url(#gradient)';
    }
    if (percentage >= 100) {
      return theme.colors.success;
    }
    return color;
  };
  
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          {gradient && (
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={theme.colors.primary} />
            </LinearGradient>
          )}
        </Defs>
        
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      
      <Animated.View style={[styles.content, textScale]}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={size * 0.2}
            color={percentage >= 100 ? theme.colors.success : color}
          />
        )}
        
        {showPercentage && (
          <Text
            style={[
              styles.percentage,
              {
                fontSize: size * 0.2,
                color: percentage >= 100 ? theme.colors.success : theme.colors.textPrimary,
              },
            ]}
          >
            {Math.round(percentage)}%
          </Text>
        )}
        
        {showValue && (
          <Text
            style={[
              styles.value,
              {
                fontSize: size * 0.12,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {value}/{max}
          </Text>
        )}
        
        {label && (
          <Text
            style={[
              styles.label,
              {
                fontSize: size * 0.1,
                color: theme.colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
        
        {percentage >= 100 && (
          <View style={styles.completeIcon}>
            <Ionicons
              name="checkmark-circle"
              size={size * 0.15}
              color={theme.colors.success}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '0deg' }],
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontWeight: 'bold',
  },
  value: {
    marginTop: 2,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
  completeIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});

export default CircularProgress;