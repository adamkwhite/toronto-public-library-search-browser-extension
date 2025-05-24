// Debug the failing ISBN test cases

function detectISBN(text) {
  if (!text || typeof text !== 'string') {
    return { isISBN: false };
  }
  const cleaned = text.replace(/[^0-9X]/gi, '').toUpperCase();
  
  // Check for exact ISBN-10 format
  if (/^[0-9]{9}[0-9X]$/i.test(cleaned) && cleaned.length === 10) {
    if (cleaned.includes('X') && !cleaned.endsWith('X')) {
      return { isISBN: false };
    }
    return { isISBN: true, type: 'ISBN-10', cleaned };
  }
  
  // Check for exact ISBN-13 format
  if (/^97[89][0-9]{10}$/i.test(cleaned) && cleaned.length === 13) {
    return { isISBN: true, type: 'ISBN-13', cleaned };
  }
  
  // Check for possible ISBN (9 digits exactly)
  if (/^[0-9]{9}$/i.test(cleaned) && cleaned.length === 9) {
    return { isISBN: true, type: 'Possible ISBN', cleaned };
  }
  
  // Check for possible ISBN (11-12 digits, but not starting with invalid ISBN-13 prefixes)
  if (/^[0-9]{11,12}$/i.test(cleaned) && cleaned.length >= 11 && cleaned.length <= 12) {
    // Reject if it looks like a malformed ISBN-13 (starts with 978 but wrong length)
    if (cleaned.startsWith('978') && cleaned.length !== 13) {
      return { isISBN: false };
    }
    return { isISBN: true, type: 'Possible ISBN', cleaned };
  }
  
  return { isISBN: false };
}

const testCases = [
  '12345678',
  '012345678901', 
  '9770123456786',
  'abcdefghij',
  '978X123456786',
  'X123456789',
  '01234X6789',
  '978012345678901'
];

console.log('Testing malformed ISBN cases:');
testCases.forEach(test => {
  const result = detectISBN(test);
  console.log(`${test}: ${result.isISBN} (${result.type || 'invalid'})`);
});