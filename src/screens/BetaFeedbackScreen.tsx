import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import feedbackCollector from '../utils/feedbackCollector';
import { useTheme } from '../contexts/ThemeContext';
import type { Feedback } from '../utils/feedbackCollector';

interface FeedbackTypeOption {
  type: Feedback['type'];
  icon: string;
  label: string;
  color: string;
}

const feedbackTypes: FeedbackTypeOption[] = [
  { type: 'bug', icon: 'bug', label: 'Report Bug', color: '#ef4444' },
  { type: 'feature', icon: 'bulb', label: 'Suggest Feature', color: '#3b82f6' },
  { type: 'improvement', icon: 'trending-up', label: 'Improvement', color: '#10b981' },
  { type: 'praise', icon: 'heart', label: 'Send Praise', color: '#ec4899' },
  { type: 'other', icon: 'chatbubbles', label: 'Other', color: '#6b7280' },
];

const severityLevels = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'critical', label: 'Critical', color: '#dc2626' },
];

export default function BetaFeedbackScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<Feedback['type']>('bug');
  const [severity, setSeverity] = useState<Feedback['severity']>('medium');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTypeSelect = (type: Feedback['type']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type);
    
    // Auto-set severity based on type
    if (type === 'bug') {
      setSeverity('high');
    } else if (type === 'praise') {
      setSeverity('low');
    } else {
      setSeverity('medium');
    }
  };

  const handleSeveritySelect = (value: Feedback['severity']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSeverity(value);
  };

  const handleAttachScreenshot = async () => {
    try {
      const screenshotUri = await feedbackCollector.captureScreenshot();
      if (screenshotUri) {
        setScreenshot(screenshotUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to attach screenshot');
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your feedback message');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Too Short', 'Please provide more detailed feedback (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await feedbackCollector.submitFeedback(
        selectedType,
        message,
        {
          severity,
          screenshots: screenshot ? [screenshot] : [],
          metadata: {
            screen: 'BetaFeedbackScreen',
            betaTester: true,
          },
        }
      );

      if (result.success) {
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Animate success
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Reset form after delay
        setTimeout(() => {
          setMessage('');
          setScreenshot(null);
          setShowSuccess(false);
          navigation.goBack();
        }, 2000);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 5,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -5,
    },
    typeButton: {
      width: '30%',
      margin: '1.66%',
      aspectRatio: 1,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    typeButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    typeIcon: {
      marginBottom: 5,
    },
    typeLabel: {
      fontSize: 11,
      textAlign: 'center',
      color: theme.colors.text,
    },
    severityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    severityButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 5,
      marginHorizontal: 5,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    severityButtonSelected: {
      borderColor: theme.colors.primary,
    },
    severityLabel: {
      fontSize: 13,
      fontWeight: '500',
    },
    messageInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 15,
      minHeight: 150,
      fontSize: 15,
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 5,
      textAlign: 'right',
    },
    screenshotButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 15,
    },
    screenshotButtonText: {
      marginLeft: 10,
      fontSize: 15,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    screenshotPreview: {
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    screenshotImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    removeScreenshot: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 20,
      padding: 8,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    successCard: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
    },
    successIcon: {
      marginBottom: 15,
    },
    successText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#10b981',
    },
    betaBadge: {
      position: 'absolute',
      top: 10,
      right: 20,
      backgroundColor: '#f59e0b',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    betaBadgeText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Feedback</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>BETA</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            {/* Feedback Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's your feedback about?</Text>
              <View style={styles.typeGrid}>
                {feedbackTypes.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.typeButton,
                      selectedType === type.type && styles.typeButtonSelected,
                      { backgroundColor: type.color + '10' },
                    ]}
                    onPress={() => handleTypeSelect(type.type)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={28}
                      color={selectedType === type.type ? theme.colors.primary : type.color}
                      style={styles.typeIcon}
                    />
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Severity (for bugs) */}
            {selectedType === 'bug' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How severe is this issue?</Text>
                <View style={styles.severityContainer}>
                  {severityLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.severityButton,
                        severity === level.value && styles.severityButtonSelected,
                        { backgroundColor: level.color + '10' },
                      ]}
                      onPress={() => handleSeveritySelect(level.value as Feedback['severity'])}
                    >
                      <Text
                        style={[
                          styles.severityLabel,
                          { color: severity === level.value ? level.color : theme.colors.text },
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Describe your feedback</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Tell us more about your experience..."
                placeholderTextColor={theme.colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
              />
              <Text style={styles.characterCount}>{message.length}/1000</Text>
            </View>

            {/* Screenshot */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attach Screenshot (Optional)</Text>
              {!screenshot ? (
                <TouchableOpacity
                  style={styles.screenshotButton}
                  onPress={handleAttachScreenshot}
                >
                  <Ionicons name="camera" size={24} color={theme.colors.primary} />
                  <Text style={styles.screenshotButtonText}>Add Screenshot</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.screenshotPreview}>
                  <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                  <TouchableOpacity
                    style={styles.removeScreenshot}
                    onPress={() => setScreenshot(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || !message.trim()) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View style={styles.successOverlay}>
            <Animated.View
              style={[
                styles.successCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={60}
                color="#10b981"
                style={styles.successIcon}
              />
              <Text style={styles.successText}>Thank you for your feedback!</Text>
            </Animated.View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
