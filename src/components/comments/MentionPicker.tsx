/**
 * MentionPicker Component
 * Shows a list of family members to mention
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: 'parent' | 'child';
}

interface MentionPickerProps {
  members: Member[];
  searchQuery: string;
  onSelect: (member: Member) => void;
  onClose: () => void;
  maxHeight?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MentionPicker: React.FC<MentionPickerProps> = ({
  members,
  searchQuery,
  onSelect,
  onClose,
  maxHeight = 200,
}) => {
  // Filter members based on search query
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredMembers.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 8,
        maxHeight,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#6B7280',
          }}
        >
          Mention someone
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: maxHeight - 40 }}
      >
        {filteredMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            onPress={() => onSelect(member)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#F9FAFB',
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: member.role === 'parent' ? '#3B82F6' : '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              {member.avatar ? (
                <Text style={{ fontSize: 14, color: '#FFFFFF' }}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name and Role */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1F2937',
                }}
              >
                {member.name}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  textTransform: 'capitalize',
                }}
              >
                {member.role}
              </Text>
            </View>

            {/* Mention Symbol */}
            <Text
              style={{
                fontSize: 14,
                color: '#3B82F6',
                marginLeft: 8,
              }}
            >
              @
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Tip */}
      {searchQuery && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: '#F9FAFB',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: '#6B7280',
            }}
          >
            {filteredMembers.length === members.length
              ? `Showing all ${members.length} members`
              : `Showing ${filteredMembers.length} of ${members.length} members`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default MentionPicker;