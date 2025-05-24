/**
 * Coverage tests for content.js - imports actual source file
 */

// Mock Chrome APIs and DOM
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

global.document = {
  addEventListener: jest.fn(),
  getSelection: jest.fn(() => ({
    toString: jest.fn(() => 'test selection')
  }))
};

global.window = {
  getSelection: jest.fn(() => ({
    toString: jest.fn(() => 'test selection')
  }))
};

// Import the actual content script
require('../../content.js');

describe('Content Script Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Selection handling', () => {
    test('should register selection change listener', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('selectionchange', expect.any(Function));
    });

    test('should register message listener', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe('Exported functions', () => {
    test('should have validateSearchText function', () => {
      expect(typeof global.validateSearchText).toBe('function');
    });

    test('validateSearchText should process input', () => {
      const result = global.validateSearchText('test input');
      expect(result).toBeTruthy();
    });

    test('validateSearchText should handle empty input', () => {
      const result = global.validateSearchText('');
      expect(result).toBe(false);
    });
  });
});