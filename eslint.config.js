// ESLint flat config (ESLint 9+). Replaces .eslintrc.js, which ESLint 10 no longer reads.
// Formatting rules (indent/quotes/semi/brace-style) were dropped: they are deprecated in core.
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/", "coverage/", "dist/", "build/", "**/*.min.js"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: { ...globals.browser, ...globals.webextensions, ...globals.node },
    },
    rules: {
      "no-console": "warn",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      eqeqeq: ["error", "always"],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "no-unused-expressions": "error",
      "no-throw-literal": "error",
      "no-promise-executor-return": "error",
      "prefer-promise-reject-errors": "error",
    },
  },
  {
    files: ["tests/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        // Installed on `global` by tests/setup*.js and by the source scripts' test exports.
        setupChromeApiMocks: "readonly",
        createMockSelection: "readonly",
        triggerChromeEvent: "readonly",
        createMockTabs: "readonly",
        createMockMessage: "readonly",
        processSearchText: "readonly",
        isISBN: "readonly",
        validateSearchText: "readonly",
        detectISBN: "readonly",
      },
    },
    rules: { "no-console": "off", "no-unused-expressions": "off" },
  },
  {
    files: ["*.config.js", "debug-isbn.js"],
    rules: { "no-console": "off" },
  },
];
