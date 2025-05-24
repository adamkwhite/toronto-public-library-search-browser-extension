// Hybrid test setup - improved Chrome API mocking
const chrome = require('sinon-chrome');

// Enhanced Chrome API setup
global.chrome = chrome;

// Mock window and document for content script tests
global.window = {
  getSelection: jest.fn(() => ({
    toString: jest.fn(() => ''),
    rangeCount: 0
  })),
  close: jest.fn()
};

global.document = {
  addEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    textContent: '',
    innerHTML: '',
    style: {}
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
};

// Helper to setup sinon-chrome for specific tests
global.setupChromeApiMocks = () => {
  // Reset all chrome API mocks
  chrome.flush();
  
  // Setup default behaviors
  chrome.tabs.create.callsArgWith(1, { id: 1, url: 'test' });
  chrome.tabs.query.callsArgWith(1, [{ id: 1, active: true }]);
  chrome.tabs.sendMessage.callsArgWith(2, { success: true });
  chrome.contextMenus.create.callsArg(1);
  chrome.runtime.sendMessage.callsArg(1);
  
  return chrome;
};

// Helper to create realistic Chrome event triggers
global.triggerChromeEvent = (eventName, ...args) => {
  const event = chrome[eventName.split('.')[0]][eventName.split('.')[1]];
  if (event && event.trigger) {
    event.trigger(...args);
  }
};

// Mock selection helper
global.createMockSelection = (text) => {
  return {
    toString: () => text,
    rangeCount: text ? 1 : 0
  };
};

// Setup that runs before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  chrome.flush();
  
  // Reset window.getSelection
  global.window.getSelection.mockReturnValue(createMockSelection(''));
});

// Cleanup after each test
afterEach(() => {
  chrome.flush();
});