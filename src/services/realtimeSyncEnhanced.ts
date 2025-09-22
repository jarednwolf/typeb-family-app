const realtimeSyncService = {
  onConnectionChange: jest.fn(),
  subscribeToTasks: jest.fn(() => jest.fn()),
  hasConflict: jest.fn(() => true),
  resolveConflict: jest.fn((local: any, server: any) => server),
  mergeData: jest.fn((local: any, server: any) => ({ ...server, ...local })),
  batchUpdates: jest.fn((updates: any[]) => [{ id: 'task1', updates: {} }, { id: 'task2', updates: {} }]),
  throttleUpdates: jest.fn((fn: any) => fn),
  getBackoffDelay: jest.fn((n: number) => Math.pow(2, n) * 100),
  validateTask: jest.fn((task: any) => !!task.title && !!task.familyId && !!task.createdBy),
  syncTask: jest.fn(async () => true),
  syncWithVersioning: jest.fn(async (data: any) => data.version > 1),
};

export default realtimeSyncService;

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  error?: string;
}

export interface OptimisticUpdate {
  id: string;
  collection: string;
  data: any;
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
  retryCount: number;
}

class RealtimeSyncEnhanced {
  private static instance: RealtimeSyncEnhanced;
  private listeners: Map<string, () => void> = new Map();
  private syncQueue: OptimisticUpdate[] = [];
  private isOnline: boolean = true;
  private syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
  };
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private conflictResolutionStrategy: 'lastWrite' | 'merge' | 'manual' = 'lastWrite';

  private constructor() {
    this.initializeNetworkListener();
    this.loadQueueFromStorage();
  }

  static getInstance(): RealtimeSyncEnhanced {
    if (!RealtimeSyncEnhanced.instance) {
      RealtimeSyncEnhanced.instance = new RealtimeSyncEnhanced();
    }
    return RealtimeSyncEnhanced.instance;
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      this.updateSyncStatus({ isOnline: this.isOnline });

      if (wasOffline && this.isOnline) {
        // Coming back online - process sync queue
        this.processSyncQueue();
      }
    });
  }

  /**
   * Subscribe to real-time updates for family tasks
   */
  subscribeFamilyTasks(
    familyId: string,
    callback: (tasks: any[]) => void,
    options?: {
      includeCompleted?: boolean;
      limit?: number;
    }
  ): () => void {
    const queryConstraints = [where('familyId', '==', familyId)];
    
    if (!options?.includeCompleted) {
      queryConstraints.push(where('status', '!=', 'completed'));
    }
    
    queryConstraints.push(orderBy('createdAt', 'desc'));
    
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }

    const q = query(collection(db, 'tasks'), ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          _hasPendingWrites: doc.metadata.hasPendingWrites,
        }));
        
        // Update last sync time if not from cache
        if (!snapshot.metadata.fromCache) {
          this.updateSyncStatus({ lastSyncTime: new Date() });
        }
        
        callback(tasks);
      },
      (error) => {
        console.error('Realtime sync error:', error);
        Sentry.captureException(error);
        this.updateSyncStatus({ error: error.message });
      }
    );

    this.listeners.set(`family-tasks-${familyId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to real-time updates for family members
   */
  subscribeFamilyMembers(
    familyId: string,
    callback: (members: any[]) => void
  ): () => void {
    const q = query(
      collection(db, 'users'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(members);
      },
      (error) => {
        console.error('Error syncing family members:', error);
        Sentry.captureException(error);
      }
    );

    this.listeners.set(`family-members-${familyId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Perform optimistic update with offline queue
   */
  async optimisticUpdate<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>,
    action: 'create' | 'update' | 'delete' = 'update'
  ): Promise<void> {
    const optimisticUpdate: OptimisticUpdate = {
      id: documentId,
      collection: collectionName,
      data,
      action,
      timestamp: new Date(),
      retryCount: 0,
    };

    if (this.isOnline) {
      // Try to apply immediately
      try {
        await this.applyUpdate(optimisticUpdate);
      } catch (error) {
        console.error('Failed to apply optimistic update:', error);
        // Add to queue for retry
        await this.addToQueue(optimisticUpdate);
      }
    } else {
      // Add to queue for later sync
      await this.addToQueue(optimisticUpdate);
    }
  }

  /**
   * Apply an update to Firestore
   */
  private async applyUpdate(update: OptimisticUpdate): Promise<void> {
    const docRef = doc(db, update.collection, update.id);

    switch (update.action) {
      case 'create':
        await setDoc(docRef, {
          ...update.data,
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp(),
        });
        break;

      case 'update':
        await updateDoc(docRef, {
          ...update.data,
          lastModified: serverTimestamp(),
        });
        break;

      case 'delete':
        // Soft delete
        await updateDoc(docRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
        });
        break;

      default:
        throw new Error(`Unknown action: ${update.action}`);
    }
  }

  /**
   * Add update to offline queue
   */
  private async addToQueue(update: OptimisticUpdate): Promise<void> {
    this.syncQueue.push(update);
    await this.saveQueueToStorage();
    this.updateSyncStatus({ pendingChanges: this.syncQueue.length });
  }

  /**
   * Process queued updates when back online
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0 || !this.isOnline) {
      return;
    }

    this.updateSyncStatus({ isSyncing: true });

    const failedUpdates: OptimisticUpdate[] = [];

    for (const update of this.syncQueue) {
      try {
        // Check for conflicts before applying
        const hasConflict = await this.checkForConflict(update);
        
        if (hasConflict) {
          const resolved = await this.resolveConflict(update);
          if (resolved) {
            await this.applyUpdate(resolved);
          }
        } else {
          await this.applyUpdate(update);
        }
      } catch (error) {
        console.error('Failed to sync update:', error);
        update.retryCount++;
        
        if (update.retryCount < 3) {
          failedUpdates.push(update);
        } else {
          // Log permanently failed update
          Sentry.captureException(new Error('Sync failed after 3 retries'), {
            extra: { update },
          });
        }
      }
    }

    // Update queue with failed updates
    this.syncQueue = failedUpdates;
    await this.saveQueueToStorage();
    
    this.updateSyncStatus({
      isSyncing: false,
      pendingChanges: this.syncQueue.length,
      lastSyncTime: new Date(),
    });
  }

  /**
   * Check if there's a conflict with server data
   */
  private async checkForConflict(update: OptimisticUpdate): Promise<boolean> {
    if (update.action === 'create') {
      return false; // No conflict for new documents
    }

    try {
      const docRef = doc(db, update.collection, update.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return update.action === 'update'; // Conflict if trying to update non-existent doc
      }

      const serverData = docSnap.data();
      const serverTimestamp = serverData.lastModified?.toDate();
      
      if (serverTimestamp && update.timestamp < serverTimestamp) {
        return true; // Server has newer data
      }

      return false;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return false;
    }
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflict(
    update: OptimisticUpdate
  ): Promise<OptimisticUpdate | null> {
    switch (this.conflictResolutionStrategy) {
      case 'lastWrite':
        // Use the update as-is (client wins)
        return update;

      case 'merge':
        // Merge with server data
        const docRef = doc(db, update.collection, update.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const serverData = docSnap.data();
          return {
            ...update,
            data: { ...serverData, ...update.data },
          };
        }
        return update;

      case 'manual':
        // Would typically prompt user or use custom logic
        console.warn('Manual conflict resolution required:', update);
        return null;

      default:
        return update;
    }
  }

  /**
   * Save sync queue to AsyncStorage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@sync_queue',
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from AsyncStorage
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('@sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        this.updateSyncStatus({ pendingChanges: this.syncQueue.length });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Update sync status and notify listeners
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.statusListeners.forEach(listener => listener(this.syncStatus));
  }

  /**
   * Subscribe to sync status updates
   */
  subscribeSyncStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.syncStatus); // Send initial status
    
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Force sync all pending changes
   */
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  /**
   * Clear all sync data and listeners
   */
  async cleanup(): Promise<void> {
    // Unsubscribe all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Clear status listeners
    this.statusListeners.clear();
    
    // Clear sync queue
    this.syncQueue = [];
    await AsyncStorage.removeItem('@sync_queue');
    
    // Reset status
    this.syncStatus = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      pendingChanges: 0,
    };
  }
}

export default RealtimeSyncEnhanced.getInstance();
