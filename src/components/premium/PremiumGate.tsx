import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { usePremium, usePremiumFeature } from '../../hooks/usePremium';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface PremiumGateProps {
  feature?: string;
  featureName?: string;
  featureDescription?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  featureName,
  featureDescription,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const themeCtx = useTheme();
  const colors = themeCtx.theme.colors;
  const navigation = useNavigation<any>();
  const { isPremium, isLoading } = feature 
    ? usePremiumFeature(feature)
    : usePremium();

  const handleUpgrade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Premium');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}> 
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}> 
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}> 
          {featureName || 'Premium Feature'}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}> 
          {featureDescription || 'This feature is available for premium members only.'}
        </Text>

        <View style={styles.benefitsList}>
          {[
            'Unlock all premium features',
            'Support development',
            'Priority customer support',
            'Regular updates & new features',
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={colors.success} 
              />
              <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.learnMoreButton}
          onPress={handleUpgrade}
        >
          <Text style={[styles.learnMoreText, { color: colors.primary }]}> 
            Learn more about premium features
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Inline premium badge component
export const PremiumBadge: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'small' 
}) => {
  const theme = useTheme();
  const colors = theme.theme.colors;
  const { isPremium } = usePremium();

  if (!isPremium) return null;

  const sizes = {
    small: { container: 20, icon: 12, padding: 4 },
    medium: { container: 28, icon: 16, padding: 6 },
    large: { container: 36, icon: 20, padding: 8 },
  };

  const sizeConfig = sizes[size];

  return (
    <View style={[styles.badge, { backgroundColor: colors.premium, width: sizeConfig.container, height: sizeConfig.container }]}> 
      <Ionicons name="star" size={sizeConfig.icon} color="#000" />
    </View>
  );
};

// Inline premium indicator for list items
export const PremiumIndicator: React.FC<{ text?: string }> = ({ text = 'Premium' }) => {
  const themeCtx = useTheme();
  const colors = themeCtx.theme.colors;
  
  return (
    <View style={[styles.indicator, { backgroundColor: colors.primary + '20' }]}> 
      <Ionicons name="sparkles" size={12} color={colors.primary} />
      <Text style={[styles.indicatorText, { color: colors.primary }]}> 
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreButton: {
    paddingVertical: 8,
  },
  learnMoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  badge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

// Lightweight placeholder for PremiumAnalytics used in tests
export const PremiumAnalytics: React.FC = () => {
  return <></>;
};