/**
 * Central test setup for all test suites
 * Handles Firebase emulator connections and mock setup
 */

import { jest } from '@jest/globals';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  })),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  onAuthStateChanged: jest.fn(),
  User: jest.fn(),
  // Add emulator functions if needed for integration tests
  connectAuthEmulator: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  const defaultDoc = { id: 'mock-doc-id', path: 'collection/mock-doc-id' };
  const defaultSnapshot = {
    exists: () => true,
    data: () => ({}),
    id: 'mock-doc-id',
  };
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn((_db?: any, name?: string) => ({ id: name || 'mock-collection' })),
    doc: jest.fn((_arg1?: any, _arg2?: string, _arg3?: string) => defaultDoc),
    getDoc: jest.fn(() => Promise.resolve(defaultSnapshot)),
    getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [], size: 0, forEach: jest.fn() })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    query: jest.fn((...args: any[]) => ({ _query: args })),
    where: jest.fn((field: string, op: any, value: any) => ({ field, op, value })),
    orderBy: jest.fn((field: string, direction?: string) => ({ field, direction })),
    limit: jest.fn((n: number) => ({ n })),
    onSnapshot: jest.fn((_q: any, cb: any) => { cb({ docs: [] }); return jest.fn(); }),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
    },
    runTransaction: jest.fn((_db: any, callback: any) => callback({
      get: jest.fn(() => Promise.resolve(defaultSnapshot)),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    arrayRemove: jest.fn((...elements: any[]) => ({ _type: 'arrayRemove', elements })),
    arrayUnion: jest.fn((...elements: any[]) => ({ _type: 'arrayUnion', elements })),
    FieldValue: {
      arrayRemove: jest.fn((...elements: any[]) => ({ _type: 'arrayRemove', elements })),
      arrayUnion: jest.fn((...elements: any[]) => ({ _type: 'arrayUnion', elements })),
    },
    connectFirestoreEmulator: jest.fn(),
    terminate: jest.fn(),
  };
});

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  connectStorageEmulator: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'test-app',
    options: {},
  })),
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
  deleteApp: jest.fn(),
}));

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name, size, color, style }: any) => {
    const React = require('react');
    return React.createElement('Text', { style }, `Icon: ${name}`);
  },
  MaterialIcons: ({ name, size, color, style }: any) => {
    const React = require('react');
    return React.createElement('Text', { style }, `Icon: ${name}`);
  },
  Ionicons: ({ name, size, color, style }: any) => {
    const React = require('react');
    return React.createElement('Text', { style }, `Icon: ${name}`);
  },
}));

// Mock React Native modules
const MockView = ({ children, ...props }: any) => {
  const React = require('react');
  return React.createElement('View', props, children);
};

const MockText = ({ children, ...props }: any) => {
  const React = require('react');
  return React.createElement('Text', props, children);
};

