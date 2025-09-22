# TypeB Architecture

## System Overview

TypeB is a serverless, event-driven architecture using Firebase as the backend with React Native (mobile) and Next.js (web) clients. The system is designed for scalability, maintainability, and rapid feature development.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├─────────────────────┬────────────────────┬──────────────────┤
│   iOS App           │   Android App      │   Web App        │
│   React Native      │   React Native     │   Next.js        │
│   Expo SDK 51       │   Expo SDK 51      │   v15.4          │
└─────────────────────┴────────────────────┴──────────────────┘
              │                │                    │
              └────────────────┴────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Shared Packages   │
                    ├────────────────────┬─┤
                    │ @typeb/core        │ │
                    │ @typeb/store       │ │
                    │ @typeb/types       │ │
                    └────────────────────┴─┘
                               │
                    ┌──────────┴──────────┐
                    │   Firebase Backend  │
                    ├────────────────────┬─┤
                    │ Authentication     │ │
                    │ Firestore DB       │ │
                    │ Cloud Storage      │ │
                    │ Cloud Functions    │ │
                    │ Cloud Messaging    │ │
                    └────────────────────┴─┘
                               │
                    ┌──────────┴──────────┐
                    │  External Services  │
                    ├────────────────────┬─┤
                    │ RevenueCat         │ │
                    │ Sentry             │ │
                    │ Vercel (Web)       │ │
                    └────────────────────┴─┘
```

## Tech Stack

### Frontend Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Mobile Framework | React Native | 0.74.2 | Cross-platform mobile development |
| Mobile Platform | Expo | SDK 51 | Build, deploy, and iterate quickly |
| Web Framework | Next.js | 15.4.6 | SEO, SSR, and performance |
| State Management | Redux Toolkit | ^1.9.5 | Predictable state container |
| Navigation | React Navigation | v6 | Mobile navigation |
| UI Components | React Native Elements | ^3.4.3 | Consistent UI components |
| Forms | React Hook Form | ^7.45.0 | Performant forms with validation |
| Styling (Web) | Tailwind CSS | ^3.0.0 | Utility-first CSS |

### Backend Technologies

| Service | Technology | Purpose |
|---------|------------|---------|
| Authentication | Firebase Auth | User authentication and authorization |
| Database | Cloud Firestore | NoSQL document database |
| File Storage | Cloud Storage | Photo and file storage |
| Serverless Functions | Cloud Functions | Backend logic and integrations |
| Push Notifications | Firebase Cloud Messaging | Real-time notifications |
| Analytics | Firebase Analytics | Usage tracking and insights |

### Infrastructure & DevOps

| Service | Technology | Purpose |
|---------|------------|---------|
| Web Hosting | Vercel | Next.js hosting with edge functions |
| Mobile Builds | EAS Build | Native app builds and distribution |
| Version Control | GitHub | Source code management |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Error Tracking | Sentry | Error monitoring and debugging |
| Payment Processing | RevenueCat | Subscription management |

## Data Model

### Core Collections

```typescript
// users/{userId}
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'child';
  familyId: string;
  avatar?: string;
  settings: UserSettings;
  subscription: SubscriptionInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// families/{familyId}
