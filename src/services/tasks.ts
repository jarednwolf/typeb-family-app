/**
 * Task management service
 * Handles all task-related operations with Firestore
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
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrencePattern,
  ActivityLog,
  TaskCategory,
} from '../types/models';
import { getFamily } from './family';

// Collection references
const tasksCollection = collection(db, 'tasks');
const activityCollection = collection(db, 'activity');

/**
 * Create a new task
 */
export const createTask = async (
  familyId: string,
  userId: string,
  input: CreateTaskInput
): Promise<Task> => {
  try {
    // Get family to validate and resolve category
    const family = await getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
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

    const taskId = doc(tasksCollection).id;

    const newTask: Task = {
      id: taskId,
      familyId,
      title: input.title,
      description: input.description,
      category: category, // Store full category object
      assignedTo: input.assignedTo,
      assignedBy: userId,
      createdBy: userId,
      status: 'pending',
      requiresPhoto: input.requiresPhoto || false,
      dueDate: input.dueDate,
      isRecurring: input.isRecurring || false,
      recurrencePattern: input.recurrencePattern,
      reminderEnabled: input.reminderEnabled || false,
      reminderTime: input.reminderTime,
      escalationLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: input.priority || 'medium',
      points: input.points,
    };

    // Create task document - store category as nested object
    await setDoc(doc(tasksCollection, taskId), {
      ...newTask,
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
    });

    // Log activity
    await logActivity(familyId, userId, 'created', 'task', taskId, {
      taskTitle: input.title,
      assignedTo: input.assignedTo,
    });

    return newTask;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.message || 'Failed to create task');
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (
  taskId: string,
  userId: string,
  updates: UpdateTaskInput
): Promise<void> => {
  try {
    // Get current task for activity logging
    const taskDoc = await getDoc(doc(tasksCollection, taskId));
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    const currentTask = taskDoc.data() as Task;

    // If updating assignedTo, validate they're in the family
    if (updates.assignedTo) {
      const family = await getFamily(currentTask.familyId);
      if (!family?.memberIds.includes(updates.assignedTo)) {
        throw new Error('Cannot assign task to non-family member');
      }
    }

    // If updating category, resolve it
    let categoryUpdate: any = undefined;
    if (updates.categoryId) {
      const family = await getFamily(currentTask.familyId);
      const category = family?.taskCategories.find(c => c.id === updates.categoryId);
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

    // Prepare updates
    const taskUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove categoryId from updates since we're storing the full object
    delete taskUpdates.categoryId;
    
    if (categoryUpdate) {
      taskUpdates.category = categoryUpdate;
    }

    if (updates.dueDate) {
      taskUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    // Update task
    await updateDoc(doc(tasksCollection, taskId), taskUpdates);

    // Log activity based on what changed
    if (updates.status === 'completed' && currentTask.status !== 'completed') {
      await logActivity(currentTask.familyId, userId, 'completed', 'task', taskId, {
        taskTitle: currentTask.title,
      });
    } else if (updates.assignedTo && updates.assignedTo !== currentTask.assignedTo) {
      await logActivity(currentTask.familyId, userId, 'assigned', 'task', taskId, {
        taskTitle: currentTask.title,
        assignedTo: updates.assignedTo,
        previousAssignee: currentTask.assignedTo,
      });
    } else {
      await logActivity(currentTask.familyId, userId, 'updated', 'task', taskId, {
        taskTitle: currentTask.title,
        updates: Object.keys(updates),
      });
    }
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw new Error(error.message || 'Failed to update task');
  }
};

/**
 * Complete a task
 */
export const completeTask = async (
  taskId: string,
  userId: string,
  photoUrl?: string
): Promise<void> => {
  try {
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

    await updateDoc(doc(tasksCollection, taskId), updates);

    // Get task for activity logging
    const taskDoc = await getDoc(doc(tasksCollection, taskId));
    const task = taskDoc.data() as Task;

    await logActivity(task.familyId, userId, 'completed', 'task', taskId, {
      taskTitle: task.title,
      withPhoto: !!photoUrl,
    });

    // If recurring, create next occurrence
    if (task.isRecurring && task.recurrencePattern) {
      await createNextRecurrence(task);
    }
  } catch (error) {
    console.error('Error completing task:', error);
    throw new Error('Failed to complete task');
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (
  taskId: string,
  userId: string
): Promise<void> => {
  try {
    // Get task for activity logging
    const taskDoc = await getDoc(doc(tasksCollection, taskId));
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    const task = taskDoc.data() as Task;

    // Delete task
    await deleteDoc(doc(tasksCollection, taskId));

    // Log activity
    await logActivity(task.familyId, userId, 'deleted', 'task', taskId, {
      taskTitle: task.title,
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.message || 'Failed to delete task');
  }
};

/**
 * Get tasks for a family
 */
export const getFamilyTasks = async (
  familyId: string,
  filters?: {
    status?: TaskStatus;
    assignedTo?: string;
    priority?: TaskPriority;
    limit?: number;
  }
): Promise<Task[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting family tasks:', error);
    throw new Error('Failed to get tasks');
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
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw new Error('Failed to get user tasks');
  }
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = async (familyId: string): Promise<Task[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    throw new Error('Failed to get overdue tasks');
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
    }

    await updateDoc(doc(tasksCollection, taskId), updates);

    // Get task for activity logging
    const taskDoc = await getDoc(doc(tasksCollection, taskId));
    const task = taskDoc.data() as Task;

    await logActivity(task.familyId, validatorId, 'validated', 'task', taskId, {
      taskTitle: task.title,
      approved,
      notes,
    });
  } catch (error) {
    console.error('Error validating task:', error);
    throw new Error('Failed to validate task');
  }
};

/**
 * Subscribe to family tasks
 */
export const subscribeToFamilyTasks = (
  familyId: string,
  callback: (tasks: Task[]) => void,
  filters?: {
    status?: TaskStatus;
    assignedTo?: string;
  }
): Unsubscribe => {
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
    (error) => {
      console.error('Error subscribing to tasks:', error);
      callback([]);
    }
  );
};

/**
 * Create next occurrence of a recurring task
 */
const createNextRecurrence = async (task: Task): Promise<void> => {
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
  const newTask: Task = {
    ...task,
    id: doc(tasksCollection).id,
    status: 'pending',
    completedAt: undefined,
    completedBy: undefined,
    photoUrl: undefined,
    photoValidatedBy: undefined,
    validationStatus: undefined,
    validationNotes: undefined,
    dueDate: nextDueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    escalationLevel: 0,
    lastReminderSent: undefined,
  };

  await setDoc(doc(tasksCollection, newTask.id), {
    ...newTask,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    dueDate: Timestamp.fromDate(nextDueDate),
  });
};

/**
 * Log activity for audit trail
 */
const logActivity = async (
  familyId: string,
  userId: string,
  action: any,
  entityType: 'task' | 'family' | 'user',
  entityId: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const activityId = doc(activityCollection).id;
    
    await setDoc(doc(activityCollection, activityId), {
      id: activityId,
      familyId,
      userId,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging shouldn't break main operations
  }
};

/**
 * Get task statistics for dashboard
 */
export const getTaskStats = async (
  familyId: string,
  userId?: string
): Promise<{
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}> => {
  try {
    const constraints: QueryConstraint[] = [
      where('familyId', '==', familyId),
    ];

    if (userId) {
      constraints.push(where('assignedTo', '==', userId));
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
  } catch (error) {
    console.error('Error getting task stats:', error);
    throw new Error('Failed to get task statistics');
  }
};