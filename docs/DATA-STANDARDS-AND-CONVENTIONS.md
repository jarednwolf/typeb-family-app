# TypeB Family App - Data Standards and Conventions

## Overview
This document establishes the official data standards and naming conventions for the TypeB Family App. All developers must follow these standards to ensure consistency, maintainability, and scalability.

## Core Principles

1. **Single Source of Truth**: Redux store is the authoritative source for all application state
2. **Type Safety First**: No `any` types allowed except in third-party integrations
3. **Consistent Naming**: Use established conventions without exceptions
4. **Clear Documentation**: Every data structure must be documented
5. **Zero Ambiguity**: Names must be self-explanatory and specific

## Data Model Standards

### User Model

```typescript
interface User {
  // Identity
  id: string;                    // Firebase Auth UID
  email: string;                 // Lowercase, validated email
  displayName: string;           // 2-50 characters
  
  // Family Association
  familyId: string | null;       // Single family reference (NOT familyIds array)
  role: 'parent' | 'child';      // NOT 'manager' or 'member'
  
  // Timestamps (ISO strings in Redux, Date objects in components)
  createdAt: string;             // ISO 8601 format
  updatedAt: string;             // ISO 8601 format
  
  // Premium Features
  isPremium: boolean;            // Default: false
  subscriptionEndDate?: string;  // ISO 8601, only if isPremium
  
  // Profile
  avatarUrl?: string;            // Optional, validated URL
  phoneNumber?: string;          // Optional, E.164 format
  
  // Settings
  notificationsEnabled: boolean; // Default: true
  reminderTime?: string;         // HH:MM format, default: "09:00"
  timezone: string;              // IANA timezone, default: device timezone
}
```

### Family Model

```typescript
interface Family {
  // Identity
  id: string;                    // Firestore document ID
  name: string;                  // 2-50 characters
  inviteCode: string;            // 6 uppercase alphanumeric
  
  // Ownership
  createdBy: string;             // User ID of creator
  createdAt: string;             // ISO 8601 format
  updatedAt: string;             // ISO 8601 format
  
  // Members (Consider subcollection for >50 members)
  memberIds: string[];           // All member user IDs
  parentIds: string[];           // Subset of memberIds with parent role
  childIds: string[];            // Subset of memberIds with child role
  
  // Settings
  maxMembers: number;            // 1 (free) or 10 (premium)
  isPremium: boolean;            // Family premium status
  
  // Role Customization (NEW)
  roleConfig?: {
    preset: 'family' | 'roommates' | 'team' | 'custom';
    adminLabel: string;        // Display name for parent role (e.g., "Parent", "Manager")
    memberLabel: string;       // Display name for child role (e.g., "Child", "Member")
    adminPlural?: string;      // Optional plural form (e.g., "Parents")
    memberPlural?: string;     // Optional plural form (e.g., "Children")
  };
  
  // Customization
  taskCategories: TaskCategory[]; // Max 20 categories
  defaultTaskAssignee?: string;   // User ID for default assignment
}
```

### Task Model

```typescript
interface Task {
  // Identity
  id: string;                    // Firestore document ID
  familyId: string;              // Family this task belongs to
  
  // Content
  title: string;                 // 3-100 characters
  description?: string;          // 0-500 characters
  category: TaskCategory;        // Embedded category snapshot
  
  // Assignment
  assignedTo: string;            // User ID of assignee
  assignedBy: string;            // User ID of assigner (parent)
  createdBy: string;             // User ID of creator
  
  // Status
  status: TaskStatus;            // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completedAt?: string;          // ISO 8601, when completed
  completedBy?: string;          // User ID who completed
  
  // Validation (Premium)
  requiresPhoto: boolean;        // Default: false
  photoUrl?: string;             // URL of validation photo
  photoValidatedBy?: string;     // Parent user ID who validated
  photoValidationStatus?: 'pending' | 'approved' | 'rejected';
  validationNotes?: string;      // Parent's validation feedback
  
  // Scheduling
  dueDate?: string;              // ISO 8601, optional due date
  isRecurring: boolean;          // Default: false
  recurrencePattern?: RecurrencePattern;
  
  // Reminders
  reminderEnabled: boolean;      // Default: false
  reminderTime?: string;         // HH:MM format
  lastReminderSent?: string;     // ISO 8601, last reminder timestamp
  reminderEscalationLevel: number; // 0=none, 1=sent, 2=escalated to parent
  
  // Metadata
  createdAt: string;             // ISO 8601 format
  updatedAt: string;             // ISO 8601 format
  
  // Gamification
  priority: TaskPriority;        // 'low' | 'medium' | 'high' | 'urgent'
  rewardPoints?: number;         // 0-1000, optional reward points
}
```

