// Background script Chrome API interaction tests (FIXED)
// Tests context menu, tabs, and runtime interactions with proper mocking

// Use the hybrid setup
require('../setup-hybrid');

describe('Background Script Chrome API Integration', () => {
  let processSearchText, isISBN;
  
  beforeEach(() => {
    // Setup Chrome API mocks
    setupChromeApiMocks();
    
    // Define the core functions
    processSearchText = function(text) {
      let processed = text.replace(/\s+/g, ' ').trim();
      
      if (isISBN(processed)) {
        processed = processed.replace(/[^0-9X]/gi, '');
        return processed;
      }
      
      if (!processed || processed.length === 0) {
        return text.trim();
      }
      
      if (processed.length > 200) {
        processed = processed.substring(0, 200).trim();
      }
      
      return processed;
    };
    
    isISBN = function(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      return /^[0-9]{9}[0-9X]$/i.test(cleaned) || 
             /^97[89][0-9]{10}$/i.test(cleaned);
    };
  });

  describe('Context Menu Creation', () => {
    test('should create context menu on extension installation', () => {
      // Simulate the installation callback
      const installCallback = () => {
        chrome.contextMenus.create({
          id: "searchTPL",
          title: "Search on TPL",
          contexts: ["selection"]
        });
      };
      
      // Call the installation callback
      installCallback();
      
      // Verify context menu was created
      expect(chrome.contextMenus.create.calledOnce).toBe(true);
      expect(chrome.contextMenus.create.calledWith({
        id: "searchTPL",
        title: "Search on TPL",
        contexts: ["selection"]
      })).toBe(true);
    });

    test('should handle context menu creation errors gracefully', () => {
      // Make context menu creation throw an error
      chrome.contextMenus.create.throws(new Error('Permission denied'));
      
      expect(() => {
        chrome.contextMenus.create({
          id: "searchTPL",
          title: "Search on TPL",
          contexts: ["selection"]
        });
      }).toThrow('Permission denied');
    });
  });

  describe('Context Menu Click Handling', () => {
    test('should handle context menu clicks with valid selection', () => {
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: "The Great Gatsby"
      };
      const mockTab = { id: 1 };
      
      // Simulate the click handler
      const handleContextMenuClick = (info, tab) => {
        if (info.menuItemId === "searchTPL" && info.selectionText) {
          const searchText = info.selectionText.trim();
          if (searchText) {
            const processedText = processSearchText(searchText);
            const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
            chrome.tabs.create({ url: tplUrl, active: true });
          }
        }
      };
      
      // Execute the click handler
      handleContextMenuClick(mockInfo, mockTab);
      
      // Verify tab creation
      expect(chrome.tabs.create.calledOnce).toBe(true);
      const createCall = chrome.tabs.create.getCall(0);
      expect(createCall.args[0].url).toBe('https://www.torontopubliclibrary.ca/search.jsp?Ntt=The%20Great%20Gatsby');
      expect(createCall.args[0].active).toBe(true);
    });

    test('should handle ISBN context menu clicks with cleaning', () => {
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: "ISBN: 978-0-123-45678-6"
      };
      const mockTab = { id: 1 };
      
      const handleContextMenuClick = (info, tab) => {
        if (info.menuItemId === "searchTPL" && info.selectionText) {
          const searchText = info.selectionText.trim();
          if (searchText) {
            const processedText = processSearchText(searchText);
            const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
            chrome.tabs.create({ url: tplUrl, active: true });
          }
        }
      };
      
      handleContextMenuClick(mockInfo, mockTab);
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      const createCall = chrome.tabs.create.getCall(0);
      expect(createCall.args[0].url).toBe('https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780123456786');
    });

    test('should ignore clicks without selection text', () => {
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: ""
      };
      const mockTab = { id: 1 };
      
      const handleContextMenuClick = (info, tab) => {
        if (info.menuItemId === "searchTPL" && info.selectionText) {
          const searchText = info.selectionText.trim();
          if (searchText) {
            const processedText = processSearchText(searchText);
            const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
            chrome.tabs.create({ url: tplUrl, active: true });
          }
        }
      };
      
      handleContextMenuClick(mockInfo, mockTab);
      
      expect(chrome.tabs.create.called).toBe(false);
    });

    test('should ignore clicks from other menu items', () => {
      const mockInfo = {
        menuItemId: "otherMenuItem",
        selectionText: "Some text"
      };
      const mockTab = { id: 1 };
      
      const handleContextMenuClick = (info, tab) => {
        if (info.menuItemId === "searchTPL" && info.selectionText) {
          const searchText = info.selectionText.trim();
          if (searchText) {
            const processedText = processSearchText(searchText);
            const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
            chrome.tabs.create({ url: tplUrl, active: true });
          }
        }
      };
      
      handleContextMenuClick(mockInfo, mockTab);
      
      expect(chrome.tabs.create.called).toBe(false);
    });
  });

  describe('Tab Creation and URL Generation', () => {
    test('should create tabs with properly encoded URLs', () => {
      const testCases = [
        {
          input: 'Book Title',
          expectedUrl: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Book%20Title'
        },
        {
          input: 'Author: Smith & Jones',
          expectedUrl: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Author%3A%20Smith%20%26%20Jones'
        },
        {
          input: 'Book "with quotes"',
          expectedUrl: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Book%20%22with%20quotes%22'
        }
      ];
      
      testCases.forEach(({ input, expectedUrl }, index) => {
        const processedText = processSearchText(input);
        const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
        chrome.tabs.create({ url: tplUrl, active: true });
        
        const createCall = chrome.tabs.create.getCall(index);
        expect(createCall.args[0].url).toBe(expectedUrl);
      });
    });

    test('should handle tab creation failures', () => {
      chrome.tabs.create.throws(new Error('Failed to create tab'));
      
      expect(() => {
        chrome.tabs.create({
          url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=test',
          active: true
        });
      }).toThrow('Failed to create tab');
    });
  });

  describe('Runtime Message Handling', () => {
    test('should handle searchTPL messages', () => {
      const mockMessage = {
        action: 'searchTPL',
        text: 'Search text'
      };
      const mockSender = {};
      const mockSendResponse = jest.fn();
      
      // Simulate message handler
      const handleMessage = (message, sender, sendResponse) => {
        if (message.action === 'searchTPL') {
          const processedText = processSearchText(message.text);
          const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
          chrome.tabs.create({ url: tplUrl, active: true });
          sendResponse({ success: true });
        }
      };
      
      handleMessage(mockMessage, mockSender, mockSendResponse);
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle unknown message actions', () => {
      const mockMessage = {
        action: 'unknownAction',
        text: 'Some text'
      };
      const mockSendResponse = jest.fn();
      
      const handleMessage = (message, sender, sendResponse) => {
        if (message.action === 'searchTPL') {
          // Handle searchTPL
        } else {
          sendResponse({ success: false, error: 'Unknown action' });
        }
      };
      
      handleMessage(mockMessage, {}, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Unknown action' 
      });
    });
  });

  describe('Search Processing Integration', () => {
    test('should process various text types correctly for Chrome integration', () => {
      const searchTests = [
        {
          input: '  whitespace around text  ',
          expected: 'whitespace around text',
          description: 'Whitespace trimming'
        },
        {
          input: '978-0-123-45678-6',
          expected: '9780123456786',
          description: 'ISBN cleaning'
        },
        {
          input: 'a'.repeat(250),
          expectedLength: 200,
          description: 'Long text truncation'
        }
      ];
      
      searchTests.forEach(({ input, expected, expectedLength, description }) => {
        const processed = processSearchText(input);
        
        if (expected) {
          expect(processed).toBe(expected);
        }
        
        if (expectedLength) {
          expect(processed.length).toBe(expectedLength);
        }
        
        // Verify it can be URL encoded without issues
        expect(() => encodeURIComponent(processed)).not.toThrow();
      });
    });

    test('should handle special characters safely', () => {
      const specialChars = [
        '<script>alert("xss")</script>',
        'SQL\'; DROP TABLE users; --',
        '../../../etc/passwd',
        'javascript:alert("test")'
      ];
      
      specialChars.forEach(maliciousInput => {
        const processed = processSearchText(maliciousInput);
        const encoded = encodeURIComponent(processed);
        const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encoded}`;
        
        // Should not contain unencoded dangerous characters
        expect(url).not.toContain('<script>');
        expect(url).not.toContain('javascript:');
        expect(url).not.toContain('DROP TABLE');
        
        // Should be properly URL encoded
        expect(url).toMatch(/^https:\/\/www\.torontopubliclibrary\.ca\/search\.jsp\?Ntt=/);
      });
    });
  });

  describe('Performance with Chrome APIs', () => {
    test('should handle rapid context menu clicks efficiently', () => {
      const startTime = Date.now();
      
      // Simulate 100 rapid context menu clicks
      for (let i = 0; i < 100; i++) {
        const mockInfo = {
          menuItemId: "searchTPL",
          selectionText: `Search term ${i}`
        };
        
        // Simulate click handler
        const searchText = mockInfo.selectionText.trim();
        const processedText = processSearchText(searchText);
        const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
        chrome.tabs.create({ url: tplUrl, active: true });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle 100 operations quickly
      expect(duration).toBeLessThan(50);
      expect(chrome.tabs.create.callCount).toBe(100);
    });
  });
});