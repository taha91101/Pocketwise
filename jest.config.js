module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    '^expo-crypto$': '<rootDir>/src/__tests__/__mocks__/expo-crypto.js',
    '^expo-secure-store$': '<rootDir>/src/__tests__/__mocks__/expo-secure-store.js',
    '^expo-local-authentication$': '<rootDir>/src/__tests__/__mocks__/expo-local-authentication.js',
    '^expo-image-picker$': '<rootDir>/src/__tests__/__mocks__/expo-image-picker.js',
    '^expo-file-system(/legacy)?$': '<rootDir>/src/__tests__/__mocks__/expo-file-system.js',
    '^expo-notifications$': '<rootDir>/src/__tests__/__mocks__/expo-notifications.js',
    '^expo-sqlite$': '<rootDir>/src/__tests__/__mocks__/expo-sqlite.js',
    '^expo-sharing$': '<rootDir>/src/__tests__/__mocks__/expo-sharing.js',
  },
};
