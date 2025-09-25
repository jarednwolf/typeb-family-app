import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
// Lazy require to avoid types error when type-checking without RN types
const DateTimePicker: any = require('@react-native-community/datetimepicker').default || require('@react-native-community/datetimepicker');
import { Feather } from '@expo/vector-icons';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { theme as lightTheme } from '../../constants/theme';

interface ReminderTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
  currentMinutes: number;
  title?: string;
}

interface PresetOption {
  label: string;
  minutes: number;
  description?: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  { label: 'At time of task', minutes: 0, description: 'No advance reminder' },
  { label: '5 minutes before', minutes: 5 },
  { label: '10 minutes before', minutes: 10 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440, description: 'Same time, day before' },
  { label: 'Custom time', minutes: -1, description: 'Set your own reminder time' },
];

const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  visible,
  onClose,
  onSave,
  currentMinutes,
  title = 'Set Reminder Time',
}) => {
  const { theme, isDarkMode } = useTheme();
  const [selectedMinutes, setSelectedMinutes] = useState(currentMinutes);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customHours, setCustomHours] = useState(Math.floor(currentMinutes / 60));
  const [customMinutes, setCustomMinutes] = useState(currentMinutes % 60);
  const [tempDate, setTempDate] = useState(new Date());

  const handlePresetSelect = useCallback((minutes: number) => {
    if (minutes === -1) {
      // Show custom picker
      setShowCustomPicker(true);
    } else {
      setSelectedMinutes(minutes);
      setShowCustomPicker(false);
    }
  }, []);

  const handleCustomTimeChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCustomPicker(false);
    }
    
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      setCustomHours(hours);
      setCustomMinutes(minutes);
      setSelectedMinutes(totalMinutes);
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave(selectedMinutes);
    onClose();
  }, [selectedMinutes, onSave, onClose]);

  const formatCustomTime = useCallback((totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
    } else if (hours < 24) {
      const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
      const minuteText = minutes > 0 ? ` ${minutes} min` : '';
      return `${hourText}${minuteText} before`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      const dayText = days === 1 ? '1 day' : `${days} days`;
      const hourText = remainingHours > 0 ? ` ${remainingHours}h` : '';
      return `${dayText}${hourText} before`;
    }
  }, []);

  const isPresetSelected = (minutes: number) => {
    if (minutes === -1) {
      // Custom option is selected if current value doesn't match any preset
      return !PRESET_OPTIONS.some(opt => opt.minutes === selectedMinutes && opt.minutes !== -1);
    }
    return selectedMinutes === minutes;
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Quick Options
        </Text>
        
        <View style={styles.presetGrid}>
          {PRESET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.presetOption,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isPresetSelected(option.minutes) 
                    ? theme.colors.primary 
                    : theme.colors.separator,
                  borderWidth: isPresetSelected(option.minutes) ? 2 : 1,
                },
              ]}
              onPress={() => handlePresetSelect(option.minutes)}
              activeOpacity={0.7}
            >
              {isPresetSelected(option.minutes) && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Feather name="check" size={12} color={theme.colors.white} />
                </View>
              )}
              
              <Text style={[
                styles.presetLabel,
                { 
                  color: isPresetSelected(option.minutes) 
                    ? theme.colors.primary 
                    : theme.colors.textPrimary 
                }
              ]}>
                {option.label}
              </Text>
              
              {option.description && (
                <Text style={[styles.presetDescription, { color: theme.colors.textTertiary }]}>
                  {option.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {showCustomPicker && (
          <View style={[styles.customPickerContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.customPickerTitle, { color: theme.colors.textPrimary }]}>
              Set Custom Reminder Time
            </Text>
            
            <View style={styles.pickerWrapper}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={handleCustomTimeChange}
                  textColor={theme.colors.textPrimary}
                  style={styles.iosPicker}
                />
              ) : (
                <View style={styles.androidPickerContainer}>
                  <TouchableOpacity
                    style={[styles.androidPickerButton, { 
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.separator 
                    }]}
                    onPress={() => setShowCustomPicker(true)}
                  >
                    <Feather name="clock" size={20} color={theme.colors.primary} />
                    <Text style={[styles.androidPickerText, { color: theme.colors.textPrimary }]}>
                      {formatCustomTime(selectedMinutes)}
                    </Text>
                  </TouchableOpacity>
                  
                  {showCustomPicker && (
                    <DateTimePicker
                      value={tempDate}
                      mode="time"
                      display="default"
                      onChange={handleCustomTimeChange}
                    />
                  )}
                </View>
              )}
            </View>
            
            <Text style={[styles.customTimeDisplay, { color: theme.colors.textSecondary }]}>
              Reminder will be sent {formatCustomTime(selectedMinutes)}
            </Text>
          </View>
        )}

        <View style={styles.currentSelection}>
          <Feather name="bell" size={20} color={theme.colors.primary} />
          <Text style={[styles.currentSelectionText, { color: theme.colors.textPrimary }]}>
            Current: {selectedMinutes === 0 ? 'At time of task' : formatCustomTime(selectedMinutes)}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Save"
            onPress={handleSave}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: lightTheme.spacing.M,
    marginLeft: lightTheme.spacing.XS,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -lightTheme.spacing.XS,
    marginBottom: lightTheme.spacing.L,
  },
  presetOption: {
    width: '48%',
    margin: '1%',
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: lightTheme.spacing.S,
    right: lightTheme.spacing.S,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  customPickerContainer: {
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    marginBottom: lightTheme.spacing.L,
  },
  customPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: lightTheme.spacing.M,
    textAlign: 'center',
  },
  pickerWrapper: {
    marginBottom: lightTheme.spacing.M,
  },
  iosPicker: {
    height: 150,
  },
  androidPickerContainer: {
    alignItems: 'center',
  },
  androidPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: lightTheme.spacing.M,
    borderRadius: lightTheme.borderRadius.medium,
    borderWidth: 1,
    gap: lightTheme.spacing.M,
  },
  androidPickerText: {
    fontSize: 16,
  },
  customTimeDisplay: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: lightTheme.spacing.M,
    gap: lightTheme.spacing.S,
    marginBottom: lightTheme.spacing.L,
  },
  currentSelectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.M,
  },
  button: {
    flex: 1,
  },
});

export default ReminderTimePicker;