/**
 * Base service interfaces for platform abstraction
 * These interfaces allow services to work across web and mobile platforms
 */

import type { User } from '@typeb/types';

/**
 * Platform-specific adapter interfaces
 */
export interface AuthAdapter {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, displayName: string): Promise<User>;
  signOut(): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  verifyIdToken(token: string): Promise<any>;
}

export interface DatabaseAdapter {
  get<T>(collection: string, id: string): Promise<T | null>;
  query<T>(collection: string, constraints: QueryConstraint[]): Promise<T[]>;
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  subscribe<T>(
    collection: string,
    id: string,
    callback: (data: T | null) => void
  ): () => void;
  runTransaction<T>(
    callback: (transaction: TransactionAdapter) => Promise<T>
  ): Promise<T>;
}

export interface StorageAdapter {
  upload(path: string, file: File | Blob): Promise<string>;
  download(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
  getDownloadUrl(path: string): Promise<string>;
}

export interface TransactionAdapter {
  get<T>(collection: string, id: string): Promise<T | null>;
  create<T>(collection: string, id: string, data: T): void;
  update<T>(collection: string, id: string, data: Partial<T>): void;
  delete(collection: string, id: string): void;
}

export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit' | 'startAt' | 'endAt';
  field?: string;
  operator?: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';
  value?: any;
  direction?: 'asc' | 'desc';
  count?: number;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  platform: 'web' | 'mobile';
  environment: 'development' | 'staging' | 'production';
  features: {
    notifications: boolean;
    offline: boolean;
    camera: boolean;
    biometrics: boolean;
  };
}

/**
 * Base service class that all services extend
 */
export abstract class BaseService {
  protected auth: AuthAdapter;
  protected db: DatabaseAdapter;
  protected storage: StorageAdapter;
  protected config: PlatformConfig;

  constructor(
    auth: AuthAdapter,
    db: DatabaseAdapter,
    storage: StorageAdapter,
    config: PlatformConfig
  ) {
    this.auth = auth;
    this.db = db;
    this.storage = storage;
    this.config = config;
  }

  /**
   * Get current authenticated user
   */
  protected async getCurrentUser(): Promise<User> {
    const user = await this.auth.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Check if user has permission for an action
   */
  protected async checkPermission(
    _userId: string,
    _resource: string,
    _action: string
  ): Promise<boolean> {
    // Override in specific services
    return true;
  }

  /**
   * Log activity for audit trail
   */
  protected async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    // Implementation will be in specific adapters
    console.log(`Activity: ${action} on ${entityType}:${entityId} by ${userId}`);
  }
}