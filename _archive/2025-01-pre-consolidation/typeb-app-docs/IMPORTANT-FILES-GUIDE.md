# TypeB Family App - Important Files & Architecture Guide

## 🏗️ Architecture Overview

The app follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React Native)        │
├─────────────────────────────────────────────────┤
│                   State Management (Redux)       │
├─────────────────────────────────────────────────┤
│                   Services Layer                 │
├─────────────────────────────────────────────────┤
│                   Firebase Backend               │
│  (Auth | Firestore | Storage | Functions)       │
└─────────────────────────────────────────────────┘
```

## 📁 Critical Files & Their Purpose

### Configuration Files

#### `/app.json`
- **Purpose**: Expo and app configuration
- **Key Settings**: App name, version, icons, iOS/Android config
- **When to Edit**: Version updates, adding plugins, changing app metadata

#### `/eas.json`
- **Purpose**: EAS Build configuration
- **Profiles**: development, preview, production
- **When to Edit**: Changing build settings, adding environment variables

#### `/.env` and `/.env.production`
- **Purpose**: Environment variables for Firebase and API keys
- **Security**: Never commit to git
- **When to Edit**: Updating Firebase config or API endpoints

### Core Application Files

#### `/App.tsx`
- **Purpose**: Root component, initializes providers
- **Key Functions**: Sets up Redux, Navigation, Auth listener
- **Dependencies**: All major providers wrap here

#### `/src/navigation/AppNavigator.tsx`
- **Purpose**: Main navigation structure
- **Screens**: Auth flow, Main app flow, Modal screens
- **When to Edit**: Adding new screens or changing navigation flow

### State Management

#### `/src/store/index.ts`
- **Purpose**: Redux store configuration
- **Slices**: auth, family, tasks, notifications
- **Middleware**: Redux Toolkit, persistence

#### `/src/store/slices/`
- **authSlice.ts**: User authentication state
- **familySlice.ts**: Family data and members
- **tasksSlice.ts**: Task management
- **notificationsSlice.ts**: Notification handling

### Services (Firebase Integration)

#### `/src/services/firebase.ts`
- **Purpose**: Firebase initialization
- **Exports**: auth, db, storage instances
- **Environment**: Switches between dev/prod configs

#### `/src/services/auth.ts`
- **Purpose**: Authentication operations
- **Functions**: signIn, signUp, signOut, resetPassword
- **Security**: Input validation, rate limiting

#### `/src/services/family.ts`
- **Purpose**: Family CRUD operations
- **Functions**: createFamily, joinFamily, updateFamily
- **Real-time**: Firestore listeners for live updates

#### `/src/services/tasks.ts`
- **Purpose**: Task management
- **Functions**: createTask, updateTask, completeTask
- **Features**: Photo validation, recurring tasks

#### `/src/services/storage.ts`
- **Purpose**: File upload/download
- **Functions**: uploadTaskPhoto, getPhotoURL
- **Security**: Access control, file validation

### Key Screens

#### `/src/screens/auth/SignInScreen.tsx`
- **Entry Point**: First screen users see
- **Features**: Email/password login, forgot password
- **Navigation**: To SignUp or Main app

#### `/src/screens/dashboard/ParentDashboard.tsx`
- **Purpose**: Parent's main view
- **Features**: Task overview, family management, analytics
- **Permissions**: Parent-only features

#### `/src/screens/dashboard/ChildDashboard.tsx`
- **Purpose**: Child's main view
- **Features**: Assigned tasks, points, rewards
- **UI**: Simplified, visual interface

#### `/src/screens/tasks/TaskDetailModal.tsx`
- **Purpose**: Task creation/editing
- **Features**: Categories, priorities, photo requirements
- **Validation**: Form validation, permission checks

#### `/src/screens/family/FamilyScreen.tsx`
- **Purpose**: Family management
- **Features**: Member list, invite codes, roles
- **Real-time**: Live member updates

### Components

#### `/src/components/tasks/TaskCard.tsx`
- **Purpose**: Visual task representation
- **Features**: Status indicators, priority colors
- **Interactions**: Swipe actions, tap to view

#### `/src/components/common/LoadingScreen.tsx`
- **Purpose**: Consistent loading states
- **Usage**: Wrap async operations
- **Customization**: Different loading messages

#### `/src/components/notifications/NotificationHandler.tsx`
- **Purpose**: Handle push notifications
- **Features**: Permission requests, deep linking
- **Background**: Handles app in background/foreground

### Utilities

#### `/src/utils/validation.ts`
- **Purpose**: Input validation functions
- **Functions**: validateEmail, validatePassword
- **Usage**: Form validation across the app

#### `/src/utils/dateHelpers.ts`
- **Purpose**: Date formatting and calculations
- **Functions**: formatDate, getDueStatus, isOverdue
- **Timezone**: Handles user timezone conversions

#### `/src/utils/roleHelpers.ts`
- **Purpose**: Permission checking
- **Functions**: canCreateTask, canEditFamily
- **Security**: Role-based access control

### Native Configurations

#### `/ios/TypeBFamily/Info.plist`
- **Purpose**: iOS app configuration
- **Settings**: Permissions, orientations, capabilities
- **Icons**: References to app icons

#### `/android/app/src/main/AndroidManifest.xml`
- **Purpose**: Android app configuration
- **Permissions**: Camera, storage, notifications
- **Activities**: Main activity configuration

### Testing Files

#### `/e2e/tests/`
- **auth.test.js**: Authentication flow tests
- **tasks.test.js**: Task management tests
- **family.test.js**: Family operations tests

#### `/__tests__/`
- **Unit tests**: Component and utility tests
- **Integration tests**: Service layer tests
- **Mocks**: Firebase and API mocks

### Build & Deployment

#### `/scripts/`
- **generate-ipad-icons.sh**: Creates required icon sizes
- **create-demo-accounts.sh**: Sets up demo users
- **setup-demo-data.js**: Populates test data

#### `/firebase.json`
- **Purpose**: Firebase project configuration
- **Services**: Firestore, Functions, Storage rules
- **Emulators**: Local development setup

#### `/firestore.rules`
- **Purpose**: Database security rules
- **Access Control**: User and family-based permissions
- **Validation**: Data structure enforcement

## 🔑 Key Patterns & Conventions

### File Naming
- Components: PascalCase (e.g., `TaskCard.tsx`)
- Utilities: camelCase (e.g., `dateHelpers.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### State Management Pattern
```typescript
// Async thunk pattern
export const fetchTasks = createAsyncThunk(
  'tasks/fetch',
  async (familyId: string) => {
    return await taskService.getFamilyTasks(familyId);
  }
);
```

