module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/__tests__/setup/env.ts', '<rootDir>/src/__tests__/setup/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/integration.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\.pnpm/.*?/node_modules/)?(@react-native|react-native|react-native-.*|@react-navigation/.*|expo(nent)?|@expo(nent)?/.*|expo-modules-core|expo-font|@expo/vector-icons|@unimodules/.*|sentry-expo|nativewind|react-native-svg|react-native-gesture-handler|@react-native-picker/.*|@react-native-google-signin/google-signin|@react-native/js-polyfills|react-redux|firebase|@firebase)/)',
  ],
  testMatch: ['**/__tests__/integration/**/*.test.ts', '**/__tests__/integration/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '^@react-native-google-signin/google-signin$': '<rootDir>/src/__mocks__/google-signin.ts',
    '^@expo/vector-icons$': '<rootDir>/src/__mocks__/@expo-vector-icons.ts',
    '^@react-native-firebase/firestore$': '<rootDir>/src/__mocks__/@react-native-firebase-firestore.ts',
    '^expo-notifications$': '<rootDir>/src/__mocks__/expo-notifications.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/async-storage.ts',
    '@react-native-community/netinfo': '<rootDir>/src/__mocks__/netinfo.ts',
    '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.ts',
    '^expo-device$': '<rootDir>/src/mocks/expo-device.ts',
    '^expo-constants$': '<rootDir>/src/mocks/expo-constants.ts',
    '^firebase/analytics$': '<rootDir>/src/mocks/firebase-analytics.ts',
    '^@sentry/react-native$': '<rootDir>/src/mocks/sentry-react-native.ts',
  },
  globals: {
    'process.env.FIREBASE_AUTH_EMULATOR_HOST': 'localhost:9099',
    'process.env.FIRESTORE_EMULATOR_HOST': 'localhost:8080',
    'process.env.FIREBASE_STORAGE_EMULATOR_HOST': 'localhost:9199',
  },
};