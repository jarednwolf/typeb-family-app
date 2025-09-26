import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import { firestore } from '../config/firebase';

interface TaskMetadata {
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  device?: {
    model: string;
    os: string;
    appVersion: string;
  };
  photo?: {
    width: number;
    height: number;
    uri: string;
    exif?: any;
  };
  verificationData?: {
    capturedAt: Date;
    submittedAt: Date;
    timeTaken: number; // seconds
    retakeCount: number;
  };
}

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

class TaskMetadataService {
  private locationPermissionGranted: boolean = false;
  private lastKnownLocation: LocationData | null = null;

  /**
   * Initialize the service and request permissions
   */
  async initialize() {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermissionGranted = status === 'granted';
      
      if (this.locationPermissionGranted) {
        // Get initial location
        await this.updateCurrentLocation();
        
        // Start watching location (with low frequency to save battery)
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000, // Update every minute
            distanceInterval: 100, // Or every 100 meters
          },
          (location) => {
            this.lastKnownLocation = location;
          }
        );
      }
    } catch (error) {
      console.error('Failed to initialize metadata service:', error);
    }
  }

  /**
   * Capture metadata when taking a photo
   */
  async capturePhotoMetadata(
    photoUri: string,
    taskId: string,
    retakeCount: number = 0
  ): Promise<TaskMetadata> {
    const captureStartTime = new Date();
    
    try {
      // Get photo information
      const photoInfo = await ImageManipulator.manipulateAsync(
        photoUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Get reverse geocoding (address from coordinates)
      let address: string | undefined;
      if (location) {
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (geocode && geocode.length > 0) {
            const addr = geocode[0];
            address = [
              addr.name,
              addr.street,
              addr.city,
              addr.region,
            ].filter(Boolean).join(', ');
          }
        } catch (error) {
          console.error('Failed to reverse geocode:', error);
        }
      }
      
      // Build metadata object
      const metadata: TaskMetadata = {
        timestamp: captureStartTime,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          address,
        } : undefined,
        device: await this.getDeviceInfo(),
        photo: {
          width: photoInfo.width,
          height: photoInfo.height,
          uri: photoInfo.uri,
        },
        verificationData: {
          capturedAt: captureStartTime,
          submittedAt: new Date(),
          timeTaken: (Date.now() - captureStartTime.getTime()) / 1000,
          retakeCount,
        },
      };
      
      // Store metadata with the task
      await this.storeTaskMetadata(taskId, metadata);
      
      return metadata;
    } catch (error) {
      console.error('Failed to capture photo metadata:', error);
      // Return basic metadata even if some parts fail
      return {
        timestamp: captureStartTime,
        verificationData: {
          capturedAt: captureStartTime,
          submittedAt: new Date(),
          timeTaken: 0,
          retakeCount,
        },
      };
    }
  }

  /**
   * Get current location
   */
  private async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.locationPermissionGranted) {
      return this.lastKnownLocation;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      this.lastKnownLocation = location;
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return this.lastKnownLocation;
    }
  }

  /**
   * Update current location in background
   */
  private async updateCurrentLocation() {
    try {
      this.lastKnownLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo() {
    // This would use expo-device in a real implementation
    return {
      model: 'iPhone', // Device.modelName
      os: 'iOS', // Device.osName
      appVersion: '1.0.0', // Constants.manifest.version
    };
  }

  /**
   * Store task metadata in Firestore
   */
  private async storeTaskMetadata(taskId: string, metadata: TaskMetadata) {
    try {
      await firestore()
        .collection('taskMetadata')
        .doc(taskId)
        .set({
          ...metadata,
          timestamp: metadata.timestamp.toISOString(),
          verificationData: metadata.verificationData ? {
            ...metadata.verificationData,
            capturedAt: metadata.verificationData.capturedAt.toISOString(),
            submittedAt: metadata.verificationData.submittedAt.toISOString(),
          } : undefined,
        });
    } catch (error) {
      console.error('Failed to store task metadata:', error);
    }
  }

  /**
   * Validate photo metadata for authenticity
   */
  async validatePhotoAuthenticity(metadata: TaskMetadata): Promise<{
    isValid: boolean;
    concerns: string[];
    confidence: number;
  }> {
    const concerns: string[] = [];
    let confidenceScore = 100;
    
    // Check if photo was taken recently
    const timeSinceCapture = Date.now() - metadata.timestamp.getTime();
    if (timeSinceCapture > 5 * 60 * 1000) { // More than 5 minutes old
      concerns.push('Photo was not taken recently');
      confidenceScore -= 20;
    }
    
    // Check if location is available and accurate
    if (!metadata.location) {
      concerns.push('Location data not available');
      confidenceScore -= 15;
    } else if (metadata.location.accuracy && metadata.location.accuracy > 50) {
      concerns.push('Location accuracy is low');
      confidenceScore -= 10;
    }
    
    // Check for suspicious patterns
    if (metadata.verificationData) {
      if (metadata.verificationData.retakeCount > 5) {
        concerns.push('Multiple retakes detected');
        confidenceScore -= 15;
      }
      
      if (metadata.verificationData.timeTaken < 2) {
        concerns.push('Photo taken too quickly');
        confidenceScore -= 10;
      }
    }
    
    return {
      isValid: confidenceScore >= 60,
      concerns,
      confidence: Math.max(0, confidenceScore),
    };
  }

  /**
   * Get task completion patterns based on location
   */
  async getLocationPatterns(childId: string): Promise<{
    commonLocations: Array<{
      address: string;
      count: number;
      tasks: string[];
    }>;
    unusualLocations: Array<{
      address: string;
      timestamp: Date;
      taskId: string;
    }>;
  }> {
    try {
      // Query metadata for this child's completed tasks
      const snapshot = await firestore()
        .collection('taskMetadata')
        .where('userId', '==', childId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      const locationMap = new Map<string, {
        count: number;
        tasks: Set<string>;
      }>();
      
      const allLocations: Array<{
        address: string;
        timestamp: Date;
        taskId: string;
      }> = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.address) {
          const existing = locationMap.get(data.location.address) || {
            count: 0,
            tasks: new Set(),
          };
          existing.count++;
          existing.tasks.add(doc.id);
          locationMap.set(data.location.address, existing);
          
          allLocations.push({
            address: data.location.address,
            timestamp: new Date(data.timestamp),
            taskId: doc.id,
          });
        }
      });
      
      // Identify common locations (3+ occurrences)
      const commonLocations = Array.from(locationMap.entries())
        .filter(([_, data]) => data.count >= 3)
        .map(([address, data]) => ({
          address,
          count: data.count,
          tasks: Array.from(data.tasks),
        }))
        .sort((a, b) => b.count - a.count);
      
      // Identify unusual locations (only 1 occurrence)
      const unusualLocations = allLocations.filter(
        loc => locationMap.get(loc.address)?.count === 1
      );
      
      return {
        commonLocations,
        unusualLocations,
      };
    } catch (error) {
      console.error('Failed to get location patterns:', error);
      return {
        commonLocations: [],
        unusualLocations: [],
      };
    }
  }

  /**
   * Calculate trust score based on metadata history
   */
  async calculateTrustScore(childId: string): Promise<{
    score: number;
    factors: {
      locationConsistency: number;
      timeConsistency: number;
      photoQuality: number;
      completionPatterns: number;
    };
  }> {
    try {
      // Get recent metadata
      const snapshot = await firestore()
        .collection('taskMetadata')
        .where('userId', '==', childId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      let locationConsistency = 100;
      let timeConsistency = 100;
      let photoQuality = 100;
      let completionPatterns = 100;
      
      const metadata: TaskMetadata[] = [];
      snapshot.forEach((doc) => {
        metadata.push(doc.data() as TaskMetadata);
      });
      
      if (metadata.length > 0) {
        // Check location consistency
        const locationsWithData = metadata.filter(m => m.location).length;
        locationConsistency = (locationsWithData / metadata.length) * 100;
        
        // Check time consistency (tasks completed at reasonable times)
        const reasonableHours = metadata.filter(m => {
          const hour = new Date(m.timestamp).getHours();
          return hour >= 6 && hour <= 22; // Between 6 AM and 10 PM
        }).length;
        timeConsistency = (reasonableHours / metadata.length) * 100;
        
        // Check photo quality (retakes and time taken)
        const goodPhotos = metadata.filter(m => 
          m.verificationData && 
          m.verificationData.retakeCount <= 2 &&
          m.verificationData.timeTaken >= 3
        ).length;
        photoQuality = (goodPhotos / metadata.length) * 100;
        
        // Check completion patterns (variety in locations and times)
        const uniqueHours = new Set(metadata.map(m => 
          new Date(m.timestamp).getHours()
        )).size;
        const uniqueLocations = new Set(metadata.map(m => 
          m.location?.address
        ).filter(Boolean)).size;
        
        completionPatterns = Math.min(100, 
          (uniqueHours / 12) * 50 + // Max 12 different hours
          (uniqueLocations / 5) * 50  // Max 5 different locations
        );
      }
      
      const overallScore = (
        locationConsistency * 0.25 +
        timeConsistency * 0.25 +
        photoQuality * 0.25 +
        completionPatterns * 0.25
      );
      
      return {
        score: Math.round(overallScore),
        factors: {
          locationConsistency: Math.round(locationConsistency),
          timeConsistency: Math.round(timeConsistency),
          photoQuality: Math.round(photoQuality),
          completionPatterns: Math.round(completionPatterns),
        },
      };
    } catch (error) {
      console.error('Failed to calculate trust score:', error);
      return {
        score: 50,
        factors: {
          locationConsistency: 50,
          timeConsistency: 50,
          photoQuality: 50,
          completionPatterns: 50,
        },
      };
    }
  }

  /**
   * Get metadata summary for parent insights
   */
  async getMetadataSummary(familyId: string, days: number = 7): Promise<{
    totalTasks: number;
    tasksWithLocation: number;
    averageCompletionTime: number;
    commonCompletionHours: number[];
    suspiciousPatterns: string[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const snapshot = await firestore()
        .collection('taskMetadata')
        .where('familyId', '==', familyId)
        .where('timestamp', '>=', startDate.toISOString())
        .get();
      
      let totalTasks = 0;
      let tasksWithLocation = 0;
      let totalCompletionTime = 0;
      const completionHours: number[] = [];
      const suspiciousPatterns: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalTasks++;
        
        if (data.location) {
          tasksWithLocation++;
        }
        
        if (data.verificationData?.timeTaken) {
          totalCompletionTime += data.verificationData.timeTaken;
        }
        
        const hour = new Date(data.timestamp).getHours();
        completionHours.push(hour);
        
        // Check for suspicious patterns
        if (data.verificationData?.retakeCount > 5) {
          suspiciousPatterns.push(`Task ${doc.id}: Excessive retakes (${data.verificationData.retakeCount})`);
        }
        
        if (data.verificationData?.timeTaken < 2) {
          suspiciousPatterns.push(`Task ${doc.id}: Completed too quickly`);
        }
        
        if (hour < 6 || hour > 23) {
          suspiciousPatterns.push(`Task ${doc.id}: Completed at unusual hour (${hour}:00)`);
        }
      });
      
      // Find most common completion hours
      const hourCounts = completionHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const commonHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
      
      return {
        totalTasks,
        tasksWithLocation,
        averageCompletionTime: totalTasks > 0 ? totalCompletionTime / totalTasks : 0,
        commonCompletionHours: commonHours,
        suspiciousPatterns: suspiciousPatterns.slice(0, 5), // Limit to 5 most recent
      };
    } catch (error) {
      console.error('Failed to get metadata summary:', error);
      return {
        totalTasks: 0,
        tasksWithLocation: 0,
        averageCompletionTime: 0,
        commonCompletionHours: [],
        suspiciousPatterns: [],
      };
    }
  }
}

// Export singleton instance
export const taskMetadataService = new TaskMetadataService();