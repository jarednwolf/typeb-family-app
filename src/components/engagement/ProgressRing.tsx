import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

interface ProgressRingProps {
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  strokeWidth?: number;
  showText?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZES = {
  small: { width: 48, height: 48, strokeWidth: 3, fontSize: 12 },
  medium: { width: 80, height: 80, strokeWidth: 4, fontSize: 18 },
  large: { width: 120, height: 120, strokeWidth: 6, fontSize: 24 },
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 'medium',
  strokeWidth: customStrokeWidth,
  showText = true,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<any>(null);
  
  const sizeConfig = SIZES[size];
  const strokeWidth = customStrokeWidth || sizeConfig.strokeWidth;
  const radius = (sizeConfig.width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine color based on percentage
  const getColor = (percent: number) => {
    if (percent >= 76) return theme.colors.success;
    if (percent >= 51) return '#FFB800'; // Yellow
    if (percent >= 26) return theme.colors.warning;
    return theme.colors.error;
  };
  
  const color = getColor(clampedPercentage);
  
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: clampedPercentage,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [clampedPercentage]);
  
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  
  const rotation = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <View style={[styles.container, style]}>
      <Svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={styles.svg}
      >
        {/* Background circle */}
        <Circle
          cx={sizeConfig.width / 2}
          cy={sizeConfig.height / 2}
          r={radius}
          stroke={theme.colors.backgroundTexture}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          ref={circleRef}
          cx={sizeConfig.width / 2}
          cy={sizeConfig.height / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${sizeConfig.width / 2} ${sizeConfig.height / 2})`}
        />
      </Svg>
      
      {showText && (
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.percentageText,
              {
                fontSize: sizeConfig.fontSize,
                color: theme.colors.textPrimary,
                transform: [{ scale: animatedValue.interpolate({
                  inputRange: [0, 50, 100],
                  outputRange: [0.8, 1.1, 1],
                }) }],
              },
              textStyle,
            ]}
          >
            {Math.round(clampedPercentage)}%
          </Animated.Text>
        </View>
      )}
    </View>
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
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '700',
  },
});

export default ProgressRing;