# TypeB - Technical Implementation Details

## Error Boundary Strategy

### Implementation
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import * as Sentry from '@sentry/react-native';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    Sentry.captureException(error, { extra: errorInfo });
    
    // Log to Firebase Analytics
    analytics.logEvent('app_crash', {
      error: error.toString(),
      component_stack: errorInfo.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We've been notified and are working on a fix.
          </Text>
          <Button 
            title="Try Again" 
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

### Boundary Placement
- Wrap entire App (catches everything)
- Wrap each navigator stack
- Wrap complex features (task creation, payments)
- Never wrap individual inputs

## Loading States

### Skeleton Screen (Initial Load Only)
```typescript
// src/components/SkeletonLoader.tsx
const SkeletonTask = () => (
  <View style={styles.taskCard}>
    <Shimmer width={200} height={20} />
    <Shimmer width={150} height={16} style={{ marginTop: 8 }} />
    <Shimmer width={100} height={16} style={{ marginTop: 4 }} />
  </View>
);

const DashboardSkeleton = () => (
  <>
    <Shimmer width={250} height={32} /> {/* Title */}
    <Shimmer width={300} height={80} style={{ marginTop: 16 }} /> {/* Stats card */}
    {[1,2,3].map(i => <SkeletonTask key={i} />)}
  </>
);
```

### Inline Loading (Actions)
```typescript
// Simple spinner for buttons
const [loading, setLoading] = useState(false);

<TouchableOpacity onPress={handleSubmit} disabled={loading}>
  {loading ? (
    <ActivityIndicator size="small" color="#FFF" />
  ) : (
    <Text>Save Task</Text>
  )}
</TouchableOpacity>
```

### Pull to Refresh
```typescript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#0A0A0A"
      title="Updating..."
    />
  }
>
```

## Empty States

### No Tasks
```typescript
const EmptyTaskList = () => (
  <View style={styles.emptyContainer}>
    <Heroicon name="clipboard-list" size={64} color="#CCC" />
    <Text style={styles.emptyTitle}>No tasks yet!</Text>
    <Text style={styles.emptyMessage}>
      Create your first task to get started
    </Text>
    <Button title="Create Task" onPress={navigateToCreate} />
  </View>
);
```

### No Family Members
```typescript
const EmptyFamily = () => (
  <View style={styles.emptyContainer}>
    <Heroicon name="user-group" size={64} color="#CCC" />
    <Text style={styles.emptyTitle}>Flying solo!</Text>
    <Text style={styles.emptyMessage}>
      Invite family members to collaborate
    </Text>
    <Button title="Invite Family" onPress={navigateToInvite} />
  </View>
);
```

## Micro-interactions

### Button Press
```typescript
const AnimatedButton = ({ onPress, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      duration: 100
    }).start();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      duration: 100
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### Task Completion
```typescript
const TaskCompleteAnimation = () => {
  // 1. Checkmark scales up
  // 2. Haptic feedback  
  // 3. Card fades out
  // 4. List reorganizes
  
  const completeTask = () => {
    // Haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Visual
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1.2 }),
      Animated.spring(checkScale, { toValue: 1 }),
      Animated.timing(opacity, { toValue: 0, duration: 300 })
    ]).start(() => {
      // Remove from list
      removeTask(task.id);
      
      // Show brief success message
      showToast('Task completed! 🎉');
    });
  };
};
```

## Test Data Generation

### Script: generate-test-data.js
```javascript
const { faker } = require('@faker-js/faker');
const admin = require('firebase-admin');

const categories = ['Chores', 'School', 'Personal Care', 'Family Time', 'Exercise'];
const taskTemplates = [
  'Clean room',
  'Do homework',
  'Take shower',
  'Walk dog',
  'Practice piano',
  'Empty dishwasher',
  'Study for test',
  'Brush teeth',
  'Family dinner',
  'Morning run'
];

