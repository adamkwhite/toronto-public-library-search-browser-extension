// Popup script for TPL Search extension
// Handles popup UI interactions and manual searches

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const selectedTextButton = document.getElementById('selectedTextButton');
  const messageArea = document.getElementById('messageArea');
  
  // Check for selected text when popup opens
  checkSelectedText();
  
  // Event listeners
  searchButton.addEventListener('click', handleManualSearch);
  selectedTextButton.addEventListener('click', handleSelectedTextSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  });
  
  searchInput.addEventListener('input', clearMessages);
  
  /**
   * Check if there's selected text on the current page
   */
  function checkSelectedText() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, function(response) {
          if (chrome.runtime.lastError) {
            // Content script might not be loaded yet, ignore error
            return;
          }
          
          if (response && response.success) {
            selectedTextButton.disabled = false;
            selectedTextButton.textContent = `Search: "${truncateText(response.text, 20)}"`;
            
            if (response.isbn && response.isbn.isISBN) {
              showMessage(`Detected ${response.isbn.type}: ${response.isbn.cleaned}`, 'info');
            }
            
            if (response.warning) {
              showMessage(response.warning, 'warning');
            }
          }
        });
      }
    });
  }
  
  /**
   * Handle manual search from input field
   */
  function handleManualSearch() {
    const searchText = searchInput.value.trim();
    
    if (!searchText) {
      showMessage('Please enter search text', 'error');
      return;
    }
    
    performSearch(searchText);
  }
  
  /**
   * Handle search using selected text
   */
  function handleSelectedTextSearch() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, function(response) {
          if (response && response.success) {
            performSearch(response.text);
          } else {
            showMessage('No text selected or error getting selection', 'error');
          }
        });
      }
    });
  }
  
  /**
   * Perform search with validation and error handling
   * @param {string} searchText - Text to search for
   */
  function performSearch(searchText) {
    if (!searchText || searchText.trim().length === 0) {
      showMessage('Search text cannot be empty', 'error');
      return;
    }
    
    try {
      // Validate and process the search text
      const processed = processSearchText(searchText);
      const encodedText = encodeURIComponent(processed);
      const tplUrl = `https://www.torontopubliclibrary.ca/search.jsp?Ntt=${encodedText}`;
      
      // Open TPL search in new tab
      chrome.tabs.create({
        url: tplUrl,
        active: true
      });
      
      // Close popup after successful search
      window.close();
      
    } catch (error) {
      showMessage(`Search error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Process and validate search text
   * @param {string} text - The search text
   * @returns {string} - Processed text ready for search
   */
  function processSearchText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid search text');
    }
    
    // Remove excessive whitespace and normalize
    let processed = text.replace(/\s+/g, ' ').trim();
    
    if (processed.length === 0) {
      throw new Error('Search text is empty after processing');
    }
    
    // Check if it looks like an ISBN
    if (isISBN(processed)) {
      // Clean ISBN: remove hyphens, spaces, and non-digits except X
      processed = processed.replace(/[^0-9X]/gi, '');
      return processed;
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
  
  /**
   * Show message to user
   * @param {string} message - Message to display
   * @param {string} type - Message type (info, error, warning)
   */
  function showMessage(message, type = 'info') {
    messageArea.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
  }
  
  /**
   * Clear messages
   */
  function clearMessages() {
    messageArea.innerHTML = '';
  }
  
  /**
   * Truncate text for display
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export functions for testing
  if (typeof global !== 'undefined') {
    global.processSearchText = processSearchText;
    global.truncateText = truncateText;
    global.escapeHtml = escapeHtml;
  }
});