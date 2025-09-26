/**
 * Offline Queue Service - Manages operations when offline
 * 
 * Features:
 * - Queue failed requests for retry
 * - Automatic retry with exponential backoff
 * - Network state monitoring
 * - Persistent queue storage
 * - Progress notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

// Queue item interface
export interface QueueItem {
  id: string;
  type: 'task_create' | 'task_update' | 'task_delete' | 'family_update' | 'photo_upload' | 'other';
  operation: () => Promise<any>;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  priority: 'high' | 'normal' | 'low';
}

// Queue status interface
export interface QueueStatus {
  isOnline: boolean;
  isProcessing: boolean;
  queueLength: number;
  failedItems: number;
  processingItem?: QueueItem;
}

// Queue events
export type QueueEvent = 
  | 'item_added'
  | 'item_processed'
  | 'item_failed'
  | 'item_removed'
  | 'queue_started'
  | 'queue_stopped'
  | 'status_changed'
  | 'network_changed';

class OfflineQueueService extends EventEmitter {
  private static instance: OfflineQueueService;
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private isOnline = true;
  private processingItem: QueueItem | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly STORAGE_KEY = '@typeb_offline_queue';
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 60000; // 1 minute

  private constructor() {
    super();
    this.initializeNetworkListener();
    this.loadQueue();
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      
      if (!wasOnline && this.isOnline) {
        // Network restored - process queue
        console.log('[OfflineQueue] Network restored, processing queue...');
        this.emit('network_changed', { isOnline: true });
        this.processQueue();
      } else if (wasOnline && !this.isOnline) {
        // Network lost
        console.log('[OfflineQueue] Network lost, pausing queue processing...');
        this.emit('network_changed', { isOnline: false });
      }
      
      this.emitStatusChange();
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      this.emitStatusChange();
    });
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        // Reconstruct queue items (operations can't be serialized)
        this.queue = items.map((item: any) => ({
          ...item,
          operation: () => this.recreateOperation(item),
        }));
        
        if (this.queue.length > 0) {
          console.log(`[OfflineQueue] Loaded ${this.queue.length} items from storage`);
          this.processQueue();
        }
      }
    } catch (error) {
      console.error('[OfflineQueue] Error loading queue:', error);
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueue(): Promise<void> {
    try {
      // Save queue without functions (they can't be serialized)
      const items = this.queue.map(({ operation, ...item }) => item);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[OfflineQueue] Error saving queue:', error);
    }
  }

  /**
   * Recreate operation from stored payload
   */
  private async recreateOperation(item: any): Promise<any> {
    // This should be implemented based on your specific operations
    // For now, return a placeholder that rejects
    throw new Error(`Cannot recreate operation for type: ${item.type}`);
  }

  /**
   * Add item to queue
   */
  async addToQueue(
    type: QueueItem['type'],
    operation: () => Promise<any>,
    payload: any,
    options: {
      priority?: QueueItem['priority'];
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    // Check queue size limit
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest low-priority items
      const removed = this.queue
        .filter(item => item.priority === 'low')
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 5);
      
      removed.forEach(item => this.removeFromQueue(item.id));
    }

    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      operation,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries ?? 5,
      priority: options.priority ?? 'normal',
    };

    // Add to queue based on priority
    if (item.priority === 'high') {
      this.queue.unshift(item);
    } else if (item.priority === 'low') {
      this.queue.push(item);
    } else {
      // Normal priority - add after high priority items
      const highPriorityCount = this.queue.filter(i => i.priority === 'high').length;
      this.queue.splice(highPriorityCount, 0, item);
    }

    await this.saveQueue();
    this.emit('item_added', item);
    this.emitStatusChange();

    // Try to process immediately if online
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }

    return item.id;
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      
      // Clear any retry timeout
      const timeout = this.retryTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.retryTimeouts.delete(id);
      }
      
      this.saveQueue();
      this.emit('item_removed', removed);
      this.emitStatusChange();
      return true;
    }
    return false;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.emit('queue_started');
    this.emitStatusChange();

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];
      this.processingItem = item;
      this.emitStatusChange();

      try {
        console.log(`[OfflineQueue] Processing item ${item.id} (${item.type})`);
        
        // Execute the operation
        const result = await item.operation();
        
        // Success - remove from queue
        this.queue.shift();
        this.processingItem = null;
        await this.saveQueue();
        
        this.emit('item_processed', { item, result });
        console.log(`[OfflineQueue] Successfully processed item ${item.id}`);
        
      } catch (error: any) {
        console.error(`[OfflineQueue] Error processing item ${item.id}:`, error);
        
        item.retryCount++;
        item.lastError = error.message || 'Unknown error';
        
        if (item.retryCount >= item.maxRetries) {
          // Max retries reached - remove from queue
          this.queue.shift();
          this.processingItem = null;
          await this.saveQueue();
          
          this.emit('item_failed', { item, error });
          console.log(`[OfflineQueue] Item ${item.id} failed after ${item.maxRetries} retries`);
          
        } else {
          // Schedule retry with exponential backoff
          const delay = Math.min(
            this.BASE_RETRY_DELAY * Math.pow(2, item.retryCount - 1),
            this.MAX_RETRY_DELAY
          );
          
          console.log(`[OfflineQueue] Scheduling retry for item ${item.id} in ${delay}ms`);
          
          // Move to back of queue (respecting priority)
          this.queue.shift();
          if (item.priority === 'high') {
            const highPriorityCount = this.queue.filter(i => i.priority === 'high').length;
            this.queue.splice(highPriorityCount, 0, item);
          } else if (item.priority === 'normal') {
            const nonLowPriorityCount = this.queue.filter(i => i.priority !== 'low').length;
            this.queue.splice(nonLowPriorityCount, 0, item);
          } else {
            this.queue.push(item);
          }
          
          this.processingItem = null;
          await this.saveQueue();
          
          // Schedule retry
          const timeout = setTimeout(() => {
            this.retryTimeouts.delete(item.id);
            if (this.isOnline) {
              this.processQueue();
            }
          }, delay);
          
          this.retryTimeouts.set(item.id, timeout);
          
          // Break to allow retry delay
          break;
        }
      }
      
      this.emitStatusChange();
    }

    this.isProcessing = false;
    this.processingItem = null;
    this.emit('queue_stopped');
    this.emitStatusChange();
  }

  /**
   * Get current queue status
   */
  getStatus(): QueueStatus {
    return {
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      failedItems: this.queue.filter(item => item.retryCount > 0).length,
      processingItem: this.processingItem || undefined,
    };
  }

  /**
   * Get queue items
   */
  getQueueItems(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    this.queue = [];
    this.processingItem = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    
    this.emitStatusChange();
  }

  /**
   * Retry specific item immediately
   */
  retryItem(id: string): void {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      // Clear any existing retry timeout
      const timeout = this.retryTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.retryTimeouts.delete(id);
      }
      
      // Move to front of queue (respecting priority)
      const index = this.queue.indexOf(item);
      this.queue.splice(index, 1);
      
      if (item.priority === 'high' || item.priority === 'normal') {
        this.queue.unshift(item);
      } else {
        const nonLowPriorityCount = this.queue.filter(i => i.priority !== 'low').length;
        this.queue.splice(nonLowPriorityCount, 0, item);
      }
      
      // Process if not already processing
      if (this.isOnline && !this.isProcessing) {
        this.processQueue();
      }
    }
  }

  /**
   * Emit status change event
   */
  private emitStatusChange(): void {
    this.emit('status_changed', this.getStatus());
  }

  /**
   * Pause queue processing
   */
  pauseProcessing(): void {
    this.isProcessing = false;
    this.processingItem = null;
    this.emit('queue_stopped');
    this.emitStatusChange();
  }

  /**
   * Resume queue processing
   */
  resumeProcessing(): void {
    if (this.isOnline && !this.isProcessing && this.queue.length > 0) {
      this.processQueue();
    }
  }
}

// Export singleton instance
export const offlineQueue = OfflineQueueService.getInstance();

// Export convenience functions
export const addToOfflineQueue = offlineQueue.addToQueue.bind(offlineQueue);
export const getQueueStatus = offlineQueue.getStatus.bind(offlineQueue);
export const getQueueItems = offlineQueue.getQueueItems.bind(offlineQueue);
export const clearOfflineQueue = offlineQueue.clearQueue.bind(offlineQueue);
export const retryQueueItem = offlineQueue.retryItem.bind(offlineQueue);
export const removeFromOfflineQueue = offlineQueue.removeFromQueue.bind(offlineQueue);

export default offlineQueue;