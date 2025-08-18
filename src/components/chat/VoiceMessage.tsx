/**
 * VoiceMessage Component
 * Displays and plays voice messages in chat
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Audio } from 'expo-av'; // Optional: uncomment when expo-av is installed
import { ChatMessage } from '../../types/chat';

// Placeholder type for Audio when expo-av is not installed
interface Audio {
  Sound: {
    createAsync: (source: any, initialStatus?: any, onPlaybackStatusUpdate?: any) => Promise<{ sound: any }>;
  };
  PlaybackStatus: any;
}

interface VoiceMessageProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  currentUserId: string;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  currentUserId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<any | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const sound = useRef<any | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      // Cleanup sound on unmount
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!message.voiceUrl) return;

    try {
      if (isPlaying) {
        // Pause
        if (sound.current) {
          await sound.current.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        // Play
        setIsLoading(true);
        
        if (!sound.current) {
          // Load sound - placeholder for when expo-av is available
          // const { sound: newSound } = await Audio.Sound.createAsync(
          //   { uri: message.voiceUrl },
          //   { shouldPlay: true },
          //   (status: any) => {
          const handleStatus = (status: any) => {
              if (status.isLoaded) {
                setPlaybackStatus(status);
                setCurrentPosition(status.positionMillis || 0);
                
                // Update progress animation
                if (status.durationMillis) {
                  const progress = (status.positionMillis || 0) / status.durationMillis;
                  Animated.timing(progressAnim, {
                    toValue: progress,
                    duration: 200,
                    useNativeDriver: false,
                  }).start();
                }
                
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setCurrentPosition(0);
                  progressAnim.setValue(0);
                  sound.current = null;
                }
              }
            };
          // );
          
          // Placeholder: simulate sound loading
          console.log('Voice message playback requires expo-av to be installed');
          // sound.current = newSound;
          setIsPlaying(true);
        } else {
          // Resume
          await sound.current.playAsync();
          setIsPlaying(true);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const duration = message.voiceDuration || 0;
  const displayDuration = playbackStatus?.isLoaded && playbackStatus.durationMillis
    ? playbackStatus.durationMillis
    : duration * 1000;

  const getBubbleColor = () => {
    if (isOwnMessage) return '#3B82F6';
    return '#E5E7EB';
  };

  const getTextColor = () => {
    if (isOwnMessage) return '#FFFFFF';
    return '#1F2937';
  };

  const getIconColor = () => {
    if (isOwnMessage) return '#FFFFFF';
    return '#374151';
  };

  return (
    <View
      style={{
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: message.senderRole === 'parent' ? '#3B82F6' : '#10B981',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
            {message.senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {!showAvatar && !isOwnMessage && <View style={{ width: 40 }} />}

      {/* Voice Message Bubble */}
      <View>
        {/* Sender Name */}
        {!isOwnMessage && showAvatar && (
          <Text
            style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 2,
              marginLeft: 8,
            }}
          >
            {message.senderName}
          </Text>
        )}

        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={isLoading}
          style={{
            backgroundColor: getBubbleColor(),
            borderRadius: 18,
            borderBottomLeftRadius: isOwnMessage ? 18 : 4,
            borderBottomRightRadius: isOwnMessage ? 4 : 18,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minWidth: 200,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Play/Pause Button */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={getIconColor()} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={getIconColor()}
              />
            )}
          </View>

          {/* Waveform and Duration */}
          <View style={{ flex: 1 }}>
            {/* Waveform Visualization */}
            <View
              style={{
                height: 24,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              {[...Array(20)].map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 2,
                    height: 8 + Math.sin(index * 0.5) * 8,
                    backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                    marginHorizontal: 1,
                    borderRadius: 1,
                  }}
                />
              ))}
            </View>

            {/* Progress Bar */}
            <View
              style={{
                height: 2,
                backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: isOwnMessage ? '#FFFFFF' : '#3B82F6',
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>

            {/* Duration */}
            <Text
              style={{
                fontSize: 11,
                color: isOwnMessage ? '#DBEAFE' : '#6B7280',
                marginTop: 4,
              }}
            >
              {isPlaying && currentPosition > 0
                ? `${formatDuration(currentPosition)} / ${formatDuration(displayDuration)}`
                : formatDuration(displayDuration)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Message Time */}
        <Text
          style={{
            fontSize: 11,
            color: '#9CA3AF',
            marginTop: 4,
            marginLeft: 8,
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

// Add missing import
const ActivityIndicator = ({ size, color }: { size: string; color: string }) => (
  <View
    style={{
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: color,
      borderTopColor: 'transparent',
    }}
  />
);

export default VoiceMessage;