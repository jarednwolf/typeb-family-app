module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/.*?/node_modules/)?(@react-native|react-native|react-native-.*|@react-navigation/.*|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@unimodules/.*|sentry-expo|nativewind|react-native-svg|react-native-gesture-handler|@react-native-picker/.*|@react-native-google-signin/google-signin|@react-native/js-polyfills|react-redux)/)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/setup/testSetup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*\\.(test|spec))\\.(jsx?|tsx?)$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '@react-native-community/datetimepicker': '<rootDir>/src/__mocks__/@react-native-community/datetimepicker.tsx',
    '^.*common/Modal$': '<rootDir>/src/components/common/__mocks__/Modal.tsx',
    '^\\./Modal$': '<rootDir>/src/components/common/__mocks__/Modal.tsx',
    '^\\.\./Modal$': '<rootDir>/src/components/common/__mocks__/Modal.tsx',
    '^.*contexts/ThemeContext$': '<rootDir>/src/__mocks__/ThemeContext.tsx',
    '^.*common/Button$': '<rootDir>/src/components/common/__mocks__/Button.tsx',
    '^\\./Button$': '<rootDir>/src/components/common/__mocks__/Button.tsx',
    '^\\.\./Button$': '<rootDir>/src/components/common/__mocks__/Button.tsx',
    '^.*common/Card$': '<rootDir>/src/components/common/__mocks__/Card.tsx',
    '^\\./Card$': '<rootDir>/src/components/common/__mocks__/Card.tsx',
    '^\\.\./Card$': '<rootDir>/src/components/common/__mocks__/Card.tsx',
    '^.*components/forms/Input$': '<rootDir>/src/components/forms/__mocks__/Input.tsx',
    '^.*components/premium/PremiumGate$': '<rootDir>/src/components/premium/__mocks__/PremiumGate.tsx',
    '^.*store/slices/tasksSlice$': '<rootDir>/src/store/slices/__mocks__/tasksSlice.ts',
    '^.*store/slices/authSlice$': '<rootDir>/src/store/slices/__mocks__/authSlice.ts',
    '^.*store/slices/familySlice$': '<rootDir>/src/store/slices/__mocks__/familySlice.ts',
    '^.*store/slices/userSlice$': '<rootDir>/src/store/slices/__mocks__/userSlice.ts',
    // Explicit relative path mappings for unit tests importing via ../../
    '^\.\./\.\./store/slices/authSlice$': '<rootDir>/src/store/slices/__mocks__/authSlice.ts',
    '^\.\./\.\./store/slices/familySlice$': '<rootDir>/src/store/slices/__mocks__/familySlice.ts',
    '^\.\./\.\./store/slices/tasksSlice$': '<rootDir>/src/store/slices/__mocks__/tasksSlice.ts',
    // Use real TaskCard to satisfy tests expecting real behavior
    '^.*components/common/FilterTabs$': '<rootDir>/src/components/common/__mocks__/FilterTabs.tsx',
    '^\\./FilterTabs$': '<rootDir>/src/components/common/__mocks__/FilterTabs.tsx',
    '^\\.\./FilterTabs$': '<rootDir>/src/components/common/__mocks__/FilterTabs.tsx',
    '^.*services/realtimeSync$': '<rootDir>/src/services/realtimeSyncEnhanced.ts',
    '^.*services/offlineQueue$': '<rootDir>/src/services/__mocks__/offlineQueue.ts',
    '^.*services/reactions$': '<rootDir>/src/services/__mocks__/reactions.ts',
    '^.*components/premium/CustomCategories$': '<rootDir>/src/components/premium/__mocks__/CustomCategories.tsx',
    '^.*screens/analytics/AnalyticsDashboard$': '<rootDir>/src/screens/analytics/__mocks__/AnalyticsDashboard.tsx',
    '^.*config/firebase$': '<rootDir>/src/services/firebase',
    '^yup$': '<rootDir>/src/__mocks__/yup.ts',
    '^.*components/tasks/PhotoCapture$': '<rootDir>/src/components/tasks/__mocks__/PhotoCapture.tsx',
    '^.*services/ValidationFeedbackService$': '<rootDir>/src/services/__mocks__/ValidationFeedbackService.ts',
    '^.*services/TaskConsistencyAnalyzer$': '<rootDir>/src/services/TaskConsistencyAnalyzer.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/src/__tests__/setup/',
  ],
};