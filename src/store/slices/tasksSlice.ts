/**
 * Tasks Redux slice
 * Manages task state and real-time sync
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../../types/models';
import * as tasksService from '../../services/tasks';

interface TasksState {
  tasks: Task[];
  userTasks: Task[];
  overdueTasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  filters: {
    status?: TaskStatus;
    assignedTo?: string;
    priority?: TaskPriority;
  };
}

const initialState: TasksState = {
  tasks: [],
  userTasks: [],
  overdueTasks: [],
  selectedTask: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
  },
  filters: {},
};

// Async thunks
export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ familyId, userId, input }: { familyId: string; userId: string; input: CreateTaskInput }) => {
    const task = await tasksService.createTask(familyId, userId, input);
    return task;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, userId, updates }: { taskId: string; userId: string; updates: UpdateTaskInput }) => {
    await tasksService.updateTask(taskId, userId, updates);
    return { taskId, updates };
  }
);

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async ({ taskId, userId, photoUrl }: { taskId: string; userId: string; photoUrl?: string }) => {
    await tasksService.completeTask(taskId, userId, photoUrl);
    return { taskId, photoUrl };
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async ({ taskId, userId }: { taskId: string; userId: string }) => {
    await tasksService.deleteTask(taskId, userId);
    return taskId;
  }
);

export const fetchFamilyTasks = createAsyncThunk(
  'tasks/fetchFamily',
  async ({ familyId, filters }: { 
    familyId: string; 
    filters?: { status?: TaskStatus; assignedTo?: string; priority?: TaskPriority; limit?: number } 
  }) => {
    const tasks = await tasksService.getFamilyTasks(familyId, filters);
    return tasks;
  }
);

export const fetchUserTasks = createAsyncThunk(
  'tasks/fetchUser',
  async ({ userId, familyId, status }: { userId: string; familyId: string; status?: TaskStatus }) => {
    const tasks = await tasksService.getUserTasks(userId, familyId, status);
    return tasks;
  }
);

export const fetchOverdueTasks = createAsyncThunk(
  'tasks/fetchOverdue',
  async (familyId: string) => {
    const tasks = await tasksService.getOverdueTasks(familyId);
    return tasks;
  }
);

export const validateTask = createAsyncThunk(
  'tasks/validate',
  async ({ taskId, validatorId, approved, notes }: { 
    taskId: string; 
    validatorId: string; 
    approved: boolean; 
    notes?: string 
  }) => {
    await tasksService.validateTask(taskId, validatorId, approved, notes);
    return { taskId, approved, notes };
  }
);

export const fetchTaskStats = createAsyncThunk(
  'tasks/fetchStats',
  async ({ familyId, userId }: { familyId: string; userId?: string }) => {
    const stats = await tasksService.getTaskStats(familyId, userId);
    return stats;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    setUserTasks: (state, action: PayloadAction<Task[]>) => {
      state.userTasks = action.payload;
    },
    setOverdueTasks: (state, action: PayloadAction<Task[]>) => {
      state.overdueTasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
      // Update stats
      state.stats.total++;
      if (action.payload.status === 'pending') {
        state.stats.pending++;
      }
    },
    updateTaskInList: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const oldTask = state.tasks[index];
        state.tasks[index] = action.payload;
        
        // Update stats if status changed
        if (oldTask.status !== action.payload.status) {
          if (oldTask.status === 'pending') state.stats.pending--;
          if (oldTask.status === 'completed') state.stats.completed--;
          if (action.payload.status === 'pending') state.stats.pending++;
          if (action.payload.status === 'completed') state.stats.completed++;
          
          // Recalculate completion rate
          if (state.stats.total > 0) {
            state.stats.completionRate = Math.round((state.stats.completed / state.stats.total) * 100);
          }
        }
      }
      
      // Also update in userTasks if present
      const userIndex = state.userTasks.findIndex(t => t.id === action.payload.id);
      if (userIndex !== -1) {
        state.userTasks[userIndex] = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        // Update stats
        state.stats.total--;
        if (task.status === 'pending') state.stats.pending--;
        if (task.status === 'completed') state.stats.completed--;
        
        // Recalculate completion rate
        if (state.stats.total > 0) {
          state.stats.completionRate = Math.round((state.stats.completed / state.stats.total) * 100);
        } else {
          state.stats.completionRate = 0;
        }
      }
      
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      state.userTasks = state.userTasks.filter(t => t.id !== action.payload);
      state.overdueTasks = state.overdueTasks.filter(t => t.id !== action.payload);
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    setFilters: (state, action: PayloadAction<TasksState['filters']>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setStats: (state, action: PayloadAction<TasksState['stats']>) => {
      state.stats = action.payload;
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.userTasks = [];
      state.overdueTasks = [];
      state.selectedTask = null;
      state.error = null;
      state.filters = {};
      state.stats = {
        total: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
      };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isCreating = false;
        state.tasks.unshift(action.payload);
        state.stats.total++;
        state.stats.pending++;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || 'Failed to create task';
      });

    // Update task
    builder
      .addCase(updateTask.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { taskId, updates } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          Object.assign(task, updates);
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || 'Failed to update task';
      });

    // Complete task
    builder
      .addCase(completeTask.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { taskId, photoUrl } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = 'completed';
          task.completedAt = new Date();
          if (photoUrl) {
            task.photoUrl = photoUrl;
            task.validationStatus = 'pending';
          }
          // Update stats
          state.stats.pending--;
          state.stats.completed++;
          state.stats.completionRate = Math.round((state.stats.completed / state.stats.total) * 100);
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || 'Failed to complete task';
      });

    // Delete task
    builder
      .addCase(deleteTask.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isUpdating = false;
        const taskId = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          // Update stats before removing
          state.stats.total--;
          if (task.status === 'pending') state.stats.pending--;
          if (task.status === 'completed') state.stats.completed--;
          if (state.stats.total > 0) {
            state.stats.completionRate = Math.round((state.stats.completed / state.stats.total) * 100);
          } else {
            state.stats.completionRate = 0;
          }
        }
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        state.userTasks = state.userTasks.filter(t => t.id !== taskId);
        state.overdueTasks = state.overdueTasks.filter(t => t.id !== taskId);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || 'Failed to delete task';
      });

    // Fetch family tasks
    builder
      .addCase(fetchFamilyTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamilyTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchFamilyTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });

    // Fetch user tasks
    builder
      .addCase(fetchUserTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userTasks = action.payload;
      })
      .addCase(fetchUserTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user tasks';
      });

    // Fetch overdue tasks
    builder
      .addCase(fetchOverdueTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overdueTasks = action.payload;
        state.stats.overdue = action.payload.length;
      })
      .addCase(fetchOverdueTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch overdue tasks';
      });

    // Validate task
    builder
      .addCase(validateTask.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(validateTask.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { taskId, approved, notes } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.validationStatus = approved ? 'approved' : 'rejected';
          task.validationNotes = notes;
          if (!approved) {
            task.status = 'pending';
            task.completedAt = undefined;
            task.completedBy = undefined;
            // Update stats
            state.stats.pending++;
            state.stats.completed--;
            state.stats.completionRate = Math.round((state.stats.completed / state.stats.total) * 100);
          }
        }
      })
      .addCase(validateTask.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || 'Failed to validate task';
      });

    // Fetch task stats
    builder
      .addCase(fetchTaskStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTaskStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch task statistics';
      });
  },
});

export const {
  setTasks,
  setUserTasks,
  setOverdueTasks,
  addTask,
  updateTaskInList,
  removeTask,
  setSelectedTask,
  setFilters,
  clearFilters,
  setStats,
  clearTasks,
  setError,
  clearError,
} = tasksSlice.actions;

// Selectors
import { RootState } from '../store';

export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectUserTasks = (state: RootState) => state.tasks.userTasks;
export const selectOverdueTasks = (state: RootState) => state.tasks.overdueTasks;
export const selectSelectedTask = (state: RootState) => state.tasks.selectedTask;
export const selectTasksLoading = (state: RootState) => state.tasks.isLoading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectTaskStats = (state: RootState) => state.tasks.stats;
export const selectTaskFilters = (state: RootState) => state.tasks.filters;

// Computed selectors
export const selectTasksForToday = (state: RootState) => {
  const tasks = state.tasks.tasks;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });
};

export const selectUpcomingTasks = (state: RootState) => {
  const tasks = state.tasks.tasks;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate >= tomorrow;
  });
};

export default tasksSlice.reducer;