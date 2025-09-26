import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

type Props = {
  taskId: string;
  taskType: string;
  onPhotoTaken: (result: any) => void;
  requireValidation?: boolean;
  retryOnFailure?: boolean;
  existingPhotoUrl?: string | null;
};

const PhotoCaptureMock: React.FC<Props> = ({
  taskId,
  taskType,
  onPhotoTaken,
  requireValidation = false,
  retryOnFailure = false,
}) => {
  const cameraService = require('src/services/camera').default;
  const photoAnalysisService = require('src/services/photoAnalysis').default;
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const granted = await cameraService.requestCameraPermissions();
        setHasPermission(!!granted);
      } catch {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleTakePhoto = async () => {
    if (!hasPermission) {
      Alert.alert('Camera Permission Required', 'Please enable camera access in Settings', [{ text: 'OK' }]);
      return;
    }
    setIsUploading(true);
    try {
      const uri = await cameraService.capturePhoto();
      const upload = await cameraService.uploadPhoto(uri, taskId, taskType);

      if (!requireValidation) {
        onPhotoTaken(upload.url);
      } else {
        let attempt = 0;
        while (true) {
          try {
            const analysis = await photoAnalysisService.analyzePhoto(upload.url, { taskType });
            onPhotoTaken({ url: upload.url, validated: !!analysis.isValid, confidence: analysis.confidence });
            break;
          } catch (e) {
            if (retryOnFailure && attempt === 0) {
              attempt++;
              continue;
            }
            throw e;
          }
        }
      }
    } catch (e) {
      Alert.alert('Upload Failed', 'We could not upload your photo. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View>
      {isUploading && (
        <ActivityIndicator testID="loading-indicator" />
      )}
      <TouchableOpacity onPress={handleTakePhoto}>
        <Text>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

export const PhotoCapture = PhotoCaptureMock;
export default PhotoCaptureMock;

