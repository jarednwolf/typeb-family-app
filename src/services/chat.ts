/**
 * Chat Service for TypeB Family App
 * Handles all chat operations with safety and moderation features
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
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  ChatMessage,
  ChatRoom,
  MessageType,
  MessageStatus,
  ModerationStatus,
  ModerationSettings,
  TypingIndicator,
  VoiceMessageMetadata,
  ChatSearchParams,
  SafetyReport,
  PROFANITY_LIST,
  SAFE_DOMAINS,
} from '../types/chat';
import { addReaction, removeReaction } from './reactions';

// Constants
const MESSAGES_COLLECTION = 'messages';
const CHAT_ROOMS_COLLECTION = 'chatRooms';
const TYPING_COLLECTION = 'typing';
const SAFETY_REPORTS_COLLECTION = 'safetyReports';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_VOICE_DURATION = 120; // 2 minutes
const TYPING_TIMEOUT = 10000; // 10 seconds

/**
 * Create or get a family chat room
 */
export const createOrGetFamilyChatRoom = async (
  familyId: string,
  familyName: string,
  adminIds: string[]
): Promise<ChatRoom> => {
  try {
    const chatRoomId = `family_${familyId}`;
    const chatRoomRef = doc(db, CHAT_ROOMS_COLLECTION, chatRoomId);
    const chatRoomDoc = await getDoc(chatRoomRef);

    if (chatRoomDoc.exists()) {
      return { id: chatRoomId, ...chatRoomDoc.data() } as ChatRoom;
    }

    // Create new chat room
    const newChatRoom: Omit<ChatRoom, 'id'> = {
      familyId,
      name: `${familyName} Chat`,
      type: 'family',
      participantIds: [], // Will be populated as members join
      adminIds,
      isActive: true,
      allowVoiceMessages: true,
      allowImages: true,
      requireModeration: false, // Can be enabled by parents
      autoModerateLinks: true,
      autoModerateProfanity: true,
      createdAt: new Date(),
      createdBy: adminIds[0] || '',
      updatedAt: new Date(),
    };

    await setDoc(chatRoomRef, {
      ...newChatRoom,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: chatRoomId, ...newChatRoom };
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

/**
 * Send a text message
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'parent' | 'child',
  text: string,
  senderAvatar?: string,
  replyTo?: ChatMessage
): Promise<string> => {
  try {
    // Validate message
    if (!text.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }

    // Get chat room for settings
    const chatRoom = await getChatRoom(chatId);
    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // Apply moderation if needed
    const moderationStatus = await checkMessageModeration(text, senderRole, chatRoom);

    const messageId = doc(collection(db, MESSAGES_COLLECTION)).id;
    const message: ChatMessage = {
      id: messageId,
      familyId: chatRoom.familyId,
      chatId,
      senderId,
      senderName,
      senderAvatar,
      senderRole,
      type: 'text',
      text,
      status: 'sent',
      moderationStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {},
      readBy: {
        [senderId]: {
          userId: senderId,
          readAt: new Date(),
        },
      },
    };

    if (replyTo) {
      message.replyTo = {
        messageId: replyTo.id,
        senderId: replyTo.senderId,
        senderName: replyTo.senderName,
        preview: (replyTo.text || 'Media message').substring(0, 50),
      };
    }

    await setDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      ...message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update chat room last message
    await updateDoc(doc(db, CHAT_ROOMS_COLLECTION, chatId), {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: text.substring(0, 100),
      updatedAt: serverTimestamp(),
    });

    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Send a voice message
 */
export const sendVoiceMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'parent' | 'child',
  audioBlob: Blob,
  duration: number,
  senderAvatar?: string
): Promise<string> => {
  try {
    if (duration > MAX_VOICE_DURATION) {
      throw new Error(`Voice message exceeds maximum duration of ${MAX_VOICE_DURATION} seconds`);
    }

    // Upload voice file to storage
    const voiceFileName = `chat/${chatId}/voice/${Date.now()}_${senderId}.mp3`;
    const voiceRef = ref(storage, voiceFileName);
    await uploadBytes(voiceRef, audioBlob);
    const voiceUrl = await getDownloadURL(voiceRef);

    const messageId = doc(collection(db, MESSAGES_COLLECTION)).id;
    const message: ChatMessage = {
      id: messageId,
      familyId: (await getChatRoom(chatId))?.familyId || '',
      chatId,
      senderId,
      senderName,
      senderAvatar,
      senderRole,
      type: 'voice',
      voiceUrl,
      voiceDuration: duration,
      status: 'sent',
      moderationStatus: senderRole === 'parent' ? 'approved' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {},
      readBy: {
        [senderId]: {
          userId: senderId,
          readAt: new Date(),
        },
      },
    };

    await setDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      ...message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update chat room
    await updateDoc(doc(db, CHAT_ROOMS_COLLECTION, chatId), {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: '🎤 Voice message',
      updatedAt: serverTimestamp(),
    });

    return messageId;
  } catch (error) {
    console.error('Error sending voice message:', error);
    throw error;
  }
};

/**
 * Send an image message
 */
export const sendImageMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'parent' | 'child',
  imageUri: string,
  senderAvatar?: string
): Promise<string> => {
  try {
    // Upload image to storage
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const imageFileName = `chat/${chatId}/images/${Date.now()}_${senderId}.jpg`;
    const imageRef = ref(storage, imageFileName);
    await uploadBytes(imageRef, blob);
    const imageUrl = await getDownloadURL(imageRef);

    // Create thumbnail (in production, use a cloud function)
    const thumbnailUrl = imageUrl; // Placeholder - implement thumbnail generation

    const messageId = doc(collection(db, MESSAGES_COLLECTION)).id;
    const message: ChatMessage = {
      id: messageId,
      familyId: (await getChatRoom(chatId))?.familyId || '',
      chatId,
      senderId,
      senderName,
      senderAvatar,
      senderRole,
      type: 'image',
      imageUrl,
      thumbnailUrl,
      status: 'sent',
      moderationStatus: senderRole === 'parent' ? 'approved' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {},
      readBy: {
        [senderId]: {
          userId: senderId,
          readAt: new Date(),
        },
      },
    };

    await setDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      ...message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update chat room
    await updateDoc(doc(db, CHAT_ROOMS_COLLECTION, chatId), {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: '📷 Photo',
      updatedAt: serverTimestamp(),
    });

    return messageId;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
};

/**
 * Get messages for a chat room
 */
export const getMessages = async (
  chatId: string,
  limitCount: number = 50,
  lastMessage?: DocumentSnapshot
): Promise<ChatMessage[]> => {
  try {
    let q = query(
      collection(db, MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastMessage) {
      q = query(q, startAfter(lastMessage));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

/**
 * Subscribe to real-time messages
 */
export const subscribeToMessages = (
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('chatId', '==', chatId),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      onUpdate(messages);
    },
    onError || ((error) => console.error('Error listening to messages:', error))
  );
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      [`readBy.${userId}`]: {
        userId,
        readAt: serverTimestamp(),
      },
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  messageId: string,
  userId: string,
  userRole: 'parent' | 'child'
): Promise<void> => {
  try {
    const messageDoc = await getDoc(doc(db, MESSAGES_COLLECTION, messageId));
    const message = messageDoc.data() as ChatMessage;

    // Only allow deletion by sender or parents
    if (message.senderId !== userId && userRole !== 'parent') {
      throw new Error('Unauthorized to delete this message');
    }

    await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Check message for moderation
 */
const checkMessageModeration = async (
  text: string,
  senderRole: 'parent' | 'child',
  chatRoom: ChatRoom
): Promise<ModerationStatus> => {
  // Parents' messages are always approved
  if (senderRole === 'parent') {
    return 'approved';
  }

  // Check if moderation is required
  if (!chatRoom.requireModeration) {
    // Still check for profanity and links
    if (chatRoom.autoModerateProfanity && containsProfanity(text)) {
      return 'flagged';
    }
    if (chatRoom.autoModerateLinks && containsUnsafeLinks(text)) {
      return 'flagged';
    }
    return 'approved';
  }

  // Child message requiring moderation
  return 'pending';
};

/**
 * Check for profanity
 */
const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word.toLowerCase()));
};

/**
 * Check for unsafe links
 */
const containsUnsafeLinks = (text: string): boolean => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  
  if (!urls) return false;
  
  return urls.some(url => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return !SAFE_DOMAINS.some(safeDomain => domain.includes(safeDomain));
    } catch {
      return true; // Invalid URL is considered unsafe
    }
  });
};

