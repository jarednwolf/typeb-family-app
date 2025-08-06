import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { theme } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import { createFamily } from '../../store/slices/familySlice';

const CreateFamilyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [familyName, setFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const validateForm = useCallback(() => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return false;
    }
    if (familyName.length < 2) {
      setError('Family name must be at least 2 characters');
      return false;
    }
    if (familyName.length > 50) {
      setError('Family name must be less than 50 characters');
      return false;
    }
    setError('');
    return true;
  }, [familyName]);

  const handleCreateFamily = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsCreating(true);
    try {
      await dispatch(createFamily({
        name: familyName.trim(),
        userId: currentUser?.uid || '',
      })).unwrap();
      
      Alert.alert(
        'Success!', 
        'Your family has been created. Share the invite code with family members.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Failed to Create Family',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  }, [familyName, currentUser, dispatch, navigation, validateForm]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
          >
            <Feather name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Family</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="home" size={48} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.description}>
            Create a new family group to start managing tasks together
          </Text>

          <View style={styles.inputContainer}>
            <Input
              label="Family Name"
              value={familyName}
              onChangeText={(text) => {
                setFamilyName(text);
                setError('');
              }}
              placeholder="Enter your family name"
              maxLength={50}
              error={error}
              testID="family-name-input"
            />
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Feather name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Manage tasks together</Text>
            </View>
            <View style={styles.feature}>
              <Feather name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Track family progress</Text>
            </View>
            <View style={styles.feature}>
              <Feather name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Assign responsibilities</Text>
            </View>
            <View style={styles.feature}>
              <Feather name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Celebrate achievements</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
              disabled={isCreating}
              testID="cancel-button"
            />
            <Button
              title={isCreating ? 'Creating...' : 'Create Family'}
              onPress={handleCreateFamily}
              style={styles.actionButton}
              loading={isCreating}
              disabled={isCreating}
              testID="create-button"
            />
          </View>
        </Card>

        <View style={styles.infoSection}>
          <Feather name="info" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            As the family creator, you'll be set as a parent with full management permissions.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.L,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.XL,
  },
  backButton: {
    padding: theme.spacing.S,
    marginRight: theme.spacing.M,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  card: {
    padding: theme.spacing.XL,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.L,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.XL,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: theme.spacing.L,
  },
  features: {
    marginBottom: theme.spacing.XL,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
    marginBottom: theme.spacing.M,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.M,
  },
  actionButton: {
    flex: 1,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.XL,
    padding: theme.spacing.M,
    backgroundColor: theme.colors.info + '10',
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.S,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default CreateFamilyScreen;