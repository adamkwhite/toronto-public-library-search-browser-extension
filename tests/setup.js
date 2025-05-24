// Test setup file
// Configures global mocks and test environment

const chrome = require('sinon-chrome');

// Mock Chrome APIs globally
global.chrome = chrome;

// Mock window.getSelection for content script tests
global.getSelection = jest.fn();

// Mock DOM methods
global.document = {
  addEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    textContent: '',
    innerHTML: ''
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
};

// Mock window object
global.window = {
  getSelection: jest.fn(),
  close: jest.fn()
};

// Reset all mocks before each test
beforeEach(() => {
  chrome.flush();
  jest.clearAllMocks();
});

// Helper function to create mock selection
global.createMockSelection = (text) => {
  return {
    toString: () => text,
    rangeCount: text ? 1 : 0
  };
};

// Helper function to create mock chrome tabs
global.createMockTabs = (tabs) => {
  chrome.tabs.query.yields(tabs);
  return tabs;
};

// Helper function to create mock chrome runtime message
global.createMockMessage = (action, data = {}) => {
  return { action, ...data };
};