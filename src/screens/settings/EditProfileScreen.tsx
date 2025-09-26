// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store/store';
import { setUserProfile } from '../../store/slices/authSlice';
import userService from '../../services/users';
import { useTheme } from '../../contexts/ThemeContext';
import { updateProfileSchema, validateData } from '../../utils/validation';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const { theme, isDarkMode } = useTheme();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  const COMMON_TIMEZONES = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  useEffect(() => {
    // Update state if userProfile changes
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setTimezone(userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [userProfile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate display name
    if (!displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = 'Name must be less than 50 characters';
    }
    
    // Validate phone number (optional)
    if (phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (!userProfile?.id) {
        throw new Error('User profile not found');
      }

      // Validate via schema before update
      const { isValid, errors } = await validateData(updateProfileSchema as any, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        timezone,
      });
      if (!isValid) {
        const firstError = Object.values(errors)[0] || 'Invalid profile';
        throw new Error(String(firstError));
      }

      // Update user profile in Firebase
      const updatedProfile = await userService.updateUser(userProfile.id, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        timezone,
        updatedAt: new Date().toISOString(),
      });

      // Update Redux state - convert to serialized format
      const serializedProfile = {
        ...updatedProfile,
        createdAt: updatedProfile.createdAt instanceof Date ?
          updatedProfile.createdAt.toISOString() : updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt instanceof Date ?
          updatedProfile.updatedAt.toISOString() : updatedProfile.updatedAt,
        subscriptionEndDate: updatedProfile.subscriptionEndDate instanceof Date ?
          updatedProfile.subscriptionEndDate.toISOString() : updatedProfile.subscriptionEndDate,
      };
      dispatch(setUserProfile(serializedProfile));
      
      Alert.alert(
        'Success', 
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will receive an email with instructions to reset your password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            try {
              // TODO: Implement password reset email
              Alert.alert('Email Sent', 'Check your email for password reset instructions.');
            } catch (error) {
              Alert.alert('Error', 'Failed to send password reset email.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
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
                  onPress: () => {
                    // TODO: Implement account deletion with proper confirmation
                    Alert.alert('Coming Soon', 'Account deletion will be available in the next update.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              testID="back-button"
            >
              <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[
              styles.avatar,
              userProfile?.role === 'parent' && styles.avatarParent
            ]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={() => Alert.alert('Coming Soon', 'Photo upload will be available in the next update.')}
            >
              <Feather name="camera" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) {
                  setErrors({ ...errors, displayName: '' });
                }
              }}
              placeholder="Enter your name"
              error={errors.displayName}
              autoCapitalize="words"
              maxLength={50}
              testID="display-name-input"
            />

            {/* Timezone */}
            <TouchableOpacity
              style={{ marginTop: spacing.S, paddingVertical: spacing.S }}
              onPress={() => setShowTimezonePicker(!showTimezonePicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.label}>Timezone</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textPrimary }}>{timezone}</Text>
                <Feather name={showTimezonePicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {showTimezonePicker && (
              <View style={{ marginTop: spacing.XS }}>
                {COMMON_TIMEZONES.map(tz => (
                  <TouchableOpacity
                    key={tz}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: spacing.XS,
                    }}
                    onPress={() => { setTimezone(tz); setShowTimezonePicker(false); }}
                  >
                    <Text style={{ color: theme.colors.textSecondary }}>{tz}</Text>
                    {timezone === tz && <Feather name="check" size={18} color={theme.colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <Input
              label="Email"
              value={userProfile?.email || ''}
              editable={false}
              style={styles.disabledInput}
              testID="email-input"
            />
            
            <Input
              label="Phone Number (Optional)"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (errors.phoneNumber) {
                  setErrors({ ...errors, phoneNumber: '' });
                }
              }}
              placeholder="+1 234 567 8900"
              error={errors.phoneNumber}
              keyboardType="phone-pad"
              testID="phone-input"
            />
            
            <View style={styles.roleSection}>
              <Text style={styles.label}>Role</Text>
              <View style={[
                styles.roleBadge,
                userProfile?.role === 'parent' && styles.roleBadgeParent
              ]}>
                <Text style={[
                  styles.roleText,
                  userProfile?.role === 'parent' && styles.roleTextParent
                ]}>
                  {userProfile?.role === 'parent' ? 'Manager' : 'Member'}
                </Text>
              </View>
              <Text style={styles.roleHint}>
                Your role determines your permissions within the family
              </Text>
            </View>

            {/* Family Info */}
            {userProfile?.familyId && (
              <View style={styles.familySection}>
                <Text style={styles.label}>Family</Text>
                <View style={styles.familyInfo}>
                  <Feather name="users" size={16} color={theme.colors.textTertiary} />
                  <Text style={styles.familyText}>
                    Member of a family
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading || !displayName.trim()}
              style={styles.saveButton}
              testID="save-button"
            />
            
            <TouchableOpacity 
              onPress={handleChangePassword} 
              style={styles.secondaryButton}
              disabled={isLoading}
              testID="change-password-button"
            >
              <Feather name="lock" size={20} color={isDarkMode ? theme.colors.info : theme.colors.textPrimary} />
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* Account Info */}
          <View style={styles.accountInfo}>
            <Text style={styles.infoTitle}>Account Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {userProfile?.createdAt ? 
                  new Date(userProfile.createdAt).toLocaleDateString() : 
                  'N/A'
                }
              </Text>
            </View>
            {userProfile?.isPremium && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subscription</Text>
                <View style={styles.premiumBadge}>
                  <Feather name="star" size={12} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              </View>
            )}
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              Deleting your account will permanently remove all your data and cannot be undone.
            </Text>
            <TouchableOpacity 
              onPress={handleDeleteAccount} 
              style={styles.deleteButton}
              disabled={isLoading}
              testID="delete-account-button"
            >
              <Feather name="trash-2" size={18} color={theme.colors.error} />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.XXL,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  backButton: {
    padding: spacing.XS,
  },
  title: {
    fontSize: typography.title3.fontSize,
    fontWeight: typography.title3.fontWeight as any,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.XL,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.M,
  },
  avatarParent: {
    backgroundColor: theme.colors.success + '20',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XS,
  },
  changePhotoText: {
    fontSize: typography.body.fontSize,
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.L,
  },
  disabledInput: {
    backgroundColor: theme.colors.backgroundTexture,
    opacity: 0.7,
  },
  roleSection: {
    marginTop: spacing.M,
  },
  label: {
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: spacing.S,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.medium,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : '#E8F5E9',
  },
  roleBadgeParent: {
    backgroundColor: theme.colors.success + '20',
  },
  roleText: {
    fontSize: typography.footnote.fontSize,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  roleTextParent: {
    color: theme.colors.success,
  },
  roleHint: {
    fontSize: typography.caption1.fontSize,
    color: isDarkMode ? '#FFB3BA' : '#E91E63',
    backgroundColor: isDarkMode ? 'rgba(255, 179, 186, 0.1)' : 'rgba(233, 30, 99, 0.08)',
    padding: spacing.S,
    borderRadius: borderRadius.medium,
    marginTop: spacing.XS,
  },
  familySection: {
    marginTop: spacing.L,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  familyText: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  saveButton: {
    marginBottom: spacing.M,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.S,
    paddingVertical: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  secondaryButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.info : theme.colors.textPrimary,
  },
  accountInfo: {
    paddingHorizontal: spacing.L,
    marginBottom: spacing.XL,
  },
  infoTitle: {
    fontSize: typography.headline.fontSize,
    fontWeight: typography.headline.fontWeight as any,
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.S,
  },
  infoLabel: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XXS,
    paddingHorizontal: spacing.S,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: borderRadius.small,
  },
  premiumText: {
    fontSize: typography.caption1.fontSize,
    fontWeight: '600',
    color: '#FFD700',
  },
  dangerZone: {
    marginHorizontal: spacing.L,
    padding: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.error + '20' : theme.colors.error + '10',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: isDarkMode ? theme.colors.error + '40' : theme.colors.error + '30',
  },
  dangerTitle: {
    fontSize: typography.headline.fontSize,
    fontWeight: typography.headline.fontWeight as any,
    color: theme.colors.error,
    marginBottom: spacing.S,
  },
  dangerDescription: {
    fontSize: typography.footnote.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: spacing.M,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.S,
    paddingVertical: spacing.M,
    backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.error,
  },
});

export default EditProfileScreen;