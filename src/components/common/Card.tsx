/**
 * Card Component - Reusable card container
 * 
 * Features:
 * - Clean, minimal design
 * - Optional header and footer
 * - Press handling
 * - Shadow variants
 * - Dark mode support
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  rightIcon,
  onRightIconPress,
  footer,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  style,
  onPress,
  disabled,
  ...props
}) => {
  const { theme, isDarkMode } = useTheme();
  
  const paddingMap = {
    none: 0,
    small: spacing.S,
    medium: spacing.M,
    large: spacing.L,
  };

  const marginMap = {
    none: 0,
    small: spacing.XS,
    medium: spacing.M,
    large: spacing.L,
  };

  const cardStyles = [
    styles.container,
    {
      backgroundColor: theme.colors.surface,
      ...theme.shadows.small,
    },
    variant === 'outlined' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.separator,
      shadowColor: 'transparent',
      elevation: 0,
    },
    variant === 'elevated' && theme.shadows.large,
    {
      padding: paddingMap[padding],
      marginHorizontal: marginMap[margin],
      marginVertical: marginMap[margin] / 2,
    },
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} disabled={disabled} activeOpacity={0.7} {...props}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  function renderContent() {
    return (
      <>
      {(title || subtitle || rightIcon) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
          </View>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={rightIcon} size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={[
        styles.content,
        (title || subtitle) && styles.contentWithHeader,
      ]}>
        {children}
      </View>
      
      {footer && (
        <View style={[styles.footer, { borderTopColor: theme.colors.separator }]}>
          {footer}
        </View>
      )}
      </>
    );
  }

  return (
    <View style={cardStyles}>
      {renderContent()}
    </View>
  );
};

// Specialized card variants
export const InfoCard: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color?: string;
  onPress?: () => void;
}> = ({ icon, title, description, color, onPress }) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.info;
  
  return (
    <Card onPress={onPress} padding="medium">
      <View style={styles.infoCardContent}>
        <View style={[styles.infoCardIcon, { backgroundColor: iconColor + '15' }]}>
          <Feather name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.infoCardText}>
          <Text style={[styles.infoCardTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.infoCardDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
    </Card>
  );
};

export const ActionCard: React.FC<{
  title: string;
  description?: string;
  actionText: string;
  onAction: () => void;
  icon?: keyof typeof Feather.glyphMap;
}> = ({ title, description, actionText, onAction, icon }) => {
  const { theme } = useTheme();
  
  return (
    <Card padding="medium">
      <View style={styles.actionCardContent}>
        {icon && (
          <View style={styles.actionCardIcon}>
            <Feather name={icon} size={32} color={theme.colors.textSecondary} />
          </View>
        )}
        <View style={styles.actionCardText}>
          <Text style={[styles.actionCardTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
          {description && (
            <Text style={[styles.actionCardDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.actionCardButton, { backgroundColor: theme.colors.background }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionCardButtonText, { color: theme.colors.primary }]}>{actionText}</Text>
          <Feather name="chevron-right" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.large,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.S,
  },
  
  headerText: {
    flex: 1,
  },
  
  title: {
    ...typography.headline,
  },
  
  subtitle: {
    ...typography.caption1,
    marginTop: spacing.XXS,
  },
  
  content: {
    // Content styles
  },
  
  contentWithHeader: {
    // Additional spacing when header is present
  },
  
  footer: {
    marginTop: spacing.M,
    paddingTop: spacing.M,
    borderTopWidth: 1,
  },
  
  // InfoCard styles
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.M,
  },
  
  infoCardText: {
    flex: 1,
  },
  
  infoCardTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  
  infoCardDescription: {
    ...typography.caption1,
    marginTop: spacing.XXS,
  },
  
  // ActionCard styles
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionCardIcon: {
    marginRight: spacing.M,
  },
  
  actionCardText: {
    flex: 1,
  },
  
  actionCardTitle: {
    ...typography.body,
    fontWeight: '500',
  },
  
  actionCardDescription: {
    ...typography.caption1,
    marginTop: spacing.XXS,
  },
  
  actionCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.XS,
    paddingHorizontal: spacing.S,
    borderRadius: borderRadius.medium,
  },
  
  actionCardButtonText: {
    ...typography.caption1,
    fontWeight: '600',
    marginRight: spacing.XXS,
  },
});

export default Card;