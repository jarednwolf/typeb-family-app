import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  logOut as firebaseLogOut,
  resetPassword as firebaseResetPassword,
  getUserProfile,
  SignUpData,
  SignInData,
  formatAuthError,
} from '../../services/auth';
import { User } from '../../types/models';
import { toISOString } from '../../utils/dateHelpers';

// Serializable version of User for Redux
interface SerializedUser {
  id: string;
  email: string;
  displayName: string;
  familyId?: string;
  role: 'parent' | 'child';
  createdAt: string;
  updatedAt: string;
  isPremium: boolean;
  subscriptionEndDate?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  notificationsEnabled: boolean;
  reminderTime?: string;
  timezone: string;
}

// Types
interface AuthState {
  user: FirebaseUser | null;
  userProfile: SerializedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isEmailVerified: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  userProfile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isEmailVerified: false,
};

// Helper function to serialize timestamps
const serializeUserProfile = (profile: User | null): SerializedUser | null => {
  if (!profile) return null;
  
  return {
    ...profile,
    createdAt: toISOString(profile.createdAt) || '',
    updatedAt: toISOString(profile.updatedAt) || '',
    subscriptionEndDate: toISOString(profile.subscriptionEndDate) || undefined,
  };
};

// Async thunks
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (data: SignUpData, { rejectWithValue }) => {
    try {
      const userCredential = await firebaseSignUp(data);
      const userProfile = await getUserProfile(userCredential.user.uid);
      
      return {
        user: userCredential.user.toJSON(),
        userProfile: serializeUserProfile(userProfile),
      };
    } catch (error: any) {
      return rejectWithValue(formatAuthError(error));
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (data: SignInData, { rejectWithValue }) => {
    try {
      const userCredential = await firebaseSignIn(data);
      const userProfile = await getUserProfile(userCredential.user.uid);
      
      return {
        user: userCredential.user.toJSON(),
        userProfile: serializeUserProfile(userProfile),
      };
    } catch (error: any) {
      return rejectWithValue(formatAuthError(error));
    }
  }
);

export const logOut = createAsyncThunk(
  'auth/logOut',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseLogOut();
      return null;
    } catch (error: any) {
      return rejectWithValue(formatAuthError(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await firebaseResetPassword(email);
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(formatAuthError(error));
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (uid: string, { rejectWithValue }) => {
    try {
      const userProfile = await getUserProfile(uid);
      return serializeUserProfile(userProfile);
    } catch (error: any) {
      return rejectWithValue(formatAuthError(error));
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<FirebaseUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isEmailVerified = action.payload?.emailVerified || false;
    },
    setUserProfile: (state, action: PayloadAction<SerializedUser | null>) => {
      state.userProfile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    // Sign up
    builder
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user as any;
        state.userProfile = action.payload.userProfile;
        state.isAuthenticated = true;
        state.isEmailVerified = false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
    
    // Sign in
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user as any;
        state.userProfile = action.payload.userProfile;
        state.isAuthenticated = true;
        state.isEmailVerified = (action.payload.user as any).emailVerified || false;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
    
    // Log out
    builder
      .addCase(logOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logOut.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProfile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { setUser, setUserProfile, clearError, setLoading, resetAuthState } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserProfile = (state: { auth: AuthState }) => state.auth.userProfile;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsEmailVerified = (state: { auth: AuthState }) => state.auth.isEmailVerified;