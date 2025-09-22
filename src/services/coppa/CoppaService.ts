import { firestore, auth, storage } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export interface ChildData {
  firstName: string;
  birthDate: Date;
}

export interface ParentalConsentData {
  childData: ChildData;
  parentEmail: string;
  parentPhone?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  consentGiven: boolean;
  consentDate?: Date;
  verificationMethod?: 'email' | 'credit_card' | 'id_upload';
  createdAt: Date;
  expiresAt: Date;
}

export interface ChildAccountData {
  firstName: string;
  birthDate: Date;
  isUnder13: boolean;
  parentConsentId: string;
  restrictions: {
    noEmailCollection: boolean;
    noLocationTracking: boolean;
    noThirdPartySharing: boolean;
    autoDeletePhotos: boolean;
    limitedDataCollection: boolean;
  };
  createdAt: Date;
  parentId?: string;
}

export class CoppaService {
  private static readonly CONSENT_EXPIRY_DAYS = 7;
  private static readonly PHOTO_RETENTION_DAYS = 90;

  /**
   * Calculate age from birthdate
   */
  static calculateAge(birthDate: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }

  /**
   * Check if user is under 13
   */
  static async checkAge(birthDate: Date): Promise<boolean> {
    const age = this.calculateAge(birthDate);
    return age >= 13;
  }

  /**
   * Request parental consent for a child under 13
   */
  static async requestParentalConsent(
    childData: ChildData, 
    parentEmail: string,
    parentPhone?: string
  ): Promise<string> {
    try {
      // Create pending consent record
      const consentData: ParentalConsentData = {
        childData,
        parentEmail,
        parentPhone,
        status: 'pending',
        consentGiven: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      };

      const consentRef = await addDoc(collection(firestore, 'parental_consent'), consentData);

      // Send verification email
      await this.sendConsentEmail(parentEmail, consentRef.id, childData.firstName);
      
      // Return consent tracking ID
      return consentRef.id;
    } catch (error) {
      console.error('Error requesting parental consent:', error);
      throw new Error('Failed to request parental consent');
    }
  }

  /**
   * Send consent email to parent
   */
  private static async sendConsentEmail(
    parentEmail: string, 
    consentId: string,
    childName: string
  ): Promise<void> {
    // This would typically call a Cloud Function to send the email
    // For now, we'll create a record that the Cloud Function can process
    try {
      await addDoc(collection(firestore, 'email_queue'), {
        to: parentEmail,
        template: 'parental_consent',
        data: {
          consentId,
          childName,
          verificationUrl: `https://typebapp.com/verify-consent?id=${consentId}`,
        },
        createdAt: new Date(),
        status: 'pending',
      });
    } catch (error) {
      console.error('Error sending consent email:', error);
      throw new Error('Failed to send consent email');
    }
  }

  /**
   * Verify parental consent with provided verification data
   */
  static async verifyParentalConsent(
    consentId: string, 
    verificationMethod: 'email' | 'credit_card' | 'id_upload',
    verificationData?: any
  ): Promise<boolean> {
    try {
      const consentRef = doc(firestore, 'parental_consent', consentId);
      const consentDoc = await getDoc(consentRef);
      
      if (!consentDoc.exists()) {
        throw new Error('Consent record not found');
      }

      const consentData = consentDoc.data() as ParentalConsentData;
      
      // Check if consent hasn't expired
      if (new Date() > consentData.expiresAt) {
        await updateDoc(consentRef, { status: 'expired' });
        throw new Error('Consent request has expired');
      }

      // Perform verification based on method
      let verified = false;
      switch (verificationMethod) {
        case 'email':
          // Email verification is handled by clicking the link
          verified = true;
          break;
        case 'credit_card':
          // Implement credit card verification
          // This would typically involve a small charge and refund
          verified = await this.verifyCreditCard(verificationData);
          break;
        case 'id_upload':
          // Implement ID verification
          verified = await this.verifyId(verificationData);
          break;
      }

      if (verified) {
        await updateDoc(consentRef, {
          status: 'verified',
          consentGiven: true,
          consentDate: new Date(),
          verificationMethod,
        });
      }

      return verified;
    } catch (error) {
      console.error('Error verifying parental consent:', error);
      throw error;
    }
  }

  /**
   * Create a child account with COPPA restrictions
   */
  static async createChildAccount(
    childData: ChildData, 
    consentId: string,
    parentUserId?: string
  ): Promise<string> {
    try {
      // Verify consent is valid
      const consentRef = doc(firestore, 'parental_consent', consentId);
      const consentDoc = await getDoc(consentRef);
      
      if (!consentDoc.exists() || consentDoc.data().status !== 'verified') {
        throw new Error('Valid parental consent required');
      }

      // Create restricted account
      const accountData: ChildAccountData = {
        firstName: childData.firstName,
        birthDate: childData.birthDate,
        isUnder13: true,
        parentConsentId: consentId,
        parentId: parentUserId,
        restrictions: {
          noEmailCollection: true,
          noLocationTracking: true,
          noThirdPartySharing: true,
          autoDeletePhotos: true,
          limitedDataCollection: true,
        },
        createdAt: new Date(),
      };
      
      const userRef = await addDoc(collection(firestore, 'users'), accountData);
      
      // Create audit log
      await this.logCoppaEvent('child_account_created', {
        userId: userRef.id,
        consentId,
        parentId: parentUserId,
      });
      
      return userRef.id;
    } catch (error) {
      console.error('Error creating child account:', error);
      throw error;
    }
  }

