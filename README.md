# Toronto Public Library (TPLD) Browser Extension

A Chrome/Edge browser extension that allows users to quickly search the Toronto Public Library (TPL) for highlighted text, book titles, authors, or ISBN numbers.

## Features

- **Context Menu Search**: Right-click on selected text and choose "Search on TPL"
- **ISBN Detection**: Automatically detects and formats ISBN-10 and ISBN-13 numbers
- **Input Validation**: Handles special characters and validates search inputs
- **Manual Search**: Use the popup interface for manual searches
- **Error Handling**: Comprehensive error checking and user feedback

## Installation

### For Development/Testing

1. Clone or download this repository
2. Open Chrome/Edge and go to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your extensions list

### From Chrome Web Store (Future)

*This extension will be available on the Chrome Web Store once published.*

## Usage

### Method 1: Context Menu (Recommended)

1. Highlight any text on a webpage (book title, author name, ISBN, etc.)
2. Right-click on the highlighted text
3. Select "Search on TPL" from the context menu
4. A new tab will open with TPL search results

### Method 2: Extension Popup

1. Click the TPL Search extension icon in your browser toolbar
2. Enter your search terms in the text field
3. Click "Search TPL" button
4. A new tab will open with TPL search results

### Method 3: Selected Text via Popup

1. Highlight text on any webpage
2. Click the TPL Search extension icon
3. Click "Search Selected Text" button (automatically populated)
4. A new tab will open with TPL search results

## Supported Search Types

- **Book Titles**: "The Great Gatsby", "To Kill a Mockingbird"
- **Author Names**: "Margaret Atwood", "Stephen King"
- **ISBN Numbers**: 
  - ISBN-10: 0123456789, 0-123-45678-9
  - ISBN-13: 9780123456786, 978-0-123-45678-6
- **General Search Terms**: Any text with special characters

## Technical Details

### Input Processing

- Automatically detects ISBN format and cleans input (removes hyphens, spaces)
- Validates ISBN patterns (9-13 digits, ISBN-10/ISBN-13 format)
- URL encodes all search terms to handle special characters
- Limits search queries to 200 characters for performance
- Handles edge cases like empty selections and invalid input

### Error Handling

- Validates all user input before processing
- Provides user feedback for invalid searches
- Handles network and extension errors gracefully
- Prevents XSS attacks through proper input sanitization

### Files Structure

```
tpl-search-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for context menu
├── content.js            # Content script for page interaction
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons (16x16 to 128x128)
└── README.md             # This file
```

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Microsoft Edge**: Version 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with recent versions

## Permissions

This extension requires the following permissions:

- `contextMenus`: To add "Search on TPL" to the right-click menu
- `activeTab`: To access selected text on the current page

## Privacy

- No user data is collected or stored
- Search queries are sent directly to TPL's website
- No tracking or analytics are implemented
- All processing happens locally in the browser

## Development

### Building the Extension

No build process is required. The extension uses vanilla JavaScript and can be loaded directly into the browser.

### Testing

1. Load the extension in developer mode
2. Test on various websites with different text selections
3. Verify ISBN detection with various ISBN formats
4. Test error handling with edge cases

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper error handling
4. Test thoroughly across different browsers
5. Submit a pull request

## Troubleshooting

### Extension Not Working

1. Ensure the extension is enabled in `chrome://extensions/`
2. Refresh the webpage and try again
3. Check browser console for error messages

### Context Menu Not Appearing

1. Make sure text is properly selected
2. Try refreshing the page
3. Disable and re-enable the extension

### Search Not Opening

1. Check if popup blockers are preventing new tabs
2. Verify internet connection
3. Try manual search through the popup

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue on the project repository.
