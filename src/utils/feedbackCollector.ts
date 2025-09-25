import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { analyticsService } from '../services/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';

export interface Feedback {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'bug' | 'feature' | 'improvement' | 'praise' | 'other';
  category: 'ui' | 'performance' | 'crash' | 'functionality' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  deviceInfo?: DeviceInfo;
  screenshots?: string[];
  metadata?: Record<string, any>;
  status: 'new' | 'reviewing' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt?: Date;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize?: string;
  networkType?: string;
  batteryLevel?: number;
}

export interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  avgResponseTime?: number;
  satisfactionScore?: number;
}

class FeedbackCollector {
  private currentUser: any = null;
  private deviceInfo: DeviceInfo | null = null;
  private feedbackQueue: Feedback[] = [];
  private isOnline: boolean = true;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    // Get current user
    auth().onAuthStateChanged(user => {
      this.currentUser = user;
    });
    
    // Collect device info
    this.deviceInfo = await this.collectDeviceInfo();
    
    // Process queued feedback when online
    this.processQueuedFeedback();
  }
  
  private async collectDeviceInfo(): Promise<DeviceInfo> {
    try {
      const { default: DeviceInfo } = await import('react-native-device-info');
      
      return {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: DeviceInfo.getVersion(),
        deviceModel: await DeviceInfo.getModel(),
        screenSize: `${DeviceInfo.getDeviceWidth()}x${DeviceInfo.getDeviceHeight()}`,
        networkType: await DeviceInfo.getCarrier(),
        batteryLevel: await DeviceInfo.getBatteryLevel(),
      };
    } catch (error) {
      console.error('Failed to collect device info:', error);
      return {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0',
        deviceModel: 'Unknown',
      };
    }
  }
  
  // Submit feedback
  async submitFeedback(
    type: Feedback['type'],
    message: string,
    options?: {
      category?: Feedback['category'];
      severity?: Feedback['severity'];
      screenshots?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
    try {
      // Validate input
      if (!message || message.trim().length < 10) {
        return { 
          success: false, 
          error: 'Please provide more detailed feedback (at least 10 characters)' 
        };
      }
      
      // Create feedback object
      const feedback: Feedback = {
        userId: this.currentUser?.uid || 'anonymous',
        userName: this.currentUser?.displayName || 'Anonymous User',
        userEmail: this.currentUser?.email || undefined,
        type,
        category: options?.category || 'other',
        severity: options?.severity || this.determineSeverity(type),
        message: message.trim(),
        deviceInfo: this.deviceInfo || undefined,
        screenshots: options?.screenshots || [],
        metadata: options?.metadata || {},
        status: 'new',
        createdAt: new Date(),
      };
      
      // Upload screenshots if provided
      if (feedback.screenshots && feedback.screenshots.length > 0) {
        feedback.screenshots = await this.uploadScreenshots(feedback.screenshots);
      }
      
      // Submit to Firestore
      const docRef = await firestore().collection('feedback').add({
        ...feedback,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      
      feedback.id = docRef.id;
      
      // Log to centralized analytics (PII scrubbed)
      analyticsService.track('feedback_submitted', {
        feedback_type: type,
        category: feedback.category,
        severity: feedback.severity,
        has_screenshots: feedback.screenshots.length > 0,
      });
      
      // Log critical issues to Crashlytics
      if (feedback.severity === 'critical' || type === 'bug') {
        crashlytics().log(`User Feedback: ${type} - ${message.substring(0, 100)}`);
      }
      
      // Notify user
      this.showFeedbackConfirmation(type);
      
      return { success: true, feedbackId: docRef.id };
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // Queue for later if offline
      if (!this.isOnline) {
        this.feedbackQueue.push(feedback as Feedback);
        return { 
          success: true, 
          error: 'Feedback saved. Will be submitted when online.' 
        };
      }
      
      return { 
        success: false, 
        error: 'Failed to submit feedback. Please try again.' 
      };
    }
  }
  
  // Quick feedback methods
  async reportBug(
    description: string,
    screenshot?: string,
    metadata?: Record<string, any>
  ) {
    return this.submitFeedback('bug', description, {
      category: 'functionality',
      severity: 'high',
      screenshots: screenshot ? [screenshot] : [],
      metadata,
    });
  }
  
  async suggestFeature(
    description: string,
    metadata?: Record<string, any>
  ) {
    return this.submitFeedback('feature', description, {
      category: 'functionality',
      severity: 'low',
      metadata,
    });
  }
  
  async reportCrash(
    error: Error,
    additionalInfo?: string
  ) {
    const message = `App crashed: ${error.message}\n${error.stack}\n${additionalInfo || ''}`;
    
    return this.submitFeedback('bug', message, {
      category: 'crash',
      severity: 'critical',
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
  }
  
  async sendPraise(message: string) {
    return this.submitFeedback('praise', message, {
      category: 'other',
      severity: 'low',
    });
  }
  
  // Take screenshot for feedback
  async captureScreenshot(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to attach screenshots.'
        );
        return null;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }
  
  // Upload screenshots to Firebase Storage
  private async uploadScreenshots(localUris: string[]): Promise<string[]> {
    const uploadedUrls: string[] = [];
    
    for (const uri of localUris) {
      try {
        const filename = `feedback/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const reference = storage().ref(filename);
        
        await reference.putFile(uri);
        const url = await reference.getDownloadURL();
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Failed to upload screenshot:', error);
      }
    }
    
    return uploadedUrls;
  }
  
  // Get user's feedback history
  async getUserFeedback(): Promise<Feedback[]> {
    if (!this.currentUser) return [];
    
    try {
      const snapshot = await firestore()
        .collection('feedback')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as Feedback));
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return [];
    }
  }
  
  // Get feedback statistics
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const snapshot = await firestore()
        .collection('feedback')
        .get();
      
      const stats: FeedbackStats = {
        total: snapshot.size,
        byType: {},
        byCategory: {},
        bySeverity: {},
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Count by type
        stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
        
        // Count by category
        stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
        
        // Count by severity
        stats.bySeverity[data.severity] = (stats.bySeverity[data.severity] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return {
        total: 0,
        byType: {},
        byCategory: {},
        bySeverity: {},
      };
    }
  }
  
  // Process queued feedback when online
  private async processQueuedFeedback() {
    if (this.feedbackQueue.length === 0) return;
    
    const queue = [...this.feedbackQueue];
    this.feedbackQueue = [];
    
    for (const feedback of queue) {
      try {
        await firestore().collection('feedback').add({
          ...feedback,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to process queued feedback:', error);
        this.feedbackQueue.push(feedback);
      }
    }
  }
  
  // Determine severity based on type
  private determineSeverity(type: Feedback['type']): Feedback['severity'] {
    switch (type) {
      case 'bug':
        return 'high';
      case 'feature':
        return 'low';
      case 'improvement':
        return 'medium';
      case 'praise':
        return 'low';
      default:
        return 'medium';
    }
  }
  
  // Show confirmation after feedback submission
  private showFeedbackConfirmation(type: Feedback['type']) {
    const messages = {
      bug: 'Thank you for reporting this issue. We\'ll look into it!',
      feature: 'Thanks for the suggestion! We\'ll consider it for future updates.',
      improvement: 'Thank you for your feedback. We\'re always working to improve!',
      praise: 'Thank you for the kind words! We\'re glad you\'re enjoying the app.',
      other: 'Thank you for your feedback!',
    };
    
    Alert.alert(
      'Feedback Received',
      messages[type],
      [{ text: 'OK' }]
    );
  }
  
  // Set online status
  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.processQueuedFeedback();
    }
  }
}

// Export singleton instance
export default new FeedbackCollector();
