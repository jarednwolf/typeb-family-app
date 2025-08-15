/**
 * Export all services and interfaces
 */

export * from './base.service';

// Re-export commonly used types
export type {
  AuthAdapter,
  DatabaseAdapter,
  StorageAdapter,
  TransactionAdapter,
  QueryConstraint,
  PlatformConfig,
} from './base.service';

export { BaseService } from './base.service';