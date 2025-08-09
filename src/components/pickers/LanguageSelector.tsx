import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { theme as lightTheme } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  currentLanguage,
  onLanguageChange,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = useCallback((languageCode: string) => {
    setSelectedLanguage(languageCode);
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedLanguage !== currentLanguage) {
      // Save language preference
      await AsyncStorage.setItem('appLanguage', selectedLanguage);
      
      // Show restart prompt
      Alert.alert(
        'Language Changed',
        'The app needs to restart to apply the new language. Would you like to restart now?',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              onLanguageChange(selectedLanguage);
              onClose();
            },
          },
          {
            text: 'Restart',
            onPress: () => {
              onLanguageChange(selectedLanguage);
              onClose();
              // In a real app, you would restart the app here
              // For React Native, you might use react-native-restart
              console.log('App would restart here');
            },
          },
        ]
      );
    } else {
      onClose();
    }
  }, [selectedLanguage, currentLanguage, onLanguageChange, onClose]);

  const renderLanguageItem = (language: Language) => {
    const isSelected = selectedLanguage === language.code;
    
    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageItem,
          {
            backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.separator,
          },
        ]}
        onPress={() => handleLanguageSelect(language.code)}
        activeOpacity={0.7}
      >
        <View style={styles.languageContent}>
          <Text style={styles.flag}>{language.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[styles.languageName, { color: theme.colors.textPrimary }]}>
              {language.name}
            </Text>
            <Text style={[styles.languageNativeName, { color: theme.colors.textSecondary }]}>
              {language.nativeName}
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
            <Feather name="check" size={14} color={theme.colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select Language"
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { 
          backgroundColor: theme.colors.inputBackground,
          borderColor: theme.colors.separator 
        }]}>
          <Feather name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search languages..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Language List */}
        <ScrollView 
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
        >
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map(renderLanguageItem)
          ) : (
            <View style={styles.emptyState}>
              <Feather name="globe" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No languages found
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Current Selection Info */}
        <View style={[styles.currentInfo, { backgroundColor: theme.colors.surface }]}>
          <Feather name="info" size={16} color={theme.colors.info} />
          <Text style={[styles.currentInfoText, { color: theme.colors.textSecondary }]}>
            Current language: {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Apply"
            onPress={handleSave}
            style={styles.button}
            disabled={selectedLanguage === currentLanguage}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    borderWidth: 1,
    marginBottom: lightTheme.spacing.M,
    gap: lightTheme.spacing.S,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  languageList: {
    maxHeight: 300,
    marginBottom: lightTheme.spacing.M,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    borderWidth: 1,
    marginBottom: lightTheme.spacing.S,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: lightTheme.spacing.M,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: lightTheme.spacing.XXL,
  },
  emptyText: {
    fontSize: 16,
    marginTop: lightTheme.spacing.M,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    marginBottom: lightTheme.spacing.L,
    gap: lightTheme.spacing.S,
  },
  currentInfoText: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.M,
  },
  button: {
    flex: 1,
  },
});

// Add missing import
import { TextInput } from 'react-native';

export default LanguageSelector;