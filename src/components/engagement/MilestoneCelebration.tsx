import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type MilestoneType = 'bronze' | 'silver' | 'gold' | 'diamond';

interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: MilestoneType;
  percentage: number;
  onDismiss: () => void;
  autoDismiss?: boolean;
}

const MILESTONE_CONFIG = {
  bronze: {
    badge: 'BRONZE',
    color: '#CD7F32',
    message: 'Great start! You completed 25% of your tasks!',
    confettiColors: ['#CD7F32', '#B87333', '#A0522D', '#8B4513'],
  },
  silver: {
    badge: 'SILVER',
    color: '#C0C0C0',
    message: 'Halfway there! You finished 50% of your tasks!',
    confettiColors: ['#C0C0C0', '#A8A8A8', '#808080', '#696969'],
  },
  gold: {
    badge: 'GOLD',
    color: '#FFD700',
    message: 'Amazing job! You knocked out 75% of your tasks!',
    confettiColors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'],
  },
  diamond: {
    badge: 'DIAMOND',
    color: '#B9F2FF',
    message: 'PERFECT DAY! You completed ALL your tasks!',
    confettiColors: ['#B9F2FF', '#87CEEB', '#00BFFF', '#1E90FF'],
  },
};

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  visible,
  milestone,
  percentage,
  onDismiss,
  autoDismiss = true,
}) => {
  const { theme, isDarkMode } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout>();
  
  const config = MILESTONE_CONFIG[milestone];
  
  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Trigger animations
      opacity.value = withSpring(1, { damping: 20 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
      badgeRotation.value = withSequence(
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
      sparkleOpacity.value = withSequence(
        withDelay(500, withSpring(1)),
        withDelay(1000, withSpring(0)),
        withDelay(100, withSpring(1))
      );
      
      // Trigger confetti
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);
      
      // Auto dismiss after 3 seconds
      if (autoDismiss) {
        dismissTimerRef.current = setTimeout(() => {
          runOnJS(onDismiss)();
        }, 3000);
      }
    } else {
      // Reset animations
      opacity.value = 0;
      scale.value = 0;
      badgeRotation.value = 0;
      sparkleOpacity.value = 0;
    }
    
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible]);
  
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));
  
  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));
  
  const renderSparkles = () => {
    const sparkles = [];
    const sparkleCount = 8;
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i * 360) / sparkleCount;
      const distance = 120;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;
      
      sparkles.push(
        <Animated.View
          key={i}
          style={[
            styles.sparkle,
            sparkleAnimatedStyle,
            {
              position: 'absolute',
              left: screenWidth / 2 - 2 + x,
              top: screenHeight / 2 - 100 + y,
              backgroundColor: config.color,
            },
          ]}
        />
      );
    }
    
    return sparkles;
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={autoDismiss ? undefined : onDismiss}
      >
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          {/* Sparkles */}
          {renderSparkles()}
          
          {/* Badge */}
          <Animated.View
            style={[
              styles.badgeContainer,
              badgeAnimatedStyle,
              { backgroundColor: config.color },
            ]}
          >
            <Text style={[styles.badgeText, { color: '#000' }]}>
              {config.badge}
            </Text>
            <Text style={[styles.percentageText, { color: '#000' }]}>
              {percentage}%
            </Text>
          </Animated.View>
          
          {/* Message */}
          <Animated.View style={[styles.messageContainer, { opacity: opacity.value }]}>
            <Text style={[styles.messageText, { color: theme.colors.textPrimary }]}>
              {config.message}
            </Text>
          </Animated.View>
          
          {/* Confetti */}
          <ConfettiCannon
            ref={confettiRef}
            count={100}
            origin={{ x: screenWidth / 2, y: screenHeight / 2 }}
            explosionSpeed={350}
            fallSpeed={3000}
            fadeOut
            colors={config.confettiColors}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  badgeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.XS,
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '800',
  },
  messageContainer: {
    marginTop: spacing.XL,
    paddingHorizontal: spacing.XL,
    maxWidth: screenWidth * 0.8,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  sparkle: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default MilestoneCelebration;