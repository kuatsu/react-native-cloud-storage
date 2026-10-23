export default {
  preset: 'react-native-harness',
  maxWorkers: 1,
  testMatch: ['<rootDir>/__tests__/**/*.harness.ts'],
  setupFiles: ['<rootDir>/harness.setup.ts'],
};
