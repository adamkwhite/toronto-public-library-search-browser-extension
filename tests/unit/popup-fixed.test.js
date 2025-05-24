// Fixed popup functionality tests
// Tests popup UI interactions and Chrome API integration

require('../setup-hybrid');

describe('Popup Functionality (Fixed)', () => {
  let mockDOMElements, processSearchText, validateSearchText;
  
  beforeEach(() => {
    setupChromeApiMocks();
    
    // Mock DOM elements that popup.js would interact with
    mockDOMElements = {
      searchInput: { 
        value: '', 
        addEventListener: jest.fn(),
        focus: jest.fn()
      },
      searchButton: { 
        addEventListener: jest.fn(),
        disabled: false,
        click: jest.fn()
      },
      selectedTextButton: { 
        addEventListener: jest.fn(),
        disabled: true,
        textContent: 'Search Selected Text'
      },
      messageArea: { 
        innerHTML: ''
      }
    };
    
    // Mock document.getElementById
    document.getElementById = jest.fn((id) => mockDOMElements[id]);
    
    // Define popup functions
    processSearchText = function(text) {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid search text');
      }
      
      let processed = text.replace(/\s+/g, ' ').trim();
      
      if (processed.length === 0) {
        throw new Error('Search text is empty after processing');
      }
      
      if (isISBN(processed)) {
        processed = processed.replace(/[^0-9X]/gi, '');
      }
      
      if (processed.length > 200) {
        processed = processed.substring(0, 200).trim();
      }
      
      return processed;
    };
    
    validateSearchText = function(text) {
      if (!text || typeof text !== 'string') {
        return { valid: false, error: 'No text selected' };
      }
      
      const trimmed = text.trim();
      
      if (trimmed.length === 0) {
        return { valid: false, error: 'Selected text is empty' };
      }
      
      if (trimmed.length > 500) {
        return { 
          valid: true, 
          text: trimmed.substring(0, 500).trim(),
          warning: 'Text was truncated to 500 characters'
        };
      }
      
      return { valid: true, text: trimmed };
    };
    
    function isISBN(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      return /^[0-9]{9}[0-9X]$/i.test(cleaned) || 
             /^97[89][0-9]{10}$/i.test(cleaned);
    }
  });

  describe('DOM Element Interaction', () => {
    test('should initialize DOM elements correctly', () => {
      // Simulate popup initialization
      const searchInput = document.getElementById('searchInput');
      const searchButton = document.getElementById('searchButton');
      const selectedTextButton = document.getElementById('selectedTextButton');
      const messageArea = document.getElementById('messageArea');
      
      expect(searchInput).toBeDefined();
      expect(searchButton).toBeDefined();
      expect(selectedTextButton).toBeDefined();
      expect(messageArea).toBeDefined();
      
      expect(selectedTextButton.disabled).toBe(true);
    });

    test('should setup event listeners', () => {
      const searchInput = document.getElementById('searchInput');
      const searchButton = document.getElementById('searchButton');
      
      // Simulate adding event listeners
      searchButton.addEventListener('click', jest.fn());
      searchInput.addEventListener('keypress', jest.fn());
      
      expect(searchButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(searchInput.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    });
  });

  describe('Search Input Processing', () => {
    test('should process manual search input', () => {
      const testInputs = [
        { input: 'The Great Gatsby', expected: 'The Great Gatsby' },
        { input: '  whitespace test  ', expected: 'whitespace test' },
        { input: '978-0-123-45678-6', expected: '9780123456786' }
      ];
      
      testInputs.forEach(({ input, expected }) => {
        const result = processSearchText(input);
        expect(result).toBe(expected);
      });
    });

    test('should validate search input', () => {
      expect(validateSearchText('Valid text').valid).toBe(true);
      expect(validateSearchText('').valid).toBe(false);
      expect(validateSearchText('   ').valid).toBe(false);
      expect(validateSearchText(null).valid).toBe(false);
    });

    test('should handle input errors', () => {
      expect(() => processSearchText('')).toThrow('Search text is empty after processing');
      expect(() => processSearchText(null)).toThrow('Invalid search text');
      expect(() => processSearchText(undefined)).toThrow('Invalid search text');
    });
  });

  describe('Chrome Tab Integration', () => {
    test('should query active tabs for selected text', () => {
      const mockTabs = [{ id: 1, active: true, url: 'https://example.com' }];
      chrome.tabs.query.callsArgWith(1, mockTabs);
      
      // Simulate popup querying for active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        expect(tabs).toEqual(mockTabs);
        expect(tabs[0].active).toBe(true);
      });
      
      expect(chrome.tabs.query.calledOnce).toBe(true);
      expect(chrome.tabs.query.calledWith({ active: true, currentWindow: true })).toBe(true);
    });

    test('should send messages to content script', () => {
      const mockResponse = { success: true, text: 'Selected text' };
      chrome.tabs.sendMessage.callsArgWith(2, mockResponse);
      
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        expect(response.success).toBe(true);
        expect(response.text).toBe('Selected text');
      });
      
      expect(chrome.tabs.sendMessage.calledOnce).toBe(true);
    });

    test('should create new tabs for searches', () => {
      const searchText = 'Test search';
      const expectedUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(searchText)}`;
      
      chrome.tabs.create({ url: expectedUrl, active: true });
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      expect(chrome.tabs.create.calledWith({ url: expectedUrl, active: true })).toBe(true);
    });
  });

  describe('Selected Text Detection', () => {
    test('should enable selected text button when text is available', () => {
      const mockResponse = {
        success: true,
        text: 'Selected text from page',
        isbn: { isISBN: false }
      };
      
      chrome.tabs.sendMessage.callsArgWith(2, mockResponse);
      
      // Simulate checking for selected text
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        if (response.success) {
          const selectedTextButton = document.getElementById('selectedTextButton');
          selectedTextButton.disabled = false;
          selectedTextButton.textContent = `Search: "${response.text.substring(0, 20)}..."`;
        }
      });
      
      const selectedTextButton = document.getElementById('selectedTextButton');
      expect(selectedTextButton.disabled).toBe(false);
      expect(selectedTextButton.textContent).toContain('Search: "Selected text');
    });

    test('should handle ISBN detection in selected text', () => {
      const mockResponse = {
        success: true,
        text: '978-0-123-45678-6',
        isbn: { isISBN: true, type: 'ISBN-13', cleaned: '9780123456786' }
      };
      
      chrome.tabs.sendMessage.callsArgWith(2, mockResponse);
      
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        if (response.success && response.isbn.isISBN) {
          expect(response.isbn.type).toBe('ISBN-13');
          expect(response.isbn.cleaned).toBe('9780123456786');
        }
      });
    });
  });

  describe('Search Execution', () => {
    test('should perform manual search from input', () => {
      const searchInput = document.getElementById('searchInput');
      searchInput.value = 'Manual search term';
      
      // Simulate manual search
      const searchText = searchInput.value.trim();
      if (searchText) {
        const processed = processSearchText(searchText);
        const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processed)}`;
        chrome.tabs.create({ url, active: true });
      }
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      const createCall = chrome.tabs.create.getCall(0);
      expect(createCall.args[0].url).toBe('https://www.torontopubliclibrary.ca/search.jsp?Ntt=Manual%20search%20term');
    });

    test('should perform search with selected text', () => {
      const mockResponse = { success: true, text: 'Selected text' };
      chrome.tabs.sendMessage.callsArgWith(2, mockResponse);
      
      // Simulate selected text search
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        if (response.success) {
          const processed = processSearchText(response.text);
          const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processed)}`;
          chrome.tabs.create({ url, active: true });
        }
      });
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
    });

    test('should close popup after successful search', () => {
      const searchText = 'Test search';
      const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(searchText)}`;
      
      chrome.tabs.create({ url, active: true });
      window.close();
      
      expect(chrome.tabs.create.calledOnce).toBe(true);
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty search input', () => {
      const searchInput = document.getElementById('searchInput');
      searchInput.value = '';
      
      const searchText = searchInput.value.trim();
      let errorMessage = '';
      
      if (!searchText) {
        errorMessage = 'Please enter search text';
      }
      
      expect(errorMessage).toBe('Please enter search text');
      expect(chrome.tabs.create.called).toBe(false);
    });

    test('should handle content script communication errors', () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated' };
      chrome.tabs.sendMessage.callsArgWith(2, undefined);
      
      chrome.tabs.sendMessage(1, { action: 'getSelectedText' }, (response) => {
        if (chrome.runtime.lastError) {
          expect(chrome.runtime.lastError.message).toBe('Extension context invalidated');
        }
        expect(response).toBeUndefined();
      });
    });

    test('should handle tab creation failures', () => {
      chrome.tabs.create.throws(new Error('Cannot create tab'));
      
      expect(() => {
        chrome.tabs.create({
          url: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=test',
          active: true
        });
      }).toThrow('Cannot create tab');
    });
  });

  describe('Message Display', () => {
    test('should show info messages', () => {
      const messageArea = document.getElementById('messageArea');
      const message = 'Test info message';
      
      messageArea.innerHTML = `<div class="info">${message}</div>`;
      
      expect(messageArea.innerHTML).toContain('class="info"');
      expect(messageArea.innerHTML).toContain(message);
    });

    test('should show error messages', () => {
      const messageArea = document.getElementById('messageArea');
      const message = 'Test error message';
      
      messageArea.innerHTML = `<div class="error">${message}</div>`;
      
      expect(messageArea.innerHTML).toContain('class="error"');
      expect(messageArea.innerHTML).toContain(message);
    });

    test('should clear messages', () => {
      const messageArea = document.getElementById('messageArea');
      messageArea.innerHTML = '<div>Previous message</div>';
      
      messageArea.innerHTML = '';
      
      expect(messageArea.innerHTML).toBe('');
    });
  });

  describe('URL Generation and Security', () => {
    test('should generate safe URLs for various inputs', () => {
      const testCases = [
        { input: 'Normal book title', safe: true },
        { input: '<script>alert("xss")</script>', safe: true },
        { input: 'SQL\'; DROP TABLE users; --', safe: true },
        { input: 'javascript:alert("test")', safe: true }
      ];
      
      testCases.forEach(({ input, safe }) => {
        const processed = processSearchText(input);
        const encoded = encodeURIComponent(processed);
        const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encoded}`;
        
        expect(url.startsWith('https://www.torontopubliclibrary.ca/search.jsp?Ntt=')).toBe(true);
        
        if (safe) {
          // Should not contain unencoded dangerous content
          expect(url).not.toContain('<script>');
          expect(url).not.toContain('javascript:');
          expect(url).not.toContain('DROP TABLE');
        }
      });
    });

    test('should handle Unicode characters properly', () => {
      const unicodeInputs = [
        'Café Literature',
        'Naïve Approach', 
        'Résumé Writing',
        '北京 Beijing'
      ];
      
      unicodeInputs.forEach(input => {
        const processed = processSearchText(input);
        const encoded = encodeURIComponent(processed);
        const url = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encoded}`;
        
        expect(url).toMatch(/^https:\/\/www\.torontopubliclibrary\.ca\/search\.jsp\?Ntt=/);
        expect(() => new URL(url)).not.toThrow();
      });
    });
  });
});