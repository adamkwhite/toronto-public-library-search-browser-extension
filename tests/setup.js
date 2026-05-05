// Test setup file
// Configures global mocks and test environment

const chrome = require("sinon-chrome");

// Mock Chrome APIs globally
global.chrome = chrome;

// In a jsdom environment, `global.window` and `global.document` cannot
// be replaced wholesale — assignments to `global.window = {...}` are
// silently ignored by the jsdom proxy, so any test that calls
// `window.close()` would fire jsdom's real close and detach
// `document` for every subsequent test. We instead patch individual
// methods directly on the existing jsdom window/document.
function installWindowMocks() {
  window.close = jest.fn();
  window.getSelection = jest.fn();
}

global.getSelection = jest.fn();
installWindowMocks();

// Reset all mocks before each test
beforeEach(() => {
  chrome.flush();
  jest.clearAllMocks();
  installWindowMocks();
});

// Helper function to create mock selection
global.createMockSelection = (text) => {
  return {
    toString: () => text,
    rangeCount: text ? 1 : 0,
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
