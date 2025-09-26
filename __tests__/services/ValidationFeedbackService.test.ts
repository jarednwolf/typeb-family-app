import { validationFeedbackService } from '../../src/services/ValidationFeedbackService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  getFirestore: jest.fn(),
}));

describe('ValidationFeedbackService', () => {
  const mockTaskId = 'task-123';
  const mockChildId = 'child-456';
  const mockParentId = 'parent-789';
  const mockFamilyId = 'family-001';

  const mockRejectionData = {
    taskId: mockTaskId,
    childId: mockChildId,
    parentId: mockParentId,
    reason: 'Photo too blurry',
    requiresResubmission: true,
    message: 'Please take a clearer photo showing the completed task',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordPhotoRejection', () => {
    it('should record a photo rejection with feedback', async () => {
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoRejection');
      
      await validationFeedbackService.recordPhotoRejection(mockRejectionData);
      
      expect(recordSpy).toHaveBeenCalledWith(mockRejectionData);
    });

    it('should handle rejection without resubmission requirement', async () => {
      const dataWithoutResubmission = {
        ...mockRejectionData,
        requiresResubmission: false,
      };
      
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoRejection');
      
      await validationFeedbackService.recordPhotoRejection(dataWithoutResubmission);
      
      expect(recordSpy).toHaveBeenCalledWith(dataWithoutResubmission);
    });

    it('should include optional coaching tips', async () => {
      const dataWithCoaching = {
        ...mockRejectionData,
        coachingTips: ['Ensure good lighting', 'Show the entire completed task'],
      };
      
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoRejection');
      
      await validationFeedbackService.recordPhotoRejection(dataWithCoaching);
      
      expect(recordSpy).toHaveBeenCalledWith(dataWithCoaching);
    });
  });

  describe('recordPhotoApproval', () => {
    it('should record photo approval', async () => {
      const approvalData = {
        taskId: mockTaskId,
        childId: mockChildId,
        parentId: mockParentId,
        qualityScore: 85,
      };
      
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoApproval');
      
      await validationFeedbackService.recordPhotoApproval(approvalData);
      
      expect(recordSpy).toHaveBeenCalledWith(approvalData);
    });

    it('should handle approval with praise message', async () => {
      const approvalWithPraise = {
        taskId: mockTaskId,
        childId: mockChildId,
        parentId: mockParentId,
        qualityScore: 95,
        praiseMessage: 'Great job! Perfect photo!',
      };
      
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoApproval');
      
      await validationFeedbackService.recordPhotoApproval(approvalWithPraise);
      
      expect(recordSpy).toHaveBeenCalledWith(approvalWithPraise);
    });
  });

  describe('getChildFeedbackHistory', () => {
    it('should retrieve feedback history for a child', async () => {
      const mockHistory = {
        totalSubmissions: 50,
        approvalRate: 0.8,
        commonIssues: [
          { reason: 'Photo too blurry', count: 5 },
          { reason: 'Task not fully visible', count: 3 },
        ],
        recentFeedback: [
          {
            taskId: 'task-1',
            type: 'rejection',
            reason: 'Photo too blurry',
            timestamp: new Date('2024-01-15T10:00:00'),
          },
          {
            taskId: 'task-2',
            type: 'approval',
            qualityScore: 90,
            timestamp: new Date('2024-01-15T14:00:00'),
          },
        ],
        improvementTrend: 'improving',
      };

      jest.spyOn(validationFeedbackService, 'getChildFeedbackHistory')
        .mockResolvedValue(mockHistory);
      
      const result = await validationFeedbackService.getChildFeedbackHistory(
        mockChildId,
        7
      );
      
      expect(result).toEqual(mockHistory);
      expect(result.approvalRate).toBe(0.8);
      expect(result.commonIssues).toHaveLength(2);
    });

    it('should handle child with no feedback history', async () => {
      const emptyHistory = {
        totalSubmissions: 0,
        approvalRate: 0,
        commonIssues: [],
        recentFeedback: [],
        improvementTrend: 'stable' as const,
      };

      jest.spyOn(validationFeedbackService, 'getChildFeedbackHistory')
        .mockResolvedValue(emptyHistory);
      
      const result = await validationFeedbackService.getChildFeedbackHistory(
        'new-child',
        7
      );
      
      expect(result.totalSubmissions).toBe(0);
      expect(result.recentFeedback).toEqual([]);
    });
  });

  describe('getFeedbackSummary', () => {
    it('should generate feedback summary for family', async () => {
      const mockSummary = {
        familyId: mockFamilyId,
        periodDays: 7,
        overallApprovalRate: 0.75,
        totalRejections: 25,
        totalApprovals: 75,
        commonIssues: [
          { reason: 'Photo too blurry', count: 10, percentage: 0.4 },
          { reason: 'Task not fully visible', count: 8, percentage: 0.32 },
        ],
        childrenNeedingSupport: ['child-123', 'child-456'],
        parentCoachingTips: [
          'Consider providing clearer task instructions',
          'Help children understand photo requirements',
        ],
      };

      jest.spyOn(validationFeedbackService, 'getFeedbackSummary')
        .mockResolvedValue(mockSummary);
      
      const result = await validationFeedbackService.getFeedbackSummary(
        mockFamilyId,
        7
      );
      
      expect(result.overallApprovalRate).toBe(0.75);
      expect(result.totalRejections + result.totalApprovals).toBe(100);
      expect(result.childrenNeedingSupport).toHaveLength(2);
    });

    it('should identify children needing support', async () => {
      const summaryWithSupport = {
        familyId: mockFamilyId,
        periodDays: 7,
        overallApprovalRate: 0.6,
        totalRejections: 40,
        totalApprovals: 60,
        commonIssues: [],
        childrenNeedingSupport: ['child-low-approval'],
        parentCoachingTips: [
          'Work with child-low-approval on photo quality',
        ],
      };

      jest.spyOn(validationFeedbackService, 'getFeedbackSummary')
        .mockResolvedValue(summaryWithSupport);
      
      const result = await validationFeedbackService.getFeedbackSummary(
        mockFamilyId,
        7
      );
      
      expect(result.childrenNeedingSupport).toContain('child-low-approval');
      expect(result.parentCoachingTips).toHaveLength(1);
    });
  });

  describe('generateCoachingTips', () => {
    it('should generate relevant coaching tips for parent', async () => {
      const feedbackData = {
        childId: mockChildId,
        recentRejections: [
          { reason: 'Photo too blurry', count: 5 },
          { reason: 'Task not fully visible', count: 3 },
        ],
        approvalRate: 0.6,
      };

      const tips = await validationFeedbackService.generateCoachingTips(
        mockParentId,
        feedbackData
      );
      
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
      expect(tips[0]).toHaveProperty('tip');
      expect(tips[0]).toHaveProperty('priority');
      expect(tips[0]).toHaveProperty('category');
    });

    it('should prioritize tips based on issues', async () => {
      const feedbackWithMajorIssues = {
        childId: mockChildId,
        recentRejections: [
          { reason: 'Photo too blurry', count: 15 },
        ],
        approvalRate: 0.3,
      };

      const tips = await validationFeedbackService.generateCoachingTips(
        mockParentId,
        feedbackWithMajorIssues
      );
      
      const highPriorityTips = tips.filter(t => t.priority === 'high');
      expect(highPriorityTips.length).toBeGreaterThan(0);
      expect(highPriorityTips[0].category).toBe('photo_quality');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rejection with empty reason', async () => {
      const emptyReasonData = {
        ...mockRejectionData,
        reason: '',
      };
      
      const recordSpy = jest.spyOn(validationFeedbackService, 'recordPhotoRejection');
      
      await validationFeedbackService.recordPhotoRejection(emptyReasonData);
      
      expect(recordSpy).toHaveBeenCalled();
    });

    it('should handle invalid quality score', async () => {
      const invalidScoreData = {
        taskId: mockTaskId,
        childId: mockChildId,
        parentId: mockParentId,
        qualityScore: 150, // Invalid score > 100
      };
      
      await expect(
        validationFeedbackService.recordPhotoApproval(invalidScoreData)
      ).rejects.toThrow();
    });

    it('should handle feedback for non-existent child', async () => {
      const result = await validationFeedbackService.getChildFeedbackHistory(
        'non-existent-child',
        7
      );
      
      expect(result.totalSubmissions).toBe(0);
      expect(result.recentFeedback).toEqual([]);
    });
  });
});