/**
 * Sound Service
 * Manages all sound effects and audio feedback
 * Focus: Positive reinforcement through pleasant sounds
 *
 * Note: This is a simplified version that simulates sound playback
 * In production, you would integrate with expo-av or react-native-sound
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type SoundType = 
  | 'achievement_unlock'
  | 'task_complete'
  | 'streak_continue'
  | 'celebration'
  | 'encouragement'
  | 'notification'
  | 'button_tap'
  | 'success'
  | 'gentle_reminder'
  | 'family_milestone';

interface SoundConfig {
  file: string;
  volume: number;
  rate?: number;
  shouldLoop?: boolean;
}

// Sound configuration mapping
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  achievement_unlock: {
    file: 'achievement_unlock.mp3',
    volume: 0.8,
  },
  task_complete: {
    file: 'task_complete.mp3',
    volume: 0.6,
  },
  streak_continue: {
    file: 'streak_fire.mp3',
    volume: 0.7,
  },
  celebration: {
    file: 'celebration.mp3',
    volume: 0.9,
  },
  encouragement: {
    file: 'encouragement.mp3',
    volume: 0.5,
  },
  notification: {
    file: 'gentle_notification.mp3',
    volume: 0.4,
  },
  button_tap: {
    file: 'soft_tap.mp3',
    volume: 0.3,
  },
  success: {
    file: 'success_chime.mp3',
    volume: 0.6,
  },
  gentle_reminder: {
    file: 'gentle_bell.mp3',
    volume: 0.4,
  },
  family_milestone: {
    file: 'family_celebration.mp3',
    volume: 0.8,
  },
};

// Simulated Sound interface for development
interface Sound {
  playAsync: () => Promise<void>;
  stopAsync: () => Promise<void>;
  setStatusAsync: (status: any) => Promise<void>;
  unloadAsync: () => Promise<void>;
  setVolumeAsync: (volume: number) => Promise<void>;
}

class SoundService {
  private sounds: Map<SoundType, Sound> = new Map();
  private soundEnabled: boolean = true;
  private masterVolume: number = 1.0;
  private isInitialized: boolean = false;
  private loadingPromises: Map<SoundType, Promise<void>> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load sound preferences
      const [soundEnabled, masterVolume] = await Promise.all([
        AsyncStorage.getItem('soundEnabled'),
        AsyncStorage.getItem('masterVolume'),
      ]);

      this.soundEnabled = soundEnabled !== 'false';
      this.masterVolume = masterVolume ? parseFloat(masterVolume) : 1.0;

      // In production, configure audio mode here
      // await Audio.setAudioModeAsync({ ... });

      // Preload essential sounds
      await this.preloadEssentialSounds();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing sound service:', error);
      this.soundEnabled = false;
    }
  }

  private async preloadEssentialSounds() {
    const essentialSounds: SoundType[] = [
      'button_tap',
      'task_complete',
      'success',
      'notification',
    ];

    await Promise.all(
      essentialSounds.map(soundType => this.loadSound(soundType))
    );
  }

  private async loadSound(soundType: SoundType): Promise<void> {
    // Check if already loading
    if (this.loadingPromises.has(soundType)) {
      return this.loadingPromises.get(soundType);
    }

    // Check if already loaded
    if (this.sounds.has(soundType)) {
      return;
    }

    const loadPromise = this.loadSoundAsync(soundType);
    this.loadingPromises.set(soundType, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(soundType);
    }
  }

  private async loadSoundAsync(soundType: SoundType): Promise<void> {
    const config = SOUND_CONFIGS[soundType];
    if (!config) {
      console.warn(`No sound config found for ${soundType}`);
      return;
    }

    try {
      // Create a simulated sound object for development
      const sound: Sound = {
        playAsync: async () => {
          if (this.soundEnabled) {
            console.log(`🔊 Playing sound: ${soundType}`);
            // In production, actual sound playback would happen here
          }
        },
        stopAsync: async () => {
          console.log(`🔇 Stopping sound: ${soundType}`);
        },
        setStatusAsync: async (status: any) => {
          console.log(`⚙️ Setting status for ${soundType}:`, status);
        },
        unloadAsync: async () => {
          console.log(`📦 Unloading sound: ${soundType}`);
        },
        setVolumeAsync: async (volume: number) => {
          console.log(`🔊 Setting volume for ${soundType}: ${volume}`);
        },
      };

      this.sounds.set(soundType, sound);
    } catch (error) {
      console.error(`Error loading sound ${soundType}:`, error);
    }
  }

  private getSoundFile(filename: string): any {
    // In a real app, these would be actual sound file imports
    // For now, returning a placeholder
    try {
      // This would be replaced with actual sound file imports like:
      // return require(`../assets/sounds/${filename}`);
      
      // Placeholder for development
      return { uri: `https://example.com/sounds/${filename}` };
    } catch (error) {
      console.error(`Sound file not found: ${filename}`);
      return null;
    }
  }

  /**
   * Play a sound effect
   */
  async play(soundType: SoundType, options?: { volume?: number; rate?: number }) {
    if (!this.soundEnabled || !this.isInitialized) {
      return;
    }

    try {
      // Load sound if not already loaded
      await this.loadSound(soundType);

      const sound = this.sounds.get(soundType);
      if (!sound) {
        return;
      }

      // Configure sound with options
      if (options) {
        const config = SOUND_CONFIGS[soundType];
        await sound.setStatusAsync({
          volume: (options.volume || config.volume) * this.masterVolume,
          rate: options.rate || config.rate || 1.0,
        });
      }

      // Stop any previous playback and replay from start
      await sound.stopAsync();
      await sound.playAsync();
    } catch (error) {
      console.error(`Error playing sound ${soundType}:`, error);
    }
  }

  /**
   * Play a sequence of sounds
   */
  async playSequence(soundTypes: SoundType[], delay: number = 200) {
    for (const soundType of soundTypes) {
      await this.play(soundType);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Stop a specific sound
   */
  async stop(soundType: SoundType) {
    const sound = this.sounds.get(soundType);
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error(`Error stopping sound ${soundType}:`, error);
      }
    }
  }

  /**
   * Stop all sounds
   */
  async stopAll() {
    const stopPromises = Array.from(this.sounds.values()).map(sound =>
      sound.stopAsync().catch((error: any) =>
        console.error('Error stopping sound:', error)
      )
    );
    await Promise.all(stopPromises);
  }

  /**
   * Enable or disable sounds
   */
  async setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    await AsyncStorage.setItem('soundEnabled', enabled.toString());
    
    if (!enabled) {
      await this.stopAll();
    }
  }

  /**
   * Set master volume
   */
  async setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    await AsyncStorage.setItem('masterVolume', this.masterVolume.toString());
    
    // Update volume for all loaded sounds
    for (const [soundType, sound] of this.sounds.entries()) {
      const config = SOUND_CONFIGS[soundType];
      try {
        await sound.setVolumeAsync(config.volume * this.masterVolume);
      } catch (error) {
        console.error(`Error updating volume for ${soundType}:`, error);
      }
    }
  }

  /**
   * Get current sound settings
   */
  getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      masterVolume: this.masterVolume,
    };
  }

  /**
   * Unload all sounds and clean up
   */
  async cleanup() {
    const unloadPromises = Array.from(this.sounds.values()).map(sound =>
      sound.unloadAsync().catch((error: any) =>
        console.error('Error unloading sound:', error)
      )
    );
    await Promise.all(unloadPromises);
    this.sounds.clear();
    this.loadingPromises.clear();
    this.isInitialized = false;
  }

  /**
   * Play contextual sound based on action
   */
  async playContextual(context: 'task_complete' | 'achievement' | 'streak' | 'family', value?: number) {
    switch (context) {
      case 'task_complete':
        await this.play('task_complete');
        break;
      
      case 'achievement':
        await this.playSequence(['success', 'achievement_unlock']);
        break;
      
      case 'streak':
        if (value && value > 0) {
          if (value % 7 === 0) {
            // Weekly milestone
            await this.play('celebration');
          } else if (value % 30 === 0) {
            // Monthly milestone
            await this.playSequence(['celebration', 'achievement_unlock']);
          } else {
            await this.play('streak_continue');
          }
        }
        break;
      
      case 'family':
        await this.play('family_milestone');
        break;
    }
  }

  /**
   * Preload sounds for an upcoming screen
   */
  async preloadForScreen(screen: 'dashboard' | 'tasks' | 'achievements' | 'family') {
    const screenSounds: Record<string, SoundType[]> = {
      dashboard: ['button_tap', 'notification'],
      tasks: ['task_complete', 'success', 'button_tap'],
      achievements: ['achievement_unlock', 'celebration', 'button_tap'],
      family: ['family_milestone', 'encouragement', 'button_tap'],
    };

    const soundsToLoad = screenSounds[screen] || [];
    await Promise.all(soundsToLoad.map(soundType => this.loadSound(soundType)));
  }
}

// Singleton instance
export const soundService = new SoundService();

// Helper hook for React components
export const useSoundEffects = () => {
  const play = (soundType: SoundType) => soundService.play(soundType);
  const playContextual = (context: Parameters<typeof soundService.playContextual>[0], value?: number) => 
    soundService.playContextual(context, value);
  const settings = soundService.getSettings();
  
  return {
    play,
    playContextual,
    settings,
    setSoundEnabled: (enabled: boolean) => soundService.setSoundEnabled(enabled),
    setMasterVolume: (volume: number) => soundService.setMasterVolume(volume),
  };
};