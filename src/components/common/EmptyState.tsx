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
  AccessibilityInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, TextButton } from './Button';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getErrorMessage } from '../../services/errorMessages';

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
  const { theme } = useTheme();
  const { announce } = useAccessibility();
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
    
    // Announce empty state to screen readers
    const announcement = `${title}. ${message || ''}`;
    announce(announcement, { delay: 100 });
  }, [title, message]);

  const iconSize = variant === 'large' ? 64 : variant === 'compact' ? 32 : 48;
  
  // Generate alt text for the icon
  const iconAltTextMap: Record<string, string> = {
    'inbox': 'Empty inbox',
    'check-circle': 'Tasks completed',
    'users': 'People',
    'bell': 'Notifications bell',
    'search': 'Search magnifying glass',
    'alert-circle': 'Warning alert',
    'wifi-off': 'No connection',
  };
  const iconAltText = iconAltTextMap[icon] || 'Status icon';

  return (
    <Animated.View
      style={[
        getStyles(theme).container,
        variant === 'compact' && getStyles(theme).containerCompact,
        variant === 'large' && getStyles(theme).containerLarge,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      accessibilityLabel={`${title}. ${message || ''}`}
    >
      <View
        style={[
          getStyles(theme).iconContainer,
          variant === 'compact' && getStyles(theme).iconContainerCompact,
        ]}
        accessibilityLabel={iconAltText}
        accessibilityRole="image"
      >
        <Feather name={icon} size={iconSize} color={theme.colors.textTertiary} />
      </View>

      <Text
        style={[
          getStyles(theme).title,
          variant === 'compact' && getStyles(theme).titleCompact,
          variant === 'large' && getStyles(theme).titleLarge,
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {message && (
        <Text
          style={[
            getStyles(theme).message,
            variant === 'compact' && getStyles(theme).messageCompact,
          ]}
          accessibilityRole="text"
        >
          {message}
        </Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={getStyles(theme).actions}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              size={variant === 'compact' ? 'small' : 'medium'}
              style={getStyles(theme).primaryAction}
              accessibilityHint={`Tap to ${actionLabel.toLowerCase()}`}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <TextButton
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              size={variant === 'compact' ? 'small' : 'medium'}
              accessibilityHint={`Tap to ${secondaryActionLabel.toLowerCase()}`}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Preset empty states for common scenarios with improved CTAs
export const NoTasksEmpty: React.FC<{
  onCreateTask: () => void;
}> = ({ onCreateTask }) => (
  <EmptyState
    icon="check-circle"
    title="Ready to get started?"
    message="Create your first task and begin building productive habits with your family"
    actionLabel="Create Your First Task"
    onAction={onCreateTask}
  />
);

export const NoFamilyEmpty: React.FC<{
  onCreate: () => void;
  onJoin: () => void;
}> = ({ onCreate, onJoin }) => (
  <EmptyState
    icon="users"
    title="Welcome to TypeB Family"
    message="Connect with your family to start managing tasks and building accountability together"
    actionLabel="Start a New Family"
    onAction={onCreate}
    secondaryActionLabel="Join Existing Family"
    onSecondaryAction={onJoin}
  />
);

export const NoNotificationsEmpty: React.FC = () => (
  <EmptyState
    icon="bell"
    title="All caught up!"
    message="No new notifications right now. We'll let you know when something needs your attention"
    variant="compact"
  />
);

export const SearchEmpty: React.FC<{
  searchTerm: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => (
  <EmptyState
    icon="search"
    title="No matches found"
    message={`Try adjusting your search terms or filters for "${searchTerm}"`}
    actionLabel="Clear and Try Again"
    onAction={onClear}
    variant="compact"
  />
);

export const ErrorState: React.FC<{
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
}> = ({ message, errorCode, onRetry }) => {
  let finalMessage: string;
  
  if (errorCode) {
    const errorMessage = getErrorMessage(errorCode as any);
    finalMessage = typeof errorMessage === 'string'
      ? errorMessage
      : errorMessage.message;
  } else {
    finalMessage = message || "We encountered an unexpected issue. Please try again.";
  }
    
  return (
    <EmptyState
      icon="alert-circle"
      title="Something went wrong"
      message={finalMessage}
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
};

export const OfflineState: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <EmptyState
    icon="wifi-off"
    title="You're offline"
    message="Check your internet connection to sync your data and continue"
    actionLabel="Retry Connection"
    onAction={onRetry}
    variant="compact"
  />
);

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.XL,
  },

  containerCompact: {
    padding: theme.spacing.L,
  },

  containerLarge: {
    padding: theme.spacing.XXL,
  },

  iconContainer: {
    marginBottom: theme.spacing.L,
  },

  iconContainerCompact: {
    marginBottom: theme.spacing.M,
  },

  title: {
    ...theme.typography.title3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.XS,
  },

  titleCompact: {
    ...theme.typography.headline,
  },

  titleLarge: {
    ...theme.typography.title1,
  },

  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.L,
    maxWidth: 280,
    lineHeight: 22,
  },

  messageCompact: {
    ...theme.typography.subheadline,
    marginBottom: theme.spacing.M,
  },

  actions: {
    alignItems: 'center',
  },

  primaryAction: {
    marginBottom: theme.spacing.S,
    minWidth: 160,
  },
});

export default EmptyState;