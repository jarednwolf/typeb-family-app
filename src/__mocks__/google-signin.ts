export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn().mockResolvedValue({
    idToken: 'test-id-token',
    user: { id: 'test', email: 'test@example.com', name: 'Test User', photo: null },
  }),
  isSignedIn: jest.fn().mockResolvedValue(false),
  signOut: jest.fn().mockResolvedValue(undefined),
};

export default GoogleSignin;



