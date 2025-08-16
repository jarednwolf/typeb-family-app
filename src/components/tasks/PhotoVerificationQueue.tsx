import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 80;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

interface PhotoVerificationQueueProps {
  tasks: any[];
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
}

const PhotoVerificationQueue: React.FC<PhotoVerificationQueueProps> = ({
  tasks,
  onApprove,
  onReject,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const [isProcessing, setIsProcessing] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - Approve
          handleApprove();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Reject
          handleReject();
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const handleApprove = () => {
    if (isProcessing || currentIndex >= tasks.length) return;
    
    setIsProcessing(true);
    const currentTask = tasks[currentIndex];
    
    Animated.timing(position, {
      toValue: { x: screenWidth, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onApprove(currentTask.id);
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
      setIsProcessing(false);
    });
  };

  const handleReject = () => {
    if (isProcessing || currentIndex >= tasks.length) return;
    
    setIsProcessing(true);
    const currentTask = tasks[currentIndex];
    
    Animated.timing(position, {
      toValue: { x: -screenWidth, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onReject(currentTask.id);
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
      setIsProcessing(false);
    });
  };

  const rotateCard = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const approveOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rejectOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.L,
      height: 380,
    },
    cardContainer: {
      position: 'absolute',
      width: CARD_WIDTH,
      left: theme.spacing.L,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      ...theme.shadows.medium,
      overflow: 'hidden',
    },
    imageContainer: {
      height: 200,
      position: 'relative',
    },
    taskImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.backgroundTexture,
    },
    swipeIndicator: {
      position: 'absolute',
      top: '50%',
      marginTop: -40,
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveIndicator: {
      right: 20,
      backgroundColor: theme.colors.success,
    },
    rejectIndicator: {
      left: 20,
      backgroundColor: theme.colors.error,
    },
    cardInfo: {
      padding: theme.spacing.M,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.XS,
    },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.S,
      marginBottom: theme.spacing.S,
    },
    childAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 10,
      color: theme.colors.white,
      fontWeight: '600',
    },
    childName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: theme.spacing.S,
      borderTopWidth: 1,
      borderTopColor: theme.colors.separator,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.XS,
      paddingVertical: theme.spacing.S,
      paddingHorizontal: theme.spacing.L,
    },
    rejectButton: {
      backgroundColor: theme.colors.error + '10',
      borderRadius: theme.borderRadius.medium,
    },
    approveButton: {
      backgroundColor: theme.colors.success + '10',
      borderRadius: theme.borderRadius.medium,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    rejectText: {
      color: theme.colors.error,
    },
    approveText: {
      color: theme.colors.success,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      padding: theme.spacing.XL,
    },
    emptyIcon: {
      marginBottom: theme.spacing.M,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.S,
    },
    emptyMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    queueCounter: {
      position: 'absolute',
      bottom: theme.spacing.M,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: theme.spacing.XS,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.separator,
    },
    activeDot: {
      backgroundColor: theme.colors.primary,
      width: 20,
    },
  });

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather 
          name="check-circle" 
          size={48} 
          color={theme.colors.success} 
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptyMessage}>
          No tasks awaiting photo verification
        </Text>
      </View>
    );
  }

  if (currentIndex >= tasks.length) {
    return (
      <View style={styles.emptyState}>
        <Feather 
          name="thumbs-up" 
          size={48} 
          color={theme.colors.primary} 
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>Queue Cleared!</Text>
        <Text style={styles.emptyMessage}>
          You've reviewed all pending tasks
        </Text>
      </View>
    );
  }

  const currentTask = tasks[currentIndex];
  const remainingTasks = tasks.slice(currentIndex + 1, Math.min(currentIndex + 3, tasks.length));

  return (
    <View style={styles.container}>
      {/* Background cards preview */}
      {remainingTasks.map((task, index) => (
        <View
          key={task.id}
          style={[
            styles.cardContainer,
            {
              zIndex: -index - 1,
              transform: [
                { scale: 1 - (index + 1) * 0.05 },
                { translateY: (index + 1) * 10 },
              ],
              opacity: 1 - (index + 1) * 0.3,
            },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: task.photoUrl }} style={styles.taskImage} />
            </View>
          </View>
        </View>
      ))}

      {/* Active card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: position.x },
              { rotate: rotateCard },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentTask.photoUrl }} style={styles.taskImage} />
            
            {/* Swipe indicators */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.approveIndicator,
                { opacity: approveOpacity },
              ]}
            >
              <Feather name="check" size={40} color={theme.colors.white} />
            </Animated.View>
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.rejectIndicator,
                { opacity: rejectOpacity },
              ]}
            >
              <Feather name="x" size={40} color={theme.colors.white} />
            </Animated.View>
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.taskTitle}>{currentTask.title}</Text>
            <View style={styles.taskMeta}>
              <View style={styles.childAvatar}>
                <Text style={styles.avatarText}>
                  {currentTask.assignedToName?.charAt(0) || '?'}
                </Text>
              </View>
              <Text style={styles.childName}>{currentTask.assignedToName}</Text>
              <Text style={styles.timestamp}>
                {currentTask.completedAt 
                  ? new Date(currentTask.completedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Just now'}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                <Feather name="x" size={18} color={theme.colors.error} />
                <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleApprove}
                disabled={isProcessing}
              >
                <Feather name="check" size={18} color={theme.colors.success} />
                <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Queue indicator dots */}
      <View style={styles.queueCounter}>
        {tasks.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default PhotoVerificationQueue;