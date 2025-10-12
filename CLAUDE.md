# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Type**: Browser extension for library catalog search
**Purpose**: Enhances library website functionality for searching catalogs
**Status**: Active development

## Tech Stack

- **Core**: JavaScript
- **APIs**: Chrome Extension APIs
- **Test Framework**: Jest with extensive unit and integration tests
- **Build Tools**: npm for package management

## Key Features

- Enhanced library catalog search functionality
- Browser extension integration
- Improved user experience for library searches
- Cross-browser compatibility support

## Development Setup

```bash
# Navigate to project
cd tpl-search-extension

# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run coverage
```

## Development Commands

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Generate coverage report
npm run coverage

# Build extension (if applicable)
npm run build

# Lint code (if configured)
npm run lint
```

## Testing

- **Framework**: Jest for unit and integration testing
- **Coverage**: Comprehensive test coverage reporting available
- **Strategy**: Both unit and integration tests included
- **Best Practice**: Test in both Chrome and Firefox when possible for extension compatibility

## Deployment

- Load unpacked extension in Chrome/Firefox developer mode for testing
- Follow browser-specific extension publishing guidelines for production
- Chrome Web Store for Chrome distribution
- Firefox Add-ons for Firefox distribution

## Important Notes

- Focus on cross-browser compatibility (Chrome and Firefox)
- Extension APIs may vary between browsers - check compatibility
- Maintain comprehensive test coverage for all features
- Follow browser extension security best practices
- Consider manifest v3 requirements for modern Chrome extensions
- Test extension functionality in actual browser environment, not just unit tests
