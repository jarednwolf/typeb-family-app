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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { theme } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { 
  selectFamily, 
  selectFamilyMembers,
  selectCurrentUserRole,
  fetchFamily,
  regenerateInviteCode,
  removeMember,
} from '../../store/slices/familySlice';

const FamilyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const family = useSelector(selectFamily);
  const members = useSelector(selectFamilyMembers);
  const currentUserRole = useSelector(selectCurrentUserRole);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.family.isLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const isParent = currentUserRole === 'parent';

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = useCallback(async () => {
    if (currentUser && (currentUser as any).familyId) {
      try {
        await dispatch(fetchFamily((currentUser as any).familyId)).unwrap();
      } catch (error) {
        console.error('Failed to load family:', error);
      }
    }
  }, [currentUser, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFamily();
    setRefreshing(false);
  }, [loadFamily]);

  const handleGenerateInviteCode = useCallback(async () => {
    if (!family) return;
    
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
  }, [family, dispatch]);

  const handleShareInviteCode = useCallback(async () => {
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
  }, [inviteCode, family]);

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
    navigation.navigate('JoinFamily' as never);
  }, [navigation]);

  const handleCreateFamily = useCallback(() => {
    navigation.navigate('CreateFamily' as never);
  }, [navigation]);

  if (isLoading && !refreshing) {
    return <LoadingState message="Loading family..." />;
  }

  if (!family) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="users"
          title="No Family Yet"
          message="Create a new family or join an existing one to get started"
          onAction={() => {}}
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Family Header */}
      <Card style={styles.familyCard}>
        <View style={styles.familyHeader}>
          <View style={styles.familyIcon}>
            <Feather name="home" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.familyInfo}>
            <Text style={styles.familyName}>{family.name}</Text>
            <Text style={styles.memberCount}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        {/* Invite Code Section */}
        {isParent && (
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCode}>
                {inviteCode || family.inviteCode}
              </Text>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  onPress={handleCopyInviteCode}
                  style={styles.inviteActionButton}
                  testID="copy-code-button"
                >
                  <Feather name="copy" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShareInviteCode}
                  style={styles.inviteActionButton}
                  testID="share-code-button"
                >
                  <Feather name="share-2" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGenerateInviteCode}
                  style={styles.inviteActionButton}
                  disabled={isGeneratingCode}
                  testID="regenerate-code-button"
                >
                  <Feather 
                    name="refresh-cw" 
                    size={20} 
                    color={isGeneratingCode ? theme.colors.textTertiary : theme.colors.primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.inviteHint}>
              Share this code with family members to invite them
            </Text>
          </View>
        )}
      </Card>

      {/* Members List */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        {members.map((member) => (
          <Card key={member.id} style={styles.memberCard}>
            <View style={styles.memberContent}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {member.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.displayName}</Text>
                <View style={styles.memberMeta}>
                  <View style={[
                    styles.roleBadge,
                    member.role === 'parent' && styles.parentBadge,
                  ]}>
                    <Text style={styles.roleText}>
                      {member.role === 'parent' ? 'Parent' : 'Child'}
                    </Text>
                  </View>
                  {member.id === currentUser?.uid && (
                    <Text style={styles.youBadge}>You</Text>
                  )}
                </View>
              </View>
              {isParent && member.id !== currentUser?.uid && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(member.id)}
                  style={styles.removeButton}
                  testID={`remove-member-${member.id}`}
                >
                  <Feather name="x" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}
      </View>

      {/* Premium Features */}
      {!family.isPremium && (
        <Card style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Feather name="star" size={24} color={theme.colors.premium} />
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
          </View>
          <Text style={styles.premiumDescription}>
            Get unlimited family members, advanced features, and priority support
          </Text>
          <Button
            title="Learn More"
            variant="secondary"
            onPress={() => navigation.navigate('Premium' as never)}
            style={styles.premiumButton}
          />
        </Card>
      )}

      {/* Family Settings */}
      {isParent && (
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('FamilySettings' as never)}
            testID="family-settings-button"
          >
            <Feather name="settings" size={20} color={theme.colors.primary} />
            <Text style={styles.settingsButtonText}>Family Settings</Text>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.M,
    paddingBottom: theme.spacing.XXL,
  },
  noFamilyActions: {
    padding: theme.spacing.L,
    gap: theme.spacing.M,
  },
  actionButton: {
    width: '100%',
  },
  familyCard: {
    marginBottom: theme.spacing.L,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.L,
  },
  familyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.XXS,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  inviteSection: {
    paddingTop: theme.spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.textTertiary + '30',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.M,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.M,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.S,
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: theme.spacing.S,
  },
  inviteActionButton: {
    padding: theme.spacing.S,
  },
  inviteHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  membersSection: {
    marginBottom: theme.spacing.L,
  },
  memberCard: {
    marginBottom: theme.spacing.S,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.textTertiary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.M,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.XXS,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.S,
    paddingVertical: theme.spacing.XXS,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.info + '20',
  },
  parentBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  youBadge: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: theme.spacing.S,
  },
  premiumCard: {
    marginBottom: theme.spacing.L,
    backgroundColor: theme.colors.premium + '10',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
    marginBottom: theme.spacing.S,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  premiumDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.M,
  },
  premiumButton: {
    alignSelf: 'flex-start',
  },
  settingsSection: {
    marginTop: theme.spacing.L,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.M,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
  },
  settingsButtonText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: theme.spacing.M,
  },
});

export default FamilyScreen;