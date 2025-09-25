/**
 * Notification Settings Screen
 * 
 * Granular notification controls:
 * - Push notification toggles by type
 * - Email preferences
 * - Quiet hours
 * - Sound customization
 * - Vibration patterns
 * - Preview in notifications
 * - Badge app icon settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
  AccessibilityInfo,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
// @ts-ignore - type shim provided in src/types/patches.d.ts
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUserProfile, setUserProfile } from '../../store/slices/authSlice';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
  category: 'tasks' | 'family' | 'rewards' | 'system';
}

interface QuietHours {
  enabled: boolean;
  startTime: Date;
  endTime: Date;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  previewEnabled: boolean;
  quietHours: QuietHours;
  notificationTypes: NotificationSetting[];
}

const NotificationSettings: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    emailEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    previewEnabled: true,
    quietHours: {
      enabled: false,
      startTime: new Date(2024, 0, 1, 22, 0), // 10 PM
      endTime: new Date(2024, 0, 1, 7, 0), // 7 AM
    },
    notificationTypes: [
      {
        id: 'task-reminders',
        title: 'Task Reminders',
        description: 'Get reminders for upcoming tasks',
        enabled: true,
        icon: 'clock',
        category: 'tasks',
      },
      {
        id: 'task-assigned',
        title: 'New Task Assigned',
        description: 'When someone assigns you a task',
        enabled: true,
        icon: 'clipboard',
        category: 'tasks',
      },
      {
        id: 'task-completed',
        title: 'Task Completed',
        description: 'When family members complete tasks',
        enabled: true,
        icon: 'check-circle',
        category: 'tasks',
      },
      {
        id: 'family-updates',
        title: 'Family Updates',
        description: 'Important family announcements',
        enabled: true,
        icon: 'users',
        category: 'family',
      },
      {
        id: 'new-member',
        title: 'New Family Member',
        description: 'When someone joins your family',
        enabled: true,
        icon: 'user-plus',
        category: 'family',
      },
      {
        id: 'rewards-earned',
        title: 'Rewards Earned',
        description: 'When you earn points or rewards',
        enabled: true,
        icon: 'award',
        category: 'rewards',
      },
      {
        id: 'achievements',
        title: 'Achievements Unlocked',
        description: 'New achievements and milestones',
        enabled: true,
        icon: 'star',
        category: 'rewards',
      },
      {
        id: 'app-updates',
        title: 'App Updates',
        description: 'New features and improvements',
        enabled: false,
        icon: 'info',
        category: 'system',
      },
    ],
  });
  
  useEffect(() => {
    loadPreferences();
    checkNotificationPermissions();
  }, []);
  
  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({
          ...preferences,
          ...parsed,
          quietHours: {
            ...preferences.quietHours,
            ...parsed.quietHours,
            startTime: parsed.quietHours?.startTime 
              ? new Date(parsed.quietHours.startTime)
              : preferences.quietHours.startTime,
            endTime: parsed.quietHours?.endTime
              ? new Date(parsed.quietHours.endTime)
              : preferences.quietHours.endTime,
          },
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };
  
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
      HapticFeedback.notification.success();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };
  
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && preferences.pushEnabled) {
      setPreferences(prev => ({ ...prev, pushEnabled: false }));
    }
  };

  const educateAndRequestPermissions = async () => {
    Alert.alert(
      'Enable Notifications',
      'Stay on track with reminders and updates. We only send relevant alerts and you can change this anytime.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
              savePreferences({ ...preferences, pushEnabled: true });
            } else {
              Alert.alert(
                'Permission Required',
                'Please enable notifications in your device settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
              );
            }
          },
        },
      ]
    );
  };
  
  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }
    
    const newPreferences = { ...preferences, pushEnabled: value };
    await savePreferences(newPreferences);
  };
  
  const handleNotificationTypeToggle = (id: string) => {
    const newTypes = preferences.notificationTypes.map(type =>
      type.id === id ? { ...type, enabled: !type.enabled } : type
    );
    const newPreferences = { ...preferences, notificationTypes: newTypes };
    savePreferences(newPreferences);
  };
  
  const handleQuietHoursToggle = (value: boolean) => {
    const newPreferences = {
      ...preferences,
      quietHours: { ...preferences.quietHours, enabled: value },
    };
    savePreferences(newPreferences);
    
    if (value) {
      AccessibilityInfo.announceForAccessibility('Quiet hours enabled');
    } else {
      AccessibilityInfo.announceForAccessibility('Quiet hours disabled');
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleTimeChange = (type: 'start' | 'end', selectedDate: Date) => {
    const newPreferences = {
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [type]: selectedDate,
      },
    };
    savePreferences(newPreferences);
  };
  
  const renderNotificationCategory = (category: string) => {
    const categoryTypes = preferences.notificationTypes.filter(
      type => type.category === category
    );
    
    const categoryTitles = {
      tasks: 'Task Notifications',
      family: 'Family Notifications',
      rewards: 'Rewards & Achievements',
      system: 'System Notifications',
    };
    
    return (
      <View key={category} style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: theme.colors.textSecondary }]}>
          {categoryTitles[category as keyof typeof categoryTitles]}
        </Text>
        {categoryTypes.map(type => (
          <View
            key={type.id}
            style={[
              styles.settingRow,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather
                  name={type.icon as any}
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  {type.title}
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                {type.description}
              </Text>
            </View>
            <Switch
              value={type.enabled && preferences.pushEnabled}
              onValueChange={() => handleNotificationTypeToggle(type.id)}
              disabled={!preferences.pushEnabled}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={type.enabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Notification Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Master Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            MASTER CONTROLS
          </Text>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="bell" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Push Notifications
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(val) => (val ? educateAndRequestPermissions() : handlePushToggle(false))}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.pushEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="mail" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Email Notifications
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Receive important updates via email
              </Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) => savePreferences({ ...preferences, emailEnabled: value })}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.emailEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        </View>
        
        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            PREFERENCES
          </Text>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="volume-2" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Sound
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => savePreferences({ ...preferences, soundEnabled: value })}
              disabled={!preferences.pushEnabled}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.soundEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          {Platform.OS === 'android' && (
            <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Feather name="smartphone" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                    Vibration
                  </Text>
                </View>
                <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={preferences.vibrationEnabled}
                onValueChange={(value) => savePreferences({ ...preferences, vibrationEnabled: value })}
                disabled={!preferences.pushEnabled}
                trackColor={{
                  false: theme.colors.separator,
                  true: theme.colors.primary + '80',
                }}
                thumbColor={preferences.vibrationEnabled ? theme.colors.primary : '#f4f3f4'}
                ios_backgroundColor={theme.colors.separator}
              />
            </View>
          )}
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="hash" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Badge App Icon
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Show notification count on app icon
              </Text>
            </View>
            <Switch
              value={preferences.badgeEnabled}
              onValueChange={(value) => savePreferences({ ...preferences, badgeEnabled: value })}
              disabled={!preferences.pushEnabled}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.badgeEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="eye" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Show Preview
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Show message content in notifications
              </Text>
            </View>
            <Switch
              value={preferences.previewEnabled}
              onValueChange={(value) => savePreferences({ ...preferences, previewEnabled: value })}
              disabled={!preferences.pushEnabled}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.previewEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        </View>
        
        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            QUIET HOURS
          </Text>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="moon" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Enable Quiet Hours
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Silence notifications during specific hours
              </Text>
            </View>
            <Switch
              value={preferences.quietHours.enabled}
              onValueChange={handleQuietHoursToggle}
              disabled={!preferences.pushEnabled}
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.quietHours.enabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          {preferences.quietHours.enabled && (
            <>
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowStartTimePicker(true)}
                disabled={!preferences.pushEnabled}
                accessibilityLabel="Set quiet hours start time"
                accessibilityRole="button"
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                    Start Time
                  </Text>
                </View>
                <View style={styles.timeValue}>
                  <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                    {formatTime(preferences.quietHours.startTime)}
                  </Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowEndTimePicker(true)}
                disabled={!preferences.pushEnabled}
                accessibilityLabel="Set quiet hours end time"
                accessibilityRole="button"
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                    End Time
                  </Text>
                </View>
                <View style={styles.timeValue}>
                  <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                    {formatTime(preferences.quietHours.endTime)}
                  </Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Notification Types */}
        {renderNotificationCategory('tasks')}
        {renderNotificationCategory('family')}
        {renderNotificationCategory('rewards')}
        {renderNotificationCategory('system')}
        
        {/* Test Notification */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Test Notification',
                  body: 'Your notification settings are working!',
                  sound: preferences.soundEnabled,
                },
                trigger: null,
              });
              HapticFeedback.notification.success();
            }}
            disabled={!preferences.pushEnabled}
            accessibilityLabel="Send test notification"
            accessibilityRole="button"
          >
            <Feather name="send" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={preferences.quietHours.startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event: any, selectedDate: Date | undefined) => {
            setShowStartTimePicker(false);
            if (selectedDate) {
              handleTimeChange('start', selectedDate);
            }
          }}
        />
      )}
      
      {showEndTimePicker && (
        <DateTimePicker
          value={preferences.quietHours.endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event: any, selectedDate: Date | undefined) => {
            setShowEndTimePicker(false);
            if (selectedDate) {
              handleTimeChange('end', selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categorySection: {
    marginTop: 24,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettings;