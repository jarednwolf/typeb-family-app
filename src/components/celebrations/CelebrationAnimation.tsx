/**
 * CelebrationAnimation Component
 * Confetti and particle effects for celebrations
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../constants/themeExtended';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationAnimationProps {
  type: 'confetti' | 'fireworks' | 'stars' | 'hearts';
  particleCount?: number;
  duration?: number;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'star' | 'heart';
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  type = 'confetti',
  particleCount = 50,
  duration = 3000,
}) => {
  const particles = useRef<Particle[]>([]);

  // Generate random colors for confetti
  const getRandomColor = () => {
    const confettiColors = [
      '#FF3B30', // Red
      '#FF9500', // Orange
      '#FFCC00', // Yellow
      '#34C759', // Green
      '#007AFF', // Blue
      '#5856D6', // Purple
      '#FF2D55', // Pink
      '#00C7BE', // Teal
    ];
    return confettiColors[Math.floor(Math.random() * confettiColors.length)];
  };

  // Generate particle shape based on type
  const getParticleShape = () => {
    switch (type) {
      case 'hearts':
        return 'heart';
      case 'stars':
        return 'star';
      case 'fireworks':
        return 'circle';
      default:
        return Math.random() > 0.5 ? 'square' : 'circle';
    }
  };

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    const particleEndPositions: { endX: number; endY: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = -50 - Math.random() * 100;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = SCREEN_HEIGHT + 100;

      newParticles.push({
        x: new Animated.Value(startX),
        y: new Animated.Value(startY),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        color: getRandomColor(),
        size: Math.random() * 15 + 10,
        shape: getParticleShape(),
      });
      
      particleEndPositions.push({ endX, endY });
    }

    particles.current = newParticles;

    // Animate particles
    const animations = newParticles.map((particle, index) => {
      const { endX, endY } = particleEndPositions[index];
      return Animated.parallel([
        // Fall animation
        Animated.timing(particle.y, {
          toValue: endY,
          duration: duration + Math.random() * 1000,
          useNativeDriver: true,
        }),
        // Horizontal drift
        Animated.timing(particle.x, {
          toValue: endX,
          duration: duration + Math.random() * 1000,
          useNativeDriver: true,
        }),
        // Rotation
        Animated.loop(
          Animated.timing(particle.rotate, {
            toValue: 1,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          })
        ),
        // Fade out
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
        // Scale animation for fireworks
        type === 'fireworks'
          ? Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 2,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          : Animated.timing(particle.scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
      ]);
    });

    Animated.parallel(animations).start();

    return () => {
      // Cleanup
      particles.current = [];
    };
  }, [type, particleCount, duration]);

  const renderParticle = (particle: Particle, index: number) => {
    const spin = particle.rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const particleStyle = {
      position: 'absolute' as const,
      width: particle.size,
      height: particle.size,
      backgroundColor: particle.shape !== 'heart' && particle.shape !== 'star' ? particle.color : 'transparent',
      borderRadius: particle.shape === 'circle' ? particle.size / 2 : 0,
      transform: [
        { translateX: particle.x },
        { translateY: particle.y },
        { rotate: spin },
        { scale: particle.scale },
      ],
      opacity: particle.opacity,
    };

    // Render different shapes
    if (particle.shape === 'heart') {
      return (
        <Animated.View key={index} style={particleStyle}>
          <View style={[styles.heart, { backgroundColor: particle.color }]} />
          <View style={[styles.heartLeft, { backgroundColor: particle.color }]} />
          <View style={[styles.heartRight, { backgroundColor: particle.color }]} />
        </Animated.View>
      );
    }

    if (particle.shape === 'star') {
      return (
        <Animated.View key={index} style={particleStyle}>
          <View style={[styles.star, { borderBottomColor: particle.color }]} />
        </Animated.View>
      );
    }

    return <Animated.View key={index} style={particleStyle} />;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => renderParticle(particle, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  heart: {
    width: 10,
    height: 10,
    position: 'absolute',
    top: 0,
    left: 5,
    transform: [{ rotate: '-45deg' }],
  },
  heartLeft: {
    width: 10,
    height: 10,
    position: 'absolute',
    top: -5,
    left: 0,
    borderRadius: 5,
  },
  heartRight: {
    width: 10,
    height: 10,
    position: 'absolute',
    top: 0,
    left: 10,
    borderRadius: 5,
  },
  star: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default CelebrationAnimation;