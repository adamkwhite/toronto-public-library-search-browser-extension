/**
 * Coverage tests for popup.js - imports actual source file
 */

// Mock Chrome APIs and DOM
global.chrome = {
  tabs: {
    query: jest.fn(),
    create: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock DOM elements
const mockElement = {
  addEventListener: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  value: '',
  textContent: '',
  style: {},
  disabled: false
};

global.document = {
  getElementById: jest.fn(() => mockElement),
  addEventListener: jest.fn()
};

global.window = {
  close: jest.fn()
};

// Import the actual popup script
require('../../popup.js');

describe('Popup Script Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElement.value = '';
    mockElement.textContent = '';
    mockElement.disabled = false;
  });

  describe('DOM initialization', () => {
    test('should query DOM elements', () => {
      expect(document.getElementById).toHaveBeenCalledWith('searchInput');
      expect(document.getElementById).toHaveBeenCalledWith('searchButton');
      expect(document.getElementById).toHaveBeenCalledWith('selectedTextButton');
    });

    test('should register event listeners', () => {
      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Exported functions', () => {
    test('should have processSearchText function', () => {
      expect(typeof global.processSearchText).toBe('function');
    });

    test('processSearchText should handle input', () => {
      const result = global.processSearchText('test search');
      expect(result).toBe('test search');
    });

    test('should have truncateText function', () => {
      expect(typeof global.truncateText).toBe('function');
    });

    test('truncateText should limit length', () => {
      const longText = 'a'.repeat(150);
      const result = global.truncateText(longText, 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });
});