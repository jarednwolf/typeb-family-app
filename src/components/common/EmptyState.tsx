/**
 * EmptyState Component - Premium empty state displays
 * 
 * Features:
 * - Clean, minimal design
 * - Contextual messages
 * - Action buttons
 * - Subtle animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../constants/theme';
import { Button, TextButton } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'compact' | 'large';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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

  const iconSize = variant === 'large' ? 64 : variant === 'compact' ? 32 : 48;

  return (
    <Animated.View
      style={[
        styles.container,
        variant === 'compact' && styles.containerCompact,
        variant === 'large' && styles.containerLarge,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[
        styles.iconContainer,
        variant === 'compact' && styles.iconContainerCompact,
      ]}>
        <Feather name={icon} size={iconSize} color={colors.textTertiary} />
      </View>

      <Text style={[
        styles.title,
        variant === 'compact' && styles.titleCompact,
        variant === 'large' && styles.titleLarge,
      ]}>
        {title}
      </Text>

      {message && (
        <Text style={[
          styles.message,
          variant === 'compact' && styles.messageCompact,
        ]}>
          {message}
        </Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              size={variant === 'compact' ? 'small' : 'medium'}
              style={styles.primaryAction}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <TextButton
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              size={variant === 'compact' ? 'small' : 'medium'}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Preset empty states for common scenarios
export const NoTasksEmpty: React.FC<{
  onCreateTask: () => void;
}> = ({ onCreateTask }) => (
  <EmptyState
    icon="check-circle"
    title="No tasks yet"
    message="Create your first task to get started with your family's productivity journey"
    actionLabel="Create Task"
    onAction={onCreateTask}
  />
);

export const NoFamilyEmpty: React.FC<{
  onCreate: () => void;
  onJoin: () => void;
}> = ({ onCreate, onJoin }) => (
  <EmptyState
    icon="users"
    title="Welcome to TypeB"
    message="Start by creating a new family or joining an existing one"
    actionLabel="Create Family"
    onAction={onCreate}
    secondaryActionLabel="Join Family"
    onSecondaryAction={onJoin}
  />
);

export const NoNotificationsEmpty: React.FC = () => (
  <EmptyState
    icon="bell"
    title="No notifications"
    message="You're all caught up! Check back later for updates"
    variant="compact"
  />
);

export const SearchEmpty: React.FC<{
  searchTerm: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => (
  <EmptyState
    icon="search"
    title="No results found"
    message={`We couldn't find anything matching "${searchTerm}"`}
    actionLabel="Clear Search"
    onAction={onClear}
    variant="compact"
  />
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = "Something went wrong", onRetry }) => (
  <EmptyState
    icon="alert-circle"
    title="Oops!"
    message={message}
    actionLabel="Try Again"
    onAction={onRetry}
  />
);

export const OfflineState: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <EmptyState
    icon="wifi-off"
    title="No connection"
    message="Please check your internet connection and try again"
    actionLabel="Retry"
    onAction={onRetry}
    variant="compact"
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.XL,
  },

  containerCompact: {
    padding: spacing.L,
  },

  containerLarge: {
    padding: spacing.XXL,
  },

  iconContainer: {
    marginBottom: spacing.L,
  },

  iconContainerCompact: {
    marginBottom: spacing.M,
  },

  title: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.XS,
  },

  titleCompact: {
    ...typography.headline,
  },

  titleLarge: {
    ...typography.title1,
  },

  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.L,
    maxWidth: 280,
  },

  messageCompact: {
    ...typography.subheadline,
    marginBottom: spacing.M,
  },

  actions: {
    alignItems: 'center',
  },

  primaryAction: {
    marginBottom: spacing.S,
    minWidth: 140,
  },
});

export default EmptyState;