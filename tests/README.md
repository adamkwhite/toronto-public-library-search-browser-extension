# TPL Search Extension - Tests

Jest (jsdom) with [sinon-chrome](https://github.com/acvetkov/sinon-chrome) standing in for the
Chrome extension APIs.

## Rule: test the shipped files

Every test loads the real `background.js`, `content.js` or `popup.js` and drives it through its
Chrome listeners or DOM events. Do not copy a function into a test file. Copies drift from the
shipped code and report coverage of nothing (this suite once sat at 87 passing tests and 0%
coverage that way).

## Layout

```
tests/
├── setup.js                       # global sinon-chrome + window mocks (every test file)
├── setup-hybrid.js                # setupChromeApiMocks() and other helpers
└── unit/
    ├── background-simple.test.js  # processSearchText / isISBN
    ├── background-chrome.test.js  # onInstalled, context-menu clicks, runtime messages
    ├── content.test.js            # validation, ISBN detection, selection, messages
    └── popup-fixed.test.js        # real popup.html markup + popup.js
```

## Patterns

- **Listeners:** `setup.js` calls `chrome.flush()` before each test, which also drops listeners,
  so load the script inside `beforeEach` with `jest.isolateModules(() => require("../../x.js"))`
  and fire events with `chrome.runtime.onMessage.trigger(...)` and similar.
- **Helpers:** each source file puts its helpers on `global` when loaded under test.
- **Popup:** `popup.js` does its work in a `DOMContentLoaded` handler. The popup test captures that
  handler and calls it directly, so handlers from earlier tests don't accumulate on the shared document.

## Commands

```bash
npm test                 # run everything
npm run test:coverage    # enforces the 80% global threshold in jest.config.js
npm run lint             # ESLint flat config, eslint.config.js
npm test -- content      # one file
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint` and `npm run test:coverage`.
