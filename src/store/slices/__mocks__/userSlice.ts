export const selectCurrentUser = (state: any) => state.auth?.user || { uid: 'test-user-123', role: 'parent' };
const defaultState = { isPremium: false, user: { uid: 'test-user-123', role: 'parent' } };
const reducer = (state = defaultState, _action: any) => state;
export default reducer;

