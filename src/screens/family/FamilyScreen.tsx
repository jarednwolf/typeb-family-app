import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FamilyStackParamList } from '../../navigation/MainNavigator';

type FamilyScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'FamilyHome'>;
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { FamilyScreenSkeleton } from '../../components/common/Skeletons';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch, RootState } from '../../store/store';
import {
  selectFamily,
  selectFamilyMembers,
  selectCurrentUserRole,
  fetchFamily,
  regenerateInviteCode,
  removeMember,
} from '../../store/slices/familySlice';
import { canAddFamilyMember, getMemberLimitText, needsPremiumFor } from '../../utils/premiumGates';
import { getRoleLabel } from '../../utils/roleHelpers';
import PremiumBadge from '../../components/premium/PremiumBadge';

const FamilyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<FamilyScreenNavigationProp>();
  const { theme, isDarkMode } = useTheme();
  
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);
  const currentUserRole = useSelector(selectCurrentUserRole);
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const isLoading = useSelector((state: RootState) => state.family.isLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const isParent = currentUserRole === 'parent';

  useEffect(() => {
    loadFamily();
  }, [userProfile]);

  const loadFamily = useCallback(async () => {
    if (userProfile && userProfile.familyId) {
      try {
        await dispatch(fetchFamily(userProfile.familyId)).unwrap();
      } catch (error: any) {
        console.error('Failed to load family:', error);
        // If the family doesn't exist, the family service will handle clearing the invalid familyId
        // Just log the error here, the UI will show the "No Family Yet" state
      }
    }
  }, [userProfile, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFamily();
    setRefreshing(false);
  }, [loadFamily]);

  const handleGenerateInviteCode = useCallback(async () => {
    if (!family) return;
    
    // Check if family can add more members
    if (!canAddFamilyMember(family)) {
      if (needsPremiumFor('invite_member', family, userProfile)) {
        Alert.alert(
          'Premium Required',
          'Upgrade to Premium to add more family members.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              onPress: () => navigation.navigate('Premium' as never)
            }
          ]
        );
        return;
      }
      Alert.alert('Member Limit Reached', 'Your family has reached the maximum number of members.');
      return;
    }
    
    setIsGeneratingCode(true);
    try {
      const newCode = await dispatch(regenerateInviteCode(family.id)).unwrap();
      setInviteCode(newCode);
      Alert.alert('Success', 'New invite code generated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  }, [family, dispatch, userProfile, navigation]);

  const handleShareInviteCode = useCallback(async () => {
    if (!family) return;
    
    // Check if family can add more members
    if (!canAddFamilyMember(family)) {
      if (needsPremiumFor('invite_member', family, userProfile)) {
        Alert.alert(
          'Premium Required',
          'Upgrade to Premium to add more family members.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              onPress: () => navigation.navigate('Premium' as never)
            }
          ]
        );
        return;
      }
      Alert.alert('Member Limit Reached', 'Your family has reached the maximum number of members.');
      return;
    }
    
    const code = inviteCode || family?.inviteCode;
    if (!code) return;

    try {
      await Share.share({
        message: `Join our family on TypeB! Use invite code: ${code}`,
        title: 'TypeB Family Invite',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [inviteCode, family, userProfile, navigation]);

  const handleCopyInviteCode = useCallback(() => {
    const code = inviteCode || family?.inviteCode;
    if (!code) return;

    Clipboard.setString(code);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  }, [inviteCode, family]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!family) return;

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the family?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeMember({
                familyId: family.id,
                userId: memberId,
              })).unwrap();
              Alert.alert('Success', 'Member removed from family');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  }, [family, dispatch]);

  const handleJoinFamily = useCallback(() => {
    navigation.navigate('JoinFamily');
  }, [navigation]);

  const handleCreateFamily = useCallback(() => {
    navigation.navigate('CreateFamily');
  }, [navigation]);

  // Create dynamic styles - must be before any conditional returns
  const styles = React.useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  if (isLoading && !refreshing) {
    return <FamilyScreenSkeleton />;
  }

  if (!family) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="users"
          title="No Family Yet"
          message="Create a new family or join an existing one to get started"
        />
        <View style={styles.noFamilyActions}>
          <Button
            title="Create Family"
            onPress={handleCreateFamily}
            style={styles.actionButton}
            testID="create-family-button"
          />
          <Button
            title="Join Family"
            variant="secondary"
            onPress={handleJoinFamily}
            style={styles.actionButton}
            testID="join-family-button"
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.screenTitle}>Family</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Family Header */}
        <View style={styles.familyHeader}>
          <View style={styles.familyIconContainer}>
            <Feather name="home" size={28} color={isDarkMode ? theme.colors.white : theme.colors.primary} />
          </View>
          <View style={styles.familyDetails}>
            <Text style={styles.familyName}>{family.name}</Text>
            <Text style={styles.memberCount}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        {/* Premium Upsell - Priority Position */}
        {!family.isPremium && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Premium' as never)}
          >
            <Card style={styles.premiumCard}>
              <View style={styles.premiumContent}>
                <View style={styles.premiumLeft}>
                  <View style={styles.premiumIconContainer}>
                    <Feather name="star" size={24} color={theme.colors.premium} />
                  </View>
                  <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Unlock Premium</Text>
                    <Text style={styles.premiumDescription}>
                      Invite more members, enable photo validation, and access pro features.
                    </Text>
                  </View>
                </View>
                <View style={styles.premiumCTA}>
                  <Feather name="arrow-right" size={18} color={theme.colors.primary} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Invite Code Section - Compact and Better Design */}
        {isParent && (
          <Card style={styles.inviteCard} testID="invite-code-section">
            <View style={styles.inviteContent}>
              <View style={styles.inviteLeft}>
                <Text style={styles.inviteTitle}>Invite Code</Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode} testID="current-invite-code">
                    {inviteCode || family.inviteCode}
                  </Text>
                  {!family.isPremium && (
                    <View style={{ marginLeft: theme.spacing.S }}>
                      <PremiumBadge size="small" />
                    </View>
                  )}
                </View>
                <Text style={styles.inviteHint}>
                  {canAddFamilyMember(family)
                    ? 'Share this code with others to invite them'
                    : getMemberLimitText(family)
                  }
                </Text>
              </View>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  onPress={handleCopyInviteCode}
                  style={styles.inviteActionButton}
                  activeOpacity={0.7}
                  testID="copy-code-button"
                >
                  <Feather name="copy" size={20} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShareInviteCode}
                  style={styles.inviteActionButton}
                  activeOpacity={0.7}
                  testID="share-code-button"
                >
                  <Feather name="share-2" size={20} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGenerateInviteCode}
                  style={styles.inviteActionButton}
                  activeOpacity={0.7}
                  disabled={isGeneratingCode}
                  testID="regenerate-code-button"
                >
                  <Feather
                    name="refresh-cw"
                    size={20}
                    color={isGeneratingCode ? theme.colors.textTertiary : (isDarkMode ? theme.colors.info : theme.colors.primary)}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Members Section - Enhanced */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <View style={styles.membersList}>
            {members.map((member, index) => (
              <View key={member.id}>
                <View style={styles.memberRow}>
                  <TouchableOpacity
                    style={styles.memberContent}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Future: Navigate to member profile
                    }}
                  >
                    <View style={styles.memberLeft}>
                      <View style={[
                        styles.memberAvatar,
                        member.role === 'parent' && styles.parentAvatar
                      ]}>
                        <Text style={styles.memberInitial}>
                          {member.displayName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>{member.displayName}</Text>
                          {member.id === userProfile?.id && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.memberMeta}>
                          <View style={[
                            styles.roleBadge,
                            member.role === 'parent' && styles.parentRoleBadge,
                          ]}>
                            <Text style={[
                              styles.roleText,
                              member.role === 'parent' && styles.parentRoleText
                            ]}>
                              {getRoleLabel(family, member.role, false)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {isParent && member.id !== userProfile?.id && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(member.id)}
                        style={styles.removeButton}
                        testID={`remove-member-${member.id}`}
                      >
                        <Feather name="x-circle" size={20} color={theme.colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
                {index < members.length - 1 && <View style={styles.memberSeparator} />}
              </View>
            ))}
          </View>
        </View>


        {/* Family Settings - Cleaner Design */}
        {isParent && (
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Alert.alert('Coming Soon', 'Family settings will be available in a future update.')}
              activeOpacity={0.7}
              testID="family-settings-button"
            >
              <View style={styles.settingsLeft}>
                <View style={styles.settingsIconContainer}>
                  <Feather name="settings" size={20} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
                </View>
                <Text style={styles.settingsButtonText}>Family Settings</Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
  content: {
    paddingBottom: theme.spacing.XXL,
  },
  noFamilyActions: {
    padding: theme.spacing.L,
    gap: theme.spacing.M,
  },
  actionButton: {
    width: '100%',
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.L,
    paddingTop: theme.spacing.M,
    paddingBottom: theme.spacing.S,
  },
  familyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.backgroundTexture,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  familyDetails: {
    flex: 1,
  },
  familyName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  inviteCard: {
    marginHorizontal: theme.spacing.L,
    marginTop: theme.spacing.M,
    padding: theme.spacing.M,
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteLeft: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.XS,
  },
  inviteCodeContainer: {
    marginBottom: theme.spacing.XS,
  },
  inviteCode: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: theme.spacing.XS,
  },
  inviteActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundTexture,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  membersSection: {
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
  membersList: {
    marginHorizontal: theme.spacing.L,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  memberRow: {
    backgroundColor: theme.colors.surface,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.M,
    paddingHorizontal: theme.spacing.M,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundTexture,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  parentAvatar: {
    backgroundColor: theme.colors.success + '15',
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
    marginBottom: theme.spacing.XXS,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.S,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.backgroundTexture,
  },
  parentRoleBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  parentRoleText: {
    color: theme.colors.success,
  },
  youBadge: {
    paddingHorizontal: theme.spacing.XS,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.small,
    backgroundColor: isDarkMode ? theme.colors.info + '20' : theme.colors.primary + '10',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: isDarkMode ? theme.colors.info : theme.colors.primary,
  },
  memberSeparator: {
    height: 1,
    backgroundColor: theme.colors.separator,
    marginLeft: theme.spacing.M + 48 + theme.spacing.M,
  },
  removeButton: {
    padding: theme.spacing.S,
  },
  premiumCard: {
    marginHorizontal: theme.spacing.L,
    marginTop: theme.spacing.M,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: isDarkMode ? '#FFD70015' : theme.colors.premium + '15',
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
    backgroundColor: isDarkMode ? '#FFD70025' : theme.colors.premium + '20',
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
  settingsSection: {
    marginTop: theme.spacing.L,
    marginHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.L,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundTexture,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
});

export default FamilyScreen;