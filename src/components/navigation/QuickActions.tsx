/**
 * Quick Actions Floating Menu Component
 * 
 * Features:
 * - Floating action button with quick actions
 * - Quick task creation
 * - Start chat
 * - Create event
 * - Add celebration
 * - Contextual actions based on current screen
 * - Gesture-based expansion
 */

import React, { useState, useRef, useEffect } from 'react';
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
  cancelAnimation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppSelector } from '../../hooks/redux';
import { selectUserProfile } from '../../store/slices/authSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ActionItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  hidden?: boolean;
}

interface QuickActionButtonProps {
  action: ActionItem;
  index: number;
  isExpanded: boolean;
  theme: any;
  reduceMotion: boolean;
  onPress: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  index,
  isExpanded,
  theme,
  reduceMotion,
  onPress,
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      if (isExpanded) {
        // Stagger animation for each button
        const delay = index * 50;
        translateY.value = withSpring(-((index + 1) * 70), {
          damping: 15,
          stiffness: 200,
          mass: 0.8,
        });
        opacity.value = withTiming(1, { duration: 200 + delay });
        scale.value = withSpring(1, {
          damping: 12,
          stiffness: 180,
        });
        rotation.value = withSequence(
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        opacity.value = withTiming(0, { duration: 150 });
        scale.value = withTiming(0.8, { duration: 150 });
        rotation.value = withTiming(0, { duration: 150 });
      }
    } else {
      // No animations for reduced motion
      translateY.value = isExpanded ? -((index + 1) * 70) : 0;
      opacity.value = isExpanded ? 1 : 0;
      scale.value = isExpanded ? 1 : 0.8;
    }
  }, [isExpanded, index, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateX: interpolate(
          opacity.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const handlePress = () => {
    HapticFeedback.impact.light();
    onPress();
  };

  if (action.hidden) return null;

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        animatedStyle,
        { pointerEvents: isExpanded ? 'auto' : 'none' },
      ]}
    >
      <Animated.View style={[styles.labelContainer, animatedLabelStyle]}>
        <View
          style={[
            styles.labelBackground,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              styles.actionLabel,
              { color: theme.colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </View>
      </Animated.View>
      
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={action.label}
        accessibilityRole="button"
        accessibilityHint={`Double tap to ${action.label.toLowerCase()}`}
      >
        <View
          style={[
            styles.actionButton,
            {
              backgroundColor: action.color,
              shadowColor: action.color,
            },
          ]}
        >
          <Feather name={action.icon as any} size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface QuickActionsProps {
  navigation?: any;
}

const QuickActions: React.FC<QuickActionsProps> = ({ navigation: propNavigation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const navigation = propNavigation || useNavigation();
  const route = useRoute();
  const userProfile = useAppSelector(selectUserProfile);
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const fabScale = useSharedValue(1);

  // Get contextual actions based on current screen
  const getActions = (): ActionItem[] => {
    const baseActions: ActionItem[] = [
      {
        id: 'task',
        icon: 'plus-circle',
        label: 'Create Task',
        color: theme.colors.primary,
        onPress: () => {
          navigation.navigate('Tasks', {
            screen: 'CreateTask',
          });
          setIsExpanded(false);
        },
      },
      {
        id: 'chat',
        icon: 'message-circle',
        label: 'Start Chat',
        color: '#10B981',
        onPress: () => {
          navigation.navigate('Chat', {
            screen: 'NewChat',
          });
          setIsExpanded(false);
        },
      },
      {
        id: 'event',
        icon: 'calendar',
        label: 'Create Event',
        color: '#F59E0B',
        onPress: () => {
          navigation.navigate('Family', {
            screen: 'CreateEvent',
          });
          setIsExpanded(false);
        },
      },
      {
        id: 'celebration',
        icon: 'award',
        label: 'Add Celebration',
        color: '#8B5CF6',
        onPress: () => {
          navigation.navigate('Dashboard', {
            screen: 'AddCelebration',
          });
          setIsExpanded(false);
        },
      },
    ];

    // Add contextual actions based on current screen
    if (route.name === 'Family') {
      baseActions.push({
        id: 'invite',
        icon: 'user-plus',
        label: 'Invite Member',
        color: '#EC4899',
        onPress: () => {
          navigation.navigate('Family', {
            screen: 'InviteMembers',
          });
          setIsExpanded(false);
        },
        hidden: userProfile?.role === 'child',
      });
    }

    if (route.name === 'Tasks') {
      baseActions.unshift({
        id: 'quick-complete',
        icon: 'check-circle',
        label: 'Quick Complete',
        color: '#10B981',
        onPress: () => {
          // Handle quick task completion
          setIsExpanded(false);
        },
      });
    }

    return baseActions.filter(action => !action.hidden);
  };

  const actions = getActions();

  useEffect(() => {
    if (!reduceMotion) {
      if (isExpanded) {
        rotation.value = withSpring(45, {
          damping: 15,
          stiffness: 200,
        });
        backgroundOpacity.value = withTiming(1, { duration: 200 });
        fabScale.value = withSequence(
          withTiming(1.1, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
      } else {
        rotation.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
        backgroundOpacity.value = withTiming(0, { duration: 200 });
        fabScale.value = withTiming(1, { duration: 100 });
      }
    }
  }, [isExpanded, reduceMotion]);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      HapticFeedback.impact.medium();
    } else {
      HapticFeedback.selection();
    }
    
    // Announce state change
    AccessibilityInfo.announceForAccessibility(
      newState ? 'Quick actions menu opened' : 'Quick actions menu closed'
    );
  };

  // Pan gesture for dragging FAB
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Could implement FAB dragging here
    })
    .onEnd(() => {
      // Snap to edge or corner
    });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      HapticFeedback.impact.heavy();
      // Could show additional options
    });

  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: fabScale.value },
    ],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value * 0.5,
    pointerEvents: backgroundOpacity.value > 0 ? 'auto' : 'none',
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  return (
    <>
      {/* Background overlay */}
      <Animated.View
        style={[
          styles.overlay,
          animatedBackgroundStyle,
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setIsExpanded(false)}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Actions container */}
      <View
        style={[
          styles.container,
          {
            bottom: insets.bottom + 80,
            right: 20,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Action buttons */}
        {actions.map((action, index) => (
          <QuickActionButton
            key={action.id}
            action={action}
            index={index}
            isExpanded={isExpanded}
            theme={theme}
            reduceMotion={reduceMotion}
            onPress={action.onPress}
          />
        ))}

        {/* Main FAB */}
        <GestureDetector gesture={composedGesture}>
          <TouchableOpacity
            onPress={toggleExpanded}
            activeOpacity={0.9}
            accessibilityLabel="Quick actions menu"
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            accessibilityHint="Double tap to open quick actions menu"
          >
            <Animated.View
              style={[
                styles.fab,
                animatedFabStyle,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                },
              ]}
            >
              <Feather
                name="plus"
                size={28}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>
        </GestureDetector>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 0,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  labelContainer: {
    marginRight: 12,
  },
  labelBackground: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuickActions;