// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch, RootState } from '../../store/store';
import { createFamily } from '../../store/slices/familySlice';
import { ROLE_PRESETS } from '../../constants/rolePresets';
import PremiumBadge from '../../components/premium/PremiumBadge';
import { createFamilySchema, sanitizeFamilyName, validateData } from '../../utils/validation';
import i18n from '../../i18n';

const CreateFamilyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  
  const [familyName, setFamilyName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('family');
  const [customParentLabel, setCustomParentLabel] = useState('');
  const [customChildLabel, setCustomChildLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const isPremium = userProfile?.isPremium || false;

  const validateForm = useCallback(async () => {
    const sanitized = sanitizeFamilyName(familyName);
    const { isValid, errors, data } = await validateData(createFamilySchema, { name: sanitized });
    if (!isValid) {
      setError(errors.name || 'Invalid family name');
      return { ok: false };
    }
    setError('');
    return { ok: true, name: data?.name || sanitized };
  }, [familyName]);

  const handleCreateFamily = useCallback(async () => {
    const validation = await validateForm();
    if (!validation.ok) return;
    
    // Validate custom labels if custom preset is selected
    if (selectedPreset === 'custom' && isPremium) {
      if (!customParentLabel.trim() || !customChildLabel.trim()) {
        setError('Please enter both custom role labels');
        return;
      }
    }
    
    setIsCreating(true);
    try {
      // Prepare roleConfig based on selection
      let roleConfig;
      if (selectedPreset === 'custom' && isPremium) {
        roleConfig = {
          preset: 'custom' as const,
          adminLabel: customParentLabel.trim(),
          memberLabel: customChildLabel.trim(),
          adminPlural: customParentLabel.trim() + 's', // Simple pluralization
          memberPlural: customChildLabel.trim() + 's',
        };
      } else {
        const preset = ROLE_PRESETS[selectedPreset];
        roleConfig = {
          preset: selectedPreset as 'family' | 'roommates' | 'team',
          adminLabel: preset.adminLabel,
          memberLabel: preset.memberLabel,
          adminPlural: preset.adminPlural,
          memberPlural: preset.memberPlural,
        };
      }
      
      await dispatch(createFamily({
        userId: userProfile?.id || '',
        name: validation.name,
        isPremium: isPremium,
        roleConfig,
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
  }, [familyName, isPremium, userProfile, dispatch, navigation, validateForm, selectedPreset, customParentLabel, customChildLabel]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="create-family-screen"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
          >
            <Feather name="arrow-left" size={24} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{i18n.t('screens.createFamily.title')}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="home" size={48} color={isDarkMode ? theme.colors.info : theme.colors.primary} />
          </View>
          
          <Text style={styles.description}>
            {i18n.t('screens.createFamily.description')}
          </Text>

          <View style={styles.inputContainer}>
            <Input
              label={i18n.t('screens.createFamily.familyNameLabel')}
              value={familyName}
              onChangeText={(text) => {
                setFamilyName(sanitizeFamilyName(text));
                setError('');
              }}
              placeholder="Enter your family name"
              maxLength={50}
              error={error}
              testID="family-name-input"
            />
          </View>

          <View style={styles.roleSection}>
            <Text style={styles.sectionTitle}>Choose Role Labels</Text>
            <Text style={styles.sectionDescription}>
              Select how you want to label family roles
            </Text>
            
            <View style={styles.presetOptions}>
              {Object.entries(ROLE_PRESETS).map(([key, preset]) => {
                const isCustom = key === 'custom';
                const isSelected = selectedPreset === key;
                const isDisabled = isCustom && !isPremium;
                
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetOption,
                      isSelected && styles.presetOptionSelected,
                      isDisabled && styles.presetOptionDisabled,
                    ]}
                    onPress={() => !isDisabled && setSelectedPreset(key)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                  >
                    <View style={styles.presetHeader}>
                      <Text style={[
                        styles.presetName,
                        isSelected && styles.presetNameSelected,
                        isDisabled && styles.presetNameDisabled,
                      ]}>
                        {preset.name}
                      </Text>
                      {isCustom && !isPremium && <PremiumBadge size="small" />}
                    </View>
                    <Text style={[
                      styles.presetLabels,
                      isDisabled && styles.presetLabelsDisabled,
                    ]}>
                      {isCustom ? 'Set your own labels' : `${preset.adminLabel} / ${preset.memberLabel}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedPreset === 'custom' && isPremium && (
              <View style={styles.customInputs}>
                <Input
                  label="Manager Role Label"
                  value={customParentLabel}
                  onChangeText={setCustomParentLabel}
                  placeholder="e.g., Admin, Leader, Manager"
                  maxLength={20}
                />
                <Input
                  label="Member Role Label"
                  value={customChildLabel}
                  onChangeText={setCustomChildLabel}
                  placeholder="e.g., Member, Participant, User"
                  maxLength={20}
                />
              </View>
            )}
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
              title={i18n.t('common.cancel')}
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
              disabled={isCreating}
              testID="cancel-button"
            />
            <Button
              title={isCreating ? 'Creating...' : i18n.t('screens.createFamily.createButton')}
              onPress={handleCreateFamily}
              style={styles.actionButton}
              loading={isCreating}
              disabled={isCreating}
              testID="create-button"
              returnKeyType="done"
            />
          </View>
        </Card>

        <View style={styles.infoSection}>
          <Feather name="info" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            As the family creator, you'll be set as a {
              selectedPreset === 'custom' && customParentLabel
                ? customParentLabel
                : ROLE_PRESETS[selectedPreset]?.adminLabel || 'parent'
            } with full management permissions.
          </Text>
        </View>
      </ScrollView>
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
    padding: theme.spacing.XL,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.primary + '10',
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
    color: theme.colors.textPrimary,
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
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.info + '10',
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.S,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  roleSection: {
    marginBottom: theme.spacing.L,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XS,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.M,
  },
  presetOptions: {
    gap: theme.spacing.S,
  },
  presetOption: {
    padding: theme.spacing.M,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  presetOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: isDarkMode ? theme.colors.primary + '20' : theme.colors.primary + '10',
  },
  presetOptionDisabled: {
    opacity: 0.6,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.XS,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  presetNameSelected: {
    color: theme.colors.primary,
  },
  presetNameDisabled: {
    color: theme.colors.textSecondary,
  },
  presetLabels: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  presetLabelsDisabled: {
    color: theme.colors.textTertiary,
  },
  customInputs: {
    marginTop: theme.spacing.M,
    gap: theme.spacing.M,
  },
});

export default CreateFamilyScreen;