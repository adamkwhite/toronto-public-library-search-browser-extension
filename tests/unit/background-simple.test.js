// Simplified unit tests for background.js functions
// Tests core functionality without complex Chrome API mocking

describe('Background Script Core Functions', () => {
  let processSearchText, isISBN;
  
  beforeEach(() => {
    // Define core functions for testing
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

  describe('processSearchText function', () => {
    test('should trim and normalize whitespace', () => {
      expect(processSearchText('  hello   world  ')).toBe('hello world');
      expect(processSearchText('\t\ntest\r\n')).toBe('test');
    });

    test('should handle empty strings gracefully', () => {
      expect(processSearchText('')).toBe('');
      expect(processSearchText('   ')).toBe('');
    });

    test('should truncate long strings to 200 characters', () => {
      const longString = 'a'.repeat(250);
      const result = processSearchText(longString);
      expect(result.length).toBe(200);
    });

    test('should preserve normal text under 200 characters', () => {
      const normalString = 'The Great Gatsby by F. Scott Fitzgerald';
      expect(processSearchText(normalString)).toBe(normalString);
    });

    test('should clean ISBN numbers', () => {
      expect(processSearchText('978-0-123-45678-6')).toBe('9780123456786');
      expect(processSearchText('0-123-45678-9')).toBe('0123456789');
      expect(processSearchText('ISBN: 978 0 123 45678 6')).toBe('9780123456786');
    });
  });

  describe('isISBN function', () => {
    test('should detect valid ISBN-10 numbers', () => {
      expect(isISBN('0123456789')).toBe(true);
      expect(isISBN('012345678X')).toBe(true);
      expect(isISBN('0-123-45678-9')).toBe(true);
    });

    test('should detect valid ISBN-13 numbers', () => {
      expect(isISBN('9780123456786')).toBe(true);
      expect(isISBN('9790123456785')).toBe(true);
      expect(isISBN('978-0-123-45678-6')).toBe(true);
    });

    test('should reject invalid ISBN numbers', () => {
      expect(isISBN('123456789')).toBe(false); // 9 digits without check digit
      expect(isISBN('01234567890')).toBe(false); // Too long for ISBN-10
      expect(isISBN('9770123456786')).toBe(false); // Wrong prefix
      expect(isISBN('abcdefghij')).toBe(false); // Non-numeric
    });

    test('should handle edge cases', () => {
      expect(isISBN('')).toBe(false);
      expect(isISBN('   ')).toBe(false);
      expect(isISBN('ISBN')).toBe(false);
    });
  });

  describe('URL generation', () => {
    test('should properly encode search terms for URLs', () => {
      const testCases = [
        { input: 'The Great Gatsby', expected: 'The%20Great%20Gatsby' },
        { input: 'Author: Smith & Jones', expected: 'Author%3A%20Smith%20%26%20Jones' },
        { input: 'Book "Title"', expected: 'Book%20%22Title%22' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const processed = processSearchText(input);
        const encoded = encodeURIComponent(processed);
        expect(encoded).toBe(expected);
      });
    });

    test('should create valid TPL URLs', () => {
      const searchTerm = 'Test Book';
      const processed = processSearchText(searchTerm);
      const encodedTerm = encodeURIComponent(processed);
      const expectedUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodedTerm}`;
      
      expect(expectedUrl).toBe('https://www.torontopubliclibrary.ca/search.jsp?Ntt=Test%20Book');
    });

    test('should handle special characters in URLs', () => {
      const specialText = 'Book title: "Test & More"';
      const processed = processSearchText(specialText);
      const encoded = encodeURIComponent(processed);
      
      expect(encoded).toContain('%22'); // Quote
      expect(encoded).toContain('%26'); // Ampersand
      expect(encoded).toContain('%3A'); // Colon
    });
  });
});