  /**
   * Enforce data retention policy - delete old photos
   */
  static async enforceDataRetention(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      // Query for old photos
      const photosQuery = query(
        collection(firestore, 'task_photos'),
        where('createdAt', '<', cutoffDate)
      );
      
      const oldPhotos = await getDocs(photosQuery);
      
      const batch = writeBatch(firestore);
      const deletePromises: Promise<void>[] = [];
      
      oldPhotos.forEach((doc) => {
        const photoData = doc.data();
        
        // Delete from Firestore
        batch.delete(doc.ref);
        
        // Delete from Storage
        if (photoData.storagePath) {
          const storageRef = ref(storage, photoData.storagePath);
          deletePromises.push(deleteObject(storageRef).catch(console.error));
        }
      });
      
      // Commit batch delete
      await batch.commit();
      await Promise.all(deletePromises);
      
      // Log retention enforcement
      await this.logCoppaEvent('data_retention_enforced', {
        photosDeleted: oldPhotos.size,
        cutoffDate: cutoffDate.toISOString(),
      });
      
      return oldPhotos.size;
    } catch (error) {
      console.error('Error enforcing data retention:', error);
      throw error;
    }
  }

  /**
   * Allow parent to review child's data
   */
  static async getChildData(childUserId: string, parentUserId: string): Promise<any> {
    try {
      // Verify parent-child relationship
      const isParent = await this.verifyParentChildRelationship(parentUserId, childUserId);
      if (!isParent) {
        throw new Error('Unauthorized: Not the parent of this child');
      }

      // Collect all child data
      const userData = await getDoc(doc(firestore, 'users', childUserId));
      const tasksQuery = query(
        collection(firestore, 'tasks'),
        where('assignedTo', '==', childUserId)
      );
      const tasks = await getDocs(tasksQuery);
      
      const rewardsQuery = query(
        collection(firestore, 'rewards'),
        where('userId', '==', childUserId)
      );
      const rewards = await getDocs(rewardsQuery);

      return {
        profile: userData.data(),
        tasks: tasks.docs.map(d => ({ id: d.id, ...d.data() })),
        rewards: rewards.docs.map(d => ({ id: d.id, ...d.data() })),
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting child data:', error);
      throw error;
    }
  }

  /**
   * Delete all child data upon parent request
   */
  static async deleteChildData(childUserId: string, parentUserId: string): Promise<void> {
    try {
      // Verify parent-child relationship
      const isParent = await this.verifyParentChildRelationship(parentUserId, childUserId);
      if (!isParent) {
        throw new Error('Unauthorized: Not the parent of this child');
      }

      // Delete user document
      await deleteDoc(doc(firestore, 'users', childUserId));
      
      // Delete associated data
      const collections = ['tasks', 'rewards', 'task_photos'];
      
      for (const collectionName of collections) {
        const q = query(
          collection(firestore, collectionName),
          where('userId', '==', childUserId)
        );
        const docs = await getDocs(q);
        
        const batch = writeBatch(firestore);
        docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      
      // Log deletion
      await this.logCoppaEvent('child_data_deleted', {
        childUserId,
        parentUserId,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deleting child data:', error);
      throw error;
    }
  }

  /**
   * Verify parent-child relationship
   */
  private static async verifyParentChildRelationship(
    parentUserId: string, 
    childUserId: string
  ): Promise<boolean> {
    try {
      const childDoc = await getDoc(doc(firestore, 'users', childUserId));
      if (!childDoc.exists()) return false;
      
      const childData = childDoc.data() as ChildAccountData;
      return childData.parentId === parentUserId;
    } catch (error) {
      console.error('Error verifying parent-child relationship:', error);
      return false;
    }
  }

  /**
   * Mock credit card verification
   */
  private static async verifyCreditCard(data: any): Promise<boolean> {
    // In production, this would integrate with a payment processor
    // to perform a small charge and immediate refund
    return true;
  }

  /**
   * Mock ID verification
   */
  private static async verifyId(data: any): Promise<boolean> {
    // In production, this would integrate with an identity verification service
    return true;
  }

  /**
   * Log COPPA-related events for compliance auditing
   */
  private static async logCoppaEvent(eventType: string, data: any): Promise<void> {
    try {
      await addDoc(collection(firestore, 'coppa_audit_log'), {
        eventType,
        data,
        timestamp: new Date(),
        userId: auth.currentUser?.uid,
      });
    } catch (error) {
      console.error('Error logging COPPA event:', error);
    }
  }
}