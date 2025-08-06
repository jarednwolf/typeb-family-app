import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { View } from 'react-native';
import { HomeIcon, ClipboardIcon, UserGroupIcon, CogIcon } from 'react-native-heroicons/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardIcon as ClipboardIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CogIcon as CogIconSolid,
} from 'react-native-heroicons/solid';

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
          const iconColor = focused ? '#0A0A0A' : '#9CA3AF';

          if (route.name === 'Dashboard') {
            return focused ? (
              <HomeIconSolid size={iconSize} color={iconColor} />
            ) : (
              <HomeIcon size={iconSize} color={iconColor} />
            );
          } else if (route.name === 'Tasks') {
            return focused ? (
              <ClipboardIconSolid size={iconSize} color={iconColor} />
            ) : (
              <ClipboardIcon size={iconSize} color={iconColor} />
            );
          } else if (route.name === 'Family') {
            return focused ? (
              <UserGroupIconSolid size={iconSize} color={iconColor} />
            ) : (
              <UserGroupIcon size={iconSize} color={iconColor} />
            );
          } else if (route.name === 'Settings') {
            return focused ? (
              <CogIconSolid size={iconSize} color={iconColor} />
            ) : (
              <CogIcon size={iconSize} color={iconColor} />
            );
          }
          return null;
        },
        tabBarActiveTintColor: '#0A0A0A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
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