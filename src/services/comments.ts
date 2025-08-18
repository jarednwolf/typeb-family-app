/**
 * Comment System Service
 * Handles comments on tasks, achievements, and other content
 * Supports nested replies and positive-only interactions
 */

import {
  collection,
  doc,
  setDoc,
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
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { addReaction, removeReaction } from './reactions';

// Comment types that can be attached to different content
export type CommentableContentType = 
  | 'task' 
  | 'achievement' 
  | 'goal' 
  | 'event' 
  | 'announcement'
  | 'celebration';

export interface Comment {
  id: string;
  familyId: string;
  itemId: string; // ID of the item being commented on
  itemType: CommentableContentType;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'parent' | 'child';
  text: string;
  mentions?: string[]; // User IDs mentioned in comment
  parentCommentId?: string; // For replies
  edited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
  reactions?: Record<string, {
    userId: string;
    userName: string;
    reactionType: string;
    timestamp: number;
  }>;
  replyCount?: number;
  depth: number; // 0 for root comments, 1 for replies, max 2
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

export interface CommentMention {
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

const COMMENTS_COLLECTION = 'comments';
const MAX_COMMENT_LENGTH = 500;
const MAX_REPLY_DEPTH = 2;

/**
 * Add a comment to an item
 */
export const addComment = async (
  itemId: string,
  itemType: CommentableContentType,
  familyId: string,
  userId: string,
  userName: string,
  userRole: 'parent' | 'child',
  text: string,
  mentions?: string[],
  parentCommentId?: string,
  userAvatar?: string
): Promise<string> => {
  try {
    // Validate comment
    if (!text.trim()) {
      throw new Error('Comment cannot be empty');
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`);
    }

    // Check reply depth
    let depth = 0;
    if (parentCommentId) {
      const parentDoc = await getDoc(doc(db, COMMENTS_COLLECTION, parentCommentId));
      if (parentDoc.exists()) {
        const parentComment = parentDoc.data() as Comment;
        depth = parentComment.depth + 1;
        if (depth >= MAX_REPLY_DEPTH) {
          throw new Error('Maximum reply depth reached');
        }
      }
    }

    const commentId = doc(collection(db, COMMENTS_COLLECTION)).id;
    const comment: Comment = {
      id: commentId,
      familyId,
      itemId,
      itemType,
      userId,
      userName,
      userAvatar,
      userRole,
      text,
      mentions: mentions || [],
      parentCommentId,
      edited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {},
      replyCount: 0,
      depth,
    };

    await setDoc(doc(db, COMMENTS_COLLECTION, commentId), {
      ...comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update reply count on parent comment if this is a reply
    if (parentCommentId) {
      await updateDoc(doc(db, COMMENTS_COLLECTION, parentCommentId), {
        replyCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    // Update comment count on the original item
    await updateCommentCount(itemId, itemType, 1);

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      await notifyMentionedUsers(mentions, userName, itemId, itemType);
    }

    return commentId;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Edit a comment
 */
export const editComment = async (
  commentId: string,
  userId: string,
  newText: string
): Promise<void> => {
  try {
    const commentDoc = await getDoc(doc(db, COMMENTS_COLLECTION, commentId));
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const comment = commentDoc.data() as Comment;
    if (comment.userId !== userId) {
      throw new Error('Unauthorized to edit this comment');
    }

    if (!newText.trim()) {
      throw new Error('Comment cannot be empty');
    }

    if (newText.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`);
    }

    await updateDoc(doc(db, COMMENTS_COLLECTION, commentId), {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    throw error;
  }
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: 'parent' | 'child'
): Promise<void> => {
  try {
    const commentDoc = await getDoc(doc(db, COMMENTS_COLLECTION, commentId));
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const comment = commentDoc.data() as Comment;
    
    // Only allow deletion by comment author or parents
    if (comment.userId !== userId && userRole !== 'parent') {
      throw new Error('Unauthorized to delete this comment');
    }

    await updateDoc(doc(db, COMMENTS_COLLECTION, commentId), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      text: '[This comment has been deleted]',
    });

    // Update reply count on parent if this was a reply
    if (comment.parentCommentId) {
      await updateDoc(doc(db, COMMENTS_COLLECTION, comment.parentCommentId), {
        replyCount: increment(-1),
      });
    }

    // Update comment count on the original item
    await updateCommentCount(comment.itemId, comment.itemType, -1);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Get comments for an item
 */
export const getComments = async (
  itemId: string,
  itemType: CommentableContentType,
  sortBy: 'newest' | 'oldest' | 'popular' = 'newest',
  limitCount: number = 50
): Promise<CommentThread[]> => {
  try {
    let q = query(
      collection(db, COMMENTS_COLLECTION),
      where('itemId', '==', itemId),
      where('itemType', '==', itemType),
      where('depth', '==', 0), // Get root comments only
      limit(limitCount)
    );

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'popular':
        q = query(q, orderBy('replyCount', 'desc'), orderBy('createdAt', 'desc'));
        break;
    }

    const snapshot = await getDocs(q);
    const threads: CommentThread[] = [];

    // Fetch root comments and their replies
    for (const doc of snapshot.docs) {
      const comment = { id: doc.id, ...doc.data() } as Comment;
      
      // Fetch replies for this comment
      const repliesQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('parentCommentId', '==', comment.id),
        orderBy('createdAt', 'asc')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = repliesSnapshot.docs.map(replyDoc => ({
        id: replyDoc.id,
        ...replyDoc.data(),
      })) as Comment[];

      threads.push({ comment, replies });
    }

    return threads;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Subscribe to real-time comments
 */
export const subscribeToComments = (
  itemId: string,
  itemType: CommentableContentType,
  onUpdate: (threads: CommentThread[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('itemId', '==', itemId),
    where('itemType', '==', itemType),
    where('depth', '==', 0),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const threads: CommentThread[] = [];
      
      for (const doc of snapshot.docs) {
        const comment = { id: doc.id, ...doc.data() } as Comment;
        
        // Fetch replies
        const repliesQuery = query(
          collection(db, COMMENTS_COLLECTION),
          where('parentCommentId', '==', comment.id),
          orderBy('createdAt', 'asc')
        );
        
        const repliesSnapshot = await getDocs(repliesQuery);
        const replies = repliesSnapshot.docs.map(replyDoc => ({
          id: replyDoc.id,
          ...replyDoc.data(),
        })) as Comment[];

        threads.push({ comment, replies });
      }
      
      onUpdate(threads);
    },
    onError || ((error) => console.error('Error listening to comments:', error))
  );
};

/**
 * Add reaction to a comment
 */
export const addCommentReaction = async (
  commentId: string,
  userId: string,
  userName: string,
  reactionType: string,
  userAvatar?: string
): Promise<void> => {
  return addReaction('comment', commentId, userId, userName, reactionType as any, userAvatar);
};

/**
 * Remove reaction from a comment
 */
export const removeCommentReaction = async (
  commentId: string,
  userId: string
): Promise<void> => {
  return removeReaction('comment', commentId, userId);
};

/**
 * Parse mentions from comment text
 */
export const parseMentions = (text: string): CommentMention[] => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: CommentMention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      userName: match[1],
      userId: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
};

/**
 * Format text with mentions
 */
export const formatTextWithMentions = (
  text: string,
  mentions: CommentMention[]
): string => {
  let formattedText = text;
  
  // Sort mentions by start index in reverse order to maintain indices
  const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex);
  
  sortedMentions.forEach(mention => {
    const mentionText = `@${mention.userName}`;
    formattedText = 
      formattedText.substring(0, mention.startIndex) +
      mentionText +
      formattedText.substring(mention.endIndex);
  });
  
  return formattedText;
};

/**
 * Get comment count for an item
 */
export const getCommentCount = async (
  itemId: string,
  itemType: CommentableContentType
): Promise<number> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('itemId', '==', itemId),
      where('itemType', '==', itemType),
      where('deletedAt', '==', null)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
};

/**
 * Update comment count on the original item
 */
const updateCommentCount = async (
  itemId: string,
  itemType: CommentableContentType,
  delta: number
): Promise<void> => {
  try {
    const collectionName = getCollectionName(itemType);
    await updateDoc(doc(db, collectionName, itemId), {
      commentCount: increment(delta),
      lastCommentAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
};

/**
 * Get collection name based on content type
 */
const getCollectionName = (contentType: CommentableContentType): string => {
  switch (contentType) {
    case 'task':
      return 'tasks';
    case 'achievement':
      return 'achievements';
    case 'goal':
      return 'goals';
    case 'event':
      return 'events';
    case 'announcement':
      return 'announcements';
    case 'celebration':
      return 'celebrations';
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }
};

/**
 * Send notifications to mentioned users
 */
const notifyMentionedUsers = async (
  mentionedUserIds: string[],
  mentionerName: string,
  itemId: string,
  itemType: CommentableContentType
): Promise<void> => {
  // This would integrate with your notification service
  // For now, we'll just log it
  console.log(`Notifying users ${mentionedUserIds.join(', ')} about mention by ${mentionerName}`);
};

/**
 * Get recent comments for a family
 */
export const getRecentFamilyComments = async (
  familyId: string,
  limitCount: number = 20
): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('familyId', '==', familyId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
  } catch (error) {
    console.error('Error fetching recent comments:', error);
    return [];
  }
};

/**
 * Report a comment for moderation
 */
export const reportComment = async (
  commentId: string,
  reportedBy: string,
  reason: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, COMMENTS_COLLECTION, commentId), {
      flaggedBy: arrayUnion(reportedBy),
      flagReason: reason,
      flaggedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    throw error;
  }
};