/**
 * Family Service Unit Tests
 * 
 * Tests all critical family management operations including:
 * - Family creation with proper permissions
 * - Invite code generation and validation
 * - Member joining and role assignment
 * - Member management (add/remove/update roles)
 * - Edge cases and error handling
 * 
 * Following TypeB testing standards:
 * - Comprehensive coverage of critical paths
 * - Clear test descriptions
 * - Proper setup and teardown
 * - Mock Firebase operations
 */

import {
  createFamily,
  joinFamily,
  removeFamilyMember,
  changeMemberRole,
  regenerateInviteCode,
  getFamily,
  getFamilyMembers,
  leaveFamily,
  updateFamily,
  canPerformAdminAction
} from '../../services/family';
import { db, auth } from '../../services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { Family, User } from '../../types/models';

type FamilyRole = 'parent' | 'child';

// Mock Firebase
jest.mock('../../services/firebase');
jest.mock('firebase/firestore');

// Mock taskCleanup service
jest.mock('../../services/taskCleanup', () => ({
  handleOrphanedTasks: jest.fn().mockResolvedValue(undefined)
}));

describe('Family Service', () => {
  const mockUserId = 'test-user-123';
  const mockFamilyId = 'test-family-456';
  const mockInviteCode = 'ABC123';
  
  const mockUser: Partial<User> = {
    id: mockUserId,
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'parent',
    familyId: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFamily: Partial<Family> = {
    id: mockFamilyId,
    name: 'Test Family',
    inviteCode: mockInviteCode,
    memberIds: [mockUserId],
    parentIds: [mockUserId],
    childIds: [],
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    maxMembers: 4,
    isPremium: false,
    taskCategories: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth current user
    (auth.currentUser as any) = { uid: mockUserId };
    
    // Default mock for getDocs to prevent infinite loops in generateInviteCode
    (getDocs as jest.Mock).mockResolvedValue({ empty: true });
    
    // Default mock for query and where
    (query as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (collection as jest.Mock).mockReturnValue({});
    
    // Mock runTransaction to work with our security implementation
    (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
      const transaction = {
        get: jest.fn((docRef) => Promise.resolve({
          exists: () => true,
          data: () => mockUser,
          id: mockUserId
        })),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      };
      return updateFunction(transaction);
    });
  });

  describe('createFamily', () => {
    it('should create a family with proper structure and permissions', async () => {
      // Mock Firestore operations
      const mockDocRef = { id: mockFamilyId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock transaction to return user without familyId
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      const familyName = 'Test Family';
      const result = await createFamily(mockUserId, familyName);

      // Verify family creation
      expect(runTransaction).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: mockFamilyId,
        name: familyName,
        memberIds: [mockUserId],
        parentIds: [mockUserId],
        childIds: []
      }));
    });

    it('should reject if user not authenticated', async () => {
      (auth.currentUser as any) = null;

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('User authentication required');
    });

    it('should reject if user already in a family', async () => {
      // Mock transaction to return user with familyId
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: 'existing-family' }),
            id: mockUserId
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('You are already in a family');
    });

    it('should validate family name', async () => {
      await expect(createFamily(mockUserId, ''))
        .rejects.toThrow('Family name is required');
      
      await expect(createFamily(mockUserId, 'A'))
        .rejects.toThrow('Family name must be at least 2 characters');
      
      await expect(createFamily(mockUserId, 'a'.repeat(51)))
        .rejects.toThrow('Family name must not exceed 50 characters');
    });

    it('should generate unique invite codes', async () => {
      const mockDocRef = { id: mockFamilyId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(),
          update: jest.fn()
        };
        
        // Reset getDocs mock for this specific test
        (getDocs as jest.Mock).mockReset();
        // First call - code exists
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
        // Second call - code is unique
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });
        
        return updateFunction(transaction);
      });

      await createFamily(mockUserId, 'Test Family');

      // Should have queried at least once for unique code
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('joinFamily', () => {
    beforeEach(() => {
      // Mock successful family lookup
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{
          id: mockFamilyId,
          data: () => mockFamily
        }]
      });
    });

    it('should allow user to join family with valid invite code', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      const result = await joinFamily(mockUserId, mockInviteCode);

      expect(result).toEqual(expect.objectContaining({
        id: mockFamilyId,
        name: 'Test Family'
      }));
    });

    it('should reject if user not authenticated', async () => {
      (auth.currentUser as any) = null;

      await expect(joinFamily(mockUserId, mockInviteCode))
        .rejects.toThrow('User authentication required');
    });

    it('should reject if already in a family', async () => {
      // Mock transaction to return user with familyId
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: 'existing-family' }),
            id: mockUserId
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(joinFamily(mockUserId, mockInviteCode))
        .rejects.toThrow('You are already in a family');
    });

    it('should handle invalid invite codes', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      await expect(joinFamily(mockUserId, 'INVALID'))
        .rejects.toThrow('Invalid invite code');
    });

    it('should validate invite code format', async () => {
      await expect(joinFamily(mockUserId, ''))
        .rejects.toThrow('Invite code is required');
      
      await expect(joinFamily(mockUserId, 'invalid-format'))
        .rejects.toThrow('Invalid invite code format');
    });

    it('should handle case-insensitive invite codes', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      await joinFamily(mockUserId, 'abc123'); // lowercase
      
      expect(getDocs).toHaveBeenCalled();
    });

    it('should check family capacity', async () => {
      const fullFamily = {
        ...mockFamily,
        memberIds: ['user1', 'user2', 'user3', 'user4'],
        maxMembers: 4
      };
      
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{
          id: mockFamilyId,
          data: () => fullFamily
        }]
      });

      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(joinFamily(mockUserId, mockInviteCode))
        .rejects.toThrow('Family is at maximum capacity');
    });
  });

  describe('removeFamilyMember', () => {
    const targetUserId = 'user-to-remove';

    beforeEach(() => {
      // Mock getDoc for family data
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: [mockUserId, targetUserId],
          parentIds: [mockUserId],
          childIds: [targetUserId]
        })
      });
    });

    it('should remove member from family with proper authorization', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => {
              // Return appropriate data based on what's being fetched
              if (docRef.id === mockUserId) {
                return mockUser;
              } else if (docRef.id === mockFamilyId) {
                return {
                  ...mockFamily,
                  memberIds: [mockUserId, targetUserId],
                  parentIds: [mockUserId],
                  childIds: [targetUserId]
                };
              }
              return {};
            },
            id: docRef.id
          })),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      await removeFamilyMember(mockFamilyId, targetUserId);

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should reject if user not authenticated', async () => {
      (auth.currentUser as any) = null;

      await expect(removeFamilyMember(mockFamilyId, targetUserId))
        .rejects.toThrow('User authentication required');
    });

    it('should reject if user is not a parent', async () => {
      // Mock as child user
      (auth.currentUser as any) = { uid: 'child-user' };
      
      // Mock getDoc to return family where current user is a child
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: [mockUserId, 'child-user', targetUserId],
          parentIds: [mockUserId],
          childIds: ['child-user', targetUserId]
        })
      });

      await expect(removeFamilyMember(mockFamilyId, targetUserId))
        .rejects.toThrow('Only parents can perform administrative actions');
    });

    it('should prevent removing the last parent', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => {
              if (docRef.id === mockUserId) {
                return mockUser;
              } else if (docRef.id === mockFamilyId) {
                return {
                  ...mockFamily,
                  memberIds: [mockUserId, 'child-user'],
                  parentIds: [mockUserId],  // Only one parent
                  childIds: ['child-user']
                };
              }
              return {};
            },
            id: docRef.id
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(removeFamilyMember(mockFamilyId, mockUserId))
        .rejects.toThrow('Cannot remove the last parent while other members exist');
    });

    it('should prevent removing yourself', async () => {
      await expect(removeFamilyMember(mockFamilyId, mockUserId))
        .rejects.toThrow('Cannot remove yourself. Use leave family instead.');
    });

    it('should handle non-existent family', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      await expect(removeFamilyMember('invalid-family', targetUserId))
        .rejects.toThrow('Family not found');
    });
  });

  describe('changeMemberRole', () => {
    const targetUserId = 'user-to-update';

    beforeEach(() => {
      // Mock getDoc for family data
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: [mockUserId, targetUserId],
          parentIds: [mockUserId],
          childIds: [targetUserId]
        })
      });
    });

    it('should promote child to parent with authorization', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => {
              if (docRef.id === mockUserId) {
                return mockUser;
              } else if (docRef.id === mockFamilyId) {
                return {
                  ...mockFamily,
                  memberIds: [mockUserId, targetUserId],
                  parentIds: [mockUserId],
                  childIds: [targetUserId]
                };
              }
              return {};
            },
            id: docRef.id
          })),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      await changeMemberRole(mockFamilyId, targetUserId, 'parent');

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should reject if user not authenticated', async () => {
      (auth.currentUser as any) = null;

      await expect(changeMemberRole(mockFamilyId, targetUserId, 'parent'))
        .rejects.toThrow('User authentication required');
    });

    it('should reject if user is not a parent', async () => {
      // Mock as child user
      (auth.currentUser as any) = { uid: 'child-user' };
      
      // Mock getDoc to return family where current user is a child
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: [mockUserId, 'child-user', targetUserId],
          parentIds: [mockUserId],
          childIds: ['child-user', targetUserId]
        })
      });

      await expect(changeMemberRole(mockFamilyId, targetUserId, 'parent'))
        .rejects.toThrow('Only parents can perform administrative actions');
    });

    it('should prevent demoting the last parent', async () => {
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => {
              if (docRef.id === mockUserId) {
                return mockUser;
              } else if (docRef.id === mockFamilyId) {
                return {
                  ...mockFamily,
                  memberIds: [mockUserId, 'child-user'],
                  parentIds: [mockUserId], // Only one parent
                  childIds: ['child-user']
                };
              }
              return {};
            },
            id: docRef.id
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(changeMemberRole(mockFamilyId, mockUserId, 'child'))
        .rejects.toThrow('Cannot demote the last parent');
    });

    it('should validate role input', async () => {
      await expect(changeMemberRole(mockFamilyId, targetUserId, 'invalid' as any))
        .rejects.toThrow('Invalid role');
    });
  });

  describe('Security and Authorization', () => {
    it('should validate authentication for all operations', async () => {
      (auth.currentUser as any) = null;

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('User authentication required');
      
      await expect(joinFamily(mockUserId, mockInviteCode))
        .rejects.toThrow('User authentication required');
      
      await expect(removeFamilyMember(mockFamilyId, 'user-id'))
        .rejects.toThrow('User authentication required');
      
      await expect(changeMemberRole(mockFamilyId, 'user-id', 'parent'))
        .rejects.toThrow('User authentication required');
      
      await expect(leaveFamily(mockUserId))
        .rejects.toThrow('User authentication required');
      
      await expect(updateFamily(mockFamilyId, { name: 'New Name' }))
        .rejects.toThrow('User authentication required');
      
      await expect(regenerateInviteCode(mockFamilyId))
        .rejects.toThrow('User authentication required');
    });

    it('should enforce parent-only operations', async () => {
      // Mock as child user
      (auth.currentUser as any) = { uid: 'child-user' };
      
      // Mock getDoc to return family where current user is a child
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: [mockUserId, 'child-user'],
          parentIds: [mockUserId],
          childIds: ['child-user']
        })
      });

      await expect(removeFamilyMember(mockFamilyId, mockUserId))
        .rejects.toThrow('Only parents can perform administrative actions');
      
      await expect(changeMemberRole(mockFamilyId, mockUserId, 'child'))
        .rejects.toThrow('Only parents can perform administrative actions');
      
      await expect(updateFamily(mockFamilyId, { name: 'New Name' }))
        .rejects.toThrow('Only parents can update family settings');
      
      await expect(regenerateInviteCode(mockFamilyId))
        .rejects.toThrow('Only parents can perform administrative actions');
    });

    it('should verify family membership for operations', async () => {
      // Mock getDoc to return family where current user is not a member
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockFamily,
          memberIds: ['other-user'],
          parentIds: ['other-user'],
          childIds: []
        })
      });

      await expect(getFamily(mockFamilyId))
        .rejects.toThrow('You are not authorized to view this family');
      
      await expect(getFamilyMembers(mockFamilyId))
        .rejects.toThrow('You are not a member of this family');
    });
  });

  describe('Input Validation', () => {
    it('should validate family name constraints', async () => {
      await expect(createFamily(mockUserId, ''))
        .rejects.toThrow('Family name is required');
      
      await expect(createFamily(mockUserId, '   '))
        .rejects.toThrow('Family name is required');
      
      await expect(createFamily(mockUserId, 'A'))
        .rejects.toThrow('Family name must be at least 2 characters');
      
      await expect(createFamily(mockUserId, 'a'.repeat(51)))
        .rejects.toThrow('Family name must not exceed 50 characters');
      
      await expect(createFamily(mockUserId, 'Test<script>'))
        .rejects.toThrow('Family name contains invalid characters');
    });

    it('should validate invite code format', async () => {
      await expect(joinFamily(mockUserId, ''))
        .rejects.toThrow('Invite code is required');
      
      await expect(joinFamily(mockUserId, 'ABC'))
        .rejects.toThrow('Invalid invite code format');
      
      await expect(joinFamily(mockUserId, 'ABC1234'))
        .rejects.toThrow('Invalid invite code format');
      
      await expect(joinFamily(mockUserId, 'ABC!@#'))
        .rejects.toThrow('Invalid invite code format');
    });

    it('should validate role values', async () => {
      await expect(joinFamily(mockUserId, mockInviteCode, 'admin' as any))
        .rejects.toThrow('Invalid role');
      
      await expect(changeMemberRole(mockFamilyId, 'user-id', 'superuser' as any))
        .rejects.toThrow('Invalid role');
    });

    it('should validate update operations', async () => {
      // Mock as parent user
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockFamily
      });

      await expect(updateFamily(mockFamilyId, { name: '' }))
        .rejects.toThrow('Family name is required');
      
      await expect(updateFamily(mockFamilyId, { maxMembers: 1 }))
        .rejects.toThrow('Maximum members must be between 2 and 20');
      
      await expect(updateFamily(mockFamilyId, { maxMembers: 21 }))
        .rejects.toThrow('Maximum members must be between 2 and 20');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (runTransaction as jest.Mock).mockRejectedValue(networkError);

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('Failed to create family');
    });

    it('should handle concurrent family creation', async () => {
      const mockDocRef = { id: mockFamilyId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(),
          update: jest.fn()
        };
        
        // Reset getDocs mock for this specific test
        (getDocs as jest.Mock).mockReset();
        // Simulate concurrent creation with same invite code
        let callCount = 0;
        (getDocs as jest.Mock).mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            empty: callCount > 2 // First two calls find duplicate, third is unique
          });
        });
        
        return updateFunction(transaction);
      });

      await createFamily(mockUserId, 'Test Family');

      expect(getDocs).toHaveBeenCalledTimes(3);
    });

    it('should handle missing user profile', async () => {
      // Mock transaction to return non-existent user
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => false
          }))
        };
        return updateFunction(transaction).catch((e: Error) => {
          throw e;
        });
      });

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('User profile not found');
    });

    it('should validate family settings on creation', async () => {
      const mockDocRef = { id: mockFamilyId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      const result = await createFamily(mockUserId, 'Test Family', false);

      // Verify default values are applied
      expect(result).toEqual(expect.objectContaining({
        maxMembers: 4, // Free tier limit
        isPremium: false,
        taskCategories: expect.any(Array)
      }));
    });

    it('should handle premium family creation', async () => {
      const mockDocRef = { id: mockFamilyId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock transaction
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });

      const result = await createFamily(mockUserId, 'Premium Family', true);

      expect(result).toEqual(expect.objectContaining({
        maxMembers: 10, // Premium tier limit
        isPremium: true
      }));
    });
  });

  describe('Transaction Safety', () => {
    it('should use transactions for all write operations', async () => {
      // Create family
      await createFamily(mockUserId, 'Test Family');
      expect(runTransaction).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Join family
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{
          id: mockFamilyId,
          data: () => mockFamily
        }]
      });
      
      // Mock transaction for join
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          update: jest.fn()
        };
        return updateFunction(transaction);
      });
      
      await joinFamily(mockUserId, mockInviteCode);
      expect(runTransaction).toHaveBeenCalled();
    });

    it('should rollback on transaction failure', async () => {
      // Mock transaction that fails during execution
      (runTransaction as jest.Mock).mockImplementation((db, updateFunction) => {
        const transaction = {
          get: jest.fn((docRef) => Promise.resolve({
            exists: () => true,
            data: () => ({ ...mockUser, familyId: null }),
            id: mockUserId
          })),
          set: jest.fn(() => {
            throw new Error('Transaction failed');
          })
        };
        return updateFunction(transaction);
      });

      await expect(createFamily(mockUserId, 'Test Family'))
        .rejects.toThrow('Failed to create family');
    });
  });
});