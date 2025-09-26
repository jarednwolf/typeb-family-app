import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showIcon?: boolean;
  text?: string;
}

/**
 * PremiumBadge Component
 * 
 * Displays a premium indicator badge
 * 
 * @param size - Size of the badge (small, medium, large)
 * @param style - Additional styles
 * @param showIcon - Whether to show the premium icon
 * @param text - Custom text (default: "PRO")
 */
const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  size = 'small',
  style,
  showIcon = true,
  text = 'PRO',
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 10,
          iconSize: 10,
          fontSize: 10,
        };
      case 'medium':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          iconSize: 12,
          fontSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 14,
          iconSize: 14,
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.warning,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ]}
    >
      {showIcon && (
        <Feather
          name="award"
          size={sizeStyles.iconSize}
          color="#FFFFFF"
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles.fontSize },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default PremiumBadge;