interface Family {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  parentIds: string[];
  settings: FamilySettings;
  subscription: FamilySubscription;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// tasks/{taskId}
interface Task {
  id: string;
  title: string;
  description?: string;
  familyId: string;
  assignedTo: string;
  createdBy: string;
  categoryId: string;
  priority: 'low' | 'medium' | 'high';
  points: number;
  dueDate: Timestamp;
  repeatPattern?: RepeatPattern;
  status: 'pending' | 'in_progress' | 'awaiting_validation' | 'completed';
  photoRequired: boolean;
  validationPhoto?: string;
  validatedBy?: string;
  validatedAt?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// categories/{categoryId}
interface Category {
  id: string;
  name: string;
  familyId: string;
  color: string;
  icon: string;
  isCustom: boolean;
  createdAt: Timestamp;
}

// photos/{photoId}
interface Photo {
  id: string;
  taskId: string;
  familyId: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  validatedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  expiresAt: Timestamp; // Auto-delete after 90 days
}

// notifications/{notificationId}
interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'validation_required' | 'points_earned';
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
}
```

### Security Rules Strategy

```javascript
// Firestore Security Rules Pattern
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId 
        || request.auth.uid in resource.data.familyMembers;
      allow write: if request.auth.uid == userId;
    }
    
    // Family members can read, parents can write
    match /families/{familyId} {
      allow read: if request.auth.uid in resource.data.memberIds;
      allow write: if request.auth.uid in resource.data.parentIds;
    }
    
    // Tasks are scoped to family
    match /tasks/{taskId} {
      allow read: if request.auth.uid in 
        get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.memberIds;
      allow create: if request.auth.uid in 
        get(/databases/$(database)/documents/families/$(request.resource.data.familyId)).data.parentIds;
      allow update: if request.auth.uid == resource.data.assignedTo 
        || request.auth.uid in get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.parentIds;
    }
  }
}
```

## Key Architecture Patterns

### 1. Repository Pattern
All data access goes through service classes that abstract Firebase operations:
```typescript
// Example: TaskService
class TaskService {
  async create(task: TaskInput): Promise<Task>
  async getByFamily(familyId: string): Promise<Task[]>
  async update(id: string, updates: Partial<Task>): Promise<void>
  async delete(id: string): Promise<void>
}
```

### 2. State Management Pattern
Redux Toolkit with normalized state:
```typescript
// Slice pattern
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: tasksAdapter.getInitialState(),
  reducers: {
    taskAdded: tasksAdapter.addOne,
    taskUpdated: tasksAdapter.updateOne,
    taskRemoved: tasksAdapter.removeOne
  }
});
```

### 3. Offline-First Pattern
- Optimistic updates with rollback
- Local caching with Redux Persist
- Background sync when online

### 4. Event-Driven Architecture
Cloud Functions respond to Firestore triggers:
```typescript
// Example: Photo validation trigger
export const onPhotoUploaded = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Process photo, create thumbnail
    // Notify parent for validation
    // Update task status
  });
```

## Performance Considerations

### Optimization Strategies

1. **Image Optimization**
   - Compress photos before upload (80% quality, max 1920px)
   - Generate thumbnails server-side
   - Serve via CDN with caching

2. **Query Optimization**
   - Composite indexes for complex queries
   - Pagination for large datasets
   - Client-side caching with Redux

3. **Bundle Optimization**
   - Code splitting with dynamic imports
   - Tree shaking unused code
   - Lazy loading heavy components

4. **API Optimization**
   - Batch operations where possible
   - Debounce real-time listeners
   - Use Firebase offline persistence

### Scalability Limits

| Component | Current Limit | Scaling Strategy |
|-----------|--------------|------------------|
| Concurrent Users | 1,000 | Firebase auto-scales |
| Storage | 100GB | Implement photo cleanup |
| API Calls | 10K/second | Add caching layer |
| Push Notifications | Unlimited | Use topics for broadcast |

## Security Architecture

### Authentication Flow
1. Email/password or Google OAuth
2. Firebase Auth creates JWT token
3. Custom claims added for role (parent/child)
4. Token validated on each request
5. Refresh token rotation every 30 days

### Data Protection
- **At Rest**: AES-256 encryption in Firestore
- **In Transit**: TLS 1.3 minimum
- **Photos**: Signed URLs with expiration
- **Secrets**: Environment variables, never in code

### COPPA Compliance
- Parental consent required for under-13
- Limited data collection from minors
- 90-day photo retention policy
- No third-party data sharing

## Deployment Architecture

### Environments

| Environment | Purpose | URL | Firebase Project |
|-------------|---------|-----|------------------|
| Development | Local development | localhost | Emulators |
| Staging | Pre-production testing | staging.typebapp.com | typeb-family-app-staging |
| Production | Live application | typebapp.com | typeb-family-app |

### CI/CD Pipeline (Planned)
```yaml
# GitHub Actions Workflow
1. Push to main branch
2. Run tests (Jest, TypeScript)
3. Build applications
4. Deploy to staging
5. Run E2E tests
6. Manual approval
7. Deploy to production
8. Smoke tests
9. Rollback if needed
```

## Monitoring & Observability

### Key Metrics
- **Error Rate**: Target <1%
- **API Latency**: p95 <500ms
- **Uptime**: Target 99.9%
- **Daily Active Users**: Track growth
- **Conversion Rate**: Free to paid

### Monitoring Stack
- **Errors**: Sentry
- **Performance**: Firebase Performance
- **Analytics**: Firebase Analytics
- **Uptime**: Vercel Analytics
- **Logs**: Firebase Functions logs

## Future Architecture Considerations

### Planned Improvements
1. **GraphQL API**: For more flexible queries
2. **Microservices**: Split functions by domain
3. **Event Sourcing**: For audit trail
4. **CQRS**: Separate read/write models
5. **API Gateway**: Rate limiting and caching

### Technical Debt to Address
1. Monorepo structure needs cleanup
2. Test coverage improvement needed
3. Documentation consolidation required
4. CI/CD automation missing
5. Staging environment underutilized

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Next Review**: Quarterly