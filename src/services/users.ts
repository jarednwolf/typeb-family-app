import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types/models';

class UserService {
  private readonly COLLECTION_NAME = 'users';

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return this.formatUserData(userId, data);
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      
      // Add server timestamp for updatedAt
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(userRef, updateData);

      // Fetch and return updated user
      const updatedUser = await this.getUser(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get users by family ID
   */
  async getUsersByFamily(familyId: string): Promise<User[]> {
    try {
      const usersQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('familyId', '==', familyId)
      );

      const snapshot = await getDocs(usersQuery);
      const users: User[] = [];

      snapshot.forEach((doc) => {
        const user = this.formatUserData(doc.id, doc.data());
        if (user) {
          users.push(user);
        }
      });

      return users;
    } catch (error) {
      console.error('Error getting users by family:', error);
      throw error;
    }
  }

  /**
   * Update user's family association
   */
  async updateUserFamily(userId: string, familyId: string | null): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      
      await updateDoc(userRef, {
        familyId: familyId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user family:', error);
      throw error;
    }
  }

  /**
   * Update user's premium status
   */
  async updatePremiumStatus(
    userId: string, 
    isPremium: boolean, 
    subscriptionEndDate?: Date | null
  ): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      
      const updates: any = {
        isPremium,
        updatedAt: serverTimestamp(),
      };

      if (subscriptionEndDate !== undefined) {
        updates.subscriptionEndDate = subscriptionEndDate ? Timestamp.fromDate(subscriptionEndDate) : null;
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating premium status:', error);
      throw error;
    }
  }

  /**
   * Format user data from Firestore
   */
  private formatUserData(id: string, data: any): User | null {
    if (!data) return null;

    return {
      id,
      email: data.email || '',
      displayName: data.displayName || '',
      familyId: data.familyId || null,
      role: data.role || 'child',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      isPremium: data.isPremium || false,
      subscriptionEndDate: data.subscriptionEndDate?.toDate ? data.subscriptionEndDate.toDate() : undefined,
      avatarUrl: data.avatarUrl || undefined,
      phoneNumber: data.phoneNumber || undefined,
      notificationsEnabled: data.notificationsEnabled !== false,
      reminderTime: data.reminderTime || undefined,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

export default new UserService();