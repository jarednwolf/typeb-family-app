import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface UserState {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserState['currentUser']>) => {
      state.currentUser = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },
  },
});

export const { setCurrentUser, setLoading, setError, clearUser } = userSlice.actions;
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export default userSlice.reducer;
