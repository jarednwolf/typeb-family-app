import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { theme } from '../constants/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Family: undefined;
  Settings: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
};

export type FamilyStackParamList = {
  FamilyHome: undefined;
  InviteMembers: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  Notifications: undefined;
  Subscription: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const TasksStack = createStackNavigator<TasksStackParamList>();
const FamilyStack = createStackNavigator<FamilyStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Stack navigators for each tab
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#0A0A0A',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 17,
      },
    }}
  >
    <DashboardStack.Screen
      name="DashboardHome"
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
  </DashboardStack.Navigator>
);

const TasksStackNavigator = () => (
  <TasksStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#0A0A0A',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 17,
      },
    }}
  >
    <TasksStack.Screen
      name="TasksList"
      component={TasksScreen}
      options={{ title: 'Tasks' }}
    />
  </TasksStack.Navigator>
);

const FamilyStackNavigator = () => (
  <FamilyStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#0A0A0A',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 17,
      },
    }}
  >
    <FamilyStack.Screen
      name="FamilyHome"
      component={FamilyScreen}
      options={{ title: 'Family' }}
    />
  </FamilyStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#0A0A0A',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 17,
      },
    }}
  >
    <SettingsStack.Screen
      name="SettingsHome"
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </SettingsStack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = 24;
          const iconColor = focused ? theme.colors.primary : theme.colors.textTertiary;
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Tasks':
              iconName = 'clipboard';
              break;
            case 'Family':
              iconName = 'users';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <Feather
              name={iconName as any}
              size={iconSize}
              color={iconColor}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.separator,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyStackNavigator}
        options={{ title: 'Family' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;