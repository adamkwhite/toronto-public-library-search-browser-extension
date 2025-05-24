// Enhanced Chrome API mocks for testing
// Provides more realistic Chrome extension API behavior

class MockChromeAPI {
  constructor() {
    this.reset();
  }

  reset() {
    this.contextMenus = new MockContextMenus();
    this.tabs = new MockTabs();
    this.runtime = new MockRuntime();
    this.storage = new MockStorage();
  }
}

class MockContextMenus {
  constructor() {
    this.menus = new Map();
    this.onClicked = new MockEventHandler();
  }

  create(createProperties, callback) {
    if (!createProperties.id || !createProperties.title) {
      throw new Error('Missing required properties for context menu');
    }
    
    this.menus.set(createProperties.id, {
      ...createProperties,
      enabled: true
    });
    
    if (callback) {
      callback();
    }
    
    return createProperties.id;
  }

  update(menuItemId, updateProperties, callback) {
    if (!this.menus.has(menuItemId)) {
      throw new Error(`Context menu item ${menuItemId} not found`);
    }
    
    const existing = this.menus.get(menuItemId);
    this.menus.set(menuItemId, { ...existing, ...updateProperties });
    
    if (callback) {
      callback();
    }
  }

  remove(menuItemId, callback) {
    this.menus.delete(menuItemId);
    if (callback) {
      callback();
    }
  }

  removeAll(callback) {
    this.menus.clear();
    if (callback) {
      callback();
    }
  }

  // Test helper methods
  getMenu(menuItemId) {
    return this.menus.get(menuItemId);
  }

  getAllMenus() {
    return Array.from(this.menus.values());
  }

  simulateClick(menuItemId, info, tab) {
    if (!this.menus.has(menuItemId)) {
      return false;
    }
    
    const clickInfo = {
      menuItemId,
      ...info
    };
    
    this.onClicked.trigger(clickInfo, tab);
    return true;
  }
}

class MockTabs {
  constructor() {
    this.tabs = new Map();
    this.nextId = 1;
    this.onCreated = new MockEventHandler();
    this.onUpdated = new MockEventHandler();
    this.onRemoved = new MockEventHandler();
    
    // Create a default active tab
    this.create({ url: 'https://example.com', active: true });
  }

  create(createProperties, callback) {
    const tab = {
      id: this.nextId++,
      url: createProperties.url || 'about:blank',
      active: createProperties.active !== false,
      title: createProperties.title || 'New Tab',
      windowId: createProperties.windowId || 1,
      index: this.tabs.size,
      pinned: false,
      highlighted: createProperties.active !== false,
      incognito: false,
      selected: createProperties.active !== false,
      status: 'loading'
    };
    
    this.tabs.set(tab.id, tab);
    this.onCreated.trigger(tab);
    
    // Simulate tab loading completion
    setTimeout(() => {
      tab.status = 'complete';
      this.onUpdated.trigger(tab.id, { status: 'complete' }, tab);
    }, 10);
    
    if (callback) {
      callback(tab);
    }
    
    return tab;
  }

  query(queryInfo, callback) {
    let results = Array.from(this.tabs.values());
    
    if (queryInfo.active !== undefined) {
      results = results.filter(tab => tab.active === queryInfo.active);
    }
    
    if (queryInfo.currentWindow !== undefined) {
      results = results.filter(tab => tab.windowId === 1); // Assume window 1 is current
    }
    
    if (queryInfo.url !== undefined) {
      results = results.filter(tab => tab.url.includes(queryInfo.url));
    }
    
    if (callback) {
      callback(results);
    }
    
    return results;
  }

  get(tabId, callback) {
    const tab = this.tabs.get(tabId);
    if (callback) {
      callback(tab);
    }
    return tab;
  }

  update(tabId, updateProperties, callback) {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }
    
    const updatedTab = { ...tab, ...updateProperties };
    this.tabs.set(tabId, updatedTab);
    this.onUpdated.trigger(tabId, updateProperties, updatedTab);
    
    if (callback) {
      callback(updatedTab);
    }
    
