/**
 * StatsCard Component - Dashboard statistics display
 * 
 * Features:
 * - Clean metric display
 * - Trend indicators
 * - Customizable colors
 * - Animated number changes
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, elevation } from '../../constants/theme';
import { useReduceMotion } from '../../contexts/AccessibilityContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  icon?: keyof typeof Feather.glyphMap;
  compact?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = colors.primary,
  icon,
  compact = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
    } else {
      // Subtle entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion]);

  const getTrendIcon = (): keyof typeof Feather.glyphMap => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'minus';
  };

  const getTrendColor = () => {
    if (trend === 'up') return colors.success;
    if (trend === 'down') return colors.error;
    return colors.textTertiary;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={28} color={color} />
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, compact && styles.valueCompact]}>
            {value}
          </Text>
          
          {trend && (
            <View style={styles.trendContainer}>
              <Feather
                name={getTrendIcon()}
                size={16}
                color={getTrendColor()}
              />
              {trendValue && (
                <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                  {trendValue}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <Text style={styles.title}>{title}</Text>
        
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
    </Animated.View>
  );
};

// Grid Stats Card for dashboard overview
export const GridStatsCard: React.FC<StatsCardProps> = (props) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion]);

  return (
    <Animated.View 
      style={[
        styles.gridContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <Text style={styles.gridTitle}>{props.title}</Text>
      <Text style={[styles.gridValue, { color: props.color || colors.primary }]}>
        {props.value}
      </Text>
      {props.subtitle && (
        <View style={styles.gridSubtitleContainer}>
          {props.trend && (
            <Feather
              name={props.trend === 'up' ? 'trending-up' : 'trending-down'}
              size={14}
              color={props.trend === 'up' ? colors.success : colors.error}
              style={styles.gridTrendIcon}
            />
          )}
          <Text style={styles.gridSubtitle}>{props.subtitle}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation[2], // Use elevation system instead of shadows
  },
  
  containerCompact: {
    padding: spacing.S,
  },
  
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.M,
  },
  
  content: {
    flex: 1,
  },
  
  title: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.XXS,
  },
  
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  
  value: {
    ...typography.title1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  valueCompact: {
    ...typography.title2,
  },
  
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.XS,
  },
  
  trendValue: {
    ...typography.caption1,
    fontWeight: '600',
    marginLeft: spacing.XXS,
  },
  
  subtitle: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginTop: spacing.XXS,
  },
  
  // Grid variant styles
  gridContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.M,
    flex: 1,
    minHeight: 100,
    justifyContent: 'space-between',
    ...elevation[2], // Use elevation system instead of shadows
  },
  
  gridTitle: {
    ...typography.caption1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  gridValue: {
    ...typography.title1,
    fontWeight: '600',
    marginVertical: spacing.XS,
  },
  
  gridSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  gridTrendIcon: {
    marginRight: spacing.XXS,
  },
  
  gridSubtitle: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
});

export default StatsCard;