/**
 * OnboardingV2 Screen
 * 
 * Interactive onboarding flow with:
 * - Welcome screen with app benefits
 * - Role selection (Parent/Child)
 * - Feature discovery cards
 * - Permission requests (notifications, camera)
 * - Sample data preview
 * - Quick start guide
 * - Progress indicators
 * - Skip option for returning users
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  Alert,
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
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppDispatch } from '../../hooks/redux';
import { setUserProfile } from '../../store/slices/authSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = '@onboarding_completed';
const ONBOARDING_STEP_KEY = '@onboarding_current_step';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  image?: any;
  component?: React.ComponentType<any>;
}

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

// Step Components
const WelcomeStep: React.FC<any> = ({ onNext, theme }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.welcomeContent, animatedStyle]}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Feather name="home" size={80} color={theme.colors.primary} />
        </View>
        
        <Text style={[styles.welcomeTitle, { color: theme.colors.textPrimary }]}>
          Welcome to TypeB Family
        </Text>
        
        <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
          Bringing families together through fun tasks and meaningful rewards
        </Text>
        
        <View style={styles.benefitsContainer}>
          {[
            { icon: 'check-circle', text: 'Create and track family tasks' },
            { icon: 'award', text: 'Earn points and rewards' },
            { icon: 'users', text: 'Connect with family members' },
            { icon: 'trending-up', text: 'Build positive habits together' },
          ].map((benefit, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.delay(index * 100).duration(400)}
              style={styles.benefitRow}
            >
              <Feather
                name={benefit.icon as any}
                size={20}
                color={theme.colors.success}
              />
              <Text style={[styles.benefitText, { color: theme.colors.textPrimary }]}>
                {benefit.text}
              </Text>
            </Animated.View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onNext}
          accessibilityLabel="Get Started"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const RoleSelectionStep: React.FC<any> = ({ onNext, theme }) => {
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | null>(null);
  const dispatch = useAppDispatch();
  
  const handleRoleSelect = (role: 'parent' | 'child') => {
    setSelectedRole(role);
    HapticFeedback.impact.light();
    
    // Update user profile with role
    dispatch(setUserProfile({
      role,
    } as any));
  };
  
  const handleContinue = () => {
    if (selectedRole) {
      onNext();
    } else {
      Alert.alert('Select a Role', 'Please select whether you are a parent or child to continue.');
    }
  };
  
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
          Who's using the app?
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          This helps us personalize your experience
        </Text>
      </View>
      
      <View style={styles.roleCards}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: selectedRole === 'parent' ? theme.colors.primary : theme.colors.separator,
              borderWidth: selectedRole === 'parent' ? 2 : 1,
            },
          ]}
          onPress={() => handleRoleSelect('parent')}
          accessibilityLabel="Select Parent role"
          accessibilityRole="button"
          accessibilityState={{ selected: selectedRole === 'parent' }}
        >
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: '#3B82F6' + '20' },
            ]}
          >
            <Feather name="user-check" size={48} color="#3B82F6" />
          </View>
          <Text style={[styles.roleTitle, { color: theme.colors.textPrimary }]}>
            Parent
          </Text>
          <Text style={[styles.roleDescription, { color: theme.colors.textSecondary }]}>
            Create tasks, manage family, and track progress
          </Text>
          {selectedRole === 'parent' && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
              <Feather name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.roleCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: selectedRole === 'child' ? theme.colors.primary : theme.colors.separator,
              borderWidth: selectedRole === 'child' ? 2 : 1,
            },
          ]}
          onPress={() => handleRoleSelect('child')}
          accessibilityLabel="Select Child role"
          accessibilityRole="button"
          accessibilityState={{ selected: selectedRole === 'child' }}
        >
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: '#10B981' + '20' },
            ]}
          >
            <Feather name="smile" size={48} color="#10B981" />
          </View>
          <Text style={[styles.roleTitle, { color: theme.colors.textPrimary }]}>
            Child
          </Text>
          <Text style={[styles.roleDescription, { color: theme.colors.textSecondary }]}>
            Complete tasks, earn rewards, and have fun
          </Text>
          {selectedRole === 'child' && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
              <Feather name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: selectedRole ? theme.colors.primary : theme.colors.textTertiary,
          },
        ]}
        onPress={handleContinue}
        disabled={!selectedRole}
        accessibilityLabel="Continue"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const FeaturesStep: React.FC<any> = ({ onNext, theme }) => {
  const features: FeatureCard[] = [
    {
      id: '1',
      icon: 'clipboard',
      title: 'Task Management',
      description: 'Create, assign, and track family tasks',
      color: '#3B82F6',
    },
    {
      id: '2',
      icon: 'award',
      title: 'Rewards System',
      description: 'Earn points and unlock achievements',
      color: '#F59E0B',
    },
    {
      id: '3',
      icon: 'message-circle',
      title: 'Family Chat',
      description: 'Stay connected with built-in messaging',
      color: '#10B981',
    },
    {
      id: '4',
      icon: 'bar-chart-2',
      title: 'Progress Tracking',
      description: 'Monitor family activity and growth',
      color: '#8B5CF6',
    },
  ];
  
  return (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
          Discover Features
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          Everything you need to organize and motivate your family
        </Text>
      </View>
      
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <Animated.View
            key={feature.id}
            entering={FadeIn.delay(index * 100).duration(400)}
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: feature.color + '20' },
              ]}
            >
              <Feather
                name={feature.icon as any}
                size={32}
                color={feature.color}
              />
            </View>
            <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
              {feature.title}
            </Text>
            <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
              {feature.description}
            </Text>
          </Animated.View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
        onPress={onNext}
        accessibilityLabel="Continue"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const PermissionsStep: React.FC<any> = ({ onNext, theme }) => {
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  
  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    setNotificationsGranted(finalStatus === 'granted');
    HapticFeedback.notification.success();
    
    if (finalStatus === 'granted') {
      AccessibilityInfo.announceForAccessibility('Notifications enabled');
    } else {
      Alert.alert(
        'Notifications Disabled',
        'You can enable notifications later in Settings.',
      );
    }
  };
  
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraGranted(status === 'granted');
    HapticFeedback.notification.success();
    
    if (status === 'granted') {
      AccessibilityInfo.announceForAccessibility('Camera access granted');
    } else {
      Alert.alert(
        'Camera Access Denied',
        'You can enable camera access later in Settings.',
      );
    }
  };
  
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
          Enable Features
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          Grant permissions to unlock the full experience
        </Text>
      </View>
      
      <View style={styles.permissionsContainer}>
        <TouchableOpacity
          style={[
            styles.permissionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: notificationsGranted ? theme.colors.success : theme.colors.separator,
            },
          ]}
          onPress={requestNotificationPermission}
          disabled={notificationsGranted}
          accessibilityLabel="Enable notifications"
          accessibilityRole="button"
          accessibilityState={{ disabled: notificationsGranted }}
        >
          <View style={styles.permissionHeader}
            accessibilityLabel="Push Notifications permission card"
            accessibilityRole="summary"
          >
            <View
              style={[
                styles.permissionIcon,
                { backgroundColor: '#3B82F6' + '20' },
              ]}
            >
              <Feather name="bell" size={24} color="#3B82F6" />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]}>
                Push Notifications
              </Text>
              <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary }]}>
                Get reminders and updates
              </Text>
            </View>
          </View>
          {notificationsGranted ? (
            <Feather name="check-circle" size={24} color={theme.colors.success} />
          ) : (
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.permissionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: cameraGranted ? theme.colors.success : theme.colors.separator,
            },
          ]}
          onPress={requestCameraPermission}
          disabled={cameraGranted}
          accessibilityLabel="Enable camera"
          accessibilityRole="button"
          accessibilityState={{ disabled: cameraGranted }}
        >
          <View style={styles.permissionHeader}
            accessibilityLabel="Camera Access permission card"
            accessibilityRole="summary"
          >
            <View
              style={[
                styles.permissionIcon,
                { backgroundColor: '#10B981' + '20' },
              ]}
            >
              <Feather name="camera" size={24} color="#10B981" />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]}>
                Camera Access
              </Text>
              <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary }]}>
                Take photos for task completion
              </Text>
            </View>
          </View>
          {cameraGranted ? (
            <Feather name="check-circle" size={24} color={theme.colors.success} />
          ) : (
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestCameraPermission}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={onNext}
          accessibilityLabel="Skip"
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onNext}
          accessibilityLabel="Continue"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickStartStep: React.FC<any> = ({ onComplete, theme }) => {
  const quickStartItems = [
    { icon: 'user-plus', text: 'Create or join a family', done: false },
    { icon: 'clipboard', text: 'Create your first task', done: false },
    { icon: 'users', text: 'Invite family members', done: false },
    { icon: 'settings', text: 'Customize your settings', done: false },
  ];
  
  return (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
          Quick Start Guide
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          Complete these steps to get the most out of TypeB Family
        </Text>
      </View>
      
      <View style={styles.quickStartList}>
        {quickStartItems.map((item, index) => (
          <Animated.View
            key={index}
            entering={FadeIn.delay(index * 100).duration(400)}
            style={[
              styles.quickStartItem,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.quickStartIcon,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Feather
                name={item.icon as any}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.quickStartText, { color: theme.colors.textPrimary }]}>
              {item.text}
            </Text>
          </Animated.View>
        ))}
      </View>
      
      <View style={styles.completionContainer}>
        <View
          style={[
            styles.completionCard,
            { backgroundColor: theme.colors.primary }
          ]}
        >
          <Feather name="check-circle" size={48} color="#FFFFFF" />
          <Text style={styles.completionTitle}>You're All Set!</Text>
          <Text style={styles.completionDescription}>
            Start exploring TypeB Family and bring your family together
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
        onPress={onComplete}
        accessibilityLabel="Start Using App"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Start Using App</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export const OnboardingV2: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const steps = [
    { id: 'welcome', component: WelcomeStep },
    { id: 'role', component: RoleSelectionStep },
    { id: 'features', component: FeaturesStep },
    { id: 'permissions', component: PermissionsStep },
    { id: 'quickstart', component: QuickStartStep },
  ];
  
  const progress = useSharedValue(0);
  
  useEffect(() => {
    // Load persisted step
    (async () => {
      try {
        const savedStep = await AsyncStorage.getItem(ONBOARDING_STEP_KEY);
        if (savedStep) {
          const idx = parseInt(savedStep, 10);
          if (!Number.isNaN(idx)) setCurrentStep(Math.min(Math.max(idx, 0), steps.length - 1));
        }
      } catch {}
    })();

    if (!reduceMotion) {
      progress.value = withTiming(
        (currentStep + 1) / steps.length,
        { duration: 300 }
      );
    } else {
      progress.value = (currentStep + 1) / steps.length;
    }

    // Persist current step
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, String(currentStep)).catch(() => {});
  }, [currentStep, reduceMotion]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      HapticFeedback.impact.light();
    }
  };
  
  const handleSkip = async () => {
    Alert.alert(
      'Skip Onboarding?',
      'You can always access this guide from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await completeOnboarding();
          },
        },
      ],
    );
  };
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
      try { (require('../../services/analytics').default as any).track('onboarding_complete'); } catch {}
      HapticFeedback.notification.success();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };
  
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  
  const CurrentStepComponent = steps[currentStep].component;
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.separator },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                progressBarStyle,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.stepIndicator, { color: theme.colors.textSecondary }]}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
        
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Current Step */}
      <CurrentStepComponent
        onNext={handleNext}
        onComplete={completeOnboarding}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Welcome Step
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  
  // Role Selection
  roleCards: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  roleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Features
  featuresGrid: {
    marginBottom: 32,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Permissions
  permissionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Quick Start
  quickStartList: {
    marginBottom: 32,
  },
  quickStartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  quickStartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartText: {
    fontSize: 16,
    flex: 1,
  },
  completionContainer: {
    marginBottom: 32,
  },
  completionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  completionDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
});