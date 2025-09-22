// Comprehensive mock setup for TypeB Family App tests
// This file provides complete mock implementations to prevent memory issues and test failures

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user-123' }
  })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'test-user-123', email: 'test@example.com' }
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'test-user-123', email: 'test@example.com' }
  })),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  sendEmailVerification: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-user-123' });
    return jest.fn(); // unsubscribe function
  }),
}));

// Mock Firebase Firestore with complete implementations
jest.mock('firebase/firestore', () => {
  const mockDoc = (id = 'mock-doc-id') => ({ id });
  const mockCollection = (name = 'mock-collection') => ({
    id: name,
    path: name,
    _name: name
  });
  
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn((db, name) => mockCollection(name)),
    doc: jest.fn((collectionOrDb, collectionNameOrDocId, docId) => {
      // Handle both doc(collection, id) and doc(db, collectionName, id) signatures
      if (typeof collectionNameOrDocId === 'string' && docId) {
        // doc(db, collectionName, id)
        return mockDoc(docId);
      } else if (typeof collectionNameOrDocId === 'string') {
        // doc(collection, id)
        return mockDoc(collectionNameOrDocId);
      } else {
        // doc(collection) - generate new ID
        return mockDoc();
      }
    }),
    getDoc: jest.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        id: 'mock-doc-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      id: 'mock-doc-id'
    })),
    getDocs: jest.fn(() => Promise.resolve({
      empty: false,
      docs: [],
      size: 0,
      forEach: jest.fn()
    })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    query: jest.fn((...args) => ({ _query: args })),
    where: jest.fn((field, op, value) => ({ _where: { field, op, value } })),
    orderBy: jest.fn((field, direction) => ({ _orderBy: { field, direction } })),
    limit: jest.fn((n) => ({ _limit: n })),
    startAfter: jest.fn((doc) => ({ _startAfter: doc })),
    endBefore: jest.fn((doc) => ({ _endBefore: doc })),
    serverTimestamp: jest.fn(() => 'serverTimestamp()'),
    arrayUnion: jest.fn((...items) => ({ _arrayUnion: items })),
    arrayRemove: jest.fn((...items) => ({ _arrayRemove: items })),
    increment: jest.fn((n) => ({ _increment: n })),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve())
    })),
    runTransaction: jest.fn((db, updateFunction) => {
      // Handle both runTransaction(updateFunction) and runTransaction(db, updateFunction)
      const fn = typeof db === 'function' ? db : updateFunction;
      return Promise.resolve(fn({
        get: jest.fn(() => Promise.resolve({
          exists: () => true,
          data: () => ({})
        })),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }));
    }),
    onSnapshot: jest.fn((query, callback) => {
      // Simulate snapshot
      callback({
        docs: [],
        size: 0,
        empty: true,
        forEach: jest.fn()
      });
      return jest.fn(); // unsubscribe function
    }),
    Timestamp: {
      fromDate: jest.fn((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0
      })),
      now: jest.fn(() => ({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      })),
      fromMillis: jest.fn((millis) => ({
        toDate: () => new Date(millis),
        seconds: Math.floor(millis / 1000),
        nanoseconds: 0
      }))
    },
    FieldValue: {
      serverTimestamp: jest.fn(() => 'serverTimestamp()'),
      arrayUnion: jest.fn((...items) => ({ _arrayUnion: items })),
      arrayRemove: jest.fn((...items) => ({ _arrayRemove: items })),
      increment: jest.fn((n) => ({ _increment: n }))
    }
  };
});

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((storage, path) => ({
    _path: path,
    name: path.split('/').pop(),
    fullPath: path
  })),
  uploadBytes: jest.fn(() => Promise.resolve({
    ref: { fullPath: 'uploads/test.jpg' },
    metadata: { size: 1024 }
  })),
  uploadString: jest.fn(() => Promise.resolve({
    ref: { fullPath: 'uploads/test.txt' },
    metadata: { size: 100 }
  })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://storage.example.com/test.jpg')),
  deleteObject: jest.fn(() => Promise.resolve()),
  listAll: jest.fn(() => Promise.resolve({
    items: [],
    prefixes: []
  }))
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [])
}));

