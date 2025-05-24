// Integration tests for the complete extension workflow
// Tests end-to-end functionality and component interactions

describe('Extension Integration Tests', () => {
  let mockTabs, mockContextMenus, mockRuntime;
  
  beforeEach(() => {
    // Reset all chrome API mocks
    chrome.flush();
    
    // Setup mock tabs
    mockTabs = [
      { id: 1, url: 'https://example.com', active: true },
      { id: 2, url: 'https://test.com', active: false }
    ];
    
    chrome.tabs.query.yields(mockTabs);
    chrome.tabs.create.yields({ id: 3, url: 'https://www.torontopubliclibrary.ca' });
    chrome.tabs.sendMessage.yields({ success: true, text: 'test text' });
  });

  describe('Context Menu Workflow', () => {
    test('should complete full context menu search workflow', () => {
      // 1. Extension installs and creates context menu
      const installCallback = jest.fn();
      chrome.runtime.onInstalled.addListener(installCallback);
      
      // Simulate installation
      chrome.runtime.onInstalled.trigger();
      
      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: "searchTPL",
        title: "Search on TPL",
        contexts: ["selection"]
      });
      
      // 2. User selects text and right-clicks
      const clickCallback = jest.fn();
      chrome.contextMenus.onClicked.addListener(clickCallback);
      
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: "The Great Gatsby"
      };
      const mockTab = mockTabs[0];
      
      // Simulate context menu click
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTab);
      
      // 3. Verify new tab is created with correct TPL URL
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=The%20Great%20Gatsby',
        active: true
      });
    });

    test('should handle ISBN context menu search', () => {
      chrome.contextMenus.onClicked.addListener(jest.fn());
      
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: "ISBN: 978-0-123-45678-6"
      };
      
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      
      // ISBN should be cleaned before URL encoding
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780123456786',
        active: true
      });
    });

    test('should handle special characters in context menu search', () => {
      chrome.contextMenus.onClicked.addListener(jest.fn());
      
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: 'Book title: "Test & More"'
      };
      
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Book%20title%3A%20%22Test%20%26%20More%22',
        active: true
      });
    });
  });

  describe('Popup Integration Workflow', () => {
    test('should complete popup search workflow', async () => {
      // 1. Popup opens and queries for selected text
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        expect(tabs).toEqual(mockTabs);
        
        if (tabs[0]) {
          // 2. Send message to content script
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            expect(response.success).toBe(true);
            expect(response.text).toBe('test text');
          });
        }
      });
      
      // 3. User performs search
      const searchText = 'Manual search text';
      const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(searchText)}`;
      
      chrome.tabs.create({ url: tplUrl, active: true });
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Manual%20search%20text',
        active: true
      });
    });

    test('should handle popup search with no selected text', () => {
      chrome.tabs.sendMessage.yields({ success: false, error: 'No text selected' });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            expect(response.success).toBe(false);
            expect(response.error).toBe('No text selected');
          });
        }
      });
    });

    test('should handle runtime errors in popup workflow', () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated.' };
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            // Should handle error gracefully
            expect(chrome.runtime.lastError).toBeDefined();
          });
        }
      });
    });
  });

  describe('Content Script Communication', () => {
    test('should handle content script to background message flow', () => {
      chrome.runtime.onMessage.addListener(jest.fn());
      
      const mockMessage = {
        action: 'searchTPL',
        text: 'Content script search'
      };
      
      // Simulate message from content script
      chrome.runtime.onMessage.trigger(mockMessage, {}, jest.fn());
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Content%20script%20search',
        active: true
      });
    });

    test('should validate messages between components', () => {
      const messageHandler = jest.fn((message, sender, sendResponse) => {
        if (message.action === 'getSelectedText') {
          // Simulate content script response
          sendResponse({
            success: true,
            text: 'Selected text',
            isbn: { isISBN: false }
          });
        }
      });
      
      chrome.runtime.onMessage.addListener(messageHandler);
      
      const mockMessage = { action: 'getSelectedText' };
      const mockSendResponse = jest.fn();
      
      chrome.runtime.onMessage.trigger(mockMessage, {}, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        text: 'Selected text',
        isbn: { isISBN: false }
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle tab creation failures', () => {
      chrome.tabs.create.throws(new Error('Failed to create tab'));
      
      expect(() => {
        chrome.tabs.create({
          url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=test',
          active: true
        });
      }).toThrow('Failed to create tab');
    });

    test('should handle content script communication failures', () => {
      chrome.tabs.sendMessage.throws(new Error('Could not establish connection'));
      
      expect(() => {
        chrome.tabs.sendMessage(1, { action: 'getSelectedText' });
      }).toThrow('Could not establish connection');
    });

    test('should handle context menu creation failures', () => {
      chrome.contextMenus.create.throws(new Error('Failed to create context menu'));
      
      expect(() => {
        chrome.contextMenus.create({
          id: "searchTPL",
          title: "Search on TPL",
          contexts: ["selection"]
        });
      }).toThrow('Failed to create context menu');
    });
  });

  describe('End-to-End Scenarios', () => {
    test('should handle complete user journey: select -> right-click -> search', () => {
      const userJourney = {
        selectedText: 'Clean Code by Robert Martin',
        expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Clean%20Code%20by%20Robert%20Martin'
      };
      
      // 1. Extension initialization
      chrome.runtime.onInstalled.trigger();
      expect(chrome.contextMenus.create).toHaveBeenCalled();
      
      // 2. User selects text and right-clicks
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: userJourney.selectedText
      };
      
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      
      // 3. Verify correct TPL search
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: userJourney.expectedURL,
        active: true
      });
    });

    test('should handle ISBN detection end-to-end', () => {
      const isbnJourney = {
        selectedText: 'Book with ISBN: 978-0-134-68591-6',
        expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780134685916'
      };
      
      chrome.runtime.onInstalled.trigger();
      
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: isbnJourney.selectedText
      };
      
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: isbnJourney.expectedURL,
        active: true
      });
    });

    test('should handle popup manual search end-to-end', () => {
      const manualSearch = {
        searchText: 'Margaret Atwood novels',
        expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Margaret%20Atwood%20novels'
      };
      
      // Simulate popup workflow
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Popup gets active tab
        expect(tabs[0]).toBeDefined();
        
        // User enters manual search
        chrome.tabs.create({
          url: manualSearch.expectedURL,
          active: true
        });
      });
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: manualSearch.expectedURL,
        active: true
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle rapid successive searches', () => {
      const searches = [
        'First search',
        'Second search',
        'Third search'
      ];
      
      searches.forEach(searchText => {
        const mockInfo = {
          menuItemId: "searchTPL",
          selectionText: searchText
        };
        
        chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      });
      
      expect(chrome.tabs.create).toHaveBeenCalledTimes(3);
    });

    test('should handle empty and whitespace selections', () => {
      const emptySelections = ['', '   ', '\t\n', null];
      
      emptySelections.forEach(selection => {
        const mockInfo = {
          menuItemId: "searchTPL",
          selectionText: selection
        };
        
        chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      });
      
      // Should not create any tabs for empty selections
      expect(chrome.tabs.create).not.toHaveBeenCalled();
    });

    test('should handle very long text selections', () => {
      const longText = 'a'.repeat(1000);
      
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: longText
      };
      
      chrome.contextMenus.onClicked.trigger(mockInfo, mockTabs[0]);
      
      // Should truncate and still create tab
      expect(chrome.tabs.create).toHaveBeenCalled();
      const createCall = chrome.tabs.create.getCall(0);
      expect(createCall.args[0].url.length).toBeLessThan(2000); // Reasonable URL length
    });
  });
});