import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { logOut } from '../../store/slices/authSlice';
import { selectFamily } from '../../store/slices/familySlice';
import notificationService from '../../services/notifications';
import { NotificationPermissionHandler } from '../../components/notifications/NotificationPermissionHandler';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onChange?: (value: boolean) => void;
}

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const family = useSelector(selectFamily);
  
  const [notificationSettings, setNotificationSettings] = useState(
    notificationService.getSettings()
  );
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const hasPermission = await notificationService.checkPermissions();
    setHasNotificationPermission(hasPermission);
  };

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logOut()).unwrap();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }, [dispatch, navigation]);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    if (!hasNotificationPermission && value) {
      // Request permission first
      const granted = await notificationService.checkPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasNotificationPermission(true);
    }

    const newSettings = { ...notificationSettings, enabled: value };
    setNotificationSettings(newSettings);
    await notificationService.saveSettings(newSettings);
  }, [hasNotificationPermission, notificationSettings]);

  const handleReminderMinutesChange = useCallback(async (minutes: number) => {
    const newSettings = { ...notificationSettings, defaultReminderMinutes: minutes };
    setNotificationSettings(newSettings);
    await notificationService.saveSettings(newSettings);
  }, [notificationSettings]);

  const handleQuietHoursToggle = useCallback(async (value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      quietHours: { ...notificationSettings.quietHours, enabled: value }
    };
    setNotificationSettings(newSettings);
    await notificationService.saveSettings(newSettings);
  }, [notificationSettings]);

  const handleTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Please check permissions.');
    }
  }, []);

  const profileSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: currentUser?.email || undefined,
      icon: 'user',
      type: 'navigation',
      onPress: () => navigation.navigate('EditProfile' as never),
    },
  ];

  const notificationSettingsItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Enable Notifications',
      subtitle: hasNotificationPermission ? 'Get reminders for your tasks' : 'Permission required',
      icon: 'bell',
      type: 'toggle',
      value: notificationSettings.enabled && hasNotificationPermission,
      onChange: handleNotificationToggle,
    },
    {
      id: 'reminder-time',
      title: 'Default Reminder Time',
      subtitle: `${notificationSettings.defaultReminderMinutes} minutes before due`,
      icon: 'clock',
      type: 'navigation',
      onPress: () => {
        // TODO: Navigate to reminder time picker screen
        Alert.alert('Coming Soon', 'Reminder time customization coming soon!');
      },
    },
    {
      id: 'quiet-hours',
      title: 'Quiet Hours',
      subtitle: notificationSettings.quietHours.enabled
        ? `${notificationSettings.quietHours.start} - ${notificationSettings.quietHours.end}`
        : 'Disabled',
      icon: 'moon',
      type: 'toggle',
      value: notificationSettings.quietHours.enabled,
      onChange: handleQuietHoursToggle,
    },
    {
      id: 'test-notification',
      title: 'Test Notification',
      subtitle: 'Send a test notification',
      icon: 'send',
      type: 'action',
      onPress: handleTestNotification,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'appearance',
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      icon: 'moon',
      type: 'toggle',
      value: darkMode,
      onChange: setDarkMode,
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English',
      icon: 'globe',
      type: 'navigation',
      onPress: () => {},
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      type: 'navigation',
      onPress: () => navigation.navigate('Help' as never),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield',
      type: 'navigation',
      onPress: () => navigation.navigate('Privacy' as never),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'file-text',
      type: 'navigation',
      onPress: () => navigation.navigate('Terms' as never),
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'Version 1.0.0',
      icon: 'info',
      type: 'navigation',
      onPress: () => navigation.navigate('About' as never),
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Feather name={item.icon as any} size={20} color={theme.colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onChange}
            trackColor={{ 
              false: theme.colors.textTertiary, 
              true: theme.colors.success 
            }}
            thumbColor={theme.colors.surface}
            testID={`${item.id}-switch`}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        testID={`${item.id}-button`}
      >
        <View style={styles.settingLeft}>
          <Feather name={item.icon as any} size={20} color={theme.colors.primary} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        {item.type === 'navigation' && (
          <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{currentUser?.displayName || 'User'}</Text>
            <Text style={styles.userRole}>
              {family?.name || 'No Family'} • {(currentUser as any)?.role === 'parent' ? 'Parent' : 'Child'}
            </Text>
          </View>
        </View>
      </View>

      {/* Premium Banner */}
      {!(currentUser as any)?.isPremium && (
        <Card style={styles.premiumBanner}>
          <View style={styles.premiumContent}>
            <Feather name="star" size={24} color={theme.colors.premium} />
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>
                Unlock all features and remove limits
              </Text>
            </View>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => navigation.navigate('Premium' as never)}
              testID="premium-button"
            >
              <Text style={styles.premiumButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Notification Permission Handler */}
      {!hasNotificationPermission && (
        <NotificationPermissionHandler
          onPermissionGranted={() => {
            setHasNotificationPermission(true);
            checkNotificationPermission();
          }}
          showCard={true}
        />
      )}

      {/* Profile Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Card style={styles.sectionCard}>
          {profileSettings.map(renderSettingItem)}
        </Card>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.sectionCard}>
          {notificationSettingsItems.map(renderSettingItem)}
        </Card>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <Card style={styles.sectionCard}>
          {appSettings.map(renderSettingItem)}
        </Card>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.sectionCard}>
          {supportSettings.map(renderSettingItem)}
        </Card>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Button
          title="Logout"
          variant="danger"
          onPress={handleLogout}
          testID="logout-button"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ by TypeB Team
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.L,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textTertiary + '20',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.XXS,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  premiumBanner: {
    margin: theme.spacing.M,
    backgroundColor: theme.colors.premium + '10',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
    marginLeft: theme.spacing.M,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.XXS,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  premiumButton: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    backgroundColor: theme.colors.premium,
    borderRadius: theme.borderRadius.round,
  },
  premiumButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  section: {
    marginTop: theme.spacing.L,
    paddingHorizontal: theme.spacing.M,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.S,
    marginLeft: theme.spacing.S,
  },
  sectionCard: {
    paddingVertical: theme.spacing.S,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.M,
    paddingHorizontal: theme.spacing.M,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing.M,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.spacing.XXS,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  logoutSection: {
    padding: theme.spacing.L,
    marginTop: theme.spacing.L,
  },
  footer: {
    padding: theme.spacing.L,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default SettingsScreen;