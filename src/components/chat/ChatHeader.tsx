/**
 * ChatHeader Component
 * Header for the chat interface showing family info and online status
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatHeaderProps {
  familyName: string;
  onlineCount: number;
  totalCount: number;
  onBack?: () => void;
  onMembersPress?: () => void;
  onSettingsPress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  familyName,
  onlineCount,
  totalCount,
  onBack,
  onMembersPress,
  onSettingsPress,
}) => {
  return (
    <SafeAreaView
      style={{
        backgroundColor: '#3B82F6',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#3B82F6',
        }}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              padding: 4,
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Family Info */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onMembersPress}
          disabled={!onMembersPress}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            }}
          >
            {familyName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: onlineCount > 0 ? '#10B981' : '#EF4444',
                marginRight: 6,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: '#E0E7FF',
              }}
            >
              {onlineCount > 0
                ? `${onlineCount} of ${totalCount} online`
                : 'No one online'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onMembersPress && (
            <TouchableOpacity
              onPress={onMembersPress}
              style={{
                padding: 8,
                marginLeft: 8,
              }}
            >
              <Ionicons name="people-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {onSettingsPress && (
            <TouchableOpacity
              onPress={onSettingsPress}
              style={{
                padding: 8,
                marginLeft: 4,
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatHeader;