# TPL Search Extension - Test Suite

Comprehensive testing framework for the Toronto Public Library Search browser extension.

## Overview

This test suite provides thorough coverage of all extension functionality including:

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: End-to-end workflow testing  
- **Mocks**: Chrome extension APIs and browser environment
- **Fixtures**: Test data and realistic scenarios

## Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── background.test.js  # Background script functionality
│   ├── content.test.js     # Content script functionality
│   ├── popup.test.js       # Popup interface functionality
│   └── isbn.test.js        # ISBN detection and validation
├── integration/            # End-to-end integration tests
│   └── extension.test.js   # Complete workflow testing
├── fixtures/               # Test data and scenarios
│   └── test-data.js        # Realistic test cases and edge cases
├── mocks/                  # Mock implementations
│   └── chrome-api.js       # Chrome extension API mocks
├── setup.js               # Global test configuration
└── README.md              # This file
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting
```bash
# Check code style
npm run lint

# Fix linting issues
npm run lint:fix
```

## Test Categories

### Unit Tests

#### Background Script Tests (`background.test.js`)
- Context menu creation and handling
- Text processing and validation
- ISBN detection and cleaning
- URL generation and encoding
- Chrome API interaction

#### Content Script Tests (`content.test.js`)
- Text selection handling
- Message passing with background script
- Input validation and sanitization
- ISBN detection in content context

#### Popup Tests (`popup.test.js`)
- User interface interactions
- Manual search functionality
- Selected text detection
- Error handling and user feedback
- URL encoding for special characters

#### ISBN Tests (`isbn.test.js`)
- Comprehensive ISBN-10 validation
- Comprehensive ISBN-13 validation
- Edge cases and malformed inputs
- Real-world ISBN examples
- Embedded ISBN detection in text

### Integration Tests

#### Extension Workflow Tests (`extension.test.js`)
- Complete user journeys (select → right-click → search)
- Context menu to TPL search flow
- Popup to search flow
- Error handling across components
- Performance and edge case scenarios

## Test Data

### Test Fixtures (`fixtures/test-data.js`)
- **Valid ISBNs**: Real and synthetic ISBN-10/13 examples
- **Invalid ISBNs**: Edge cases and malformed inputs
- **Search Terms**: Book titles, authors, special characters
- **Real-world Examples**: Actual book ISBNs and titles
- **Edge Cases**: Empty inputs, very long text, malicious content
- **URL Encoding**: Special character handling test cases

### Example Test Data
```javascript
// Valid ISBN examples
validISBNs: {
  isbn10: [
    { input: '0123456789', cleaned: '0123456789' },
    { input: '0-123-45678-9', cleaned: '0123456789' }
  ],
  isbn13: [
    { input: '9780123456786', cleaned: '9780123456786' },
    { input: '978-0-123-45678-6', cleaned: '9780123456786' }
  ]
}

// Real book examples
realWorldISBNs: [
  { isbn: '978-0-13-235088-4', title: 'Clean Code' },
  { isbn: '0-201-61586-X', title: 'The Pragmatic Programmer' }
]
```

## Chrome API Mocking

### Mock Implementation (`mocks/chrome-api.js`)
The test suite includes comprehensive mocks for Chrome extension APIs:

- **chrome.contextMenus**: Menu creation, updates, click simulation
- **chrome.tabs**: Tab creation, querying, messaging
- **chrome.runtime**: Message passing, extension lifecycle
- **chrome.storage**: Local and sync storage simulation

### Usage Example
```javascript
// Simulate context menu click
chromeTestUtils.simulateContextMenuClick('Selected text');

// Create mock tab
const tab = chromeTestUtils.getMockChrome().tabs.create({
  url: 'https://example.com',
  active: true
});

// Simulate message response
chrome.tabs.sendMessage.yields({
  success: true,
  text: 'Mock response'
});
```

## Coverage Goals

The test suite aims for comprehensive coverage:

- **Lines**: 80%+ coverage
- **Functions**: 80%+ coverage  
- **Branches**: 80%+ coverage
- **Statements**: 80%+ coverage

### Coverage Reports
```bash
# Generate detailed coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Test Scenarios

### Context Menu Scenarios
1. **Basic book title search**: "The Great Gatsby" → TPL search
2. **Author search**: "Margaret Atwood" → TPL search
3. **ISBN search**: "978-0-123-45678-6" → Cleaned ISBN search
4. **Special characters**: Handle quotes, ampersands, unicode
5. **Empty selections**: Graceful handling of no-text scenarios

### Popup Scenarios
1. **Manual search**: User types search term
2. **Selected text search**: Use highlighted text from page
3. **Error handling**: Invalid input, network errors
4. **ISBN detection**: Automatic ISBN formatting

### Error Scenarios
1. **Network failures**: Tab creation errors
2. **Invalid selections**: Empty, whitespace-only text
3. **Extension errors**: Runtime context issues
4. **Malicious input**: XSS attempts, injection attacks

## Continuous Integration

The test suite is designed for CI/CD integration:

- **Jest configuration**: Optimized for automated testing
- **Coverage reporting**: JSON and LCOV formats
- **Exit codes**: Proper failure reporting
- **Timeouts**: Reasonable test execution limits

### CI Commands
```bash
# Run tests with coverage in CI
npm run test:coverage

# Lint check in CI
npm run lint

# Combined CI check
npm run test:coverage && npm run lint
```

## Writing New Tests

### Test Structure
```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup test environment
  });

  describe('Feature Group', () => {
    test('should handle specific scenario', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices
1. **Descriptive test names**: Clearly state what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolated tests**: Each test should be independent
4. **Edge cases**: Test boundary conditions and error cases
5. **Mock external dependencies**: Use Chrome API mocks
6. **Realistic data**: Use test fixtures for realistic scenarios

## Debugging Tests

### Common Issues
1. **Chrome API not mocked**: Ensure `tests/setup.js` is loaded
2. **Async handling**: Use proper async/await or done callbacks
3. **Mock state**: Reset mocks between tests with `beforeEach`
4. **Timeout issues**: Increase timeout for integration tests

### Debug Commands
```bash
# Run specific test file
npm test -- background.test.js

# Run tests in debug mode
npm test -- --detectOpenHandles --forceExit

# Run single test
npm test -- --testNamePattern="should handle ISBN"
```

## Contributing

When adding new functionality:

1. **Write tests first**: TDD approach recommended
2. **Update fixtures**: Add new test data as needed
3. **Maintain coverage**: Ensure new code is tested
4. **Update documentation**: Keep this README current
5. **Run full suite**: Verify all tests pass before committing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [sinon-chrome Documentation](https://github.com/acvetkov/sinon-chrome)
- [jsdom Documentation](https://github.com/jsdom/jsdom)