## Naming Conventions

### Role System Standards

1. **Internal Representation**
   - Always use `'parent'` and `'child'` for role field values
   - These are constants that never change in the database
   - Example: `user.role = 'parent'` (not 'Manager' or 'Team Lead')

2. **Display Labels**
   - Use `family.roleConfig` for all user-facing text
   - Fall back to "Parent"/"Child" if roleConfig not set
   - Never hardcode role labels in UI components

3. **Role Presets**
   ```typescript
   const ROLE_PRESETS = {
     family: { adminLabel: 'Parent', memberLabel: 'Child' },
     roommates: { adminLabel: 'House Manager', memberLabel: 'Roommate' },
     team: { adminLabel: 'Team Lead', memberLabel: 'Team Member' },
     custom: { adminLabel: '', memberLabel: '' } // User-defined
   };
   ```

4. **Helper Function Usage**
   ```typescript
   // Always use helper for display
   const displayRole = getRoleLabel(family, user.role);
   // Never do this:
   const displayRole = user.role === 'parent' ? 'Parent' : 'Child';
   ```

### Variables and Properties

1. **Boolean Flags**
   - Prefix with `is`, `has`, `should`, or `can`
   - Examples: `isPremium`, `hasPhoto`, `shouldNotify`, `canEdit`

2. **Collections/Arrays**
   - Use plural form
   - Suffix with `Ids` for ID arrays
   - Examples: `tasks`, `members`, `memberIds`, `parentIds`

3. **Timestamps**
   - Suffix with `At` for points in time
   - Suffix with `Date` for dates without time
   - Examples: `createdAt`, `completedAt`, `dueDate`, `subscriptionEndDate`

4. **Status/State**
   - Use clear, specific names
   - Avoid generic terms like `status` alone
   - Examples: `photoValidationStatus`, `reminderEscalationLevel`

5. **Counts/Numbers**
   - Prefix with `num`, `count`, or `total`
   - Or suffix with `Count`
   - Examples: `maxMembers`, `rewardPoints`, `taskCount`

### Functions and Methods

1. **Actions**
   - Use verb + noun format
   - Examples: `createTask`, `updateFamily`, `validatePhoto`

2. **Getters**
   - Prefix with `get` or `fetch`
   - Examples: `getFamily`, `fetchUserTasks`

3. **Checkers**
   - Prefix with `is`, `has`, `can`
   - Return boolean
   - Examples: `isAuthenticated`, `hasPermission`, `canEdit`

4. **Event Handlers**
   - Prefix with `handle` or `on`
   - Examples: `handleSubmit`, `onTaskComplete`

### Type Definitions

1. **Interfaces**
   - PascalCase, singular
   - Examples: `User`, `Family`, `Task`

2. **Type Aliases**
   - PascalCase
   - Descriptive of content
   - Examples: `TaskStatus`, `UserRole`, `ValidationResult`

3. **Enums** (avoid, use union types)
   - Use string literal unions instead
   - Example: `type UserRole = 'parent' | 'child';`

## Redux State Standards

### Serialization Rules

1. **Dates in Redux**
   - Always store as ISO 8601 strings
   - Convert to Date objects only in components
   - Use utility functions for conversion

```typescript
// ✅ Correct
interface ReduxTask {
  createdAt: string; // "2025-01-07T10:30:00.000Z"
}

// ❌ Incorrect
interface ReduxTask {
  createdAt: Date; // Will cause serialization warnings
}
```

2. **Firebase Timestamps**
   - Convert to ISO strings before storing in Redux
   - Use helper functions consistently

```typescript
// Utility function
const serializeTimestamp = (timestamp: Timestamp | null): string | null => {
  return timestamp ? timestamp.toDate().toISOString() : null;
};
```

### State Structure

