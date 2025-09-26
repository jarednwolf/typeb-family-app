export const fetchFamilyTasks = jest.fn((payload?: any) => {
  const action: any = { type: 'tasks/fetch', payload };
  action.unwrap = () => Promise.resolve(action);
  return action;
});

export const validateTask = jest.fn((payload: any) => {
  const action: any = { type: 'tasks/validate', payload };
  action.unwrap = () => Promise.resolve(action);
  return action;
});

const defaultState = {
  tasks: [],
  userTasks: [],
  overdueTasks: [],
  selectedTask: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  stats: { total: 0, pending: 0, completed: 0, overdue: 0, completionRate: 0 },
  filters: {},
};

// Reducer that supports setting and validating tasks
const reducer = (state = defaultState, action: any) => {
  if (action?.type === 'tasks/setTasks') {
    return { ...state, tasks: Array.isArray(action.payload) ? [...action.payload] : [] };
  }
  if (action?.type === 'tasks/validate') {
    const { taskId, approved, notes } = action.payload || {};
    const newTasks = (state.tasks || []).map((t: any) =>
      t.id === taskId
        ? { ...t, validationStatus: approved ? 'approved' : 'rejected', validationNotes: notes }
        : t
    );
    return { ...state, tasks: newTasks };
  }
  if (action?.type === 'tasks/fetch') {
    return { ...state };
  }
  return state;
};
export default reducer;

export const selectTasks = (state: any) => (state.tasks?.tasks ?? defaultState.tasks);
export const selectTasksLoading = (state: any) => (state.tasks?.isLoading ?? defaultState.isLoading);
export const selectTaskStats = (state: any) => (state.tasks?.stats ?? defaultState.stats);

