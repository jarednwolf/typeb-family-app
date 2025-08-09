module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  // Don't use the setup file with mocks for integration tests
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@expo|expo|@unimodules|react-native-svg|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-heroicons|firebase|@firebase)/)',
  ],
  // Only run integration tests
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
  ],
  testTimeout: 30000, // Increase timeout for integration tests
};