const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/.jest-cache',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!app/opengraph-image.tsx',
    '!app/api/auth/[...nextauth]/route.ts',
    '!app/layout.tsx',
  ],
  coverageThreshold: { global: { lines: 80, statements: 80, functions: 80, branches: 80 } },
  coverageReporters: ['text', 'lcov', 'json-summary'],
});
