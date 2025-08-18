/**
 * Privacy Settings Screen
 * 
 * Privacy and security features:
 * - Data sharing preferences
 * - Profile visibility
 * - Activity status
 * - Read receipts
 * - Blocked users
 * - Data export/download
 * - Account deletion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUserProfile, logOut } from '../../store/slices/authSlice';

const PRIVACY_SETTINGS_KEY = '@privacy_settings';

interface PrivacyPreferences {
  profileVisibility: 'public' | 'family' | 'private';
  showActivityStatus: boolean;
  showLastSeen: boolean;
  readReceipts: boolean;
  shareAnalytics: boolean;
  shareUsageData: boolean;
  allowFamilyInvites: boolean;
  allowNotifications: boolean;
  blockedUsers: string[];
}

interface BlockedUser {
  id: string;
  name: string;
  blockedAt: Date;
}

const PrivacySettings: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    profileVisibility: 'family',
    showActivityStatus: true,
    showLastSeen: true,
    readReceipts: true,
    shareAnalytics: true,
    shareUsageData: false,
    allowFamilyInvites: true,
    allowNotifications: true,
    blockedUsers: [],
  });
  
  useEffect(() => {
    loadPreferences();
    loadBlockedUsers();
  }, []);
  
  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (saved) {
        setPreferences({ ...preferences, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading privacy preferences:', error);
    }
  };
  
  const loadBlockedUsers = async () => {
    // Mock blocked users - in production, fetch from backend
    setBlockedUsers([]);
  };
  
  const savePreferences = async (newPreferences: PrivacyPreferences) => {
    try {
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      HapticFeedback.notification.success();
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      Alert.alert('Error', 'Failed to save privacy settings');
    }
  };
  
  const handleVisibilityChange = () => {
    Alert.alert(
      'Profile Visibility',
      'Choose who can see your profile',
      [
        {
          text: 'Public',
          onPress: () => savePreferences({ ...preferences, profileVisibility: 'public' }),
        },
        {
          text: 'Family Only',
          onPress: () => savePreferences({ ...preferences, profileVisibility: 'family' }),
        },
        {
          text: 'Private',
          onPress: () => savePreferences({ ...preferences, profileVisibility: 'private' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  const handleDataExport = () => {
    Alert.alert(
      'Export Your Data',
      'Would you like to download all your data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsLoading(true);
            HapticFeedback.notification.success();
            
            // Simulate export process
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert(
                'Data Export Complete',
                'Your data has been prepared. Check your email for the download link.',
                [{ text: 'OK' }]
              );
            }, 2000);
          },
        },
      ]
    );
  };
  
  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Proceed',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    // In production, call account deletion API
                    setTimeout(async () => {
                      await dispatch(logOut());
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' as never }],
                      });
                    }, 1500);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  const handleUnblockUser = (userId: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
            const newPreferences = {
              ...preferences,
              blockedUsers: preferences.blockedUsers.filter(id => id !== userId),
            };
            savePreferences(newPreferences);
            AccessibilityInfo.announceForAccessibility('User unblocked');
          },
        },
      ]
    );
  };
  
  const getVisibilityText = () => {
    switch (preferences.profileVisibility) {
      case 'public':
        return 'Everyone';
      case 'family':
        return 'Family Only';
      case 'private':
        return 'Only Me';
      default:
        return 'Family Only';
    }
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
          Privacy Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            PROFILE & VISIBILITY
          </Text>
          
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}
            onPress={handleVisibilityChange}
            accessibilityLabel="Change profile visibility"
            accessibilityRole="button"
          >
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="eye" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Profile Visibility
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Who can see your profile information
              </Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={[styles.valueText, { color: theme.colors.primary }]}>
                {getVisibilityText()}
              </Text>
              <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />
            </View>
          </TouchableOpacity>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="activity" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Activity Status
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Show when you're active
              </Text>
            </View>
            <Switch
              value={preferences.showActivityStatus}
              onValueChange={(value) => 
                savePreferences({ ...preferences, showActivityStatus: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.showActivityStatus ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="clock" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Last Seen
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Show when you were last active
              </Text>
            </View>
            <Switch
              value={preferences.showLastSeen}
              onValueChange={(value) => 
                savePreferences({ ...preferences, showLastSeen: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.showLastSeen ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        </View>
        
        {/* Communication */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            COMMUNICATION
          </Text>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="check-circle" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Read Receipts
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Show when you've read messages
              </Text>
            </View>
            <Switch
              value={preferences.readReceipts}
              onValueChange={(value) => 
                savePreferences({ ...preferences, readReceipts: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.readReceipts ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="user-plus" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Family Invites
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Allow others to invite you to their family
              </Text>
            </View>
            <Switch
              value={preferences.allowFamilyInvites}
              onValueChange={(value) => 
                savePreferences({ ...preferences, allowFamilyInvites: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.allowFamilyInvites ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        </View>
        
        {/* Data & Analytics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            DATA & ANALYTICS
          </Text>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="bar-chart-2" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Share Analytics
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Help improve the app with anonymous analytics
              </Text>
            </View>
            <Switch
              value={preferences.shareAnalytics}
              onValueChange={(value) => 
                savePreferences({ ...preferences, shareAnalytics: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.shareAnalytics ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Feather name="database" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Usage Data
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                Share app usage patterns for personalization
              </Text>
            </View>
            <Switch
              value={preferences.shareUsageData}
              onValueChange={(value) => 
                savePreferences({ ...preferences, shareUsageData: value })
              }
              trackColor={{
                false: theme.colors.separator,
                true: theme.colors.primary + '80',
              }}
              thumbColor={preferences.shareUsageData ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.separator}
            />
          </View>
        </View>
        
        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            BLOCKED USERS
          </Text>
          
          {blockedUsers.length > 0 ? (
            blockedUsers.map((user) => (
              <View
                key={user.id}
                style={[styles.blockedUserRow, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.blockedUserInfo}>
                  <Text style={[styles.blockedUserName, { color: theme.colors.textPrimary }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.blockedDate, { color: theme.colors.textTertiary }]}>
                    Blocked {user.blockedAt.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleUnblockUser(user.id)}
                  style={[styles.unblockButton, { borderColor: theme.colors.error }]}
                  accessibilityLabel={`Unblock ${user.name}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.unblockText, { color: theme.colors.error }]}>
                    Unblock
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Feather name="user-x" size={32} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No blocked users
              </Text>
            </View>
          )}
        </View>
        
        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            DATA MANAGEMENT
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleDataExport}
            disabled={isLoading}
            accessibilityLabel="Export your data"
            accessibilityRole="button"
          >
            <View style={styles.actionContent}>
              <Feather name="download" size={20} color={theme.colors.primary} />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
                  Export Your Data
                </Text>
                <Text style={[styles.actionDescription, { color: theme.colors.textTertiary }]}>
                  Download a copy of your information
                </Text>
              </View>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
            ]}
            onPress={handleAccountDeletion}
            disabled={isLoading}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
          >
            <View style={styles.actionContent}>
              <Feather name="trash-2" size={20} color={theme.colors.error} />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.colors.error }]}>
                  Delete Account
                </Text>
                <Text style={[styles.actionDescription, { color: theme.colors.textTertiary }]}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        {/* Privacy Policy Link */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.policyLink}
            onPress={() => navigation.navigate('Privacy' as never)}
            accessibilityLabel="View privacy policy"
            accessibilityRole="link"
          >
            <Feather name="shield" size={16} color={theme.colors.primary} />
            <Text style={[styles.policyText, { color: theme.colors.primary }]}>
              View Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  blockedDate: {
    fontSize: 13,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  policyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PrivacySettings;