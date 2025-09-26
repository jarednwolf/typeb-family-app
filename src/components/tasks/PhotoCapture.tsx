import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import cameraService from '../../services/camera';
import photoAnalysisService from '../../services/photoAnalysis';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/userSlice';
import { selectActiveFamily } from '../../store/slices/familySlice';
import * as Haptics from 'expo-haptics';

interface PhotoCaptureProps {
  taskId: string;
  taskType: string;
  onPhotoTaken: (photoUrl: string) => void;
  onAnalysisComplete?: (result: any) => void;
  requireValidation?: boolean;
  existingPhotoUrl?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  taskId,
  taskType,
  onPhotoTaken,
  onAnalysisComplete,
  requireValidation = true,
  existingPhotoUrl,
}) => {
  const theme = useTheme();
  const colors = theme.theme.colors;
  const currentUser = useSelector(selectCurrentUser);
  const activeFamily = useSelector(selectActiveFamily);
  
  const [photoUri, setPhotoUri] = useState<string | null>(existingPhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleTakePhoto = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const uri = await cameraService.capturePhoto();
      
      if (uri) {
        setPhotoUri(uri);
        setShowPreview(true);
        
        if (requireValidation) {
          await analyzePhoto(uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Camera Error',
        'Unable to take photo. Please check camera permissions.',
        [{ text: 'OK' }]
      );
    }
  }, [requireValidation]);

  const handleSelectPhoto = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const uri = await cameraService.selectPhoto();
      
      if (uri) {
        setPhotoUri(uri);
        setShowPreview(true);
        
        if (requireValidation) {
          await analyzePhoto(uri);
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert(
        'Error',
        'Unable to select photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [requireValidation]);

  const analyzePhoto = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      // First upload the photo
      const uploadResult = await cameraService.uploadPhoto(
        uri,
        taskId,
        currentUser?.uid || '',
        activeFamily?.id || ''
      );

      // Then analyze it
      const validationResult = await photoAnalysisService.validateTaskPhoto(
        uploadResult.url,
        taskId,
        taskType
      );

      setAnalysisResult(validationResult);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(validationResult);
      }

      if (!validationResult.isValid && requireValidation) {
        Alert.alert(
          'Photo Review',
          validationResult.feedback,
          [
            { text: 'Retake', onPress: handleRetake },
            { text: 'Submit Anyway', onPress: () => handleSubmit(uploadResult.url) },
          ]
        );
      } else {
        handleSubmit(uploadResult.url);
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to analyze photo. You can still submit it for review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => handleSubmit(uri) },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (uri: string) => {
    setIsUploading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      let photoUrl = uri;
      
      // If it's a local URI, upload it
      if (!uri.startsWith('http')) {
        const uploadResult = await cameraService.uploadPhoto(
          uri,
          taskId,
          currentUser?.uid || '',
          activeFamily?.id || ''
        );
        photoUrl = uploadResult.url;
      }
      
      onPhotoTaken(photoUrl);
      setShowPreview(false);
    } catch (error) {
      console.error('Error submitting photo:', error);
      Alert.alert(
        'Upload Error',
        'Unable to upload photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setAnalysisResult(null);
    setShowPreview(false);
    handleTakePhoto();
  };

  const renderPhotoOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: colors.primary }]}
        onPress={handleTakePhoto}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={32} color="#FFFFFF" />
        <Text style={[styles.optionText, { color: '#FFFFFF' }]}>
          Take Photo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: colors.surface }]}
        onPress={handleSelectPhoto}
        activeOpacity={0.8}
      >
        <Ionicons name="images" size={32} color={colors.textPrimary} />
        <Text style={[styles.optionText, { color: colors.textPrimary }]}>
          Choose Photo
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      onRequestClose={() => setShowPreview(false)}
    >
      <View style={[styles.previewContainer, { backgroundColor: colors.background }]}> 
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
            Review Photo
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        )}

        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.textPrimary }]}>
              Analyzing photo...
            </Text>
          </View>
        )}

        {analysisResult && !isAnalyzing && (
          <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidenceLabel, { color: colors.textPrimary }]}>
                Confidence:
              </Text>
              <Text
                style={[
                  styles.confidenceValue,
                  {
                    color: analysisResult.confidence > 0.7
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {Math.round(analysisResult.confidence * 100)}%
              </Text>
            </View>
            <Text style={[styles.feedbackText, { color: colors.textPrimary }]}>
              {analysisResult.feedback}
            </Text>
          </View>
        )}

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleRetake}
          >
            <Ionicons name="refresh" size={20} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
              Retake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.submitButton,
              { 
                backgroundColor: colors.primary,
                opacity: isUploading ? 0.7 : 1,
              },
            ]}
            onPress={() => handleSubmit(photoUri!)}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  Submit
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {existingPhotoUrl ? (
        <TouchableOpacity
          style={[styles.photoContainer, { backgroundColor: colors.surface }]}
          onPress={() => setShowPreview(true)}
        >
          <Image source={{ uri: existingPhotoUrl }} style={styles.thumbnail} />
          <TouchableOpacity
            style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
            <Text style={styles.changePhotoText}>Change</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        renderPhotoOptions()
      )}

      {renderPreview()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  thumbnail: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 0.75,
    borderRadius: 8,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewImage: {
    width: screenWidth,
    height: screenWidth * 0.75,
    resizeMode: 'contain',
  },
  analyzingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
  },
  analysisCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  submitButton: {
    flex: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});
