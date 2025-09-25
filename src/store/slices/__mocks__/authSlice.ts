export const selectUser = (state: any) => state.auth?.user || null;
export const selectUserProfile = (state: any) => state.auth?.userProfile || null;

// eslint-disable-next-line no-console
console.log('[TEST MOCK] authSlice reducer loaded');

const defaultState = {
  user: { uid: 'test-user', email: 'test@example.com', emailVerified: true },
  userProfile: {
    id: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'parent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPremium: false,
    notificationsEnabled: true,
    timezone: 'UTC',
  },
  isLoading: false,
  isAuthenticated: true,
  error: null,
  isEmailVerified: true,
};

const reducer = (state = defaultState, action: any) => {
  switch (action?.type) {
    case 'auth/setUserProfile':
      return { ...state, userProfile: { ...action.payload } };
    case 'auth/setUser':
      return { ...state, user: { ...action.payload }, isAuthenticated: !!action.payload };
    default:
      return state;
  }
};
export default reducer;


