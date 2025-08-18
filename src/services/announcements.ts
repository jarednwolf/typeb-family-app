/**
 * Announcement Service
 * 
 * Manages family-wide announcements and updates
 * Focuses on positive communication and family unity
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  deleteField,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementAttachment
} from '../types/community';
import notificationService from './notifications';
import { analyticsService } from './analytics';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const MAX_ATTACHMENTS = 5;
const MAX_ANNOUNCEMENT_LENGTH = 2000;
const ANNOUNCEMENT_EXPIRY_DAYS = 30; // Default expiry for non-pinned announcements

export class AnnouncementService {
  private static instance: AnnouncementService;

  private constructor() {}

  static getInstance(): AnnouncementService {
    if (!AnnouncementService.instance) {
      AnnouncementService.instance = new AnnouncementService();
    }
    return AnnouncementService.instance;
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(
    familyId: string,
    data: {
      title: string;
      content: string;
      category: AnnouncementCategory;
      priority?: AnnouncementPriority;
      attachments?: File[];
      isPinned?: boolean;
      expiresAt?: Date;
      metadata?: {
        eventId?: string;
        goalId?: string;
        taskId?: string;
      };
    }
  ): Promise<Announcement> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate content length
      if (data.content.length > MAX_ANNOUNCEMENT_LENGTH) {
        throw new Error(`Announcement content exceeds ${MAX_ANNOUNCEMENT_LENGTH} characters`);
      }

      // Upload attachments if any
      let attachments: AnnouncementAttachment[] = [];
      if (data.attachments && data.attachments.length > 0) {
        if (data.attachments.length > MAX_ATTACHMENTS) {
          throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        }

        attachments = await Promise.all(
          data.attachments.map(async (file, index) => {
            const path = `announcements/${familyId}/${Date.now()}_${index}`;
            const url = await this.uploadFile(file, path);
            
            return {
              id: `${Date.now()}_${index}`,
              type: file.type.startsWith('image/') ? 'image' : 'document',
              url,
              name: file.name,
              size: file.size,
              thumbnailUrl: file.type.startsWith('image/') ? url : undefined
            } as AnnouncementAttachment;
          })
        );
      }

      // Get user details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      // Create announcement
      const announcement: Omit<Announcement, 'id'> = {
        familyId,
        authorId: currentUser.uid,
        authorName: userData?.displayName || 'Family Member',
        authorAvatar: userData?.avatar,
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority || AnnouncementPriority.NORMAL,
        attachments,
        reactions: {},
        readBy: [currentUser.uid], // Author has read it
        isPinned: data.isPinned || false,
        expiresAt: data.expiresAt || this.getDefaultExpiry(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: data.metadata
      };

      const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), announcement);

      const createdAnnouncement = {
        id: docRef.id,
        ...announcement
      };

      // Send notifications to family members
      await this.notifyFamilyMembers(familyId, createdAnnouncement, currentUser.uid);

      // Log analytics
      await analyticsService.track('announcement_created' as any, {
        category: data.category,
        priority: data.priority,
        hasAttachments: attachments.length > 0,
        isPinned: data.isPinned
      });

      return createdAnnouncement;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  /**
   * Get announcements for a family
   */
  async getAnnouncements(
    familyId: string,
    options?: {
      category?: AnnouncementCategory;
      priority?: AnnouncementPriority;
      pinnedOnly?: boolean;
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<Announcement[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let constraints: any[] = [
        where('familyId', '==', familyId)
      ];

      // Apply filters
      if (options?.category) {
        constraints.push(where('category', '==', options.category));
      }
      if (options?.priority) {
        constraints.push(where('priority', '==', options.priority));
      }
      if (options?.pinnedOnly) {
        constraints.push(where('isPinned', '==', true));
      }

      // Order by pinned first, then by date
      constraints.push(orderBy('isPinned', 'desc'));
      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, ANNOUNCEMENTS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      const announcements = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Announcement[];

      // Filter unread if requested
      if (options?.unreadOnly) {
        return announcements.filter(a => !a.readBy.includes(currentUser.uid));
      }

      // Filter out expired announcements
      const now = new Date();
      return announcements.filter(a => 
        a.isPinned || !a.expiresAt || a.expiresAt > now
      );
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  }

  /**
   * Mark announcement as read
   */
  async markAsRead(announcementId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
        readBy: arrayUnion(currentUser.uid),
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('announcement_read' as any, { announcementId });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      throw error;
    }
  }

  /**
   * Add reaction to announcement
   */
  async addReaction(announcementId: string, emoji: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate positive emoji only
      const positiveEmojis = ['👍', '❤️', '🎉', '👏', '😊', '🌟', '💪', '🙌'];
      if (!positiveEmojis.includes(emoji)) {
        throw new Error('Only positive reactions are allowed');
      }

      await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
        [`reactions.${currentUser.uid}`]: emoji,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('announcement_reaction_added' as any, {
        announcementId, 
        emoji 
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from announcement
   */
  async removeReaction(announcementId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
        [`reactions.${currentUser.uid}`]: deleteField(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Update announcement (author or admin only)
   */
  async updateAnnouncement(
    announcementId: string,
    updates: Partial<{
      title: string;
      content: string;
      category: AnnouncementCategory;
      priority: AnnouncementPriority;
      isPinned: boolean;
      expiresAt: Date;
    }>
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check if user is author or admin
      const announcementDoc = await getDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId));
      if (!announcementDoc.exists()) {
        throw new Error('Announcement not found');
      }

      const announcement = announcementDoc.data() as Announcement;
      
      // Check permissions
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isAuthor = announcement.authorId === currentUser.uid;
      const isAdmin = userData?.role === 'parent';

      if (!isAuthor && !isAdmin) {
        throw new Error('Insufficient permissions to update announcement');
      }

      // Validate content length if updating
      if (updates.content && updates.content.length > MAX_ANNOUNCEMENT_LENGTH) {
        throw new Error(`Announcement content exceeds ${MAX_ANNOUNCEMENT_LENGTH} characters`);
      }

      await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('announcement_updated' as any, {
        announcementId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  /**
   * Delete announcement (author or admin only)
   */
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check if user is author or admin
      const announcementDoc = await getDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId));
      if (!announcementDoc.exists()) {
        throw new Error('Announcement not found');
      }

      const announcement = announcementDoc.data() as Announcement;
      
      // Check permissions
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isAuthor = announcement.authorId === currentUser.uid;
      const isAdmin = userData?.role === 'parent';

      if (!isAuthor && !isAdmin) {
        throw new Error('Insufficient permissions to delete announcement');
      }

      await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId));

      await analyticsService.track('announcement_deleted' as any, { announcementId });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  /**
   * Get announcement statistics
   */
  async getAnnouncementStats(familyId: string): Promise<{
    total: number;
    unread: number;
    pinned: number;
    byCategory: { [key in AnnouncementCategory]?: number };
    averageReadRate: number;
  }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const announcements = await this.getAnnouncements(familyId);
      
      const stats = {
        total: announcements.length,
        unread: 0,
        pinned: 0,
        byCategory: {} as { [key in AnnouncementCategory]?: number },
        averageReadRate: 0
      };

      let totalReaders = 0;
      
      for (const announcement of announcements) {
        // Count unread
        if (!announcement.readBy.includes(currentUser.uid)) {
          stats.unread++;
        }
        
        // Count pinned
        if (announcement.isPinned) {
          stats.pinned++;
        }
        
        // Count by category
        stats.byCategory[announcement.category] = 
          (stats.byCategory[announcement.category] || 0) + 1;
        
        // Calculate read rate
        totalReaders += announcement.readBy.length;
      }

      // Get family member count for read rate calculation
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.data();
      const memberCount = familyData?.members?.length || 1;
      
      if (announcements.length > 0) {
        stats.averageReadRate = (totalReaders / (announcements.length * memberCount)) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error getting announcement stats:', error);
      throw error;
    }
  }

  /**
   * Search announcements
   */
  async searchAnnouncements(
    familyId: string,
    searchTerm: string
  ): Promise<Announcement[]> {
    try {
      const announcements = await this.getAnnouncements(familyId);
      
      const searchLower = searchTerm.toLowerCase();
      return announcements.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower) ||
        a.authorName.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching announcements:', error);
      throw error;
    }
  }

  /**
   * Subscribe to announcement updates
   */
  subscribeToAnnouncements(
    familyId: string,
    callback: (announcements: Announcement[]) => void
  ): () => void {
    const q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      where('familyId', '==', familyId),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
          const announcements = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as Announcement[];
          
          // Filter out expired
          const now = new Date();
          const validAnnouncements = announcements.filter(a => 
            a.isPinned || !a.expiresAt || a.expiresAt > now
          );
          
          callback(validAnnouncements);
        },
        (error) => {
          console.error('Error subscribing to announcements:', error);
        }
      );

    return unsubscribe;
  }

  /**
   * Upload a file to Firebase Storage
   */
  private async uploadFile(file: File, path: string): Promise<string> {
    try {
      // Create a blob from the file
      const response = await fetch(file as any);
      const blob = await response.blob();
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
        },
      });
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Private helper methods
   */
  private getDefaultExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + ANNOUNCEMENT_EXPIRY_DAYS);
    return expiry;
  }

  private async notifyFamilyMembers(
    familyId: string,
    announcement: Announcement,
    excludeUserId: string
  ): Promise<void> {
    try {
      // Get family members
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.data();
      if (!familyData?.members) return;

      // Notify each member except the author
      const notificationPromises = familyData.members
        .filter((memberId: string) => memberId !== excludeUserId)
        .map(async (memberId: string) => {
          // Send notification using push notifications service
          // For now, we'll just log it since sendNotification doesn't exist
          console.log('Notification would be sent to:', memberId, {
            title: `📢 ${announcement.title}`,
            body: announcement.content.substring(0, 100),
            data: {
              type: 'announcement',
              announcementId: announcement.id,
              category: announcement.category,
              priority: announcement.priority
            }
          });
        });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying family members:', error);
      // Don't throw - notifications are not critical
    }
  }
}

export const announcementService = AnnouncementService.getInstance();