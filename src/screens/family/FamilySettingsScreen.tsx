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
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch, RootState } from '../../store/store';
import { selectFamily, selectFamilyMembers } from '../../store/slices/familySlice';
// Family service would be imported here in a real app
// import { familyService } from '../../services/family';
import { theme as lightTheme } from '../../constants/theme';

interface FamilySettings {
  allowChildrenToCreateTasks: boolean;
  requirePhotoProof: boolean;
  autoApproveCompletedTasks: boolean;
  weeklyReportEnabled: boolean;
  taskRemindersEnabled: boolean;
  celebrateAchievements: boolean;
  maxTasksPerDay: number;
  defaultTaskPoints: number;
}

const FamilySettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);
  
  const [settings, setSettings] = useState<FamilySettings>({
    allowChildrenToCreateTasks: false,
    requirePhotoProof: true,
    autoApproveCompletedTasks: false,
    weeklyReportEnabled: true,
    taskRemindersEnabled: true,
    celebrateAchievements: true,
    maxTasksPerDay: 10,
    defaultTaskPoints: 10,
  });
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'parent' | 'child'>('child');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is a parent
  const isParent = userProfile?.role === 'parent';

  useEffect(() => {
    if (!isParent) {
      Alert.alert(
        'Access Denied',
        'Only parents can access family settings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isParent, navigation]);

  useEffect(() => {
    loadFamilySettings();
  }, [family]);

  const loadFamilySettings = async () => {
    if (!family?.id) return;
    
    try {
      // In a real app, this would fetch from Firestore
      // For now, we'll use default settings
      // In a real app, this would fetch from Firestore
    } catch (error) {
      console.error('Error loading family settings:', error);
    }
  };

  const handleSettingChange = useCallback(async (key: keyof FamilySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to Firestore
    if (family?.id) {
      try {
        // In a real app, this would update the family settings
        console.log('Updating settings:', newSettings);
      } catch (error) {
        console.error('Error updating settings:', error);
        Alert.alert('Error', 'Failed to update settings. Please try again.');
      }
    }
  }, [settings, family]);

  const handleInviteMember = useCallback(async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    if (!family?.id) {
      Alert.alert('Error', 'No family found');
      return;
    }
    
    setIsLoading(true);
    try {
      // In a real app, this would send an invitation
      console.log('Inviting member:', inviteEmail, inviteRole);
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('child');
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inviteEmail, inviteRole, family]);

  const handleRemoveMember = useCallback((memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!family?.id) return;
            try {
              // In a real app, this would remove the member
              console.log('Removing member:', memberId);
              Alert.alert('Success', `${memberName} has been removed from the family`);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  }, [family]);

  const renderMember = (member: any) => (
    <View key={member.id} style={[styles.memberItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.memberInfo}>
        <View style={[styles.memberAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.memberAvatarText, { color: theme.colors.white }]}>
            {member.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={[styles.memberName, { color: theme.colors.textPrimary }]}>
            {member.displayName || 'Unknown'}
          </Text>
          <View style={styles.memberMeta}>
            <Text style={[
              styles.memberRole,
              { color: member.role === 'parent' ? theme.colors.success : theme.colors.textSecondary }
            ]}>
              {member.role === 'parent' ? 'Parent' : 'Child'}
            </Text>
            {member.isPremium && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.colors.textTertiary }]}>•</Text>
                <Feather name="star" size={12} color={theme.colors.premium} />
                <Text style={[styles.premiumBadge, { color: theme.colors.premium }]}>Premium</Text>
              </>
            )}
          </View>
        </View>
      </View>
      {member.id !== userProfile?.id && (
        <TouchableOpacity
          onPress={() => handleRemoveMember(member.id, member.displayName)}
          style={styles.removeButton}
        >
          <Feather name="x" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isParent) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.separator 
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Family Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Family Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="users" size={24} color={theme.colors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.familyName, { color: theme.colors.textPrimary }]}>
                {family?.name || 'My Family'}
              </Text>
              <Text style={[styles.familyCode, { color: theme.colors.textSecondary }]}>
                Family Code: {family?.id?.slice(0, 8).toUpperCase() || 'N/A'}
              </Text>
            </View>
          </View>
          <Text style={[styles.memberCount, { color: theme.colors.textTertiary }]}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </Card>

        {/* Task Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Task Settings</Text>
          <View style={[styles.sectionItems, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Children Can Create Tasks
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Allow children to create their own tasks
                </Text>
              </View>
              <Switch
                value={settings.allowChildrenToCreateTasks}
                onValueChange={(value) => handleSettingChange('allowChildrenToCreateTasks', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
            
            <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Require Photo Proof
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Tasks need photo verification
                </Text>
              </View>
              <Switch
                value={settings.requirePhotoProof}
                onValueChange={(value) => handleSettingChange('requirePhotoProof', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
            
            <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Auto-Approve Tasks
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Automatically approve completed tasks
                </Text>
              </View>
              <Switch
                value={settings.autoApproveCompletedTasks}
                onValueChange={(value) => handleSettingChange('autoApproveCompletedTasks', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Notifications</Text>
          <View style={[styles.sectionItems, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Weekly Reports
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Get weekly family activity summaries
                </Text>
              </View>
              <Switch
                value={settings.weeklyReportEnabled}
                onValueChange={(value) => handleSettingChange('weeklyReportEnabled', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
            
            <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Task Reminders
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Send reminders for upcoming tasks
                </Text>
              </View>
              <Switch
                value={settings.taskRemindersEnabled}
                onValueChange={(value) => handleSettingChange('taskRemindersEnabled', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
            
            <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Celebrate Achievements
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Notify when milestones are reached
                </Text>
              </View>
              <Switch
                value={settings.celebrateAchievements}
                onValueChange={(value) => handleSettingChange('celebrateAchievements', value)}
                trackColor={{ false: theme.colors.textTertiary, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Family Members</Text>
            <TouchableOpacity
              onPress={() => setShowInviteModal(true)}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            >
              <Feather name="plus" size={16} color={theme.colors.white} />
              <Text style={[styles.addButtonText, { color: theme.colors.white }]}>Invite</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.membersList, { backgroundColor: theme.colors.surface }]}>
            {members.map((member, index) => (
              <View key={member.id}>
                {renderMember(member)}
                {index < members.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.colors.error }]}
            onPress={() => {
              Alert.alert(
                'Delete Family',
                'Are you sure you want to delete this family? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // Handle family deletion
                      console.log('Delete family');
                    },
                  },
                ]
              );
            }}
          >
            <Feather name="trash-2" size={20} color={theme.colors.error} />
            <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
              Delete Family
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Family Member"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[styles.modalInput, { 
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.separator,
              color: theme.colors.textPrimary
            }]}
            placeholder="Enter email address"
            placeholderTextColor={theme.colors.textTertiary}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>Role</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                { borderColor: theme.colors.separator },
                inviteRole === 'parent' && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              ]}
              onPress={() => setInviteRole('parent')}
            >
              <Text style={[
                styles.roleOptionText,
                { color: inviteRole === 'parent' ? theme.colors.white : theme.colors.textPrimary }
              ]}>
                Parent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleOption,
                { borderColor: theme.colors.separator },
                inviteRole === 'child' && { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              ]}
              onPress={() => setInviteRole('child')}
            >
              <Text style={[
                styles.roleOptionText,
                { color: inviteRole === 'child' ? theme.colors.white : theme.colors.textPrimary }
              ]}>
                Child
              </Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Send Invitation"
            onPress={handleInviteMember}
            loading={isLoading}
            style={styles.modalButton}
          />
        </View>
      </Modal>
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
    paddingHorizontal: lightTheme.spacing.M,
    paddingVertical: lightTheme.spacing.M,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: lightTheme.spacing.XS,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: lightTheme.spacing.M,
  },
  infoCard: {
    marginHorizontal: lightTheme.spacing.M,
    marginBottom: lightTheme.spacing.M,
    padding: lightTheme.spacing.M,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.S,
  },
  infoText: {
    marginLeft: lightTheme.spacing.M,
    flex: 1,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  familyCode: {
    fontSize: 14,
  },
  memberCount: {
    fontSize: 13,
  },
  section: {
    marginTop: lightTheme.spacing.L,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing.S,
    paddingHorizontal: lightTheme.spacing.M,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: lightTheme.spacing.S,
    marginLeft: lightTheme.spacing.M + lightTheme.spacing.S,
  },
  sectionItems: {
    marginHorizontal: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.large,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: lightTheme.spacing.M,
  },
  settingInfo: {
    flex: 1,
    marginRight: lightTheme.spacing.M,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginLeft: lightTheme.spacing.M,
  },
  membersList: {
    marginHorizontal: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.large,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: lightTheme.spacing.M,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: lightTheme.spacing.M,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberRole: {
    fontSize: 13,
  },
  metaSeparator: {
    fontSize: 13,
    marginHorizontal: lightTheme.spacing.XS,
  },
  premiumBadge: {
    fontSize: 13,
    marginLeft: 4,
  },
  removeButton: {
    padding: lightTheme.spacing.XS,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: lightTheme.spacing.M,
    paddingVertical: lightTheme.spacing.XS,
    borderRadius: lightTheme.borderRadius.medium,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: lightTheme.spacing.M,
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.large,
    borderWidth: 1,
    gap: lightTheme.spacing.S,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: lightTheme.spacing.M,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: lightTheme.spacing.XS,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: lightTheme.borderRadius.medium,
    padding: lightTheme.spacing.M,
    fontSize: 16,
    marginBottom: lightTheme.spacing.L,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: lightTheme.spacing.M,
    marginBottom: lightTheme.spacing.L,
  },
  roleOption: {
    flex: 1,
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButton: {
    marginTop: lightTheme.spacing.M,
  },
});

export default FamilySettingsScreen;