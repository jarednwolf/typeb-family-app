/**
 * Task management service
 * Handles all task-related operations with Firestore
 * 
 * SECURITY: All operations validate user permissions
 * VALIDATION: All inputs are validated before processing
 * BUSINESS RULES: Photo validation, recurring tasks, etc. are enforced
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  QueryConstraint,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { checkAndRecordMilestone } from './milestones';
import { checkAchievementsOnTaskComplete } from './celebrations';
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrencePattern,
  ActivityLog,
  TaskCategory,
  User,
  Family,
} from '../types/models';
import { getFamily } from './family';
import { getCurrentUser } from './auth';
import realtimeSyncService from './realtimeSyncEnhanced';

// Collection references
const tasksCollection = collection(db, 'tasks');
const activityCollection = collection(db, 'activity');

// Validation constants
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const VALID_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

// Detect transient network errors to enable optimistic offline behavior
const isNetworkError = (error: any): boolean => {
  const code: string = error?.code || '';
  const message: string = (error?.message || '').toLowerCase();
  return (
    code.includes('unavailable') ||
    code.includes('network') ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch')
  );
};

/**
 * Validate user has permission to perform action on task
 */
const validateTaskPermission = async (
  taskId: string,
  userId: string,
  action: 'view' | 'update' | 'delete' | 'complete' | 'validate'
): Promise<{ task: Task; family: Family }> => {
  // Get task
  const taskDoc = await getDoc(doc(tasksCollection, taskId));
  if (!taskDoc.exists()) {
    throw new Error('Task not found');
  }
  const task = taskDoc.data() as Task;

  // Get family to check membership
  const family = await getFamily(task.familyId);
  if (!family) {
    throw new Error('Family not found');
  }

  // Check if user is in the family
  if (!family.memberIds.includes(userId)) {
    throw new Error('Unauthorized: User is not a member of this family');
  }

  // Check specific permissions based on action
  switch (action) {
    case 'view':
      // All family members can view tasks
      break;
    
    case 'update':
    case 'delete':
      // Only parents and the task creator can update/delete
      if (!family.parentIds.includes(userId) && task.createdBy !== userId) {
        throw new Error('Unauthorized: Only parents or task creator can perform this action');
      }
      break;
    
    case 'complete':
      // Only assigned user can complete their own task
      if (task.assignedTo !== userId) {
        throw new Error('Unauthorized: Only the assigned user can complete this task');
      }
      // Can't complete already completed tasks
      if (task.status === 'completed') {
        throw new Error('Task is already completed');
      }
      break;
    
    case 'validate':
      // Only parents can validate tasks
      if (!family.parentIds.includes(userId)) {
        throw new Error('Unauthorized: Only parents can validate tasks');
      }
      break;
  }

  return { task, family };
};

/**
 * Validate task input data
 */
