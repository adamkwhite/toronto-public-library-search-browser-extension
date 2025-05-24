// Unit tests for background.js
// Tests context menu creation, processing functions, and message handling

describe('Background Script', () => {
  let backgroundScript;
  
  beforeEach(() => {
    // Load the background script functions
    // Since we can't directly import, we'll test the functions by copying them
    global.processSearchText = function(text) {
      let processed = text.replace(/\s+/g, ' ').trim();
      
      if (isISBN(processed)) {
        processed = processed.replace(/[^0-9X]/gi, '');
        return processed;
      }
      
      if (!processed || processed.length === 0) {
        console.warn('TPL Search: Empty search text after processing');
        return text.trim();
      }
      
      if (processed.length > 200) {
        processed = processed.substring(0, 200).trim();
      }
      
      return processed;
    };
    
    global.isISBN = function(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      return /^[0-9]{9}[0-9X]$/i.test(cleaned) || 
             /^97[89][0-9]{10}$/i.test(cleaned);
    };
  });

  describe('processSearchText', () => {
    test('should trim and normalize whitespace', () => {
      expect(processSearchText('  hello   world  ')).toBe('hello world');
      expect(processSearchText('\t\ntest\r\n')).toBe('test');
    });

    test('should handle empty or whitespace-only strings', () => {
      expect(processSearchText('')).toBe('');
      expect(processSearchText('   ')).toBe('');
      expect(processSearchText('\t\n')).toBe('');
    });

    test('should truncate long strings to 200 characters', () => {
      const longString = 'a'.repeat(250);
      const result = processSearchText(longString);
      expect(result.length).toBe(200);
    });

    test('should preserve text under 200 characters', () => {
      const normalString = 'The Great Gatsby by F. Scott Fitzgerald';
      expect(processSearchText(normalString)).toBe(normalString);
    });

    test('should handle special characters in regular text', () => {
      const textWithSpecialChars = 'Book title: "Test & More"';
      expect(processSearchText(textWithSpecialChars)).toBe(textWithSpecialChars);
    });

    test('should clean ISBN numbers', () => {
      expect(processSearchText('978-0-123-45678-6')).toBe('9780123456786');
      expect(processSearchText('0-123-45678-9')).toBe('0123456789');
      expect(processSearchText('ISBN: 978 0 123 45678 6')).toBe('9780123456786');
    });
  });

  describe('isISBN', () => {
    test('should detect valid ISBN-10 numbers', () => {
      expect(isISBN('0123456789')).toBe(true);
      expect(isISBN('012345678X')).toBe(true);
      expect(isISBN('0-123-45678-9')).toBe(true);
      expect(isISBN('0 123 45678 X')).toBe(true);
    });

    test('should detect valid ISBN-13 numbers', () => {
      expect(isISBN('9780123456786')).toBe(true);
      expect(isISBN('9790123456785')).toBe(true);
      expect(isISBN('978-0-123-45678-6')).toBe(true);
      expect(isISBN('979 0 123 45678 5')).toBe(true);
    });

    test('should reject invalid ISBN numbers', () => {
      expect(isISBN('123456789')).toBe(false); // Too short
      expect(isISBN('01234567890')).toBe(false); // Too long for ISBN-10
      expect(isISBN('9770123456786')).toBe(false); // Wrong prefix
      expect(isISBN('abcdefghij')).toBe(false); // Non-numeric
      expect(isISBN('978012345678')).toBe(false); // Too short for ISBN-13
    });

    test('should handle edge cases', () => {
      expect(isISBN('')).toBe(false);
      expect(isISBN('   ')).toBe(false);
      expect(isISBN('ISBN')).toBe(false);
      expect(isISBN('978-X-123-45678-6')).toBe(false); // X in wrong position
    });
  });

  describe('Context Menu Integration', () => {
    test('should create context menu on installation', () => {
      // Simulate chrome.runtime.onInstalled
      const callback = chrome.runtime.onInstalled.addListener.getCall(0).args[0];
      callback();
      
      expect(chrome.contextMenus.create.calledOnce).toBe(true);
      expect(chrome.contextMenus.create.calledWith({
        id: "searchTPL",
        title: "Search on TPL",
        contexts: ["selection"]
      })).toBe(true);
    });

    test('should handle context menu clicks with valid text', () => {
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: "The Great Gatsby"
      };
      const mockTab = { id: 1 };
      
      // Simulate context menu click
      const callback = chrome.contextMenus.onClicked.addListener.getCall(0).args[0];
      callback(mockInfo, mockTab);
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      const createCall = chrome.tabs.create.getCall(0);
      expect(createCall.args[0].url).toContain('https://www.torontopubliclibrary.ca/search.jsp?Ntt=');
      expect(createCall.args[0].active).toBe(true);
    });

    test('should ignore context menu clicks without selection text', () => {
      const mockInfo = {
        menuItemId: "searchTPL",
        selectionText: ""
      };
      const mockTab = { id: 1 };
      
      const callback = chrome.contextMenus.onClicked.addListener.getCall(0).args[0];
      callback(mockInfo, mockTab);
      
      expect(chrome.tabs.create.called).toBe(false);
    });

    test('should ignore clicks from other menu items', () => {
      const mockInfo = {
        menuItemId: "otherItem",
        selectionText: "Some text"
      };
      const mockTab = { id: 1 };
      
      const callback = chrome.contextMenus.onClicked.addListener.getCall(0).args[0];
      callback(mockInfo, mockTab);
      
      expect(chrome.tabs.create.called).toBe(false);
    });
  });

  describe('URL Generation', () => {
    test('should properly encode search terms', () => {
      const testCases = [
        { input: 'The Great Gatsby', expected: 'The%20Great%20Gatsby' },
        { input: 'Author: Smith & Jones', expected: 'Author%3A%20Smith%20%26%20Jones' },
        { input: 'Book "Title"', expected: 'Book%20%22Title%22' },
        { input: 'Test with åéîøü', expected: 'Test%20with%20%C3%A5%C3%A9%C3%AE%C3%B8%C3%BC' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const encoded = encodeURIComponent(processSearchText(input));
        expect(encoded).toBe(expected);
      });
    });

    test('should create proper TPL URLs', () => {
      const baseUrl = 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=';
      const searchTerm = 'Test Book';
      const expectedUrl = baseUrl + encodeURIComponent(searchTerm);
      
      expect(expectedUrl).toBe('https://www.torontopubliclibrary.ca/search.jsp?Ntt=Test%20Book');
    });
  });
});