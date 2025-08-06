/**
 * Card Component - Reusable card container
 * 
 * Features:
 * - Clean, minimal design
 * - Optional header and footer
 * - Press handling
 * - Shadow variants
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
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

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
    variant === 'outlined' && styles.outlined,
    variant === 'elevated' && styles.elevated,
    {
      padding: paddingMap[padding],
      marginHorizontal: marginMap[margin],
      marginVertical: marginMap[margin] / 2,
    },
    style,
  ].filter(Boolean) as ViewStyle[];

  const CardWrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, disabled, activeOpacity: 0.7, ...props } : props;

  return (
    <CardWrapper style={cardStyles} {...wrapperProps}>
      {(title || subtitle || rightIcon) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={rightIcon} size={20} color={colors.textSecondary} />
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
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </CardWrapper>
  );
};

// Specialized card variants
export const InfoCard: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color?: string;
  onPress?: () => void;
}> = ({ icon, title, description, color = colors.info, onPress }) => {
  return (
    <Card onPress={onPress} padding="medium">
      <View style={styles.infoCardContent}>
        <View style={[styles.infoCardIcon, { backgroundColor: color + '15' }]}>
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.infoCardText}>
          <Text style={styles.infoCardTitle}>{title}</Text>
          <Text style={styles.infoCardDescription}>{description}</Text>
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
  return (
    <Card padding="medium">
      <View style={styles.actionCardContent}>
        {icon && (
          <View style={styles.actionCardIcon}>
            <Feather name={icon} size={32} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.actionCardText}>
          <Text style={styles.actionCardTitle}>{title}</Text>
          {description && (
            <Text style={styles.actionCardDescription}>{description}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.actionCardButton}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionCardButtonText}>{actionText}</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    ...shadows.small,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.separator,
    shadowColor: 'transparent',
    elevation: 0,
  },
  
  elevated: {
    ...shadows.large,
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
    color: colors.textPrimary,
  },
  
  subtitle: {
    ...typography.caption1,
    color: colors.textSecondary,
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
    borderTopColor: colors.separator,
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
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  infoCardDescription: {
    ...typography.caption1,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    fontWeight: '500',
  },
  
  actionCardDescription: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: spacing.XXS,
  },
  
  actionCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.XS,
    paddingHorizontal: spacing.S,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
  },
  
  actionCardButtonText: {
    ...typography.caption1,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.XXS,
  },
});

export default Card;