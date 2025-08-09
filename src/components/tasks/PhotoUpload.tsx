import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadTaskPhoto } from '../../services/storage';
import Button from '../common/Button';

interface PhotoUploadProps {
  taskId: string;
  onPhotoUploaded: (photoUrl: string) => void;
  onCancel?: () => void;
  required?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  taskId,
  onPhotoUploaded,
  onCancel,
  required = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const styles = React.useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const requestPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to upload photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };

    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedImage) {
      if (required) {
        Alert.alert('Photo Required', 'Please select a photo to complete this task.');
        return;
      }
      onPhotoUploaded('');
      return;
    }

    setIsUploading(true);
    try {
      const photoUrl = await uploadTaskPhoto(taskId, selectedImage);
      onPhotoUploaded(photoUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedImage, taskId, onPhotoUploaded, required]);

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {required ? 'Photo Required' : 'Add Photo (Optional)'}
        </Text>
        {required && (
          <Text style={styles.subtitle}>
            Upload a photo to prove task completion
          </Text>
        )}
      </View>

      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveImage}
            disabled={isUploading}
          >
            <Feather name="x-circle" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('camera')}
            activeOpacity={0.8}
          >
            <View style={styles.uploadIconContainer}>
              <Feather name="camera" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.uploadButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('library')}
            activeOpacity={0.8}
          >
            <View style={styles.uploadIconContainer}>
              <Feather name="image" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.uploadButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        {onCancel && (
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={styles.actionButton}
            disabled={isUploading}
          />
        )}
        <Button
          title={isUploading ? 'Uploading...' : 'Complete Task'}
          onPress={handleUpload}
          style={styles.actionButton}
          loading={isUploading}
          disabled={isUploading}
        />
      </View>

      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.uploadingText}>Uploading photo...</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.L,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.XS,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.L,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.backgroundTexture,
  },
  removeButton: {
    position: 'absolute',
    top: theme.spacing.S,
    right: theme.spacing.S,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: theme.borderRadius.round,
    padding: theme.spacing.XS,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.XL,
  },
  uploadButton: {
    alignItems: 'center',
    padding: theme.spacing.M,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.S,
  },
  uploadButtonText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.M,
  },
  actionButton: {
    flex: 1,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: theme.spacing.M,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});

export default PhotoUpload;