// Mock Expo Notifications with complete implementation
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
    expires: 'never',
    granted: true,
    canAskAgain: true
  })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
    expires: 'never',
    granted: true,
    canAskAgain: true
  })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id-123')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  presentNotificationAsync: jest.fn(() => Promise.resolve('notification-id-123')),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getNotificationChannelsAsync: jest.fn(() => Promise.resolve([])),
  deleteNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  useLastNotificationResponse: jest.fn(() => null),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[xxxxx]' })),
  getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ data: 'device-token' })),
  AndroidImportance: {
    MAX: 4,
    HIGH: 3,
    DEFAULT: 2,
    LOW: 1,
    MIN: 0
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CALENDAR: 'calendar'
  }
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '15.0',
  deviceType: 2, // PHONE
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'TypeB Family App',
      slug: 'typeb-family-app',
      version: '1.0.0',
      extra: {
        eas: {
          projectId: 'test-project-id'
        }
      }
    },
    easConfig: {
      projectId: 'test-project-id'
    },
    manifest: null,
    manifest2: null,
    isDevice: true,
    platform: {
      ios: {
        buildNumber: '1',
        model: 'iPhone'
      }
    }
  }
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Feather: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    MaterialIcons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    Ionicons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    FontAwesome: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    AntDesign: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    Entypo: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    EvilIcons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    Foundation: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    MaterialCommunityIcons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    Octicons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    SimpleLineIcons: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
    Zocial: ({ name, size, color, ...props }) =>
      React.createElement('Text', { ...props }, `Icon: ${name}`),
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ user: { id: '1' } })),
    signOut: jest.fn(() => Promise.resolve()),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
  statusCodes: {},
}));

// Mock RevenueCat Purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setup: jest.fn(),
    getOfferings: jest.fn(() => Promise.resolve({})),
    getCustomerInfo: jest.fn(() => Promise.resolve({})),
    addCustomerInfoUpdateListener: jest.fn(),
    removeAllListeners: jest.fn(),
    logIn: jest.fn(() => Promise.resolve({})),
    logOut: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Expo image picker/manipulator
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'file://manipulated.jpg' })),
}));

// Mock react-native-modal
jest.mock('react-native-modal', () => ({ __esModule: true, default: ({ children }) => children }));

// Mock @sentry/react-native (ESM)
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTags: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: (cb) => cb({ setContext: jest.fn() }),
  ReactNativeTracing: function () {},
}));

// Mock AsyncStorage with in-memory storage
const mockAsyncStorage = (() => {
  let store = {};
  
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) => 
      Promise.resolve(keys.map(key => [key, store[key] || null]))
    ),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([key, value]) => {
        store[key] = value;
      });
      return Promise.resolve();
    })
  };
})();

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn()
  })),
  useRoute: jest.fn(() => ({
    params: {},
    name: 'TestScreen'
  })),
  useFocusEffect: jest.fn((callback) => callback()),
  useIsFocused: jest.fn(() => true),
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: jest.fn(() => ({ current: null }))
}));

// Note: realtime/offline services are tested separately; avoid global mocks here

// Mock React Native Settings module
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(() => ({})),
  set: jest.fn(),
  watchKeys: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock components that cause issues
  const MockedScrollView = RN.ScrollView;
  const MockedFlatList = RN.FlatList;
  const MockedSectionList = RN.SectionList;
  
  return {
    ...RN,
    Settings: {
      get: jest.fn(() => ({})),
      set: jest.fn(),
      watchKeys: jest.fn(),
    },
    NativeModules: {
      ...RN.NativeModules,
      SettingsManager: {
        settings: {},
        setValues: jest.fn(),
        deleteValues: jest.fn(),
      },
    },
    Platform: {
      OS: 'ios',
      Version: 15,
      select: jest.fn((obj) => obj.ios || obj.default),
      isPad: false,
      isTV: false
    },
    Alert: {
      alert: jest.fn((title, message, buttons) => {
        if (buttons && buttons.length > 0) {
          const positiveButton = buttons.find(b => b.style !== 'cancel');
          if (positiveButton && positiveButton.onPress) {
            positiveButton.onPress();
          }
        }
      })
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      openSettings: jest.fn(() => Promise.resolve())
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
    ScrollView: MockedScrollView,
    FlatList: MockedFlatList,
    SectionList: MockedSectionList,
    ActivityIndicator: RN.View,
    TouchableOpacity: RN.TouchableOpacity || RN.View,
    TouchableHighlight: RN.TouchableHighlight || RN.View,
    TouchableWithoutFeedback: RN.TouchableWithoutFeedback || RN.View,
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {
          onStartShouldSetResponder: jest.fn(),
          onMoveShouldSetResponder: jest.fn(),
          onStartShouldSetResponderCapture: jest.fn(),
          onMoveShouldSetResponderCapture: jest.fn(),
          onResponderGrant: jest.fn(),
          onResponderMove: jest.fn(),
          onResponderRelease: jest.fn(),
          onResponderTerminate: jest.fn(),
          onResponderTerminationRequest: jest.fn(),
        },
      })),
    },
  };
});

// Mock Firebase service
jest.mock('./src/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' }
  },
  db: {},
  storage: {},
  analytics: {
    logEvent: jest.fn()
  }
}));

// Silence console during tests (but keep console.log and console.error for debugging)
global.console = {
  ...console,
  warn: jest.fn(),
  // error: jest.fn(), // Temporarily allow console.error for debugging
  info: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.clear();
});