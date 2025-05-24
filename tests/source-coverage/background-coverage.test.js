/**
 * Coverage tests for background.js - imports actual source file
 */

// Mock Chrome APIs before importing
global.chrome = {
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn()
  }
};

// Mock console to avoid noise
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn()
};

// Import the actual background script
require('../../background.js');

describe('Background Script Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSearchText function', () => {
    test('should process normal text', () => {
      // Access the global function created by background.js
      const result = global.processSearchText('test search');
      expect(result).toBe('test search');
    });

    test('should clean ISBN numbers', () => {
      const result = global.processSearchText('978-0-13-235088-4');
      expect(result).toBe('9780132350884');
    });

    test('should handle empty text', () => {
      const result = global.processSearchText('   ');
      expect(result).toBe('');
    });

    test('should truncate long text', () => {
      const longText = 'a'.repeat(250);
      const result = global.processSearchText(longText);
      expect(result.length).toBe(200);
    });
  });

  describe('isISBN function', () => {
    test('should detect valid ISBN-10', () => {
      const result = global.isISBN('0123456789');
      expect(result).toBe(true);
    });

    test('should detect valid ISBN-13', () => {
      const result = global.isISBN('9780132350884');
      expect(result).toBe(true);
    });

    test('should reject invalid numbers', () => {
      const result = global.isISBN('12345');
      expect(result).toBe(false);
    });

    test('should handle X check digits', () => {
      const result = global.isISBN('012345678X');
      expect(result).toBe(true);
    });
  });

  describe('Chrome API Integration', () => {
    test('should register installation listener', () => {
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    });

    test('should register message listener', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });
});