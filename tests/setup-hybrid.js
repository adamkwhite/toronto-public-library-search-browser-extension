// Hybrid test setup - improved Chrome API mocking
const chrome = require("sinon-chrome");

// Enhanced Chrome API setup
global.chrome = chrome;

// In a jsdom environment, `global.window` and `global.document` are
// non-replaceable proxies into the jsdom Window — assigning a plain
// object to `global.window` is silently ignored, so `window.close`
// stays as jsdom's real close. When tests call `window.close()` on the
// jsdom window, jsdom detaches the document, and every subsequent
// test's `document.X = ...` blows up with "undefined". We instead
// patch individual methods on the existing jsdom window/document.
function installWindowMocks() {
  window.close = jest.fn();
  window.getSelection = jest.fn(() => ({
    toString: jest.fn(() => ""),
    rangeCount: 0,
  }));
}

installWindowMocks();

// Helper to setup sinon-chrome for specific tests
global.setupChromeApiMocks = () => {
  // Reset all chrome API mocks
  chrome.flush();

  // Setup default behaviors
  // Manifest V3 APIs return Promises; chrome.tabs.create and
  // chrome.contextMenus.create are called without a callback, so use
  // .resolves() instead of .callsArg*() (which throws when no callback
  // arg is present).
  chrome.tabs.create.resolves({ id: 1, url: "test" });
  chrome.tabs.query.callsArgWith(1, [{ id: 1, active: true }]);
  chrome.tabs.sendMessage.callsArgWith(2, { success: true });
  chrome.contextMenus.create.resolves();
  chrome.runtime.sendMessage.callsArg(1);

  return chrome;
};

// Helper to create realistic Chrome event triggers
global.triggerChromeEvent = (eventName, ...args) => {
  const event = chrome[eventName.split(".")[0]][eventName.split(".")[1]];
  if (event && event.trigger) {
    event.trigger(...args);
  }
};

// Mock selection helper
global.createMockSelection = (text) => {
  return {
    toString: () => text,
    rangeCount: text ? 1 : 0,
  };
};

// Setup that runs before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  chrome.flush();

  // Re-patch window methods so each test starts with a fresh mock
  // (and so `window.close` never falls back to jsdom's real impl)
  installWindowMocks();
});

// Cleanup after each test
afterEach(() => {
  chrome.flush();
});