async function generateTestData() {
  // Create test families
  const families = [];
  for (let i = 0; i < 5; i++) {
    const family = {
      id: faker.datatype.uuid(),
      name: faker.name.lastName() + ' Family',
      managerId: faker.datatype.uuid(),
      memberIds: Array(3).fill().map(() => faker.datatype.uuid()),
      inviteCode: faker.random.alphaNumeric(8).toUpperCase(),
      createdAt: faker.date.past()
    };
    families.push(family);
  }
  
  // Create test users
  const users = [];
  families.forEach(family => {
    // Manager
    users.push({
      id: family.managerId,
      email: faker.internet.email(),
      displayName: faker.name.fullName(),
      role: 'manager',
      familyId: family.id
    });
    
    // Members
    family.memberIds.forEach(id => {
      users.push({
        id,
        email: faker.internet.email(),
        displayName: faker.name.firstName(),
        role: 'member',
        familyId: family.id
      });
    });
  });
  
  // Create test tasks
  const tasks = [];
  families.forEach(family => {
    // Create 20-50 tasks per family
    const taskCount = faker.datatype.number({ min: 20, max: 50 });
    
    for (let i = 0; i < taskCount; i++) {
      const assignedTo = faker.helpers.arrayElement([
        family.managerId,
        ...family.memberIds
      ]);
      
      const dueDate = faker.date.between(
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      
      const task = {
        id: faker.datatype.uuid(),
        familyId: family.id,
        title: faker.helpers.arrayElement(taskTemplates),
        description: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(categories),
        assignedTo,
        createdBy: family.managerId,
        dueDate,
        status: faker.helpers.arrayElement(['pending', 'completed', 'validated']),
        reminder: {
          type: 'smart',
          settings: {
            initialReminder: 30,
            escalationLevels: [15, 5],
            notifyManager: true
          }
        },
        createdAt: faker.date.past()
      };
      
      tasks.push(task);
    }
  });
  
  // Upload to Firebase
  const batch = admin.firestore().batch();
  
  families.forEach(family => {
    batch.set(admin.firestore().collection('families').doc(family.id), family);
  });
  
  users.forEach(user => {
    batch.set(admin.firestore().collection('users').doc(user.id), user);
  });
  
  tasks.forEach(task => {
    batch.set(admin.firestore().collection('tasks').doc(task.id), task);
  });
  
  await batch.commit();
  
  console.log('Test data generated:');
  console.log(`- ${families.length} families`);
  console.log(`- ${users.length} users`);
  console.log(`- ${tasks.length} tasks`);
}

// Run with: node generate-test-data.js
generateTestData().catch(console.error);
```

## Logging Strategy

### Development
```typescript
// src/utils/logger.ts
const isDev = __DEV__;

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`ℹ️ [INFO] ${message}`, data);
    }
    analytics.logEvent('app_log_info', { message, ...data });
  },
  
  warn: (message: string, data?: any) => {
    if (isDev) {
      console.warn(`⚠️ [WARN] ${message}`, data);
    }
    analytics.logEvent('app_log_warn', { message, ...data });
  },
  
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(`❌ [ERROR] ${message}`, error);
    }
    Sentry.captureException(error || new Error(message));
    analytics.logEvent('app_log_error', { message, error: error?.toString() });
  }
};
```

### Production
- No console.logs (stripped by babel plugin)
- Errors go to Sentry
- Events go to Firebase Analytics
- Performance metrics to Firebase Performance

## Deep Linking (Future)

### URL Structure
```
typeb://family/join/ABCD1234  - Join family with code
typeb://task/view/uuid        - View specific task
typeb://subscribe             - Open subscription screen
typeb://settings              - Open settings
```

### Implementation Placeholder
```typescript
// Will implement in v2
const linking = {
  prefixes: ['typeb://', 'https://typeb.app'],
  config: {
    screens: {
      Family: {
        path: 'family/join/:code',
        parse: { code: (code: string) => code.toUpperCase() }
      },
      Task: 'task/view/:id',
      Subscribe: 'subscribe',
      Settings: 'settings'
    }
  }
};
```

## Force Update Mechanism

### Using Expo Updates
```typescript
// src/utils/updates.ts
import * as Updates from 'expo-updates';

export async function checkForUpdates() {
  if (__DEV__) return;
  
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      // Optional: Check if update is mandatory
      const { manifest } = update;
      const isMandatory = manifest.extra?.mandatory || false;
      
      if (isMandatory) {
        Alert.alert(
          'Update Required',
          'A new version is available and required to continue.',
          [
            {
              text: 'Update Now',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Optional update notification
        showUpdateBanner();
      }
    }
  } catch (e) {
    logger.error('Error checking for updates', e);
  }
}
```

## Performance Monitoring

### Key Metrics
```typescript
// src/utils/performance.ts
import perf from '@react-native-firebase/perf';

// Screen load time
export async function trackScreenLoad(screenName: string) {
  const trace = await perf().startTrace(`screen_load_${screenName}`);
  // ... screen loads
  await trace.stop();
}

// API call performance
export async function trackApiCall(endpoint: string, fn: Function) {
  const trace = await perf().startTrace(`api_${endpoint}`);
  try {
    const result = await fn();
    trace.putMetric('response_size', JSON.stringify(result).length);
    return result;
  } finally {
    await trace.stop();
  }
}

// Custom metrics
const httpMetric = await perf().newHttpMetric(
  'https://api.typeb.app/tasks',
  'GET'
);
await httpMetric.start();
// make request
httpMetric.setHttpResponseCode(200);
httpMetric.setResponseContentType('application/json');
await httpMetric.stop();
```

## Security Implementation

### Input Sanitization
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  // Remove HTML/scripts
  let clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Trim whitespace
  clean = clean.trim();
  
  // Limit length
  clean = clean.substring(0, 1000);
  
  // Remove null bytes
  clean = clean.replace(/\0/g, '');
  
  return clean;
}

// Use in forms
const handleSubmit = (data) => {
  const sanitized = {
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description)
  };
  
  createTask(sanitized);
};
```

### API Security
```typescript
// Rate limiting (client side)
const rateLimiter = new Map();

export function rateLimit(key: string, limit: number = 10, window: number = 60000) {
  const now = Date.now();
  const record = rateLimiter.get(key) || { count: 0, resetAt: now + window };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + window;
  }
  
  if (record.count >= limit) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  record.count++;
  rateLimiter.set(key, record);
}

// Use before API calls
try {
  rateLimit('task_create', 10, 60000); // 10 per minute
  await createTask(data);
} catch (e) {
  showToast(e.message);
}
```

---

**All technical implementation details are now documented and ready for development.**