export const selectActiveFamily = (state: any) => state.family?.currentFamily || { id: 'family-1', isPremium: false };
const defaultState = {
  currentFamily: { id: 'family-1', isPremium: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  members: [],
  isLoading: false,
  error: null,
  inviteCode: null,
  isJoining: false,
  isCreating: false,
};
const reducer = (state = defaultState, action: any) => {
  switch (action?.type) {
    case 'family/setFamily':
      return { ...state, currentFamily: { ...action.payload } };
    case 'family/setMembers':
      return { ...state, members: Array.isArray(action.payload) ? [...action.payload] : [] };
    default:
      return state;
  }
};
export default reducer;

