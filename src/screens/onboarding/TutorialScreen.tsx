/**
 * Interactive Tutorial Screen
 * 
 * Features:
 * - Highlighted UI elements
 * - Step-by-step instructions
 * - Interactive tooltips
 * - Practice mode
 * - Completion tracking
 * - Contextual help bubbles
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TUTORIAL_COMPLETION_KEY = '@tutorial_completed';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action?: string;
  icon?: string;
  skipable?: boolean;
}

interface TooltipProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  theme: any;
}

const Tooltip: React.FC<TooltipProps> = ({
  step,
  onNext,
  onSkip,
  isLastStep,
  theme,
}) => {
  const getTooltipPosition = () => {
    if (!step.highlightArea) {
      return { top: SCREEN_HEIGHT / 2 - 100, left: 20, right: 20 };
    }
    
    const { x, y, width, height } = step.highlightArea;
    const tooltipHeight = 180;
    const margin = 20;
    
    switch (step.position) {
      case 'top':
        return {
          bottom: SCREEN_HEIGHT - y + margin,
          left: margin,
          right: margin,
        };
      case 'bottom':
        return {
          top: y + height + margin,
          left: margin,
          right: margin,
        };
      case 'center':
      default:
        return {
          top: SCREEN_HEIGHT / 2 - tooltipHeight / 2,
          left: margin,
          right: margin,
        };
    }
  };
  
  const position = getTooltipPosition();
  
  return (
    <Animated.View
      entering={ZoomIn.duration(300).springify()}
      exiting={ZoomOut.duration(200)}
      style={[
        styles.tooltip,
        position,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {step.icon && (
        <View
          style={[
            styles.tooltipIcon,
            { backgroundColor: theme.colors.primary + '20' },
          ]}
        >
          <Feather
            name={step.icon as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}
      
      <Text style={[styles.tooltipTitle, { color: theme.colors.textPrimary }]}>
        {step.title}
      </Text>
      
      <Text style={[styles.tooltipDescription, { color: theme.colors.textSecondary }]}>
        {step.description}
      </Text>
      
      {step.action && (
        <View
          style={[
            styles.actionHint,
            { backgroundColor: theme.colors.primary + '10' },
          ]}
        >
          <Feather
            name="move"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.actionText,
              { color: theme.colors.primary },
            ]}
          >
            {step.action}
          </Text>
        </View>
      )}
      
      <View style={styles.tooltipButtons}>
        {step.skipable && (
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipButton}
            accessibilityLabel="Skip tutorial"
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={onNext}
          style={[
            styles.nextButton,
            { backgroundColor: theme.colors.primary },
          ]}
          accessibilityLabel={isLastStep ? "Finish tutorial" : "Next step"}
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Finish' : 'Next'}
          </Text>
          <Feather
            name={isLastStep ? 'check' : 'arrow-right'}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface HighlightOverlayProps {
  area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  theme: any;
  reduceMotion: boolean;
}

const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  area,
  theme,
  reduceMotion,
}) => {
  const pulseAnimation = useSharedValue(1);
  
  useEffect(() => {
    if (!reduceMotion && area) {
      pulseAnimation.value = withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      );
    }
  }, [area, reduceMotion]);
  
  const animatedHighlightStyle = useAnimatedStyle(() => {
    if (!area) return {};
    
    return {
      transform: [{ scale: pulseAnimation.value }],
    };
  });
  
  if (!area) {
    return (
      <View
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        ]}
        pointerEvents="none"
      />
    );
  }
  
  return (
    <View style={styles.highlightContainer} pointerEvents="none">
      {/* Top overlay */}
      <View
        style={[
          styles.overlaySection,
          {
            top: 0,
            left: 0,
            right: 0,
            height: area.y,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        ]}
      />
      
      {/* Left overlay */}
      <View
        style={[
          styles.overlaySection,
          {
            top: area.y,
            left: 0,
            width: area.x,
            height: area.height,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        ]}
      />
      
      {/* Right overlay */}
      <View
        style={[
          styles.overlaySection,
          {
            top: area.y,
            right: 0,
            left: area.x + area.width,
            height: area.height,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        ]}
      />
      
      {/* Bottom overlay */}
      <View
        style={[
          styles.overlaySection,
          {
            top: area.y + area.height,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        ]}
      />
      
      {/* Highlight border */}
      <Animated.View
        style={[
          styles.highlightBorder,
          {
            top: area.y - 4,
            left: area.x - 4,
            width: area.width + 8,
            height: area.height + 8,
            borderColor: theme.colors.primary,
          },
          animatedHighlightStyle,
        ]}
      />
    </View>
  );
};

interface TutorialScreenProps {
  visible: boolean;
  onComplete: () => void;
  context?: 'onboarding' | 'task' | 'family' | 'general';
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({
  visible,
  onComplete,
  context = 'general',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  
  // Define tutorial steps based on context
  const getTutorialSteps = (): TutorialStep[] => {
    switch (context) {
      case 'onboarding':
        return [
          {
            id: 'welcome',
            title: 'Welcome to Your Dashboard',
            description: 'This is your family hub where you can see all activities at a glance.',
            position: 'center',
            icon: 'home',
            skipable: true,
          },
          {
            id: 'navigation',
            title: 'Navigate with Ease',
            description: 'Use the bottom tabs to switch between different sections of the app.',
            highlightArea: { x: 0, y: SCREEN_HEIGHT - 80, width: SCREEN_WIDTH, height: 80 },
            position: 'top',
            action: 'Tap any tab to explore',
            icon: 'navigation',
          },
          {
            id: 'quick-actions',
            title: 'Quick Actions',
            description: 'Tap the floating button to quickly create tasks, events, or start chats.',
            highlightArea: { x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 160, width: 60, height: 60 },
            position: 'top',
            action: 'Tap to open quick actions',
            icon: 'plus-circle',
          },
          {
            id: 'notifications',
            title: 'Stay Updated',
            description: 'Red badges show unread notifications and pending tasks.',
            highlightArea: { x: 20, y: 60, width: 40, height: 40 },
            position: 'bottom',
            icon: 'bell',
          },
        ];
      
      case 'task':
        return [
          {
            id: 'create-task',
            title: 'Creating Tasks',
            description: 'Tap the plus button to create a new task for your family.',
            highlightArea: { x: SCREEN_WIDTH - 80, y: 100, width: 60, height: 60 },
            position: 'bottom',
            action: 'Tap to create',
            icon: 'plus',
          },
          {
            id: 'task-details',
            title: 'Task Details',
            description: 'Tap any task to view details, add photos, or mark as complete.',
            position: 'center',
            action: 'Tap a task card',
            icon: 'clipboard',
          },
          {
            id: 'photo-proof',
            title: 'Photo Verification',
            description: 'Some tasks require photo proof. Take a picture when completing.',
            position: 'center',
            icon: 'camera',
          },
        ];
      
      default:
        return [
          {
            id: 'explore',
            title: 'Explore the App',
            description: 'Take a moment to explore different features at your own pace.',
            position: 'center',
            icon: 'compass',
            skipable: true,
          },
        ];
    }
  };
  
  const steps = getTutorialSteps();
  const progress = (currentStep + 1) / steps.length;
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      HapticFeedback.impact.light();
      
      // Announce step change for accessibility
      AccessibilityInfo.announceForAccessibility(
        `Step ${currentStep + 2} of ${steps.length}`
      );
    } else {
      completeTutorial();
    }
  };
  
  const handleSkip = () => {
    completeTutorial();
  };
  
  const completeTutorial = async () => {
    setIsCompleted(true);
    HapticFeedback.notification.success();
    
    // Save completion status
    try {
      await AsyncStorage.setItem(
        `${TUTORIAL_COMPLETION_KEY}_${context}`,
        'true'
      );
    } catch (error) {
      console.error('Error saving tutorial completion:', error);
    }
    
    // Delay before closing to show completion animation
    setTimeout(() => {
      onComplete();
    }, 500);
  };
  
  if (!visible) return null;
  
  const currentStepData = steps[currentStep];
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        <HighlightOverlay
          area={currentStepData.highlightArea}
          theme={theme}
          reduceMotion={reduceMotion}
        />
        
        {/* Progress Bar */}
        <View
          style={[
            styles.progressContainer,
            { top: insets.top + 20 },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {steps.length}
          </Text>
        </View>
        
        {/* Tooltip */}
        {!isCompleted && (
          <Tooltip
            step={currentStepData}
            onNext={handleNext}
            onSkip={handleSkip}
            isLastStep={currentStep === steps.length - 1}
            theme={theme}
          />
        )}
        
        {/* Completion Animation */}
        {isCompleted && (
          <Animated.View
            entering={ZoomIn.duration(400).springify()}
            style={styles.completionContainer}
          >
            <View
              style={[
                styles.completionCard,
                { backgroundColor: theme.colors.success },
              ]}
            >
              <Feather name="check-circle" size={64} color="#FFFFFF" />
              <Text style={styles.completionText}>Tutorial Complete!</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  highlightContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    position: 'absolute',
  },
  highlightBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  progressContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1000,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltip: {
    position: 'absolute',
    padding: 20,
    borderRadius: 16,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completionContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  completionCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
});

export default TutorialScreen;