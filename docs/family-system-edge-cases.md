# TypeB - Family System Edge Case Resolutions

## Critical Decision Framework

### 1. Manager Succession
**Question**: What happens when the family manager leaves/deletes account?

**Options**:
A. Family is archived (all members become solo users)
B. Oldest member automatically becomes manager
C. Manager must designate successor before leaving
D. First member to accept becomes new manager

**DECISION**: **Option C with fallback to A**
- Manager sees "Transfer ownership" before account deletion
- If they don't transfer, family archives after 30 days
- Members keep their tasks but lose family features
- Can create new family if needed

**Implementation**:
```typescript
interface Family {
  managerId: string;
  pendingManagerId?: string;  // Succession planning
  archivedAt?: timestamp;     // Soft delete
}
```

---

### 2. Invite Code Security
**Question**: How do we prevent invite code guessing/sharing?

**Options**:
A. 6-character codes that expire
B. UUID links sent via email
C. QR codes shown in app
D. Manager approves each join request

**DECISION**: **Option A with safeguards**
- 8-character alphanumeric codes (not 6)
- Expire after 24 hours
- Max 5 uses per code
- Rate limit: 3 failed attempts = 15 min lockout
- New code invalidates old one

**Implementation**:
```typescript
interface InviteCode {
  code: string;          // 8 chars: XXXX-XXXX
  familyId: string;
  expiresAt: timestamp;  // 24 hours
  usageCount: number;    // Max 5
  createdBy: string;
}
```

---

### 3. Offline Conflict Resolution
**Question**: Two members edit same task offline, who wins?

**Options**:
A. Last write wins (timestamp based)
B. Manager's changes always win
C. Merge changes (complex)
D. Show conflict, user chooses

**DECISION**: **Option A with audit log**
- Server timestamp determines winner
- Log both versions for recovery
- Show sync status indicator
- Manager can view change history

**Implementation**:
```typescript
interface Task {
  lastModified: serverTimestamp;
  lastModifiedBy: string;
  changeHistory?: ChangeLog[];  // Premium feature
}
```

---

### 4. Member Removal Scenarios
**Question**: What happens to tasks when member is removed?

**Options**:
A. Delete all their tasks
B. Reassign to manager
C. Mark as "unassigned"
D. Keep assigned but inactive

**DECISION**: **Option C for incomplete, D for completed**
- Incomplete tasks → unassigned (manager reassigns)
- Completed tasks → kept for history
- Member data soft-deleted for 30 days
- Can restore if rejoins within 30 days

**Implementation**:
```typescript
interface FamilyMember {
  status: 'active' | 'removed' | 'left';
  removedAt?: timestamp;
  removedBy?: string;
  tasks: {
    reassigned: string[];
    archived: string[];
  }
}
```

---

### 5. Premium Status Edge Cases
**Question**: What happens when subscription expires?

**Options**:
A. Immediately lock premium features
B. Grace period then lock
C. Read-only mode for premium features
D. Downgrade to free limits

**DECISION**: **Option B + D combination**
- 3-day grace period (fix payment issues)
- After grace: Keep 1 family member (others read-only)
- Validation history viewable, not creatable
- Show clear upgrade prompts

**Implementation**:
```typescript
interface Subscription {
  status: 'active' | 'grace' | 'expired';
  expiresAt: timestamp;
  gracePeriodEnds?: timestamp;
}
```

---

### 6. Age & Permission Handling
**Question**: How do we handle minors in families?

**Options**:
A. No age tracking (COPPA risk)
B. Age gate with restrictions
C. All minors need parent approval
D. Trust manager to handle

**DECISION**: **Option D with disclaimer**
- Manager agrees to terms for whole family
- No age-specific features
- Clear terms: "Manager responsible for minors"
- No direct data collection from minors

**Implementation**:
```typescript
interface User {
  // No birthdate field
  accountType: 'manager' | 'member';
  termsAcceptedAt: timestamp;
}
```

