# Performance Testing Guide

## Overview

This guide covers the performance testing infrastructure for the TypeB Family App, including tools for monitoring, measuring, and optimizing app performance.

## Table of Contents

1. [Performance Monitoring Setup](#performance-monitoring-setup)
2. [Test Data Generation](#test-data-generation)
3. [Performance Metrics](#performance-metrics)
4. [Running Performance Tests](#running-performance-tests)
5. [Performance Debug Screen](#performance-debug-screen)
6. [Optimization Guidelines](#optimization-guidelines)
7. [Performance Benchmarks](#performance-benchmarks)

## Performance Monitoring Setup

### 1. Performance Monitor Utility

The app includes a comprehensive performance monitoring utility located at [`src/utils/performance.ts`](../../src/utils/performance.ts).

#### Key Features:
- **Render time tracking**: Measure component render performance
- **API latency monitoring**: Track Firebase operations
- **Memory usage tracking**: Monitor heap usage
- **Scroll performance**: Track FPS during list scrolling
- **Custom metrics**: Record any performance metric

#### Usage in Components:

```typescript
import { usePerformanceTracking } from '../../utils/performance';

const MyComponent = () => {
  const { trackRender, trackAPI, trackCustom } = usePerformanceTracking('MyComponent');
  
  useEffect(() => {
    trackRender(); // Track component render time
  }, []);
  
  const loadData = async () => {
    const data = await trackAPI('loadTasks', () => 
      taskService.getUserTasks(userId)
    );
  };
  
  return <View>...</View>;
};
```

### 2. Performance Thresholds

The app defines performance thresholds in [`PERFORMANCE_THRESHOLDS`](../../src/utils/performance.ts):

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Screen Load | < 300ms | 300-600ms | > 600ms |
| API Call | < 500ms | 500-3000ms | > 3000ms |
| Render Time | < 16ms | 16-100ms | > 100ms |
| Scroll FPS | > 55 | 30-55 | < 30 |
| Memory Usage | < 50MB | 50-200MB | > 200MB |

## Test Data Generation

### 1. Test Data Generator Script

Located at [`scripts/performance-test-data.ts`](../../scripts/performance-test-data.ts), this script creates realistic test data for performance testing.

### 2. Available Commands

```bash
# Generate small dataset (10 users, 100 tasks)
npm run perf:test:small

# Generate medium dataset (15 users, 200 tasks)
npm run perf:test:medium

# Generate large dataset (20 users, 500 tasks)
npm run perf:test:large

# Custom generation
npm run perf:generate -- 10 100 30 --recurring --photos --overdue

# Clean up test data
npm run perf:cleanup
```

### 3. Test Data Configuration

```typescript
interface TestDataConfig {
  numMembers: number;      // Number of family members
  numTasks: number;        // Total tasks to create
  numCompletedTasks: number; // Completed tasks
  includeRecurring: boolean; // Add recurring tasks
  includePhotos: boolean;    // Add photo validation
  includeOverdue: boolean;   // Include overdue tasks
}
```

## Performance Metrics

### 1. Tracked Metrics

The app automatically tracks:

- **Component Metrics**
  - Initial render time
  - Re-render frequency
  - Mount/unmount cycles

- **API Metrics**
  - Firestore query time
  - Storage upload/download speed
  - Function execution time
  - Network latency

- **UI Metrics**
  - Screen transition time
  - List scroll FPS
  - Touch response time
  - Animation smoothness

- **System Metrics**
  - Memory usage
  - CPU utilization
  - Battery impact
  - Network bandwidth

### 2. Metric Collection

Metrics are automatically collected when:
- Navigating between screens
- Loading data from Firebase
- Scrolling through lists
- Uploading images
- Completing tasks

## Running Performance Tests

### 1. Prerequisites

```bash
# Ensure Firebase emulators are running
npm run emulators:start

# Start the app in development mode
npm start
```

### 2. Test Scenarios

#### Scenario 1: Large Task List Performance
```bash
# Generate 100+ tasks
npm run perf:test:small

# Open app and navigate to Tasks screen
# Monitor scroll performance and load time
```

#### Scenario 2: Family with Many Members
```bash
# Generate 10+ family members
npm run perf:test:medium

# Test family screen loading
# Test member management operations
```

#### Scenario 3: Heavy Image Usage
```bash
# Generate tasks with photos
npm run perf:test:large

# Test photo upload performance
# Monitor memory usage during image operations
```

### 3. Performance Test Checklist

- [ ] App launches in < 2 seconds
- [ ] Screen navigation < 300ms
- [ ] Task list with 100+ items scrolls at 55+ FPS
- [ ] Task creation < 1 second
- [ ] Task completion < 500ms
- [ ] Image upload (5MB) < 3 seconds
- [ ] Offline sync < 5 seconds
- [ ] Memory usage < 200MB
- [ ] No memory leaks after 10 minutes
- [ ] Battery drain < 2% per hour

## Performance Debug Screen

### 1. Accessing the Debug Screen

The Performance Debug Screen is available in development mode only:

1. Navigate to Settings
2. Add a hidden developer menu (tap version 7 times)
3. Select "Performance Debug"

### 2. Features

- **Real-time Metrics**: View performance metrics as they're collected
- **Test Data Generation**: Generate test data directly from the app
- **Performance Summary**: See averages, min/max values
- **Clear Metrics**: Reset all collected data
- **Export Report**: Generate performance report

### 3. Using the Debug Screen

```typescript
// The screen is located at:
// src/screens/settings/PerformanceDebugScreen.tsx

// To add it to navigation:
<Stack.Screen 
  name="PerformanceDebug" 
  component={PerformanceDebugScreen}
  options={{ title: 'Performance Debug' }}
/>
```

## Optimization Guidelines

### 1. React Native Optimizations

#### Use React.memo for expensive components
```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexView data={data} />;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

#### Optimize FlatList rendering
```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={renderTask}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

### 2. Firebase Optimizations

#### Use pagination for large datasets
```typescript
const loadTasks = async (lastDoc?: DocumentSnapshot) => {
  const q = query(
    collection(db, 'tasks'),
    where('familyId', '==', familyId),
    orderBy('createdAt', 'desc'),
    limit(20),
    ...(lastDoc ? [startAfter(lastDoc)] : [])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs;
};
```

#### Implement caching
```typescript
const cache = new Map();

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.data;
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### 3. Image Optimizations

#### Compress images before upload
```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

#### Use thumbnail placeholders
```typescript
const TaskImage = ({ uri, thumbnailUri }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <View>
      {!loaded && <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />}
      <Image 
        source={{ uri }} 
        onLoad={() => setLoaded(true)}
        style={[styles.image, !loaded && styles.hidden]}
      />
    </View>
  );
};
```

## Performance Benchmarks

### 1. Target Metrics

| Operation | Target | Maximum |
|-----------|--------|---------|
| App Launch | 1.5s | 2s |
| Screen Navigation | 200ms | 300ms |
| Task List (100 items) | 500ms | 1s |
| Task Creation | 500ms | 1s |
| Task Completion | 300ms | 500ms |
| Image Upload (5MB) | 2s | 3s |
| Family Member Add | 500ms | 1s |
| Offline Sync | 3s | 5s |
| Search | 200ms | 500ms |
| Filter Toggle | 100ms | 200ms |

### 2. Device-Specific Targets

#### High-End Devices (iPhone 14+, Pixel 7+)
- All operations 20% faster than targets
- 60 FPS scrolling always
- < 100MB memory usage

#### Mid-Range Devices (iPhone 11, Pixel 5)
- Meet all target metrics
- 55+ FPS scrolling
- < 150MB memory usage

#### Low-End Devices (iPhone SE, older Android)
- Within maximum thresholds
- 30+ FPS scrolling
- < 200MB memory usage

### 3. Network Conditions

Test under various network conditions:

- **4G/5G**: All targets met
- **3G**: Operations 2x slower acceptable
- **Slow 3G**: Operations 3x slower acceptable
- **Offline**: Full functionality with sync queue

## Monitoring in Production

### 1. Firebase Performance Monitoring

```typescript
import perf from '@react-native-firebase/perf';

// Custom trace
const trace = await perf().startTrace('custom_trace');
await someOperation();
trace.stop();

// HTTP metric
const httpMetric = await perf().newHttpMetric('https://api.example.com', 'GET');
httpMetric.start();
// Make request
httpMetric.setHttpResponseCode(200);
httpMetric.setResponseContentType('application/json');
httpMetric.stop();
```

### 2. Crash Reporting

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Log custom events
crashlytics().log('User clicked button');

// Record errors
crashlytics().recordError(error);

// Set user properties
crashlytics().setUserId(user.id);
crashlytics().setAttribute('premium', user.isPremium);
```

## Troubleshooting

### Common Performance Issues

1. **Slow List Scrolling**
   - Check `getItemLayout` implementation
   - Verify `keyExtractor` uniqueness
   - Reduce render complexity
   - Enable `removeClippedSubviews`

2. **High Memory Usage**
   - Check for memory leaks in useEffect
   - Clear unused cached data
   - Optimize image sizes
   - Use lazy loading

3. **Slow API Calls**
   - Add appropriate indexes in Firestore
   - Implement pagination
   - Use batch operations
   - Cache frequently accessed data

4. **Janky Animations**
   - Use `useNativeDriver`
   - Avoid setState during animations
   - Optimize animated component renders
   - Reduce animation complexity

## Next Steps

1. **Set up automated performance testing** in CI/CD
2. **Implement performance budgets** with alerts
3. **Add A/B testing** for performance improvements
4. **Create performance dashboard** for monitoring
5. **Document performance wins** and learnings

---

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Firebase Performance Best Practices](https://firebase.google.com/docs/perf-mon/best-practices)
- [Flipper Performance Tools](https://fbflipper.com/docs/features/react-native/)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)

---

*Last Updated: January 2025*
*Version: 1.0.0*