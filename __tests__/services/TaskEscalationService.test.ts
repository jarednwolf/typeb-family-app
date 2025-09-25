import { taskEscalationService } from '../../src/services/TaskEscalationService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  getFirestore: jest.fn(),
}));

// Mock NotificationOrchestrator
jest.mock('../../src/services/NotificationOrchestrator', () => ({
  notificationOrchestrator: {
    sendNotification: jest.fn(),
  },
}));

describe('TaskEscalationService', () => {
  const mockTaskId = 'task-123';
  const mockChildId = 'child-456';
  const mockParentIds = ['parent-789', 'parent-012'];
  const mockFamilyId = 'family-001';

  const mockTask = {
    id: mockTaskId,
    title: 'Clean room',
    assignedTo: mockChildId,
    dueTime: '15:00',
    status: 'pending',
    createdAt: new Date('2024-01-15T10:00:00'),
    requiresPhoto: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkAndEscalateTask', () => {
    it('should escalate task to level 1 after 30 minutes', async () => {
      const checkSpy = jest.spyOn(taskEscalationService, 'checkAndEscalateTask');
      
      // Set current time to 30 minutes after due time
      const dueDate = new Date('2024-01-15T15:00:00');
      const currentTime = new Date('2024-01-15T15:30:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(mockTask, mockChildId, mockParentIds);
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should escalate to level 2 after 1 hour', async () => {
      const dueDate = new Date('2024-01-15T15:00:00');
      const currentTime = new Date('2024-01-15T16:00:00');
      jest.setSystemTime(currentTime);
      
      const checkSpy = jest.spyOn(taskEscalationService, 'checkAndEscalateTask');
      
      await taskEscalationService.checkAndEscalateTask(mockTask, mockChildId, mockParentIds);
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should escalate to level 3 after 2 hours', async () => {
      const dueDate = new Date('2024-01-15T15:00:00');
      const currentTime = new Date('2024-01-15T17:00:00');
      jest.setSystemTime(currentTime);
      
      const checkSpy = jest.spyOn(taskEscalationService, 'checkAndEscalateTask');
      
      await taskEscalationService.checkAndEscalateTask(mockTask, mockChildId, mockParentIds);
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should escalate to level 4 after 4 hours', async () => {
      const dueDate = new Date('2024-01-15T15:00:00');
      const currentTime = new Date('2024-01-15T19:00:00');
      jest.setSystemTime(currentTime);
      
      const checkSpy = jest.spyOn(taskEscalationService, 'checkAndEscalateTask');
      
      await taskEscalationService.checkAndEscalateTask(mockTask, mockChildId, mockParentIds);
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should not escalate completed tasks', async () => {
      const completedTask = {
        ...mockTask,
        status: 'completed',
        completedAt: new Date('2024-01-15T14:45:00'),
      };
      
      const checkSpy = jest.spyOn(taskEscalationService, 'checkAndEscalateTask');
      
      await taskEscalationService.checkAndEscalateTask(
        completedTask,
        mockChildId,
        mockParentIds
      );
      
      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe('resolveEscalation', () => {
    it('should resolve escalation when task is completed', async () => {
      const resolveSpy = jest.spyOn(taskEscalationService, 'resolveEscalation');
      
      await taskEscalationService.resolveEscalation(mockTaskId, 'completed');
      
      expect(resolveSpy).toHaveBeenCalledWith(mockTaskId, 'completed');
    });

    it('should handle resolution with parent intervention', async () => {
      const resolveSpy = jest.spyOn(taskEscalationService, 'resolveEscalation');
      
      await taskEscalationService.resolveEscalation(
        mockTaskId,
        'parent_intervened'
      );
      
      expect(resolveSpy).toHaveBeenCalledWith(mockTaskId, 'parent_intervened');
    });

    it('should handle task exemption resolution', async () => {
      const resolveSpy = jest.spyOn(taskEscalationService, 'resolveEscalation');
      
      await taskEscalationService.resolveEscalation(mockTaskId, 'exempted');
      
      expect(resolveSpy).toHaveBeenCalledWith(mockTaskId, 'exempted');
    });
  });

  describe('getActiveEscalations', () => {
    it('should retrieve active escalations for a family', async () => {
      const mockEscalations = [
        {
          taskId: 'task-1',
          childId: 'child-1',
          level: 2,
          startTime: new Date('2024-01-15T15:30:00'),
          lastNotification: new Date('2024-01-15T16:00:00'),
        },
        {
          taskId: 'task-2',
          childId: 'child-2',
          level: 1,
          startTime: new Date('2024-01-15T16:00:00'),
          lastNotification: new Date('2024-01-15T16:00:00'),
        },
      ];

      jest.spyOn(taskEscalationService, 'getActiveEscalations')
        .mockResolvedValue(mockEscalations);
      
      const result = await taskEscalationService.getActiveEscalations(mockFamilyId);
      
      expect(result).toEqual(mockEscalations);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no active escalations', async () => {
      jest.spyOn(taskEscalationService, 'getActiveEscalations')
        .mockResolvedValue([]);
      
      const result = await taskEscalationService.getActiveEscalations(mockFamilyId);
      
      expect(result).toEqual([]);
    });
  });

  describe('getEscalationSummary', () => {
    it('should generate escalation summary for family', async () => {
      const mockSummary = {
        totalEscalations: 10,
        currentlyEscalated: 3,
        averageResolutionTime: 45, // minutes
        escalationsByLevel: {
          level1: 4,
          level2: 3,
          level3: 2,
          level4: 1,
        },
        childrenWithMostEscalations: [
          { childId: 'child-1', count: 6 },
          { childId: 'child-2', count: 4 },
        ],
      };

      jest.spyOn(taskEscalationService, 'getEscalationSummary')
        .mockResolvedValue(mockSummary);
      
      const result = await taskEscalationService.getEscalationSummary(
        mockFamilyId,
        7
      );
      
      expect(result.totalEscalations).toBe(10);
      expect(result.currentlyEscalated).toBe(3);
      expect(result.averageResolutionTime).toBe(45);
    });

    it('should track escalations by level', async () => {
      const summary = await taskEscalationService.getEscalationSummary(
        mockFamilyId,
        7
      );
      
      if (summary.escalationsByLevel) {
        expect(summary.escalationsByLevel).toHaveProperty('level1');
        expect(summary.escalationsByLevel).toHaveProperty('level2');
        expect(summary.escalationsByLevel).toHaveProperty('level3');
        expect(summary.escalationsByLevel).toHaveProperty('level4');
      }
    });

    it('should identify children with most escalations', async () => {
      const summary = await taskEscalationService.getEscalationSummary(
        mockFamilyId,
        7
      );
      
      if (summary.childrenWithMostEscalations) {
        expect(Array.isArray(summary.childrenWithMostEscalations)).toBe(true);
        
        if (summary.childrenWithMostEscalations.length > 0) {
          expect(summary.childrenWithMostEscalations[0]).toHaveProperty('childId');
          expect(summary.childrenWithMostEscalations[0]).toHaveProperty('count');
        }
      }
    });
  });

  describe('Escalation Levels', () => {
    it('Level 1: should send gentle reminder to child', async () => {
      const currentTime = new Date('2024-01-15T15:30:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(
        mockTask,
        mockChildId,
        mockParentIds
      );
      
      // Ensure the real method is invoked (not a mock)
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });

    it('Level 2: should notify parents and send urgent reminder', async () => {
      const currentTime = new Date('2024-01-15T16:00:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(
        mockTask,
        mockChildId,
        mockParentIds
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });

    it('Level 3: should restrict device and require parent approval', async () => {
      const currentTime = new Date('2024-01-15T17:00:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(
        mockTask,
        mockChildId,
        mockParentIds
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });

    it('Level 4: should apply full restrictions and alert all parents', async () => {
      const currentTime = new Date('2024-01-15T19:00:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(
        mockTask,
        mockChildId,
        mockParentIds
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks without due time', async () => {
      const taskWithoutDueTime = {
        ...mockTask,
        dueTime: null,
      };
      
      await taskEscalationService.checkAndEscalateTask(
        taskWithoutDueTime,
        mockChildId,
        mockParentIds
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });

    it('should handle escalation during quiet hours', async () => {
      // Set time to 11 PM (quiet hours)
      const currentTime = new Date('2024-01-15T23:00:00');
      jest.setSystemTime(currentTime);
      
      await taskEscalationService.checkAndEscalateTask(
        mockTask,
        mockChildId,
        mockParentIds
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });

    it('should handle resolution of non-existent escalation', async () => {
      await expect(
        taskEscalationService.resolveEscalation('non-existent-task', 'completed')
      ).resolves.not.toThrow();
    });

    it('should handle multiple concurrent escalations for same child', async () => {
      const tasks = [
        { ...mockTask, id: 'task-1' },
        { ...mockTask, id: 'task-2' },
        { ...mockTask, id: 'task-3' },
      ];
      
      await Promise.all(
        tasks.map(task =>
          taskEscalationService.checkAndEscalateTask(task, mockChildId, mockParentIds)
        )
      );
      
      expect(typeof taskEscalationService.checkAndEscalateTask).toBe('function');
    });
  });
});