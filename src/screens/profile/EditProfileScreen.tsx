// @ts-nocheck
/**
 * Edit Profile Screen
 * Allows users to edit their profile information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { RootState, AppDispatch } from '../../store/store';
import { selectUserProfile, updateUserProfile } from '../../store/slices/authSlice';
import CustomButton from '../../components/common/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import * as storageService from '../../services/storage';

const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const currentUser = useSelector(selectUserProfile);
  
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setNotificationsEnabled(currentUser.notificationsEnabled);
      setReminderTime(currentUser.reminderTime || '09:00');
    }
  }, [currentUser]);

  const handlePickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (result.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        await uploadAvatar(pickerResult.assets[0].uri);
      }
    } else {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a profile picture.'
      );
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    
    if (result.granted) {
      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        await uploadAvatar(pickerResult.assets[0].uri);
      }
    } else {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take a profile picture.'
      );
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!currentUser) return;
    
    try {
      setIsUploadingAvatar(true);
      const uploadedUrl = await storageService.uploadFile(
        uri,
        `avatars/${currentUser.id}`,
        'image'
      );
      setAvatarUrl(uploadedUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      
      await dispatch(updateUserProfile({
        userId: currentUser.id,
        updates: {
          displayName: displayName.trim(),
          phoneNumber: phoneNumber.trim(),
          avatarUrl,
          notificationsEnabled,
          reminderTime,
        },
      })).unwrap();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showAvatarOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showAvatarOptions}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={40} color={colors.gray400} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={colors.gray400}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.gray400}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={currentUser?.email || ''}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <View style={styles.settingInfo}>
                <Icon name="bell" size={20} color={colors.text} />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <View style={[
                styles.toggle,
                notificationsEnabled && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  notificationsEnabled && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Icon name="clock" size={20} color={colors.text} />
                <Text style={styles.settingLabel}>Daily Reminder Time</Text>
              </View>
              <TouchableOpacity style={styles.timeSelector}>
                <Text style={styles.timeText}>{reminderTime}</Text>
                <Icon name="chevron-down" size={16} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Info */}
          <View style={styles.accountInfo}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>
              {currentUser?.isPremium ? 'Premium' : 'Free'}
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {currentUser?.createdAt 
                ? new Date(currentUser.createdAt).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Save Changes"
            onPress={handleSaveProfile}
            loading={isLoading}
            disabled={isLoading || isUploadingAvatar}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton}>
            <Icon name="log-out" size={18} color={colors.error} />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton}>
            <Icon name="trash-2" size={18} color={colors.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: spacing.sm,
  },
  form: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionSemibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.gray500,
  },
  helperText: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
  },
  settingsSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray300,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  timeText: {
    ...typography.body,
    color: colors.text,
    marginRight: spacing.xs,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  buttonContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  dangerZone: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  dangerTitle: {
    ...typography.h4,
    color: colors.error,
    marginBottom: spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dangerButtonText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});

export default EditProfileScreen;