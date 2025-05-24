// ESLint configuration for TPL Search Extension
module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    webextensions: true,
    node: true
  },
  
  extends: [
    'eslint:recommended'
  ],
  
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  
  globals: {
    chrome: 'readonly',
    browser: 'readonly', // For WebExtensions API compatibility
    global: 'writable'
  },
  
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'comma-trailing': ['error', 'never'],
    'brace-style': ['error', '1tbs'],
    
    // Extension-specific rules
    'no-undef': 'error',
    'no-unused-expressions': 'error',
    'no-throw-literal': 'error',
    
    // Promise handling
    'no-async-promise-executor': 'error',
    'no-promise-executor-return': 'error',
    'prefer-promise-reject-errors': 'error'
  },
  
  overrides: [
    {
      // Test files have more relaxed rules
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '.eslintrc.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    'build/',
    '*.min.js'
  ]
};