import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import * as Sentry from '@sentry/react-native';

export interface PhotoAnalysisResult {
  confidence: number;
  labels: string[];
  isValid: boolean;
  suggestions?: string[];
  matchesTaskRequirements: boolean;
}

export interface TaskRequirements {
  taskType: string;
  expectedLabels?: string[];
  minConfidence?: number;
  description?: string;
}

export class PhotoAnalysisService {
  private static instance: PhotoAnalysisService;
  private analyzePhotoFunction: any;

  private constructor() {
    // Initialize the Cloud Function reference
    this.analyzePhotoFunction = httpsCallable(functions, 'analyzeTaskPhoto');
  }

  static getInstance(): PhotoAnalysisService {
    if (!PhotoAnalysisService.instance) {
      PhotoAnalysisService.instance = new PhotoAnalysisService();
    }
    return PhotoAnalysisService.instance;
  }

  /**
   * Analyze a photo using AI/ML to verify task completion
   */
  async analyzePhoto(
    photoUrl: string, 
    taskRequirements: TaskRequirements
  ): Promise<PhotoAnalysisResult> {
    try {
      // For now, use a simple local analysis
      // In production, this would call Vision API or ML Kit
      const result = await this.performLocalAnalysis(photoUrl, taskRequirements);
      
      // Log analysis for monitoring
      await this.logAnalysis(photoUrl, result);
      
      return result;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error analyzing photo:', error);
      
      // Return a default result if analysis fails
      return {
        confidence: 0.5,
        labels: [],
        isValid: false,
        matchesTaskRequirements: false,
        suggestions: ['Unable to analyze photo. Please try again.'],
      };
    }
  }

  /**
   * Perform local analysis (placeholder for actual ML implementation)
   */
  private async performLocalAnalysis(
    photoUrl: string,
    requirements: TaskRequirements
  ): Promise<PhotoAnalysisResult> {
    // Simulate analysis based on task type
    const taskTypeAnalysis = this.analyzeByTaskType(requirements.taskType);
    
    // Check if photo meets minimum quality standards
    const qualityCheck = await this.checkPhotoQuality(photoUrl);
    
    // Calculate overall confidence
    const confidence = (taskTypeAnalysis.confidence + qualityCheck) / 2;
    
    // Determine if photo is valid
    const isValid = confidence >= (requirements.minConfidence || 0.7);
    
    return {
      confidence,
      labels: taskTypeAnalysis.labels,
      isValid,
      matchesTaskRequirements: isValid,
      suggestions: isValid ? [] : taskTypeAnalysis.suggestions,
    };
  }

  /**
   * Analyze based on task type
   */
  private analyzeByTaskType(taskType: string): {
    confidence: number;
    labels: string[];
    suggestions: string[];
  } {
    const analyses: Record<string, any> = {
      'clean_room': {
        confidence: 0.85,
        labels: ['room', 'clean', 'organized', 'bed', 'floor'],
        suggestions: ['Make sure the bed is made', 'Ensure floor is visible and clean'],
      },
      'homework': {
        confidence: 0.8,
        labels: ['paper', 'writing', 'desk', 'homework', 'completed'],
        suggestions: ['Show completed homework clearly', 'Include all pages'],
      },
      'dishes': {
        confidence: 0.9,
        labels: ['dishes', 'clean', 'sink', 'kitchen', 'washed'],
        suggestions: ['Show clean dishes or empty sink', 'Include dishwasher if used'],
      },
      'outdoor_activity': {
        confidence: 0.75,
        labels: ['outdoor', 'activity', 'exercise', 'outside'],
        suggestions: ['Photo should be taken outdoors', 'Show the activity being performed'],
      },
      'reading': {
        confidence: 0.7,
        labels: ['book', 'reading', 'pages', 'text'],
        suggestions: ['Show the book being read', 'Include current page'],
      },
      default: {
        confidence: 0.6,
        labels: ['task', 'completed'],
        suggestions: ['Ensure photo clearly shows task completion'],
      },
    };

    return analyses[taskType] || analyses.default;
  }

  /**
   * Check photo quality
   */
  private async checkPhotoQuality(photoUrl: string): Promise<number> {
    // In a real implementation, this would check:
    // - Image resolution
    // - Lighting conditions
    // - Blur detection
    // - Proper framing
    
    // For now, return a simulated quality score
    return 0.8;
  }

  /**
   * Log analysis results for monitoring and improvement
   */
  private async logAnalysis(
    photoUrl: string, 
    result: PhotoAnalysisResult
  ): Promise<void> {
    try {
      // Log to analytics for ML model improvement
      console.log('Photo analysis result:', {
        photoUrl,
        confidence: result.confidence,
        isValid: result.isValid,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging analysis:', error);
    }
  }

  /**
   * Validate photo against specific task requirements
   */
  async validateTaskPhoto(
    photoUrl: string,
    taskId: string,
    taskType: string,
    customRequirements?: string[]
  ): Promise<{
    isValid: boolean;
    confidence: number;
    feedback: string;
  }> {
    try {
      const requirements: TaskRequirements = {
        taskType,
        expectedLabels: customRequirements,
        minConfidence: 0.7,
      };

      const analysis = await this.analyzePhoto(photoUrl, requirements);
      
      let feedback = '';
      if (analysis.isValid) {
        feedback = `Great job! Task appears to be completed properly (${Math.round(analysis.confidence * 100)}% confidence)`;
      } else {
        feedback = analysis.suggestions?.join('. ') || 'Please retake the photo showing clear task completion';
      }

      return {
        isValid: analysis.isValid,
        confidence: analysis.confidence,
        feedback,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error validating task photo:', error);
      
      return {
        isValid: false,
        confidence: 0,
        feedback: 'Unable to validate photo. Please try again.',
      };
    }
  }

  /**
   * Get suggested labels for a task type
   */
  getSuggestedLabels(taskType: string): string[] {
    const labelSuggestions: Record<string, string[]> = {
      'clean_room': ['clean', 'tidy', 'organized', 'neat'],
      'homework': ['completed', 'finished', 'done', 'written'],
      'dishes': ['washed', 'clean', 'dried', 'put away'],
      'outdoor_activity': ['outside', 'exercise', 'playing', 'active'],
      'reading': ['book', 'reading', 'studying', 'learning'],
      'chores': ['completed', 'done', 'finished', 'clean'],
    };

    return labelSuggestions[taskType] || ['completed', 'done', 'finished'];
  }
}

export default PhotoAnalysisService.getInstance();
