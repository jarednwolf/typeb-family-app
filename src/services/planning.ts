/**
 * Planning Service
 * 
 * Manages collaborative family planning and decision-making
 * Promotes democratic participation and family unity
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
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  PlanningSession,
  PlanningType,
  PlanningStatus,
  PlanningParticipant,
  PlanningItem,
  ItemComment,
  PlanningDecision,
  PlanningAttachment
} from '../types/community';
import { analyticsService } from './analytics';
import { format, isAfter, isBefore, differenceInHours } from 'date-fns';

const PLANNING_COLLECTION = 'planningSessions';
const MAX_ITEMS = 50;
const MAX_PARTICIPANTS = 20;
const MAX_ATTACHMENTS = 10;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 500;
const MIN_VOTE_VALUE = 1;
const MAX_VOTE_VALUE = 5;
const DEFAULT_VOTING_HOURS = 48;

// Planning type configurations
const PLANNING_CONFIG: { [key in PlanningType]: { icon: string; color: string; defaultDuration: number } } = {
  [PlanningType.VACATION]: { icon: '🏖️', color: '#00BCD4', defaultDuration: 72 },
  [PlanningType.WEEKEND]: { icon: '📅', color: '#4CAF50', defaultDuration: 24 },
  [PlanningType.MEAL]: { icon: '🍽️', color: '#FF9800', defaultDuration: 12 },
  [PlanningType.BUDGET]: { icon: '💵', color: '#FFC107', defaultDuration: 48 },
  [PlanningType.CHORES]: { icon: '🧹', color: '#9C27B0', defaultDuration: 24 },
  [PlanningType.SHOPPING]: { icon: '🛒', color: '#E91E63', defaultDuration: 24 },
  [PlanningType.EVENT]: { icon: '🎉', color: '#2196F3', defaultDuration: 48 },
  [PlanningType.PROJECT]: { icon: '🔨', color: '#795548', defaultDuration: 72 },
  [PlanningType.GENERAL]: { icon: '💬', color: '#607D8B', defaultDuration: 48 }
};

export class PlanningService {
  private static instance: PlanningService;

  private constructor() {}

  static getInstance(): PlanningService {
    if (!PlanningService.instance) {
      PlanningService.instance = new PlanningService();
    }
    return PlanningService.instance;
  }

  /**
   * Create a new planning session
   */
  async createPlanningSession(
    familyId: string,
    data: {
      title: string;
      description: string;
      type: PlanningType;
      participants?: string[]; // User IDs
      items?: Omit<PlanningItem, 'id' | 'suggestedBy' | 'suggestedByName' | 'votes' | 'comments' | 'isApproved'>[];
      votingEnabled?: boolean;
      votingDeadline?: Date;
      scheduledDate?: Date;
      attachments?: PlanningAttachment[];
      notes?: string;
    }
  ): Promise<PlanningSession> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate input
      if (data.title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title exceeds ${MAX_TITLE_LENGTH} characters`);
      }
      if (data.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
      }
      if (data.items && data.items.length > MAX_ITEMS) {
        throw new Error(`Maximum ${MAX_ITEMS} items allowed`);
      }
      if (data.participants && data.participants.length > MAX_PARTICIPANTS) {
        throw new Error(`Maximum ${MAX_PARTICIPANTS} participants allowed`);
      }
      if (data.attachments && data.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      }

      // Get initiator details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      // Prepare participants list
      const participants: PlanningParticipant[] = [];
      
      // Add initiator as organizer
      participants.push({
        userId: currentUser.uid,
        name: userData?.displayName || 'Family Member',
        avatar: userData?.avatar,
        role: 'organizer',
        hasVoted: false,
        joinedAt: new Date()
      });

      // Add other participants
      if (data.participants) {
        for (const userId of data.participants) {
          if (userId === currentUser.uid) continue; // Skip initiator
          
          const participantDoc = await getDoc(doc(db, 'users', userId));
          const participantData = participantDoc.data();
          
          participants.push({
            userId,
            name: participantData?.displayName || 'Family Member',
            avatar: participantData?.avatar,
            role: 'participant',
            hasVoted: false,
            joinedAt: new Date()
          });
        }
      }

      // Prepare initial items
      const items: PlanningItem[] = (data.items || []).map((item, index) => ({
        id: `${Date.now()}_${index}`,
        title: item.title,
        description: item.description,
        category: item.category,
        suggestedBy: currentUser.uid,
        suggestedByName: userData?.displayName || 'Family Member',
        votes: {},
        comments: [],
        isApproved: false,
        order: item.order || index,
        metadata: item.metadata
      }));

      // Set voting deadline if enabled
      let votingDeadline = data.votingDeadline;
      if (data.votingEnabled && !votingDeadline) {
        const config = PLANNING_CONFIG[data.type];
        votingDeadline = new Date(Date.now() + config.defaultDuration * 60 * 60 * 1000);
      }

      // Create planning session
      const session: Omit<PlanningSession, 'id'> = {
        familyId,
        initiatorId: currentUser.uid,
        initiatorName: userData?.displayName || 'Family Member',
        title: data.title,
        description: data.description,
        type: data.type,
        status: PlanningStatus.BRAINSTORMING,
        participants,
        items,
        decisions: [],
        votingEnabled: data.votingEnabled || false,
        votingDeadline,
        scheduledDate: data.scheduledDate,
        attachments: data.attachments || [],
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, PLANNING_COLLECTION), session);
      const createdSession = {
        id: docRef.id,
        ...session
      };

      // Notify participants
      await this.notifyParticipants(createdSession, 'new');

      // Log analytics
      await analyticsService.track('planning_session_created' as any, {
        type: data.type,
        participantCount: participants.length,
        itemCount: items.length,
        votingEnabled: data.votingEnabled
      });

      return createdSession;
    } catch (error) {
      console.error('Error creating planning session:', error);
      throw error;
    }
  }

  /**
   * Get planning sessions for a family
   */
  async getPlanningSessions(
    familyId: string,
    options?: {
      type?: PlanningType;
      status?: PlanningStatus;
      participantId?: string;
      limit?: number;
    }
  ): Promise<PlanningSession[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let constraints: any[] = [
        where('familyId', '==', familyId)
      ];

      // Apply filters
      if (options?.type) {
        constraints.push(where('type', '==', options.type));
      }
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      // Order by status (active first), then by date
      constraints.push(orderBy('status'));
      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, PLANNING_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      let sessions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PlanningSession[];

      // Filter by participant if specified
      if (options?.participantId) {
        sessions = sessions.filter(s => 
          s.participants.some(p => p.userId === options.participantId)
        );
      }

      return sessions;
    } catch (error) {
      console.error('Error fetching planning sessions:', error);
      throw error;
    }
  }

  /**
   * Add item to planning session
   */
  async addItem(
    sessionId: string,
    item: {
      title: string;
      description?: string;
      category?: string;
      metadata?: {
        cost?: number;
        duration?: number;
        location?: string;
        date?: Date;
      };
    }
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      // Check if user is a participant
      const isParticipant = session.participants.some(p => p.userId === currentUser.uid);
      if (!isParticipant) {
        throw new Error('Only participants can add items');
      }

      // Check status
      if (session.status !== PlanningStatus.BRAINSTORMING && session.status !== PlanningStatus.VOTING) {
        throw new Error('Cannot add items to finalized sessions');
      }

      // Check max items
      if (session.items.length >= MAX_ITEMS) {
        throw new Error(`Maximum ${MAX_ITEMS} items allowed`);
      }

      // Get user details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const newItem: PlanningItem = {
        id: `${Date.now()}_${session.items.length}`,
        title: item.title,
        description: item.description,
        category: item.category,
        suggestedBy: currentUser.uid,
        suggestedByName: userData?.displayName || 'Family Member',
        votes: {},
        comments: [],
        isApproved: false,
        order: session.items.length,
        metadata: item.metadata
      };

      session.items.push(newItem);

      await updateDoc(doc(db, PLANNING_COLLECTION, sessionId), {
        items: session.items,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('planning_item_added' as any, {
        sessionId,
        hasMetadata: !!item.metadata
      });
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  /**
   * Vote on planning item
   */
  async voteOnItem(
    sessionId: string,
    itemId: string,
    rating: number
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate rating
      if (rating < MIN_VOTE_VALUE || rating > MAX_VOTE_VALUE) {
        throw new Error(`Rating must be between ${MIN_VOTE_VALUE} and ${MAX_VOTE_VALUE}`);
      }

      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      // Check if user is a participant
      const participantIndex = session.participants.findIndex(p => p.userId === currentUser.uid);
      if (participantIndex === -1) {
        throw new Error('Only participants can vote');
      }

      // Check if voting is enabled
      if (!session.votingEnabled) {
        throw new Error('Voting is not enabled for this session');
      }

      // Check voting deadline
      if (session.votingDeadline && isAfter(new Date(), session.votingDeadline)) {
        throw new Error('Voting deadline has passed');
      }

      // Check status
      if (session.status !== PlanningStatus.VOTING && session.status !== PlanningStatus.BRAINSTORMING) {
        throw new Error('Voting is closed for this session');
      }

      // Find and update item
      const itemIndex = session.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Record vote
      session.items[itemIndex].votes = session.items[itemIndex].votes || {};
      session.items[itemIndex].votes[currentUser.uid] = rating;

      // Mark participant as having voted
      session.participants[participantIndex].hasVoted = true;

      await updateDoc(doc(db, PLANNING_COLLECTION, sessionId), {
        items: session.items,
        participants: session.participants,
        updatedAt: serverTimestamp()
      });

      // Check if all participants have voted
      const allVoted = session.participants.every(p => p.hasVoted);
      if (allVoted && session.status === PlanningStatus.VOTING) {
        await this.updateStatus(sessionId, PlanningStatus.FINALIZING);
      }

      await analyticsService.track('planning_item_voted' as any, {
        sessionId,
        itemId,
        rating
      });
    } catch (error) {
      console.error('Error voting on item:', error);
      throw error;
    }
  }

  /**
   * Add comment to item
   */
  async addComment(
    sessionId: string,
    itemId: string,
    comment: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate comment
      if (comment.length > MAX_COMMENT_LENGTH) {
        throw new Error(`Comment exceeds ${MAX_COMMENT_LENGTH} characters`);
      }

      // Check for negative language (simple check - could be enhanced)
      const negativeWords = ['hate', 'stupid', 'dumb', 'awful', 'terrible', 'worst'];
      const commentLower = comment.toLowerCase();
      if (negativeWords.some(word => commentLower.includes(word))) {
        throw new Error('Please keep comments positive and constructive');
      }

      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      // Check if user is a participant
      const isParticipant = session.participants.some(p => p.userId === currentUser.uid);
      if (!isParticipant) {
        throw new Error('Only participants can comment');
      }

      // Find item
      const itemIndex = session.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Get user details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const newComment: ItemComment = {
        id: `${Date.now()}_${currentUser.uid}`,
        authorId: currentUser.uid,
        authorName: userData?.displayName || 'Family Member',
        content: comment,
        isPositive: true, // Always mark as positive after validation
        createdAt: new Date()
      };

      session.items[itemIndex].comments = session.items[itemIndex].comments || [];
      session.items[itemIndex].comments.push(newComment);

      await updateDoc(doc(db, PLANNING_COLLECTION, sessionId), {
        items: session.items,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('planning_comment_added' as any, {
        sessionId,
        itemId
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Make decision on item
   */
  async makeDecision(
    sessionId: string,
    itemId: string,
    decision: 'approved' | 'rejected' | 'modified',
    reason?: string,
    finalDetails?: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      // Check if user is organizer or admin
      const isOrganizer = session.initiatorId === currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'parent';
      
      if (!isOrganizer && !isAdmin) {
        throw new Error('Only organizers or admins can make decisions');
      }

      // Find item
      const itemIndex = session.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Update item approval status
      session.items[itemIndex].isApproved = decision === 'approved';

      // Add decision record
      const newDecision: PlanningDecision = {
        id: `${Date.now()}_${itemId}`,
        itemId,
        decision,
        reason,
        decidedBy: currentUser.uid,
        decidedAt: new Date(),
        finalDetails
      };

      session.decisions.push(newDecision);

      // Update status if all items have been decided
      const undecidedItems = session.items.filter(item => 
        !session.decisions.some(d => d.itemId === item.id)
      );
      
      if (undecidedItems.length === 0) {
        session.status = PlanningStatus.APPROVED;
      }

      await updateDoc(doc(db, PLANNING_COLLECTION, sessionId), {
        items: session.items,
        decisions: session.decisions,
        status: session.status,
        updatedAt: serverTimestamp()
      });

      await analyticsService.track('planning_decision_made' as any, {
        sessionId,
        itemId,
        decision
      });
    } catch (error) {
      console.error('Error making decision:', error);
      throw error;
    }
  }

  /**
   * Update planning session status
   */
  async updateStatus(
    sessionId: string,
    status: PlanningStatus
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      // Check if user is organizer
      if (session.initiatorId !== currentUser.uid) {
        throw new Error('Only the organizer can update session status');
      }

      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      };

      // Set completed date if completing
      if (status === PlanningStatus.COMPLETED) {
        updates.completedDate = serverTimestamp();
      }

      await updateDoc(doc(db, PLANNING_COLLECTION, sessionId), updates);

      // Notify participants of status change
      if (status === PlanningStatus.VOTING || status === PlanningStatus.APPROVED) {
        await this.notifyParticipants({ ...session, status } as PlanningSession, 'status');
      }

      await analyticsService.track('planning_status_updated' as any, {
        sessionId,
        newStatus: status
      });
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Get voting results for a session
   */
  async getVotingResults(sessionId: string): Promise<{
    items: Array<{
      id: string;
      title: string;
      averageRating: number;
      totalVotes: number;
      approvalPercentage: number;
    }>;
    participation: number;
  }> {
    try {
      const sessionDoc = await getDoc(doc(db, PLANNING_COLLECTION, sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Planning session not found');
      }

      const session = sessionDoc.data() as PlanningSession;
      
      const results = session.items.map(item => {
        const votes = Object.values(item.votes || {});
        const totalVotes = votes.length;
        const averageRating = totalVotes > 0 
          ? votes.reduce((sum, v) => sum + v, 0) / totalVotes 
          : 0;
        const approvalPercentage = totalVotes > 0
          ? (votes.filter(v => v >= 4).length / totalVotes) * 100
          : 0;

        return {
          id: item.id,
          title: item.title,
          averageRating: Math.round(averageRating * 10) / 10,
          totalVotes,
          approvalPercentage: Math.round(approvalPercentage)
        };
      });

      // Sort by average rating
      results.sort((a, b) => b.averageRating - a.averageRating);

      const participation = session.participants.length > 0
        ? (session.participants.filter(p => p.hasVoted).length / session.participants.length) * 100
        : 0;

      return {
        items: results,
        participation: Math.round(participation)
      };
    } catch (error) {
      console.error('Error getting voting results:', error);
      throw error;
    }
  }

  /**
   * Subscribe to planning session updates
   */
  subscribeToSession(
    sessionId: string,
    callback: (session: PlanningSession | null) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, PLANNING_COLLECTION, sessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data()
          } as PlanningSession);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to planning session:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Private helper methods
   */
  
  private async notifyParticipants(
    session: PlanningSession,
    type: 'new' | 'status' | 'decision'
  ): Promise<void> {
    try {
      const notifications = session.participants
        .filter(p => p.userId !== auth.currentUser?.uid)
        .map(async (participant) => {
          let title = '';
          let body = '';
          
          switch (type) {
            case 'new':
              title = '📋 New Planning Session';
              body = `You're invited to plan: "${session.title}"`;
              break;
            case 'status':
              title = '🔄 Planning Update';
              body = `"${session.title}" status changed to ${session.status}`;
              break;
            case 'decision':
              title = '✅ Decision Made';
              body = `Decisions have been made for "${session.title}"`;
              break;
          }

          // Send notification
          console.log(`Notification to ${participant.userId}:`, { title, body });
        });

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notifying participants:', error);
    }
  }
}

export const planningService = PlanningService.getInstance();