const MockTouchableOpacity = ({ children, onPress, ...props }: any) => {
  const React = require('react');
  return React.createElement('TouchableOpacity', { onPress, ...props }, children);
};

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: any) => obj.ios),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
  StyleSheet: {
    create: (styles: any) => styles,
    flatten: (style: any) => style,
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  NativeModules: {
    UIManager: {
      RCTView: () => {},
    },
    PlatformConstants: {
      forceTouchAvailable: false,
    },
    KeyboardObserver: {},
    StatusBarManager: {
      HEIGHT: 20,
      getHeight: jest.fn(),
    },
    Keyboard: {},
  },
  View: MockView,
  Text: MockText,
  TouchableOpacity: MockTouchableOpacity,
  ScrollView: MockView,
  FlatList: MockView,
  Modal: MockView,
  Image: MockView,
  TextInput: MockView,
  Switch: MockView,
  ActivityIndicator: MockView,
  TouchableHighlight: MockTouchableOpacity,
  TouchableWithoutFeedback: MockTouchableOpacity,
  TouchableNativeFeedback: MockTouchableOpacity,
  Pressable: MockTouchableOpacity,
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    ValueXY: jest.fn(() => ({
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      getLayout: jest.fn(),
      getTranslateTransform: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    decay: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    loop: jest.fn(() => ({
      start: jest.fn((callback?: any) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
    event: jest.fn(),
    add: jest.fn(),
    subtract: jest.fn(),
    multiply: jest.fn(),
    modulo: jest.fn(),
    diffClamp: jest.fn(),
    delay: jest.fn(),
    stagger: jest.fn(),
    View: MockView,
    Text: MockText,
    Image: MockView,
    ScrollView: MockView,
    FlatList: MockView,
    SectionList: MockView,
    createAnimatedComponent: jest.fn((component) => component),
  },
  PanResponder: {
    create: jest.fn(() => ({
      panHandlers: {
        onStartShouldSetPanResponder: jest.fn(),
        onMoveShouldSetPanResponder: jest.fn(),
        onPanResponderGrant: jest.fn(),
        onPanResponderMove: jest.fn(),
        onPanResponderRelease: jest.fn(),
        onPanResponderTerminate: jest.fn(),
      },
    })),
  },
}));

// Mock Expo modules
// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const MockAnimatedView = ({ children, ...props }: any) =>
    React.createElement('View', props, children);
  
  return {
    default: {
      createAnimatedComponent: jest.fn((component) => component),
      View: MockAnimatedView,
      Text: MockText,
      Image: MockView,
      ScrollView: MockView,
      Code: jest.fn(),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
      })),
      event: jest.fn(),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      multiply: jest.fn(),
      useSharedValue: jest.fn(() => ({ value: 0 })),
      useAnimatedStyle: jest.fn(() => ({})),
      useAnimatedProps: jest.fn(() => ({})),
      withTiming: jest.fn((value) => value),
      withSpring: jest.fn((value) => value),
      withDelay: jest.fn((delay, animation) => animation),
      withSequence: jest.fn((...animations) => animations[0]),
      withRepeat: jest.fn((animation) => animation),
      cancelAnimation: jest.fn(),
      runOnJS: jest.fn((fn) => fn),
      runOnUI: jest.fn((fn) => fn),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((delay, animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    withRepeat: jest.fn((animation) => animation),
    interpolate: jest.fn(),
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
  };
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: jest.fn(),
  DrawerLayout: jest.fn(),
  State: {},
  ScrollView: jest.fn(),
  FlatList: jest.fn(),
  RectButton: jest.fn(),
  BaseButton: jest.fn(),
  TouchableOpacity: jest.fn(),
  TouchableHighlight: jest.fn(),
  TouchableWithoutFeedback: jest.fn(),
  TouchableNativeFeedback: jest.fn(),
  GestureHandlerRootView: jest.fn(({ children }) => children),
  gestureHandlerRootHOC: jest.fn(component => component),
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: jest.fn(({ children }) => children),
  SafeAreaView: jest.fn(({ children }) => children),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock expo-notifications

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-token' })),
  setBadgeCountAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// Mock CompletionAnimation component
jest.mock('../../components/animations/CompletionAnimation', () => ({
  __esModule: true,
  default: ({ onAnimationEnd }: any) => {
    const React = require('react');
    React.useEffect(() => {
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    }, []);
    return null;
  }
}));

// Mock ReactionDisplay component
jest.mock('../../components/reactions', () => ({
  ReactionDisplay: ({ onReactionAdded, onReactionRemoved }: any) => null,
}));

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#34C759',
        error: '#FF3B30',
        warning: '#FF9500',
        info: '#5AC8FA',
        surface: '#FFFFFF',
        background: '#F2F2F7',
        textPrimary: '#000000',
        textSecondary: '#3C3C43',
        textTertiary: '#C7C7CC',
        separator: '#E5E5EA',
        white: '#FFFFFF',
        premium: '#FFD700',
      },
      spacing: {
        XXS: 2,
        XS: 4,
        S: 8,
        M: 16,
        L: 24,
        XL: 32,
        XXL: 48,
      },
      typography: {
        body: { fontSize: 16, lineHeight: 22 },
        caption1: { fontSize: 12, lineHeight: 16 },
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
      },
      elevation: {
        4: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
      },
      shadows: {
        small: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        },
        medium: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        large: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
      },
      layout: {
        buttonHeight: {
          small: 32,
          medium: 44,
          large: 56,
        },
        inputHeight: {
          small: 32,
          medium: 44,
          large: 56,
        },
        headerHeight: 56,
      },
    },
    isDarkMode: false,
  }),
  ThemeProvider: ({ children }: any) => children,
}));

// Mock AccessibilityContext
jest.mock('../../contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    settings: {
      announceStateChanges: true,
    },
    announce: jest.fn(),
  }),
  getAccessibilityLabel: (type: string, title: string, options: any) => `${type}: ${title}`,
  getAccessibilityHint: (hint: string) => hint,
  useReduceMotion: () => false,
  AccessibilityProvider: ({ children }: any) => children,
}));

// Mock haptics utility
jest.mock('../../utils/haptics', () => ({
  useHaptics: () => ({
    taskComplete: jest.fn(),
    selection: jest.fn(),
    impact: jest.fn(),
    notification: jest.fn(),
  }),
}));

// Mock Redux hooks
jest.mock('../../hooks/redux', () => ({
  useAppSelector: jest.fn((selector: any) => {
    // Return mock data based on the selector
    const mockState = {
      family: {
        members: [
          { id: 'child-1', displayName: 'Child 1', role: 'child' },
          { id: 'child-2', displayName: 'Child 2', role: 'child' },
          { id: 'parent-1', displayName: 'Parent 1', role: 'parent' },
        ],
        currentFamily: {
          id: 'test-family-123',
          name: 'Test Family',
          inviteCode: 'ABC123',
          createdBy: 'test-user-123',
          memberIds: ['test-user-123'],
          parentIds: ['test-user-123'],
          childIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          maxMembers: 10,
          isPremium: true,
        },
      },
      auth: {
        userProfile: {
          uid: 'test-user-123',
          displayName: 'Test User',
          role: 'parent',
        },
      },
    };
    return selector(mockState);
  }),
  useAppDispatch: jest.fn(() => jest.fn()),
}));

