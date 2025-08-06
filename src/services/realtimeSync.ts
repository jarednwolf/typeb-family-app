/**
 * Real-time sync service
 * Manages Firestore listeners and Redux store synchronization
 */

import { Unsubscribe } from 'firebase/firestore';
import { store } from '../store/store';
import { setFamily, setMembers } from '../store/slices/familySlice';
import { setTasks, setUserTasks, setOverdueTasks, setStats } from '../store/slices/tasksSlice';
import * as familyService from './family';
import * as tasksService from './tasks';

class RealtimeSyncService {
  private listeners: Map<string, Unsubscribe> = new Map();
  private familyId: string | null = null;
  private userId: string | null = null;

  /**
   * Initialize real-time sync for a user
   */
  initialize(userId: string, familyId: string | null) {
    this.cleanup(); // Clean up any existing listeners
    this.userId = userId;
    this.familyId = familyId;

    if (familyId) {
      this.startFamilySync(familyId);
      this.startTasksSync(familyId, userId);
    }
  }

  /**
   * Start syncing family data
   */
  private startFamilySync(familyId: string) {
    // Subscribe to family updates
    const familyUnsubscribe = familyService.subscribeToFamily(
      familyId,
      (family) => {
        if (family) {
          store.dispatch(setFamily(family));
          
          // Subscribe to family members
          this.startMembersSync(family.memberIds);
        } else {
          // Family was deleted or user lost access
          store.dispatch(setFamily(null));
          store.dispatch(setMembers([]));
          this.cleanup();
        }
      }
    );

    this.listeners.set('family', familyUnsubscribe);
  }

  /**
   * Start syncing family members
   */
  private startMembersSync(memberIds: string[]) {
    // Unsubscribe from previous members listener if exists
    const existingListener = this.listeners.get('members');
    if (existingListener) {
      existingListener();
    }

    // Subscribe to members updates
    const membersUnsubscribe = familyService.subscribeToFamilyMembers(
      memberIds,
      (members) => {
        store.dispatch(setMembers(members));
      }
    );

    this.listeners.set('members', membersUnsubscribe);
  }

  /**
   * Start syncing tasks
   */
  private startTasksSync(familyId: string, userId: string) {
    // Subscribe to all family tasks
    const tasksUnsubscribe = tasksService.subscribeToFamilyTasks(
      familyId,
      (tasks) => {
        store.dispatch(setTasks(tasks));
        
        // Filter user tasks
        const userTasks = tasks.filter(t => t.assignedTo === userId);
        store.dispatch(setUserTasks(userTasks));
        
        // Filter overdue tasks
        const now = new Date();
        const overdueTasks = tasks.filter(
          t => t.status === 'pending' && t.dueDate && t.dueDate < now
        );
        store.dispatch(setOverdueTasks(overdueTasks));
        
        // Calculate stats
        this.updateTaskStats(tasks, userId);
      }
    );

    this.listeners.set('tasks', tasksUnsubscribe);
  }

  /**
   * Update task statistics
   */
  private updateTaskStats(tasks: any[], userId: string) {
    let total = 0;
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    const now = new Date();

    // Calculate stats for user's tasks only
    const userTasks = tasks.filter(t => t.assignedTo === userId);
    
    userTasks.forEach((task) => {
      total++;
      
      if (task.status === 'completed') {
        completed++;
      } else if (task.status === 'pending') {
        pending++;
        if (task.dueDate && task.dueDate < now) {
          overdue++;
        }
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    store.dispatch(setStats({
      total,
      pending,
      completed,
      overdue,
      completionRate,
    }));
  }

  /**
   * Update family ID and restart sync
   */
  updateFamily(familyId: string | null) {
    if (this.familyId === familyId) return; // No change
    
    this.familyId = familyId;
    
    if (this.userId) {
      this.initialize(this.userId, familyId);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Check if sync is active
   */
  isActive(): boolean {
    return this.listeners.size > 0;
  }

  /**
   * Get current sync status
   */
  getStatus(): {
    isActive: boolean;
    familyId: string | null;
    userId: string | null;
    activeListeners: string[];
  } {
    return {
      isActive: this.isActive(),
      familyId: this.familyId,
      userId: this.userId,
      activeListeners: Array.from(this.listeners.keys()),
    };
  }
}

// Create singleton instance
const realtimeSyncService = new RealtimeSyncService();

export default realtimeSyncService;

/**
 * Hook to use real-time sync in components
 */
export const useRealtimeSync = () => {
  return {
    initialize: (userId: string, familyId: string | null) => 
      realtimeSyncService.initialize(userId, familyId),
    updateFamily: (familyId: string | null) => 
      realtimeSyncService.updateFamily(familyId),
    cleanup: () => realtimeSyncService.cleanup(),
    isActive: () => realtimeSyncService.isActive(),
    getStatus: () => realtimeSyncService.getStatus(),
  };
};