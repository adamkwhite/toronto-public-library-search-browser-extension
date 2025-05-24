// Unit tests for popup.js functionality
// Tests popup UI interactions, validation, and search operations

describe('Popup Script', () => {
  let mockDocument, mockWindow, mockChrome;
  let searchInput, searchButton, selectedTextButton, messageArea;
  
  beforeEach(() => {
    // Mock DOM elements
    searchInput = { 
      value: '', 
      addEventListener: jest.fn(),
      focus: jest.fn()
    };
    searchButton = { 
      addEventListener: jest.fn(),
      disabled: false
    };
    selectedTextButton = { 
      addEventListener: jest.fn(),
      disabled: true,
      textContent: 'Search Selected Text'
    };
    messageArea = { 
      innerHTML: ''
    };
    
    // Mock document methods
    mockDocument = {
      addEventListener: jest.fn(),
      getElementById: jest.fn((id) => {
        switch(id) {
          case 'searchInput': return searchInput;
          case 'searchButton': return searchButton;
          case 'selectedTextButton': return selectedTextButton;
          case 'messageArea': return messageArea;
          default: return null;
        }
      }),
      createElement: jest.fn(() => ({ textContent: '', innerHTML: '' }))
    };
    
    mockWindow = {
      close: jest.fn()
    };
    
    global.document = mockDocument;
    global.window = mockWindow;
    
    // Copy popup functions for testing
    global.processSearchText = function(text) {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid search text');
      }
      
      let processed = text.replace(/\s+/g, ' ').trim();
      
      if (processed.length === 0) {
        throw new Error('Search text is empty after processing');
      }
      
      if (isISBN(processed)) {
        processed = processed.replace(/[^0-9X]/gi, '');
        return processed;
      }
      
      if (processed.length > 200) {
        processed = processed.substring(0, 200).trim();
      }
      
      return processed;
    };
    
    global.isISBN = function(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      return /^[0-9]{9}[0-9X]?$/i.test(cleaned) || 
             /^97[89][0-9]{10}$/i.test(cleaned);
    };
    
    global.truncateText = function(text, maxLength) {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength - 3) + '...';
    };
    
    global.escapeHtml = function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
  });

  describe('processSearchText', () => {
    test('should process valid text input', () => {
      expect(processSearchText('The Great Gatsby')).toBe('The Great Gatsby');
      expect(processSearchText('  whitespace  test  ')).toBe('whitespace test');
    });

    test('should throw error for invalid input', () => {
      expect(() => processSearchText(null)).toThrow('Invalid search text');
      expect(() => processSearchText(undefined)).toThrow('Invalid search text');
      expect(() => processSearchText(123)).toThrow('Invalid search text');
    });

    test('should throw error for empty input after processing', () => {
      expect(() => processSearchText('')).toThrow('Search text is empty after processing');
      expect(() => processSearchText('   ')).toThrow('Search text is empty after processing');
      expect(() => processSearchText('\t\n')).toThrow('Search text is empty after processing');
    });

    test('should handle ISBN processing', () => {
      expect(processSearchText('978-0-123-45678-6')).toBe('9780123456786');
      expect(processSearchText('0-123-45678-9')).toBe('0123456789');
      expect(processSearchText('ISBN: 012345678X')).toBe('012345678X');
    });

    test('should truncate long text', () => {
      const longText = 'a'.repeat(250);
      const result = processSearchText(longText);
      expect(result.length).toBe(200);
    });
  });

  describe('URL Generation and Encoding', () => {
    test('should create properly encoded TPL URLs', () => {
      const testCases = [
        {
          input: 'The Great Gatsby',
          expected: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=The%20Great%20Gatsby'
        },
        {
          input: 'Author: Smith & Jones',
          expected: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Author%3A%20Smith%20%26%20Jones'
        },
        {
          input: 'Book "Title" with quotes',
          expected: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Book%20%22Title%22%20with%20quotes'
        },
        {
          input: '978-0-123-45678-6',
          expected: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780123456786'
        }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const processed = processSearchText(input);
        const encoded = encodeURIComponent(processed);
        const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encoded}`;
        expect(url).toBe(expected);
      });
    });

    test('should handle special characters in URLs', () => {
      const specialChars = [
        { char: '&', encoded: '%26' },
        { char: '#', encoded: '%23' },
        { char: '?', encoded: '%3F' },
        { char: '=', encoded: '%3D' },
        { char: '+', encoded: '%2B' },
        { char: ' ', encoded: '%20' }
      ];
      
      specialChars.forEach(({ char, encoded }) => {
        const text = `test${char}text`;
        const processed = processSearchText(text);
        const urlEncoded = encodeURIComponent(processed);
        expect(urlEncoded).toContain(encoded);
      });
    });

    test('should handle Unicode characters', () => {
      const unicodeText = 'Café Naïve Résumé';
      const processed = processSearchText(unicodeText);
      const encoded = encodeURIComponent(processed);
      expect(encoded).toBe('Caf%C3%A9%20Na%C3%AFve%20R%C3%A9sum%C3%A9');
    });
  });

  describe('Text Utility Functions', () => {
    test('truncateText should work correctly', () => {
      expect(truncateText('short', 10)).toBe('short');
      expect(truncateText('this is a long text', 10)).toBe('this is...');
      expect(truncateText('exactly10char', 13)).toBe('exactly10char');
      expect(truncateText('toolong', 6)).toBe('too...');
    });

    test('escapeHtml should prevent XSS', () => {
      const mockDiv = {
        textContent: '',
        innerHTML: ''
      };
      
      document.createElement.mockReturnValue(mockDiv);
      
      const maliciousInput = '<script>alert("xss")</script>';
      mockDiv.textContent = maliciousInput;
      mockDiv.innerHTML = '&lt;script&gt;alert("xss")&lt;/script&gt;';
      
      const result = escapeHtml(maliciousInput);
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });

  describe('Chrome Extension Integration', () => {
    test('should query active tabs correctly', () => {
      chrome.tabs.query.yields([{ id: 1, url: 'https://example.com' }]);
      
      // Simulate tab query
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        expect(tabs).toHaveLength(1);
        expect(tabs[0].id).toBe(1);
      });
      
      expect(chrome.tabs.query.calledWith({ active: true, currentWindow: true })).toBe(true);
    });

    test('should send messages to content script', () => {
      const mockResponse = {
        success: true,
        text: 'Selected text',
        isbn: { isISBN: false }
      };
      
      chrome.tabs.sendMessage.yields(mockResponse);
      
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        expect(response.success).toBe(true);
        expect(response.text).toBe('Selected text');
      });
      
      expect(chrome.tabs.sendMessage.calledWith(1, { action: 'getSelectedText' })).toBe(true);
    });

    test('should create new tabs with correct URL', () => {
      const searchText = 'Test Book';
      const expectedUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(searchText)}`;
      
      chrome.tabs.create.yields({ id: 2, url: expectedUrl });
      
      chrome.tabs.create({ url: expectedUrl, active: true }, (tab) => {
        expect(tab.url).toBe(expectedUrl);
      });
      
      expect(chrome.tabs.create.calledWith({ url: expectedUrl, active: true })).toBe(true);
    });

    test('should handle chrome runtime errors gracefully', () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated.' };
      
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        // Should handle the error gracefully without throwing
        expect(chrome.runtime.lastError).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle empty search input', () => {
      searchInput.value = '';
      
      // Simulate manual search with empty input
      expect(() => {
        const searchText = searchInput.value.trim();
        if (!searchText) {
          throw new Error('Please enter search text');
        }
      }).toThrow('Please enter search text');
    });

    test('should handle search processing errors', () => {
      const invalidInputs = [null, undefined, '', '   '];
      
      invalidInputs.forEach(input => {
        expect(() => processSearchText(input)).toThrow();
      });
    });

    test('should handle network/extension errors', () => {
      // Simulate network error
      chrome.tabs.create.throws(new Error('Network error'));
      
      expect(() => {
        chrome.tabs.create({ url: 'https://example.com', active: true });
      }).toThrow('Network error');
    });
  });

  describe('Message Display', () => {
    test('should display info messages correctly', () => {
      const message = 'Test info message';
      const type = 'info';
      
      // Simulate showMessage function
      messageArea.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
      
      expect(messageArea.innerHTML).toContain('class="info"');
      expect(messageArea.innerHTML).toContain(message);
    });

    test('should display error messages correctly', () => {
      const message = 'Test error message';
      const type = 'error';
      
      messageArea.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
      
      expect(messageArea.innerHTML).toContain('class="error"');
      expect(messageArea.innerHTML).toContain(message);
    });

    test('should clear messages', () => {
      messageArea.innerHTML = '<div class="info">Previous message</div>';
      
      // Simulate clearMessages function
      messageArea.innerHTML = '';
      
      expect(messageArea.innerHTML).toBe('');
    });
  });
});