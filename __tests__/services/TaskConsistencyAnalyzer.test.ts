import { taskConsistencyAnalyzer } from '../../src/services/TaskConsistencyAnalyzer';
import { firestore } from '../../src/config/firebase';

// Mock Firebase
jest.mock('../../src/config/firebase', () => ({
  firestore: {
    collection: jest.fn(),
  },
}));

describe('TaskConsistencyAnalyzer', () => {
  const mockFamilyId = 'test-family-123';
  const mockTasks = [
    {
      id: 'task1',
      title: 'Make bed',
      assignedTo: 'child1',
      completedAt: new Date('2024-01-15T08:00:00'),
      createdAt: new Date('2024-01-15T07:00:00'),
      status: 'completed',
      dueTime: '08:00',
      category: { id: 'morning', name: 'Morning Routine' },
      photoUrl: 'https://example.com/photo1.jpg',
    },
    {
      id: 'task2',
      title: 'Homework',
      assignedTo: 'child1',
      completedAt: new Date('2024-01-15T16:00:00'),
      createdAt: new Date('2024-01-15T15:00:00'),
      status: 'completed',
      dueTime: '16:00',
      category: { id: 'school', name: 'School' },
      photoUrl: 'https://example.com/photo2.jpg',
    },
    {
      id: 'task3',
      title: 'Clean room',
      assignedTo: 'child2',
      completedAt: null,
      createdAt: new Date('2024-01-15T10:00:00'),
      status: 'overdue',
      dueTime: '15:00',
      category: { id: 'chores', name: 'Chores' },
    },
  ];

  const mockChildren = [
    { id: 'child1', name: 'Alice', role: 'child' },
    { id: 'child2', name: 'Bob', role: 'child' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore queries
    const mockWhere = jest.fn().mockReturnThis();
    const mockOrderBy = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockGet = jest.fn().mockResolvedValue({
      docs: mockTasks.map(task => ({
        id: task.id,
        data: () => task,
      })),
    });

    const mockCollection = {
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            members: mockChildren,
          }),
        }),
      }),
    };

    (firestore.collection as jest.Mock).mockReturnValue(mockCollection);
  });

  describe('analyzeChildConsistency', () => {
    it('should calculate consistency score for a child', async () => {
      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        7
      );

      expect(result).toHaveProperty('childId', 'child1');
      expect(result).toHaveProperty('childName', 'Alice');
      expect(result).toHaveProperty('overallConsistencyScore');
      expect(result.overallConsistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.overallConsistencyScore).toBeLessThanOrEqual(100);
    });

    it('should identify daily patterns', async () => {
      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        7
      );

      expect(result.timePatterns).toBeDefined();
      expect(Array.isArray(result.timePatterns)).toBe(true);
      
      // Basic sanity: timePatterns field exists
      expect(Array.isArray(result.timePatterns)).toBe(true);
    });

    it('should detect problem patterns', async () => {
      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child2',
        'Bob',
        7
      );

      expect(result.problemPatterns).toBeDefined();
      expect(Array.isArray(result.problemPatterns)).toBe(true);
    });

    it('should generate recommendations', async () => {
      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        7
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      if (result.recommendations.length > 0) {
        expect(result.recommendations[0]).toHaveProperty('suggestion');
        expect(result.recommendations[0]).toHaveProperty('priority');
        expect(result.recommendations[0]).toHaveProperty('expectedImpact');
      }
    });

    it('should determine monthly trend', async () => {
      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        30
      );

      expect(result.monthlyTrend).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(result.monthlyTrend);
    });
  });

  describe('analyzeFamilyConsistency', () => {
    it('should analyze consistency for entire family', async () => {
      const result = await taskConsistencyAnalyzer.analyzeFamilyConsistency(
        mockFamilyId,
        7
      );

      expect(result).toHaveProperty('familyId', mockFamilyId);
      expect(result).toHaveProperty('familyConsistencyScore');
      expect(result).toHaveProperty('childAnalyses');
      expect(Array.isArray(result.childAnalyses)).toBe(true);
    });

    it('should identify systemic issues', async () => {
      const result = await taskConsistencyAnalyzer.analyzeFamilyConsistency(
        mockFamilyId,
        7
      );

      expect(result.systemicIssues).toBeDefined();
      expect(Array.isArray(result.systemicIssues)).toBe(true);
      
      if (result.systemicIssues.length > 0) {
        expect(result.systemicIssues[0]).toHaveProperty('issue');
        expect(result.systemicIssues[0]).toHaveProperty('affectedChildren');
        expect(result.systemicIssues[0]).toHaveProperty('suggestedSolution');
      }
    });

    it('should provide family-level recommendations', async () => {
      const result = await taskConsistencyAnalyzer.analyzeFamilyConsistency(
        mockFamilyId,
        7
      );

      expect(result.familyRecommendations).toBeDefined();
      expect(Array.isArray(result.familyRecommendations)).toBe(true);
      
      if (result.familyRecommendations.length > 0) {
        expect(result.familyRecommendations[0]).toHaveProperty('recommendation');
        expect(result.familyRecommendations[0]).toHaveProperty('expectedBenefit');
      }
    });

    it('should calculate family consistency score as average', async () => {
      const result = await taskConsistencyAnalyzer.analyzeFamilyConsistency(
        mockFamilyId,
        7
      );

      if (result.childAnalyses.length > 0) {
        const expectedScore = result.childAnalyses.reduce(
          (sum, child) => sum + child.overallConsistencyScore,
          0
        ) / result.childAnalyses.length;
        
        expect(result.familyConsistencyScore).toBeCloseTo(expectedScore, 1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task list', async () => {
      const mockGet = jest.fn().mockResolvedValue({ docs: [] });
      (firestore.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: mockGet,
      });

      const result = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        7
      );

      expect(result.overallConsistencyScore).toBe(0);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            suggestion: 'Start with 2-3 simple daily tasks to build consistency',
            priority: 'high',
            expectedImpact: 'Establish routine foundation',
          })
        ])
      );
    });

    it('should handle family with no children', async () => {
      (firestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ members: [] }),
          }),
        }),
      });

      const result = await taskConsistencyAnalyzer.analyzeFamilyConsistency(
        mockFamilyId,
        7
      );

      expect(result.childAnalyses).toEqual([]);
      expect(result.familyConsistencyScore).toBe(0);
    });

    it('should handle analysis period boundaries', async () => {
      const result7Days = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        7
      );
      
      const result30Days = await taskConsistencyAnalyzer.analyzeChildConsistency(
        'child1',
        'Alice',
        30
      );

      expect(result7Days).toBeDefined();
      expect(result30Days).toBeDefined();
      expect(result30Days.monthlyTrend).toBeDefined();
    });
  });
});