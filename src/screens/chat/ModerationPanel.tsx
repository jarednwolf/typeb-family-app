/**
 * ModerationPanel Component
 * Parent-only interface for moderating pending messages
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';
import {
  ChatMessage,
  ModerationSettings,
} from '../../types/chat';
import {
  getPendingMessages,
  moderateMessage,
  sendSystemMessage,
  updateChatRoomSettings,
} from '../../services/chat';
import * as Haptics from 'expo-haptics';

type RootStackParamList = {
  ModerationPanel: { chatId: string };
};

type ModerationPanelNavigationProp = StackNavigationProp<RootStackParamList, 'ModerationPanel'>;
type ModerationPanelRouteProp = RouteProp<RootStackParamList, 'ModerationPanel'>;

interface ModerationAction {
  messageId: string;
  approved: boolean;
  note?: string;
}

export const ModerationPanel: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<ModerationPanelNavigationProp>();
  const route = useRoute<ModerationPanelRouteProp>();
  const { chatId } = route.params;
  
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>({
    enabled: true,
    filterProfanity: true,
    filterLinks: true,
    filterPhoneNumbers: true,
    filterEmails: true,
    blockExternalImages: false,
    requireParentApproval: false,
    customBlockedWords: [],
    allowedDomains: [],
    maxMessageLength: 1000,
    maxVoiceDuration: 120,
  });

  // Check if user is a parent
  useEffect(() => {
    if (userProfile?.role !== 'parent') {
      Alert.alert('Access Denied', 'Only parents can access the moderation panel.');
      navigation.goBack();
    }
  }, [userProfile, navigation]);

  // Load pending messages
  const loadPendingMessages = useCallback(async () => {
    try {
      const messages = await getPendingMessages(chatId);
      setPendingMessages(messages);
    } catch (error) {
      console.error('Error loading pending messages:', error);
      Alert.alert('Error', 'Failed to load pending messages.');
    }
  }, [chatId]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadPendingMessages();
      setIsLoading(false);
    };
    
    initialize();
  }, [loadPendingMessages]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPendingMessages();
    setIsRefreshing(false);
  }, [loadPendingMessages]);

  const handleModerateMessage = useCallback(async (
    messageId: string,
    approved: boolean,
    note?: string
  ) => {
    if (!userProfile) return;
    
    setProcessingIds(prev => new Set(prev).add(messageId));
    
    try {
      await moderateMessage(messageId, userProfile.id, approved, note);
      
      // Send system message
      if (family) {
        await sendSystemMessage(
          chatId,
          family.id,
          'moderation',
          { 
            approved, 
            moderatorName: userProfile.displayName,
            messageId 
          },
          approved 
            ? `Message approved by ${userProfile.displayName}`
            : `Message removed by ${userProfile.displayName} - ${note || 'Inappropriate content'}`
        );
      }
      
      // Remove from pending list
      setPendingMessages(prev => prev.filter(m => m.id !== messageId));
      
      Haptics.notificationAsync(
        approved 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (error) {
      console.error('Error moderating message:', error);
      Alert.alert('Error', 'Failed to moderate message.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }, [userProfile, family, chatId]);

  const handleApproveAll = useCallback(async () => {
    Alert.alert(
      'Approve All Messages',
      `Are you sure you want to approve all ${pendingMessages.length} pending messages?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            
            for (const message of pendingMessages) {
              await handleModerateMessage(message.id, true, 'Bulk approved');
            }
            
            setIsLoading(false);
            Alert.alert('Success', 'All messages have been approved.');
          },
        },
      ]
    );
  }, [pendingMessages, handleModerateMessage]);

  const handleUpdateSettings = useCallback(async (
    setting: keyof ModerationSettings,
    value: any
  ) => {
    const newSettings = { ...moderationSettings, [setting]: value };
    setModerationSettings(newSettings);
    
    try {
      await updateChatRoomSettings(chatId, {
        requireModeration: newSettings.requireParentApproval,
        autoModerateLinks: newSettings.filterLinks,
        autoModerateProfanity: newSettings.filterProfanity,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [chatId, moderationSettings]);

  const renderPendingMessage = ({ item }: { item: ChatMessage }) => {
    const isProcessing = processingIds.has(item.id);
    
    return (
      <View style={[styles.messageCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.senderName, { color: theme.colors.textPrimary }]}>
            {item.senderName}
          </Text>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        
        {item.type === 'text' && (
          <Text style={[styles.messageText, { color: theme.colors.textPrimary }]}>
            {item.text}
          </Text>
        )}
        
        {item.type === 'voice' && (
          <View style={styles.mediaIndicator}>
            <Ionicons name="mic" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.mediaText, { color: theme.colors.textSecondary }]}>
              Voice message ({item.voiceDuration}s)
            </Text>
          </View>
        )}
        
        {item.type === 'image' && (
          <View style={styles.mediaIndicator}>
            <Ionicons name="image" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.mediaText, { color: theme.colors.textSecondary }]}>
              Image
            </Text>
          </View>
        )}
        
        {item.flaggedBy && item.flaggedBy.length > 0 && (
          <View style={[styles.flagBadge, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="flag" size={14} color={theme.colors.error} />
            <Text style={[styles.flagText, { color: theme.colors.error }]}>
              Flagged by {item.flaggedBy.length} user(s)
            </Text>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleModerateMessage(item.id, true)}
            disabled={isProcessing}
            style={[styles.approveButton, { backgroundColor: theme.colors.success }]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Remove Message',
                'Reason for removal:',
                [
                  {
                    text: 'Inappropriate',
                    onPress: () => handleModerateMessage(item.id, false, 'Inappropriate content'),
                  },
                  {
                    text: 'Contains Personal Info',
                    onPress: () => handleModerateMessage(item.id, false, 'Contains personal information'),
                  },
                  {
                    text: 'Other',
                    onPress: () => handleModerateMessage(item.id, false, 'Violates chat guidelines'),
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ]
              );
            }}
            disabled={isProcessing}
            style={[styles.rejectButton, { backgroundColor: theme.colors.error }]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Remove</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
        Moderation Panel
      </Text>
      
      {pendingMessages.length > 1 && (
        <TouchableOpacity onPress={handleApproveAll} style={styles.approveAllButton}>
          <Text style={[styles.approveAllText, { color: theme.colors.primary }]}>
            Approve All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Moderation Settings
      </Text>
      
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
          Require parent approval for child messages
        </Text>
        <TouchableOpacity
          onPress={() => handleUpdateSettings('requireParentApproval', !moderationSettings.requireParentApproval)}
          style={[
            styles.toggle,
            { backgroundColor: moderationSettings.requireParentApproval ? theme.colors.primary : theme.colors.separator }
          ]}
        >
          <View style={[
            styles.toggleThumb,
            { transform: [{ translateX: moderationSettings.requireParentApproval ? 20 : 0 }] }
          ]} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
          Auto-filter profanity
        </Text>
        <TouchableOpacity
          onPress={() => handleUpdateSettings('filterProfanity', !moderationSettings.filterProfanity)}
          style={[
            styles.toggle,
            { backgroundColor: moderationSettings.filterProfanity ? theme.colors.primary : theme.colors.separator }
          ]}
        >
          <View style={[
            styles.toggleThumb,
            { transform: [{ translateX: moderationSettings.filterProfanity ? 20 : 0 }] }
          ]} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
          Auto-filter links
        </Text>
        <TouchableOpacity
          onPress={() => handleUpdateSettings('filterLinks', !moderationSettings.filterLinks)}
          style={[
            styles.toggle,
            { backgroundColor: moderationSettings.filterLinks ? theme.colors.primary : theme.colors.separator }
          ]}
        >
          <View style={[
            styles.toggleThumb,
            { transform: [{ translateX: moderationSettings.filterLinks ? 20 : 0 }] }
          ]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading pending messages...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <FlatList
        data={pendingMessages}
        renderItem={renderPendingMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderSettings}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No pending messages
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              All messages have been reviewed
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
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
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: spacing.XS,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.title3.fontSize,
    fontWeight: '600',
    marginLeft: spacing.M,
  },
  approveAllButton: {
    padding: spacing.XS,
  },
  approveAllText: {
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: spacing.M,
  },
  settingsSection: {
    marginHorizontal: spacing.M,
    marginBottom: spacing.L,
    padding: spacing.M,
    borderRadius: borderRadius.medium,
  },
  sectionTitle: {
    fontSize: typography.headline.fontSize,
    fontWeight: '700',
    marginBottom: spacing.M,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.S,
  },
  settingLabel: {
    flex: 1,
    fontSize: typography.subheadline.fontSize,
    marginRight: spacing.M,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  messageCard: {
    marginHorizontal: spacing.M,
    marginBottom: spacing.M,
    padding: spacing.M,
    borderRadius: borderRadius.medium,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.S,
  },
  senderName: {
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: typography.caption1.fontSize,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.M,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.M,
  },
  mediaText: {
    marginLeft: spacing.S,
    fontSize: typography.subheadline.fontSize,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.S,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginBottom: spacing.M,
    alignSelf: 'flex-start',
  },
  flagText: {
    marginLeft: spacing.XS,
    fontSize: typography.caption1.fontSize,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.S,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.S,
    borderRadius: borderRadius.medium,
    gap: spacing.XS,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.S,
    borderRadius: borderRadius.medium,
    gap: spacing.XS,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.subheadline.fontSize,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.M,
    fontSize: typography.subheadline.fontSize,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.XXL * 2,
  },
  emptyText: {
    marginTop: spacing.M,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: spacing.XS,
    fontSize: typography.subheadline.fontSize,
  },
});