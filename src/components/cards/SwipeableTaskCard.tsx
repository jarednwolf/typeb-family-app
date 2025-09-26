/**
 * SwipeableTaskCard Component - TaskCard with swipe gestures
 * 
 * Features:
 * - Swipe right to complete task
 * - Swipe left to delete task
 * - Visual feedback during swipe
 * - Accessibility support
 * - Respects reduce motion settings
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import TaskCard from './TaskCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { useHaptics } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const DELETE_THRESHOLD = -SCREEN_WIDTH * 0.25;

interface SwipeableTaskCardProps {
  task: any; // Using any to match TaskCard's flexible task type
  onPress: () => void;
  onComplete: () => void;
  onDelete?: () => void;
  showAssignee?: boolean;
  swipeEnabled?: boolean;
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
  showAssignee = true,
  swipeEnabled = true,
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const haptics = useHaptics();
  
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(1);
  const opacity = useSharedValue(1);
  const actionTriggered = useRef(false);
  
  // Determine animation duration based on accessibility settings
  const animationDuration = reduceMotion ? 0 : 300;
  
  // Handle swipe completion
  const handleComplete = () => {
    'worklet';
    if (!actionTriggered.current) {
      actionTriggered.current = true;
      runOnJS(haptics.taskComplete)();
      runOnJS(onComplete)();
    }
  };
  
  // Handle swipe deletion
  const handleDelete = () => {
    'worklet';
    if (!actionTriggered.current && onDelete) {
      actionTriggered.current = true;
      runOnJS(haptics.taskDelete)();
      
      // Animate card disappearing
      itemHeight.value = withTiming(0, { duration: animationDuration });
      opacity.value = withTiming(0, { duration: animationDuration }, () => {
        runOnJS(onDelete)();
      });
    }
  };
  
  // Reset swipe position
  const resetPosition = () => {
    'worklet';
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
    });
    actionTriggered.current = false;
  };
  
  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      if (!swipeEnabled) return;
      
      // Apply resistance at edges
      const resistance = 0.5;
      let newTranslateX = ctx.startX + event.translationX;
      
      // Apply resistance when swiping beyond thresholds
      if (newTranslateX > SWIPE_THRESHOLD) {
        newTranslateX = SWIPE_THRESHOLD + (newTranslateX - SWIPE_THRESHOLD) * resistance;
      } else if (newTranslateX < DELETE_THRESHOLD) {
        newTranslateX = DELETE_THRESHOLD + (newTranslateX - DELETE_THRESHOLD) * resistance;
      }
      
      translateX.value = newTranslateX;
      
      // Haptic feedback at threshold
      if (Math.abs(newTranslateX) > Math.abs(SWIPE_THRESHOLD) * 0.8) {
        runOnJS(haptics.selection)();
      }
    },
    onEnd: () => {
      if (!swipeEnabled) return;
      
      if (translateX.value > SWIPE_THRESHOLD) {
        // Complete task
        translateX.value = withSpring(SCREEN_WIDTH, {
          damping: 20,
          stiffness: 200,
        });
        handleComplete();
      } else if (translateX.value < DELETE_THRESHOLD && onDelete) {
        // Delete task
        handleDelete();
      } else {
        // Reset position
        resetPosition();
      }
    },
  });
  
  // Animated styles for the card
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
  // Animated styles for the container (for height animation)
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: itemHeight.value === 1 ? undefined : itemHeight.value,
      opacity: opacity.value,
    };
  });
  
  // Animated styles for background actions
  const completeActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.8, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });
  
  const deleteActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [DELETE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      translateX.value,
      [DELETE_THRESHOLD, 0],
      [1, 0.8],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });
  
  return (
    <Animated.View style={animatedContainerStyle}>
      <View style={styles.container}>
        {/* Complete action background */}
        <View style={[styles.actionBackground, styles.completeBackground, 
          { backgroundColor: theme.colors.success }]}>
          <Animated.View style={completeActionStyle}>
            <Feather name="check-circle" size={28} color={theme.colors.white} />
            <Text style={[styles.actionText, { color: theme.colors.white }]}>Complete</Text>
          </Animated.View>
        </View>
        
        {/* Delete action background */}
        {onDelete && (
          <View style={[styles.actionBackground, styles.deleteBackground,
            { backgroundColor: theme.colors.error }]}>
            <Animated.View style={deleteActionStyle}>
              <Feather name="trash-2" size={28} color={theme.colors.white} />
              <Text style={[styles.actionText, { color: theme.colors.white }]}>Delete</Text>
            </Animated.View>
          </View>
        )}
        
        {/* Swipeable card */}
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          onHandlerStateChange={gestureHandler}
          enabled={swipeEnabled && !reduceMotion}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-10, 10]}
        >
          <Animated.View style={animatedCardStyle}>
            <TaskCard
              task={task}
              onPress={onPress}
              onComplete={onComplete}
              showAssignee={showAssignee}
            />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  completeBackground: {
    left: 0,
    right: SCREEN_WIDTH * 0.5,
  },
  
  deleteBackground: {
    left: SCREEN_WIDTH * 0.5,
    right: 0,
    alignItems: 'flex-end',
  },
  
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableTaskCard;