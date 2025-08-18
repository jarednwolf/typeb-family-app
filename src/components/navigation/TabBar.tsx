/**
 * Enhanced Custom Tab Bar Component
 * 
 * Features:
 * - 5 tabs: Home, Tasks, Family, Chat, Profile
 * - Badge notifications for unread items
 * - Smooth animations on tab switch
 * - Haptic feedback on iOS
 * - Accessibility labels
 * - Dynamic tab visibility based on user role
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
  AccessibilityInfo,
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
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppSelector } from '../../hooks/redux';
import { selectUserProfile } from '../../store/slices/authSlice';

interface BadgeProps {
  count: number;
  theme: any;
}

const Badge: React.FC<BadgeProps> = ({ count, theme }) => {
  if (count <= 0) return null;
  
  const displayCount = count > 99 ? '99+' : count.toString();
  
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
      <Text style={[styles.badgeText, { color: theme.colors.surface }]}>
        {displayCount}
      </Text>
    </View>
  );
};

interface TabIconProps {
  route: any;
  focused: boolean;
  color: string;
  size: number;
  badgeCount?: number;
  theme: any;
}

const TabIcon: React.FC<TabIconProps> = ({ 
  route, 
  focused, 
  color, 
  size, 
  badgeCount = 0,
  theme 
}) => {
  const iconMap: { [key: string]: string } = {
    Home: 'home',
    Tasks: 'clipboard',
    Family: 'users',
    Chat: 'message-circle',
    Profile: 'user',
  };

  return (
    <View style={styles.iconContainer}>
      <Feather
        name={iconMap[route.name] as any}
        size={size}
        color={color}
      />
      <Badge count={badgeCount} theme={theme} />
    </View>
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
  badgeCount?: number;
  isVisible: boolean;
}

const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  route,
  descriptor,
  state,
  navigation,
  index,
  theme,
  reduceMotion,
  badgeCount = 0,
  isVisible,
}) => {
  if (!isVisible) return null;
  
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
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    if (!reduceMotion) {
      if (isFocused) {
        // Animate in with bounce
        scale.value = withSequence(
          withSpring(1.15, { damping: 10, stiffness: 200 }),
          withSpring(1.05, { damping: 15, stiffness: 180 })
        );
        iconTranslateY.value = withSequence(
          withSpring(-8, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        labelOpacity.value = withTiming(1, { duration: 200 });
        indicatorWidth.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        });
        rotation.value = withSequence(
          withTiming(5, { duration: 100 }),
          withTiming(-5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
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
        labelOpacity.value = withTiming(0.6, { duration: 200 });
        indicatorWidth.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
        rotation.value = withTiming(0, { duration: 200 });
      }
    } else {
      // No animations for reduced motion
      labelOpacity.value = isFocused ? 1 : 0.6;
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
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(`Navigated to ${label}`);
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
      scale.value = withSpring(0.9, {
        damping: 15,
        stiffness: 400,
      });
      backgroundOpacity.value = withTiming(0.15, { duration: 100 });
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
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      {
        scale: interpolate(
          labelOpacity.value,
          [0.6, 1],
          [0.9, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: interpolate(
      indicatorWidth.value,
      [0, 1],
      [0, 35],
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
      accessibilityLabel={options.tabBarAccessibilityLabel || label}
      accessibilityHint={`Double tap to navigate to ${label}`}
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
            badgeCount={badgeCount}
            theme={theme}
          />
        </Animated.View>
        
        <Animated.Text
          style={[
            styles.tabLabel,
            animatedLabelStyle,
            { color },
          ]}
          numberOfLines={1}
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

interface EnhancedTabBarProps extends BottomTabBarProps {
  badges?: {
    [key: string]: number;
  };
}

const EnhancedTabBar: React.FC<EnhancedTabBarProps> = ({
  state,
  descriptors,
  navigation,
  badges = {},
}) => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const userProfile = useAppSelector(selectUserProfile);
  const userRole = userProfile?.role;
  
  // Extended tab configuration
  const extendedTabs = [
    { name: 'Home', visible: true },
    { name: 'Tasks', visible: true },
    { name: 'Family', visible: true },
    { name: 'Chat', visible: true },
    { name: 'Profile', visible: true },
  ];
  
  // Dynamic visibility based on role
  const getTabVisibility = (tabName: string): boolean => {
    if (userRole === 'child') {
      // Hide certain tabs for children
      if (tabName === 'Family' && !badges.Family) {
        return false; // Hide family tab if no family members
      }
    }
    return true;
  };
  
  // Active indicator animation
  const indicatorPosition = useSharedValue(0);
  const visibleTabs = extendedTabs.filter(tab => getTabVisibility(tab.name));
  const tabWidth = Dimensions.get('window').width / visibleTabs.length;
  
  useEffect(() => {
    const currentIndex = visibleTabs.findIndex(tab => 
      state.routes[state.index]?.name === tab.name
    );
    
    if (currentIndex >= 0) {
      if (!reduceMotion) {
        indicatorPosition.value = withSpring(currentIndex * tabWidth, {
          damping: 20,
          stiffness: 200,
        });
      } else {
        indicatorPosition.value = currentIndex * tabWidth;
      }
    }
  }, [state.index, tabWidth, reduceMotion, visibleTabs]);
  
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
          paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 8,
        },
      ]}
    >
      {/* Background active indicator with gradient */}
      <Animated.View
        style={[
          styles.backgroundIndicator,
          animatedIndicatorStyle,
          {
            width: tabWidth,
            backgroundColor: theme.colors.primary + '08',
          },
        ]}
      />
      
      {/* Gradient overlay for depth */}
      <View 
        style={[
          styles.gradientOverlay,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(0,0,0,0.02)' 
              : 'rgba(255,255,255,0.5)',
          },
        ]}
      />
      
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const descriptor = descriptors[route.key];
          
          if (!descriptor) {
            return null;
          }
          
          const isVisible = getTabVisibility(route.name);
          const badgeCount = badges[route.name] || 0;
          
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
              badgeCount={badgeCount}
              isVisible={isVisible}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
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
    minHeight: 56,
  },
  tabBackground: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 8,
    right: 8,
    borderRadius: 16,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
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
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default EnhancedTabBar;