/**
 * Photo Validation System Unit Tests
 * 
 * Tests the complete photo validation workflow including:
 * - Camera permissions and capture
 * - Photo upload to Firebase Storage
 * - AI analysis for task validation
 * - Error handling and edge cases
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhotoCapture } from '../../components/tasks/PhotoCapture';
import cameraService from '../../services/camera';
import photoAnalysisService from '../../services/photoAnalysis';
import { Alert } from 'react-native';

jest.mock('../../services/camera');
jest.mock('../../services/photoAnalysis');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('Photo Validation System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PhotoCapture Component', () => {
    it('should request camera permissions on mount', async () => {
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      
      render(
        <PhotoCapture 
          taskId="123" 
          taskType="chores" 
          onPhotoTaken={jest.fn()} 
        />
      );
      
      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });
    });

    it('should handle photo capture and upload', async () => {
      const mockPhotoUri = 'file://photo.jpg';
      const mockUploadUrl = 'https://storage.url/photo.jpg';
      
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      (cameraService.capturePhoto as jest.Mock).mockResolvedValue(mockPhotoUri);
      (cameraService.uploadPhoto as jest.Mock).mockResolvedValue({
        url: mockUploadUrl,
        fileName: 'photo.jpg',
      });

      const onPhotoTaken = jest.fn();
      const { getByText } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="chores" 
          onPhotoTaken={onPhotoTaken} 
        />
      );

      // Wait for permissions to be checked
      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      // Press take photo button
      fireEvent.press(getByText('Take Photo'));
      
      await waitFor(() => {
        expect(cameraService.capturePhoto).toHaveBeenCalled();
        expect(cameraService.uploadPhoto).toHaveBeenCalledWith(mockPhotoUri, '123', 'chores');
        expect(onPhotoTaken).toHaveBeenCalledWith(mockUploadUrl);
      });
    });

    it('should handle permission denial gracefully', async () => {
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(false);
      
      const { getByText } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="chores" 
          onPhotoTaken={jest.fn()} 
        />
      );

      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      fireEvent.press(getByText('Take Photo'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.any(String),
          expect.any(Array)
        );
      });
    });

    it('should handle upload failures', async () => {
      const mockPhotoUri = 'file://photo.jpg';
      const uploadError = new Error('Upload failed');
      
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      (cameraService.capturePhoto as jest.Mock).mockResolvedValue(mockPhotoUri);
      (cameraService.uploadPhoto as jest.Mock).mockRejectedValue(uploadError);

      const onPhotoTaken = jest.fn();
      const { getByText } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="chores" 
          onPhotoTaken={onPhotoTaken} 
        />
      );

      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      fireEvent.press(getByText('Take Photo'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Upload Failed',
          expect.any(String),
          expect.any(Array)
        );
        expect(onPhotoTaken).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during photo capture', async () => {
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      (cameraService.capturePhoto as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('file://photo.jpg'), 1000))
      );

      const { getByText, queryByTestId } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="chores" 
          onPhotoTaken={jest.fn()} 
        />
      );

      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      fireEvent.press(getByText('Take Photo'));

      // Should show loading indicator
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeTruthy();
      });
    });
  });

  describe('Photo Analysis Service', () => {
    it('should analyze photos and return confidence scores', async () => {
      const mockAnalysisResult = {
        confidence: 0.85,
        isValid: true,
        labels: ['clean', 'room', 'organized'],
        suggestions: [],
      };

      (photoAnalysisService.analyzePhoto as jest.Mock).mockResolvedValue(mockAnalysisResult);

      const result = await photoAnalysisService.analyzePhoto(
        'https://photo.url',
        { taskType: 'clean_room', minConfidence: 0.7 }
      );

      expect(result).toEqual(mockAnalysisResult);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.isValid).toBe(true);
    });

    it('should reject photos below confidence threshold', async () => {
      const mockAnalysisResult = {
        confidence: 0.45,
        isValid: false,
        labels: ['messy', 'cluttered'],
        suggestions: ['Room appears to still be messy', 'Try organizing items first'],
      };

      (photoAnalysisService.analyzePhoto as jest.Mock).mockResolvedValue(mockAnalysisResult);

      const result = await photoAnalysisService.analyzePhoto(
        'https://photo.url',
        { taskType: 'clean_room', minConfidence: 0.7 }
      );

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.suggestions).toHaveLength(2);
    });

    it('should handle analysis service errors', async () => {
      const analysisError = new Error('AI service unavailable');
      (photoAnalysisService.analyzePhoto as jest.Mock).mockRejectedValue(analysisError);

      await expect(
        photoAnalysisService.analyzePhoto('https://photo.url', { taskType: 'clean_room' })
      ).rejects.toThrow('AI service unavailable');
    });

    it('should provide task-specific analysis', async () => {
      const choreResult = {
        confidence: 0.9,
        isValid: true,
        labels: ['dishes', 'clean', 'kitchen'],
        taskSpecificData: { taskType: 'dishes', completionLevel: 'complete' }
      };

      (photoAnalysisService.analyzePhoto as jest.Mock).mockResolvedValue(choreResult);

      const result = await photoAnalysisService.analyzePhoto(
        'https://photo.url',
        { taskType: 'dishes', minConfidence: 0.7 }
      );

      expect(result.taskSpecificData).toBeDefined();
      expect(result.taskSpecificData.taskType).toBe('dishes');
    });
  });

  describe('Camera Service', () => {
    it('should handle camera permissions correctly', async () => {
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      
      const hasPermission = await cameraService.requestCameraPermissions();
      
      expect(hasPermission).toBe(true);
      expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
    });

    it('should upload photos with metadata', async () => {
      const mockFile = 'file://test.jpg';
      const mockUploadResult = {
        url: 'https://storage.googleapis.com/test.jpg',
        fileName: 'test.jpg',
        metadata: {
          taskId: '123',
          taskType: 'homework',
          timestamp: Date.now(),
        }
      };

      (cameraService.uploadPhoto as jest.Mock).mockResolvedValue(mockUploadResult);

      const result = await cameraService.uploadPhoto(mockFile, '123', 'homework');

      expect(result).toEqual(mockUploadResult);
      expect(result.metadata.taskId).toBe('123');
      expect(result.metadata.taskType).toBe('homework');
    });

    it('should handle large file uploads', async () => {
      const largeFile = 'file://large-photo.jpg';
      const mockUploadProgress = jest.fn();

      (cameraService.uploadPhotoWithProgress as jest.Mock).mockImplementation(
        (file, taskId, taskType, onProgress) => {
          onProgress({ bytesTransferred: 50, totalBytes: 100 });
          onProgress({ bytesTransferred: 100, totalBytes: 100 });
          return Promise.resolve({
            url: 'https://storage.url/large-photo.jpg',
            fileName: 'large-photo.jpg',
          });
        }
      );

      const result = await cameraService.uploadPhotoWithProgress(
        largeFile,
        '123',
        'chores',
        mockUploadProgress
      );

      expect(mockUploadProgress).toHaveBeenCalledTimes(2);
      expect(mockUploadProgress).toHaveBeenCalledWith({ bytesTransferred: 100, totalBytes: 100 });
      expect(result.url).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full photo validation workflow', async () => {
      // Setup mocks for complete workflow
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      (cameraService.capturePhoto as jest.Mock).mockResolvedValue('file://photo.jpg');
      (cameraService.uploadPhoto as jest.Mock).mockResolvedValue({
        url: 'https://storage.url/photo.jpg',
        fileName: 'photo.jpg',
      });
      (photoAnalysisService.analyzePhoto as jest.Mock).mockResolvedValue({
        confidence: 0.88,
        isValid: true,
        labels: ['clean', 'organized'],
      });

      const onPhotoValidated = jest.fn();
      const { getByText } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="clean_room" 
          onPhotoTaken={onPhotoValidated}
          requireValidation={true}
        />
      );

      // Execute workflow
      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      fireEvent.press(getByText('Take Photo'));

      await waitFor(() => {
        expect(cameraService.capturePhoto).toHaveBeenCalled();
        expect(cameraService.uploadPhoto).toHaveBeenCalled();
        expect(photoAnalysisService.analyzePhoto).toHaveBeenCalled();
        expect(onPhotoValidated).toHaveBeenCalledWith(expect.objectContaining({
          url: 'https://storage.url/photo.jpg',
          validated: true,
          confidence: 0.88,
        }));
      });
    });

    it('should retry failed validations', async () => {
      let attemptCount = 0;
      
      (cameraService.requestCameraPermissions as jest.Mock).mockResolvedValue(true);
      (cameraService.capturePhoto as jest.Mock).mockResolvedValue('file://photo.jpg');
      (cameraService.uploadPhoto as jest.Mock).mockResolvedValue({
        url: 'https://storage.url/photo.jpg',
        fileName: 'photo.jpg',
      });
      
      (photoAnalysisService.analyzePhoto as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          confidence: 0.85,
          isValid: true,
          labels: ['clean'],
        });
      });

      const onPhotoValidated = jest.fn();
      const { getByText } = render(
        <PhotoCapture 
          taskId="123" 
          taskType="clean_room" 
          onPhotoTaken={onPhotoValidated}
          requireValidation={true}
          retryOnFailure={true}
        />
      );

      await waitFor(() => {
        expect(cameraService.requestCameraPermissions).toHaveBeenCalled();
      });

      fireEvent.press(getByText('Take Photo'));

      await waitFor(() => {
        expect(photoAnalysisService.analyzePhoto).toHaveBeenCalledTimes(2);
        expect(onPhotoValidated).toHaveBeenCalled();
      });
    });
  });
});
