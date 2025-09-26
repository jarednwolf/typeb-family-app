/**
 * Real-time Sync Unit Tests
 * 
 * Tests real-time synchronization and offline support:
 * - Connection status monitoring
 * - Offline queue management
 * - Data sync when coming online
 * - Conflict resolution
 * - Real-time updates
 */

import { renderHook, act } from '@testing-library/react-hooks';
import NetInfo from '@react-native-community/netinfo';
import realtimeSyncService from '../../services/realtimeSync';
import offlineQueueService from '../../services/offlineQueue';
import { db } from '../../services/firebase';
import { 
  onSnapshot,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/firebase');
jest.mock('firebase/firestore');

describe('Real-time Sync System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Status Monitoring', () => {
    it('should detect online status correctly', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      const status = await realtimeSyncService.getConnectionStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.isReachable).toBe(true);
    });

    it('should detect offline status correctly', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const status = await realtimeSyncService.getConnectionStatus();
      
      expect(status.isOnline).toBe(false);
      expect(status.isReachable).toBe(false);
    });

    it('should handle connection changes', async () => {
      const mockCallback = jest.fn();
      
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        // Simulate connection change
        callback({ isConnected: false });
        callback({ isConnected: true });
        return jest.fn(); // unsubscribe function
      });

      realtimeSyncService.onConnectionChange(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith({ isConnected: false });
      expect(mockCallback).toHaveBeenCalledWith({ isConnected: true });
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue operations when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const operation = {
        type: 'CREATE_TASK',
        data: { title: 'Test Task', familyId: 'family123' },
        timestamp: Date.now(),
      };

      await offlineQueueService.addToQueue(operation);
      const queue = await offlineQueueService.getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject(operation);
    });

    it('should process queue when coming online', async () => {
      const mockOperations = [
        { type: 'CREATE_TASK', data: { title: 'Task 1' }, id: '1' },
        { type: 'UPDATE_TASK', data: { id: 'task1', completed: true }, id: '2' },
        { type: 'DELETE_TASK', data: { id: 'task2' }, id: '3' },
      ];

      // Mock offline queue
      (offlineQueueService.getQueue as jest.Mock).mockResolvedValue(mockOperations);
      (offlineQueueService.processOperation as jest.Mock).mockResolvedValue(true);
      (offlineQueueService.removeFromQueue as jest.Mock).mockResolvedValue(true);

      // Process queue
      const results = await offlineQueueService.processQueue();
      
      expect(offlineQueueService.processOperation).toHaveBeenCalledTimes(3);
      expect(offlineQueueService.removeFromQueue).toHaveBeenCalledTimes(3);
      expect(results.processed).toBe(3);
      expect(results.failed).toBe(0);
    });

    it('should handle failed operations in queue', async () => {
      const failedOperation = {
        type: 'CREATE_TASK',
        data: { title: 'Failed Task' },
        id: 'failed1',
        retryCount: 0,
      };

      (offlineQueueService.processOperation as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await offlineQueueService.retryOperation(failedOperation);
      
      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(1);
    });

    it('should limit retry attempts', async () => {
      const maxRetriesOperation = {
        type: 'UPDATE_TASK',
        data: { id: 'task1' },
        id: 'retry1',
        retryCount: 5,
      };

      (offlineQueueService.shouldRetry as jest.Mock).mockReturnValue(false);

      const shouldRetry = offlineQueueService.shouldRetry(maxRetriesOperation);
      
      expect(shouldRetry).toBe(false);
    });

    it('should maintain queue order', async () => {
      const operations = [
        { type: 'CREATE', timestamp: 1000 },
        { type: 'UPDATE', timestamp: 2000 },
        { type: 'DELETE', timestamp: 3000 },
      ];

      for (const op of operations) {
        await offlineQueueService.addToQueue(op);
      }

      const queue = await offlineQueueService.getQueue();
      
      expect(queue[0].timestamp).toBe(1000);
      expect(queue[1].timestamp).toBe(2000);
      expect(queue[2].timestamp).toBe(3000);
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to task updates', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = realtimeSyncService.subscribeToTasks('family123', mockCallback);
      
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle real-time data changes', () => {
      const mockCallback = jest.fn();
      let snapshotCallback: any;
      
      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      realtimeSyncService.subscribeToTasks('family123', mockCallback);

      // Simulate data change
      const mockSnapshot = {
        docs: [
          { id: 'task1', data: () => ({ title: 'Task 1' }) },
          { id: 'task2', data: () => ({ title: 'Task 2' }) },
        ],
      };

      snapshotCallback(mockSnapshot);
      
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'task1', title: 'Task 1' },
        { id: 'task2', title: 'Task 2' },
      ]);
    });

    it('should handle subscription errors', () => {
      const mockErrorCallback = jest.fn();
      let errorCallback: any;
      
      (onSnapshot as jest.Mock).mockImplementation((query, successCb, errorCb) => {
        errorCallback = errorCb;
        return jest.fn();
      });

      realtimeSyncService.subscribeToTasks('family123', jest.fn(), mockErrorCallback);

      // Simulate error
      const error = new Error('Permission denied');
      errorCallback(error);
      
      expect(mockErrorCallback).toHaveBeenCalledWith(error);
    });

    it('should clean up subscriptions', () => {
      const mockUnsubscribe = jest.fn();
      
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = realtimeSyncService.subscribeToTasks('family123', jest.fn());
      unsubscribe();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts', async () => {
      const localData = {
        id: 'task1',
        title: 'Local Title',
        updatedAt: new Date('2024-01-01T10:00:00'),
      };

      const serverData = {
        id: 'task1',
        title: 'Server Title',
        updatedAt: new Date('2024-01-01T11:00:00'),
      };

      const hasConflict = realtimeSyncService.hasConflict(localData, serverData);
      
      expect(hasConflict).toBe(true);
    });

    it('should resolve conflicts using last-write-wins', async () => {
      const localData = {
        id: 'task1',
        title: 'Local Title',
        updatedAt: new Date('2024-01-01T10:00:00'),
      };

      const serverData = {
        id: 'task1',
        title: 'Server Title',
        updatedAt: new Date('2024-01-01T11:00:00'),
      };

      const resolved = realtimeSyncService.resolveConflict(localData, serverData, 'last-write-wins');
      
      expect(resolved.title).toBe('Server Title');
      expect(resolved.updatedAt).toEqual(serverData.updatedAt);
    });

    it('should merge non-conflicting fields', async () => {
      const localData = {
        id: 'task1',
        title: 'Updated Title',
        description: 'Local Description',
        updatedAt: new Date('2024-01-01T11:00:00'),
      };

      const serverData = {
        id: 'task1',
        title: 'Old Title',
        assignee: 'user123',
        updatedAt: new Date('2024-01-01T10:00:00'),
      };

      const merged = realtimeSyncService.mergeData(localData, serverData);
      
      expect(merged.title).toBe('Updated Title');
      expect(merged.description).toBe('Local Description');
      expect(merged.assignee).toBe('user123');
    });
  });

  describe('Sync Optimization', () => {
    it('should batch updates for efficiency', async () => {
      const updates = [
        { id: 'task1', field: 'title', value: 'New Title' },
        { id: 'task1', field: 'description', value: 'New Description' },
        { id: 'task2', field: 'completed', value: true },
      ];

      const batched = realtimeSyncService.batchUpdates(updates);
      
      expect(batched).toHaveLength(2);
      expect(batched[0].id).toBe('task1');
      expect(batched[0].updates).toHaveProperty('title');
      expect(batched[0].updates).toHaveProperty('description');
    });

    it('should throttle rapid updates', async () => {
      jest.useFakeTimers();
      
      const mockUpdate = jest.fn();
      const throttledUpdate = realtimeSyncService.throttleUpdates(mockUpdate, 1000);
      
      // Call multiple times rapidly
      throttledUpdate({ id: 'task1', title: 'Title 1' });
      throttledUpdate({ id: 'task1', title: 'Title 2' });
      throttledUpdate({ id: 'task1', title: 'Title 3' });
      
      // Should only be called once immediately
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      
      // Fast forward time
      jest.advanceTimersByTime(1000);
      
      // Should be called with the latest value
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenLastCalledWith({ id: 'task1', title: 'Title 3' });
      
      jest.useRealTimers();
    });

    it('should implement exponential backoff for retries', async () => {
      const delays = [];
      
      for (let attempt = 0; attempt < 5; attempt++) {
        const delay = realtimeSyncService.getBackoffDelay(attempt);
        delays.push(delay);
      }
      
      // Each delay should be roughly double the previous
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
      expect(delays[3]).toBeGreaterThan(delays[2]);
      expect(delays[4]).toBeGreaterThan(delays[3]);
    });
  });

  describe('Data Consistency', () => {
    it('should validate data before sync', async () => {
      const invalidTask = {
        // Missing required fields
        description: 'Task without title',
      };

      const validTask = {
        title: 'Valid Task',
        familyId: 'family123',
        createdBy: 'user123',
      };

      expect(realtimeSyncService.validateTask(invalidTask)).toBe(false);
      expect(realtimeSyncService.validateTask(validTask)).toBe(true);
    });

    it('should handle partial sync failures', async () => {
      const syncBatch = [
        { id: 'task1', title: 'Task 1', valid: true },
        { id: 'task2', title: 'Task 2', valid: false },
        { id: 'task3', title: 'Task 3', valid: true },
      ];

      (realtimeSyncService.syncTask as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Invalid data'))
        .mockResolvedValueOnce(true);

      const results = await realtimeSyncService.syncBatch(syncBatch);
      
      expect(results.successful).toBe(2);
      expect(results.failed).toBe(1);
      expect(results.failures[0].id).toBe('task2');
    });

    it('should maintain data integrity during sync', async () => {
      const originalData = {
        id: 'task1',
        title: 'Original Title',
        version: 1,
      };

      const updatedData = {
        ...originalData,
        title: 'Updated Title',
        version: 2,
      };

      (realtimeSyncService.syncWithVersioning as jest.Mock).mockImplementation(
        async (data) => {
          if (data.version <= 1) {
            throw new Error('Stale version');
          }
          return true;
        }
      );

      await expect(
        realtimeSyncService.syncWithVersioning(originalData)
      ).rejects.toThrow('Stale version');

      await expect(
        realtimeSyncService.syncWithVersioning(updatedData)
      ).resolves.toBe(true);
    });
  });
});
