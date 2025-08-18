import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '@typeb/types';

export interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'completed';
}

const initialState: TasksState = {
  tasks: [],
  isLoading: false,
  error: null,
  filter: 'all',
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.error = null;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilter: (state, action: PayloadAction<'all' | 'active' | 'completed'>) => {
      state.filter = action.payload;
    },
    resetTasksState: () => initialState,
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setLoading,
  setError,
  setFilter,
  resetTasksState,
} = tasksSlice.actions;

export default tasksSlice.reducer;

// Selectors
export const selectTasks = (state: { tasks: TasksState }) => state.tasks.tasks;
export const selectTasksLoading = (state: { tasks: TasksState }) => state.tasks.isLoading;
export const selectTasksError = (state: { tasks: TasksState }) => state.tasks.error;
export const selectTasksFilter = (state: { tasks: TasksState }) => state.tasks.filter;

export const selectFilteredTasks = (state: { tasks: TasksState }) => {
  const { tasks, filter } = state.tasks;
  
  switch (filter) {
    case 'active':
      return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    case 'completed':
      return tasks.filter(t => t.status === 'completed');
    default:
      return tasks;
  }
};