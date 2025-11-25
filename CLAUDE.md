# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name**: Toronto Public Library (TPL) Browser Extension
**Type**: Chrome/Edge browser extension
**Purpose**: Quick search for books at Toronto Public Library by title, author, or ISBN
**Status**: Production-ready, actively maintained
**Current Branch**: main

## Tech Stack

- **Core**: Vanilla JavaScript (ES6+)
- **APIs**: Chrome Extension APIs (Manifest V3)
- **Test Framework**: Jest with comprehensive unit and integration tests
- **Build Tools**: npm for package management
- **Linting**: ESLint with custom configuration
- **CI/CD**: GitHub Actions (Dependabot auto-merge for patch/minor updates)
- **Version Control**: Git with feature branch workflow

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

## Architecture

### File Structure
```
toronto-public-library-search-browser-extension/
├── .github/workflows/        # GitHub Actions workflows
│   └── dependabot-auto-merge.yml  # Auto-merges patch/minor Dependabot PRs
├── icons/                    # Extension icons (16x16 to 128x128)
├── tests/                    # Jest unit and integration tests
├── coverage/                 # Test coverage reports
├── manifest.json             # Extension configuration (Manifest V3)
├── background.js             # Service worker for context menu
├── content.js                # Content script for page interaction
├── popup.html/popup.js       # Extension popup interface
├── debug-isbn.js             # ISBN validation debugging utility
├── .eslintrc.js              # ESLint configuration
├── jest.config.js            # Jest test configuration
└── CLAUDE.md                 # This file
```

### Key Components
- **Context Menu**: Right-click "Search on TPL" functionality
- **Popup Interface**: Manual search via extension icon
- **ISBN Detection**: Auto-formats ISBN-10/ISBN-13 numbers
- **Input Validation**: XSS protection and special character handling

## Recent Changes (Nov 2024)

### Dependabot Auto-Merge Workflow (Nov 24, 2025)
- Added GitHub Actions workflow for automatic Dependabot PR merging
- Auto-merges patch and minor version updates only
- Major updates require manual review
- Uses squash merge strategy for clean commit history
- Successfully processed 10 pending Dependabot PRs

### Dependencies Updated
- glob: 10.4.5 → 10.5.0
- baseline-browser-mapping: 2.8.29 → 2.8.31
- @eslint-community/regexpp: 4.12.1 → 4.12.2
- @eslint/config-array: 0.21.0 → 0.21.1
- @humanfs/node: 0.16.6 → 0.16.7
- @eslint/config-helpers: 0.4.0 → 0.4.2
- ci-info: 4.2.0 → 4.3.1
- caniuse-lite: 1.0.30001756 → 1.0.30001757
- @eslint/object-schema: 2.1.6 → 2.1.7
- debug: 4.4.1 → 4.4.3

## Next Steps

- Consider publishing to Chrome Web Store
- Monitor Dependabot PRs (auto-merge is now active)
- Evaluate Firefox Add-ons compatibility
- Consider adding visual regression tests

## Dependencies

### External Services
- Toronto Public Library catalog search API (via URL construction)

### Development Dependencies
- Jest (testing framework)
- ESLint (linting)
- Various ESLint plugins and configs

## Known Issues

- Auto-merge workflow requires GitHub Pro for private repos with branch protection
  - Currently works on rebased PRs as a workaround
  - Consider making repo public to enable full branch protection features

## Important Notes

- Focus on cross-browser compatibility (Chrome and Edge primary, Firefox potential)
- Extension uses Manifest V3 (required for modern Chrome extensions)
- Maintain comprehensive test coverage for all features
- Follow browser extension security best practices
- No build process required - vanilla JavaScript loads directly
- All user data processing happens locally (no tracking/analytics)
- Test extension functionality in actual browser environment
