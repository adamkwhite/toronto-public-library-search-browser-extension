// Background script for TPL Search extension
// Handles context menu creation and click events

// Create context menu when extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "searchTPL",
    title: "Search on TPL",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchTPL" && info.selectionText) {
    const searchText = info.selectionText.trim();
    
    if (searchText) {
      const processedText = processSearchText(searchText);
      const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
      
      // Open TPL search in new tab
      chrome.tabs.create({
        url: tplUrl,
        active: true
      });
    }
  }
});

/**
 * Process and validate search text
 * @param {string} text - The selected text
 * @returns {string} - Processed text ready for search
 */
function processSearchText(text) {
  // Remove excessive whitespace and normalize
  let processed = text.replace(/\s+/g, ' ').trim();
  
  // Check if it looks like an ISBN
  if (isISBN(processed)) {
    // Clean ISBN: remove hyphens, spaces, and non-digits except X
    processed = processed.replace(/[^0-9X]/gi, '');
    return processed;
  }
  
  // For regular text searches, ensure it's not empty after cleaning
  if (!processed || processed.length === 0) {
    console.warn('TPL Search: Empty search text after processing');
    return text.trim(); // Fall back to original text
  }
  
  // Limit length to reasonable search query size
  if (processed.length > 200) {
    processed = processed.substring(0, 200).trim();
  }
  
  return processed;
}

/**
 * Check if text appears to be an ISBN
 * @param {string} text - The text to check
 * @returns {boolean} - True if it looks like an ISBN
 */
function isISBN(text) {
  // Remove all non-alphanumeric characters for checking
  const cleaned = text.replace(/[^0-9X]/gi, '');
  
  // Check for 9, 10, or 13 digit patterns
  return /^[0-9]{9}[0-9X]?$/i.test(cleaned) || // 9-10 digits (ISBN-10)
         /^97[89][0-9]{10}$/i.test(cleaned);     // 13 digits starting with 978 or 979 (ISBN-13)
}

// Listen for messages from content script (if needed for future features)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'searchTPL') {
    const processedText = processSearchText(message.text);
    const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodeURIComponent(processedText)}`;
    
    chrome.tabs.create({
      url: tplUrl,
      active: true
    });
    
    sendResponse({ success: true });
  }
});