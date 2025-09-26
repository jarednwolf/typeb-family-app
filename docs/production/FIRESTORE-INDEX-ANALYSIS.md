# Firestore Index Analysis for TypeB Family App

## Current Indexes in firestore.indexes.json

1. **Tasks - Family + Assigned + Created**
   - familyId (ASC) + assignedTo (ASC) + createdAt (DESC)
   - Used by: getUserTasks with filters

2. **Tasks - Family + Status + Created**
   - familyId (ASC) + status (ASC) + createdAt (DESC)
   - Used by: getFamilyTasks with status filter

3. **Tasks - Family + Status + DueDate**
   - familyId (ASC) + status (ASC) + dueDate (ASC)
   - Used by: getOverdueTasks

4. **Tasks - Family + Created**
   - familyId (ASC) + createdAt (DESC)
   - Used by: getFamilyTasks without filters, subscribeToFamilyTasks

## All Queries in the Codebase

### tasks.ts

1. **getFamilyTasks** (lines 307-358)
   - Base: where('familyId', '==', familyId) + orderBy('createdAt', 'desc')
   - Optional filters: status, assignedTo, priority
   - Potential combinations:
     - familyId + createdAt ✅ (covered by index 4)
     - familyId + status + createdAt ✅ (covered by index 2)
     - familyId + assignedTo + createdAt ✅ (covered by index 1)
     - familyId + priority + createdAt ❌ (NOT COVERED)
     - familyId + status + assignedTo + createdAt ❌ (NOT COVERED)
     - familyId + status + priority + createdAt ❌ (NOT COVERED)
     - familyId + assignedTo + priority + createdAt ❌ (NOT COVERED)
     - familyId + status + assignedTo + priority + createdAt ❌ (NOT COVERED)

2. **getUserTasks** (lines 363-401)
   - Base: where('familyId', '==', familyId) + where('assignedTo', '==', userId) + orderBy('createdAt', 'desc')
   - Optional: status filter
   - Combinations:
     - familyId + assignedTo + createdAt ✅ (covered by index 1)
     - familyId + assignedTo + status + createdAt ❌ (NOT COVERED)

3. **getOverdueTasks** (lines 406-436)
   - where('familyId', '==', familyId) + where('status', '==', 'pending') + where('dueDate', '<', now) + orderBy('dueDate', 'asc')
   - ✅ Covered by index 3

4. **subscribeToFamilyTasks** (lines 482-532)
   - Base: where('familyId', '==', familyId) + orderBy('createdAt', 'desc')
   - Optional filters: status, assignedTo
   - Same combinations as getFamilyTasks

5. **getTaskStats** (lines 620-675)
   - where('familyId', '==', familyId)
   - Optional: where('assignedTo', '==', userId)
   - No orderBy, so single field indexes are sufficient ✅

### family.ts

1. **Invite code check** (line 45)
   - where('inviteCode', '==', code)
   - Single field index sufficient ✅

2. **Find family by invite code** (line 111)
   - where('inviteCode', '==', inviteCode)
   - Single field index sufficient ✅

3. **Tasks assigned to removed user** (line 282)
   - where('familyId', '==', familyId) + where('assignedTo', '==', userId)
   - No orderBy, composite index helpful but not required ✅

4. **Get family members** (line 403)
   - where('__name__', 'in', memberIds)
   - Document ID query, no index needed ✅

### backgroundTasks.ts

1. **Tasks query** (line 41)
   - Not shown in search results, need to check

## Missing Indexes

Based on the analysis, we need to add these indexes:

1. **Tasks - Family + Priority + Created**
   ```json
   {
     "collectionGroup": "tasks",
     "queryScope": "COLLECTION",
     "fields": [
       {"fieldPath": "familyId", "order": "ASCENDING"},
       {"fieldPath": "priority", "order": "ASCENDING"},
       {"fieldPath": "createdAt", "order": "DESCENDING"}
     ]
   }
   ```

2. **Tasks - Family + Assigned + Status + Created**
   ```json
   {
     "collectionGroup": "tasks",
     "queryScope": "COLLECTION",
     "fields": [
       {"fieldPath": "familyId", "order": "ASCENDING"},
       {"fieldPath": "assignedTo", "order": "ASCENDING"},
       {"fieldPath": "status", "order": "ASCENDING"},
       {"fieldPath": "createdAt", "order": "DESCENDING"}
     ]
   }
   ```

## Recommendations

1. **Current Coverage**: Good for basic queries
2. **Missing Coverage**: Complex filter combinations with priority
3. **Performance Impact**: Users filtering by priority will experience slower queries
4. **Action Required**: Add the two missing indexes above

## Notes

- Firestore automatically creates single-field indexes
- Composite indexes must be manually defined
- The `__name__` field in indexes refers to the document ID
- Indexes with multiple equality filters can share indexes if the fields match