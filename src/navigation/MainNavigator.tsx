import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import PhotoValidationScreen from '../screens/tasks/PhotoValidationScreen';
import AnalyticsDashboard from '../screens/analytics/AnalyticsDashboard';
import FamilyScreen from '../screens/family/FamilyScreen';
import CreateFamilyScreen from '../screens/family/CreateFamilyScreen';
import JoinFamilyScreen from '../screens/family/JoinFamilyScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';
import SupportScreen from '../screens/support/SupportScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import FamilySettingsScreen from '../screens/family/FamilySettingsScreen';
import NotificationSettings from '../screens/settings/NotificationSettings';
import PerformanceDebugScreen from '../screens/settings/PerformanceDebugScreen';
import PrivacySettings from '../screens/settings/PrivacySettings';
import { useTheme } from '../contexts/ThemeContext';
import { useReduceMotion } from '../contexts/AccessibilityContext';
import {
  getNavigationAnimationConfig,
  getModalAnimationConfig,
  customTransitionPresets
} from './navigationAnimations';
import AnimatedTabBar from './AnimatedTabBar';

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Family: undefined;
  Settings: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Analytics: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
  PhotoValidation: undefined;
};

export type FamilyStackParamList = {
  FamilyHome: undefined;
  CreateFamily: undefined;
  JoinFamily: undefined;
  InviteMembers: undefined;
  FamilySettings: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  EditProfile: undefined;
  Premium: undefined;
  Support: undefined;
  Privacy: undefined;
  Terms: undefined;
  About: undefined;
  NotificationSettings: undefined;
  PerformanceDebug: undefined;
  PrivacySettings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const TasksStack = createStackNavigator<TasksStackParamList>();
const FamilyStack = createStackNavigator<FamilyStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Stack navigators for each tab
const DashboardStackNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const navigationAnimation = getNavigationAnimationConfig(reduceMotion);
  const modalAnimation = getModalAnimationConfig(reduceMotion);
  
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.separator,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        ...navigationAnimation,
      }}
    >
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerAccessibilityLabel: 'Dashboard Screen',
        }}
      />
      <DashboardStack.Screen
        name="Analytics"
        component={AnalyticsDashboard}
        options={{
          headerShown: false,
          presentation: 'modal' as any,
          headerAccessibilityLabel: 'Analytics Dashboard',
          ...modalAnimation,
        }}
      />
    </DashboardStack.Navigator>
  );
};

const TasksStackNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const navigationAnimation = getNavigationAnimationConfig(reduceMotion);
  const modalAnimation = getModalAnimationConfig(reduceMotion);
  
  return (
    <TasksStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.separator,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        ...navigationAnimation,
      }}
    >
      <TasksStack.Screen
        name="TasksList"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          headerAccessibilityLabel: 'Tasks List',
        }}
      />
      <TasksStack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          title: 'Create Task',
          presentation: 'modal' as any,
          headerAccessibilityLabel: 'Create New Task',
          ...modalAnimation,
        }}
      />
      <TasksStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          title: 'Task Details',
          presentation: 'modal' as any,
          headerAccessibilityLabel: 'Task Details',
          ...modalAnimation,
        }}
      />
      <TasksStack.Screen
        name="PhotoValidation"
        component={PhotoValidationScreen}
        options={{
          headerShown: false,
          presentation: 'modal' as any,
          headerAccessibilityLabel: 'Photo Validation',
          ...modalAnimation,
        }}
      />
    </TasksStack.Navigator>
  );
};

const FamilyStackNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const navigationAnimation = getNavigationAnimationConfig(reduceMotion);
  
  return (
    <FamilyStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.separator,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        ...navigationAnimation,
      }}
    >
      <FamilyStack.Screen
        name="FamilyHome"
        component={FamilyScreen}
        options={{
          title: 'Family',
          headerAccessibilityLabel: 'Family Members',
        }}
      />
      <FamilyStack.Screen
        name="CreateFamily"
        component={CreateFamilyScreen}
        options={{
          title: 'Create Family',
          headerAccessibilityLabel: 'Create New Family',
        }}
      />
      <FamilyStack.Screen
        name="JoinFamily"
        component={JoinFamilyScreen}
        options={{
          title: 'Join Family',
          headerAccessibilityLabel: 'Join Existing Family',
        }}
      />
      <FamilyStack.Screen
        name="FamilySettings"
        component={FamilySettingsScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Family Settings',
        }}
      />
    </FamilyStack.Navigator>
  );
};

const SettingsStackNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const navigationAnimation = getNavigationAnimationConfig(reduceMotion);
  const modalAnimation = getModalAnimationConfig(reduceMotion);
  
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.separator,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        ...navigationAnimation,
      }}
    >
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Settings',
        }}
      />
      <SettingsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Edit Profile',
        }}
      />
      <SettingsStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          headerShown: false,
          presentation: 'modal' as any,
          headerAccessibilityLabel: 'Premium Features',
          ...modalAnimation,
        }}
      />
      <SettingsStack.Screen
        name="Support"
        component={SupportScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Support',
        }}
      />
      <SettingsStack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Privacy Policy',
        }}
      />
      <SettingsStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Terms of Service',
        }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'About',
        }}
      />
      <SettingsStack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Notification Settings',
        }}
      />
      <SettingsStack.Screen
        name="PerformanceDebug"
        component={PerformanceDebugScreen}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Performance Debug',
        }}
      />
      <SettingsStack.Screen
        name="PrivacySettings"
        component={PrivacySettings}
        options={{
          headerShown: false,
          headerAccessibilityLabel: 'Privacy Settings',
        }}
      />
    </SettingsStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  // Announce screen changes to screen readers
  const announceScreenChange = (screenName: string) => {
    AccessibilityInfo.announceForAccessibility(`Navigated to ${screenName}`);
  };
  
  return (
    <Tab.Navigator
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          title: 'Home',
          tabBarTestID: 'dashboard-tab',
          tabBarAccessibilityLabel: 'Home Dashboard',
          tabBarButton: (props) => (
            <props.Component
              {...props}
              accessibilityRole="button"
              accessibilityLabel="Home Dashboard tab"
              accessibilityHint="Double tap to navigate to your dashboard"
            />
          ),
        }}
        listeners={{
          tabPress: () => announceScreenChange('Home Dashboard'),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{
          title: 'Tasks',
          tabBarTestID: 'tasks-tab',
          tabBarAccessibilityLabel: 'Tasks',
          tabBarButton: (props) => (
            <props.Component
              {...props}
              accessibilityRole="button"
              accessibilityLabel="Tasks tab"
              accessibilityHint="Double tap to view and manage your tasks"
            />
          ),
        }}
        listeners={{
          tabPress: () => announceScreenChange('Tasks'),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyStackNavigator}
        options={{
          title: 'Family',
          tabBarTestID: 'family-tab',
          tabBarAccessibilityLabel: 'Family',
          tabBarButton: (props) => (
            <props.Component
              {...props}
              accessibilityRole="button"
              accessibilityLabel="Family tab"
              accessibilityHint="Double tap to view family members and settings"
            />
          ),
        }}
        listeners={{
          tabPress: () => announceScreenChange('Family'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: 'Settings',
          tabBarTestID: 'settings-tab',
          tabBarAccessibilityLabel: 'Settings',
          tabBarButton: (props) => (
            <props.Component
              {...props}
              accessibilityRole="button"
              accessibilityLabel="Settings tab"
              accessibilityHint="Double tap to access app settings"
            />
          ),
        }}
        listeners={{
          tabPress: () => announceScreenChange('Settings'),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;