1. **Slice Naming**
   - Singular, lowercase
   - Match the primary entity
   - Examples: `auth`, `family`, `tasks`

2. **State Properties**
   - Use consistent patterns across slices
   - Common properties: `isLoading`, `error`, `data`

```typescript
interface SliceState {
  // Data
  items: Item[];              // Main data array
  selectedItem: Item | null;  // Currently selected
  
  // UI State
  isLoading: boolean;         // Loading indicator
  isCreating: boolean;        // Specific operation states
  isUpdating: boolean;
  
  // Error Handling
  error: string | null;       // User-friendly error message
  
  // Metadata
  lastFetched: string | null; // ISO timestamp of last fetch
  hasMore: boolean;           // For pagination
}
```

## Error Handling Standards

### Error Types

```typescript
// Base error class
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
class ValidationError extends AppError {}
class PermissionError extends AppError {}
class NetworkError extends AppError {}
class NotFoundError extends AppError {}
```

### Error Codes

Use consistent, uppercase error codes:

```typescript
const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  
  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  
  // Permissions
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_INSUFFICIENT_ROLE: 'PERMISSION_INSUFFICIENT_ROLE',
  
  // Business Logic
  FAMILY_FULL: 'FAMILY_FULL',
  TASK_ALREADY_COMPLETED: 'TASK_ALREADY_COMPLETED',
};
```

## Firestore Standards

### Collection Names
- Lowercase, plural
- Examples: `users`, `families`, `tasks`, `activities`

### Document IDs
- Use Firestore auto-generated IDs
- Never use email or other PII as document ID

### Field Names
- camelCase for all fields
- Match TypeScript interface property names exactly

### Query Patterns

1. **Always validate permissions**
```typescript
// Check user is family member before querying tasks
const family = await getFamily(familyId);
if (!family.memberIds.includes(userId)) {
  throw new PermissionError('Not a family member');
}
```

2. **Use transactions for consistency**
```typescript
// When updating related documents
await runTransaction(db, async (transaction) => {
  // All related updates in one transaction
});
```

3. **Implement pagination**
```typescript
// For large collections
const pageSize = 20;
const q = query(
  collection(db, 'tasks'),
  where('familyId', '==', familyId),
  orderBy('createdAt', 'desc'),
  limit(pageSize)
);
```

## Migration Standards

### Version Control
- Track schema version in a metadata collection
- Never break backward compatibility without migration

### Migration Scripts
```typescript
interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  runAt?: string; // ISO timestamp when executed
}
```

### Data Healing
- Implement automatic healing for common issues
- Log all healing operations for monitoring
- Never delete data without user consent

## Testing Standards

### Test Data Conventions

1. **Use factories for test data**
```typescript
const createTestUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  familyId: null,
  role: 'parent',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPremium: false,
  notificationsEnabled: true,
  timezone: 'America/New_York',
  ...overrides,
});
```

2. **Clear naming for test IDs**
- Prefix with `test-`
- Include entity type
- Examples: `test-user-1`, `test-family-1`, `test-task-1`

## Documentation Standards

### Interface Documentation
```typescript
/**
 * Represents a user in the TypeB Family App
 * @remarks
 * Users can belong to exactly one family at a time
 */
interface User {
  /**
   * Unique identifier from Firebase Auth
   * @readonly
   */
  id: string;
  
  /**
   * User's email address
   * @format email
   * @lowercase
   */
  email: string;
}
```

### Default Values Documentation
```typescript
interface UserSettings {
  /**
   * Whether push notifications are enabled
   * @default true
   */
  notificationsEnabled: boolean;
  
  /**
   * Default reminder time in HH:MM format
   * @default "09:00"
   * @pattern ^([01]\d|2[0-3]):([0-5]\d)$
   */
  reminderTime: string;
}
```

## Enforcement

1. **Code Reviews**
   - All PRs must follow these standards
   - Use automated linting where possible
   - Document any exceptions

2. **Automated Checks**
   - ESLint rules for naming conventions
   - TypeScript strict mode enabled
   - Pre-commit hooks for validation

3. **Regular Audits**
   - Monthly review of data structures
   - Quarterly update of standards
   - Track and fix violations

---
*Version: 1.0.0*
*Last Updated: January 7, 2025*
*Next Review: February 7, 2025*