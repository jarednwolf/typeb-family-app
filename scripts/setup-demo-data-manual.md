# Demo Data Setup Instructions

Since we need admin permissions to directly write to Firestore, here are two options to set up the demo data:

## Option 1: Manual Setup via Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/project/typeb-family-app/firestore
2. Create the following collections and documents:

### Users Collection

#### Document 1: `PuI1XilzwxMPnUqM4cskkm9BGBk1` (Demo Parent)
```json
{
  "id": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "email": "demo@typebapp.com",
  "displayName": "Demo Parent",
  "role": "parent",
  "familyId": "demo-family-2025",
  "createdAt": "2025-02-10T20:00:00.000Z",
  "updatedAt": "2025-02-10T20:00:00.000Z",
  "isPremium": true,
  "notificationsEnabled": true,
  "timezone": "America/Phoenix",
  "points": 150,
  "level": 3,
  "achievements": ["family_creator", "task_master", "premium_member"]
}
```

#### Document 2: `LzPvMWkMOTakRsxbx7krgcPUZ0q2` (Demo Child)
```json
{
  "id": "LzPvMWkMOTakRsxbx7krgcPUZ0q2",
  "email": "demo.child@typebapp.com",
  "displayName": "Demo Child",
  "role": "child",
  "familyId": "demo-family-2025",
  "createdAt": "2025-02-10T20:00:00.000Z",
  "updatedAt": "2025-02-10T20:00:00.000Z",
  "notificationsEnabled": true,
  "timezone": "America/Phoenix",
  "points": 85,
  "level": 2,
  "achievements": ["first_task", "week_streak"]
}
```

### Families Collection

#### Document: `demo-family-2025`
```json
{
  "id": "demo-family-2025",
  "name": "Demo Family",
  "inviteCode": "DEMO2025",
  "createdBy": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "createdAt": "2025-02-10T20:00:00.000Z",
  "updatedAt": "2025-02-10T20:00:00.000Z",
  "memberIds": ["PuI1XilzwxMPnUqM4cskkm9BGBk1", "LzPvMWkMOTakRsxbx7krgcPUZ0q2"],
  "parentIds": ["PuI1XilzwxMPnUqM4cskkm9BGBk1"],
  "childIds": ["LzPvMWkMOTakRsxbx7krgcPUZ0q2"],
  "maxMembers": 10,
  "isPremium": true,
  "taskCategories": [
    {"id": "1", "name": "Chores", "color": "#10B981", "icon": "home"},
    {"id": "2", "name": "Homework", "color": "#3B82F6", "icon": "book"},
    {"id": "3", "name": "Exercise", "color": "#F59E0B", "icon": "heart"},
    {"id": "4", "name": "Personal", "color": "#8B5CF6", "icon": "user"},
    {"id": "5", "name": "Other", "color": "#6B7280", "icon": "more-horizontal"}
  ],
  "settings": {
    "allowChildrenToCreateTasks": false,
    "requirePhotoValidation": true,
    "enableRewards": true,
    "enableNotifications": true
  }
}
```

### Tasks Collection

Create a few sample tasks with auto-generated IDs:

#### Task 1: Clean Your Room
```json
{
  "familyId": "demo-family-2025",
  "title": "Clean Your Room",
  "description": "Make bed, organize desk, and vacuum the floor",
  "category": {"id": "1", "name": "Chores", "color": "#10B981", "icon": "home"},
  "assignedTo": "LzPvMWkMOTakRsxbx7krgcPUZ0q2",
  "assignedBy": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "createdBy": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "status": "pending",
  "requiresPhoto": true,
  "dueDate": "2025-02-11T20:00:00.000Z",
  "isRecurring": false,
  "reminderEnabled": true,
  "reminderTime": "09:00",
  "escalationLevel": 0,
  "createdAt": "2025-02-10T20:00:00.000Z",
  "updatedAt": "2025-02-10T20:00:00.000Z",
  "priority": "high",
  "points": 25
}
```

#### Task 2: Math Homework
```json
{
  "familyId": "demo-family-2025",
  "title": "Math Homework",
  "description": "Complete Chapter 5 exercises",
  "category": {"id": "2", "name": "Homework", "color": "#3B82F6", "icon": "book"},
  "assignedTo": "LzPvMWkMOTakRsxbx7krgcPUZ0q2",
  "assignedBy": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "createdBy": "PuI1XilzwxMPnUqM4cskkm9BGBk1",
  "status": "pending",
  "requiresPhoto": false,
  "dueDate": "2025-02-10T23:59:00.000Z",
  "isRecurring": false,
  "reminderEnabled": true,
  "reminderTime": "15:00",
  "escalationLevel": 0,
  "createdAt": "2025-02-10T20:00:00.000Z",
  "updatedAt": "2025-02-10T20:00:00.000Z",
  "priority": "urgent",
  "points": 20
}
```

## Option 2: Use Firebase Admin SDK with Service Account

1. Download your service account key from Firebase Console:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in the `typeb-family-app` folder

2. Run: `node scripts/setup-demo-data.js`

## Demo Account Credentials

Once set up, testers can use these accounts:

**Demo Parent:**
- Email: demo@typebapp.com
- Password: Demo123!

**Demo Child:**
- Email: demo.child@typebapp.com
- Password: Demo123!

**Family Invite Code:** DEMO2025