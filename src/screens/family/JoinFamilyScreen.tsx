import React, { useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch, RootState } from '../../store/store';
import { joinFamily } from '../../store/slices/familySlice';

const JoinFamilyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const validateCode = useCallback(() => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return false;
    }
    if (inviteCode.length !== 6) {
      setError('Invite code must be 6 characters');
      return false;
    }
    setError('');
    return true;
  }, [inviteCode]);

  const handleJoinFamily = useCallback(async () => {
    if (!validateCode()) return;
    
    setIsJoining(true);
    try {
      await dispatch(joinFamily({
        inviteCode: inviteCode.toUpperCase(),
        userId: userProfile?.id || '',
      })).unwrap();
      
      Alert.alert('Success', 'You have joined the family!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      // Check if it's a capacity error and show upgrade option
      if (error.message?.includes('maximum capacity')) {
        Alert.alert(
          'Family is Full',
          'This family has reached its member limit. Ask a family manager to upgrade to premium for more member slots.',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'View Premium',
              onPress: () => navigation.navigate('Premium' as never)
            }
          ]
        );
      } else {
        Alert.alert(
          'Failed to Join',
          error.message || 'Invalid invite code or code has expired'
        );
      }
    } finally {
      setIsJoining(false);
    }
  }, [inviteCode, userProfile, dispatch, navigation, validateCode]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="join-family-screen"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
          >
            <Feather name="arrow-left" size={24} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Join a Family</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="users" size={48} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
          </View>
          
          <Text style={styles.description}>
            Enter the 6-character invite code shared by your family member
          </Text>

          <View style={styles.inputContainer}>
            <Input
              label="Invite Code"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setError('');
              }}
              placeholder="XXXXXX"
              maxLength={6}
              autoCapitalize="characters"
              error={error}
              testID="invite-code-input"
              style={styles.codeInput}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
              disabled={isJoining}
              testID="cancel-button"
            />
            <Button
              title={isJoining ? 'Joining...' : 'Join Family'}
              onPress={handleJoinFamily}
              style={styles.actionButton}
              loading={isJoining}
              disabled={isJoining}
              testID="join-button"
            />
          </View>
        </Card>

        <View style={styles.helpSection}>
          <Feather name="info" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.helpText}>
            Ask a parent in your family for the invite code. They can find it in the Family tab.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
    color: theme.colors.textPrimary,
  },
  card: {
    alignItems: 'center',
    padding: theme.spacing.XL,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    marginBottom: theme.spacing.XL,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.M,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.XL,
    padding: theme.spacing.M,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.info + '10',
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.S,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default JoinFamilyScreen;