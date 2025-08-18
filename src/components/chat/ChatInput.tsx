/**
 * ChatInput Component
 * Handles text, voice, and image input with safety features
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { 
  sendMessage, 
  sendVoiceMessage, 
  sendImageMessage,
  updateTypingIndicator 
} from '../../services/chat';
import { 
  ChatMessage, 
  QuickReply, 
  DEFAULT_QUICK_REPLIES,
  PROFANITY_LIST 
} from '../../types/chat';

interface ChatInputProps {
  chatId: string;
  replyTo?: ChatMessage;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowVoice?: boolean;
  allowImage?: boolean;
  quickReplies?: QuickReply[];
  onMessageSent?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  chatId,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
  allowVoice = true,
  allowImage = true,
  quickReplies = DEFAULT_QUICK_REPLIES,
  onMessageSent,
}) => {
  const { theme, isDarkMode } = useTheme();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const recordingIntervalRef = useRef<NodeJS.Timeout>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update typing indicator
  useEffect(() => {
    if (message.length > 0 && userProfile) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing indicator
      updateTypingIndicator(chatId, userProfile.id, userProfile.displayName, true);

      // Clear typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingIndicator(chatId, userProfile.id, userProfile.displayName, false);
      }, 3000);
    } else if (message.length === 0 && userProfile) {
      // Clear typing indicator immediately when message is empty
      updateTypingIndicator(chatId, userProfile.id, userProfile.displayName, false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatId, userProfile]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const checkForProfanity = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return PROFANITY_LIST.some(word => lowerText.includes(word));
  };

  const checkForSensitiveContent = (text: string): string | null => {
    // Check for profanity
    if (checkForProfanity(text)) {
      return 'Please keep the conversation friendly and appropriate.';
    }

    // Check for phone numbers
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    if (phoneRegex.test(text)) {
      return 'Sharing phone numbers is not allowed for safety reasons.';
    }

    // Check for email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (emailRegex.test(text)) {
      return 'Sharing email addresses is not allowed for safety reasons.';
    }

    return null;
  };

  const handleSend = async () => {
    if (!message.trim() || !userProfile || isSending) return;

    const trimmedMessage = message.trim();

    // Check for sensitive content
    const warning = checkForSensitiveContent(trimmedMessage);
    if (warning) {
      setWarningMessage(warning);
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(
        chatId,
        userProfile.id,
        userProfile.displayName,
        userProfile.role,
        trimmedMessage,
        userProfile.avatarUrl,
        replyTo
      );
      
      setMessage('');
      onCancelReply?.();
      onMessageSent?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable microphone access to send voice messages.');
        return;
      }

      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Note: Actual audio recording would require expo-av
      // For demo purposes, we're simulating the recording
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !userProfile) return;

    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    if (recordingDuration < 1) {
      Alert.alert('Too Short', 'Voice message must be at least 1 second long.');
      setRecordingDuration(0);
      return;
    }

    setIsSending(true);
    try {
      // In a real implementation, we would get the audio blob from expo-av
      // For demo, we're creating a mock blob
      const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
      
      await sendVoiceMessage(
        chatId,
        userProfile.id,
        userProfile.displayName,
        userProfile.role,
        mockAudioBlob,
        recordingDuration,
        userProfile.avatarUrl
      );
      
      setRecordingDuration(0);
      onMessageSent?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending voice message:', error);
      Alert.alert('Error', 'Failed to send voice message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = async () => {
    if (!userProfile) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setIsSending(true);
        await sendImageMessage(
          chatId,
          userProfile.id,
          userProfile.displayName,
          userProfile.role,
          result.assets[0].uri,
          userProfile.avatarUrl
        );
        onMessageSent?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    setMessage(reply.text);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Warning Message */}
      {warningMessage && (
        <Animated.View
          style={[
            styles.warningBanner,
            { backgroundColor: theme.colors.error + '20' },
          ]}
        >
          <Ionicons name="warning" size={20} color={theme.colors.error} />
          <Text style={[styles.warningText, { color: theme.colors.error }]}>
            {warningMessage}
          </Text>
        </Animated.View>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.replyInfo}>
            <Text style={[styles.replyLabel, { color: theme.colors.primary }]}>
              Replying to {replyTo.senderName}
            </Text>
            <Text style={[styles.replyText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {replyTo.text || 'Media message'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Replies */}
      {showQuickReplies && !isRecording && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.quickRepliesContainer, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.quickRepliesContent}
        >
          {quickReplies.map((reply) => (
            <TouchableOpacity
              key={reply.id}
              style={[styles.quickReplyChip, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickReply(reply)}
            >
              {reply.emoji && <Text style={styles.quickReplyEmoji}>{reply.emoji}</Text>}
              <Text style={[styles.quickReplyText, { color: theme.colors.textPrimary }]}>
                {reply.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main Input Container */}
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        {isRecording ? (
          // Recording View
          <Animated.View 
            style={[
              styles.recordingContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.recordingInfo}>
              <View style={[styles.recordingDot, { backgroundColor: '#FF0000' }]} />
              <Text style={[styles.recordingDuration, { color: theme.colors.textPrimary }]}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={[styles.recordingLabel, { color: theme.colors.textSecondary }]}>
                Recording...
              </Text>
            </View>
            <TouchableOpacity
              onPress={stopRecording}
              style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
            >
              <Ionicons name="stop" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          // Normal Input View
          <>
            {/* Attachment Button */}
            {allowImage && (
              <TouchableOpacity
                onPress={handleImagePick}
                disabled={disabled || isSending}
                style={styles.attachButton}
              >
                <Feather name="paperclip" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Text Input */}
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textPrimary,
                },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={maxLength}
              editable={!disabled && !isSending}
              onFocus={() => setShowQuickReplies(false)}
              onBlur={() => setShowQuickReplies(true)}
            />

            {/* Character Count */}
            {message.length > maxLength * 0.8 && (
              <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                {message.length}/{maxLength}
              </Text>
            )}

            {/* Send/Voice Button */}
            {message.trim() ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={disabled || isSending}
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : allowVoice ? (
              <TouchableOpacity
                onPress={startRecording}
                disabled={disabled || isSending}
                style={styles.voiceButton}
              >
                <Ionicons name="mic" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    minHeight: 56,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.medium,
    fontSize: typography.body.fontSize,
    marginHorizontal: spacing.XS,
  },
  attachButton: {
    padding: spacing.S,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    padding: spacing.S,
  },
  charCount: {
    fontSize: typography.caption2.fontSize,
    marginRight: spacing.XS,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  replyInfo: {
    flex: 1,
  },
  replyLabel: {
    fontSize: typography.caption1.fontSize,
    fontWeight: '600',
  },
  replyText: {
    fontSize: typography.caption1.fontSize,
    marginTop: 2,
  },
  quickRepliesContainer: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  quickRepliesContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    gap: spacing.XS,
  },
  quickReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.XS,
    borderRadius: borderRadius.round,
    gap: spacing.XXS,
  },
  quickReplyEmoji: {
    fontSize: 16,
  },
  quickReplyText: {
    fontSize: typography.caption1.fontSize,
    fontWeight: '500',
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingDuration: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  recordingLabel: {
    fontSize: typography.subheadline.fontSize,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.S,
    gap: spacing.S,
  },
  warningText: {
    flex: 1,
    fontSize: typography.caption1.fontSize,
    fontWeight: '500',
  },
});