### Service Pattern
```typescript
// Service method pattern
export const createTask = async (taskData: TaskInput): Promise<Task> => {
  // Validation
  // Firebase operation
  // Error handling
  // Return formatted data
};
```

### Component Structure
```typescript
// Functional component pattern
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
};
```

## 🚀 Quick Start for New Features

### Adding a New Screen
1. Create screen in `/src/screens/[category]/`
2. Add to navigation in `/src/navigation/AppNavigator.tsx`
3. Add route types to `/src/types/navigation.ts`

### Adding a New Service
1. Create service in `/src/services/`
2. Add Firebase rules if needed
3. Create Redux slice if stateful
4. Add tests

### Adding a New Component
1. Create component in `/src/components/[category]/`
2. Add to component index if shared
3. Create tests in `__tests__`

## 📊 Data Flow

1. **User Action** → Component
2. **Component** → Redux Action
3. **Redux Thunk** → Service Layer
4. **Service** → Firebase
5. **Firebase** → Service (Response)
6. **Service** → Redux Store
7. **Redux Store** → Component (Re-render)

## 🔒 Security Considerations

### Critical Security Files
- `/firestore.rules` - Database access control
- `/storage.rules` - File access control
- `/src/services/auth.ts` - Authentication logic
- `/src/utils/validation.ts` - Input sanitization

### Security Checklist
- [ ] Never expose API keys in code
- [ ] Validate all user inputs
- [ ] Use Firebase security rules
- [ ] Implement rate limiting
- [ ] Sanitize file uploads
- [ ] Check permissions before operations

## 🐛 Debugging Tips

### Common Issues & Solutions

1. **Build Failures**
   - Check `/ios/Podfile.lock` for conflicts
   - Run `cd ios && pod install`
   - Clear Metro cache: `npx expo start -c`

2. **Firebase Connection Issues**
   - Verify `.env` configuration
   - Check Firebase project settings
   - Ensure services are enabled in Firebase Console

3. **State Not Updating**
   - Check Redux DevTools
   - Verify thunk is dispatched
   - Check for immutability violations

4. **Navigation Issues**
   - Check navigation types match
   - Verify screen is registered
   - Check for navigation prop passing

## 📚 Further Documentation

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Navigation](https://reactnavigation.org/)

---

**Last Updated**: February 10, 2025  
**Maintained By**: Development Team