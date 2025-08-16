/**
 * AnimatedTabBar Component
 * 
 * Custom animated bottom tab bar with micro-interactions
 * Features:
 * - Scale animation on tab press
 * - Active tab indicator animation
 * - Icon bounce on selection
 * - Accessibility support
 * - Haptic feedback
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useReduceMotion } from '../contexts/AccessibilityContext';
import { HapticFeedback } from '../utils/haptics';

interface TabIconProps {
  route: any;
  focused: boolean;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ route, focused, color, size }) => {
  const iconMap: { [key: string]: string } = {
    Dashboard: 'home',
    Tasks: 'clipboard',
    Family: 'users',
    Settings: 'settings',
  };

  return (
    <Feather
      name={iconMap[route.name] as any}
      size={size}
      color={color}
    />
  );
};

interface AnimatedTabItemProps {
  route: any;
  descriptor: any;
  state: any;
  navigation: any;
  index: number;
  theme: any;
  reduceMotion: boolean;
}

const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  route,
  descriptor,
  state,
  navigation,
  index,
  theme,
  reduceMotion,
}) => {
  const { options } = descriptor;
  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
      ? options.title
      : route.name;

  const isFocused = state.index === index;
  
  // Animation values
  const scale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.7);
  const indicatorWidth = useSharedValue(isFocused ? 1 : 0);
  const backgroundOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (!reduceMotion) {
      if (isFocused) {
        // Animate in
        scale.value = withSpring(1.05, {
          damping: 15,
          stiffness: 200,
        });
        iconTranslateY.value = withSequence(
          withSpring(-5, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        labelOpacity.value = withTiming(1, { duration: 200 });
        indicatorWidth.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        });
      } else {
        // Animate out
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        });
        iconTranslateY.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
        labelOpacity.value = withTiming(0.7, { duration: 200 });
        indicatorWidth.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      }
    } else {
      // No animations for reduced motion
      labelOpacity.value = isFocused ? 1 : 0.7;
      indicatorWidth.value = isFocused ? 1 : 0;
    }
  }, [isFocused, reduceMotion]);

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        HapticFeedback.impact.light();
      } else {
        HapticFeedback.selection();
      }
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
    
    // Stronger haptic for long press
    if (Platform.OS === 'ios') {
      HapticFeedback.impact.medium();
    } else {
      HapticFeedback.selection();
    }
  };

  const onPressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 400,
      });
      backgroundOpacity.value = withTiming(0.1, { duration: 100 });
    }
  };

  const onPressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(isFocused ? 1.05 : 1, {
        damping: 15,
        stiffness: 200,
      });
      backgroundOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: interpolate(
      indicatorWidth.value,
      [0, 1],
      [0, 30],
      Extrapolate.CLAMP
    ),
    opacity: indicatorWidth.value,
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const color = isFocused ? theme.colors.primary : theme.colors.textTertiary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.tabItem, animatedContainerStyle]}>
        <Animated.View
          style={[
            styles.tabBackground,
            animatedBackgroundStyle,
            { backgroundColor: theme.colors.primary },
          ]}
        />
        
        <Animated.View style={animatedIconStyle}>
          <TabIcon
            route={route}
            focused={isFocused}
            color={color}
            size={24}
          />
        </Animated.View>
        
        <Animated.Text
          style={[
            styles.tabLabel,
            animatedLabelStyle,
            { color },
          ]}
        >
          {label}
        </Animated.Text>
        
        <Animated.View
          style={[
            styles.indicator,
            animatedIndicatorStyle,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const AnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  
  // Active indicator animation
  const indicatorPosition = useSharedValue(0);
  const tabWidth = Dimensions.get('window').width / state.routes.length;
  
  useEffect(() => {
    if (!reduceMotion) {
      indicatorPosition.value = withSpring(state.index * tabWidth, {
        damping: 20,
        stiffness: 200,
      });
    } else {
      indicatorPosition.value = state.index * tabWidth;
    }
  }, [state.index, tabWidth, reduceMotion]);
  
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.separator,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 5,
        },
      ]}
    >
      {/* Background active indicator */}
      <Animated.View
        style={[
          styles.backgroundIndicator,
          animatedIndicatorStyle,
          {
            width: tabWidth,
            backgroundColor: theme.colors.primary + '10',
          },
        ]}
      />
      
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const descriptor = descriptors[route.key];
          
          if (!descriptor) {
            return null;
          }
          
          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              descriptor={descriptor}
              state={state}
              navigation={navigation}
              index={index}
              theme={theme}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 8,
    right: 8,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
  backgroundIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
});

export default AnimatedTabBar;