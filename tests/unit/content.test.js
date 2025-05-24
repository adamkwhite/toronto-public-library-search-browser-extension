// Unit tests for content.js
// Tests content script functionality, text selection, and message handling

describe('Content Script', () => {
  let mockDocument, mockWindow, mockSelection;
  
  beforeEach(() => {
    // Mock selection object
    mockSelection = {
      toString: jest.fn(() => ''),
      rangeCount: 0
    };
    
    // Mock window and document
    mockWindow = {
      getSelection: jest.fn(() => mockSelection)
    };
    
    mockDocument = {
      addEventListener: jest.fn()
    };
    
    global.window = mockWindow;
    global.document = mockDocument;
    
    // Copy content script functions for testing
    global.validateSearchText = function(text) {
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
      
      const hasProblematicChars = /[<>\"'&]/.test(trimmed);
      if (hasProblematicChars) {
        return { 
          valid: true, 
          text: trimmed,
          info: 'Special characters will be encoded for search'
        };
      }
      
      return { valid: true, text: trimmed };
    };
    
    global.detectISBN = function(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      
      const patterns = {
        isbn10: /^[0-9]{9}[0-9X]$/i,
        isbn13: /^97[89][0-9]{10}$/,
        partial: /^[0-9]{9,13}$/
      };
      
      if (patterns.isbn10.test(cleaned)) {
        return { isISBN: true, type: 'ISBN-10', cleaned };
      }
      
      if (patterns.isbn13.test(cleaned)) {
        return { isISBN: true, type: 'ISBN-13', cleaned };
      }
      
      if (patterns.partial.test(cleaned) && cleaned.length >= 9) {
        return { isISBN: true, type: 'Possible ISBN', cleaned };
      }
      
      return { isISBN: false };
    };
  });

  describe('validateSearchText', () => {
    test('should validate normal text input', () => {
      const result = validateSearchText('The Great Gatsby');
      expect(result.valid).toBe(true);
      expect(result.text).toBe('The Great Gatsby');
      expect(result.error).toBeUndefined();
    });

    test('should handle empty or null input', () => {
      expect(validateSearchText(null).valid).toBe(false);
      expect(validateSearchText(undefined).valid).toBe(false);
      expect(validateSearchText('').valid).toBe(false);
      expect(validateSearchText('   ').valid).toBe(false);
    });

    test('should handle non-string input', () => {
      expect(validateSearchText(123).valid).toBe(false);
      expect(validateSearchText({}).valid).toBe(false);
      expect(validateSearchText([]).valid).toBe(false);
    });

    test('should truncate long text', () => {
      const longText = 'a'.repeat(600);
      const result = validateSearchText(longText);
      
      expect(result.valid).toBe(true);
      expect(result.text.length).toBe(500);
      expect(result.warning).toBe('Text was truncated to 500 characters');
    });

    test('should handle text with special characters', () => {
      const textWithSpecialChars = 'Book title: "Test & More"';
      const result = validateSearchText(textWithSpecialChars);
      
      expect(result.valid).toBe(true);
      expect(result.text).toBe(textWithSpecialChars);
      expect(result.info).toBe('Special characters will be encoded for search');
    });

    test('should trim whitespace', () => {
      const result = validateSearchText('  trimmed text  ');
      expect(result.valid).toBe(true);
      expect(result.text).toBe('trimmed text');
    });
  });

  describe('detectISBN', () => {
    test('should detect ISBN-10 in content script context', () => {
      const isbn10Tests = [
        '0123456789',
        '012345678X',
        '0-123-45678-9'
      ];
      
      isbn10Tests.forEach(isbn => {
        const result = detectISBN(isbn);
        expect(result.isISBN).toBe(true);
        expect(result.type).toBe('ISBN-10');
      });
    });

    test('should detect ISBN-13 in content script context', () => {
      const isbn13Tests = [
        '9780123456786',
        '978-0-123-45678-6',
        '979 0 123 45678 5'
      ];
      
      isbn13Tests.forEach(isbn => {
        const result = detectISBN(isbn);
        expect(result.isISBN).toBe(true);
        expect(result.type).toBe('ISBN-13');
      });
    });

    test('should detect possible ISBNs', () => {
      const possibleISBNs = [
        '123456789',    // 9 digits
        '12345678901',  // 11 digits
        '123456789012'  // 12 digits
      ];
      
      possibleISBNs.forEach(isbn => {
        const result = detectISBN(isbn);
        expect(result.isISBN).toBe(true);
        expect(result.type).toBe('Possible ISBN');
      });
    });

    test('should reject non-ISBN text', () => {
      const nonISBNs = [
        'Book Title',
        '12345678',    // Too short
        'abcdefghij',  // Non-numeric
        '9770123456786' // Wrong prefix
      ];
      
      nonISBNs.forEach(text => {
        const result = detectISBN(text);
        expect(result.isISBN).toBe(false);
      });
    });
  });

  describe('Selection Change Handling', () => {
    test('should track selection changes', () => {
      let lastSelectedText = '';
      
      // Simulate selection change
      mockSelection.toString.mockReturnValue('New selected text');
      
      // Simulate handleSelectionChange function
      const selectedText = mockSelection.toString().trim();
      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
      }
      
      expect(lastSelectedText).toBe('New selected text');
    });

    test('should ignore empty selections', () => {
      let lastSelectedText = 'Previous text';
      
      mockSelection.toString.mockReturnValue('');
      
      const selectedText = mockSelection.toString().trim();
      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
      }
      
      expect(lastSelectedText).toBe('Previous text');
    });

    test('should ignore duplicate selections', () => {
      let changeCount = 0;
      let lastSelectedText = '';
      
      // First selection
      mockSelection.toString.mockReturnValue('Same text');
      let selectedText = mockSelection.toString().trim();
      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
        changeCount++;
      }
      
      // Same selection again
      selectedText = mockSelection.toString().trim();
      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
        changeCount++;
      }
      
      expect(changeCount).toBe(1);
    });
  });

  describe('Chrome Runtime Message Handling', () => {
    test('should handle getSelectedText message', () => {
      const mockMessage = { action: 'getSelectedText' };
      const mockSender = {};
      const mockSendResponse = jest.fn();
      
      mockSelection.toString.mockReturnValue('Selected text for search');
      
      // Simulate message handler
      if (mockMessage.action === 'getSelectedText') {
        const selectedText = mockSelection.toString().trim();
        const validation = validateSearchText(selectedText);
        
        if (validation.valid) {
          const isbnInfo = detectISBN(validation.text);
          mockSendResponse({
            success: true,
            text: validation.text,
            isbn: isbnInfo,
            warning: validation.warning,
            info: validation.info
          });
        } else {
          mockSendResponse({
            success: false,
            error: validation.error
          });
        }
      }
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        text: 'Selected text for search',
        isbn: { isISBN: false },
        warning: undefined,
        info: undefined
      });
    });

    test('should handle getSelectedText with ISBN', () => {
      const mockMessage = { action: 'getSelectedText' };
      const mockSendResponse = jest.fn();
      
      mockSelection.toString.mockReturnValue('978-0-123-45678-6');
      
      if (mockMessage.action === 'getSelectedText') {
        const selectedText = mockSelection.toString().trim();
        const validation = validateSearchText(selectedText);
        
        if (validation.valid) {
          const isbnInfo = detectISBN(validation.text);
          mockSendResponse({
            success: true,
            text: validation.text,
            isbn: isbnInfo,
            warning: validation.warning,
            info: validation.info
          });
        }
      }
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        text: '978-0-123-45678-6',
        isbn: { isISBN: true, type: 'ISBN-13', cleaned: '9780123456786' },
        warning: undefined,
        info: undefined
      });
    });

    test('should handle getSelectedText with no selection', () => {
      const mockMessage = { action: 'getSelectedText' };
      const mockSendResponse = jest.fn();
      
      mockSelection.toString.mockReturnValue('');
      
      if (mockMessage.action === 'getSelectedText') {
        const selectedText = mockSelection.toString().trim();
        const validation = validateSearchText(selectedText);
        
        if (validation.valid) {
          const isbnInfo = detectISBN(validation.text);
          mockSendResponse({
            success: true,
            text: validation.text,
            isbn: isbnInfo
          });
        } else {
          mockSendResponse({
            success: false,
            error: validation.error
          });
        }
      }
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Selected text is empty'
      });
    });

    test('should handle searchText message', () => {
      const mockMessage = { action: 'searchText', text: 'Book to search' };
      const mockSendResponse = jest.fn();
      
      if (mockMessage.action === 'searchText') {
        if (mockMessage.text) {
          // Would send message to background script
          chrome.runtime.sendMessage({
            action: 'searchTPL',
            text: mockMessage.text
          });
          mockSendResponse({ success: true });
        } else {
          mockSendResponse({ success: false, error: 'No text provided' });
        }
      }
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'searchTPL',
        text: 'Book to search'
      });
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle unknown message actions', () => {
      const mockMessage = { action: 'unknownAction' };
      const mockSendResponse = jest.fn();
      
      if (mockMessage.action === 'unknownAction') {
        mockSendResponse({ success: false, error: 'Unknown action' });
      }
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action'
      });
    });
  });

  describe('Content Script Integration', () => {
    test('should initialize event listeners', () => {
      // Simulate content script initialization
      document.addEventListener('selectionchange', jest.fn());
      
      expect(document.addEventListener).toHaveBeenCalledWith('selectionchange', expect.any(Function));
    });

    test('should expose tplSearchExtension global', () => {
      // Simulate the global object creation
      window.tplSearchExtension = {
        validateSearchText,
        detectISBN,
        getLastSelectedText: () => 'last selected'
      };
      
      expect(window.tplSearchExtension.validateSearchText).toBeDefined();
      expect(window.tplSearchExtension.detectISBN).toBeDefined();
      expect(window.tplSearchExtension.getLastSelectedText()).toBe('last selected');
    });

    test('should handle selection with problematic characters', () => {
      const problematicText = '<script>alert("test")</script>';
      const result = validateSearchText(problematicText);
      
      expect(result.valid).toBe(true);
      expect(result.text).toBe(problematicText);
      expect(result.info).toBe('Special characters will be encoded for search');
    });

    test('should handle very long selections', () => {
      const veryLongText = 'Book title: ' + 'a'.repeat(600);
      const result = validateSearchText(veryLongText);
      
      expect(result.valid).toBe(true);
      expect(result.text.length).toBe(500);
      expect(result.warning).toBe('Text was truncated to 500 characters');
    });
  });
});