const validateTaskInput = (input: CreateTaskInput | UpdateTaskInput): void => {
  // Title validation
  if ('title' in input) {
    if (!input.title || input.title.trim().length < MIN_TITLE_LENGTH) {
      throw new Error(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
    }
    if (input.title.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
    }
  }

  // Description validation
  if ('description' in input && input.description) {
    if (input.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  // Priority validation
  if ('priority' in input && input.priority) {
    if (!VALID_PRIORITIES.includes(input.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }
  }

  // Due date validation
  if ('dueDate' in input && input.dueDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    const dueDate = new Date(input.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < now) {
      throw new Error('Due date cannot be in the past');
    }
  }

  // Recurrence validation
  if ('isRecurring' in input && input.isRecurring) {
    if (!input.recurrencePattern) {
      throw new Error('Recurrence pattern is required for recurring tasks');
    }
    
    const pattern = input.recurrencePattern;
    if (!['daily', 'weekly', 'monthly'].includes(pattern.frequency)) {
      throw new Error('Invalid recurrence frequency');
    }
    
    if (pattern.interval && (pattern.interval < 1 || pattern.interval > 30)) {
      throw new Error('Recurrence interval must be between 1 and 30');
    }
    
    if (pattern.endDate && new Date(pattern.endDate) <= new Date()) {
      throw new Error('Recurrence end date must be in the future');
    }
  }

  // Points validation
  if ('points' in input && input.points !== undefined) {
    if (input.points < 0 || input.points > 1000) {
      throw new Error('Points must be between 0 and 1000');
    }
  }
};

/**
 * Create a new task with full validation
 */
export const createTask = async (
  familyId: string,
  userId: string,
  input: CreateTaskInput
): Promise<Task> => {
  try {
    // Validate input
    validateTaskInput(input);

    // Get family to validate membership and resolve category BEFORE transaction
    const family = await getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Verify user is a family member
    if (!family.memberIds.includes(userId)) {
      throw new Error('Unauthorized: User is not a member of this family');
    }

    // Only parents can create tasks
    if (!family.parentIds.includes(userId)) {
      throw new Error('Unauthorized: Only parents can create tasks');
    }

    // Validate assignedTo is a family member
    if (!family.memberIds.includes(input.assignedTo)) {
      throw new Error('Cannot assign task to non-family member');
    }

    // Resolve category
    const category = family.taskCategories.find(c => c.id === input.categoryId);
    if (!category) {
      throw new Error('Invalid task category');
    }

    // Validate photo requirement for premium features
    if (input.requiresPhoto && !family.isPremium) {
      throw new Error('Photo validation is a premium feature');
    }

    // Generate task ID before transaction
    const taskId = doc(tasksCollection).id;
    
    const newTask = await runTransaction(db, async (transaction) => {
      const taskData: any = {
        id: taskId,
        familyId,
        title: input.title.trim(),
        assignedTo: input.assignedTo,
        assignedBy: userId,
        createdBy: userId,
        status: 'pending',
        requiresPhoto: input.requiresPhoto || false,
        isRecurring: input.isRecurring || false,
        reminderEnabled: input.reminderEnabled || false,
        escalationLevel: 0,
        priority: input.priority || 'medium',
        category: {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          order: category.order,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add optional fields only if they exist
      if (input.description) {
        taskData.description = input.description.trim();
      }
      if (input.dueDate) {
        taskData.dueDate = Timestamp.fromDate(input.dueDate);
      }
      if (input.recurrencePattern) {
        taskData.recurrencePattern = input.recurrencePattern;
      }
      if (input.reminderTime) {
        taskData.reminderTime = input.reminderTime;
      }
      if (input.points !== undefined) {
        taskData.points = input.points;
      }
      
      // Create task document
      transaction.set(doc(tasksCollection, taskId), taskData);

      // Log activity
      const activityId = doc(activityCollection).id;
      transaction.set(doc(activityCollection, activityId), {
        id: activityId,
        familyId,
        userId,
        action: 'created',
        entityType: 'task',
        entityId: taskId,
        metadata: {
          taskTitle: input.title,
          assignedTo: input.assignedTo,
        },
        createdAt: serverTimestamp(),
      });

      return {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: input.dueDate,
      } as Task;
    });

    return newTask;
  } catch (error: any) {
    console.error('Error creating task:', error);
    // Fallback: optimistic offline create
    if (isNetworkError(error)) {
      try {
        const offlineTaskId = doc(tasksCollection).id;
        const offlineData: any = {
          id: offlineTaskId,
          familyId,
          title: input.title?.trim() || 'Untitled',
          description: input.description?.trim(),
          assignedTo: input.assignedTo,
          assignedBy: userId,
          createdBy: userId,
          status: 'pending' as TaskStatus,
          requiresPhoto: !!input.requiresPhoto,
          isRecurring: !!input.isRecurring,
          reminderEnabled: !!input.reminderEnabled,
          priority: input.priority || 'medium',
          category: input.categoryId
            ? { id: input.categoryId }
            : undefined,
          dueDate: input.dueDate || undefined,
          points: input.points,
          // createdAt / updatedAt will be set by server via serverTimestamp()
        };

        await realtimeSyncService.optimisticUpdate('tasks', offlineTaskId, offlineData, 'create');

        // Return a local placeholder so UI can reflect queued create
        return {
          ...(offlineData as Task),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Task;
      } catch (queueError: any) {
        console.error('Failed to queue offline task create:', queueError);
      }
    }
    throw new Error(error.message || 'Failed to create task');
  }
};

/**
 * Update an existing task with permission checks
 */
export const updateTask = async (
  taskId: string,
  userId: string,
  updates: UpdateTaskInput
): Promise<void> => {
  try {
    // Validate input
    validateTaskInput(updates);

    // Check permissions and get current task BEFORE transaction
    const { task: currentTask, family } = await validateTaskPermission(taskId, userId, 'update');

    // Prevent updating completed tasks (except for validation)
    if (currentTask.status === 'completed' && !updates.validationStatus) {
      throw new Error('Cannot update completed tasks');
    }

    // If updating assignedTo, validate they're in the family
    if (updates.assignedTo) {
      if (!family.memberIds.includes(updates.assignedTo)) {
        throw new Error('Cannot assign task to non-family member');
      }
    }

    // If updating category, resolve it
    let categoryUpdate: any = undefined;
    if (updates.categoryId) {
      const category = family.taskCategories.find(c => c.id === updates.categoryId);
      if (!category) {
        throw new Error('Invalid task category');
      }
      categoryUpdate = {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
      };
    }

    // If updating status, validate it
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      throw new Error('Invalid task status');
    }

    // Use transaction for consistency
    await runTransaction(db, async (transaction) => {
      // Prepare updates
      const taskUpdates: any = {
        updatedAt: serverTimestamp(),
      };

      // Add validated fields
      if (updates.title !== undefined) taskUpdates.title = updates.title.trim();
      if (updates.description !== undefined) taskUpdates.description = updates.description?.trim() || '';
      if (updates.priority !== undefined) taskUpdates.priority = updates.priority;
      if (updates.status !== undefined) taskUpdates.status = updates.status;
      if (updates.assignedTo !== undefined) taskUpdates.assignedTo = updates.assignedTo;
      if (updates.requiresPhoto !== undefined) taskUpdates.requiresPhoto = updates.requiresPhoto;
      if (updates.reminderEnabled !== undefined) taskUpdates.reminderEnabled = updates.reminderEnabled;
      if (updates.reminderTime !== undefined) taskUpdates.reminderTime = updates.reminderTime;
      if (updates.points !== undefined) taskUpdates.points = updates.points;
      
      if (categoryUpdate) {
        taskUpdates.category = categoryUpdate;
      }

      if (updates.dueDate) {
        taskUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
      }

      // Update task
      transaction.update(doc(tasksCollection, taskId), taskUpdates);

      // Log activity
      const activityId = doc(activityCollection).id;
      let activityAction = 'updated';
      const metadata: any = {
        taskTitle: currentTask.title,
        updates: Object.keys(updates),
      };

      if (updates.status === 'completed' && currentTask.status !== 'completed') {
        activityAction = 'completed';
      } else if (updates.assignedTo && updates.assignedTo !== currentTask.assignedTo) {
        activityAction = 'assigned';
        metadata.assignedTo = updates.assignedTo;
        metadata.previousAssignee = currentTask.assignedTo;
      }

      transaction.set(doc(activityCollection, activityId), {
        id: activityId,
        familyId: currentTask.familyId,
        userId,
        action: activityAction,
        entityType: 'task',
        entityId: taskId,
        metadata,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    // Fallback: optimistic offline update
    if (isNetworkError(error)) {
      try {
        const offlineUpdates: any = { ...updates };
        await realtimeSyncService.optimisticUpdate('tasks', taskId, offlineUpdates, 'update');
        return;
      } catch (queueError: any) {
        console.error('Failed to queue offline task update:', queueError);
      }
    }
    throw new Error(error.message || 'Failed to update task');
  }
};

/**
 * Complete a task with validation
 */
export const completeTask = async (
  taskId: string,
  userId: string,
  photoUrl?: string
): Promise<void> => {
  try {
    // Check permissions BEFORE transaction
    const { task, family } = await validateTaskPermission(taskId, userId, 'complete');

    // Enforce photo requirement
    if (task.requiresPhoto && !photoUrl) {
      throw new Error('Photo is required to complete this task');
    }

    // Use transaction
    await runTransaction(db, async (transaction) => {
      const updates: any = {
        status: 'completed' as TaskStatus,
        completedAt: serverTimestamp(),
        completedBy: userId,
        updatedAt: serverTimestamp(),
      };

      if (photoUrl) {
        updates.photoUrl = photoUrl;
        updates.validationStatus = 'pending';
      }

      transaction.update(doc(tasksCollection, taskId), updates);

      // Log activity
      const activityId = doc(activityCollection).id;
      transaction.set(doc(activityCollection, activityId), {
        id: activityId,
        familyId: task.familyId,
        userId,
        action: 'completed',
        entityType: 'task',
        entityId: taskId,
        metadata: {
          taskTitle: task.title,
          withPhoto: !!photoUrl,
        },
        createdAt: serverTimestamp(),
      });

      // If recurring, create next occurrence
      if (task.isRecurring && task.recurrencePattern && task.dueDate) {
        await createNextRecurrence(transaction, task);
      }
    });

    // Check for milestone achievements after successful completion
    try {
      // Calculate user's current accountability score
      const userStats = await getTaskStats(family.id, userId, userId);
      const accountabilityScore = userStats.completionRate; // This is already 0-100
      
      await checkAndRecordMilestone(userId, accountabilityScore);
    } catch (milestoneError) {
      // Log but don't fail the task completion if milestone check fails
      console.error('Error checking milestones:', milestoneError);
    }

    // Check for achievements and trigger celebrations
    try {
      await checkAchievementsOnTaskComplete(userId, family.id, task);
    } catch (achievementError) {
      // Log but don't fail the task completion if achievement check fails
      console.error('Error checking achievements:', achievementError);
    }
  } catch (error: any) {
    console.error('Error completing task:', error);
    // Fallback: optimistic offline completion
    if (isNetworkError(error)) {
      try {
        const updates: any = {
          status: 'completed' as TaskStatus,
          completedAt: new Date(),
          completedBy: userId,
        };
        if (photoUrl) {
          updates.photoUrl = photoUrl;
          updates.validationStatus = 'pending';
        }
        await realtimeSyncService.optimisticUpdate('tasks', taskId, updates, 'update');
        return;
      } catch (queueError: any) {
        console.error('Failed to queue offline task completion:', queueError);
      }
    }
    throw new Error(error.message || 'Failed to complete task');
  }
};

/**
 * Delete a task with permission check
 */
export const deleteTask = async (
  taskId: string,
  userId: string
): Promise<void> => {
  try {
    // Check permissions BEFORE transaction
    const { task } = await validateTaskPermission(taskId, userId, 'delete');

    // Prevent deleting completed tasks
    if (task.status === 'completed') {
      throw new Error('Cannot delete completed tasks');
    }

    // Use transaction
    await runTransaction(db, async (transaction) => {
      // Delete task
      transaction.delete(doc(tasksCollection, taskId));

      // Log activity
      const activityId = doc(activityCollection).id;
      transaction.set(doc(activityCollection, activityId), {
        id: activityId,
        familyId: task.familyId,
        userId,
        action: 'deleted',
        entityType: 'task',
        entityId: taskId,
        metadata: {
          taskTitle: task.title,
        },
        createdAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    // Fallback: optimistic offline delete (soft delete)
    if (isNetworkError(error)) {
      try {
        await realtimeSyncService.optimisticUpdate('tasks', taskId, { deleted: true }, 'delete');
        return;
      } catch (queueError: any) {
        console.error('Failed to queue offline task delete:', queueError);
      }
    }
    throw new Error(error.message || 'Failed to delete task');
  }
};

/**
 * Get tasks for a family with permission check
 */
export const getFamilyTasks = async (
  familyId: string,
  userId: string,
  filters?: {
    status?: TaskStatus;
    assignedTo?: string;
    priority?: TaskPriority;
    limit?: number;
  }
): Promise<Task[]> => {
  try {
    // Verify user is in the family
    const family = await getFamily(familyId);
    if (!family || !family.memberIds.includes(userId)) {
      throw new Error('Unauthorized: User is not a member of this family');
    }

    const constraints: QueryConstraint[] = [
      where('familyId', '==', familyId),
    ];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const q = query(tasksCollection, ...constraints);
    const snapshot = await getDocs(q);

    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
      } as Task);
    });

    return tasks;
  } catch (error: any) {
    console.error('Error getting family tasks:', error);
    throw new Error(error.message || 'Failed to get tasks');
  }
};

/**
 * Get user's assigned tasks
 */
export const getUserTasks = async (
  userId: string,
  familyId: string,
  status?: TaskStatus
): Promise<Task[]> => {
  try {
    // Verify user is in the family
    const family = await getFamily(familyId);
    if (!family || !family.memberIds.includes(userId)) {
      throw new Error('Unauthorized: User is not a member of this family');
    }

    const constraints: QueryConstraint[] = [
      where('familyId', '==', familyId),
      where('assignedTo', '==', userId),
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(tasksCollection, ...constraints);
    const snapshot = await getDocs(q);

    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
      } as Task);
    });

    return tasks;
  } catch (error: any) {
    console.error('Error getting user tasks:', error);
    throw new Error(error.message || 'Failed to get user tasks');
  }
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = async (
  familyId: string,
  userId: string
): Promise<Task[]> => {
  try {
    // Verify user is in the family
    const family = await getFamily(familyId);
    if (!family || !family.memberIds.includes(userId)) {
      throw new Error('Unauthorized: User is not a member of this family');
    }

    const now = new Date();
    const q = query(
      tasksCollection,
      where('familyId', '==', familyId),
      where('status', '==', 'pending'),
      where('dueDate', '<', Timestamp.fromDate(now)),
      orderBy('dueDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const tasks: Task[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
      } as Task);
    });

    return tasks;
  } catch (error: any) {
    console.error('Error getting overdue tasks:', error);
    throw new Error(error.message || 'Failed to get overdue tasks');
  }
};

/**
 * Validate a completed task (for parents)
 */
export const validateTask = async (
  taskId: string,
  validatorId: string,
  approved: boolean,
  notes?: string
): Promise<void> => {
  try {
    // Check permissions BEFORE transaction
    const { task } = await validateTaskPermission(taskId, validatorId, 'validate');

    // Task must be completed to validate
    if (task.status !== 'completed') {
      throw new Error('Can only validate completed tasks');
    }

    // Task must have a photo if photo was required
    if (task.requiresPhoto && !task.photoUrl) {
      throw new Error('Cannot validate task without required photo');
    }

    // Use transaction
    await runTransaction(db, async (transaction) => {
      const updates: any = {
        validationStatus: approved ? 'approved' : 'rejected',
        photoValidatedBy: validatorId,
        validationNotes: notes,
        updatedAt: serverTimestamp(),
      };

      if (!approved) {
        // If rejected, reset task to pending
        updates.status = 'pending';
        updates.completedAt = null;
        updates.completedBy = null;
        updates.photoUrl = null;
      }

      transaction.update(doc(tasksCollection, taskId), updates);

      // Log activity
      const activityId = doc(activityCollection).id;
      transaction.set(doc(activityCollection, activityId), {
        id: activityId,
        familyId: task.familyId,
        userId: validatorId,
        action: 'validated',
        entityType: 'task',
        entityId: taskId,
        metadata: {
          taskTitle: task.title,
          approved,
          notes,
        },
        createdAt: serverTimestamp(),
      });
    });
  } catch (error: any) {
    console.error('Error validating task:', error);
    throw new Error(error.message || 'Failed to validate task');
  }
};

/**
 * Subscribe to family tasks with permission check
 */
export const subscribeToFamilyTasks = (
  familyId: string,
  userId: string,
  callback: (tasks: Task[]) => void,
  filters?: {
    status?: TaskStatus;
    assignedTo?: string;
  }
): Unsubscribe => {
  // First verify permissions
  getFamily(familyId).then(family => {
    if (!family || !family.memberIds.includes(userId)) {
      callback([]);
      throw new Error('Unauthorized: User is not a member of this family');
    }
  }).catch(error => {
    console.error('Error verifying family membership:', error);
    callback([]);
  });

  const constraints: QueryConstraint[] = [
    where('familyId', '==', familyId),
  ];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.assignedTo) {
    constraints.push(where('assignedTo', '==', filters.assignedTo));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(tasksCollection, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
          completedAt: data.completedAt?.toDate(),
        } as Task);
      });
      callback(tasks);
    },
    (error: any) => {
      console.error('Error subscribing to tasks:', error);
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        console.log('Firestore index is being created. Tasks will load once the index is ready.');
      }
      callback([]);
    }
  );
};

