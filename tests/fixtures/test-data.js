// Test fixtures and sample data for extension tests
// Contains realistic test data for ISBN validation, search terms, and edge cases

export const testData = {
  // Valid ISBN test cases
  validISBNs: {
    isbn10: [
      { input: '0123456789', cleaned: '0123456789', description: 'Basic ISBN-10' },
      { input: '012345678X', cleaned: '012345678X', description: 'ISBN-10 with X check digit' },
      { input: '0-123-45678-9', cleaned: '0123456789', description: 'ISBN-10 with hyphens' },
      { input: '0 123 45678 9', cleaned: '0123456789', description: 'ISBN-10 with spaces' },
      { input: 'ISBN: 0123456789', cleaned: '0123456789', description: 'ISBN-10 with prefix' }
    ],
    isbn13: [
      { input: '9780123456786', cleaned: '9780123456786', description: 'Basic ISBN-13' },
      { input: '978-0-123-45678-6', cleaned: '9780123456786', description: 'ISBN-13 with hyphens' },
      { input: '978 0 123 45678 6', cleaned: '9780123456786', description: 'ISBN-13 with spaces' },
      { input: '9790987654321', cleaned: '9790987654321', description: 'ISBN-13 with 979 prefix' },
      { input: 'ISBN-13: 978-0-123-45678-6', cleaned: '9780123456786', description: 'ISBN-13 with prefix' }
    ]
  },

  // Invalid ISBN test cases
  invalidISBNs: [
    { input: '123456789', description: 'Too short (9 digits without check)' },
    { input: '01234567890', description: 'Too long for ISBN-10' },
    { input: '9770123456786', description: 'Invalid ISBN-13 prefix (977)' },
    { input: 'abcdefghij', description: 'Non-numeric characters' },
    { input: '978X123456786', description: 'X in wrong position for ISBN-13' },
    { input: 'X123456789', description: 'X at start of ISBN-10' },
    { input: '01234X6789', description: 'X in middle of ISBN-10' },
    { input: '', description: 'Empty string' },
    { input: '   ', description: 'Whitespace only' }
  ],

  // Real-world book ISBN examples
  realWorldISBNs: [
    { isbn: '978-0-13-235088-4', title: 'Clean Code: A Handbook of Agile Software Craftsmanship' },
    { isbn: '0-201-61586-X', title: 'The Pragmatic Programmer' },
    { isbn: '978-0-321-35668-0', title: 'Effective Java' },
    { isbn: '0-596-52068-9', title: 'JavaScript: The Good Parts' },
    { isbn: '978-1-449-31884-0', title: 'Learning React' },
    { isbn: '978-0-134-68591-6', title: 'Refactoring: Improving the Design of Existing Code' },
    { isbn: '0-7356-6745-7', title: 'Code Complete' },
    { isbn: '978-0-596-51774-8', title: 'Head First Design Patterns' }
  ],

  // Search term test cases
  searchTerms: {
    simple: [
      { input: 'The Great Gatsby', expected: 'The Great Gatsby' },
      { input: 'Margaret Atwood', expected: 'Margaret Atwood' },
      { input: 'Clean Code', expected: 'Clean Code' }
    ],
    withSpecialChars: [
      { input: 'Book title: "Test & More"', expected: 'Book title: "Test & More"' },
      { input: "Author's Name", expected: "Author's Name" },
      { input: 'Search with <html> tags', expected: 'Search with <html> tags' },
      { input: 'Title with #hashtag', expected: 'Title with #hashtag' },
      { input: 'Query with ? and =', expected: 'Query with ? and =' }
    ],
    withWhitespace: [
      { input: '  trimmed text  ', expected: 'trimmed text' },
      { input: '\t\ntest\r\n', expected: 'test' },
      { input: 'multiple   spaces   between', expected: 'multiple spaces between' }
    ],
    unicode: [
      { input: 'Café Literature', expected: 'Café Literature' },
      { input: 'Naïve Approach', expected: 'Naïve Approach' },
      { input: 'Résumé Writing', expected: 'Résumé Writing' },
      { input: '北京 Beijing', expected: '北京 Beijing' }
    ]
  },

  // URL encoding test cases
  urlEncoding: [
    { input: 'The Great Gatsby', encoded: 'The%20Great%20Gatsby' },
    { input: 'Author: Smith & Jones', encoded: 'Author%3A%20Smith%20%26%20Jones' },
    { input: 'Book "Title"', encoded: 'Book%20%22Title%22' },
    { input: 'Query with spaces', encoded: 'Query%20with%20spaces' },
    { input: 'Special chars: !@#$%^&*()', encoded: 'Special%20chars%3A%20!%40%23%24%25%5E%26*()' }
  ],

  // Edge cases for testing
  edgeCases: {
    empty: [
      { input: '', description: 'Empty string' },
      { input: '   ', description: 'Whitespace only' },
      { input: '\t\n\r', description: 'Tab and newline characters' }
    ],
    long: [
      { input: 'a'.repeat(100), description: '100 character string' },
      { input: 'a'.repeat(200), description: '200 character string' },
      { input: 'a'.repeat(500), description: '500 character string (max allowed)' },
      { input: 'a'.repeat(1000), description: '1000 character string (should be truncated)' }
    ],
    malicious: [
      { input: '<script>alert("xss")</script>', description: 'XSS attempt' },
      { input: 'javascript:alert("test")', description: 'JavaScript protocol' },
      { input: '../../etc/passwd', description: 'Path traversal attempt' },
      { input: 'DROP TABLE users;', description: 'SQL injection attempt' }
    ]
  },

  // Context menu test scenarios
  contextMenuScenarios: [
    {
      name: 'Basic book title search',
      selectionText: 'The Catcher in the Rye',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=The%20Catcher%20in%20the%20Rye'
    },
    {
      name: 'Author name search',
      selectionText: 'J.D. Salinger',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=J.D.%20Salinger'
    },
    {
      name: 'ISBN-10 search',
      selectionText: '0-316-76948-7',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=0316769487'
    },
    {
      name: 'ISBN-13 search',
      selectionText: '978-0-316-76948-0',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780316769480'
    },
    {
      name: 'Complex search with special characters',
      selectionText: 'Science Fiction: "Foundation" Series',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Science%20Fiction%3A%20%22Foundation%22%20Series'
    }
  ],

  // Error scenarios
  errorScenarios: [
    {
      name: 'Empty selection',
      selectionText: '',
      shouldCreateTab: false
    },
    {
      name: 'Whitespace only selection',
      selectionText: '   ',
      shouldCreateTab: false
    },
    {
      name: 'Wrong menu item ID',
      menuItemId: 'wrongId',
      selectionText: 'Valid text',
      shouldCreateTab: false
    }
  ],

  // Popup test scenarios
  popupScenarios: [
    {
      name: 'Manual search input',
      inputText: 'Canadian Literature',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Canadian%20Literature'
    },
    {
      name: 'Selected text search',
      selectedText: 'Alice Munro',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=Alice%20Munro'
    },
    {
      name: 'ISBN search from popup',
      inputText: '978-0-7710-3386-2',
      expectedURL: 'https://www.torontopubliclibrary.ca/search.jsp?Ntt=9780771033862'
    }
  ]
};

