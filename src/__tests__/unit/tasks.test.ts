/**
 * Task Service Unit Tests
 * 
 * Tests all critical task management operations including:
 * - Task creation with validation
 * - Task updates and assignments
 * - Task completion with photo validation
 * - Recurring task handling
 * - Task deletion and cleanup
 * - Statistics and analytics
 * 
 * Following TypeB testing standards:
 * - Comprehensive coverage of critical paths
 * - Clear test descriptions
 * - Proper setup and teardown
 * - Mock Firebase operations
 */

import {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getFamilyTasks,
  getUserTasks,
  getTaskStats,
  getOverdueTasks,
  validateTask
} from '../../services/tasks';
import { db, storage } from '../../services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Task, TaskCategory, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '../../types/models';

// Mock Firebase
jest.mock('../../services/firebase');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');

// Mock family service
jest.mock('../../services/family', () => ({
  getFamily: jest.fn()
}));

// Mock auth service
jest.mock('../../services/auth', () => ({
  getCurrentUser: jest.fn()
}));

import { getFamily } from '../../services/family';
import { getCurrentUser } from '../../services/auth';

describe('Task Service', () => {
  const mockUserId = 'test-user-123';
  const mockParentId = 'test-parent-123';
  const mockChildId = 'test-child-456';
  const mockFamilyId = 'test-family-456';
  const mockTaskId = 'test-task-789';
  
  const mockTaskCategory: TaskCategory = {
    id: 'chores',
    name: 'Chores',
    icon: 'home',
    color: '#4CAF50',
    order: 1
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

  const mockTask: Partial<Task> = {
    id: mockTaskId,
    title: 'Clean Room',
    description: 'Clean and organize bedroom',
    category: mockTaskCategory,
    assignedTo: mockChildId,
    assignedBy: mockParentId,
    familyId: mockFamilyId,
    dueDate: futureDate,
    reminderTime: '30',
    status: 'pending',
    priority: 'medium',
    requiresPhoto: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFamily = {
    id: mockFamilyId,
    name: 'Test Family',
    memberIds: [mockParentId, mockChildId],
    parentIds: [mockParentId],
    childIds: [mockChildId],
    taskCategories: [mockTaskCategory],
    inviteCode: 'ABC123',
    createdBy: mockParentId,
    createdAt: new Date(),
    updatedAt: new Date(),
    maxMembers: 10,
    isPremium: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for getFamily
    (getFamily as jest.Mock).mockResolvedValue(mockFamily);
    // Mock runTransaction to execute the callback immediately
    (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
      const mockTransaction = {
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        get: jest.fn()
      };
      return await callback(mockTransaction);
    });
  });

  describe('createTask', () => {
    it('should create a task with all required fields', async () => {
      const mockDocRef = { id: mockTaskId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);

      const taskData: CreateTaskInput = {
        title: 'Clean Room',
        description: 'Clean and organize bedroom',
        categoryId: mockTaskCategory.id,
        assignedTo: mockChildId,
        dueDate: futureDate,
        reminderTime: '30',
        priority: 'medium',
        requiresPhoto: false,
        isRecurring: false,
        reminderEnabled: true
      };

      const result = await createTask(mockFamilyId, mockParentId, taskData);

      expect(runTransaction).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        title: taskData.title,
        status: 'pending'
      }));
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        title: '', // Empty title
        assignedTo: mockChildId,
        categoryId: mockTaskCategory.id,
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium' as TaskPriority
      };

      await expect(createTask(mockFamilyId, mockParentId, invalidTaskData as CreateTaskInput))
        .rejects.toThrow('Title must be at least 3 characters');
    });

    it('should only allow parents to create tasks', async () => {
      const taskData: CreateTaskInput = {
        title: 'Test Task',
        categoryId: mockTaskCategory.id,
        assignedTo: mockChildId,
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium'
      };

      await expect(createTask(mockFamilyId, mockChildId, taskData))
        .rejects.toThrow('Unauthorized: Only parents can create tasks');
    });

    it('should validate assignee is a family member', async () => {
      const taskData: CreateTaskInput = {
        title: 'Test Task',
        categoryId: mockTaskCategory.id,
        assignedTo: 'non-member-123',
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium'
      };

      await expect(createTask(mockFamilyId, mockParentId, taskData))
        .rejects.toThrow('Cannot assign task to non-family member');
    });

    it('should validate due date is not in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const taskData: CreateTaskInput = {
        title: 'Test Task',
        categoryId: mockTaskCategory.id,
        assignedTo: mockChildId,
        dueDate: pastDate,
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false,
        priority: 'medium'
      };

      await expect(createTask(mockFamilyId, mockParentId, taskData))
        .rejects.toThrow('Due date cannot be in the past');
    });

    it('should enforce photo requirement for premium families only', async () => {
      (getFamily as jest.Mock).mockResolvedValueOnce({
        ...mockFamily,
        isPremium: false
      });

      const taskData: CreateTaskInput = {
        title: 'Test Task',
        categoryId: mockTaskCategory.id,
        assignedTo: mockChildId,
        requiresPhoto: true,
        isRecurring: false,
        reminderEnabled: false,
        priority: 'medium'
      };

      await expect(createTask(mockFamilyId, mockParentId, taskData))
        .rejects.toThrow('Photo validation is a premium feature');
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, createdBy: mockParentId })
      });
    });

    it('should update task fields', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high' as const
      };

      await updateTask(mockTaskId, mockParentId, updates);

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should prevent updating completed tasks', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, status: 'completed', createdBy: mockParentId })
      });

      await expect(updateTask(mockTaskId, mockParentId, { title: 'New Title' }))
        .rejects.toThrow('Cannot update completed tasks');
    });

    it('should only allow parents or creator to update', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, createdBy: 'other-parent-123' })
      });

      await expect(updateTask(mockTaskId, mockChildId, { title: 'New Title' }))
        .rejects.toThrow('Unauthorized: Only parents or task creator can perform this action');
    });

    it('should validate new assignee is in family', async () => {
      await expect(updateTask(mockTaskId, mockParentId, { assignedTo: 'non-member-123' }))
        .rejects.toThrow('Cannot assign task to non-family member');
    });

    it('should validate due date is in the future', async () => {
      const pastDate = new Date('2020-01-01');
      
      await expect(updateTask(mockTaskId, mockParentId, { dueDate: pastDate }))
        .rejects.toThrow('Due date cannot be in the past');
    });
  });

  describe('completeTask', () => {
    beforeEach(() => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, assignedTo: mockChildId })
      });
    });

    it('should mark task as completed', async () => {
      await completeTask(mockTaskId, mockChildId);

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should only allow assigned user to complete task', async () => {
      await expect(completeTask(mockTaskId, mockParentId))
        .rejects.toThrow('Unauthorized: Only the assigned user can complete this task');
    });

    it('should prevent double completion', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, status: 'completed', assignedTo: mockChildId })
      });

      await expect(completeTask(mockTaskId, mockChildId))
        .rejects.toThrow('Task is already completed');
    });

    it('should require photo when task requires it', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, requiresPhoto: true, assignedTo: mockChildId })
      });

      await expect(completeTask(mockTaskId, mockChildId))
        .rejects.toThrow('Photo is required to complete this task');
    });

    it('should accept photo URL for tasks requiring photos', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, requiresPhoto: true, assignedTo: mockChildId })
      });

      const photoUrl = 'https://storage.example.com/photo.jpg';
      
      await completeTask(mockTaskId, mockChildId, photoUrl);
      expect(runTransaction).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, createdBy: mockParentId })
      });

      await deleteTask(mockTaskId, mockParentId);

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should prevent deleting completed tasks', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, status: 'completed', createdBy: mockParentId })
      });

      await expect(deleteTask(mockTaskId, mockParentId))
        .rejects.toThrow('Cannot delete completed tasks');
    });

    it('should only allow parents or creator to delete', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, createdBy: 'other-parent-123' })
      });

      await expect(deleteTask(mockTaskId, mockChildId))
        .rejects.toThrow('Unauthorized: Only parents or task creator can perform this action');
    });

    it('should handle non-existent task', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      await expect(deleteTask('invalid-task', mockParentId))
        .rejects.toThrow('Task not found');
    });
  });

  describe('getFamilyTasks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      (collection as jest.Mock).mockReturnValue('tasks-collection');
      (query as jest.Mock).mockImplementation((...args) => args[0]);
    });

    it('should retrieve all family tasks', async () => {
      const mockTasks = [
        {
          id: 'task1',
          data: () => ({
            ...mockTask,
            id: 'task1',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            dueDate: mockTask.dueDate ? { toDate: () => mockTask.dueDate } : undefined
          })
        },
        {
          id: 'task2',
          data: () => ({
            ...mockTask,
            id: 'task2',
            status: 'completed',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            dueDate: mockTask.dueDate ? { toDate: () => mockTask.dueDate } : undefined
          })
        }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: mockTasks,
        forEach: (fn: any) => mockTasks.forEach(fn),
        size: mockTasks.length
      });

      const result = await getFamilyTasks(mockFamilyId, mockParentId);

      expect(query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ id: 'task1' }));
    });

    it('should filter tasks by status', async () => {
      const mockPendingTasks = [
        {
          id: 'task1',
          data: () => ({
            ...mockTask,
            id: 'task1',
            status: 'pending',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            dueDate: mockTask.dueDate ? { toDate: () => mockTask.dueDate } : undefined
          })
        }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: mockPendingTasks,
        forEach: (fn: any) => mockPendingTasks.forEach(fn),
        size: mockPendingTasks.length
      });

      const result = await getFamilyTasks(mockFamilyId, mockParentId, { status: 'pending' });

      expect(query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should only allow family members to view tasks', async () => {
      (getFamily as jest.Mock).mockResolvedValueOnce({
        ...mockFamily,
        memberIds: ['other-user-123']
      });

      await expect(getFamilyTasks(mockFamilyId, mockParentId))
        .rejects.toThrow('Unauthorized: User is not a member of this family');
    });
  });

  describe('validateTask', () => {
    beforeEach(() => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          ...mockTask, 
          status: 'completed',
          requiresPhoto: true,
          photoUrl: 'https://storage.example.com/photo.jpg'
        })
      });
    });

    it('should approve task validation', async () => {
      await validateTask(mockTaskId, mockParentId, true, 'Good job!');
      expect(runTransaction).toHaveBeenCalled();
    });

    it('should reject task validation and reset to pending', async () => {
      await validateTask(mockTaskId, mockParentId, false, 'Please retake photo');
      expect(runTransaction).toHaveBeenCalled();
    });

    it('should only allow parents to validate', async () => {
      await expect(validateTask(mockTaskId, mockChildId, true))
        .rejects.toThrow('Unauthorized: Only parents can validate tasks');
    });

    it('should only validate completed tasks', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, status: 'pending' })
      });

      await expect(validateTask(mockTaskId, mockParentId, true))
        .rejects.toThrow('Can only validate completed tasks');
    });

    it('should require photo for validation when task requires it', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          ...mockTask, 
          status: 'completed',
          requiresPhoto: true,
          photoUrl: undefined
        })
      });

      await expect(validateTask(mockTaskId, mockParentId, true))
        .rejects.toThrow('Cannot validate task without required photo');
    });
  });

  describe('getTaskStats', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (collection as jest.Mock).mockReturnValue('tasks-collection');
      (query as jest.Mock).mockImplementation((...args) => args[0]);
    });

    it('should calculate task statistics for a user', async () => {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 1);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const tasks = [
        {
          id: 'task1',
          data: () => ({
            ...mockTask,
            status: 'completed',
            dueDate: futureDate ? { toDate: () => futureDate } : undefined
          })
        },
        {
          id: 'task2',
          data: () => ({
            ...mockTask,
            status: 'pending',
            dueDate: futureDate ? { toDate: () => futureDate } : undefined
          })
        },
        {
          id: 'task3',
          data: () => ({
            ...mockTask,
            status: 'completed',
            dueDate: futureDate ? { toDate: () => futureDate } : undefined
          })
        },
        {
          id: 'task4',
          data: () => ({
            ...mockTask,
            status: 'pending',
            dueDate: { toDate: () => pastDate }
          })
        }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: tasks,
        forEach: (fn: any) => tasks.forEach(fn),
        size: tasks.length
      });

      const stats = await getTaskStats(mockFamilyId, mockParentId, mockChildId);

      expect(stats).toEqual({
        total: 4,
        completed: 2,
        pending: 2,
        overdue: 1,
        completionRate: 50
      });
    });

    it('should handle users with no tasks', async () => {
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: true,
        docs: [],
        forEach: (fn: any) => [],
        size: 0
      });

      const stats = await getTaskStats(mockFamilyId, mockParentId, mockChildId);

      expect(stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0
      });
    });
  });

  describe('getOverdueTasks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (collection as jest.Mock).mockReturnValue('tasks-collection');
      (query as jest.Mock).mockImplementation((...args) => args[0]);
      
      (Timestamp.fromDate as jest.Mock) = jest.fn().mockImplementation((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0
      }));
    });

    it('should identify overdue tasks', async () => {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 1);

      const overdueTasks = [
        {
          id: 'task1',
          data: () => ({
            ...mockTask,
            status: 'pending',
            dueDate: { toDate: () => pastDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          })
        }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: overdueTasks,
        forEach: (fn: any) => overdueTasks.forEach(fn),
        size: overdueTasks.length
      });

      const result = await getOverdueTasks(mockFamilyId, mockParentId);

      expect(query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should not include completed tasks', async () => {
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [],
        forEach: (fn: any) => [],
        size: 0
      });

      const result = await getOverdueTasks(mockFamilyId, mockParentId);

      expect(result).toHaveLength(0);
    });
  });

  describe('Security and Authorization', () => {
    it('should prevent users from accessing tasks in other families', async () => {
      (getFamily as jest.Mock).mockResolvedValueOnce(null);

      await expect(getFamilyTasks('other-family-123', mockParentId))
        .rejects.toThrow('Unauthorized: User is not a member of this family');
    });

    it('should validate all user inputs', async () => {
      const maliciousInput: CreateTaskInput = {
        title: '<script>alert("XSS")</script>',
        description: 'A'.repeat(501), // Exceeds max length
        categoryId: mockTaskCategory.id,
        assignedTo: mockChildId,
        priority: 'invalid' as any,
        isRecurring: false,
        requiresPhoto: false,
        reminderEnabled: false
      };

      await expect(createTask(mockFamilyId, mockParentId, maliciousInput))
        .rejects.toThrow();
    });

    it('should handle concurrent updates gracefully', async () => {
      // Mock a pending task for update
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, status: 'pending', createdBy: mockParentId })
      });

      // This would be tested with integration tests using real Firestore
      // For unit tests, we verify transaction usage
      await updateTask(mockTaskId, mockParentId, { title: 'Updated Title' });
      expect(runTransaction).toHaveBeenCalled();
    });
  });
});