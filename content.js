// Content script for TPL Search extension
// Handles text selection and provides additional functionality

(function() {
  'use strict';
  
  // Track selected text for potential future features
  let lastSelectedText = '';
  
  // Listen for text selection changes
  document.addEventListener('selectionchange', handleSelectionChange);
  
  /**
   * Handle text selection changes
   */
  function handleSelectionChange() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText !== lastSelectedText) {
      lastSelectedText = selectedText;
      // Could be used for future features like hover tooltips
    }
  }
  
  /**
   * Validate and clean selected text
   * @param {string} text - The selected text
   * @returns {Object} - Validation result with cleaned text
   */
  function validateSearchText(text) {
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
    
    // Check for potentially problematic characters
    const hasProblematicChars = /[<>\"'&]/.test(trimmed);
    if (hasProblematicChars) {
      // These will be URL encoded, so they're okay
      return { 
        valid: true, 
        text: trimmed,
        info: 'Special characters will be encoded for search'
      };
    }
    
    return { valid: true, text: trimmed };
  }
  
  /**
   * Detect if text appears to be an ISBN
   * @param {string} text - The text to check
   * @returns {Object} - Detection result
   */
  function detectISBN(text) {
    // Remove all non-alphanumeric characters for checking
    const cleaned = text.replace(/[^0-9X]/gi, '');
    
    // Check for various ISBN patterns
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
  }
  
  // Expose functions for potential future popup or options page
  window.tplSearchExtension = {
    validateSearchText,
    detectISBN,
    getLastSelectedText: () => lastSelectedText
  };
  
  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'getSelectedText':
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        const validation = validateSearchText(selectedText);
        
        if (validation.valid) {
          const isbnInfo = detectISBN(validation.text);
          sendResponse({
            success: true,
            text: validation.text,
            isbn: isbnInfo,
            warning: validation.warning,
            info: validation.info
          });
        } else {
          sendResponse({
            success: false,
            error: validation.error
          });
        }
        break;
        
      case 'searchText':
        if (message.text) {
          // Send search request to background script
          chrome.runtime.sendMessage({
            action: 'searchTPL',
            text: message.text
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No text provided' });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  });

  // Export functions for testing
  if (typeof global !== 'undefined') {
    global.validateSearchText = validateSearchText;
    global.detectISBN = detectISBN;
  }
  
})();