/**
 * Approve or reject a message (parent moderation)
 */
export const moderateMessage = async (
  messageId: string,
  moderatorId: string,
  approved: boolean,
  moderationNote?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      moderationStatus: approved ? 'approved' : 'removed',
      moderatedBy: moderatorId,
      moderationNote,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error moderating message:', error);
    throw error;
  }
};

/**
 * Get pending messages for moderation
 */
export const getPendingMessages = async (
  chatId: string
): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      where('moderationStatus', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return [];
  }
};

/**
 * Report a message for safety review
 */
export const reportMessage = async (
  messageId: string,
  reportedBy: string,
  reason: 'inappropriate' | 'bullying' | 'spam' | 'other',
  description: string
): Promise<void> => {
  try {
    const reportId = doc(collection(db, SAFETY_REPORTS_COLLECTION)).id;
    const messageDoc = await getDoc(doc(db, MESSAGES_COLLECTION, messageId));
    const message = messageDoc.data() as ChatMessage;

    const report: SafetyReport = {
      id: reportId,
      familyId: message.familyId,
      reportedBy,
      reportedMessageId: messageId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    await setDoc(doc(db, SAFETY_REPORTS_COLLECTION, reportId), {
      ...report,
      createdAt: serverTimestamp(),
    });

    // Flag the message
    await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      flaggedBy: arrayUnion(reportedBy),
      moderationStatus: 'flagged',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reporting message:', error);
    throw error;
  }
};

/**
 * Add reaction to message
 */
export const addMessageReaction = async (
  messageId: string,
  userId: string,
  userName: string,
  reactionType: string
): Promise<void> => {
  return addReaction('comment', messageId, userId, userName, reactionType as any);
};

/**
 * Remove reaction from message
 */
export const removeMessageReaction = async (
  messageId: string,
  userId: string
): Promise<void> => {
  return removeReaction('comment', messageId, userId);
};

/**
 * Update typing indicator
 */
export const updateTypingIndicator = async (
  chatId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const typingRef = doc(db, TYPING_COLLECTION, `${chatId}_${userId}`);
    
    if (isTyping) {
      await setDoc(typingRef, {
        chatId,
        userId,
        userName,
        startedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(typingRef);
    }
  } catch (error) {
    console.error('Error updating typing indicator:', error);
  }
};

/**
 * Subscribe to typing indicators
 */
export const subscribeToTypingIndicators = (
  chatId: string,
  onUpdate: (typingUsers: TypingIndicator[]) => void
): (() => void) => {
  const q = query(
    collection(db, TYPING_COLLECTION),
    where('chatId', '==', chatId)
  );

  return onSnapshot(q, (snapshot) => {
    const typingUsers = snapshot.docs
      .map(doc => doc.data() as TypingIndicator)
      .filter(indicator => {
        // Filter out expired indicators (older than 10 seconds)
        const startedAt = indicator.startedAt;
        if (startedAt instanceof Timestamp) {
          const elapsed = Date.now() - startedAt.toDate().getTime();
          return elapsed < TYPING_TIMEOUT;
        }
        return false;
      });
    
    onUpdate(typingUsers);
  });
};

/**
 * Search messages
 */
export const searchMessages = async (
  params: ChatSearchParams
): Promise<ChatMessage[]> => {
  try {
    let q = query(collection(db, MESSAGES_COLLECTION));
    
    if (params.chatId) {
      q = query(q, where('chatId', '==', params.chatId));
    }
    
    if (params.senderId) {
      q = query(q, where('senderId', '==', params.senderId));
    }
    
    if (params.messageType) {
      q = query(q, where('type', '==', params.messageType));
    }
    
    if (!params.includeDeleted) {
      q = query(q, where('deletedAt', '==', null));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    if (params.limit) {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];

    // Filter by text search if query provided
    if (params.query) {
      const searchQuery = params.query.toLowerCase();
      return messages.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery)
      );
    }

    return messages;
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
};

/**
 * Get chat room details
 */
export const getChatRoom = async (chatId: string): Promise<ChatRoom | null> => {
  try {
    const chatRoomDoc = await getDoc(doc(db, CHAT_ROOMS_COLLECTION, chatId));
    if (chatRoomDoc.exists()) {
      return { id: chatId, ...chatRoomDoc.data() } as ChatRoom;
    }
    return null;
  } catch (error) {
    console.error('Error fetching chat room:', error);
    return null;
  }
};

/**
 * Update chat room settings
 */
export const updateChatRoomSettings = async (
  chatId: string,
  settings: Partial<ChatRoom>
): Promise<void> => {
  try {
    await updateDoc(doc(db, CHAT_ROOMS_COLLECTION, chatId), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating chat room settings:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadCount = async (
  chatId: string,
  userId: string
): Promise<number> => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      where('deletedAt', '==', null)
    );

    const snapshot = await getDocs(q);
    let unreadCount = 0;
    
    snapshot.docs.forEach(doc => {
      const message = doc.data() as ChatMessage;
      if (!message.readBy?.[userId] && message.senderId !== userId) {
        unreadCount++;
      }
    });

    return unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Send system message (for celebrations, achievements, etc.)
 */
export const sendSystemMessage = async (
  chatId: string,
  familyId: string,
  systemMessageType: string,
  systemMessageData: Record<string, any>,
  text: string
): Promise<void> => {
  try {
    const messageId = doc(collection(db, MESSAGES_COLLECTION)).id;
    const message: ChatMessage = {
      id: messageId,
      familyId,
      chatId,
      senderId: 'system',
      senderName: 'TypeB Family',
      senderRole: 'parent',
      type: 'system',
      text,
      status: 'sent',
      moderationStatus: 'approved',
      systemMessageType: systemMessageType as any,
      systemMessageData,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {},
      readBy: {},
    };

    await setDoc(doc(db, MESSAGES_COLLECTION, messageId), {
      ...message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending system message:', error);
  }
};