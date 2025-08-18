/**
 * ReactionSummary Component
 * Shows a summary of all reactions with user details
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REACTION_METADATA, ReactionType } from '../../services/reactions';

interface ReactionSummaryProps {
  visible: boolean;
  onClose: () => void;
  reactions: Record<string, {
    userId: string;
    userName: string;
    userAvatar?: string;
    reactionType: ReactionType;
    timestamp: number;
  }> | null;
  title?: string;
}

export const ReactionSummary: React.FC<ReactionSummaryProps> = ({
  visible,
  onClose,
  reactions,
  title = 'Reactions',
}) => {
  // Group reactions by type
  const getGroupedReactions = () => {
    if (!reactions) return {};

    const grouped: Record<ReactionType, Array<{
      userId: string;
      userName: string;
      userAvatar?: string;
      timestamp: number;
    }>> = {} as any;

    Object.entries(reactions).forEach(([userId, reaction]) => {
      if (!grouped[reaction.reactionType]) {
        grouped[reaction.reactionType] = [];
      }
      grouped[reaction.reactionType].push({
        userId,
        userName: reaction.userName,
        userAvatar: reaction.userAvatar,
        timestamp: reaction.timestamp,
      });
    });

    // Sort by number of reactions (most popular first)
    return Object.entries(grouped)
      .sort((a, b) => b[1].length - a[1].length)
      .reduce((acc, [key, value]) => {
        acc[key as ReactionType] = value;
        return acc;
      }, {} as typeof grouped);
  };

  const groupedReactions = getGroupedReactions();
  const totalCount = reactions ? Object.keys(reactions).length : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#1F2937',
                }}
              >
                {title}
              </Text>
              {totalCount > 0 && (
                <View
                  style={{
                    backgroundColor: '#3B82F6',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    {totalCount}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={{
              paddingVertical: 8,
            }}
          >
            {Object.entries(groupedReactions).length === 0 ? (
              <View
                style={{
                  padding: 32,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: '#6B7280',
                    textAlign: 'center',
                  }}
                >
                  No reactions yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#9CA3AF',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  Be the first to react!
                </Text>
              </View>
            ) : (
              Object.entries(groupedReactions).map(([reactionType, users]) => {
                const metadata = REACTION_METADATA[reactionType as ReactionType];
                const usersList = users as Array<{
                  userId: string;
                  userName: string;
                  userAvatar?: string;
                  timestamp: number;
                }>;
                return (
                  <View
                    key={reactionType}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F9FAFB',
                    }}
                  >
                    {/* Reaction Header */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>
                        {metadata.emoji}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: '#374151',
                          marginLeft: 8,
                        }}
                      >
                        {metadata.label}
                      </Text>
                      <View
                        style={{
                          backgroundColor: metadata.color + '20',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          marginLeft: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: metadata.color,
                          }}
                        >
                          {usersList.length}
                        </Text>
                      </View>
                    </View>

                    {/* User List */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {usersList.map((user) => (
                        <View
                          key={user.userId}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            marginRight: 8,
                            marginBottom: 4,
                          }}
                        >
                          {user.userAvatar ? (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: '#E5E7EB',
                                marginRight: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 10 }}>
                                {user.userName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: '#3B82F6',
                                marginRight: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: '#FFFFFF',
                                  fontWeight: '600',
                                }}
                              >
                                {user.userName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text
                            style={{
                              fontSize: 14,
                              color: '#374151',
                            }}
                          >
                            {user.userName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer Stats */}
          {totalCount > 0 && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                backgroundColor: '#F9FAFB',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Total Reactions
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      color: '#1F2937',
                    }}
                  >
                    {totalCount}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Unique Types
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      color: '#1F2937',
                    }}
                  >
                    {Object.keys(groupedReactions).length}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Most Popular
                  </Text>
                  <Text style={{ fontSize: 20 }}>
                    {Object.keys(groupedReactions)[0]
                      ? REACTION_METADATA[Object.keys(groupedReactions)[0] as ReactionType].emoji
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ReactionSummary;