---

### 7. Task Limit Scenarios
**Question**: How do we handle too many tasks?

**Options**:
A. Hard limit with error
B. Pagination/archiving
C. Performance degradation
D. Premium limits

**DECISION**: **Option B automatically**
- Show 50 active tasks max
- Auto-archive completed > 30 days
- Search to find archived
- Bulk operations for cleanup

**Implementation**:
```typescript
interface TaskQuery {
  status: 'active' | 'archived';
  limit: 50;
  orderBy: 'dueDate' | 'priority';
}
```

---

### 8. Family Size Limits
**Question**: Maximum family members?

**Options**:
A. Unlimited (performance risk)
B. Hard limit for all
C. Tiered limits by plan
D. Soft limit with warning

**DECISION**: **Option C**
- Free: 1 member (solo)
- Premium: 10 members
- Future "Family Plus": 20 members
- Clear messaging at limits

---

### 9. Data Privacy Between Members
**Question**: What can family members see about each other?

**Options**:
A. Everything (full transparency)
B. Only assigned tasks
C. Configurable by manager
D. Age-based visibility

**DECISION**: **Option B for MVP, C for future**
- Members see: Own tasks + completion stats
- Manager sees: Everything
- Future: Privacy settings per member
- No location or personal data shared

---

### 10. Account Recovery
**Question**: How do users recover locked accounts?

**Options**:
A. Email reset only
B. Security questions
C. Manager can reset members
D. Support manual process

**DECISION**: **Option A + C**
- Standard email password reset
- Manager can reset member passwords
- No support dashboard initially
- Document common issues

---

### 11. Super Admin Override (Emergency)
**Question**: How do we handle support requests for locked accounts or family disputes?

**Options**:
A. No admin access (privacy focused)
B. Full admin dashboard
C. Firebase console manual intervention
D. Command-line admin tools

**DECISION**: **Option C with documentation**
- Use Firebase Console for emergency interventions
- Create admin Cloud Functions for common tasks
- Document procedures for:
  - Transfer manager role
  - Unlock account
  - Reset family
  - Delete inappropriate content
- Log all admin actions
- Only you have access initially

**Implementation**:
```typescript
// Admin Cloud Function (not exposed to app)
export const adminTransferManager = functions.https.onCall(async (data, context) => {
  // Verify admin token (your personal token)
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  
  const { familyId, newManagerId } = data;
  
  // Log the action
  await admin.firestore().collection('adminLogs').add({
    action: 'transferManager',
    familyId,
    newManagerId,
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Perform the transfer
  await admin.firestore().collection('families').doc(familyId).update({
    managerId: newManagerId,
    lastAdminAction: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});
```

**Admin Procedures**:
1. User emails support@typeb.app
2. Verify identity (email match, family details)
3. Use Firebase Console or admin function
4. Document action taken
5. Notify affected users

---

## Summary of Decisions

| Scenario | Decision | Complexity |
|----------|----------|------------|
| Manager leaves | Transfer or archive | Medium |
| Invite codes | 8-char, 24hr expiry | Low |
| Offline conflicts | Last write wins | Low |
| Member removal | Unassign/archive tasks | Medium |
| Premium expiry | Grace period + downgrade | Medium |
| Minors | Manager responsible | Low |
| Too many tasks | Auto-archive | Low |
| Family size | 10 member limit | Low |
| Privacy | Members see own tasks | Low |
| Account recovery | Email + manager reset | Low |
| Super admin | Firebase console + functions | Low |

## Implementation Priority

### Phase 1 (Must Have)
- Basic invite codes
- Manager succession UI
- Last-write-wins sync

### Phase 2 (Should Have)  
- Member removal flow
- Task archiving
- Account recovery

### Phase 3 (Nice to Have)
- Audit logs
- Privacy settings
- Advanced conflict resolution

---

**These decisions prioritize simplicity and safety over complex features. We can always add complexity later based on user feedback.**