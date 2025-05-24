// Comprehensive ISBN detection and validation tests
// Tests various ISBN formats and edge cases

describe('ISBN Detection and Validation', () => {
  let isISBN, detectISBN;
  
  beforeEach(() => {
    // Copy the ISBN functions for testing
    global.isISBN = function(text) {
      const cleaned = text.replace(/[^0-9X]/gi, '');
      return /^[0-9]{9}[0-9X]?$/i.test(cleaned) || 
             /^97[89][0-9]{10}$/i.test(cleaned);
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
    
    isISBN = global.isISBN;
    detectISBN = global.detectISBN;
  });

  describe('ISBN-10 Detection', () => {
    test('should detect basic ISBN-10 format', () => {
      const validISBN10s = [
        '0123456789',
        '012345678X',
        '0987654321',
        '123456789X'
      ];
      
      validISBN10s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-10');
        expect(detection.cleaned).toBe(isbn.toUpperCase());
      });
    });

    test('should detect ISBN-10 with hyphens', () => {
      const formattedISBN10s = [
        '0-123-45678-9',
        '0-987-65432-1',
        '1-234-56789-X',
        '0-12-345678-9'
      ];
      
      formattedISBN10s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-10');
        expect(detection.cleaned).toBe(isbn.replace(/-/g, '').toUpperCase());
      });
    });

    test('should detect ISBN-10 with spaces', () => {
      const spacedISBN10s = [
        '0 123 45678 9',
        '0 987 65432 1',
        '1 234 56789 X',
        '0   123   45678   9'
      ];
      
      spacedISBN10s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-10');
        expect(detection.cleaned).toBe(isbn.replace(/\s/g, '').toUpperCase());
      });
    });

    test('should handle ISBN-10 with mixed separators', () => {
      const mixedISBN10s = [
        'ISBN: 0-123-45678-9',
        'ISBN 0 123 45678 9',
        '(ISBN) 0123456789',
        'Book: 012345678X'
      ];
      
      mixedISBN10s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-10');
      });
    });
  });

  describe('ISBN-13 Detection', () => {
    test('should detect basic ISBN-13 format', () => {
      const validISBN13s = [
        '9780123456786',
        '9790987654321',
        '9781234567890',
        '9789876543210'
      ];
      
      validISBN13s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-13');
        expect(detection.cleaned).toBe(isbn);
      });
    });

    test('should detect ISBN-13 with hyphens', () => {
      const formattedISBN13s = [
        '978-0-123-45678-6',
        '979-0-987-65432-1',
        '978-1-234-56789-0',
        '979-9-876-54321-0'
      ];
      
      formattedISBN13s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-13');
        expect(detection.cleaned).toBe(isbn.replace(/-/g, ''));
      });
    });

    test('should detect ISBN-13 with spaces', () => {
      const spacedISBN13s = [
        '978 0 123 45678 6',
        '979 0 987 65432 1',
        '978   1   234   56789   0'
      ];
      
      spacedISBN13s.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('ISBN-13');
        expect(detection.cleaned).toBe(isbn.replace(/\s/g, ''));
      });
    });

    test('should only accept 978 and 979 prefixes', () => {
      const validPrefixes = ['9780123456786', '9790123456785'];
      const invalidPrefixes = ['9770123456786', '9800123456786', '9760123456786'];
      
      validPrefixes.forEach(isbn => {
        expect(isISBN(isbn)).toBe(true);
        expect(detectISBN(isbn).isISBN).toBe(true);
      });
      
      invalidPrefixes.forEach(isbn => {
        expect(isISBN(isbn)).toBe(false);
        expect(detectISBN(isbn).isISBN).toBe(false);
      });
    });
  });

  describe('Invalid ISBN Detection', () => {
    test('should reject too short numbers', () => {
      const shortNumbers = [
        '12345',
        '123456789', // 9 digits, but no check digit
        '12345678',
        '1234'
      ];
      
      shortNumbers.forEach(num => {
        expect(isISBN(num)).toBe(false);
        expect(detectISBN(num).isISBN).toBe(false);
      });
    });

    test('should reject too long numbers', () => {
      const longNumbers = [
        '01234567890', // 11 digits
        '12345678901234', // 14 digits
        '978012345678901' // 15 digits
      ];
      
      longNumbers.forEach(num => {
        expect(isISBN(num)).toBe(false);
        expect(detectISBN(num).isISBN).toBe(false);
      });
    });

    test('should reject non-numeric content', () => {
      const nonNumeric = [
        'abcdefghij',
        'hello world',
        '123abc456',
        'ISBN without numbers',
        '978-abc-def-ghi-j'
      ];
      
      nonNumeric.forEach(text => {
        expect(isISBN(text)).toBe(false);
        expect(detectISBN(text).isISBN).toBe(false);
      });
    });

    test('should handle X in wrong positions', () => {
      const wrongXPositions = [
        'X123456789', // X at start
        '01234X6789', // X in middle
        '978X123456786', // X in ISBN-13
        '012345678XX' // Multiple X
      ];
      
      wrongXPositions.forEach(isbn => {
        expect(isISBN(isbn)).toBe(false);
        expect(detectISBN(isbn).isISBN).toBe(false);
      });
    });

    test('should handle edge cases', () => {
      const edgeCases = [
        '',
        '   ',
        'ISBN',
        'ISBN:',
        'Book Title',
        '123-456-789', // Valid format but wrong length
        '000000000' // Too short
      ];
      
      edgeCases.forEach(text => {
        expect(isISBN(text)).toBe(false);
        expect(detectISBN(text).isISBN).toBe(false);
      });
    });
  });

  describe('Partial ISBN Detection', () => {
    test('should detect possible ISBNs with 9+ digits', () => {
      const partialISBNs = [
        '123456789', // 9 digits
        '12345678901', // 11 digits
        '123456789012' // 12 digits
      ];
      
      partialISBNs.forEach(isbn => {
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(detection.type).toBe('Possible ISBN');
        expect(detection.cleaned).toBe(isbn);
      });
    });

    test('should not detect numbers with less than 9 digits as possible ISBNs', () => {
      const shortNumbers = [
        '12345678', // 8 digits
        '1234567',  // 7 digits
        '123456'    // 6 digits
      ];
      
      shortNumbers.forEach(num => {
        const detection = detectISBN(num);
        expect(detection.isISBN).toBe(false);
      });
    });
  });

  describe('Real-world ISBN Examples', () => {
    test('should handle actual book ISBNs', () => {
      const realISBNs = [
        { isbn: '978-0-13-235088-4', title: 'Clean Code' },
        { isbn: '0-201-61586-X', title: 'The Pragmatic Programmer' },
        { isbn: '978-0-321-35668-0', title: 'Effective Java' },
        { isbn: '0-596-52068-9', title: 'JavaScript: The Good Parts' },
        { isbn: '978-1-449-31884-0', title: 'Learning React' }
      ];
      
      realISBNs.forEach(({ isbn, title }) => {
        expect(isISBN(isbn)).toBe(true);
        const detection = detectISBN(isbn);
        expect(detection.isISBN).toBe(true);
        expect(['ISBN-10', 'ISBN-13']).toContain(detection.type);
      });
    });

    test('should handle ISBNs embedded in text', () => {
      const textWithISBNs = [
        'Book: Clean Code (ISBN: 978-0-13-235088-4) is great',
        'ISBN 0-201-61586-X for The Pragmatic Programmer',
        'Order book with ISBN: 978-0-321-35668-0 today',
        'Available as 0-596-52068-9 paperback edition'
      ];
      
      textWithISBNs.forEach(text => {
        expect(isISBN(text)).toBe(true);
        const detection = detectISBN(text);
        expect(detection.isISBN).toBe(true);
      });
    });
  });
});