import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { theme } from '../../constants/theme';

type SetupOption = 'create' | 'join' | null;

const FamilySetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState<SetupOption>(null);

  const handleContinue = useCallback(() => {
    if (selectedOption === 'create') {
      navigation.navigate('CreateFamily' as never);
    } else if (selectedOption === 'join') {
      navigation.navigate('JoinFamily' as never);
    }
  }, [selectedOption, navigation]);

  const handleSkip = useCallback(() => {
    // Navigate to main app without family
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Let's Get Started!</Text>
        <Text style={styles.subtitle}>
          Would you like to create a new family or join an existing one?
        </Text>
      </View>

      <View style={styles.options}>
        {/* Create Family Option */}
        <TouchableOpacity
          onPress={() => setSelectedOption('create')}
          activeOpacity={0.8}
          testID="create-option"
        >
          <Card style={[
            styles.optionCard,
            selectedOption === 'create' && styles.selectedCard,
          ]}>
            <View style={[
              styles.iconContainer,
              selectedOption === 'create' && styles.selectedIcon,
            ]}>
              <Feather 
                name="plus-circle" 
                size={48} 
                color={selectedOption === 'create' ? theme.colors.surface : theme.colors.primary} 
              />
            </View>
            <Text style={[
              styles.optionTitle,
              selectedOption === 'create' && styles.selectedText,
            ]}>
              Create a Family
            </Text>
            <Text style={[
              styles.optionDescription,
              selectedOption === 'create' && styles.selectedDescription,
            ]}>
              Start fresh and invite your family members
            </Text>
            {selectedOption === 'create' && (
              <View style={styles.checkmark}>
                <Feather name="check" size={20} color={theme.colors.surface} />
              </View>
            )}
          </Card>
        </TouchableOpacity>

        {/* Join Family Option */}
        <TouchableOpacity
          onPress={() => setSelectedOption('join')}
          activeOpacity={0.8}
          testID="join-option"
        >
          <Card style={[
            styles.optionCard,
            selectedOption === 'join' && styles.selectedCard,
          ]}>
            <View style={[
              styles.iconContainer,
              selectedOption === 'join' && styles.selectedIcon,
            ]}>
              <Feather 
                name="user-plus" 
                size={48} 
                color={selectedOption === 'join' ? theme.colors.surface : theme.colors.primary} 
              />
            </View>
            <Text style={[
              styles.optionTitle,
              selectedOption === 'join' && styles.selectedText,
            ]}>
              Join a Family
            </Text>
            <Text style={[
              styles.optionDescription,
              selectedOption === 'join' && styles.selectedDescription,
            ]}>
              Enter an invite code from a family member
            </Text>
            {selectedOption === 'join' && (
              <View style={styles.checkmark}>
                <Feather name="check" size={20} color={theme.colors.surface} />
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedOption}
          style={styles.continueButton}
          testID="continue-button"
        />
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          testID="skip-button"
        >
          <Text style={styles.skipText}>I'll do this later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.L,
  },
  header: {
    marginTop: theme.spacing.XXL,
    marginBottom: theme.spacing.XXL,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.M,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  options: {
    flex: 1,
    gap: theme.spacing.L,
  },
  optionCard: {
    padding: theme.spacing.L,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.M,
  },
  selectedIcon: {
    backgroundColor: theme.colors.surface + '20',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.S,
  },
  selectedText: {
    color: theme.colors.surface,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedDescription: {
    color: theme.colors.surface + '90',
  },
  checkmark: {
    position: 'absolute',
    top: theme.spacing.M,
    right: theme.spacing.M,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: theme.spacing.XL,
  },
  continueButton: {
    width: '100%',
    marginBottom: theme.spacing.M,
  },
  skipButton: {
    alignItems: 'center',
    padding: theme.spacing.M,
  },
  skipText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default FamilySetupScreen;