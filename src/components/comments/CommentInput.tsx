/**
 * CommentInput Component
 * Rich text input with mention support
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MentionPicker } from './MentionPicker';

interface CommentInputProps {
  onSubmit: (text: string, mentions: string[]) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  autoFocus?: boolean;
  submitButtonText?: string;
  familyMembers?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'parent' | 'child';
  }>;
  onCancel?: () => void;
  showCancel?: boolean;
  containerStyle?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = 'Add a comment...',
  maxLength = 500,
  minHeight = 80,
  maxHeight = 200,
  autoFocus = false,
  submitButtonText = 'Post',
  familyMembers = [],
  onCancel,
  showCancel = false,
  containerStyle,
}) => {
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [inputHeight, setInputHeight] = useState(minHeight);
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Check for @ mentions
    const lastChar = newText[newText.length - 1];
    const lastTwoChars = newText.slice(-2);
    
    if (lastChar === '@' || (lastTwoChars.endsWith(' @') || lastTwoChars === '\n@')) {
      setShowMentionPicker(true);
      setMentionSearchQuery('');
    } else if (showMentionPicker) {
      // Extract search query after @
      const lastAtIndex = newText.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const query = newText.substring(lastAtIndex + 1);
        if (query.includes(' ') || query.includes('\n')) {
          setShowMentionPicker(false);
        } else {
          setMentionSearchQuery(query);
        }
      }
    }
  };

  const handleMentionSelect = (member: {
    id: string;
    name: string;
    avatar?: string;
    role: 'parent' | 'child';
  }) => {
    // Find the last @ symbol
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Replace @query with @[name](id)
      const beforeMention = text.substring(0, lastAtIndex);
      const afterMention = text.substring(lastAtIndex + mentionSearchQuery.length + 1);
      const mentionText = `@${member.name}`;
      const newText = beforeMention + mentionText + ' ' + afterMention;
      
      setText(newText);
      setMentions([...mentions, member.id]);
      setShowMentionPicker(false);
      setMentionSearchQuery('');
      
      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    if (trimmedText.length > maxLength) {
      Alert.alert('Error', `Comment exceeds maximum length of ${maxLength} characters`);
      return;
    }

    try {
      await onSubmit(trimmedText, mentions);
      setText('');
      setMentions([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(event.nativeEvent.contentSize.height, minHeight), maxHeight);
    setInputHeight(newHeight);
  };

  const renderFormattedText = () => {
    // Simple mention highlighting
    const parts = text.split(/(@\w+)/g);
    return (
      <View style={{ position: 'absolute', padding: 12, pointerEvents: 'none' }}>
        <Text>
          {parts.map((part, index) => {
            if (part.startsWith('@')) {
              return (
                <Text
                  key={index}
                  style={{
                    color: '#3B82F6',
                    fontWeight: '600',
                  }}
                >
                  {part}
                </Text>
              );
            }
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ width: '100%' }, containerStyle]}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {/* Input Container */}
        <View
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 12,
          }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleTextChange}
            onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
            onContentSizeChange={handleContentSizeChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            autoFocus={autoFocus}
            style={{
              padding: 12,
              fontSize: 14,
              color: '#1F2937',
              height: inputHeight,
              textAlignVertical: 'top',
            }}
            maxLength={maxLength}
          />

          {/* Character Counter */}
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              backgroundColor: text.length > maxLength * 0.9 ? '#FEE2E2' : '#F3F4F6',
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: text.length > maxLength * 0.9 ? '#DC2626' : '#6B7280',
                fontWeight: '500',
              }}
            >
              {text.length}/{maxLength}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Left Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Mention Button */}
            <TouchableOpacity
              onPress={() => {
                const newText = text + '@';
                setText(newText);
                setShowMentionPicker(true);
                inputRef.current?.focus();
              }}
              style={{
                padding: 8,
                marginRight: 4,
              }}
            >
              <Ionicons name="at" size={22} color="#6B7280" />
            </TouchableOpacity>

            {/* Emoji Button (placeholder for future) */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Coming Soon', 'Emoji picker will be available soon!');
              }}
              style={{
                padding: 8,
              }}
            >
              <Ionicons name="happy-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Right Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showCancel && onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: '#6B7280',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!text.trim()}
              style={{
                backgroundColor: text.trim() ? '#3B82F6' : '#E5E7EB',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: text.trim() ? '#FFFFFF' : '#9CA3AF',
                  fontWeight: '600',
                }}
              >
                {submitButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mention Picker */}
        {showMentionPicker && familyMembers.length > 0 && (
          <MentionPicker
            members={familyMembers}
            searchQuery={mentionSearchQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionPicker(false)}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentInput;