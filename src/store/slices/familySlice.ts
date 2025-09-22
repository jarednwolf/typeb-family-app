/**
 * Family Redux slice
 * Manages family state and real-time sync
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Family, User, TaskCategory } from '../../types/models';
import * as familyService from '../../services/family';
import { fetchUserProfile } from './authSlice';
import { toISOString } from '../../utils/dateHelpers';

// Serializable version of Family for Redux
interface SerializedFamily {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
  parentIds: string[];
  childIds: string[];
  maxMembers: number;
  isPremium: boolean;
  taskCategories: any[]; // TaskCategory doesn't have dates
  defaultTaskAssignee?: string;
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;
    memberLabel: string;
    adminPlural?: string;
    memberPlural?: string;
  };
}

// Serializable version of User for Redux (member list)
interface SerializedMember {
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

interface FamilyState {
  currentFamily: SerializedFamily | null;
  members: SerializedMember[];
  isLoading: boolean;
  error: string | null;
  inviteCode: string | null;
  isJoining: boolean;
  isCreating: boolean;
}

const initialState: FamilyState = {
  currentFamily: null,
  members: [],
  isLoading: false,
  error: null,
  inviteCode: null,
  isJoining: false,
  isCreating: false,
};

// Helper functions to serialize data
const serializeFamily = (family: Family | null): SerializedFamily | null => {
  if (!family) return null;
  
  return {
    ...family,
    createdAt: toISOString(family.createdAt) || '',
    updatedAt: toISOString(family.updatedAt) || '',
  };
};

const serializeMember = (member: User): SerializedMember => {
  return {
    ...member,
    createdAt: toISOString(member.createdAt) || '',
    updatedAt: toISOString(member.updatedAt) || '',
    subscriptionEndDate: toISOString(member.subscriptionEndDate) || undefined,
  };
};

// Async thunks
export const createFamily = createAsyncThunk(
  'family/create',
  async ({ userId, name, isPremium, roleConfig }: {
    userId: string;
    name: string;
    isPremium?: boolean;
    roleConfig?: {
      preset: 'family' | 'roommates' | 'team' | 'custom';
      adminLabel: string;
      memberLabel: string;
      adminPlural?: string;
      memberPlural?: string;
    };
  }, { dispatch }) => {
    const family = await familyService.createFamily(userId, name, isPremium, roleConfig);
    // Refresh user profile to get the updated familyId
    await dispatch(fetchUserProfile(userId));
    return serializeFamily(family);
  }
);

export const joinFamily = createAsyncThunk(
  'family/join',
  async ({ userId, inviteCode, role }: { userId: string; inviteCode: string; role?: 'parent' | 'child' }, { dispatch }) => {
    const family = await familyService.joinFamily(userId, inviteCode, role);
    // Refresh user profile to get the updated familyId
    await dispatch(fetchUserProfile(userId));
    return serializeFamily(family);
  }
);

export const fetchFamily = createAsyncThunk(
  'family/fetch',
  async (familyId: string) => {
    const family = await familyService.getFamily(familyId);
    return serializeFamily(family);
  }
);

export const fetchFamilyMembers = createAsyncThunk(
  'family/fetchMembers',
  async (familyId: string) => {
    const members = await familyService.getFamilyMembers(familyId);
    return members.map(serializeMember);
  }
);

export const leaveFamily = createAsyncThunk(
  'family/leave',
  async (userId: string) => {
    await familyService.leaveFamily(userId);
  }
);

export const removeMember = createAsyncThunk(
  'family/removeMember',
  async ({ familyId, userId }: { familyId: string; userId: string }) => {
    await familyService.removeFamilyMember(familyId, userId);
    return userId;
  }
);

export const changeMemberRole = createAsyncThunk(
  'family/changeMemberRole',
  async ({ familyId, userId, newRole }: { familyId: string; userId: string; newRole: 'parent' | 'child' }) => {
    await familyService.changeMemberRole(familyId, userId, newRole);
    return { userId, newRole };
  }
);

export const regenerateInviteCode = createAsyncThunk(
  'family/regenerateInviteCode',
  async (familyId: string) => {
    const newCode = await familyService.regenerateInviteCode(familyId);
    return newCode;
  }
);

export const addTaskCategory = createAsyncThunk(
  'family/addTaskCategory',
  async ({ familyId, userId, category }: {
    familyId: string;
    userId: string;
    category: TaskCategory
  }) => {
    // In a real app, this would call a service to update the family
    // For now, we'll just return the category to be added to state
    return category;
  }
);

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setFamily: (state, action: PayloadAction<SerializedFamily | null>) => {
      state.currentFamily = action.payload;
    },
    setMembers: (state, action: PayloadAction<SerializedMember[]>) => {
      state.members = action.payload;
    },
    updateMember: (state, action: PayloadAction<User>) => {
      const serialized = serializeMember(action.payload);
      const index = state.members.findIndex(m => m.id === serialized.id);
      if (index !== -1) {
        state.members[index] = serialized;
      }
    },
    clearFamily: (state) => {
      state.currentFamily = null;
      state.members = [];
      state.error = null;
      state.inviteCode = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create family
    builder
      .addCase(createFamily.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createFamily.fulfilled, (state, action) => {
        state.isCreating = false;
        state.currentFamily = action.payload;
        if (action.payload) {
          state.inviteCode = action.payload.inviteCode;
        }
      })
      .addCase(createFamily.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || 'Failed to create family';
      });

    // Join family
    builder
      .addCase(joinFamily.pending, (state) => {
        state.isJoining = true;
        state.error = null;
      })
      .addCase(joinFamily.fulfilled, (state, action) => {
        state.isJoining = false;
        state.currentFamily = action.payload;
      })
      .addCase(joinFamily.rejected, (state, action) => {
        state.isJoining = false;
        state.error = action.error.message || 'Failed to join family';
      });

    // Fetch family
    builder
      .addCase(fetchFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFamily = action.payload;
        if (action.payload) {
          state.inviteCode = action.payload.inviteCode;
        }
      })
      .addCase(fetchFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch family';
      });

    // Fetch members
    builder
      .addCase(fetchFamilyMembers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch members';
      });

    // Leave family
    builder
      .addCase(leaveFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveFamily.fulfilled, (state) => {
        state.isLoading = false;
        state.currentFamily = null;
        state.members = [];
        state.inviteCode = null;
      })
      .addCase(leaveFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to leave family';
      });

    // Remove member
    builder
      .addCase(removeMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = state.members.filter(m => m.id !== action.payload);
        if (state.currentFamily) {
          state.currentFamily.memberIds = state.currentFamily.memberIds.filter(id => id !== action.payload);
        }
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to remove member';
      });

    // Change member role
    builder
      .addCase(changeMemberRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeMemberRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const member = state.members.find(m => m.id === action.payload.userId);
        if (member) {
          member.role = action.payload.newRole;
        }
        if (state.currentFamily) {
          const { userId, newRole } = action.payload;
          if (newRole === 'parent') {
            state.currentFamily.parentIds.push(userId);
            state.currentFamily.childIds = state.currentFamily.childIds.filter(id => id !== userId);
          } else {
            state.currentFamily.childIds.push(userId);
            state.currentFamily.parentIds = state.currentFamily.parentIds.filter(id => id !== userId);
          }
        }
      })
      .addCase(changeMemberRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to change member role';
      });

    // Regenerate invite code
    builder
      .addCase(regenerateInviteCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(regenerateInviteCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inviteCode = action.payload;
        if (state.currentFamily) {
          state.currentFamily.inviteCode = action.payload;
        }
      })
      .addCase(regenerateInviteCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to regenerate invite code';
      });
      
    // Add task category
    builder
      .addCase(addTaskCategory.fulfilled, (state, action) => {
        if (state.currentFamily) {
          if (!state.currentFamily.taskCategories) {
            state.currentFamily.taskCategories = [];
          }
          state.currentFamily.taskCategories.push(action.payload);
        }
      });
  },
});

export const {
  setFamily,
  setMembers,
  updateMember,
  clearFamily,
  setError,
  clearError,
} = familySlice.actions;

// Selectors
import { RootState } from '../store';

export const selectFamily = (state: RootState) => state.family.currentFamily;
export const selectFamilyMembers = (state: RootState) => state.family.members;
export const selectFamilyLoading = (state: RootState) => state.family.isLoading;
export const selectFamilyError = (state: RootState) => state.family.error;
export const selectInviteCode = (state: RootState) => state.family.inviteCode;
export const selectIsJoining = (state: RootState) => state.family.isJoining;
export const selectIsCreating = (state: RootState) => state.family.isCreating;

// Computed selector for current user role
export const selectCurrentUserRole = (state: RootState) => {
  const family = state.family.currentFamily;
  const userProfile = state.auth.userProfile;
  
  if (!family || !userProfile) return null;
  
  if (family.parentIds.includes(userProfile.id)) return 'parent';
  if (family.childIds.includes(userProfile.id)) return 'child';
  return null;
};

export default familySlice.reducer;
// Additional selectors
export const selectActiveFamily = (state: RootState) => state.family.currentFamily;