// Helper functions for tests
export const testHelpers = {
  // Generate random ISBN-like strings for stress testing
  generateRandomISBN: (type = 'isbn13') => {
    if (type === 'isbn10') {
      const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
      const checkDigit = Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 'X';
      return digits + checkDigit;
    } else {
      const prefix = Math.random() > 0.5 ? '978' : '979';
      const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
      return prefix + digits;
    }
  },

  // Generate text of specific length
  generateTextOfLength: (length, char = 'a') => {
    return char.repeat(length);
  },

  // Create mock Chrome tab object
  createMockTab: (id = 1, url = 'https://example.com', active = true) => ({
    id,
    url,
    active,
    title: 'Test Page',
    windowId: 1
  }),

  // Create mock selection info for context menu
  createMockSelectionInfo: (text, menuItemId = 'searchTPL') => ({
    menuItemId,
    selectionText: text,
    editable: false,
    pageUrl: 'https://example.com'
  }),

  // Validate URL structure
  isValidTPLURL: (url) => {
    const pattern = /^https:\/\/www\.torontopubliclibrary\.ca\/search\.jsp\?Ntt=.+$/;
    return pattern.test(url);
  },

  // Extract search term from TPL URL
  extractSearchTermFromURL: (url) => {
    const match = url.match(/Ntt=(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }
};

export default testData;