// Mock Redux selectors
jest.mock('../../store/slices/familySlice', () => {
  const initialState = {
    currentFamily: null,
    members: [],
    isLoading: false,
    error: null,
    inviteCode: null,
    isJoining: false,
    isCreating: false,
  };
  const reducer = (state = initialState, action: any) => {
    switch (action?.type) {
      case 'family/setFamily':
        return { ...state, currentFamily: { ...action.payload } };
      case 'family/setMembers':
        return { ...state, members: Array.isArray(action.payload) ? [...action.payload] : [] };
      default:
        return state;
    }
  };
  return {
    __esModule: true,
    default: reducer,
    selectFamilyMembers: (state: any) => state?.family?.members || [],
  };
});

jest.mock('../../store/slices/authSlice', () => {
  const initialState = {
    user: null,
    userProfile: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isEmailVerified: false,
  };
  const reducer = (state = initialState, action: any) => {
    switch (action?.type) {
      case 'auth/setUserProfile':
        return { ...state, userProfile: { ...action.payload } };
      case 'auth/setUser':
        return { ...state, user: { ...action.payload }, isAuthenticated: !!action.payload };
      default:
        return state;
    }
  };
  return {
    __esModule: true,
    default: reducer,
    selectUserProfile: (state: any) => state?.auth?.userProfile || null,
    selectUser: (state: any) => state?.auth?.user || null,
  };
});

// Mock animation utilities
jest.mock('../../utils/animations', () => ({
  usePressAnimation: (scale: number) => ({
    animatedStyle: {},
    handlePressIn: jest.fn(),
    handlePressOut: jest.fn(),
  }),
  useFadeAnimation: (from: number, to: number, duration: number) => ({
    animatedStyle: {},
    fadeIn: jest.fn(),
    fadeOut: jest.fn(),
  }),
  usePulseAnimation: () => ({
    animatedStyle: {},
    startPulse: jest.fn(),
    stopPulse: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  storage: {},
}));

// Mock notification service to avoid rate limit issues
jest.mock('../../services/notifications', () => ({
  scheduleTaskReminder: jest.fn(() => Promise.resolve()),
  cancelTaskReminder: jest.fn(() => Promise.resolve()),
  sendTestNotification: jest.fn(() => Promise.resolve()),
  updateBadgeCount: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  subscribeToFamilyNotifications: jest.fn(() => Promise.resolve()),
  unsubscribeFromFamilyNotifications: jest.fn(() => Promise.resolve()),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

// Mock push notification service
jest.mock('../../services/pushNotifications', () => ({
  requestPermissions: jest.fn(() => Promise.resolve(true)),
  registerForPushNotifications: jest.fn(() => Promise.resolve('test-token')),
  savePushToken: jest.fn(() => Promise.resolve()),
  subscribeToFamily: jest.fn(() => Promise.resolve()),
  unsubscribeFromFamily: jest.fn(() => Promise.resolve()),
  sendNotification: jest.fn(() => Promise.resolve()),
}));

// Global test utilities
declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockFamily: (overrides?: any) => any;
    createMockTask: (overrides?: any) => any;
  };
}

(global as any).testUtils = {
  createMockUser: (overrides = {}) => ({
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: false,
    getIdToken: jest.fn(() => Promise.resolve('test-token')),
    getIdTokenResult: jest.fn(() => Promise.resolve({ token: 'test-token' })),
    ...overrides,
  }),
  
  createMockFamily: (overrides = {}) => ({
    id: 'test-family-123',
    name: 'Test Family',
    inviteCode: 'ABC123',
    createdBy: 'test-user-123',
    memberIds: ['test-user-123'],
    parentIds: ['test-user-123'],
    childIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    maxMembers: 10,
    isPremium: false,
    ...overrides,
  }),
  
  createMockTask: (overrides = {}) => ({
    id: 'test-task-123',
    familyId: 'test-family-123',
    title: 'Test Task',
    assignedTo: 'test-user-123',
    assignedBy: 'test-user-123',
    createdBy: 'test-user-123',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Mock celebrations service
jest.mock('../../services/celebrations', () => ({
  checkAchievementsOnTaskComplete: jest.fn(() => Promise.resolve([])),
  createCelebration: jest.fn(() => Promise.resolve('celebration-id')),
  getUserAchievements: jest.fn(() => Promise.resolve([])),
  getFamilyAchievements: jest.fn(() => Promise.resolve([])),
  getCelebrations: jest.fn(() => Promise.resolve([])),
  markCelebrationSeen: jest.fn(() => Promise.resolve()),
  getAchievementProgress: jest.fn(() => Promise.resolve({ progress: 0, maxProgress: 0 })),
}));

// Mock config/firebase (fallback path used by some tests)
jest.mock('../../config/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  storage: {},
  auth: {
    currentUser: null,
  },
}));

// Also mock services/firebase used by app code
jest.mock('../../services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));

// Increase default timeout for integration tests
if (process.env.TEST_TYPE === 'integration') {
  jest.setTimeout(30000);
}

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

export {};