/**
 * Comments Components
 * Export all comment-related UI components
 */

export { CommentThread } from './CommentThread';
export { CommentInput } from './CommentInput';
export { CommentCard } from './CommentCard';
export { MentionPicker } from './MentionPicker';

// Export types if needed by other components
export type { 
  Comment, 
  CommentThread as CommentThreadType,
  CommentableContentType 
} from '../../services/comments';