/**
 * Create next occurrence of a recurring task
 */
const createNextRecurrence = async (
  transaction: any,
  task: Task
): Promise<void> => {
  if (!task.recurrencePattern || !task.dueDate) return;

  const pattern = task.recurrencePattern;
  const nextDueDate = new Date(task.dueDate);

  // Calculate next due date based on pattern
  switch (pattern.frequency) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + (pattern.interval || 1));
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + (pattern.interval || 1) * 7);
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + (pattern.interval || 1));
      break;
  }

  // Check if we've passed the end date
  if (pattern.endDate && nextDueDate > pattern.endDate) {
    return;
  }

  // Create new task with same properties but new due date
  const newTaskId = doc(tasksCollection).id;
  const newTaskData = {
    id: newTaskId,
    familyId: task.familyId,
    title: task.title,
    description: task.description,
    category: task.category,
    assignedTo: task.assignedTo,
    assignedBy: task.assignedBy,
    createdBy: task.createdBy,
    status: 'pending',
    requiresPhoto: task.requiresPhoto,
    priority: task.priority,
    points: task.points,
    isRecurring: true,
    recurrencePattern: task.recurrencePattern,
    reminderEnabled: task.reminderEnabled,
    reminderTime: task.reminderTime,
    dueDate: Timestamp.fromDate(nextDueDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    escalationLevel: 0,
  };

  transaction.set(doc(tasksCollection, newTaskId), newTaskData);
};

/**
 * Get task statistics for dashboard
 */
export const getTaskStats = async (
  familyId: string,
  userId: string,
  targetUserId?: string
): Promise<{
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}> => {
  try {
    // Verify user is in the family
    const family = await getFamily(familyId);
    if (!family || !family.memberIds.includes(userId)) {
      throw new Error('Unauthorized: User is not a member of this family');
    }

    const constraints: QueryConstraint[] = [
      where('familyId', '==', familyId),
    ];

    if (targetUserId) {
      constraints.push(where('assignedTo', '==', targetUserId));
    }

    const q = query(tasksCollection, ...constraints);
    const snapshot = await getDocs(q);

    let total = 0;
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();
      total++;

      if (data.status === 'completed') {
        completed++;
      } else if (data.status === 'pending') {
        pending++;
        if (data.dueDate && data.dueDate.toDate() < now) {
          overdue++;
        }
      }
    });

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate: Math.round(completionRate),
    };
  } catch (error: any) {
    console.error('Error getting task stats:', error);
    throw new Error(error.message || 'Failed to get task statistics');
  }
};