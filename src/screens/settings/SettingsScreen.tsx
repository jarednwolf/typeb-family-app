import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { logOut } from '../../store/slices/authSlice';
import { selectFamily } from '../../store/slices/familySlice';
import { setThemeMode } from '../../store/slices/themeSlice';
import notificationService from '../../services/notifications';
import { NotificationPermissionHandler } from '../../components/notifications/NotificationPermissionHandler';
import { useTheme } from '../../contexts/ThemeContext';
import ReminderTimePicker from '../../components/pickers/ReminderTimePicker';
import LanguageSelector from '../../components/pickers/LanguageSelector';

// Language configuration
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

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
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector(selectFamily);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const { isDarkMode, theme: currentTheme } = useTheme();
  
  const [notificationSettings, setNotificationSettings] = useState(
    notificationService.getSettings()
  );
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    checkNotificationPermission();
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

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

  const handleDarkModeToggle = useCallback((value: boolean) => {
    dispatch(setThemeMode(value ? 'dark' : 'light'));
  }, [dispatch]);

  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language);
  }, []);

  const profileSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: userProfile?.email || undefined,
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
        setShowReminderPicker(true);
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
      subtitle: themeMode === 'system' ? 'Following system' : (isDarkMode ? 'Dark theme' : 'Light theme'),
      icon: 'moon',
      type: 'toggle',
      value: isDarkMode,
      onChange: handleDarkModeToggle,
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name || 'English',
      icon: 'globe',
      type: 'navigation',
      onPress: () => setShowLanguageSelector(true),
    },
    {
      id: 'notification-settings',
      title: 'Advanced Notifications',
      subtitle: 'Configure detailed notification preferences',
      icon: 'bell',
      type: 'navigation',
      onPress: () => navigation.navigate('NotificationSettings' as never),
    },
    {
      id: 'privacy-settings',
      title: 'Privacy & Security',
      subtitle: 'Manage your data and privacy settings',
      icon: 'lock',
      type: 'navigation',
      onPress: () => navigation.navigate('PrivacySettings' as never),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'support',
      title: 'Help & Support',
      icon: 'help-circle',
      type: 'navigation',
      onPress: () => navigation.navigate('Support' as never),
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
    ...(__DEV__ ? [{
      id: 'performance-debug',
      title: 'Performance Monitor',
      subtitle: 'View app performance metrics',
      icon: 'activity' as const,
      type: 'navigation' as const,
      onPress: () => navigation.navigate('PerformanceDebug' as never),
    }] : []),
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={[styles.settingItem, { backgroundColor: currentTheme.colors.surface }]}>
          <View style={styles.settingLeft}>
            <Feather name={item.icon as any} size={20} color={currentTheme.colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: currentTheme.colors.textPrimary }]}>{item.title}</Text>
              {item.subtitle && (
                <Text style={[styles.settingSubtitle, { color: currentTheme.colors.textSecondary }]}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onChange}
            trackColor={{
              false: isDarkMode ? '#48484A' : '#C7C7CC',
              true: currentTheme.colors.success
            }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            testID={`${item.id}-switch`}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, { backgroundColor: currentTheme.colors.surface }]}
        onPress={item.onPress}
        testID={`${item.id}-button`}
      >
        <View style={styles.settingLeft}>
          <Feather name={item.icon as any} size={20} color={currentTheme.colors.primary} />
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: currentTheme.colors.textPrimary }]}>{item.title}</Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: currentTheme.colors.textSecondary }]}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        {item.type === 'navigation' && (
          <Feather name="chevron-right" size={20} color={currentTheme.colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, {
        backgroundColor: currentTheme.colors.surface,
        borderBottomColor: currentTheme.colors.separator
      }]}>
        <Text style={[styles.screenTitle, { color: currentTheme.colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact User Profile Card */}
        <TouchableOpacity
          style={[styles.compactProfileCard, { backgroundColor: currentTheme.colors.surface }]}
          onPress={() => navigation.navigate('EditProfile' as never)}
          activeOpacity={0.7}
        >
          <View style={styles.compactProfileContent}>
            <View style={[styles.compactAvatar, { backgroundColor: currentTheme.colors.primary }]}>
              <Text style={[styles.compactAvatarText, { color: currentTheme.colors.white }]}>
                {userProfile?.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.compactUserDetails}>
              <Text style={[styles.compactUserName, { color: currentTheme.colors.textPrimary }]}>{userProfile?.displayName || 'User'}</Text>
              <View style={styles.compactUserMeta}>
                <Text style={[styles.compactBadgeText, { color: currentTheme.colors.textSecondary }, userProfile?.role === 'parent' && { color: currentTheme.colors.success }]}>
                  {userProfile?.role === 'parent' ? 'Parent' : 'Child'}
                </Text>
                {family && (
                  <>
                    <Text style={[styles.metaSeparator, { color: currentTheme.colors.textTertiary }]}>•</Text>
                    <Text style={[styles.compactFamilyLabel, { color: currentTheme.colors.textSecondary }]}>{family.name}</Text>
                  </>
                )}
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={currentTheme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Premium Banner - Same as Family Screen */}
        {!userProfile?.isPremium && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Premium' as never)}
          >
            <Card style={[styles.premiumBanner, { backgroundColor: '#FFD70025' }]}>
              <View style={styles.premiumContent}>
                <View style={styles.premiumLeft}>
                  <View style={[styles.premiumIconContainer, { backgroundColor: '#FFD70035' }]}>
                    <Feather name="star" size={24} color="#FFD700" />
                  </View>
                  <View style={styles.premiumTextContainer}>
                    <Text style={[styles.premiumTitle, { color: currentTheme.colors.textPrimary }]}>Upgrade to Premium</Text>
                    <Text style={[styles.premiumDescription, { color: currentTheme.colors.textSecondary }]}>
                      Get unlimited members, advanced features, and priority support
                    </Text>
                  </View>
                </View>
                <View style={styles.premiumCTA}>
                  <Feather name="arrow-right" size={18} color={currentTheme.colors.primary} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Notification Permission - Compact Design */}
        {!hasNotificationPermission && (
          <Card style={[styles.notificationCard, {
            backgroundColor: isDarkMode ? currentTheme.colors.surface : currentTheme.colors.white
          }]}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={[styles.notificationIcon, { backgroundColor: currentTheme.colors.primary + '10' }]}>
                  <Feather name="bell" size={24} color={isDarkMode ? currentTheme.colors.info : currentTheme.colors.primary} />
                </View>
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationTitle, { color: isDarkMode ? '#FFFFFF' : currentTheme.colors.textPrimary }]}>Enable Notifications</Text>
                  <Text style={[styles.notificationDescription, { color: isDarkMode ? '#EBEBF5' : currentTheme.colors.textSecondary }]}>
                    Get timely reminders for your tasks so you never miss what's important.
                  </Text>
                </View>
              </View>
              <View style={styles.notificationBenefits}>
                <View style={styles.benefitItem}>
                  <Feather name="check-circle" size={14} color={currentTheme.colors.success} />
                  <Text style={[styles.benefitText, { color: isDarkMode ? currentTheme.colors.textPrimary : theme.colors.textPrimary }]}>Task reminders</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="check-circle" size={14} color={currentTheme.colors.success} />
                  <Text style={[styles.benefitText, { color: isDarkMode ? currentTheme.colors.textPrimary : theme.colors.textPrimary }]}>Family updates</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="check-circle" size={14} color={currentTheme.colors.success} />
                  <Text style={[styles.benefitText, { color: isDarkMode ? currentTheme.colors.textPrimary : theme.colors.textPrimary }]}>Achievement alerts</Text>
                </View>
              </View>
              <Button
                title="Enable Notifications"
                onPress={async () => {
                  const granted = await notificationService.checkPermissions();
                  if (granted) {
                    setHasNotificationPermission(true);
                  }
                }}
                icon="bell"
                style={styles.notificationButton}
              />
            </View>
          </Card>
        )}

        {/* Settings Sections with Better Visual Hierarchy */}
        {hasNotificationPermission && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>Notifications</Text>
            <View style={[styles.sectionItems, { backgroundColor: currentTheme.colors.surface }]}>
              {notificationSettingsItems.map((item, index) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {index < notificationSettingsItems.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: currentTheme.colors.separator }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>Preferences</Text>
          <View style={[styles.sectionItems, { backgroundColor: currentTheme.colors.surface }]}>
            {appSettings.map((item, index) => (
              <View key={item.id}>
                {renderSettingItem(item)}
                {index < appSettings.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: currentTheme.colors.separator }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>Help & Support</Text>
          <View style={[styles.sectionItems, { backgroundColor: currentTheme.colors.surface }]}>
            {supportSettings.map((item, index) => (
              <View key={item.id}>
                {renderSettingItem(item)}
                {index < supportSettings.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: currentTheme.colors.separator }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: currentTheme.colors.surface }]}
            onPress={handleLogout}
            activeOpacity={0.7}
            testID="signout-button"
          >
            <Feather name="log-out" size={20} color={currentTheme.colors.error} />
            <Text style={[styles.logoutText, { color: currentTheme.colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.colors.textSecondary }]}>TypeB v1.0.0</Text>
          <Text style={[styles.footerSubtext, { color: currentTheme.colors.textTertiary }]}>More than checking the box</Text>
        </View>
      </ScrollView>

      {/* Reminder Time Picker Modal */}
      <ReminderTimePicker
        visible={showReminderPicker}
        onClose={() => setShowReminderPicker(false)}
        onSave={handleReminderMinutesChange}
        currentMinutes={notificationSettings.defaultReminderMinutes}
      />

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedHeader: {
    paddingHorizontal: theme.spacing.L,
    paddingVertical: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  screenTitle: {
    fontSize: theme.typography.title2.fontSize,
    fontWeight: theme.typography.title2.fontWeight as any,
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.M,
    paddingBottom: theme.spacing.XXL,
  },
  compactProfileCard: {
    marginHorizontal: theme.spacing.L,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  compactProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.M,
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  compactAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  compactUserDetails: {
    flex: 1,
  },
  compactUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  compactUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  parentBadgeText: {
    color: theme.colors.success,
  },
  metaSeparator: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.XS,
  },
  compactFamilyLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  premiumBanner: {
    marginHorizontal: theme.spacing.L,
    marginTop: theme.spacing.M,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: theme.colors.premium + '15',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.M,
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.premium + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  premiumDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  premiumCTA: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCard: {
    marginHorizontal: theme.spacing.L,
    marginTop: theme.spacing.M,
    padding: theme.spacing.M,
  },
  notificationContent: {
    width: '100%',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.M,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XXS,
  },
  notificationDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  notificationBenefits: {
    marginBottom: theme.spacing.M,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
  },
  benefitText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
  },
  notificationButton: {
    width: '100%',
  },
  section: {
    marginTop: theme.spacing.L,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.S,
    marginLeft: theme.spacing.L + theme.spacing.S,
  },
  sectionItems: {
    marginHorizontal: theme.spacing.L,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.M,
    paddingHorizontal: theme.spacing.M,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.separator,
    marginLeft: theme.spacing.M + theme.spacing.M + 20,
  },
  logoutSection: {
    marginTop: theme.spacing.XL,
    marginHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.L,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.M,
    borderRadius: theme.borderRadius.large,
    gap: theme.spacing.S,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  footer: {
    padding: theme.spacing.XL,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.XXS,
  },
  footerSubtext: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;