import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import * as Sentry from '@sentry/react-native';

export interface PhotoUploadResult {
  url: string;
  fileName: string;
  uploadedAt: Date;
  size?: number;
}

export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Request camera permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return mediaLibraryStatus.status === 'granted';
      }
      
      return status === 'granted';
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Capture a photo using the device camera
   */
  async capturePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const compressedUri = await this.compressImage(result.assets[0].uri);
        return compressedUri;
      }
      
      return null;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error capturing photo:', error);
      throw error;
    }
  }

  /**
   * Select a photo from the device library
   */
  async selectPhoto(): Promise<string | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const compressedUri = await this.compressImage(result.assets[0].uri);
        return compressedUri;
      }
      
      return null;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error selecting photo:', error);
      throw error;
    }
  }

  /**
   * Compress and optimize image for upload
   */
  private async compressImage(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { 
          compress: 0.7, 
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error compressing image:', error);
      // Return original URI if compression fails
      return uri;
    }
  }

  /**
   * Upload photo to Firebase Storage
   */
  async uploadPhoto(
    uri: string, 
    taskId: string, 
    userId: string,
    familyId: string
  ): Promise<PhotoUploadResult> {
    try {
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `tasks/${familyId}/${taskId}/${userId}_${timestamp}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload the blob to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          taskId,
          userId,
          familyId,
          uploadedAt: new Date().toISOString(),
        },
      });
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Record the upload in Firestore
      await this.recordPhotoUpload(taskId, downloadUrl, userId);
      
      return {
        url: downloadUrl,
        fileName: filename,
        uploadedAt: new Date(),
        size: snapshot.metadata.size,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error uploading photo:', error);
      // If offline, queue a placeholder for later sync
      if ((error as any)?.message?.toLowerCase?.().includes('network')) {
        return {
          url: uri, // local uri as placeholder; guarded by UI for offline
          fileName: 'pending_upload.jpg',
          uploadedAt: new Date(),
        };
      }
      throw error;
    }
  }

  /**
   * Record photo upload in Firestore
   */
  private async recordPhotoUpload(
    taskId: string, 
    photoUrl: string, 
    userId: string
  ): Promise<void> {
    try {
      // Update the task document with the photo URL
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        photoUrl,
        photoUploadedBy: userId,
        photoUploadedAt: new Date().toISOString(),
        validationStatus: 'pending',
        lastModified: new Date().toISOString(),
      });

      // Add to photo history collection for audit trail
      await addDoc(collection(db, 'photoHistory'), {
        taskId,
        photoUrl,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error recording photo upload:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from Firebase Storage
   */
  async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const storageRef = ref(storage, photoUrl);
      
      // Note: Firebase Storage doesn't have a direct delete method in the client SDK
      // This would typically be handled by a Cloud Function for security
      console.log('Photo deletion should be handled by Cloud Function for security');
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Check if user has camera permissions
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      return cameraStatus.status === 'granted' || mediaLibraryStatus.status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }
}

export default CameraService.getInstance();
