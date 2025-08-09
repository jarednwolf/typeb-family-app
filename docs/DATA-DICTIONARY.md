# TypeB Family App - Data Dictionary

## Overview
This document provides a comprehensive reference for all data models, their fields, types, and business rules used in the TypeB Family App.

## Table of Contents
1. [User Model](#user-model)
2. [Family Model](#family-model)
3. [Task Model](#task-model)
4. [TaskCategory Model](#taskcategory-model)
5. [Notification Model](#notification-model)
6. [Activity Model](#activity-model)
7. [Enums and Types](#enums-and-types)

---

## User Model

**Collection**: `users`  
**Description**: Represents a user account in the system

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | Auto | Firebase Auth UID | - |
| email | string | Yes | - | User's email address | Valid email format, lowercase |
| displayName | string | Yes | - | User's display name | 2-50 characters |
| familyId | string \| null | No | null | ID of the family the user belongs to | Must be valid family ID |
| role | 'parent' \| 'child' | Yes | - | User's role in the family | Only 'parent' or 'child' |
| createdAt | string (ISO 8601) | Yes | Auto | Account creation timestamp | - |
| updatedAt | string (ISO 8601) | Yes | Auto | Last update timestamp | - |
| isPremium | boolean | Yes | false | Premium subscription status | - |
| subscriptionEndDate | string (ISO 8601) | No | - | Premium subscription end date | Only if isPremium = true |
| avatarUrl | string | No | - | Profile picture URL | Valid URL format |
| phoneNumber | string | No | - | Phone number | E.164 format |
| notificationsEnabled | boolean | Yes | true | Push notification preference | - |
| reminderTime | string | No | "09:00" | Default reminder time | HH:MM format |
| timezone | string | Yes | Device TZ | User's timezone | IANA timezone |

### Business Rules
- Users can belong to exactly one family at a time
- Email must be unique across the system
- Role cannot be changed without proper authorization
- Premium status is synchronized with payment provider

---

## Family Model

**Collection**: `families`  
**Description**: Represents a family group

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | Auto | Firestore document ID | - |
| name | string | Yes | - | Family name | 2-50 characters |
| inviteCode | string | Yes | Auto | 6-character invite code | 6 uppercase alphanumeric |
| createdBy | string | Yes | - | User ID of creator | Must be valid user ID |
| createdAt | string (ISO 8601) | Yes | Auto | Creation timestamp | - |
| updatedAt | string (ISO 8601) | Yes | Auto | Last update timestamp | - |
| memberIds | string[] | Yes | [createdBy] | All member user IDs | Max based on plan |
| parentIds | string[] | Yes | [createdBy] | Parent role user IDs | Subset of memberIds |
| childIds | string[] | Yes | [] | Child role user IDs | Subset of memberIds |
| maxMembers | number | Yes | 4 or 10 | Maximum allowed members | 4 (free), 10 (premium) |
| isPremium | boolean | Yes | false | Family premium status | - |
| taskCategories | TaskCategory[] | Yes | Default set | Available task categories | Max 20 categories |
| defaultTaskAssignee | string | No | - | Default user for new tasks | Must be in memberIds |

### Business Rules
- Must have at least one parent at all times
- Invite codes are unique and regeneratable
- Premium status determined by any parent having premium
- Members cannot exceed maxMembers limit

---

## Task Model

**Collection**: `tasks`  
**Description**: Represents a task or chore

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | Auto | Firestore document ID | - |
| familyId | string | Yes | - | Family this task belongs to | Must be valid family ID |
| title | string | Yes | - | Task title | 3-100 characters |
| description | string | No | - | Task details | 0-500 characters |
| category | TaskCategory | Yes | - | Task category (embedded) | Valid category |
| assignedTo | string | Yes | - | User ID of assignee | Must be family member |
| assignedBy | string | Yes | - | User ID of assigner | Must be parent |
| createdBy | string | Yes | - | User ID of creator | Must be family member |
| status | TaskStatus | Yes | 'pending' | Current task status | See TaskStatus enum |
| completedAt | string (ISO 8601) | No | - | Completion timestamp | Set when completed |
| completedBy | string | No | - | User who completed | Set when completed |
| requiresPhoto | boolean | Yes | false | Photo validation required | Premium feature |
| photoUrl | string | No | - | Validation photo URL | Set when photo uploaded |
| photoValidatedBy | string | No | - | Parent who validated | Set when validated |
| photoValidationStatus | 'pending' \| 'approved' \| 'rejected' | No | - | Validation status | Set when requiresPhoto |
| validationNotes | string | No | - | Parent's feedback | 0-200 characters |
| dueDate | string (ISO 8601) | No | - | Task due date | Future date |
| isRecurring | boolean | Yes | false | Recurring task flag | - |
| recurrencePattern | RecurrencePattern | No | - | Recurrence details | Required if isRecurring |
| reminderEnabled | boolean | Yes | false | Reminder notifications | - |
| reminderTime | string | No | - | Reminder time | HH:MM format |
| lastReminderSent | string (ISO 8601) | No | - | Last reminder timestamp | System managed |
| reminderEscalationLevel | number | Yes | 0 | Escalation state | 0-2 (none/sent/escalated) |
| createdAt | string (ISO 8601) | Yes | Auto | Creation timestamp | - |
| updatedAt | string (ISO 8601) | Yes | Auto | Last update timestamp | - |
| priority | TaskPriority | Yes | 'medium' | Task priority | See TaskPriority enum |
| rewardPoints | number | No | - | Gamification points | 0-1000 |

### Business Rules
- Only parents can create/assign tasks
- Tasks can only be assigned to family members
- Photo validation only available for premium families
- Completed tasks cannot be edited (except validation)
- Recurring tasks create new instances automatically

---

## TaskCategory Model

**Type**: Embedded object  
**Description**: Represents a task category

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | - | Unique identifier | - |
| name | string | Yes | - | Category name | 1-30 characters |
| icon | string | Yes | - | Icon name | Valid Feather icon |
| color | string | Yes | - | Hex color code | Valid hex color |

### Default Categories
1. Chores - `home` icon - `#FF6B6B`
2. Homework - `book` icon - `#4ECDC4`
3. Exercise - `activity` icon - `#45B7D1`
4. Personal - `user` icon - `#96CEB4`
5. Other - `more-horizontal` icon - `#9B9B9B`

---

## Notification Model

**Collection**: `notifications`  
**Description**: In-app notifications

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | Auto | Firestore document ID | - |
| userId | string | Yes | - | Recipient user ID | Valid user ID |
| type | NotificationType | Yes | - | Notification type | See NotificationType |
| title | string | Yes | - | Notification title | 1-100 characters |
| body | string | Yes | - | Notification body | 1-500 characters |
| data | Record<string, unknown> | No | {} | Additional data | - |
| read | boolean | Yes | false | Read status | - |
| createdAt | string (ISO 8601) | Yes | Auto | Creation timestamp | - |

---

## Activity Model

**Collection**: `activities`  
**Description**: Audit log of family activities

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| id | string | Yes | Auto | Firestore document ID | - |
| familyId | string | Yes | - | Family ID | Valid family ID |
| userId | string | Yes | - | User who performed action | Valid user ID |
| action | ActivityAction | Yes | - | Action performed | See ActivityAction |
| entityType | 'task' \| 'family' \| 'user' | Yes | - | Entity type affected | - |
| entityId | string | Yes | - | Entity ID affected | - |
| metadata | Record<string, unknown> | No | {} | Additional context | - |
| createdAt | string (ISO 8601) | Yes | Auto | Action timestamp | - |

---

## Enums and Types

### UserRole
```typescript
type UserRole = 'parent' | 'child';
```

### TaskStatus
```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
```

### TaskPriority
```typescript
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### NotificationType
```typescript
type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_reminder'
  | 'task_overdue'
  | 'family_invite'
  | 'member_joined'
  | 'member_left';
```

### ActivityAction
```typescript
type ActivityAction = 
  | 'created'
  | 'updated'
  | 'completed'
  | 'deleted'
  | 'joined'
  | 'left'
  | 'invited';
```

### RecurrencePattern
```typescript
interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: string; // ISO 8601
}
```

---

## Data Relationships

### User ↔ Family
- One-to-one: A user belongs to at most one family
- Enforced by: `familyId` field in User model

### Family ↔ Task
- One-to-many: A family can have many tasks
- Enforced by: `familyId` field in Task model

### User ↔ Task
- Many-to-many through Family
- Assignment: `assignedTo` field in Task model
- Creation: `createdBy` field in Task model

### Data Integrity Rules
1. Deleting a user removes them from family memberIds
2. Deleting a family is not allowed (must have no members)
3. Tasks are reassigned when assignee leaves family
4. Notifications are retained even if related entities are deleted

---

## Field Naming Conventions

### Timestamps
- Suffix with `At`: `createdAt`, `completedAt`, `updatedAt`
- Always stored as ISO 8601 strings in Redux
- Converted to Date objects only in components

### IDs
- Suffix with `Id` for single references: `userId`, `familyId`
- Suffix with `Ids` for arrays: `memberIds`, `parentIds`

### Booleans
- Prefix with `is`, `has`, `should`, `can`: `isPremium`, `hasPhoto`, `requiresPhoto`

### Status/State
- Use specific names: `photoValidationStatus`, not just `status`
- Include context: `reminderEscalationLevel`, not just `level`

---

*Last Updated: January 8, 2025*  
*Version: 1.0.0*