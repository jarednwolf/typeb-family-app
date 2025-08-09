/**
 * Storage service for handling file uploads
 * Manages photo uploads for task validation
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a photo for task validation
 * @param taskId - The task ID this photo is for
 * @param imageUri - The local URI of the image to upload
 * @returns The download URL of the uploaded photo
 */
export const uploadTaskPhoto = async (
  taskId: string,
  imageUri: string
): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `tasks/${taskId}/validation_${timestamp}.jpg`;

    // Create storage reference
    const storageRef = ref(storage, filename);

    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        taskId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return downloadUrl;
  } catch (error) {
    console.error('Error uploading task photo:', error);
    throw new Error('Failed to upload photo. Please try again.');
  }
};

/**
 * Delete a task photo from storage
 * @param photoUrl - The URL of the photo to delete
 */
export const deleteTaskPhoto = async (photoUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    // Firebase Storage URLs have the path after '/o/' and before '?'
    const matches = photoUrl.match(/\/o\/(.+?)\?/);
    if (!matches || !matches[1]) {
      throw new Error('Invalid photo URL');
    }

    // Decode the path (it's URL encoded)
    const path = decodeURIComponent(matches[1]);

    // Create reference and delete
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting task photo:', error);
    // Don't throw here as the photo might already be deleted
  }
};

/**
 * Upload a user avatar photo
 * @param userId - The user ID
 * @param imageUri - The local URI of the image to upload
 * @returns The download URL of the uploaded avatar
 */
export const uploadUserAvatar = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create filename for avatar (overwrites existing)
    const filename = `avatars/${userId}/avatar.jpg`;

    // Create storage reference
    const storageRef = ref(storage, filename);

    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return downloadUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar. Please try again.');
  }
};

/**
 * Get a signed URL for temporary access to a photo
 * Useful for sharing photos without permanent public access
 * @param path - The storage path of the file
 * @returns A temporary signed URL
 */
export const getSignedUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw new Error('Failed to get photo URL');
  }
};

/**
 * Validate image file before upload
 * @param imageUri - The local URI of the image
 * @returns True if valid, throws error if not
 */
export const validateImage = async (imageUri: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (blob.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!validTypes.includes(blob.type)) {
      throw new Error('Invalid image format. Please use JPEG, PNG, or HEIC');
    }

    return true;
  } catch (error: any) {
    console.error('Image validation error:', error);
    throw new Error(error.message || 'Invalid image file');
  }
};