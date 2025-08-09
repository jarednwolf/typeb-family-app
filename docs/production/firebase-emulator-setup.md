# Firebase Emulator Setup Guide

## Overview
This guide will help you set up Firebase emulators for local development and integration testing, replacing mock-based tests with real Firebase behavior.

## Prerequisites
- Node.js 14+ installed
- Firebase CLI installed globally
- Java 11+ (required for Firestore emulator)

## Installation Steps

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Initialize Firebase in the Project
```bash
cd typeb-family-app
firebase init
```

Select the following options:
- Firestore
- Authentication
- Storage
- Emulators

### 3. Configure Emulators
When prompted, configure the following emulators:
- Authentication Emulator (port 9099)
- Firestore Emulator (port 8080)
- Storage Emulator (port 9199)
- UI Emulator (port 4000)

### 4. Update firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

## Environment Configuration

### 1. Create .env.emulator file
```bash
REACT_APP_USE_EMULATOR=true
REACT_APP_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
REACT_APP_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
REACT_APP_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

### 2. Update Firebase Configuration
Create a new file `src/config/firebase.emulator.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase.config';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if in development
if (process.env.REACT_APP_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Running Emulators

### Start Emulators
```bash
firebase emulators:start
```

### Start with Data Import
```bash
firebase emulators:start --import=./emulator-data
```

### Export Data for Reuse
```bash
firebase emulators:export ./emulator-data
```

## Integration Test Setup

### 1. Create Test Helper
Create `src/__tests__/helpers/firebase-test-helper.ts`:

```typescript
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let testEnv: any;

export const setupEmulator = async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'typeb-test',
    firestore: {
      host: 'localhost',
      port: 8080,
    },
    auth: {
      host: 'localhost',
      port: 9099,
    },
  });
};

export const teardownEmulator = async () => {
  await testEnv.cleanup();
};

export const clearFirestore = async () => {
  await testEnv.clearFirestore();
};

export const getTestFirestore = (userId?: string) => {
  if (userId) {
    return testEnv.authenticatedContext(userId).firestore();
  }
  return testEnv.unauthenticatedContext().firestore();
};

export const getTestAuth = () => {
  return testEnv.authenticatedContext('test-user').auth();
};
```

### 2. Update Jest Configuration
Add to `jest.config.js`:

```javascript
module.exports = {
  // ... existing config
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.ts'],
  testTimeout: 30000, // Increase timeout for emulator tests
};
```

### 3. Create Jest Setup File
Create `src/__tests__/setup/jest.setup.ts`:

```typescript
import { setupEmulator, teardownEmulator } from '../helpers/firebase-test-helper';

beforeAll(async () => {
  await setupEmulator();
});

afterAll(async () => {
  await teardownEmulator();
});
```

## Example Integration Test

Create `src/__tests__/integration/tasks.integration.test.ts`:

```typescript
import { clearFirestore, getTestFirestore, getTestAuth } from '../helpers/firebase-test-helper';
import { createTask, getTask, updateTask } from '../../services/tasks';
import { doc, getDoc } from 'firebase/firestore';

describe('Tasks Service Integration Tests', () => {
  const testUserId = 'test-user-123';
  const testFamilyId = 'test-family-456';
  
  beforeEach(async () => {
    await clearFirestore();
  });

  describe('createTask', () => {
    it('should create a task with proper security', async () => {
      const db = getTestFirestore(testUserId);
      const auth = getTestAuth();
      
      const taskData = {
        title: 'Test Task',
        description: 'Integration test task',
        assignedTo: testUserId,
        familyId: testFamilyId,
        dueDate: new Date('2025-01-15'),
      };

      const taskId = await createTask(taskData, testUserId);
      
      // Verify task was created
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      expect(taskDoc.exists()).toBe(true);
      expect(taskDoc.data()).toMatchObject({
        title: 'Test Task',
        assignedTo: testUserId,
        createdBy: testUserId,
      });
    });

    it('should reject unauthorized task creation', async () => {
      const db = getTestFirestore('unauthorized-user');
      
      const taskData = {
        title: 'Unauthorized Task',
        assignedTo: 'other-user',
        familyId: testFamilyId,
      };

      await expect(createTask(taskData, 'unauthorized-user')).rejects.toThrow();
    });
  });
});
```

## Security Rules Testing

Create `src/__tests__/security/firestore.rules.test.ts`:

```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getTestFirestore } from '../helpers/firebase-test-helper';

describe('Firestore Security Rules', () => {
  describe('Tasks Collection', () => {
    it('should allow users to read their own tasks', async () => {
      const userId = 'user123';
      const db = getTestFirestore(userId);
      
      // Create a task assigned to the user
      await setDoc(doc(db, 'tasks', 'task1'), {
        assignedTo: userId,
        title: 'My Task',
      });
      
      // User should be able to read their own task
      await assertSucceeds(getDoc(doc(db, 'tasks', 'task1')));
    });

    it('should deny users from reading others tasks', async () => {
      const db = getTestFirestore('user123');
      
      // Create a task assigned to another user
      await setDoc(doc(db, 'tasks', 'task1'), {
        assignedTo: 'other-user',
        title: 'Not My Task',
      });
      
      // User should not be able to read others' tasks
      await assertFails(getDoc(doc(db, 'tasks', 'task1')));
    });
  });
});
```

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "emulator:start": "firebase emulators:start",
    "emulator:export": "firebase emulators:export ./emulator-data",
    "test:integration": "REACT_APP_USE_EMULATOR=true jest --testMatch='**/*.integration.test.ts'",
    "test:security": "REACT_APP_USE_EMULATOR=true jest --testMatch='**/*.rules.test.ts'",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:security"
  }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
    
    - name: Start Firebase Emulators
      run: |
        firebase emulators:start --only auth,firestore,storage &
        sleep 10
    
    - name: Run Integration Tests
      run: npm run test:integration
    
    - name: Run Security Tests
      run: npm run test:security
```

## Best Practices

1. **Test Data Management**
   - Use unique IDs for test data
   - Clear data between tests
   - Export reusable test data sets

2. **Performance**
   - Run emulators on a separate machine if possible
   - Use `--only` flag to start only needed emulators
   - Increase test timeouts for complex operations

3. **Debugging**
   - Use Emulator UI at http://localhost:4000
   - Check emulator logs for errors
   - Use `firebase emulators:start --debug` for verbose logging

4. **Security**
   - Test both positive and negative cases
   - Verify all security rules with tests
   - Use different user contexts for testing

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -ti:8080 | xargs kill -9  # Kill process on port 8080
   ```

2. **Java Not Found**
   - Install Java 11 or higher
   - Set JAVA_HOME environment variable

3. **Emulator Connection Refused**
   - Check firewall settings
   - Ensure emulators are running
   - Verify correct ports in configuration

4. **Test Timeouts**
   - Increase Jest timeout in configuration
   - Check for async operations not being awaited
   - Verify emulator performance

## Next Steps

1. Convert all mock-based tests to integration tests
2. Add security rule tests for all collections
3. Create test data fixtures
4. Set up CI/CD pipeline with emulators
5. Document test patterns for team

---

This setup will enable real Firebase testing and eliminate the need for mocks, ensuring our tests validate actual behavior rather than mock implementations.