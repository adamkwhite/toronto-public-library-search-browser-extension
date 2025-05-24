// Jest configuration for TPL Search Extension
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    '*.js',
    '!tests/**/*.js',
    '!coverage/**/*.js',
    '!jest.config.js',
    '!node_modules/**/*.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json'
  ],
  
  // Transform configuration (if needed for future ES6 modules)
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module name mapping (for absolute imports if needed)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Globals
  globals: {
    'chrome': true
  },
  
  // Test results processor (for CI/CD integration)
  // testResultsProcessor: 'jest-sonar-reporter',
  
  // Additional Jest options for extension testing
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  
  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ]
};