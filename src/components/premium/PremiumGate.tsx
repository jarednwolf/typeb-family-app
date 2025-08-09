import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface PremiumGateProps {
  feature: string;
  isPremium: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  showBadge?: boolean;
  onUpgradePress?: () => void;
}

/**
 * PremiumGate Component
 * 
 * Wraps premium features and shows upgrade prompts for free users
 * 
 * @param feature - Name of the premium feature
 * @param isPremium - Whether user has premium access
 * @param children - Content to show when premium is active
 * @param style - Additional styles for the container
 * @param showBadge - Whether to show premium badge
 * @param onUpgradePress - Custom upgrade handler
 */
const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  isPremium,
  children,
  style,
  showBadge = true,
  onUpgradePress,
}) => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      navigation.navigate('Premium' as never);
    }
  };

  // If user has premium, show the content
  if (isPremium) {
    return <>{children}</>;
  }

  // Show upgrade prompt for free users
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <View style={[
        styles.lockContainer,
        { backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.warning + '10' }
      ]}>
        <Feather 
          name="lock" 
          size={48} 
          color={theme.colors.warning} 
        />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Premium Feature
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {feature} is a premium feature. Upgrade to unlock this and more!
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.colors.warning }]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <Feather name="award" size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
      {showBadge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
          <Feather name="award" size={12} color="#FFFFFF" />
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  lockContainer: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default PremiumGate;