    return updatedTab;
  }

  remove(tabIds, callback) {
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    
    ids.forEach(id => {
      if (this.tabs.has(id)) {
        this.tabs.delete(id);
        this.onRemoved.trigger(id, { windowId: 1, isWindowClosing: false });
      }
    });
    
    if (callback) {
      callback();
    }
  }

  sendMessage(tabId, message, options, callback) {
    // Handle both 3 and 4 parameter versions
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    const tab = this.tabs.get(tabId);
    if (!tab) {
      if (callback) {
        callback(undefined);
      }
      return;
    }
    
    // Simulate message sending with various responses based on message type
    setTimeout(() => {
      let response;
      
      switch (message.action) {
        case 'getSelectedText':
          response = {
            success: true,
            text: 'Mock selected text',
            isbn: { isISBN: false }
          };
          break;
        case 'searchText':
          response = { success: true };
          break;
        default:
          response = { success: false, error: 'Unknown action' };
      }
      
      if (callback) {
        callback(response);
      }
    }, 5);
  }

  // Test helper methods
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  getActiveTab() {
    return Array.from(this.tabs.values()).find(tab => tab.active);
  }

  setTabResponse(tabId, action, response) {
    // Allow tests to set custom responses for specific tabs/actions
    if (!this.customResponses) {
      this.customResponses = new Map();
    }
    this.customResponses.set(`${tabId}-${action}`, response);
  }
}

class MockRuntime {
  constructor() {
    this.onInstalled = new MockEventHandler();
    this.onMessage = new MockEventHandler();
    this.onConnect = new MockEventHandler();
    this.lastError = null;
    this.id = 'mock-extension-id';
  }

  sendMessage(message, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Simulate async message handling
    setTimeout(() => {
      this.onMessage.trigger(message, { id: this.id }, callback || (() => {}));
    }, 5);
  }

  getManifest() {
    return {
      manifest_version: 3,
      name: 'TPL Search Test',
      version: '1.0.0'
    };
  }

  getURL(path) {
    return `chrome-extension://${this.id}/${path}`;
  }

  // Test helper methods
  setLastError(error) {
    this.lastError = error ? { message: error } : null;
  }

  clearLastError() {
    this.lastError = null;
  }
}

class MockStorage {
  constructor() {
    this.local = new MockStorageArea();
    this.sync = new MockStorageArea();
    this.managed = new MockStorageArea();
    this.session = new MockStorageArea();
  }
}

class MockStorageArea {
  constructor() {
    this.data = new Map();
    this.onChanged = new MockEventHandler();
  }

  get(keys, callback) {
    const result = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      if (this.data.has(key)) {
        result[key] = this.data.get(key);
      }
    });
    
    if (callback) {
      callback(result);
    }
    return result;
  }

  set(items, callback) {
    const changes = {};
    
    Object.keys(items).forEach(key => {
      const oldValue = this.data.get(key);
      this.data.set(key, items[key]);
      changes[key] = { oldValue, newValue: items[key] };
    });
    
    this.onChanged.trigger(changes, 'local');
    
    if (callback) {
      callback();
    }
  }

  remove(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const changes = {};
    
    keyArray.forEach(key => {
      if (this.data.has(key)) {
        changes[key] = { oldValue: this.data.get(key) };
        this.data.delete(key);
      }
    });
    
    this.onChanged.trigger(changes, 'local');
    
    if (callback) {
      callback();
    }
  }

  clear(callback) {
    const changes = {};
    this.data.forEach((value, key) => {
      changes[key] = { oldValue: value };
    });
    
    this.data.clear();
    this.onChanged.trigger(changes, 'local');
    
    if (callback) {
      callback();
    }
  }
}

class MockEventHandler {
  constructor() {
    this.listeners = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  hasListener(callback) {
    return this.listeners.includes(callback);
  }

  hasListeners() {
    return this.listeners.length > 0;
  }

  trigger(...args) {
    this.listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in mock event listener:', error);
      }
    });
  }

  // Test helper methods
  getListenerCount() {
    return this.listeners.length;
  }

  clearListeners() {
    this.listeners = [];
  }
}

// Export the mock Chrome API
const mockChrome = new MockChromeAPI();

// Additional test utilities
export const chromeTestUtils = {
  // Reset all Chrome API mocks
  reset() {
    mockChrome.reset();
  },

  // Simulate extension installation
  simulateInstallation() {
    mockChrome.runtime.onInstalled.trigger({ reason: 'install' });
  },

  // Simulate tab creation with TPL search
  simulateTPLSearch(searchTerm) {
    const encodedTerm = encodeURIComponent(searchTerm);
    const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodedTerm}`;
    return mockChrome.tabs.create({ url, active: true });
  },

  // Simulate context menu click
  simulateContextMenuClick(selectionText, menuItemId = 'searchTPL') {
    const info = { selectionText };
    const tab = mockChrome.tabs.getActiveTab();
    return mockChrome.contextMenus.simulateClick(menuItemId, info, tab);
  },

  // Get mock Chrome API instance
  getMockChrome() {
    return mockChrome;
  }
};

export default mockChrome;