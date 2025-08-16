/**
 * Sound Settings Component
 * Allows users to control sound effects and volume
 * Part of the positive reinforcement system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { soundService, useSoundEffects } from '../../services/soundService';
import { useHaptics } from '../../utils/haptics';

interface SoundSettingsProps {
  onSettingsChange?: (settings: { soundEnabled: boolean; volume: number }) => void;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ onSettingsChange }) => {
  const haptics = useHaptics();
  const { settings, setSoundEnabled, setMasterVolume, play } = useSoundEffects();
  const [localSoundEnabled, setLocalSoundEnabled] = useState(settings.soundEnabled);
  const [localVolume, setLocalVolume] = useState(settings.masterVolume);
  const [isTestingSound, setIsTestingSound] = useState(false);

  useEffect(() => {
    setLocalSoundEnabled(settings.soundEnabled);
    setLocalVolume(settings.masterVolume);
  }, [settings]);

  const handleSoundToggle = async (value: boolean) => {
    haptics.selection();
    setLocalSoundEnabled(value);
    await setSoundEnabled(value);
    
    if (value) {
      // Play a confirmation sound when enabling
      await play('success');
    }
    
    onSettingsChange?.({ soundEnabled: value, volume: localVolume });
  };

  const handleVolumeChange = (value: number) => {
    setLocalVolume(value);
  };

  const handleVolumeChangeEnd = async (value: number) => {
    haptics.selection();
    await setMasterVolume(value);
    onSettingsChange?.({ soundEnabled: localSoundEnabled, volume: value });
  };

  const testSound = async () => {
    if (!localSoundEnabled) {
      Alert.alert(
        'Sounds Disabled',
        'Enable sounds to test them',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsTestingSound(true);
    haptics.selection();
    
    // Play a sequence of test sounds
    await play('button_tap');
    setTimeout(() => play('success'), 300);
    setTimeout(() => play('task_complete'), 600);
    setTimeout(() => setIsTestingSound(false), 1000);
  };

  const getVolumeIcon = () => {
    if (!localSoundEnabled || localVolume === 0) return 'volume-off';
    if (localVolume < 0.33) return 'volume-low';
    if (localVolume < 0.66) return 'volume-medium';
    return 'volume-high';
  };

  const getVolumePercentage = () => {
    return Math.round(localVolume * 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sound Effects</Text>
      
      {/* Sound Enable/Disable */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <MaterialCommunityIcons
            name={localSoundEnabled ? 'music' : 'music-off'}
            size={24}
            color={localSoundEnabled ? theme.colors.primary : theme.colors.textTertiary}
          />
          <View style={styles.textContainer}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDescription}>
              Play celebratory sounds for achievements and task completion
            </Text>
          </View>
        </View>
        <Switch
          value={localSoundEnabled}
          onValueChange={handleSoundToggle}
          trackColor={{
            false: theme.colors.inputBackground,
            true: theme.colors.primary,
          }}
          thumbColor={localSoundEnabled ? theme.colors.primary : theme.colors.textTertiary}
        />
      </View>

      {/* Volume Control */}
      {localSoundEnabled && (
        <View style={styles.volumeSection}>
          <View style={styles.volumeHeader}>
            <MaterialCommunityIcons
              name={getVolumeIcon()}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.volumeLabel}>Volume</Text>
            <Text style={styles.volumePercentage}>{getVolumePercentage()}%</Text>
          </View>
          
          <CustomSlider
            value={localVolume}
            onValueChange={handleVolumeChange}
            onSlidingComplete={handleVolumeChangeEnd}
          />
          
          <View style={styles.volumeLabels}>
            <Text style={styles.volumeLabelText}>Silent</Text>
            <Text style={styles.volumeLabelText}>Max</Text>
          </View>
        </View>
      )}

      {/* Test Sound Button */}
      {localSoundEnabled && (
        <TouchableOpacity
          style={[styles.testButton, isTestingSound && styles.testButtonActive]}
          onPress={testSound}
          disabled={isTestingSound}
        >
          <MaterialCommunityIcons
            name="play-circle"
            size={20}
            color={theme.colors.white}
          />
          <Text style={styles.testButtonText}>
            {isTestingSound ? 'Playing...' : 'Test Sounds'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Sound Presets */}
      {localSoundEnabled && (
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>Quick Presets</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                handleVolumeChange(0.3);
                handleVolumeChangeEnd(0.3);
              }}
            >
              <MaterialCommunityIcons
                name="volume-low"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.presetText}>Quiet</Text>
              <Text style={styles.presetValue}>30%</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                handleVolumeChange(0.6);
                handleVolumeChangeEnd(0.6);
              }}
            >
              <MaterialCommunityIcons
                name="volume-medium"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.presetText}>Normal</Text>
              <Text style={styles.presetValue}>60%</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                handleVolumeChange(1.0);
                handleVolumeChangeEnd(1.0);
              }}
            >
              <MaterialCommunityIcons
                name="volume-high"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.presetText}>Loud</Text>
              <Text style={styles.presetValue}>100%</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons
          name="information"
          size={16}
          color={theme.colors.info}
        />
        <Text style={styles.infoText}>
          Sound effects provide positive reinforcement and celebrate your achievements. 
          They're designed to be pleasant and encouraging, not distracting.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.M,
    marginVertical: theme.spacing.S,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.M,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.M,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.M,
  },
  textContainer: {
    flex: 1,
    marginLeft: theme.spacing.S,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  volumeSection: {
    marginTop: theme.spacing.M,
    paddingTop: theme.spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.S,
  },
  volumeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
    flex: 1,
  },
  volumePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -theme.spacing.XS,
  },
  volumeLabelText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: theme.spacing.S,
    paddingHorizontal: theme.spacing.M,
    marginTop: theme.spacing.M,
  },
  testButtonActive: {
    backgroundColor: theme.colors.success,
  },
  testButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.XS,
  },
  presetsSection: {
    marginTop: theme.spacing.M,
    paddingTop: theme.spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.S,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    paddingVertical: theme.spacing.S,
    marginHorizontal: theme.spacing.XXS,
  },
  presetText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  presetValue: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.info}20`,
    borderRadius: 12,
    padding: theme.spacing.S,
    marginTop: theme.spacing.M,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.XS,
    lineHeight: 18,
  },
});

// Custom Slider Component (replacement for @react-native-community/slider)
const CustomSlider: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
}> = ({ value, onValueChange, onSlidingComplete }) => {
  const [width, setWidth] = React.useState(0);
  const [currentValue, setCurrentValue] = React.useState(value);
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = Math.max(0, Math.min(1, touchX / width));
        setCurrentValue(newValue);
        onValueChange(newValue);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = Math.max(0, Math.min(1, touchX / width));
        setCurrentValue(newValue);
        onValueChange(newValue);
      },
      onPanResponderRelease: () => {
        onSlidingComplete(currentValue);
      },
    })
  ).current;

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <View
      style={customSliderStyles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={customSliderStyles.track}>
        <View
          style={[
            customSliderStyles.filledTrack,
            { width: `${currentValue * 100}%` },
          ]}
        />
      </View>
      <View
        style={[
          customSliderStyles.thumb,
          {
            left: `${currentValue * 100}%`,
            transform: [{ translateX: -10 }],
          },
        ]}
      />
    </View>
  );
};

const customSliderStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 2,
  },
  filledTrack: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default SoundSettings;